// Advisory source review only. This is deliberately not an RPG/CL parser or compiler.
export function reviewDraft(code, format) {
  const notes = [];
  const text = String(code || '').replace(/^\uFEFF/, '');
  let meaningful;
  if (format === 'fixed') {
    meaningful = text.split('\n').filter((line) => line[6] !== '*');
    if (!meaningful.some((line) => /^.{5}[FDCOPH]/i.test(line) && line.slice(6).trim())) {
      notes.push('Add a specification in column 6 and its source text. Check alignment against the IBM fixed-format reference.');
    }
    if (text.includes('\t')) notes.push('Replace tabs with spaces so fixed-format columns are predictable.');
  } else {
    // Ignore strings and comments before looking for executable source or terminators.
    const stripped = text.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
      (part) => part.startsWith('//') || part.startsWith('/*') ? '\n'.repeat(part.split('\n').length - 1) : 'VALUE');
    meaningful = stripped.replace(/^\s*\*\*free\s*$/gim, '').trim();
    if (format === 'free') {
      if (!/^\*\*free\s*(?:\r?\n|$)/i.test(text)) notes.push('Place **FREE on the first line, starting in column 1.');
      if (!/[a-z]/i.test(meaningful) || !meaningful.includes(';')) notes.push('Add source statements ending in semicolons; comments alone are not a solution.');
    } else {
      if (!/^\s*PGM\b/im.test(stripped) || !/^\s*ENDPGM\s*$/im.test(stripped)) notes.push('Include PGM and ENDPGM for this CL program exercise.');
      if (!stripped.replace(/^\s*(?:ENDPGM|PGM[^\n]*)\s*$/gim, '').trim()) notes.push('Add your declarations and logic inside the CL program.');
    }
  }
  return { ok: notes.length === 0, notes: notes.length ? notes : ['No basic source-format warnings found. Types, columns, logic, file definitions, binding, and runtime behavior still need review on IBM i.'] };
}

export function readTestNotebook(raw, count) {
  try {
    const value = JSON.parse(raw || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([index, row]) => /^\d+$/.test(index)
      && Number(index) < count && row && typeof row === 'object'
      && ['not-run', 'pass', 'fail', 'blocked'].includes(row.status)
      && typeof row.notes === 'string' && row.notes.length <= 10000));
  } catch { return {}; }
}
