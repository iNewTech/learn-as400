export function matchesQuestion(
  chapter: { title: string; summary: string },
  question: { level: string; question: string; answer: string[] },
  query: string,
  level: string,
): boolean {
  if (level !== 'All levels' && question.level !== level) return false;
  const term = query.trim().toLowerCase();
  return (
    !term ||
    `${chapter.title} ${chapter.summary} ${question.question} ${question.answer.join(' ')}`
      .toLowerCase()
      .includes(term)
  );
}
