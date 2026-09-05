export function gradeQuiz(
  quiz: { correct: number }[],
  answers: Record<number, number>,
): number {
  return quiz.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
}
export function readProgress(
  raw: string | null,
  chapters: { id: string; quiz: unknown[] }[],
): Record<string, number> {
  if (!raw) return {};
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  return Object.fromEntries(
    chapters
      .filter(
        (c) =>
          Number.isInteger(parsed[c.id]) &&
          parsed[c.id] >= 0 &&
          parsed[c.id] <= c.quiz.length,
      )
      .map((c) => [c.id, parsed[c.id]]),
  );
}
