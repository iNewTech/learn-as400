const siteOrigin = document.documentElement.dataset.siteOrigin;
const login = document.getElementById('login');
const tokenInput = document.getElementById('token');
const statusText = document.getElementById('status');
const connected = document.getElementById('connected');
const confirmation = document.getElementById('confirmation');
const confirmTitle = document.getElementById('confirm-title');
const sourcePreview = document.getElementById('source-preview');
const compileButton = document.getElementById('compile');
const cancelButton = document.getElementById('cancel');
let token = '';
let pending = null;

function reply(message) {
  if (window.parent !== window) window.parent.postMessage(message, siteOrigin);
}

function finish(result) {
  if (!pending) return;
  reply({ type: 'learn-ibmi:result', requestId: pending.requestId, ...result });
  pending = null;
  sourcePreview.textContent = '';
  confirmation.style.display = 'none';
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
    cache: 'no-store',
  });
  const data = await response.json();
  if (response.status === 401) {
    token = '';
    login.style.display = 'block';
    connected.style.display = 'none';
    statusText.textContent = 'Token invalid or expired. Enter a fresh token.';
  }
  if (!response.ok) throw new Error(data.error || `IBM i service returned ${response.status}`);
  return data;
}

login.addEventListener('submit', async (event) => {
  event.preventDefault();
  token = tokenInput.value.trim();
  tokenInput.value = '';
  statusText.textContent = 'Checking connection…';
  try {
    const capabilities = await api('/v1/capabilities');
    login.style.display = 'none';
    connected.style.display = 'block';
    statusText.textContent = 'Connected for this session. Compiler licences are checked when you compile.';
    reply({ type: 'learn-ibmi:ready', capabilities });
  } catch (error) {
    token = '';
    statusText.textContent = error instanceof Error ? error.message : 'Could not connect.';
  }
});

window.addEventListener('message', (event) => {
  if (event.origin !== siteOrigin || event.source !== window.parent) return;
  const message = event.data;
  if (!message || message.type !== 'learn-ibmi:compile' || typeof message.requestId !== 'string' || message.requestId.length > 128) return;
  if (pending) {
    reply({ type: 'learn-ibmi:result', requestId: message.requestId, success: false, compiler: '', messages: ['Finish or cancel the current compile first.'], listing: '', elapsedMs: 0, truncated: false });
    return;
  }
  if (!token) {
    reply({ type: 'learn-ibmi:result', requestId: message.requestId, success: false, compiler: '', messages: ['Connect with a valid token first.'], listing: '', elapsedMs: 0, truncated: false });
    return;
  }
  if (!['rpgle', 'sqlrpgle', 'clle'].includes(message.kind) || typeof message.source !== 'string') {
    reply({ type: 'learn-ibmi:result', requestId: message.requestId, success: false, compiler: '', messages: ['Invalid compile request.'], listing: '', elapsedMs: 0, truncated: false });
    return;
  }
  pending = message;
  confirmTitle.textContent = `Compile ${message.kind.toUpperCase()} source (${new TextEncoder().encode(message.source).length.toLocaleString()} bytes) on this IBM i?`;
  sourcePreview.textContent = message.source.slice(0, 2000) + (message.source.length > 2000 ? '\n… preview truncated' : '');
  confirmation.style.display = 'block';
  statusText.textContent = 'Waiting for your confirmation.';
});

cancelButton.addEventListener('click', () => {
  finish({ success: false, compiler: '', messages: ['Compile cancelled.'], listing: '', elapsedMs: 0, truncated: false });
  statusText.textContent = 'Compile cancelled.';
});

compileButton.addEventListener('click', async () => {
  if (!pending) return;
  const { kind, source } = pending;
  compileButton.disabled = true;
  cancelButton.disabled = true;
  statusText.textContent = 'Compiling on your IBM i…';
  try {
    const result = await api('/v1/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, source }),
    });
    finish(result);
    statusText.textContent = result.success ? 'Compile succeeded.' : 'Compiler reported problems. See the result in Code Lab.';
  } catch (error) {
    finish({ success: false, compiler: '', messages: [error instanceof Error ? error.message : 'Compile request failed.'], listing: '', elapsedMs: 0, truncated: false });
    statusText.textContent = 'Compile request failed. Check the result in Code Lab.';
  } finally {
    compileButton.disabled = false;
    cancelButton.disabled = false;
  }
});
