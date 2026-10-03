# Validation record

Updated: 3 October 2026.

- Content: 200 study questions plus 56 common issue guides in 32 chapters, 44 coding labs, and 9 learning paths. Every chapter retains its existing MCQ checkpoint and direct IBM references. Each common issue now has three diagnostic steps and a verification check; questions progress by difficulty.
- Tests: complete-bank structural checks; scoring for correct, incorrect, partial, and unanswered submissions; perfect-score checkpoint rule; malformed/outdated progress parsing.
- TypeScript, authored-file lint, and both static and Vinext production builds passed.
- Browser checks: the common-issues route displayed all 56 guides; its topic route displayed eight authority guides; symptom search narrowed results to one matching CPF5027 guide; an issue expanded with diagnostic steps and IBM links. The 390px viewport had no horizontal overflow. Existing checkpoint IDs, question IDs, and quiz arrays were preserved to retain browser progress. The static `/common-issues/` page includes the same issue steps and references.
- IBM i examples were not executed on an IBM i host. They are explanatory fragments and require environment-specific validation.

## Dependency note

The pinned generated Sites scaffold reports 11 npm audit advisories (8 high, 2 moderate, 1 low) in its server/development dependency chain, including Vinext, React Server Components, Vite, and Cloudflare tooling. The published site consists of static browser assets and does not deploy those servers. The scaffold versions are retained rather than applying unreviewed framework upgrades. Review and update that toolchain before exposing a development server or using a server-backed deployment. `npm audit` provides current details.
