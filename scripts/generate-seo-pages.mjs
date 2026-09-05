import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../netlify-dist/', import.meta.url);
const chapters = [
  ...JSON.parse(readFileSync(new URL('../content/chapters.json', import.meta.url))),
  JSON.parse(readFileSync(new URL('../content/coding-exercises.json', import.meta.url))),
];
const origin = 'https://learn-as400.netlify.app';
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = (chapter) => chapter.id;
const style = `body{margin:0;background:#f7f9fc;color:#172439;font:16px/1.65 Arial,Helvetica,sans-serif}main{max-width:940px;margin:0 auto;padding:42px 24px 70px}header{border-bottom:1px solid #dce3ed;padding-bottom:24px;margin-bottom:28px}a{color:#245eaf}h1{font-size:clamp(2rem,5vw,3.4rem);line-height:1.1;margin:12px 0}h2{margin-top:34px;color:#193b68}h3{font-size:1.05rem;margin-bottom:8px}small,.meta{color:#687990}details{background:white;border:1px solid #dce3ed;border-radius:7px;margin:12px 0;padding:14px 18px}summary{cursor:pointer;font-weight:700}.answer{padding:8px 0}.answer p{margin:10px 0}pre{overflow:auto;background:#142238;color:#e6effb;padding:14px;border-radius:5px}footer{border-top:1px solid #dce3ed;margin-top:44px;padding-top:20px;color:#687990;font-size:.9rem}`;
const page = (chapter, index) => {
  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  const questions = chapter.questions.map((q, i) => `<details><summary>${i + 1}. ${esc(q.question)} <small>(${esc(q.level)})</small></summary><div class="answer">${q.answer.map((a) => `<p>${esc(a)}</p>`).join('')}${q.example ? `<pre>${esc(q.example)}</pre>` : ''}${q.fixedFormat ? `<h4>Fixed-format RPG</h4><pre>${esc(q.fixedFormat)}</pre>` : ''}${q.freeFormat ? `<h4>Fully free RPG</h4><pre>${esc(q.freeFormat)}</pre>` : ''}${q.trap ? `<p><strong>Interview pitfall:</strong> ${esc(q.trap)}</p>` : ''}</div></details>`).join('');
  const quiz = chapter.quiz.map((q, i) => `<li>${i + 1}. ${esc(q.question)}<ol type="A">${q.options.map((o) => `<li>${esc(o)}</li>`).join('')}</ol></li>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(chapter.title)} | learn-as400</title><meta name="description" content="${esc(chapter.summary)} Read ${chapter.questions.length} IBM i / AS400 questions with detailed answers and practice MCQs."><link rel="canonical" href="${origin}/${slug(chapter)}"><style>${style}</style></head><body><main><header><nav><a href="/">learn-as400</a> · <a href="/#${slug(chapter)}">Interactive study guide</a></nav><p class="meta">${esc(chapter.group)} · ${esc(chapter.level)}</p><h1>${esc(chapter.title)}</h1><p>${esc(chapter.summary)}</p></header><p class="meta">${chapter.questions.length} explained questions · ${chapter.quiz.length} practice MCQs</p><h2>Questions and answers</h2>${questions}<h2>Practice checkpoint</h2><ol>${quiz}</ol><h2>IBM documentation and further reading</h2><ul>${chapter.sources.map((s) => `<li><a href="${esc(s.url)}" rel="noopener noreferrer">${esc(s.title)}</a></li>`).join('')}</ul><nav>${previous ? `<a href="/${slug(previous)}">← ${esc(previous.title)}</a>` : ''}${previous && next ? ' · ' : ''}${next ? `<a href="/${slug(next)}">${esc(next.title)} →</a>` : ''}</nav><footer>Independent study guide · Not affiliated with IBM. Verify technical details against current official IBM documentation and your target IBM i release before implementation. Contact <a href="mailto:gajedertyagi.tyagi@gmail.com">gajedertyagi.tyagi@gmail.com</a>.</footer></main></body></html>`;
};

for (const [index, chapter] of chapters.entries()) {
  const dir = join(root.pathname, slug(chapter));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), page(chapter, index));
}
writeFileSync(new URL('sitemap.xml', root), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', ...chapters.map((c) => c.id)].map((path) => `<url><loc>${origin}/${path}</loc></url>`).join('')}</urlset>`);
writeFileSync(new URL('robots.txt', root), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
