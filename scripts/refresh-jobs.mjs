import { readFile, writeFile } from 'node:fs/promises';

const file = new URL('../content/jobs.json', import.meta.url);
const jobs = JSON.parse(await readFile(file, 'utf8'));
const checkedAt = new Date().toISOString();
const checked = [];
for (const job of jobs) {
  try {
    const response = await fetch(job.source, { redirect: 'follow', headers: { 'user-agent': 'learn-ibmi-job-index/1.0' } });
    checked.push({ ...job, status: response.ok ? 'active' : 'needs-review', lastVerified: checkedAt });
  } catch {
    checked.push({ ...job, status: 'needs-review', lastVerified: checkedAt });
  }
}
await writeFile(file, `${JSON.stringify(checked, null, 2)}\n`);
console.log(`Checked ${checked.length} sources at ${checkedAt}`);
