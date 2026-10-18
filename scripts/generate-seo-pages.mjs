import { revisionHtml, exerciseRevision } from '../lib/revision.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lessonQuiz } from '../lib/learning.mjs';

const root = new URL('../netlify-dist/', import.meta.url);
const chapters = [
  ...JSON.parse(readFileSync(new URL('../content/chapters.json', import.meta.url))),
  JSON.parse(readFileSync(new URL('../content/common-issues.json', import.meta.url))),
  JSON.parse(readFileSync(new URL('../content/coding-exercises.json', import.meta.url))),
];
const bites = JSON.parse(readFileSync(new URL('../content/revision-bites.json', import.meta.url)));
const lessons = JSON.parse(
  readFileSync(new URL('../content/lessons.json', import.meta.url)),
);
const reference = JSON.parse(
  readFileSync(new URL('../content/sql-file-reference.json', import.meta.url)),
);
const blogs = JSON.parse(readFileSync(new URL('../content/blogs.json', import.meta.url)));
if (new Set(blogs.map((blog) => blog.id)).size !== blogs.length ||
    blogs.some((blog) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(blog.id) || !blog.sections?.length)) {
  throw new Error('Each blog needs a unique URL slug and at least one section.');
}
const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
const origin = 'https://learn-as400.netlify.app';
const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
const inline = (value) => esc(value).replace(/`([^`]+)`/g, '<code>$1</code>');
const jsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const pageHead = (title, description, path, resource) => {
  const url = `${origin}${path}`;
  const breadcrumbs = [
    { '@type': 'ListItem', position: 1, name: 'learn-ibmi', item: `${origin}/` },
    ...(path === '/topics/' ? [] : [{ '@type': 'ListItem', position: 2, name: 'IBM i topic library', item: `${origin}/topics/` }]),
    { '@type': 'ListItem', position: path === '/topics/' ? 2 : 3, name: title, item: url },
  ];
  const schema = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbs }];
  if (resource) schema.push({ '@context': 'https://schema.org', ...resource, name: title, description, url });
  return `<title>${esc(title)} | learn-ibmi</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${url}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:type" content="${resource?.['@type'] === 'BlogPosting' ? 'article' : 'website'}"><script type="application/ld+json">${jsonLd(schema)}</script>`;
};
const safeLink = (label, url) =>
  /^(https?:\/\/|\/(?!\/))/.test(url)
    ? `<a href="${esc(url)}" rel="noopener noreferrer">${esc(label)}</a>`
    : esc(label);
