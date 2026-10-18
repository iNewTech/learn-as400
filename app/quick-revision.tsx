import bites from '@/content/revision-bites.json';

export type RevisionBite = {
  points: string[];
  mistake: string;
  scenario: string;
  answer: string;
  example?: { label: string; code: string };
};

/** Reading aid only: no progress, quiz or browser-storage side effects. */
export function QuickRevision({ pageId, bite }: { pageId?: string; bite?: RevisionBite }) {
  const content = bite || (bites as Record<string, RevisionBite>)[pageId || ''];
  if (!content) return null;
  return (
    <details className="quick-revision" data-revision={pageId || 'exercise'}>
      <summary>Quick Revision <span className="revision-duration">2-minute recap</span><span className="revision-chevron" aria-hidden="true">⌄</span></summary>
      <div className="revision-body">
        <p className="revision-intro">Use this recap to check what you remember before moving on.</p>
        <h3>Keep these in mind</h3>
        <ul>{content.points.map((point) => <li key={point}>{point}</li>)}</ul>
        {content.example && <><h3>{content.example.label}</h3><pre><code>{content.example.code}</code></pre></>}
        <p><strong>Common mistake:</strong> {content.mistake}</p>
        <div className="revision-scenario">
          <h3>Think it through</h3>
          <p>{content.scenario}</p>
          <details><summary>Show the reasoning</summary><p>{content.answer}</p></details>
        </div>
      </div>
    </details>
  );
}
