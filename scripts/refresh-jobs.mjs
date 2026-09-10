import { readFile, writeFile } from 'node:fs/promises';
const file = new URL('../content/jobs.json', import.meta.url);
const userAgent = 'learn-ibmi-job-index/1.0 (+https://learn-as400.netlify.app)';
const queries = ['"IBM i" RPGLE developer jobs', 'AS400 RPG developer jobs', 'SQLRPGLE CLLE developer jobs', 'IBM i application support jobs', 'IBM i architect modernization jobs', 'IBM i manager RPG jobs'];
const fetchWithTimeout = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
const decode = (value) => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const strip = (value) => decode(value.replace(/<[^>]+>/g, '').trim());
const classify = (title) => { const text = title.toLowerCase(); const role = /architect|solution|principal/.test(text) ? 'Architect' : /manager|director|lead/.test(text) ? 'Manager' : /support|analyst|administrator|operations|infrastructure/.test(text) ? 'Support' : 'Development'; const band = /principal|director|manager|15\+|15 years|20 years/.test(text) ? '15+ years' : /architect|senior|lead|8 years|10 years|12 years/.test(text) ? '8–15 years' : /junior|entry|associate|graduate|fresher|0-3|1-3/.test(text) ? 'Freshers–3 years' : '4–7 years'; const topics = role === 'Support' ? '#troubleshooting' : role === 'Architect' ? '#ile-objects' : role === 'Manager' ? '#performance' : /sql|db2/.test(text) ? '#sql-fundamentals' : '#rpg-foundations'; return { role, band, topics }; };
const discovered = [];
for (const query of queries) { try { const response = await fetchWithTimeout(`https://www.bing.com/search?format=rss&q=${encodeURIComponent(query)}`, { headers: { 'user-agent': userAgent } }); if (!response.ok) continue; const xml = await response.text(); for (const item of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) { const title = strip(item[1].match(/<title>([\s\S]*?)<\/title>/)?.[1] || ''); const source = strip(item[1].match(/<link>([\s\S]*?)<\/link>/)?.[1] || ''); if (!title || !/^https?:\/\//.test(source) || /bing\.com|google\.com|search\.yahoo/.test(source)) continue; const { role, band, topics } = classify(title); discovered.push({ title, company: 'See source listing', location: 'See source listing', band, role, source, topics: [topics], discoveredFrom: 'Bing public search' }); } } catch (error) { console.warn(`Search skipped: ${query}`, error?.message || error); } }
const existing = JSON.parse(await readFile(file, 'utf8'));
const merged = new Map([...existing, ...discovered].map((job) => [job.source, job]));
const checkedAt = new Date().toISOString();
const checked = [];
for (const job of [...merged.values()].slice(0, 120)) { try { const response = await fetchWithTimeout(job.source, { redirect: 'follow', headers: { 'user-agent': userAgent } }); checked.push({ ...job, status: response.ok ? 'active' : 'needs-review', lastVerified: checkedAt }); } catch { checked.push({ ...job, status: 'needs-review', lastVerified: checkedAt }); } }
await writeFile(file, `${JSON.stringify(checked, null, 2)}\n`);
console.log(`Discovered ${discovered.length}; checked ${checked.length} job sources at ${checkedAt}`);