const blogInline = (value) =>
  String(value).split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/g).map((part) => {
    const code = /^`([^`]+)`$/.exec(part);
    if (code) return `<code>${esc(code[1])}</code>`;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    return link ? safeLink(link[1], link[2]) : esc(part);
  }).join('');
const blogMarkdown = (source) => {
  let html = '';
  let list = [];
  let code = [];
  let inCode = false;
  const flushList = () => {
    if (list.length) html += `<ul>${list.map((item) => `<li>${blogInline(item)}</li>`).join('')}</ul>`;
    list = [];
  };
  for (const line of source.split(/\r?\n/)) {
    if (line.trim().startsWith('```')) {
      flushList();
      if (inCode) {
        html += `<pre>${esc(code.join('\n'))}</pre>`;
        code = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    const item = /^\s*[-*]\s+(.+)$/.exec(line);
    if (item) {
      list.push(item[1]);
      continue;
    }
    flushList();
    if (!line.trim()) continue;
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    html += heading
      ? `<h${Math.min(heading[1].length + 2, 5)}>${blogInline(heading[2])}</h${Math.min(heading[1].length + 2, 5)}>`
      : `<p>${blogInline(line)}</p>`;
  }
  flushList();
  if (code.length) html += `<pre>${esc(code.join('\n'))}</pre>`;
  return html;
};
const slug = (item) => item.id;
const style = `.quick-revision{border-left:4px solid #3779bb;overflow-wrap:anywhere}.revision-body{min-width:0}.quick-revision pre code{background:transparent;color:inherit;padding:0}body{margin:0;background:#f7f9fc;color:#172439;font:16px/1.65 Arial,Helvetica,sans-serif}main{max-width:940px;margin:0 auto;padding:42px 24px 70px}header{border-bottom:1px solid #dce3ed;padding-bottom:24px;margin-bottom:28px}nav{line-height:1.9}a{color:#245eaf}h1{font-size:clamp(2rem,5vw,3.4rem);line-height:1.1;margin:12px 0}h2{margin-top:34px;color:#193b68}h3{font-size:1.05rem;margin:26px 0 8px;color:#24466e}small,.meta{color:#687990}.pill{display:inline-block;background:#eaf0fc;color:#345f9e;border-radius:4px;padding:2px 8px;font-size:.78rem}details{background:white;border:1px solid #dce3ed;border-radius:7px;margin:12px 0;padding:14px 18px}summary{cursor:pointer;font-weight:700}.answer{padding:8px 0}.answer p,.learning-section p{margin:10px 0}.exercise-brief,.exercise-tests{background:#f3f7fc;border:1px solid #dce3ed;border-radius:6px;padding:12px 16px;margin:14px 0}.exercise-brief ul,.exercise-tests ol{padding-left:22px}.exercise-brief li,.exercise-tests li{margin:6px 0}.outcomes,.learning-section{background:white;border:1px solid #dce3ed;border-radius:7px;padding:16px 20px;margin:15px 0}.outcomes{background:#edf3fb}.learning-section ul,.outcomes ul{padding-left:22px}.learning-section li,.outcomes li{margin:7px 0}code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:#e8eff8;padding:1px 4px;border-radius:3px}pre{overflow:auto;background:#142238;color:#e6effb;padding:14px;border-radius:5px;white-space:pre;overflow-wrap:normal}.code-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.code-pair h4{margin:10px 0 4px;color:#34577e;font-size:.8rem;text-transform:uppercase;letter-spacing:.04em}.flow{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none;counter-reset:flow}.flow li{counter-increment:flow;background:#f1f5fa;border:1px solid #dce3ed;border-radius:5px;padding:9px 12px;font-size:.9rem}.flow li:before{content:counter(flow)'. ';font-weight:700;color:#2b6bc4}.exercise-references{border-top:1px solid #dce3ed;margin-top:18px;padding-top:12px}.exercise-references a{display:block;margin-top:5px}footer{border-top:1px solid #dce3ed;margin-top:44px;padding-top:20px;color:#687990;font-size:.9rem}@media(max-width:680px){.code-pair{grid-template-columns:1fr}.flow{display:block}.flow li{margin:7px 0}}`;
const readerStyle = `.code-pair>div{min-width:0}main{overflow-wrap:anywhere}.table-scroll{overflow-x:auto}section[id]{scroll-margin-top:20px}.topic-list{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))}.topic-card{display:block;background:#fff;border:1px solid #dce3ed;padding:16px;border-radius:7px;text-decoration:none}.topic-card p{margin:8px 0 0;color:#53667e}`;
const blogStyle = `${style}${readerStyle}.blog-list{display:grid;gap:14px}.blog-list article{background:#fff;border:1px solid #dce3ed;border-radius:7px;padding:16px 20px}.blog-list h3{margin:4px 0}.blog-flow{margin:16px 0}.blog-flow li{margin:8px 0}.article-meta{color:#687990}.blog-links{margin-top:18px}.blog-links li{margin:6px 0}`;
const renderCode = (code) => {
  if (!code) return '';
  if (code.fixed && code.free) {
    return `<div class="code-pair"><div><h4>Fixed format</h4><pre>${esc(code.fixed)}</pre></div><div><h4>Fully free</h4><pre>${esc(code.free)}</pre></div></div>`;
  }
  return `<pre>${esc(code.free || code.fixed || '')}</pre>`;
};
const renderSection = (section, index) =>
  `<section class="learning-section" id="section-${index + 1}"><h3>${esc(section.heading)}</h3>${section.paragraphs.map((paragraph) => `<p>${inline(paragraph)}</p>`).join('')}${section.bullets ? `<ul>${section.bullets.map((bullet) => `<li>${inline(bullet)}</li>`).join('')}</ul>` : ''}${section.command ? `<h4>${esc(section.command.label)}</h4><pre>${esc(section.command.code)}</pre>` : ''}${section.code ? `<h4>${esc(section.code.label)}</h4>${renderCode(section.code)}` : ''}${section.flow ? `<ol class="flow">${section.flow.map((step) => `<li>${inline(step)}</li>`).join('')}</ol>` : ''}</section>`;
const relatedChapters = (lesson) =>
  lesson.chapterIds.map((id) => chapterById.get(id)).filter(Boolean);
const lessonForChapter = (chapterId) =>
  lessons.find((lesson) => lesson.chapterIds.includes(chapterId));
