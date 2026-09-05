# Research and reference policy

Research completed on 5 September 2026.

The question bank is original educational writing. Public interview collections were used to inspect topic coverage; their technical answers were not copied or treated as authoritative. Technical references are IBM documentation, IBM Support, and IBM Redbooks. Every chapter has direct official links in both the website and the generated Markdown.

## Interview coverage cross-check

- [AS400 and SQL Tricks — interview collection, part 1](https://www.as400andsqltricks.com/2021/11/as400-interview-questions-part-1.html)
- [IBMiSkills — interview questions, part 4](https://ibmiskills.com/as400-interview-questions-part-4-1)

The cross-check led to explicit coverage of user-controlled OPEN/USROPN, subfile size/page and changed-record controls, array handling, SQL procedures, constraints/triggers, and legacy-versus-ILE distinctions. Older interview collections can include obsolete or oversimplified claims; the guide calls out missing assumptions instead of reproducing them.

## Official reference areas

- IBM i object and IFS concepts; work management and job scheduling.
- ILE RPG file operations, record locking, language and procedure semantics.
- Db2 for i SQL reference, SQL programming, isolation, and commitment scope.
- ILE binder functions, binder language, export signatures, and activation groups.
- Data-queue and data-area interfaces; program messages and CL monitoring.
- IBM authority documentation, operational diagnostics, and SQL performance tools.
- IBM Integrated Web Services documentation and modernization Redbooks.

Detailed URLs are maintained with the chapter that uses them in `content/chapters.json`. This keeps references close to the material rather than leaving readers with a generic IBM homepage.

## Version and review notes

The references include IBM i 7.4, 7.5, and 7.6 documentation and older IBM Redbooks for established concepts. A research date is not a promise that every linked page was published that day. Do not translate Db2 for z/OS or Db2 LUW details into Db2 for i without platform-specific verification.

Pay special attention when changing explanations about lock duration, WITH HOLD, parameter passing, activation attributes, commitment scope, authority adoption, or queue delivery. These areas depend on context. Keep the question’s assumptions explicit and test examples on the intended IBM i release before operational use.

## Automated and manual validation boundaries

Content and quiz structure, grading, saved-progress parsing, TypeScript, lint, and production bundling are checked locally. These checks do not prove every IBM i command example runs on every release. No live IBM i system was used. The authoring process reviewed the technical explanations and linked official references; subsequent subject-matter corrections should update the canonical JSON and regenerate the Markdown guide.
