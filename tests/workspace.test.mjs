import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  draftFingerprint,
  readGuidedReviews,
  reviewDraft,
} from '../lib/workspace.mjs';

const exercises = JSON.parse(
  readFileSync(new URL('../content/coding-exercises.json', import.meta.url)),
).questions;

test('source review catches empty and obviously incomplete drafts', () => {
  assert.equal(reviewDraft('**FREE\nx = 1;', 'free').ok, false);
  assert.equal(reviewDraft('**FREE\n// x = 1;\n// return;', 'free').ok, false);
  assert.equal(
    reviewDraft('     C                   EVAL      x = 1', 'fixed').ok,
    false,
  );
  assert.equal(reviewDraft('      * comment only', 'fixed').ok, false);
  assert.equal(reviewDraft('PGM\n/* no commands */\nENDPGM', 'cl').ok, false);
});

test('source review catches basic delimiters without claiming compilation', () => {
  assert.match(
    reviewDraft('**FREE\nx = %trim(name;\nreturn;', 'free').notes.join(' '),
    /parentheses/i,
  );
  assert.match(
    reviewDraft('**FREE\nx = 1;\n/* unfinished\nreturn;', 'free').notes.join(
      ' ',
    ),
    /block comment/i,
  );
  assert.equal(
    reviewDraft("**FREE\ntext = '/* literal */';\nreturn;", 'free').ok,
    true,
  );
});

test('CL envelope is optional, but present delimiters must enclose commands', () => {
  assert.equal(
    reviewDraft(
      'DCL VAR(&X) TYPE(*CHAR) LEN(10)\nCHGVAR VAR(&X) VALUE(YES)',
      'cl',
    ).ok,
    true,
  );
  assert.match(
    reviewDraft('PGM\nENDPGM\nCHGVAR VAR(&X) VALUE(Y)', 'cl').notes.join(' '),
    /ENDPGM/,
  );
  assert.match(
    reviewDraft('CHGVAR VAR(&X) VALUE(Y)\nPGM', 'cl').notes.join(' '),
    /PGM/,
  );
  assert.equal(
    reviewDraft('PGM\nDSPOBJD OBJ(APPLAB/*ALL) OBJTYPE(*PGM)\nENDPGM', 'cl').ok,
    true,
  );
});

test('representative RPG and CL exercise fragments have no basic warnings', () => {
  const firstRpg = exercises.find((item) => item.id === 'coding-exercise-1');
  const clReport = exercises.find((item) => item.id === 'coding-exercise-40');
  assert.equal(reviewDraft(firstRpg.freeFormat, 'free').ok, true);
  assert.equal(reviewDraft(firstRpg.fixedFormat, 'fixed').ok, true);
  assert.equal(reviewDraft(clReport.example, 'cl').ok, true);
});

test('draft fingerprints are stable for the same source and change on edits', () => {
  const source = '**FREE\nreturn;';
  assert.equal(draftFingerprint(source), draftFingerprint(source));
  assert.notEqual(draftFingerprint(source), draftFingerprint(`${source}\n`));
  assert.notEqual(draftFingerprint('a'), draftFingerprint('b'));
  assert.match(draftFingerprint(source), /^\d+:[0-9a-f]{8}$/);
});

test('guided reviews retain only known, well-formed records and bounded optional notes', () => {
  const fingerprint = draftFingerprint('source');
  const valid = {
    format: 'free',
    fingerprint,
    evidence: ['Line 4 handles a missing key'],
    choice: 2,
  };
  const raw = JSON.stringify({
    a: valid,
    b: { format: 'fixed', fingerprint, evidence: [42], choice: -1 },
    unknown: valid,
    badFormat: { format: 'sql', fingerprint },
    badFingerprint: { format: 'cl', fingerprint: 'not-a-fingerprint' },
  });
  assert.deepEqual(
    readGuidedReviews(raw, ['a', 'b', 'badFormat', 'badFingerprint']),
    {
      a: valid,
      b: { format: 'fixed', fingerprint },
    },
  );
  assert.deepEqual(readGuidedReviews('not json', ['a']), {});
  assert.deepEqual(readGuidedReviews('[]', ['a']), {});
  assert.deepEqual(readGuidedReviews('null', ['a']), {});
});
