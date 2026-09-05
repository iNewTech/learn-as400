import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gradeQuiz, readProgress } from '../lib/quiz.ts';
const chapters = JSON.parse(
  readFileSync(new URL('../content/chapters.json', import.meta.url)),
);
test('complete bank has unique stable identifiers and substantive content', () => {
  assert.equal(chapters.length, 30);
  assert.equal(
    chapters.reduce((n, c) => n + c.questions.length, 0),
    200,
  );
  const ids = new Set();
  for (const c of chapters) {
    assert(!ids.has(c.id));
    ids.add(c.id);
    assert(c.questions.length >= 6);
    assert(c.quiz.length >= 5);
    assert(c.sources.length >= 1);
    for (const s of c.sources) {
      const u = new URL(s.url);
      assert(
        u.hostname === 'www.ibm.com' || u.hostname === 'www.redbooks.ibm.com',
      );
    }
    let previous = -1;
    for (const q of c.questions) {
      assert(!ids.has(q.id));
      ids.add(q.id);
      assert(q.answer.length >= 2);
      assert(q.answer.join(' ').split(/\s+/).length >= 50, q.id);
      const level = ['Easy', 'Intermediate', 'Advanced'].indexOf(q.level);
      assert(level >= previous, q.id);
      previous = level;
    }
    for (const q of c.quiz) {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert(q.correct >= 0 && q.correct < 4);
      assert(q.explanation.length > 35);
    }
  }
});
test('all-correct, all-wrong, partial and unanswered grading for every chapter', () => {
  for (const c of chapters) {
    assert.equal(gradeQuiz(c.quiz, {}), 0);
    assert.equal(
      gradeQuiz(
        c.quiz,
        Object.fromEntries(c.quiz.map((q, i) => [i, q.correct])),
      ),
      c.quiz.length,
    );
    assert.equal(
      gradeQuiz(
        c.quiz,
        Object.fromEntries(c.quiz.map((q, i) => [i, (q.correct + 1) % 4])),
      ),
      0,
    );
    assert.equal(gradeQuiz(c.quiz, { 0: c.quiz[0].correct }), 1);
  }
});
test('stored progress tolerates malformed, obsolete and invalid values', () => {
  assert.deepEqual(readProgress('broken', chapters), {});
  assert.deepEqual(readProgress('null', chapters), {});
  assert.deepEqual(readProgress('[]', chapters), {});
  assert.deepEqual(
    readProgress(
      JSON.stringify({
        [chapters[0].id]: 5,
        [chapters[1].id]: 999,
        unknown: 5,
      }),
      chapters,
    ),
    { [chapters[0].id]: 5 },
  );
  assert.deepEqual(
    readProgress(
      JSON.stringify({ [chapters[0].id]: '5', [chapters[1].id]: -1 }),
      chapters,
    ),
    {},
  );
});
test('checkpoint gate requires a perfect result and answer positions vary', () => {
  for (const c of chapters) {
    const correct = Object.fromEntries(c.quiz.map((q, i) => [i, q.correct]));
    assert.equal(gradeQuiz(c.quiz, correct), c.quiz.length);
    correct[0] = (correct[0] + 1) % 4;
    assert.notEqual(gradeQuiz(c.quiz, correct), c.quiz.length);
    assert(new Set(c.quiz.map((q) => q.correct)).size >= 3);
  }
});
