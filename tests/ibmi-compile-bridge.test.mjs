import assert from 'node:assert/strict';
import test from 'node:test';
import {
  agentOrigin,
  compileResult,
  readyKinds,
} from '../app/ibmi-compile-bridge.ts';

test('accepts only an HTTPS service origin without credentials or URL payloads', () => {
  assert.equal(
    agentOrigin(' https://ibmi.example.com:8443/ '),
    'https://ibmi.example.com:8443',
  );
  for (const address of [
    'http://ibmi.example.com',
    'https://user:secret@ibmi.example.com',
    'https://ibmi.example.com/connect',
    'https://ibmi.example.com/?token=secret',
    'https://ibmi".example.com',
    'ibmi.example.com',
  ]) {
    assert.throws(() => agentOrigin(address));
  }
});

test('requires protocol message type, capability shape and matching request ID', () => {
  assert.deepEqual(
    readyKinds({
      type: 'learn-ibmi:ready',
      capabilities: { kinds: ['rpgle', 'unknown'] },
    }),
    ['rpgle'],
  );
  assert.equal(
    readyKinds({
      type: 'learn-ibmi:result',
      capabilities: { kinds: ['rpgle'] },
    }),
    null,
  );
  const result = {
    type: 'learn-ibmi:result',
    requestId: 'request-1',
    success: false,
    compiler: 'CRTRPGMOD',
    messages: [
      {
        severity: 'error',
        code: 'RNF7030',
        line: 12,
        text: 'Name not defined',
      },
    ],
    listing: 'Compiler listing',
    elapsedMs: 103,
    truncated: false,
  };
  assert.equal(compileResult(result, 'request-2'), null);
  assert.equal(
    compileResult({ ...result, type: 'learn-ibmi:ready' }, 'request-1'),
    null,
  );
  assert.deepEqual(compileResult(result, 'request-1'), {
    success: false,
    compiler: 'CRTRPGMOD',
    messages: [
      {
        severity: 'error',
        code: 'RNF7030',
        line: 12,
        text: 'Name not defined',
      },
    ],
    listing: 'Compiler listing',
    elapsedMs: 103,
    truncated: false,
  });
});
