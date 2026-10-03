import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:https';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const KINDS = ['rpgle', 'sqlrpgle', 'clle'];
const MAX_SOURCE_BYTES = 128 * 1024;
// JSON escaping can make a valid 128 KiB source several times larger on the wire.
const MAX_REQUEST_BYTES = 1024 * 1024;
const MAX_LISTING_BYTES = 512 * 1024;
const MAX_MESSAGE_BYTES = 32 * 1024;
const COMPILE_TIMEOUT_MS = 30_000;
const UTILITY_TIMEOUT_MS = 5_000;
const CONNECT_HTML = readFileSync(new URL('./connect.html', import.meta.url), 'utf8');
const CONNECT_JS = readFileSync(new URL('./connect.js', import.meta.url), 'utf8');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function quoteCl(value) {
  if ([...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) throw new Error('Unsafe source path');
  return `'${value.replaceAll("'", "''")}'`;
}

export function compileCommand(kind, library, object, sourcePath) {
  const target = `${library}/${object}`;
  const source = quoteCl(sourcePath);
  switch (kind) {
    case 'rpgle': return `CRTRPGMOD MODULE(${target}) SRCSTMF(${source}) OUTPUT(*PRINT) DBGVIEW(*NONE) REPLACE(*NO)`;
    case 'sqlrpgle': return `CRTSQLRPGI OBJ(${target}) SRCSTMF(${source}) OBJTYPE(*MODULE) OUTPUT(*PRINT) REPLACE(*NO)`;
    case 'clle': return `CRTCLMOD MODULE(${target}) SRCSTMF(${source}) OUTPUT(*PRINT) REPLACE(*NO)`;
    default: throw new Error('Unsupported compiler');
  }
}

export function configFromEnv(env = process.env) {
  if (!env.SITE_ORIGIN) throw new Error('SITE_ORIGIN is required');
  const url = new URL(env.SITE_ORIGIN);
  const safeHost = /^[a-z0-9.-]+$|^\[[a-f0-9:]+\]$/.test(url.hostname);
  if (url.protocol !== 'https:' || url.origin !== env.SITE_ORIGIN || !safeHost || url.username || url.password) {
    throw new Error('SITE_ORIGIN must be an exact HTTPS origin, without a path or trailing slash');
  }
  if (!/^[a-f0-9]{64}$/.test(env.AGENT_TOKEN_HASH || '')) throw new Error('AGENT_TOKEN_HASH must be a lowercase SHA-256 hex digest');
  const expiresAt = Date.parse(env.AGENT_TOKEN_EXPIRES_AT || '');
  if (!Number.isFinite(expiresAt) || !/Z$|[+-]\d{2}:\d{2}$/.test(env.AGENT_TOKEN_EXPIRES_AT || '')) {
    throw new Error('AGENT_TOKEN_EXPIRES_AT must be an ISO timestamp with a timezone');
  }
  if (expiresAt <= Date.now()) throw new Error('AGENT_TOKEN_EXPIRES_AT is already past; issue a fresh token');
  if (!/^[A-Z][A-Z0-9_@$#]{0,9}$/.test(env.SCRATCH_LIBRARY || '') || /^(QSYS|QGPL|QTEMP)$/i.test(env.SCRATCH_LIBRARY)) {
    throw new Error('SCRATCH_LIBRARY must name a dedicated IBM i library using a valid 1–10 character object name');
  }
  if (!env.TLS_KEY_PATH || !env.TLS_CERT_PATH) throw new Error('TLS_KEY_PATH and TLS_CERT_PATH are required');
  const port = Number(env.PORT || 8443);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
  return {
    siteOrigin: url.origin,
    tokenHash: env.AGENT_TOKEN_HASH,
    expiresAt,
    scratchLibrary: env.SCRATCH_LIBRARY,
    tlsKeyPath: env.TLS_KEY_PATH,
    tlsCertPath: env.TLS_CERT_PATH,
    host: env.HOST || '127.0.0.1',
    port,
    workDir: resolve(env.WORK_DIR || tmpdir()),
    systemBin: env.SYSTEM_BIN || '/QOpenSys/usr/bin/system',
    allowIncludes: env.ALLOW_INCLUDES === 'true',
  };
}

function authenticated(request, config) {
  if (Date.now() >= config.expiresAt) return false;
  const match = /^Bearer ([A-Za-z0-9_-]{20,200})$/.exec(request.headers.authorization || '');
  if (!match) return false;
  const digest = createHash('sha256').update(match[1]).digest();
  return timingSafeEqual(digest, Buffer.from(config.tokenHash, 'hex'));
}

function responseHeaders(config, contentType) {
  return {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Strict-Transport-Security': 'max-age=2592000',
    'Content-Security-Policy': `default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors ${config.siteOrigin}`,
  };
}

function sendJson(response, config, status, data) {
  response.writeHead(status, responseHeaders(config, 'application/json; charset=utf-8'));
  response.end(JSON.stringify(data));
}

function readBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) {
        request.pause();
        rejectBody(new HttpError(413, 'Source is too large (128 KiB maximum).'));
      } else {
        chunks.push(chunk);
      }
    });
    request.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    request.on('error', rejectBody);
  });
}