const referencesForLesson = (lesson) =>
  Array.from(
    new Map([...(lesson.sources || []), ...relatedChapters(lesson).flatMap((chapter) => chapter.sources)].map((source) => [source.url, source])).values(),
  );
const checkpointForLesson = (lesson) =>
  lessonQuiz(lesson, chapters);
const renderQuiz = (quiz) =>
  `<ol>${quiz.map((question, index) => `<li><strong>${index + 1}. ${inline(question.question)}</strong><ol type="A">${question.options.map((option) => `<li>${inline(option)}</li>`).join('')}</ol></li>`).join('')}</ol><details><summary>Show answer key and explanations</summary>${quiz.map((question, index) => `<p>${index + 1}. <strong>${'ABCD'[question.correct]} — ${inline(question.options[question.correct])}</strong> ${inline(question.explanation)}</p>`).join('')}</details>`;
const renderDiagnostics = (question) =>
  `${question.diagnosticSteps ? `<h4>Diagnose and resolve</h4><ol>${question.diagnosticSteps.map((step) => `<li><strong>${esc(step.title)}</strong><p>${inline(step.detail)}</p>${step.command ? `<pre>${esc(step.command)}</pre>` : ''}</li>`).join('')}</ol>` : ''}${question.verification ? `<section class="exercise-tests"><strong>Verify the result</strong><p>${inline(question.verification)}</p></section>` : ''}`;

