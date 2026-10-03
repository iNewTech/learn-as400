import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../netlify-dist/', import.meta.url);
const chapters = [
  ...JSON.parse(readFileSync(new URL('../content/chapters.json', import.meta.url))),
  JSON.parse(readFileSync(new URL('../content/common-issues.json', import.meta.url))),
  JSON.parse(readFileSync(new URL('../content/coding-exercises.json', import.meta.url))),
];
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
const style = `body{margin:0;background:#f7f9fc;color:#172439;font:16px/1.65 Arial,Helvetica,sans-serif}main{max-width:940px;margin:0 auto;padding:42px 24px 70px}header{border-bottom:1px solid #dce3ed;padding-bottom:24px;margin-bottom:28px}nav{line-height:1.9}a{color:#245eaf}h1{font-size:clamp(2rem,5vw,3.4rem);line-height:1.1;margin:12px 0}h2{margin-top:34px;color:#193b68}h3{font-size:1.05rem;margin:26px 0 8px;color:#24466e}small,.meta{color:#687990}.pill{display:inline-block;background:#eaf0fc;color:#345f9e;border-radius:4px;padding:2px 8px;font-size:.78rem}details{background:white;border:1px solid #dce3ed;border-radius:7px;margin:12px 0;padding:14px 18px}summary{cursor:pointer;font-weight:700}.answer{padding:8px 0}.answer p,.learning-section p{margin:10px 0}.exercise-brief,.exercise-tests{background:#f3f7fc;border:1px solid #dce3ed;border-radius:6px;padding:12px 16px;margin:14px 0}.exercise-brief ul,.exercise-tests ol{padding-left:22px}.exercise-brief li,.exercise-tests li{margin:6px 0}.outcomes,.learning-section{background:white;border:1px solid #dce3ed;border-radius:7px;padding:16px 20px;margin:15px 0}.outcomes{background:#edf3fb}.learning-section ul,.outcomes ul{padding-left:22px}.learning-section li,.outcomes li{margin:7px 0}code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:#e8eff8;padding:1px 4px;border-radius:3px}pre{overflow:auto;background:#142238;color:#e6effb;padding:14px;border-radius:5px;white-space:pre;overflow-wrap:normal}.code-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}.code-pair h4{margin:10px 0 4px;color:#34577e;font-size:.8rem;text-transform:uppercase;letter-spacing:.04em}.flow{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none;counter-reset:flow}.flow li{counter-increment:flow;background:#f1f5fa;border:1px solid #dce3ed;border-radius:5px;padding:9px 12px;font-size:.9rem}.flow li:before{content:counter(flow)'. ';font-weight:700;color:#2b6bc4}.exercise-references{border-top:1px solid #dce3ed;margin-top:18px;padding-top:12px}.exercise-references a{display:block;margin-top:5px}footer{border-top:1px solid #dce3ed;margin-top:44px;padding-top:20px;color:#687990;font-size:.9rem}@media(max-width:680px){.code-pair{grid-template-columns:1fr}.flow{display:block}.flow li{margin:7px 0}}`;
const blogStyle = `${style}.blog-list{display:grid;gap:14px}.blog-list article{background:#fff;border:1px solid #dce3ed;border-radius:7px;padding:16px 20px}.blog-list h3{margin:4px 0}.blog-flow{margin:16px 0}.blog-flow li{margin:8px 0}.article-meta{color:#687990}.blog-links{margin-top:18px}.blog-links li{margin:6px 0}`;
const renderCode = (code) => {
  if (!code) return '';
  if (code.fixed && code.free) {
    return `<div class="code-pair"><div><h4>Fixed format</h4><pre>${esc(code.fixed)}</pre></div><div><h4>Fully free</h4><pre>${esc(code.free)}</pre></div></div>`;
  }
  return `<pre>${esc(code.free || code.fixed || '')}</pre>`;
};
const renderSection = (section) =>
  `<section class="learning-section"><h3>${esc(section.heading)}</h3>${section.paragraphs.map((paragraph) => `<p>${inline(paragraph)}</p>`).join('')}${section.bullets ? `<ul>${section.bullets.map((bullet) => `<li>${inline(bullet)}</li>`).join('')}</ul>` : ''}${section.command ? `<h4>${esc(section.command.label)}</h4><pre>${esc(section.command.code)}</pre>` : ''}${section.code ? `<h4>${esc(section.code.label)}</h4>${renderCode(section.code)}` : ''}${section.flow ? `<ol class="flow">${section.flow.map((step) => `<li>${inline(step)}</li>`).join('')}</ol>` : ''}</section>`;