function validateCompileBody(body, config) {
  if (!body || !KINDS.includes(body.kind) || typeof body.source !== 'string') {
    throw new HttpError(400, 'Choose RPGLE, SQL RPGLE, or CLLE and provide source text.');
  }
  const size = Buffer.byteLength(body.source, 'utf8');
  if (!size || size > MAX_SOURCE_BYTES || body.source.includes('\0')) {
    throw new HttpError(422, 'Source must be non-empty UTF-8 text of at most 128 KiB, without NUL bytes.');
  }
  if (!config.allowIncludes && /\/(?:COPY|INCLUDE)\b|\bEXEC\s+SQL\s+INCLUDE\b|^\s*INCLUDE\b/im.test(body.source))
    throw new HttpError(422, 'Source include directives are disabled on this service. Ask the administrator whether they can be enabled safely.');
  return body;
}

export function systemRunner(systemBin) {
  return (command, timeoutMs = COMPILE_TIMEOUT_MS) => new Promise((resolveRun, rejectRun) => {
    // The source text is never part of this command, and no shell interprets it.
    const env = { ...process.env, QIBM_USE_DESCRIPTOR_STDIO: 'Y' };
    delete env.AGENT_TOKEN_HASH;
    delete env.TLS_KEY_PATH;
    delete env.TLS_CERT_PATH;
    const child = spawn(systemBin, [command], { stdio: ['ignore', 'pipe', 'pipe'], env });
    const out = [];
    const err = [];
    let outSize = 0;
    let errSize = 0;
    let truncated = false;
    let timedOut = false;
    const collect = (chunks, chunk, size, limit) => {
      if (size >= limit) { truncated = true; return 0; }
      const part = chunk.subarray(0, limit - size);
      chunks.push(part);
      if (part.length < chunk.length) truncated = true;
      return part.length;
    };
    child.stdout.on('data', (chunk) => { outSize += collect(out, chunk, outSize, MAX_LISTING_BYTES); });
    child.stderr.on('data', (chunk) => { errSize += collect(err, chunk, errSize, MAX_MESSAGE_BYTES); });
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
    child.on('error', (error) => { clearTimeout(timer); rejectRun(error); });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolveRun({ code, stdout: Buffer.concat(out).toString('utf8'), stderr: Buffer.concat(err).toString('utf8'), truncated, timedOut });
    });
  });
}

function diagnosticMessages(output) {
  const lines = `${output.stderr}\n${output.stdout}`.split(/\r?\n/).map((line) => line.trim());
  const matches = lines.filter((line) => /\b[A-Z]{2,5}\d{4}\b|\b(error|warning|failed|not created)\b/i.test(line));
  const messages = [...new Set(matches)].slice(0, 40);
  if (output.timedOut) messages.unshift('Compile exceeded the 30-second limit. The IBM i job may need administrator cleanup.');
  if (output.code !== 0 && messages.length === 0) messages.push(`Compiler command exited with status ${output.code ?? 'unknown'}.`);
  return messages;
}