const page = (chapter, index) => {
  const isIssuePlaybook = chapter.id === 'common-issues';
  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  const lesson = lessonForChapter(chapter.id);
  const codingTopics = chapter.questions
    .map((question) => isIssuePlaybook ? question.category : question.topic)
    .filter(Boolean);
  const topicLine = codingTopics.length
    ? `<p class="meta">${isIssuePlaybook ? 'Issue areas' : 'Coding coverage'}: ${Array.from(new Set(codingTopics)).map((topic) => esc(topic)).join(' · ')}</p>`
    : '';
  const questions = chapter.questions
    .map(
      (question, questionIndex) =>
        `<details><summary>${questionIndex + 1}. ${inline(question.question)} <small>(${esc(question.level)}${question.topic ? ` · ${esc(question.topic)}` : ''})</small></summary><div class="answer">${question.requirements ? `<section class="exercise-brief"><strong>Task and setup</strong><ul>${question.requirements.map((item) => `<li>${inline(item)}</li>`).join('')}</ul></section>` : ''}${question.hints ? `<details><summary>Need a hint?</summary><ul>${question.hints.map((hint) => `<li>${inline(hint)}</li>`).join('')}</ul></details>` : ''}${chapter.id === 'coding-exercises' ? revisionHtml(exerciseRevision(question)) : ''}${question.testCases ? `<section class="exercise-tests"><strong>Test cases to work through</strong><ol>${question.testCases.map((item) => `<li>${inline(item)}</li>`).join('')}</ol></section>` : ''}${question.answer.map((answer) => `<p>${inline(answer)}</p>`).join('')}${renderDiagnostics(question)}${question.example ? `<h4>${esc(question.exampleLabel || 'Example')}</h4><pre>${esc(question.example)}</pre>` : ''}${question.fixedFormat ? `<h4>${esc(question.fixedLabel || 'Fixed-format RPG')}</h4><pre>${esc(question.fixedFormat)}</pre>` : ''}${question.freeFormat ? `<h4>${esc(question.freeLabel || 'Fully free RPG')}</h4><pre>${esc(question.freeFormat)}</pre>` : ''}${question.trap ? `<p><strong>${isIssuePlaybook ? 'Common pitfall' : 'Interview pitfall'}:</strong> ${inline(question.trap)}</p>` : ''}${question.sources ? `<div class="exercise-references"><strong>IBM documentation for this ${isIssuePlaybook ? 'issue' : 'exercise'}</strong>${question.sources.map((source) => `<a href="${esc(source.url)}" rel="noopener noreferrer">${esc(source.title)} ↗</a>`).join('')}</div>` : ''}</div></details>`,
    )
    .join('');
  const quiz = renderQuiz(chapter.quiz);
  const learningLink = lesson
    ? `<p><strong>Learn this topic first:</strong> <a href="/learn/${slug(lesson)}/">${esc(lesson.title)} →</a></p>`
    : '';
  const siblings = lesson
    ? relatedChapters(lesson).filter((related) => related.id !== chapter.id)
    : [];
  const relatedTopics = siblings.length
    ? `<h2>Related IBM i topics</h2><ul>${siblings.map((related) => `<li><a href="/${slug(related)}/">${esc(related.title)}</a></li>`).join('')}</ul>`
    : '';
  const relatedBlogLinks = ['rpg-foundations', 'rpg-procedures', 'apis-integration'].includes(chapter.id)
    ? `<h2>AI on IBM i field notes</h2><ul>${blogs.map((blog) => `<li><a href="${blogPath(blog)}">${esc(blog.title)}</a></li>`).join('')}</ul>`
    : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${pageHead(`${chapter.title} — IBM i study guide`, chapter.summary, `/${slug(chapter)}/`)}<style>${style}${readerStyle}</style></head><body><main><header><nav><a href="/">learn-ibmi</a> · <a href="/topics/">All topics</a> · <a href="/#${slug(chapter)}">Interactive study guide</a>${lesson ? ` · <a href="/learn/${slug(lesson)}/">Learning path</a>` : ''}</nav><p class="meta">${esc(chapter.group)} · ${esc(chapter.level)}</p><h1>${esc(chapter.title)}</h1><p>${inline(chapter.summary)}</p>${learningLink}</header><p class="meta">${chapter.questions.length} ${isIssuePlaybook ? 'issue guides' : 'explained questions'} · ${chapter.quiz.length} practice MCQs</p>${topicLine}<h2>${isIssuePlaybook ? 'Issue guides' : 'Questions and answers'}</h2>${questions}${relatedTopics}${relatedBlogLinks}${revisionHtml(bites[chapter.id])}<h2>Practice checkpoint</h2>${quiz}<h2>IBM documentation and further reading</h2><ul>${chapter.sources.map((source) => `<li><a href="${esc(source.url)}" rel="noopener noreferrer">${esc(source.title)}</a></li>`).join('')}</ul><nav>${previous ? `<a href="/${slug(previous)}/">← ${esc(previous.title)}</a>` : ''}${previous && next ? ' · ' : ''}${next ? `<a href="/${slug(next)}/">${esc(next.title)} →</a>` : ''}</nav><footer>Independent study guide · Not affiliated with IBM. Verify technical details against current official IBM documentation and your target IBM i release before implementation. Contact <a href="mailto:gajedertyagi.tyagi@gmail.com">gajedertyagi.tyagi@gmail.com</a>.</footer></main></body></html>`;
};

const lessonPage = (lesson, index) => {
  const related = relatedChapters(lesson);
  const references = referencesForLesson(lesson);
  const quiz = checkpointForLesson(lesson);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const relatedBlogLinks = ['rpg-development', 'production-engineering'].includes(lesson.id)
    ? `<h2>AI on IBM i field notes</h2><ul>${blogs.map((blog) => `<li><a href="${blogPath(blog)}">${esc(blog.title)}</a></li>`).join('')}</ul>`
    : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${pageHead(lesson.seoTitle || lesson.title, lesson.summary || `Learn ${lesson.title} with examples, IBM documentation and practice questions.`, `/learn/${slug(lesson)}/`, { '@type': 'LearningResource', learningResourceType: 'Tutorial', educationalLevel: lesson.level, inLanguage: 'en', ...(lesson.updatedAt ? { dateModified: lesson.updatedAt } : {}) })}<style>${style}${readerStyle}</style></head><body><main><header><nav><a href="/">learn-ibmi</a> · <a href="/topics/">All topics</a> · <a href="/learn/${slug(lesson)}/">Learning path</a> · <a href="/#${related[0]?.id || ''}">Interactive questions</a></nav><p class="meta">LESSON ${index + 1} · ${esc(lesson.level)}</p><h1>${esc(lesson.title)}</h1><p>${esc(lesson.summary || 'Plain-English notes, code examples, IBM i commands, and a checkpoint before the deeper question bank.')}</p>${lesson.updatedAt ? `<p class="meta">Updated ${esc(lesson.updatedAt)} · Independent learning guide · IBM documentation below</p>` : ''}<p><a href="/#learn/${lesson.id}">Practise this lesson with saved progress →</a></p></header><section class="outcomes"><strong>After this lesson</strong><ul>${lesson.outcomes.map((outcome) => `<li>${inline(outcome)}</li>`).join('')}</ul></section><details class="outcomes"><summary>In this guide · ${lesson.sections.length} sections</summary><ol>${lesson.sections.map((section, index) => `<li><a href="#section-${index + 1}">${esc(section.heading)}</a></li>`).join('')}</ol></details><h2>Learning notes</h2>${lesson.sections.map(renderSection).join('')}<h2>Open the detailed question chapters</h2><ul>${related.map((chapter) => `<li><a href="/${slug(chapter)}/">${esc(chapter.title)}</a> · ${chapter.questions.length} questions</li>`).join('')}</ul>${relatedBlogLinks}${revisionHtml(bites[`learn/${lesson.id}`])}<h2>Practice checkpoint</h2><p>Answer all five, then review the explanations. The interactive site stores your completed learning checkpoints in this browser.</p>${renderQuiz(quiz)}<h2>IBM documentation for this path</h2><ul>${references.map((source) => `<li><a href="${esc(source.url)}" rel="noopener noreferrer">${esc(source.title)}</a></li>`).join('')}</ul><nav>${previous ? `<a href="/learn/${slug(previous)}/">← ${esc(previous.title)}</a>` : ''}${previous && next ? ' · ' : ''}${next ? `<a href="/learn/${slug(next)}/">${esc(next.title)} →</a>` : ''}</nav><footer>Independent study guide · Not affiliated with IBM. Verify technical details against current official IBM documentation and your target IBM i release before implementation. Contact <a href="mailto:gajedertyagi.tyagi@gmail.com">gajedertyagi.tyagi@gmail.com</a>.</footer></main></body></html>`;
};

