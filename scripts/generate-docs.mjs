import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const chapters = JSON.parse(
  readFileSync(new URL('../content/chapters.json', import.meta.url)),
);
const dir = new URL('../docs/', import.meta.url);
mkdirSync(dir, { recursive: true });
let index =
  '# learn-as400 study guide\n\n200 explained interview questions · 30 chapters · 150 MCQs.\n\nUse the website for interactive grading and browser-local progress. In these repository pages, answers are expandable and the MCQ key is collapsed.\n\n';
for (const [i, c] of chapters.entries()) {
  index += `${i + 1}. [${c.title}](${c.id}.md) — ${c.group} · ${c.level}\n`;
  let md = `# ${c.title}\n\n[Question index](README.md) · ${c.group} · ${c.level}\n\n${c.summary}\n\n`;
  for (const [j, q] of c.questions.entries()) {
    md += `## ${j + 1}. ${q.question}\n\n**${q.level}**\n\n<details>\n<summary>Explain the answer</summary>\n\n${q.answer.join('\n\n')}\n\n`;
    if (q.example) md += '```text\n' + q.example + '\n```\n\n';
    if (q.trap) md += `**Interview pitfall:** ${q.trap}\n\n`;
    md += '</details>\n\n';
  }
  md +=
    '## Checkpoint — 5 MCQs\n\nAnswer all five before checking the key. Aim for 5/5 before continuing.\n\n';
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
writeFileSync(new URL('README.md', dir), index);
