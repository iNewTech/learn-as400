'use client';
import { useState, type ReactNode } from 'react';
import { readTestNotebook } from '@/lib/workspace.mjs';

export type Reference = { title: string; url: string };
export type PracticeQuestion = { question: string; options: string[]; correct: number; explanation: string; code?: string; tests?: { input: string; expected: string; why: string }[]; sources?: Reference[] };
export type Scenario = {
  id: string; title: string; area: string; level: string; setup: string;
  evidence: string[]; steps: { title: string; detail: string; code?: string }[];
  branches: { condition: string; action: string; why: string }[];
  verification: string[]; sources: Reference[]; quiz: PracticeQuestion[];
};
export type Challenge = {
  id: string; title: string; area: string; level: string; prompt: string; code: string;
  language: string; options: string[]; correct: number; explanation: string;
  tests: { input: string; expected: string; why: string }[]; sources: Reference[];
};
export function PracticeNotice() {
  return <p className="practice-notice">Learning examples only. Verify the steps and code against official IBM documentation for your release, and test in a development environment before taking action. The site owner accepts no responsibility for outcomes from their use.</p>;
}
export function References({ sources }: { sources: Reference[] }) {
  return <div className="exercise-references"><strong>Official IBM documentation</strong>{sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</div>;
}
export function CaseWorkshop({ scenarios, selectedId, progress, checkpoint }: {
  scenarios: Scenario[]; selectedId?: string; progress: Record<string, number>;
  checkpoint: (scenario: Scenario) => ReactNode;
}) {
  const [area, setArea] = useState('All areas');
  const active = scenarios.find((item) => item.id === selectedId);
  if (!active) return <section className="case-workshop">
    <div className="case-banner"><span className="eyebrow">THE OPERATIONS DESK</span><h2>If this happens, what do you do next?</h2><p>Read the evidence, choose the right branch, and verify the result. These original training incidents connect code to what happens in a running IBM i application.</p></div>
    <div className="filters" aria-label="Scenario area">{['All areas', ...new Set(scenarios.map((item) => item.area))].map((item) => <button key={item} className={area === item ? 'chosen' : ''} aria-pressed={area === item} onClick={() => setArea(item)}>{item}</button>)}</div>
    <div className="scenario-index">{scenarios.filter((item) => area === 'All areas' || item.area === area).map((item) => <a href={`#scenarios/${item.id}`} className="scenario-index-row" key={item.id}>
      <span className="incident-number">CASE {String(scenarios.indexOf(item) + 1).padStart(2, '0')}</span><span><strong>{item.title}</strong><small>{item.area} · {item.level} · {item.quiz.length} checkpoint questions</small></span><span>{progress[item.id] === item.quiz.length ? 'Passed ✓' : 'Investigate →'}</span>
    </a>)}</div>
  </section>;
  const next = scenarios[scenarios.indexOf(active) + 1];
  return <article className="case-workshop">
    <a className="lab-back" href="#scenarios">← All scenarios</a>
    <header className="case-banner"><span className="eyebrow">CASE {String(scenarios.indexOf(active) + 1).padStart(2, '0')} / {active.area}</span><h2>{active.title}</h2><p>{active.setup}</p></header>
    <PracticeNotice />
    <section className="incident-evidence"><h3>What you know so far</h3><ul>{active.evidence.map((item) => <li key={item}>{item}</li>)}</ul></section>
    <ol className="diagnostic-steps">{active.steps.map((step) => <li key={step.title}><h3>{step.title}</h3><p>{step.detail}</p>{step.code && <pre><code>{step.code}</code></pre>}</li>)}</ol>
    <section className="branch-section"><h3>Follow the evidence</h3><p className="small">Open the branch that matches the observation. Different symptoms need different actions.</p>{active.branches.map((branch) => <details className="decision-branch" key={branch.condition}><summary><span>IF</span> {branch.condition}</summary><div><strong>Then</strong><p>{branch.action}</p><strong>Why</strong><p>{branch.why}</p></div></details>)}</section>
    <section className="verification-box"><h3>How you know it is resolved</h3><ul>{active.verification.map((item) => <li key={item}>{item}</li>)}</ul></section>
    <References sources={active.sources} />
    {checkpoint(active)}
    <div className="chapter-nav"><a href="#scenarios">← Scenario index</a>{next && (progress[active.id] === active.quiz.length ? <a className="primary" href={`#scenarios/${next.id}`}>Next case →</a> : <button className="primary" disabled>Pass the checkpoint to continue</button>)}</div>
  </article>;
}
export function TestNotebook({ id, cases }: { id: string; cases: string[] }) {
  const storageKey = `learn-as400-test-notes-${id}`;
  const [rows, setRows] = useState<Record<string, { status: string; notes: string }>>(() => {
    try { return readTestNotebook(localStorage.getItem(storageKey), cases.length); } catch { return {}; }
  });
  const [message, setMessage] = useState('Record results from your own IBM i development system.');
  const update = (index: number, field: 'status' | 'notes', value: string) => {
    const current = rows[index] || { status: 'not-run', notes: '' };
    const next = { ...rows, [index]: { ...current, [field]: value } };
    setRows(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setMessage('Test notes saved in this browser.'); }
    catch { setMessage('Storage unavailable. Download your test report to keep it.'); }
  };
  return <details className="test-notebook"><summary>Your test notebook · {Object.values(rows).filter((row) => row.status === 'pass').length}/{cases.length} self-reported passes</summary>
    <p>These results are entered by you. This website does not execute your code or verify a passing result. Record the release, fixtures, actual output, and job-log evidence.</p>
    {cases.map((test, index) => <section key={test}><h4>Case {index + 1}</h4><p>{test}</p><label>Observed result <select value={rows[index]?.status || 'not-run'} onChange={(event) => update(index, 'status', event.target.value)}>{[['not-run', 'Not run'], ['pass', 'Passed on my system'], ['fail', 'Failed on my system'], ['blocked', 'Blocked / needs setup']].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Evidence and notes<textarea data-clarity-mask="true" value={rows[index]?.notes || ''} maxLength={10000} onChange={(event) => update(index, 'notes', event.target.value)} placeholder="Actual output, job-log messages, fixtures used…" /></label>
    </section>)}
    <button className="secondary" onClick={() => {
      const report = `learn-ibmi / ${id}\nSelf-reported test results; not executed by the website.\n\n${cases.map((test, index) => `${index + 1}. ${test}\nStatus: ${rows[index]?.status || 'not-run'}\nEvidence: ${rows[index]?.notes || 'None recorded'}\n`).join('\n')}`;
      const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = `${id}-test-report.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }}>Download test report</button><output className="small" aria-live="polite">{message}</output>
  </details>;
}
