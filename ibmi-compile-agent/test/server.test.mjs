import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtemp, readFile, readdir, rm, stat, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createAgentHandler, compileCommand, configFromEnv, quoteCl, systemRunner } from '../server.mjs';

const token = 'this-is-a-long-random-looking-test-token';
const origin = 'https://learn-as400.netlify.app';

function config(workDir) {
  return {
    siteOrigin: origin,
    tokenHash: createHash('sha256').update(token).digest('hex'),
    expiresAt: Date.now() + 60_000,
    scratchLibrary: 'LABCOMP',
    workDir,
    systemBin: '/never-used',
  };
}

async function withServer(handler, callback) {
  const server = createServer(handler);
  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  try { return await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolveClose) => server.close(resolveClose)); }
}

function post(base, source, kind = 'rpgle') {
  return fetch(`${base}/v1/compile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, source }),
  });
}

test('configuration validates origin, token expiry, and scratch library', () => {
  const env = {
    SITE_ORIGIN: origin,
    AGENT_TOKEN_HASH: createHash('sha256').update(token).digest('hex'),
    AGENT_TOKEN_EXPIRES_AT: new Date(Date.now() + 60_000).toISOString(),
    SCRATCH_LIBRARY: 'LABCOMP', TLS_KEY_PATH: '/tmp/key', TLS_CERT_PATH: '/tmp/cert',
  };
  assert.equal(configFromEnv(env).host, '127.0.0.1');
  assert.equal(configFromEnv({ ...env, ALLOW_INCLUDES: 'true' }).allowIncludes, true);
  assert.throws(() => configFromEnv({ ...env, SCRATCH_LIBRARY: 'QSYS' }), /SCRATCH_LIBRARY/);
  assert.throws(() => configFromEnv({ ...env, SCRATCH_LIBRARY: 'LAB);DLTLIB' }), /SCRATCH_LIBRARY/);
  assert.throws(() => configFromEnv({ ...env, SITE_ORIGIN: 'http://example.com' }), /SITE_ORIGIN/);
  assert.throws(() => configFromEnv({ ...env, SITE_ORIGIN: 'https://exa"mple.com' }), /SITE_ORIGIN/);
  assert.throws(() => configFromEnv({ ...env, AGENT_TOKEN_EXPIRES_AT: 'tomorrow' }), /AGENT_TOKEN_EXPIRES_AT/);
  assert.throws(() => configFromEnv({ ...env, AGENT_TOKEN_EXPIRES_AT: new Date(Date.now() - 60_000).toISOString() }), /already past/);
  assert.equal(quoteCl("/tmp/it's source.rpgle"), "'/tmp/it''s source.rpgle'");
  assert.match(compileCommand('sqlrpgle', 'LABCOMP', 'L123456789', '/tmp/a'), /OBJTYPE\(\*MODULE\)/);
});

test('iframe is restricted to configured site; auth and expiry gate capabilities', async () => {
  const workDir = await mkdtemp(join(tmpdir(), 'agent-test-'));
  try {
    const cfg = config(workDir);
    await withServer(createAgentHandler(cfg), async (base) => {
      const root = await fetch(base, { redirect: 'manual' });
      assert.equal(root.status, 302);
      assert.equal(root.headers.get('location'), '/connect');
      const page = await fetch(`${base}/connect`);
      assert.equal(page.status, 200);
      assert.match(page.headers.get('content-security-policy'), /frame-ancestors https:\/\/learn-as400\.netlify\.app/);
      assert.match(await page.text(), /data-site-origin="https:\/\/learn-as400\.netlify\.app"/);
      assert.equal((await fetch(`${base}/v1/capabilities`)).status, 401);
      const allowed = await fetch(`${base}/v1/capabilities`, { headers: { Authorization: `Bearer ${token}` } });
      assert.deepEqual(await allowed.json(), { kinds: ['rpgle', 'sqlrpgle', 'clle'] });
      assert.equal(allowed.headers.get('access-control-allow-origin'), null);
    });
    cfg.expiresAt = Date.now() - 1;
    await withServer(createAgentHandler(cfg), async (base) => {
      assert.equal((await fetch(`${base}/v1/capabilities`, { headers: { Authorization: `Bearer ${token}` } })).status, 401);
    });
  } finally { await rm(workDir, { recursive: true, force: true }); }
});

test('compile writes private UTF-8 source, invokes fixed commands, and removes it', async () => {
  const workDir = await mkdtemp(join(tmpdir(), 'agent-test-'));
  const commands = [];
  const runner = async (command) => {
    commands.push(command);
    if (command.startsWith('CRTRPGMOD')) {
      const path = /SRCSTMF\('([^']+)'\)/.exec(command)[1];
      assert.equal(await readFile(path, 'utf8'), '**free\ndcl-s answer int(10) inz(42);');
      assert.equal((await stat(path)).mode & 0o777, 0o600);
      return { code: 0, stdout: 'Compiler listing', stderr: '', truncated: false, timedOut: false };
    }
    return { code: 0, stdout: '', stderr: '', truncated: false, timedOut: false };
  };
  try {
    await withServer(createAgentHandler(config(workDir), runner), async (base) => {
      const response = await post(base, '**free\ndcl-s answer int(10) inz(42);');
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.success, true);
      assert.equal(result.compiler, 'CRTRPGMOD');
      assert.equal(result.listing, 'Compiler listing');
    });
    assert.equal(commands.length, 4);
    assert.match(commands[0], /^CHGATR OBJ\('/);
    assert.match(commands[0], /VALUE\(1208\)$/);
    assert.match(commands[1], /^CRTRPGMOD MODULE\(LABCOMP\/L[A-Z0-9]{9}\)/);
    assert.match(commands[1], /REPLACE\(\*NO\)$/);
    assert.match(commands[2], /^CHKOBJ OBJ\(LABCOMP\/L[A-Z0-9]{9}\) OBJTYPE\(\*MODULE\)$/);
    assert.match(commands[3], /^DLTMOD MODULE\(LABCOMP\/L[A-Z0-9]{9}\)$/);
    assert.deepEqual(await readdir(workDir), []);
  } finally { await rm(workDir, { recursive: true, force: true }); }
});

test('source validation, compiler errors, and concurrent requests', async () => {
  const workDir = await mkdtemp(join(tmpdir(), 'agent-test-'));
  let releaseCompile;
  let enteredCompile;
  const entered = new Promise((resolveEntered) => { enteredCompile = resolveEntered; });
  const runner = async (command) => {
    if (command.startsWith('CRTCLMOD')) {
      enteredCompile();
      await new Promise((resolveRelease) => { releaseCompile = resolveRelease; });
      return { code: 255, stdout: 'CPF0821: Module not created', stderr: 'CPF0821: Module not created', truncated: false, timedOut: false };
    }
    return { code: 0, stdout: '', stderr: '', truncated: false, timedOut: false };
  };
  try {
    await withServer(createAgentHandler(config(workDir), runner), async (base) => {
      assert.equal((await post(base, '/COPY /private/notes', 'rpgle')).status, 422);
      assert.equal((await post(base, 'EXEC SQL INCLUDE SECRETS;', 'sqlrpgle')).status, 422);
      assert.equal((await post(base, 'INCLUDE SRCSTMF(\'/private/notes\')', 'clle')).status, 422);
      assert.equal((await post(base, 'x'.repeat(101), 'sqlrpgle')).status, 200);
      assert.equal((await post(base, '\n'.repeat(70_000), 'rpgle')).status, 200);
      assert.equal((await post(base, 'x'.repeat(128 * 1024 + 1))).status, 422);
      const first = post(base, 'PGM\nENDPGM', 'clle');
      await entered;
      assert.equal((await post(base, 'PGM\nENDPGM', 'clle')).status, 429);
      releaseCompile();
      const result = await (await first).json();
      assert.equal(result.success, false);
      assert.match(result.messages.join(' '), /CPF0821/);
      assert.deepEqual(await readdir(workDir), []);
    });
  } finally { await rm(workDir, { recursive: true, force: true }); }
});

test('system runner truncates large output without invoking a shell', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'agent-test-'));
  const utility = join(dir, 'mock-system');
  try {
    await writeFile(utility, '#!/usr/bin/env node\nprocess.stdout.write("X".repeat(600000)); process.stderr.write("CPF0001: example\\n");\n');
    await chmod(utility, 0o700);
    const result = await systemRunner(utility)('CRTRPGMOD MODULE(LABCOMP/L123456789)', 5000);
    assert.equal(result.code, 0);
    assert.equal(result.truncated, true);
    assert.equal(Buffer.byteLength(result.stdout), 512 * 1024);
    assert.match(result.stderr, /CPF0001/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
