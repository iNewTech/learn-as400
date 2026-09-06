'use client';
import { useState } from 'react';

type Source = { title: string; url: string };
type SqlModule = { id: string; level: string; title: string; summary: string; points: string[]; code: string; sources: Source[] };
type FileOp = { opcode: string; meaning: string; example: string; sql: string };
type Comparison = { rpg: string; sql: string; when: string; note: string };
type ErrorItem = { name: string; meaning: string; action: string };
type RpgSqlSection = { title: string; summary: string; code: string; points: string[] };
export type ReferenceData = { sqlModules: SqlModule[]; fileOps: FileOp[]; comparisons: Comparison[]; errors: ErrorItem[]; rpgleGuide: RpgSqlSection[]; sources: Source[] };

function Sources({ sources }: { sources: Source[] }) {
  return <div className="reference-sources"><strong>Official references</strong>{sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>)}</div>;
}

export function ReferenceHub({ data, tab = 'sql' }: { data: ReferenceData; tab?: string }) {
  const [active, setActive] = useState(tab === 'files' || tab === 'compare' || tab === 'errors' ? tab : 'sql');
  const change = (next: string) => {
    setActive(next);
    window.history.replaceState(null, '', `#sql-file-ops/${next}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };
  return <article className="reference-hub">
    <div className="reference-hero"><span className="eyebrow">SQL + FILE OPERATIONS DESK</span><h2>Build the same data skill two ways.</h2><p>Learn Db2 for i from the first SELECT through transactions and performance, then use the RPG file operations that solve the same problems in native I/O.</p></div>
    <nav className="reference-tabs" aria-label="SQL and file operation guides">
      {[['sql', 'Db2 for i course'], ['rpgle', 'SQL in RPGLE'], ['files', 'RPG file opcodes'], ['compare', 'RPG ↔ SQL comparison'], ['errors', 'Error handling']].map(([id, label]) => <button key={id} className={active === id ? 'chosen' : ''} aria-pressed={active === id} onClick={() => change(id)}>{label}</button>)}
    </nav>
    {active === 'sql' && <section><div className="reference-intro"><h3>Db2 for i: beginner to advanced</h3><p>Move through the modules in order. Every example is a study skeleton: qualify names, parameterise values, check the result, and test it on your IBM i release.</p></div><div className="sql-module-grid">{data.sqlModules.map((module, index) => <details className="sql-module" key={module.id} open={index === 0}><summary aria-label={`Open ${module.title}`}><span className="reference-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{module.title}</strong><small>{module.level} · {module.summary}</small></span></summary><div className="reference-answer"><ul>{module.points.map((point) => <li key={point}>{point}</li>)}</ul><pre><code>{module.code}</code></pre><Sources sources={module.sources} /></div></details>)}</div></section>}
    {active === 'rpgle' && <section><div className="reference-intro"><h3>Using SQL inside RPGLE programs</h3><p>Embedded SQL is a program lifecycle: set compile options, declare host variables, execute one-row or multi-row statements, inspect SQLSTATE and diagnostics, then commit or roll back deliberately.</p></div><div className="sql-module-grid">{data.rpgleGuide.map((module, index) => <details className="sql-module" key={module.title} open={index === 0}><summary aria-label={`Open ${module.title}`}><span className="reference-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{module.title}</strong><small>{module.summary}</small></span></summary><div className="reference-answer"><ul>{module.points.map((point) => <li key={point}>{point}</li>)}</ul><pre><code>{module.code}</code></pre></div></details>)}</div><Sources sources={data.sources.slice(0, 4)} /></section>}
    {active === 'files' && <section><div className="reference-intro"><h3>RPG file operation codebook</h3><p>Use this as a one-page lookup. The SQL column is a conceptual equivalent, not a promise that the two operations have identical locking, cursor, or error behavior.</p></div><div className="opcode-table-wrap"><table className="opcode-table"><thead><tr><th>Opcode</th><th>One-line definition</th><th>RPG example</th><th>SQL idea</th></tr></thead><tbody>{data.fileOps.map((item) => <tr key={item.opcode}><th scope="row"><code>{item.opcode}</code></th><td>{item.meaning}</td><td><pre aria-label={`${item.opcode} RPG example`}><code>{item.example}</code></pre></td><td><pre aria-label={`${item.opcode} SQL idea`}><code>{item.sql}</code></pre></td></tr>)}</tbody></table></div><Sources sources={data.sources.slice(0, 3)} /></section>}
    {active === 'compare' && <section><div className="reference-intro"><h3>RPG I/O and SQL side by side</h3><p>Start with the intent, then choose the interface that fits the application. Pay attention to ordering, not-found behavior, locks, nulls, and affected-row counts.</p></div><div className="comparison-list">{data.comparisons.map((item) => <article key={item.rpg} className="comparison-card"><div className="comparison-heading"><strong>{item.when}</strong><span>Intent</span></div><div className="comparison-code"><div><small>RPG operation</small><pre><code>{item.rpg}</code></pre></div><div><small>SQL pattern</small><pre><code>{item.sql}</code></pre></div></div><p>{item.note}</p></article>)}</div><Sources sources={data.sources.slice(0, 3)} /></section>}
    {active === 'errors' && <section><div className="reference-intro"><h3>Common SQL and file-operation errors</h3><p>Use the symptom to choose evidence first. Preserve the original diagnostic and verify the final behavior with a normal case, a boundary case, and a failure case.</p></div><div className="error-grid">{data.errors.map((item) => <details className="error-card" key={item.name}><summary aria-label={`Open error guidance for ${item.name}`}><code>{item.name}</code><span>{item.meaning}</span></summary><div><strong>What to do next</strong><p>{item.action}</p></div></details>)}</div><Sources sources={data.sources.slice(0, 3)} /></section>}
    <p className="reference-disclaimer">Examples are for learning and interview preparation. Verify syntax, release behavior, authority, journaling, locking, and deployment steps against current IBM documentation and a development partition before implementation.</p>
  </article>;
}