const relatedChapters = (lesson) =>
  lesson.chapterIds.map((id) => chapterById.get(id)).filter(Boolean);
const lessonForChapter = (chapterId) =>
  lessons.find((lesson) => lesson.chapterIds.includes(chapterId));
const referencesForLesson = (lesson) =>
  Array.from(
    new Map(relatedChapters(lesson).flatMap((chapter) => chapter.sources).map((source) => [source.url, source])).values(),
  );
const checkpointForLesson = (lesson) =>
  relatedChapters(lesson).flatMap((chapter) => chapter.quiz).slice(0, 5);
const renderQuiz = (quiz) =>
  `<ol>${quiz.map((question, index) => `<li><strong>${index + 1}. ${inline(question.question)}</strong><ol type="A">${question.options.map((option) => `<li>${inline(option)}</li>`).join('')}</ol></li>`).join('')}</ol><details><summary>Show answer key and explanations</summary>${quiz.map((question, index) => `<p>${index + 1}. <strong>${'ABCD'[question.correct]} — ${inline(question.options[question.correct])}</strong> ${inline(question.explanation)}</p>`).join('')}</details>`;

const page = (chapter, index) => {
  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  const lesson = lessonForChapter(chapter.id);
  const codingTopics = chapter.questions
    .map((question) => question.topic)
    .filter(Boolean);
  const topicLine = codingTopics.length
    ? `<p class="meta">Coding coverage: ${Array.from(new Set(codingTopics)).map((topic) => esc(topic)).join(' · ')}</p>`
    : '';
  const questions = chapter.questions
    .map(
      (question, questionIndex) =>
        `<details><summary>${questionIndex + 1}. ${inline(question.question)} <small>(${esc(question.level)}${question.topic ? ` · ${esc(question.topic)}` : ''})</small></summary><div class="answer">${question.requirements ? `<section class="exercise-brief"><strong>Task and setup</strong><ul>${question.requirements.map((item) => `<li>${inline(item)}</li>`).join('')}</ul></section>` : ''}${question.hints ? `<details><summary>Need a hint?</summary><ul>${question.hints.map((hint) => `<li>${inline(hint)}</li>`).join('')}</ul></details>` : ''}${question.testCases ? `<section class="exercise-tests"><strong>Test cases to work through</strong><ol>${question.testCases.map((item) => `<li>${inline(item)}</li>`).join('')}</ol></section>` : ''}${question.answer.map((answer) => `<p>${inline(answer)}</p>`).join('')}${question.example ? `<h4>${esc(question.exampleLabel || 'Example')}</h4><pre>${esc(question.example)}</pre>` : ''}${question.fixedFormat ? `<h4>${esc(question.fixedLabel || 'Fixed-format RPG')}</h4><pre>${esc(question.fixedFormat)}</pre>` : ''}${question.freeFormat ? `<h4>${esc(question.freeLabel || 'Fully free RPG')}</h4><pre>${esc(question.freeFormat)}</pre>` : ''}${question.trap ? `<p><strong>Interview pitfall:</strong> ${inline(question.trap)}</p>` : ''}${question.sources ? `<div class="exercise-references"><strong>IBM documentation for this exercise</strong>${question.sources.map((source) => `<a href="${esc(source.url)}" rel="noopener noreferrer">${esc(source.title)} ↗</a>`).join('')}</div>` : ''}</div></details>`,
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
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(chapter.title)} | learn-ibmi</title><meta name="description" content="${esc(chapter.summary)} Read ${chapter.questions.length} IBM i and AS400 questions with detailed answers and practice MCQs."><link rel="canonical" href="${origin}/${slug(chapter)}/"><style>${style}</style></head><body><main><header><nav><a href="/">learn-ibmi</a> · <a href="/#${slug(chapter)}">Interactive study guide</a>${lesson ? ` · <a href="/learn/${slug(lesson)}/">Learning path</a>` : ''}</nav><p class="meta">${esc(chapter.group)} · ${esc(chapter.level)}</p><h1>${esc(chapter.title)}</h1><p>${inline(chapter.summary)}</p>${learningLink}</header><p class="meta">${chapter.questions.length} explained questions · ${chapter.quiz.length} practice MCQs</p>${topicLine}<h2>Questions and answers</h2>${questions}${relatedTopics}${relatedBlogLinks}<h2>Practice checkpoint</h2>${quiz}<h2>IBM documentation and further reading</h2><ul>${chapter.sources.map((source) => `<li><a href="${esc(source.url)}" rel="noopener noreferrer">${esc(source.title)}</a></li>`).join('')}</ul><nav>${previous ? `<a href="/${slug(previous)}/">← ${esc(previous.title)}</a>` : ''}${previous && next ? ' · ' : ''}${next ? `<a href="/${slug(next)}/">${esc(next.title)} →</a>` : ''}</nav><footer>Independent study guide · Not affiliated with IBM. Verify technical details against current official IBM documentation and your target IBM i release before implementation. Contact <a href="mailto:gajedertyagi.tyagi@gmail.com">gajedertyagi.tyagi@gmail.com</a>.</footer></main></body></html>`;
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
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(lesson.title)} | learn-ibmi learning guide</title><meta name="description" content="Learn ${esc(lesson.title)} in plain English with IBM i commands, RPGLE and CL examples, production habits, and a five-question checkpoint."><link rel="canonical" href="${origin}/learn/${slug(lesson)}/"><style>${style}</style></head><body><main><header><nav><a href="/">learn-ibmi</a> · <a href="/learn/${slug(lesson)}/">Learning path</a> · <a href="/#${related[0]?.id || ''}">Interactive questions</a></nav><p class="meta">LESSON ${index + 1} · ${esc(lesson.level)}</p><h1>${esc(lesson.title)}</h1><p>Plain-English notes, safe code skeletons, IBM i commands, and a checkpoint you can use before opening the deeper question bank.</p></header><section class="outcomes"><strong>After this lesson</strong><ul>${lesson.outcomes.map((outcome) => `<li>${inline(outcome)}</li>`).join('')}</ul></section><h2>Learning notes</h2>${lesson.sections.map(renderSection).join('')}<h2>Open the detailed question chapters</h2><ul>${related.map((chapter) => `<li><a href="/${slug(chapter)}/">${esc(chapter.title)}</a> · ${chapter.questions.length} questions</li>`).join('')}</ul>${relatedBlogLinks}<h2>Practice checkpoint</h2><p>Answer all five, then review the explanations. The interactive site stores your completed learning checkpoints in this browser.</p>${renderQuiz(quiz)}<h2>IBM documentation for this path</h2><ul>${references.map((source) => `<li><a href="${esc(source.url)}" rel="noopener noreferrer">${esc(source.title)}</a></li>`).join('')}</ul><nav>${previous ? `<a href="/learn/${slug(previous)}/">← ${esc(previous.title)}</a>` : ''}${previous && next ? ' · ' : ''}${next ? `<a href="/learn/${slug(next)}/">${esc(next.title)} →</a>` : ''}</nav><footer>Independent study guide · Not affiliated with IBM. Verify technical details against current official IBM documentation and your target IBM i release before implementation. Contact <a href="mailto:gajedertyagi.tyagi@gmail.com">gajedertyagi.tyagi@gmail.com</a>.</footer></main></body></html>`;
};

