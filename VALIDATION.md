# Validation record

Date: 5 September 2026.

- Content: 224 questions in 31 chapters, 24 coding labs, and 9 learning paths; every chapter has at least five MCQs (162 total) and direct IBM references. Questions progress by difficulty within each chapter.
- Tests: complete-bank structural checks; scoring for correct, incorrect, partial, and unanswered submissions; perfect-score checkpoint rule; malformed/outdated progress parsing.
- TypeScript, authored-file lint, and both static and Vinext production builds passed.
- Browser checks: expandable answers, checkpoint feedback with Continue locked/unlocked, retry reset, persisted chapter completion after reload, and the learning-path checkpoint gate. Mobile layout, drawer, index search, and crawlable lesson output were inspected.
- IBM i examples were not executed on an IBM i host. They are explanatory fragments and require environment-specific validation.

## Dependency note

The pinned generated Sites scaffold reports 11 npm audit advisories (8 high, 2 moderate, 1 low) in its server/development dependency chain, including Vinext, React Server Components, Vite, and Cloudflare tooling. The published site consists of static browser assets and does not deploy those servers. The scaffold versions are retained rather than applying unreviewed framework upgrades. Review and update that toolchain before exposing a development server or using a server-backed deployment. `npm audit` provides current details.
