// Advisory source review only. This is deliberately not an RPG/CL parser or compiler.
export function reviewDraft(code, format) {
  const notes = [];
  const text = String(code || '').replace(/^\uFEFF/, '');
  const source =
    format === 'fixed'
      ? text
          .split('\n')
          .filter((line) => line[6] !== '*')
          .join('\n')
      : text;
  // Remove complete comments and literals before checking obvious source-shape mistakes.
  const stripped = source.replace(
    /'(?:''|[^'])*'|"(?:""|[^"])*"|(?<![A-Za-z0-9_])\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
    (part) =>
      part.startsWith('//') || part.startsWith('/*')
        ? '\n'.repeat(part.split('\n').length - 1)
        : 'VALUE',
  );
  if (/(?<![A-Za-z0-9_])\/\*/.test(stripped))
    notes.push('Close the unfinished block comment.');
  let depth = 0;
  let unmatched = false;
  for (const char of stripped) {
    if (char === '(') depth++;
    if (char === ')' && --depth < 0) unmatched = true;
  }
  if (depth !== 0 || unmatched)
    notes.push('Check unmatched parentheses in the source.');

  if (format === 'fixed') {
    const specifications = source
      .split('\n')
      .filter((line) => /^.{5}[FDCOPH]/i.test(line) && line.slice(6).trim());
    if (specifications.length < 2)
      notes.push(
        'Add more than one source specification with its type in column 6; a single line is not an exercise solution.',
      );
    if (text.includes('\t'))
      notes.push(
        'Replace tabs with spaces so fixed-format columns are predictable.',
      );
  } else if (format === 'free') {
    if (!/^\*\*free\s*(?:\r?\n|$)/i.test(text))
      notes.push('Place **FREE on the first line, starting in column 1.');
    const body = stripped.replace(/^\s*\*\*free\s*$/gim, '');
    if (!/[a-z]/i.test(body) || (body.match(/;/g) || []).length < 2)
      notes.push(
        'Add at least two source statements ending in semicolons; comments or a single assignment are not an exercise solution.',
      );
  } else if (format === 'cl') {
    const lines = stripped
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.some((line) => !/^(?:PGM\b|ENDPGM\b)/i.test(line)))
      notes.push(
        'Add CL declarations or commands; program delimiters and comments alone are not a solution.',
      );
    if (lines.some((line, index) => /^PGM\b/i.test(line) && index !== 0))
      notes.push('If you include PGM, put it before the other CL commands.');
    if (
      lines.some(
        (line, index) => /^ENDPGM\b/i.test(line) && index !== lines.length - 1,
      )
    )
      notes.push('If you include ENDPGM, put it after the other CL commands.');
  } else {
    notes.push('Choose a supported source format before reviewing.');
  }
  return {
    ok: notes.length === 0,
    notes: notes.length
      ? notes
      : [
          'No basic source-format warnings found. Types, columns, logic, file definitions, binding, and runtime behavior still need review on IBM i.',
        ],
  };
}

// A local edit marker for guided self-review, not a security or authenticity hash.
export function draftFingerprint(code) {
  const text = String(code || '');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  }
  return `${text.length}:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function readGuidedReviews(raw, ids) {
  try {
    const value = JSON.parse(raw || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const allowed = new Set(ids);
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([id, review]) =>
            allowed.has(id) &&
            review &&
            typeof review === 'object' &&
            !Array.isArray(review) &&
            ['free', 'fixed', 'cl'].includes(review.format) &&
            typeof review.fingerprint === 'string' &&
            /^(?:0|[1-9]\d{0,5}):[0-9a-f]{8}$/.test(review.fingerprint) &&
            Number(review.fingerprint.split(':')[0]) <= 100000,
        )
        .map(([id, review]) => {
          const clean = {
            format: review.format,
            fingerprint: review.fingerprint,
          };
          if (
            Array.isArray(review.evidence) &&
            review.evidence.length <= 20 &&
            review.evidence.every(
              (item) => typeof item === 'string' && item.length <= 2000,
            )
          )
            clean.evidence = review.evidence;
          if (
            Number.isInteger(review.choice) &&
            review.choice >= 0 &&
            review.choice <= 20
          )
            clean.choice = review.choice;
          return [id, clean];
        }),
    );
  } catch {
    return {};
  }
}

export function readTestNotebook(raw, count) {
  try {
    const value = JSON.parse(raw || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([index, row]) =>
          /^\d+$/.test(index) &&
          Number(index) < count &&
          row &&
          typeof row === 'object' &&
          ['not-run', 'pass', 'fail', 'blocked'].includes(row.status) &&
          typeof row.notes === 'string' &&
          row.notes.length <= 10000,
      ),
    );
  } catch {
    return {};
  }
}
