# Quick Revision coverage

Quick Revision is an optional, collapsible reading aid. It never marks a lesson complete or writes to progress storage. Existing question IDs, quiz definitions, score rules and storage keys are unchanged.

## Coverage

- All 9 learning paths, immediately before their checkpoint.
- All 30 question chapters, plus Common Issues and the Code Lab overview, before their checkpoint.
- All 6 Common Issues category checkpoints.
- All 4 scenario cases and the code-decision drill page.
- All 6 SQL/file reference pages and both blog articles, at the end of their material.
- All 44 individual lab exercises, before the guided self-review. These reminders reuse each exercise's setup and test expectations so they cannot drift into a different task.
- The generated HTML readers and Markdown study documents include the same revision material where those pages exist.

## Editing a recap

Edit `content/revision-bites.json` using the existing route or checkpoint ID. Each curated recap contains 5–8 short takeaways, a small code/command example or labeled reasoning flow, a common mistake, and a practical question with expandable reasoning. Examples are fragments, not independently compiled programs.

The shared React presentation is `app/quick-revision.tsx`. Static HTML and Markdown rendering, plus exercise reminders, are in `lib/revision.mjs`. Do not add progress writes to these reading aids.

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run docs`, and `npm run build:netlify` after editing. The coverage test rejects missing or orphaned recap IDs. The build also checks that every standalone learning reader has a recap and that chapter/lesson recaps come before checkpoints.
