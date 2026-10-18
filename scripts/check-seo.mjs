import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../netlify-dist/', import.meta.url));
const origin = 'https://learn-as400.netlify.app';
const sitemap = readFileSync(resolve(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert(urls.length > 1, 'Sitemap must contain real pages');
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
const titleSet = new Set();
const descriptions = new Set();
const decode = (text) => text.replaceAll('&amp;', '&');
const pageFile = (path) => resolve(root, `.${path}`, path.endsWith('/') ? 'index.html' : '');

for (const url of urls) {
  const page = new URL(url);
  assert.equal(page.origin, origin);
  assert.equal(page.hash, '', 'Sitemap must not contain hash routes');
  const file = pageFile(page.pathname);
  assert(existsSync(file), `Missing HTML for ${url}`);
  const html = readFileSync(file, 'utf8');
  if (!['/', '/topics/', '/blogs/'].includes(page.pathname)) {
    const revision = html.indexOf('<details class="quick-revision">');
    assert(revision >= 0, `${url}: missing revision recap`);
    const checkpoint = html.indexOf('<h2>Practice checkpoint</h2>');
    if (checkpoint >= 0) assert(revision < checkpoint, `${url}: revision must precede the checkpoint`);
  }
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
  assert.equal(canonicals.length, 1, `${url}: requires exactly one canonical`);
  assert.equal(canonicals[0][1], url, `${url}: canonical mismatch`);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${url}: requires one main heading`);
  assert(!/<meta[^>]+content="[^"]*noindex/i.test(html), `${url}: unexpectedly excluded from indexing`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert(title && description, `${url}: missing title or description`);
  assert(!titleSet.has(title), `${url}: duplicate title`);
  assert(!descriptions.has(description), `${url}: duplicate description`);
  titleSet.add(title);
  descriptions.add(description);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)) JSON.parse(match[1]);
  for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const target = new URL(decode(match[1]), url);
    if (target.origin !== origin) continue;
    assert(existsSync(pageFile(target.pathname)), `${url}: broken internal link ${target.pathname}`);
    // Root fragments are the interactive app's routes; reader-page anchors must exist.
    if (target.hash && target.pathname !== '/') {
      const targetHtml = readFileSync(pageFile(target.pathname), 'utf8');
      assert(targetHtml.includes(`id="${target.hash.slice(1)}"`), `${url}: missing anchor ${target.href}`);
    }
  }
}
const library = readFileSync(pageFile('/topics/'), 'utf8');
for (const url of urls) {
  const path = new URL(url).pathname;
  if (path !== '/topics/') assert(library.includes(`href="${path}"`), `Topic library does not link to ${path}`);
}
assert(readFileSync(resolve(root, 'robots.txt'), 'utf8').includes(`${origin}/sitemap.xml`));
console.log(`SEO checks passed: ${urls.length} crawlable HTML pages, unique metadata, canonicals, structured data and internal links.`);
