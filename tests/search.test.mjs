import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { matchesQuestion } from '../lib/search.ts';
const bank = JSON.parse(
  readFileSync(new URL('../content/chapters.json', import.meta.url)),
);
const results = (query, level) =>
  bank.flatMap((c) =>
    c.questions.filter((q) => matchesQuestion(c, q, query, level)),
  );
test('keyword and difficulty must match the same question', () => {
  assert.equal(results('USROPN', 'Advanced').length, 0);
  assert.equal(results('USROPN', 'Intermediate').length, 1);
  assert.equal(results('  usropn  ', 'All levels').length, 1);
});
test('empty and impossible searches produce consistent results', () => {
  assert.equal(results('', 'All levels').length, 200);
  assert.equal(results('nonexistent-keyword-zz123', 'All levels').length, 0);
  assert(results('', 'Easy').every((q) => q.level === 'Easy'));
});
