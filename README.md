# learn-as400

IBM i / AS400 developer learning and interview preparation: **244 explained questions**, **44 RPGLE and CL coding labs**, **31 chapters**, **9 learning paths**, and **172 interactive MCQs**.

- Topic navigation and an easy/intermediate/advanced question index with full-text search.
- Collapsible answers with reasoning, examples, failure cases, and interview pitfalls.
- A plain-English learning path with commands, flow diagrams, and fixed-format/fully free code comparisons.
- Graded MCQ checkpoints with per-answer explanations, retries, and a 100% pass gate for each chapter and learning path.
- A browser-local RPGLE/CL draft workspace with fixed/free format tabs, saved drafts, downloads, per-exercise structure-check progress, and a clear handoff to an IBM i run.
- Browser-local progress. Passing unlocks the guided Continue button; the topic index remains freely browsable.
- Direct IBM documentation and IBM Redbooks links at the end of every chapter.
- Responsive, keyboard-accessible interface with a mobile chapter drawer.
- Complete [Markdown study guide](docs/README.md) for reading on GitHub or offline.

[Website](https://learn-as400.netlify.app) · [GitHub repository](https://github.com/iNewTech/learn-as400)

## Run locally

Node.js 22.13 or newer and npm are required.

```sh
npm ci
npm run dev
```

Open the local URL printed by the server. For the static Netlify version:

```sh
npm run build:netlify
npm run preview:netlify
```

## Validate

```sh
npm test
npm run typecheck
npm run lint
npm run build:netlify
```

Tests cover the complete content inventory, unique identifiers, ordered difficulty, MCQ integrity, correct/wrong/unanswered grading, checkpoint scoring, and malformed saved progress. Lint covers authored application and build files; the bundled component catalog is retained as generated.

## Content and maintenance

`content/chapters.json`, `content/coding-exercises.json`, and `content/lessons.json` are the canonical content sources. Each chapter contains its title, topic group, difficulty, summary, explained questions, checkpoint MCQs, and official references. The coding chapter contains RPGLE and CL scenarios; RPG tasks pair fixed-format and fully free source, while CL tasks show command-oriented examples with requirements, hints, test cases, and IBM references. Question IDs are stable even when display order changes. Answer indexes are zero-based.

After editing content:

```sh
npm run docs
npm test
npm run build:netlify
```

The generated `docs/` pages use GitHub-supported `<details>` blocks. Keep the inventory assertions, README totals, and HTML description synchronized if the bank size changes. See [RESEARCH.md](RESEARCH.md) for source methodology and [DEPLOYMENT.md](DEPLOYMENT.md) for publishing.

## Learning path

1. Foundations: IBM i, objects, libraries, name resolution.
2. Data: native operations, DDS/PF/LF, Db2 SQL, embedded SQL/cursors.
3. Development: RPG IV/RPGLE, opcodes, procedures, CL/CLLE, subfiles and printing.
4. Work management: jobs, queues, subsystems, pools, batch, scheduling, logs.
5. ILE: modules, programs, service programs, binding, signatures, activation groups.
6. Messaging and transactions: data queues, data areas, message queues, journaling, locks.
7. Production: debugging, system operations, authorities, APIs, performance.
8. Interview drills: design scenarios, troubleshooting, and tricky assumptions.
9. Coding lab: file I/O, SQL, subfiles, ILE, queues, batch jobs, integration, and performance.

## Scope and limitations

Research date: **5 September 2026**. The guide covers stable concepts and modern practice; it is not an IBM certification syllabus or a claim about any employer’s exact questions. Linked IBM manuals identify their release; features and defaults can depend on compiler level, Technology Refresh, and PTFs. Check the target system before using examples.

Examples are explanatory fragments, not production-ready programs. They have not been compiled or executed on an IBM i host in this repository. The browser workspace checks source shape; it does not emulate or compile RPGLE/CL. Run the requirements and test cases on an IBM i development partition with the stated files and authorities. No IBM i server credentials are required to use the website. Progress and drafts stay in this browser and are not an authenticated examination record or synchronized across devices. If browser storage is unavailable, progress lasts for the current session.

The site is static and sends no quiz answers to a backend. IBM, IBM i, AS/400, Db2, and RPG names are used for identification. This is an independent guide, not affiliated with IBM.
