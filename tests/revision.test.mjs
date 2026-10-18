import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { exerciseRevision, revisionHtml, revisionMarkdown } from '../lib/revision.mjs';
const read = (name) => JSON.parse(readFileSync(new URL(`../content/${name}.json`, import.meta.url)));
const bites = read('revision-bites');
const coding = read('coding-exercises');
const expected = [
  ...read('chapters').map((c) => c.id),
  ...read('lessons').map((c) => `learn/${c.id}`),
  ...read('issue-checkpoints').map((c) => c.id),
  ...read('scenarios').scenarios.map((c) => c.id),
  ...read('blogs').map((c) => `blogs/${c.id}`),
  ...['sql', 'rpgle', 'files', 'compare', 'errors', 'codes'].map((id) => `sql-file-ops/${id}`),
  'common-issues', 'coding-exercises', 'code-drills',
];
test('every study route has a substantive revision; no orphaned entries', () => {
  assert.deepEqual(Object.keys(bites).sort((a, b) => a.localeCompare(b)), expected.sort((a, b) => a.localeCompare(b)));
  for (const [id, bite] of Object.entries(bites)) {
    assert(bite.points.length >= 5 && bite.points.length <= 8, id);
    assert.equal(new Set(bite.points).size, bite.points.length, id);
    for (const text of [...bite.points, bite.mistake, bite.scenario, bite.answer]) assert(text.length > 20, id);
    assert(bite.example?.code, id);
    assert(revisionHtml(bite).includes('Show the reasoning'));
    assert(revisionMarkdown(bite).includes('Quick Revision'));
  }
});
test('each exercise recap carries its own requirements and expected test behavior without mutation', () => {
  const before = JSON.stringify(coding);
  const seen = new Set();
  for (const question of coding.questions) {
    const bite = exerciseRevision(question);
    assert.equal(bite.points.length, 5, question.id);
    assert(bite.points.includes(question.requirements[0]), question.id);
    assert.equal(bite.scenario, question.testCases[1]);
    assert(!seen.has(JSON.stringify(bite)), question.id);
    seen.add(JSON.stringify(bite));
  }
  assert.equal(JSON.stringify(coding), before);
});
test('static recap renderer escapes code and text rather than interpreting markup', () => {
  const bite = { points: ['<script>alert(1)</script>'], mistake: 'A & B', scenario: '<img src=x>', answer: '<b>text</b>', example: { label: 'Example', code: 'if x < 3 && y > 0;' } };
  const html = revisionHtml(bite);
  assert(!html.includes('<script>'));
  assert(html.includes('&lt;script&gt;'));
  assert(html.includes('x &lt; 3 &amp;&amp; y &gt; 0'));
  assert.equal(revisionHtml(null), '');
});
