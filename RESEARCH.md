# Research and reference policy

Interview research began on 5 September 2026; the common-issue audit was updated on 3 October 2026.

The question bank is original educational writing. Public interview collections were used to inspect topic coverage; their technical answers were not copied or treated as authoritative. Technical references are IBM documentation, IBM Support, and IBM Redbooks. Every chapter has direct official links in both the website and the generated Markdown.

## Interview coverage cross-check

- [AS400 and SQL Tricks — interview collection, part 1](https://www.as400andsqltricks.com/2021/11/as400-interview-questions-part-1.html)
- [IBMiSkills — interview questions, part 4](https://ibmiskills.com/as400-interview-questions-part-4-1)

The cross-check led to explicit coverage of user-controlled OPEN/USROPN, subfile size/page and changed-record controls, array handling, SQL procedures, constraints/triggers, and legacy-versus-ILE distinctions. Older interview collections can include obsolete or oversimplified claims; the guide calls out missing assumptions instead of reproducing them.

## Editorial coverage inspiration

The navigation and breadth audit also looked at [Go4AS400](https://www.go4as400.com/), [IT Jungle](https://www.itjungle.com/), [RPGPGM](https://www.rpgpgm.com/), and [Code400](https://code400.com/). These sites were used only to notice useful topic groupings and real-world problem shapes. No wording or examples were copied, and they are not technical authorities for this guide. Reader-facing references remain IBM documentation, IBM Support, and IBM Redbooks.

## Common-issue audit

The new [Common IBM i issues & fixes](docs/common-issues.md) chapter was shaped by a public Code400 forum audit. Representative threads covered MONMSG scope and message forwarding, CL `RCVF` end-of-file and keyed positioning, record-lock ownership, embedded SQL diagnostics, object-existence checks, and job-log investigation:

- [Code400 CLP/CLLE forum](https://code400.com/forum/forum/iseries-programming-languages/clp-clle/)
- [MONMSG and message families](https://code400.com/forum/forum/iseries-programming-languages/clp-clle/2543-monmsg)
- [Finding the job holding a record lock](https://code400.com/forum/forum/iseries-programming-languages/rpg-rpgle/159531-how-to-find-wich-program-lock-file-record)
- [Tracing SQL errors from a job log](https://code400.com/forum/forum/iseries-programming-languages/rpg-rpgle/149619-tracing-sql-errors-from-job-log-error-points-to-qsqrun2)
- [A missing RPG copy member during SQLRPGLE compilation](https://code400.com/forum/forum/iseries-programming-languages/rpg-rpgle/14594-error-while-compiling-sqlrpgle-program)
- [SQLRPGLE compiler errors after a build-command mismatch](https://code400.com/forum/forum/iseries-programming-languages/sql/146545-compile-error-sqlrpgle)
- [Data-queue receive wait behaviour](https://code400.com/forum/forum/iseries-programming-languages/rpg-rpgle/12034-qrcvdtaq-and-the-effect-of-wait-time)

These pages were used for symptom and topic discovery only. The 56 issue entries are original summaries and troubleshooting guidance for development, support, testing, and administration. Each entry links to IBM documentation for the technical answer. Forum replies can be release-specific, incomplete, or opinionated, so they were not copied or used as the authority for a recommendation. The October expansion adds compiler and embedded-SQL diagnostics, deployment and binding issues, schedules, job logs, data queues, data areas, journals, PTFs, display files, test isolation, authority, and batch limits.

## October 2026 learning expansion

On 11 October 2026, eight existing learning paths gained 32 original worked sections. The additions focus on concrete tasks: finding the correct file member, reading a composite-key range, validating join totals, handling NULLs and CTEs, guarding an inventory update, rounding decimals, sorting populated array elements, preserving service interfaces, diagnosing job waits, and recovering queue consumers. Examples state prerequisites and expected results. Direct IBM references are stored in `content/lessons.json` and rendered in the website and Markdown guide.

The review also corrected legacy examples for library-list order, `DSPFD TYPE(*BASATR)`, schedule entry names, escape-message construction, data-queue receive semantics, and SQL plan inspection. Shared-CTE behavior is explicitly release-sensitive, including IBM i 7.5's default capture behavior for multiply referenced CTEs. No example was compiled on an IBM i host.

Technical SEO changes follow Google's [helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [crawlable-link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), and [JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics). Page content and visible links are the focus; no search-volume claims or ranking guarantees are made.

## Official reference areas

- IBM i object and IFS concepts; work management and job scheduling.
- ILE RPG file operations, record locking, language and procedure semantics.
- Db2 for i SQL reference, SQL programming, isolation, and commitment scope.
- ILE binder functions, binder language, export signatures, and activation groups.
- Data-queue and data-area interfaces; program messages and CL monitoring.
- IBM authority documentation, operational diagnostics, and SQL performance tools.
- IBM Integrated Web Services documentation and modernization Redbooks.

Detailed URLs are maintained with the chapter that uses them in `content/chapters.json`, `content/common-issues.json`, and `content/coding-exercises.json`. This keeps references close to the material rather than leaving readers with a generic IBM homepage.

## Version and review notes

The references include IBM i 7.4, 7.5, and 7.6 documentation and older IBM Redbooks for established concepts. A research date is not a promise that every linked page was published that day. Do not translate Db2 for z/OS or Db2 LUW details into Db2 for i without platform-specific verification.

Pay special attention when changing explanations about lock duration, WITH HOLD, parameter passing, activation attributes, commitment scope, authority adoption, or queue delivery. These areas depend on context. Keep the question’s assumptions explicit and test examples on the intended IBM i release before operational use.

## Automated and manual validation boundaries

Content and quiz structure, grading, saved-progress parsing, TypeScript, lint, and production bundling are checked locally. These checks do not prove every IBM i command example runs on every release. No live IBM i system was used. The authoring process reviewed the technical explanations and linked official references; subsequent subject-matter corrections should update the canonical JSON and regenerate the Markdown guide.
