// Mix checkpoint questions across the chapters covered by a learning path.
export function lessonQuiz(lesson, chapters) {
  const related = lesson.chapterIds
    .map((id) => chapters.find((chapter) => chapter.id === id))
    .filter(Boolean);
  const result = [];
  for (let row = 0; result.length < 5; row++) {
    let added = false;
    for (const chapter of related) {
      if (chapter.quiz[row] && result.length < 5) {
        result.push(chapter.quiz[row]);
        added = true;
      }
    }
    if (!added) break;
  }
  return result;
}
