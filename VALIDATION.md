# Validation record

Updated: 11 October 2026.

- Content: 200 study questions plus 56 common issue guides in 32 chapters, 44 coding labs, and 9 learning paths. Every chapter retains its existing MCQ checkpoint and direct IBM references. Each common issue now has three diagnostic steps and a verification check; questions progress by difficulty.
- Tests: complete-bank structural checks; scoring for correct, incorrect, partial, and unanswered submissions; perfect-score checkpoint rule; malformed/outdated progress parsing.
- TypeScript, authored-file lint, and both static and Vinext production builds passed.
- Browser checks: the common-issues route displayed all 56 guides; its topic route displayed eight authority guides; symptom search narrowed results to one matching CPF5027 guide; an issue expanded with diagnostic steps and IBM links. The 390px viewport had no horizontal overflow. Existing checkpoint IDs, question IDs, and quiz arrays were preserved to retain browser progress. The static `/common-issues/` page includes the same issue steps and references.
- IBM i examples were not executed on an IBM i host. They are explanatory fragments and require environment-specific validation.

## October learning and SEO update

- Eight core learning paths gained 32 worked sections, with examples, expected outcomes, troubleshooting cases and direct IBM references. Lesson IDs, chapter IDs, question IDs, chapter quiz arrays, and lesson-to-chapter mappings were compared with the previous revision and remain unchanged.
- All 23 automated tests passed. TypeScript, authored-file lint, the Netlify production build, and whitespace checks passed. Generated Markdown was refreshed.
- The build now validates 52 real HTML URLs: unique titles and descriptions, one self-canonical and main heading per page, JSON-LD syntax, existing internal-link targets, valid reader anchors, complete topic-library links and the sitemap reference in robots.txt.
- Browser checks covered the rendered homepage's real tutorial links, normal-click navigation into interactive lessons, the collapsible lesson index, static reader anchors, and the static reader's return link to interactive practice. The static checkpoint uses the same question selection as the interactive lesson.
- At a 390px phone viewport, the topic library and RPGLE guide fit the viewport. Paired code panels were corrected to stay inside their cards with horizontal scrolling limited to the code; no page-wide overflow was present. Desktop section navigation landed on the selected example without changing the lesson route.
- Search Console submission and Google indexing/ranking are outside local build verification. See [SEO and indexing](docs/seo-and-indexing.md). IBM i examples were reviewed against documentation but were not compiled or executed on an IBM i host.

## Dependency note

The pinned generated Sites scaffold reports 11 npm audit advisories (8 high, 2 moderate, 1 low) in its server/development dependency chain, including Vinext, React Server Components, Vite, and Cloudflare tooling. The published site consists of static browser assets and does not deploy those servers. The scaffold versions are retained rather than applying unreviewed framework upgrades. Review and update that toolchain before exposing a development server or using a server-backed deployment. `npm audit` provides current details.
