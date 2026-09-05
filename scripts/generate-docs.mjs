import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const chapters = JSON.parse(
  readFileSync(new URL('../content/chapters.json', import.meta.url)),
);
chapters.push(
  JSON.parse(readFileSync(new URL('../content/coding-exercises.json', import.meta.url))),
);
const lessons = JSON.parse(
  readFileSync(new URL('../content/lessons.json', import.meta.url)),
);
const chaptersById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
const dir = new URL('../docs/', import.meta.url);
mkdirSync(dir, { recursive: true });
let index =
  `# learn-as400 study guide\n\n${chapters.reduce((n, c) => n + c.questions.length, 0)} explained questions · ${chapters.length} chapters · ${lessons.length} learning paths · ${chapters.reduce((n, c) => n + c.quiz.length, 0)} MCQs.\n\nUse the website for interactive grading and browser-local progress. In these repository pages, answers are expandable and the MCQ key is collapsed.\n\n## Learning paths\n\n${lessons.map((lesson, i) => `${i + 1}. [${lesson.title}](learning-${lesson.id}.md) — ${lesson.level} · ${lesson.sections.length} short lessons`).join('\n')}\n\n## Question chapters\n\n`;
for (const [i, c] of chapters.entries()) {
  index += `${i + 1}. [${c.title}](${c.id}.md) — ${c.group} · ${c.level}\n`;
  let md = `# ${c.title}\n\n[Question index](README.md) · ${c.group} · ${c.level}\n\n${c.summary}\n\n${c.id === 'coding-exercises' ? 'Use the website workspace to write a draft, switch between RPGLE formats, save locally, download source, and run a basic structure check. The editor does not compile IBM i languages; use the requirements and test cases on an IBM i development partition before treating a solution as valid.\n\n' : ''}`;
  for (const [j, q] of c.questions.entries()) {
    md += `## ${j + 1}. ${q.question}\n\n**${q.level}**${q.topic ? ` · ${q.topic}` : ''}\n\n<details>\n<summary>Explain the answer</summary>\n\n${q.answer.join('\n\n')}\n\n`;
    if (q.requirements) md += `**Task and setup**\n\n${q.requirements.map((item) => `- ${item}`).join('\n')}\n\n`;
    if (q.hints) md += `<details>\n<summary>Need a hint?</summary>\n\n${q.hints.map((hint) => `- ${hint}`).join('\n')}\n\n</details>\n\n`;
    if (q.testCases) md += `**Test cases**\n\n${q.testCases.map((testCase, index) => `${index + 1}. ${testCase}`).join('\n')}\n\n`;
    if (q.example) md += `**${q.exampleLabel || 'Example'}**\n\n` + '```cl\n' + q.example + '\n```\n\n';
    if (q.fixedFormat) md += '**Fixed-format RPG**\n\n```rpgle\n' + q.fixedFormat + '\n```\n\n';
    if (q.freeFormat) md += '**Fully free RPG**\n\n```rpgle\n' + q.freeFormat + '\n```\n\n';
    if (q.trap) md += `**Interview pitfall:** ${q.trap}\n\n`;
    if (q.sources) md += `**IBM documentation for this exercise**\n\n${q.sources.map((source) => `- [${source.title}](${source.url})`).join('\n')}\n\n`;
    md += '</details>\n\n';
  }
  md +=
    `## Checkpoint — ${c.quiz.length} MCQs\n\nAnswer all questions before checking the key. Aim for ${c.quiz.length}/${c.quiz.length} before continuing.\n\n`;
  for (const [j, q] of c.quiz.entries())
    md += `### ${j + 1}. ${q.question}\n\n${q.options.map((o, k) => `${'ABCD'[k]}. ${o}`).join('\n')}\n\n`;
  md +=
    '<details>\n<summary>Answer key and explanations</summary>\n\n' +
    c.quiz
      .map(
        (q, j) =>
          `${j + 1}. **${'ABCD'[q.correct]} — ${q.options[q.correct]}** ${q.explanation}`,
      )
      .join('\n\n') +
    '\n\n</details>\n\n## References\n\nResearch date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.\n\n' +
    c.sources.map((s) => `- [${s.title}](${s.url})`).join('\n') +
    '\n\n';
  if (i > 0) md += `[← Previous](${chapters[i - 1].id}.md) · `;
  if (i < chapters.length - 1) md += `[Next →](${chapters[i + 1].id}.md)`;
  md += '\n';
  writeFileSync(new URL(c.id + '.md', dir), md);
}
for (const [i, lesson] of lessons.entries()) {
  let md = `# ${lesson.title}\n\n[Learning path index](README.md) · ${lesson.level}\n\nThis path uses simple explanations, safe code skeletons, and IBM i commands before the detailed question chapters.\n\n## Outcomes\n\n${lesson.outcomes.map((outcome) => `- ${outcome}`).join('\n')}\n\n`;
  for (const [j, section] of lesson.sections.entries()) {
    md += `## ${j + 1}. ${section.heading}\n\n${section.paragraphs.join('\n\n')}\n\n`;
    if (section.bullets) md += `${section.bullets.map((bullet) => `- ${bullet}`).join('\n')}\n\n`;
    if (section.command) md += `**${section.command.label}**\n\n\`\`\`cl\n${section.command.code}\n\`\`\`\n\n`;
    if (section.code) {
      if (section.code.fixed) md += `**Fixed format**\n\n\`\`\`rpgle\n${section.code.fixed}\n\`\`\`\n\n`;
      if (section.code.free) md += `**Fully free**\n\n\`\`\`${section.code.language}\n${section.code.free}\n\`\`\`\n\n`;
    }
    if (section.flow) md += `**Flow**\n\n${section.flow.map((step, k) => `${k + 1}. ${step}`).join('\n')}\n\n`;
  }
  const related = lesson.chapterIds.map((id) => chaptersById.get(id)).filter(Boolean);
  md += `## Practice checkpoint\n\nComplete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: ${related.map((chapter) => `[${chapter.title}](${chapter.id}.md)`).join(', ')}.\n\n## IBM documentation\n\n${Array.from(new Map(related.flatMap((chapter) => chapter.sources).map((source) => [source.url, source])).values()).map((source) => `- [${source.title}](${source.url})`).join('\n')}\n\n`;
  if (i > 0) md += `[← Previous path](learning-${lessons[i - 1].id}.md) · `;
  if (i < lessons.length - 1) md += `[Next path →](learning-${lessons[i + 1].id}.md)`;
  md += '\n';
  writeFileSync(new URL(`learning-${lesson.id}.md`, dir), md);
}
writeFileSync(new URL('README.md', dir), index);