async function compile(body, config, run) {
  const began = Date.now();
  const dir = await mkdtemp(join(config.workDir, 'learn-ibmi-'));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const object = `L${Array.from({ length: 9 }, () => alphabet[randomInt(alphabet.length)]).join('')}`;
  const target = `${config.scratchLibrary}/${object}`;
  const sourcePath = join(dir, `source.${body.kind}`);
  let createdByUs = false;
  let result;
  try {
    await chmod(dir, 0o700);
    await writeFile(sourcePath, body.source, { encoding: 'utf8', mode: 0o600 });
    const tagged = await run(`CHGATR OBJ(${quoteCl(sourcePath)}) ATR(*CCSID) VALUE(1208)`, UTILITY_TIMEOUT_MS);
    if (tagged.code !== 0 || tagged.timedOut) throw new Error('Could not tag the source stream file as UTF-8 (CCSID 1208).');
    const output = await run(compileCommand(body.kind, config.scratchLibrary, object, sourcePath), COMPILE_TIMEOUT_MS);
    let success = output.code === 0 && !output.timedOut;
    const messages = diagnosticMessages(output);
    if (success) {
      const check = await run(`CHKOBJ OBJ(${target}) OBJTYPE(*MODULE)`, UTILITY_TIMEOUT_MS);
      success = check.code === 0 && !check.timedOut;
      createdByUs = success;
      if (!success) messages.push('The compiler did not create a module in the scratch library.');
    }
    result = {
      success,
      compiler: body.kind === 'sqlrpgle' ? 'CRTSQLRPGI' : body.kind === 'clle' ? 'CRTCLMOD' : 'CRTRPGMOD',
      messages,
      listing: output.stdout,
      elapsedMs: Date.now() - began,
      truncated: output.truncated,
    };
    return result;
  } finally {
    // Do not delete a pre-existing object if a random name ever collides.
    if (createdByUs) {
      let removed;
      try {
        removed = await run(`DLTMOD MODULE(${target})`, UTILITY_TIMEOUT_MS);
      } catch { /* Report cleanup failure below. */ }
      if ((!removed || removed.code !== 0 || removed.timedOut) && result)
        result.messages.push(`Scratch module ${target} could not be removed; ask the IBM i administrator to delete it.`);
    }
    try { await rm(dir, { recursive: true, force: true }); }
    catch { if (result) result.messages.push('Temporary source cleanup failed; ask the IBM i administrator to inspect the agent work directory.'); }
  }
}

export function createAgentHandler(config, run = systemRunner(config.systemBin)) {
  let activeCompiles = 0;
  return async (request, response) => {
    const pathname = new URL(request.url || '/', 'https://agent.invalid').pathname;
    try {
      if (request.method === 'GET' && pathname === '/') {
        response.writeHead(302, { ...responseHeaders(config, 'text/plain; charset=utf-8'), Location: '/connect' });
        response.end('Open /connect');
        return;
      }
      if (request.method === 'GET' && pathname === '/connect') {
        const html = CONNECT_HTML.replace('<html lang="en">', `<html lang="en" data-site-origin="${config.siteOrigin}">`);
        response.writeHead(200, responseHeaders(config, 'text/html; charset=utf-8'));
        response.end(html);
        return;
      }
      if (request.method === 'GET' && pathname === '/connect.js') {
        response.writeHead(200, responseHeaders(config, 'text/javascript; charset=utf-8'));
        response.end(CONNECT_JS);
        return;
      }
      if (pathname === '/v1/capabilities' || pathname === '/v1/compile') {
        if (!authenticated(request, config)) throw new HttpError(401, 'Compile token is invalid or expired.');
      }
      if (request.method === 'GET' && pathname === '/v1/capabilities') {
        sendJson(response, config, 200, { kinds: KINDS });
        return;
      }
      if (request.method === 'POST' && pathname === '/v1/compile') {
        if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || '')) throw new HttpError(415, 'Send JSON source.');
        if (Number(request.headers['content-length']) > MAX_REQUEST_BYTES) throw new HttpError(413, 'Source is too large (128 KiB maximum).');
        let payload;
        try { payload = JSON.parse(await readBody(request)); }
        catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'Invalid JSON body.'); }
        const body = validateCompileBody(payload, config);
        if (activeCompiles >= 1) throw new HttpError(429, 'Another compile is in progress. Try again shortly.');
        activeCompiles++;
        try {
          sendJson(response, config, 200, await compile(body, config, run));
        } finally {
          activeCompiles--;
        }
        return;
      }
      throw new HttpError(404, 'Not found.');
    } catch (error) {
      if (error instanceof HttpError && error.status === 413) {
        response.setHeader('Connection', 'close');
        request.resume();
      }
      if (!response.headersSent) sendJson(response, config, error instanceof HttpError ? error.status : 500, { error: error instanceof HttpError ? error.message : 'Compile service failed. Ask the IBM i administrator to check the service.' });
    }
  };
}

function generateToken() {
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  process.stdout.write(`Compile token (give to learner once): ${token}\nAGENT_TOKEN_HASH=${hash}\nAGENT_TOKEN_EXPIRES_AT=${expiresAt}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--generate-token') {
    generateToken();
  } else {
    try {
      const config = configFromEnv();
      const server = createServer({ key: readFileSync(config.tlsKeyPath), cert: readFileSync(config.tlsCertPath) }, createAgentHandler(config));
      server.requestTimeout = 15_000;
      server.listen(config.port, config.host, () => process.stdout.write(`IBM i compile agent listening on https://${config.host}:${config.port}\n`));
    } catch (error) {
      process.stderr.write(`Cannot start IBM i compile agent: ${error.message}\n`);
      process.exitCode = 1;
    }
  }
}