const referencePage = (section) => {
  const title = section === 'sql' ? 'Db2 for i SQL course' : section === 'rpgle' ? 'SQL in RPGLE programs' : section === 'files' ? 'IBM i RPG file operation codes' : section === 'compare' ? 'RPG and SQL operation comparison' : section === 'codes' ? 'IBM i SQLCODE and SQLSTATE reference' : 'IBM i SQL and file operation error handling';
  const heading = section === 'sql' ? 'Db2 for i: beginner to advanced' : section === 'rpgle' ? 'Using SQL inside RPGLE programs' : section === 'files' ? 'RPG file operation codebook' : section === 'compare' ? 'RPG I/O and SQL side by side' : section === 'codes' ? 'Common SQLCODEs and SQLSTATEs' : 'Common SQL and file-operation errors';
  let body = '';
  if (section === 'sql') body = reference.sqlModules.map((m, i) => `<details><summary>${i + 1}. ${esc(m.title)} <small>(${esc(m.level)})</small></summary><div class="answer"><p>${inline(m.summary)}</p><ul>${m.points.map((p) => `<li>${inline(p)}</li>`).join('')}</ul><pre>${esc(m.code)}</pre>${m.sources.map((s) => `<a href="${esc(s.url)}" rel="noopener noreferrer">${esc(s.title)} ↗</a>`).join('<br>')}</div></details>`).join('');
  if (section === 'rpgle') body = `<nav class="reference-toc"><strong>On this page</strong>${reference.rpgleGuide.map((m, i) => `<a href="#rpgle-${i + 1}">${String(i + 1).padStart(2, '0')} · ${esc(m.title)}</a>`).join('')}</nav>${reference.rpgleGuide.map((m, i) => `<details id="rpgle-${i + 1}"><summary>${i + 1}. ${esc(m.title)}</summary><div class="answer"><p>${inline(m.summary)}</p><ul>${m.points.map((p) => `<li>${inline(p)}</li>`).join('')}</ul><pre>${esc(m.code)}</pre></div></details>`).join('')}`;
  if (section === 'files') body = `<div class="table-scroll"><table class="opcode-table"><thead><tr><th>Opcode</th><th>Definition</th><th>RPG example</th><th>SQL idea</th></tr></thead><tbody>${reference.fileOps.map((o) => `<tr><th><code>${esc(o.opcode)}</code></th><td>${inline(o.meaning)}</td><td><pre>${esc(o.example)}</pre></td><td><pre>${esc(o.sql)}</pre></td></tr>`).join('')}</tbody></table></div>`;
  if (section === 'compare') body = reference.comparisons.map((c) => `<details><summary>${inline(c.when)}</summary><div class="answer"><h3>RPG operation</h3><pre>${esc(c.rpg)}</pre><h3>SQL pattern</h3><pre>${esc(c.sql)}</pre><p>${inline(c.note)}</p></div></details>`).join('');
  if (section === 'errors') body = reference.errors.map((e) => `<details><summary><code>${esc(e.name)}</code> — ${inline(e.meaning)}</summary><div class="answer"><p><strong>What to do next:</strong> ${inline(e.action)}</p></div></details>`).join('');
  if (section === 'codes') body = `<div class="outcomes"><p><strong>How to read the result:</strong> SQLCODE 0 is success; +100 / SQLSTATE 02000 is the expected no-data boundary; negative SQLCODEs are failures. SQLSTATE is a five-character condition code and may be the better application contract.</p><ul><li>Check the result immediately after each SQL statement.</li><li>For a failure, preserve SQLCODE, SQLSTATE, message text, and row-count diagnostics before recovery.</li><li>Use IBM's message listing and DSPMSGD for release-specific cause and recovery text.</li></ul></div>${reference.sqlCodes.map((item) => `<details><summary><code>${esc(item.code)}</code> · SQLSTATE ${esc(item.state)} — ${esc(item.meaning)} <small>(${esc(item.outcome)})</small></summary><div class="answer"><p><strong>Typical trigger:</strong> ${inline(item.when)}</p><p><strong>Response:</strong> ${inline(item.action)}</p>${item.example ? `<pre>${esc(item.example)}</pre>` : ''}</div></details>`).join('')}`;
  const documentation = section === 'codes' ? reference.sqlCodeSources : reference.sources;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${pageHead(title, `${heading}: worked IBM i examples, RPG file operation comparisons, common errors and official documentation.`, `/guides/sql-file-ops/${section}/`)}<style>${style}${readerStyle}.opcode-table{width:100%;border-collapse:collapse;background:#fff}.opcode-table th,.opcode-table td{border:1px solid #dce3ed;padding:12px;text-align:left;vertical-align:top}.opcode-table pre{margin:0}</style></head><body><main><header><nav><a href="/">learn-ibmi</a> · <a href="/topics/">All topics</a> · <a href="${origin}/#sql-file-ops/${section}">Open in the interactive study app</a></nav><p class="meta">SQL + FILE OPERATIONS</p><h1>${esc(heading)}</h1><p>Plain-English IBM i learning notes with examples, comparisons, and official references.</p></header>${body}${revisionHtml(bites[`sql-file-ops/${section}`])}<h2>IBM documentation</h2><ul>${documentation.map((s) => `<li><a href="${esc(s.url)}" rel="noopener noreferrer">${esc(s.title)}</a></li>`).join('')}</ul><footer>Independent study guide · Verify syntax and release behavior against current IBM documentation and a development partition before implementation. Contact <a href="mailto:gajedertyagi.tyagi@gmail.com">gajedertyagi.tyagi@gmail.com</a>.</footer></main></body></html>`;
};

const blogPath = (blog) => `/blogs/${blog.id}/`;
const blogSection = (section) =>
  `<section class="learning-section"><h2>${esc(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${blogInline(paragraph)}</p>`).join('')}${section.markdown ? blogMarkdown(section.markdown) : ''}${section.bullets?.length ? `<ul>${section.bullets.map((item) => `<li>${blogInline(item)}</li>`).join('')}</ul>` : ''}${section.flow?.length ? `<ol class="blog-flow">${section.flow.map((step) => `<li>${blogInline(step)}</li>`).join('')}</ol>` : ''}${section.code ? `<pre>${esc(section.code)}</pre>` : ''}${section.hinglish ? `<details><summary>Hinglish explanation</summary><p>${blogInline(section.hinglish)}</p></details>` : ''}${section.links?.length ? `<div class="blog-links"><strong>References and project sources</strong><ul>${section.links.map((link) => `<li>${safeLink(link.label, link.url)}</li>`).join('')}</ul></div>` : ''}</section>`;
const blogIndexPage = () => {
  const groups = [...new Set(blogs.map((blog) => blog.topic))];
  const items = groups.map((topic) => `<section><h2>${esc(topic)}</h2><div class="blog-list">${blogs.filter((blog) => blog.topic === topic).map((blog) => `<article><p class="meta">${esc(blog.publishedAt)} · ${esc(blog.author)}</p><h3><a href="${blogPath(blog)}">${esc(blog.title)}</a></h3><p>${esc(blog.excerpt)}</p></article>`).join('')}</div></section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${pageHead('AI on IBM i and RPGLE blogs', 'IBM i development articles on MCP, RPGLE, system monitoring and AI integration, with examples and primary sources.', '/blogs/')}<style>${blogStyle}.quick-revision{margin:24px 0;padding:16px;border:1px solid #c7d7e8;border-left:4px solid #3779bb;border-radius:8px;overflow-wrap:anywhere}.quick-revision summary{cursor:pointer;font-weight:700}.quick-revision pre{overflow:auto;max-width:100%}</style></head><body><main><header><nav><a href="/">learn-ibmi</a> · <a href="/topics/">All topics</a> · <a href="/learn/rpg-development/">RPGLE learning path</a></nav><p class="meta">IBM i FIELD NOTES</p><h1>IBM i development blogs</h1><p>Practical articles organised by topic, with examples and links to the original projects and documentation.</p></header>${items}<footer>Independent learning articles · Verify technical details against current IBM documentation and your target IBM i release. Contact <a href="mailto:gajedertyagi.tyagi@gmail.com">gajedertyagi.tyagi@gmail.com</a>.</footer></main></body></html>`;
};
const blogPage = (blog) => {
  const url = `${origin}${blogPath(blog)}`;
  const schema = {
    '@type': 'BlogPosting',
    headline: blog.title,
    datePublished: blog.publishedAt,
    author: { '@type': 'Organization', name: blog.author },
    mainEntityOfPage: url,
  };
  const others = blogs.filter((other) => other.id !== blog.id && other.topic === blog.topic);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${pageHead(blog.title, blog.excerpt, blogPath(blog), schema)}<meta property="article:published_time" content="${esc(blog.publishedAt)}"><style>${blogStyle}.quick-revision{margin:24px 0;padding:16px;border:1px solid #c7d7e8;border-left:4px solid #3779bb;border-radius:8px;overflow-wrap:anywhere}.quick-revision summary{cursor:pointer;font-weight:700}.quick-revision pre{overflow:auto;max-width:100%}</style></head><body><main><article><header><nav><a href="/">learn-ibmi</a> · <a href="/topics/">All topics</a> · <a href="/blogs/">All blogs</a> · <a href="/learn/rpg-development/">RPGLE learning path</a></nav><p class="meta">${esc(blog.topic)} · ${esc(blog.publishedAt)}</p><h1>${esc(blog.title)}</h1><p>${esc(blog.excerpt)}</p><p class="article-meta">By ${esc(blog.author)}</p>${blog.repository ? `<p>Project repository: ${safeLink(blog.repository, blog.repository)}</p>` : ''}</header>${blog.sections.map(blogSection).join('')}${revisionHtml(bites[`blogs/${blog.id}`])}${others.length ? `<aside><h2>More in ${esc(blog.topic)}</h2><ul>${others.map((other) => `<li><a href="${blogPath(other)}">${esc(other.title)}</a></li>`).join('')}</ul></aside>` : ''}<footer>Independent learning article · Verify commands, release behaviour, security settings, and product support against current IBM documentation and your own IBM i environment before taking action. Contact <a href="mailto:gajedertyagi.tyagi@gmail.com">gajedertyagi.tyagi@gmail.com</a>.</footer></article></main></body></html>`;
};

const referenceTitles = { sql: 'Db2 for i SQL tutorial', rpgle: 'Embedded SQL in RPGLE', files: 'RPG file opcodes: CHAIN, READ, SETLL and READE', compare: 'RPG file operations versus SQL', errors: 'SQL and file error handling', codes: 'SQLCODE and SQLSTATE reference' };
const topicIndexPage = () => {
  const questionChapters = chapters.filter((chapter) => !['common-issues', 'coding-exercises'].includes(chapter.id));
  const groups = [...new Set(questionChapters.map((chapter) => chapter.group))];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${pageHead('AS400 and IBM i tutorials: RPGLE, Db2 SQL and CL', 'Browse IBM i and AS400 tutorials, RPGLE examples, Db2 SQL, CL commands, troubleshooting guides, coding exercises and AI articles by topic.', '/topics/', { '@type': 'CollectionPage' })}<style>${style}${readerStyle}</style></head><body><main><header><nav><a href="/">learn-ibmi</a> · <a href="/#questions">Interactive question bank</a></nav><p class="meta">IBM i LEARNING LIBRARY</p><h1>AS400 and IBM i tutorials</h1><p>Find a practical guide for the task in front of you: learn RPGLE, read and update files, query Db2 for i, manage batch jobs, or diagnose an error. Each path connects explanations and examples to official IBM documentation and related practice questions.</p><p>New to the platform? Start with <a href="/learn/platform-foundations/">IBM i foundations</a>. These tutorials cover concepts often searched as AS400, AS/400 or iSeries development, with release-specific details identified in the IBM references.</p></header><h2>Learn step by step</h2><div class="topic-list">${lessons.map((lesson) => `<a class="topic-card" href="/learn/${lesson.id}/"><strong>${esc(lesson.seoTitle || lesson.title)}</strong><p>${esc(lesson.summary || lesson.outcomes[0])}</p><small>${esc(lesson.level)} · ${lesson.sections.length} sections</small></a>`).join('')}</div><h2>SQL and RPG file operation reference</h2><ul>${Object.entries(referenceTitles).map(([id, title]) => `<li><a href="/guides/sql-file-ops/${id}/">${esc(title)}</a></li>`).join('')}</ul><h2>Interview questions and explanations</h2>${groups.map((group) => `<section><h3>${esc(group)}</h3><ul>${questionChapters.filter((chapter) => chapter.group === group).map((chapter) => `<li><a href="/${chapter.id}/">${esc(chapter.title)}</a> — ${esc(chapter.summary)}</li>`).join('')}</ul></section>`).join('')}<h2>Practise and troubleshoot</h2><ul><li><a href="/coding-exercises/">RPGLE and CLLE coding exercises</a>: tasks, examples and test cases.</li><li><a href="/common-issues/">Common IBM i issues</a>: symptoms, diagnostic steps and verification.</li></ul><h2><a href="/blogs/">AI on IBM i and development articles</a></h2><ul>${blogs.map((blog) => `<li><a href="${blogPath(blog)}">${esc(blog.title)}</a> — ${esc(blog.excerpt)}</li>`).join('')}</ul><footer>Independent learning guide · Verify examples on your IBM i development system using the linked IBM documentation.</footer></main></body></html>`;
};

const topicDir = join(root.pathname, 'topics');
mkdirSync(topicDir, { recursive: true });
writeFileSync(join(topicDir, 'index.html'), topicIndexPage());

for (const [index, chapter] of chapters.entries()) {
  const dir = join(root.pathname, slug(chapter));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), page(chapter, index));
}
for (const [index, lesson] of lessons.entries()) {
  const dir = join(root.pathname, 'learn', slug(lesson));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), lessonPage(lesson, index));
}
for (const section of ['sql', 'rpgle', 'files', 'compare', 'errors', 'codes']) {
  const dir = join(root.pathname, 'guides', 'sql-file-ops', section);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), referencePage(section));
}
const blogIndexDir = join(root.pathname, 'blogs');
mkdirSync(blogIndexDir, { recursive: true });
writeFileSync(join(blogIndexDir, 'index.html'), blogIndexPage());
for (const blog of blogs) {
  const dir = join(blogIndexDir, blog.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), blogPage(blog));
}
const paths = ['', 'topics/', ...chapters.map((chapter) => `${chapter.id}/`), ...lessons.map((lesson) => `learn/${lesson.id}/`), ...['sql', 'rpgle', 'files', 'compare', 'errors', 'codes'].map((section) => `guides/sql-file-ops/${section}/`), 'blogs/', ...blogs.map((blog) => `blogs/${blog.id}/`)];
if (blogs.some((blog) => !paths.includes(blogPath(blog).slice(1)))) {
  throw new Error('A blog page is missing from the sitemap.');
}
// Keep the initial HTML honest before React loads; counts come from the same content.
const homeFile = new URL('index.html', root);
const homeHtml = readFileSync(homeFile, 'utf8');
const counts = [
  [chapters.filter((chapter) => !['common-issues', 'coding-exercises'].includes(chapter.id)).reduce((n, chapter) => n + chapter.questions.length, 0), 'explained questions'],
  [chapterById.get('common-issues').questions.length, 'common issue guides'],
  [chapterById.get('coding-exercises').questions.length, 'RPGLE + CLLE exercises'],
  [chapters.reduce((n, chapter) => n + chapter.quiz.length, 0), 'practice MCQs'],
];
const countMarkup = `<div class="landing-noscript-grid">${counts.map(([count, label]) => `<div><strong>${count}</strong><span>${label}</span></div>`).join('')}</div><h2>`;
if (!homeHtml.includes('landing-noscript-grid')) throw new Error('Home HTML is missing its initial content summary.');
writeFileSync(homeFile, homeHtml.replace(/<div class="landing-noscript-grid">.*?<\/div><h2>/s, countMarkup));

const lessonDates = new Map(lessons.filter((lesson) => lesson.updatedAt).map((lesson) => [`learn/${lesson.id}/`, lesson.updatedAt]));
writeFileSync(
  new URL('sitemap.xml', root),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${origin}/${path}</loc>${lessonDates.has(path) ? `<lastmod>${lessonDates.get(path)}</lastmod>` : ''}</url>`).join('')}</urlset>`,
);
writeFileSync(new URL('robots.txt', root), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
