export type CompileKind = 'rpgle' | 'sqlrpgle' | 'clle';

export type CompilerMessage = {
  severity?: string;
  code?: string;
  line?: number;
  text: string;
};

export type CompileResult = {
  success: boolean;
  compiler: string;
  messages: CompilerMessage[];
  listing: string;
  elapsedMs: number;
  truncated: boolean;
};

const kinds: CompileKind[] = ['rpgle', 'sqlrpgle', 'clle'];

export function agentOrigin(value: string): string {
  const url = new URL(value.trim());
  const safeHost = /^[a-z0-9.-]+$|^\[[a-f0-9:]+\]$/.test(url.hostname);
  if (
    url.protocol !== 'https:' ||
    !safeHost ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error('Enter the HTTPS base URL of your IBM i compile service.');
  }
  return url.origin;
}

export function readyKinds(data: unknown): CompileKind[] | null {
  if (!data || typeof data !== 'object') return null;
  const message = data as {
    type?: unknown;
    capabilities?: { kinds?: unknown };
  };
  if (
    message.type !== 'learn-ibmi:ready' ||
    !Array.isArray(message.capabilities?.kinds)
  )
    return null;
  const supported = message.capabilities.kinds.filter(
    (kind): kind is CompileKind => kinds.includes(kind),
  );
  return supported.length ? supported : null;
}

export function compileResult(
  data: unknown,
  requestId: string,
): CompileResult | null {
  if (!data || typeof data !== 'object') return null;
  const message = data as Record<string, unknown>;
  if (
    message.type !== 'learn-ibmi:result' ||
    message.requestId !== requestId ||
    typeof message.success !== 'boolean' ||
    typeof message.compiler !== 'string' ||
    !Array.isArray(message.messages) ||
    typeof message.listing !== 'string' ||
    typeof message.elapsedMs !== 'number' ||
    typeof message.truncated !== 'boolean'
  )
    return null;
  const messages: CompilerMessage[] = [];
  for (const item of message.messages) {
    if (typeof item === 'string') messages.push({ text: item });
    else if (
      item &&
      typeof item === 'object' &&
      typeof item.text === 'string'
    ) {
      messages.push({
        text: item.text,
        severity: typeof item.severity === 'string' ? item.severity : undefined,
        code: typeof item.code === 'string' ? item.code : undefined,
        line: typeof item.line === 'number' ? item.line : undefined,
      });
    }
  }
  return {
    success: message.success,
    compiler: message.compiler,
    messages,
    listing: message.listing,
    elapsedMs: message.elapsedMs,
    truncated: message.truncated,
  };
}