const referencePage = (section) => {
  const title = section === 'sql' ? 'Db2 for i SQL course' : section === 'rpgle' ? 'SQL in RPGLE programs' : section === 'files' ? 'IBM i RPG file operation codes' : section === 'compare' ? 'RPG and SQL operation comparison' : section === 'codes' ? 'IBM i SQLCODE and SQLSTATE reference' : 'IBM i SQL and file operation error handling';
  const heading = section === 'sql' ? 'Db2 for i: beginner to advanced' : section === 'rpgle' ? 'Using SQL inside RPGLE programs' : section === 'files' ? 'RPG file operation codebook' : section === 'compare' ? 'RPG I/O and SQL side by side' : section === 'codes' ? 'Common SQLCODEs and SQLSTATEs' : 'Common SQL and file-operation errors';
  let body = '';
  if (section === 'sql') body = reference.sqlModules.map((m, i) => `<details><summary>${i + 1}. ${esc(m.title)} <small>(${esc(m.level)})</small></summary><div class="answer"><p>${inline(m.summary)}</p><ul>${m.points.map((p) => `<li>${inline(p)}</li>`).join('')}</ul><pre>${esc(m.code)}</pre>${m.sources.map((s) => `<a href="${esc(s.url)}" rel="noopener noreferrer">${esc(s.title)} ↗</a>`).join('<br>')}</div></details>`).join('');
  if (section === 'rpgle') body = `<nav class="reference-toc"><strong>On this page</strong>${reference.rpgleGuide.map((m, i) => `<a href="#rpgle-${i + 1}">${String(i + 1).padStart(2, '0')} · ${esc(m.title)}</a>`).join('')}</nav>${reference.rpgleGuide.map((m, i) => `<details id="rpgle-${i + 1}"><summary>${i + 1}. ${esc(m.title)}</summary><div class="answer"><p>${inline(m.summary)}</p><ul>${m.points.map((p) => `<li>${inline(p)}</li>`).join('')}</ul><pre>${esc(m.code)}</pre></div></details>`).join('')}`;
  if (section === 'files') body = `<table class="opcode-table"><thead><tr><th>Opcode</th><th>Definition</th><th>RPG example</th><th>SQL idea</th></tr></thead><tbody>${reference.fileOps.map((o) => `<tr><th><code>${esc(o.opcode)}</code></th><td>${inline(o.meaning)}</td><td><pre>${esc(o.example)}</pre></td><td><pre>${esc(o.sql)}</pre></td></tr>`).join('')}</tbody></table>`;
  if (section === 'compare') body = reference.comparisons.map((c) => `<details><summary>${inline(c.when)}</summary><div class="answer"><h3>RPG operation</h3><pre>${esc(c.rpg)}</pre><h3>SQL pattern</h3><pre>${esc(c.sql)}</pre><p>${inline(c.note)}</p></div></details>`).join('');
  if (section === 'errors') body = reference.errors.map((e) => `<details><summary><code>${esc(e.name)}</code> — ${inline(e.meaning)}</summary><div class="answer"><p><strong>What to do next:</strong> ${inline(e.action)}</p></div></details>`).join('');
  if (section === 'codes') body = `<div class="outcomes"><p><strong>How to read the result:</strong> SQLCODE 0 is success; +100 / SQLSTATE 02000 is the expected no-data boundary; negative SQLCODEs are failures. SQLSTATE is a five-character condition code and may be the better application contract.</p><ul><li>Check the result immediately after each SQL statement.</li><li>For a failure, preserve SQLCODE, SQLSTATE, message text, and row-count diagnostics before recovery.</li><li>Use IBM's message listing and DSPMSGD for release-specific cause and recovery text.</li></ul></div>${reference.sqlCodes.map((item) => `<details><summary><code>${esc(item.code)}</code> · SQLSTATE ${esc(item.state)} — ${esc(item.meaning)} <small>(${esc(item.outcome)})</small></summary><div class="answer"><p><strong>Typical trigger:</strong> ${inline(item.when)}</p><p><strong>Response:</strong> ${inline(item.action)}</p>${item.example ? `<pre>${esc(item.example)}</pre>` : ''}</div></details>`).join('')}`;
  const documentation = section === 'codes' ? reference.sqlCodeSources : reference.sources;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | learn-ibmi</title><meta name="description" content="${esc(heading)} with IBM i SQL examples, RPG file operation definitions, comparisons, and troubleshooting guidance."><link rel="canonical" href="${origin}/guides/sql-file-ops/${section}/"><style>${style}.opcode-table{width:100%;border-collapse:collapse;background:#fff}.opcode-table th,.opcode-table td{border:1px solid #dce3ed;padding:12px;text-align:left;vertical-align:top}.opcode-table pre{margin:0}</style></head><body><main><header><nav><a href="/">learn-ibmi</a> · <a href="${origin}/#sql-file-ops/${section}">Open in the interactive study app</a></nav><p class="meta">SQL + FILE OPERATIONS</p><h1>${esc(heading)}</h1><p>Plain-English IBM i learning notes with examples, comparisons, and official references.</p></header>${body}<h2>IBM documentation</h2><ul>${documentation.map((s) => `<li><a href="${esc(s.url)}" rel="noopener noreferrer">${esc(s.title)}</a></li>`).join('')}</ul><footer>Independent study guide · Verify syntax and release behavior against current IBM documentation and a development partition before implementation. Contact <a href="mailto:gajedertyagi.tyagi@gmail.com">gajedertyagi.tyagi@gmail.com</a>.</footer></main></body></html>`;
};

const blogPath = (blog) => `/blogs/${blog.id}/`;
const blogSection = (section) =>
  `<section class="learning-section"><h2>${esc(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${blogInline(paragraph)}</p>`).join('')}${section.markdown ? blogMarkdown(section.markdown) : ''}${section.bullets?.length ? `<ul>${section.bullets.map((item) => `<li>${blogInline(item)}</li>`).join('')}</ul>` : ''}${section.flow?.length ? `<ol class="blog-flow">${section.flow.map((step) => `<li>${blogInline(step)}</li>`).join('')}</ol>` : ''}${section.code ? `<pre>${esc(section.code)}</pre>` : ''}${section.hinglish ? `<details><summary>Hinglish explanation</summary><p>${blogInline(section.hinglish)}</p></details>` : ''}${section.links?.length ? `<div class="blog-links"><strong>References and project sources</strong><ul>${section.links.map((link) => `<li>${safeLink(link.label, link.url)}</li>`).join('')}</ul></div>` : ''}</section>`;
const blogIndexPage = () => {
  const groups = [...new Set(blogs.map((blog) => blog.topic))];
  const items = groups.map((topic) => `<section><h2>${esc(topic)}</h2><div class="blog-list">${blogs.filter((blog) => blog.topic === topic).map((blog) => `<article><p class="meta">${esc(blog.publishedAt)} · ${esc(blog.author)}</p><h3><a href="${blogPath(blog)}">${esc(blog.title)}</a></h3><p>${esc(blog.excerpt)}</p></article>`).join('')}</div></section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI on IBM i and RPGLE blogs | learn-ibmi</title><meta name="description" content="IBM i development articles on MCP, RPGLE, system monitoring, and AI integration, with examples and primary sources."><link rel="canonical" href="${origin}/blogs/"><style>${blogStyle}</style></head><body><main><header><nav><a href="/">learn-ibmi</a> · <a href="/learn/rpg-development/">RPGLE learning path</a></nav><p class="meta">IBM i FIELD NOTES</p><h1>IBM i development blogs</h1><p>Practical articles organised by topic, with examples and links to the original projects and documentation.</p></header>${items}<footer>Independent learning articles · Verify technical details against current IBM documentation and your target IBM i release. Contact <a href="mailto:gajedertyagi.tyagi@gmail.com">gajedertyagi.tyagi@gmail.com</a>.</footer></main></body></html>`;
};
const blogPage = (blog) => {
  const url = `${origin}${blogPath(blog)}`;
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.excerpt,
    datePublished: blog.publishedAt,
    author: { '@type': 'Organization', name: blog.author },
    mainEntityOfPage: url,
    url,
  }).replace(/</g, '\\u003c');
  const others = blogs.filter((other) => other.id !== blog.id && other.topic === blog.topic);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(blog.title)} | learn-ibmi</title><meta name="description" content="${esc(blog.excerpt)}"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(blog.title)}"><meta property="og:description" content="${esc(blog.excerpt)}"><meta property="og:url" content="${url}"><meta property="article:published_time" content="${esc(blog.publishedAt)}"><script type="application/ld+json">${schema}</script><style>${blogStyle}</style></head><body><main><article><header><nav><a href="/">learn-ibmi</a> · <a href="/blogs/">All blogs</a> · <a href="/learn/rpg-development/">RPGLE learning path</a></nav><p class="meta">${esc(blog.topic)} · ${esc(blog.publishedAt)}</p><h1>${esc(blog.title)}</h1><p>${esc(blog.excerpt)}</p><p class="article-meta">By ${esc(blog.author)}</p>${blog.repository ? `<p>Project repository: ${safeLink(blog.repository, blog.repository)}</p>` : ''}</header>${blog.sections.map(blogSection).join('')}${others.length ? `<aside><h2>More in ${esc(blog.topic)}</h2><ul>${others.map((other) => `<li><a href="${blogPath(other)}">${esc(other.title)}</a></li>`).join('')}</ul></aside>` : ''}<footer>Independent learning article · Verify commands, release behaviour, security settings, and product support against current IBM documentation and your own IBM i environment before taking action. Contact <a href="mailto:gajedertyagi.tyagi@gmail.com">gajedertyagi.tyagi@gmail.com</a>.</footer></article></main></body></html>`;
};

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
const paths = ['', ...chapters.map((chapter) => `${chapter.id}/`), ...lessons.map((lesson) => `learn/${lesson.id}/`), ...['sql', 'rpgle', 'files', 'compare', 'errors', 'codes'].map((section) => `guides/sql-file-ops/${section}/`), 'blogs/', ...blogs.map((blog) => `blogs/${blog.id}/`)];
if (blogs.some((blog) => !paths.includes(blogPath(blog).slice(1)))) {
  throw new Error('A blog page is missing from the sitemap.');
}
writeFileSync(
  new URL('sitemap.xml', root),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${origin}/${path}</loc></url>`).join('')}</urlset>`,
);
writeFileSync(new URL('robots.txt', root), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
