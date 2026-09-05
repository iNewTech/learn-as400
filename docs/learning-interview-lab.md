# Interview lab: design, troubleshoot and code

[Learning path index](README.md) · Advanced

This path uses simple explanations, safe code skeletons, and IBM i commands before the detailed question chapters.

## Outcomes

- Structure an answer around constraints, trade-offs, and evidence.
- Spot hidden failure windows in common IBM i designs.
- Practice code-first explanations in both fixed and free RPG.

## 1. Use a repeatable answer frame

For a design question, state the business goal and constraints first. Then name the object or service you would use, show the data and job flow, and explain authority, commitment, monitoring, and recovery. End with one trade-off and one test that would change your decision.

For a troubleshooting question, state the symptom you would measure, the first log or command you would inspect, and the safe mitigation. Interviewers are looking for a controlled investigation, not a list of commands.

**Flow**

1. Clarify the goal and constraints
2. Choose the smallest IBM i design that fits
3. Name failure, authority, and consistency behavior
4. Describe observability and recovery
5. Give a test and a measured trade-off

## 2. Find the hidden failure window

Tricky questions often hide an assumption: a library list is stable, a queue entry is processed once, a record is unlocked, a service program interface never changes, or a batch job can simply be rerun. Challenge the assumption and offer a safer design with an operator path.

When a requirement is ambiguous, state what you would ask before coding. A short clarifying question can prevent a technically correct answer from solving the wrong problem.

**A compact investigation checklist**

```cl
DSPJOB JOB(*) OPTION(*JOBLOG)
DSPLIBL
DSPOBJAUT OBJ(APPDATA/*ALL) OBJTYPE(*ALL)
WRKACTJOB SBS(*ALL)
DSPJOBQ JOBQ(APPDATA/BATCHQ)
```

## 3. Explain code in both RPG styles

The fixed and fully free examples should express the same business behavior. In an interview, describe the input, lookup, status check, update, and test cases before showing source. Mention what you would add in production: prototypes, error handling, commitment scope, logging, and a concurrency decision.

Keep the code skeleton intentionally small. The goal is to show safe control flow and the questions you would resolve with the team, not to pretend a five-line snippet is a complete application.

**Fixed format**

```rpgle
FProducts        UF   E             K DISK
C     productId    CHAIN     ProductRec
C                   IF        %FOUND(Products) AND newQty >= 0
C                   EVAL      quantity = newQty
C                   UPDATE    ProductRec
C                   ENDIF
```

**Fully free**

```rpgle
**FREE
dcl-f Products keyed usage(*update);
chain productId ProductRec;
if %found(Products) and newQty >= 0;
  quantity = newQty;
  update ProductRec;
endif;
```

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [Real-world design scenarios](real-world-scenarios.md), [Production troubleshooting drills](troubleshooting.md), [Tricky questions & common myths](tricky-questions.md), [Common IBM i issues & fixes](common-issues.md), [Coding lab: RPGLE and CL from fixed to free form](coding-exercises.md).

## IBM documentation

- [IBM: Using COMMIT](https://www.ibm.com/docs/en/i/7.4.0?topic=control-using-commit-operation)
- [IBM: Isolation level](https://www.ibm.com/docs/en/i/7.5.0?topic=concepts-isolation-level)
- [IBM: Create Data Queue](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fcrtdtaq.html)
- [IBM: Integrated web services articles](https://www.ibm.com/support/pages/integrated-web-services-articles)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM Docs: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM: Service program signature](https://www.ibm.com/docs/en/i/7.6?topic=language-signature)
- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)
- [IBM: Commitment definitions and activation groups](https://www.ibm.com/docs/en/i/7.4.0?topic=scoping-commitment-definitions-activation-groups)
- [IBM Docs: Monitor Message (MONMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fmonmsg.html)
- [IBM Docs: Embedded SQL programming](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)
- [IBM: Object and library authority](https://www.ibm.com/docs/ssw_ibm_i_74/rzamv/rzamvundhowobjandlibauthtog.htm)
- [IBM Docs: RPG IV Reference](https://www.ibm.com/docs/en/i/7.4.0?topic=languages-rpg-iv)
- [IBM Docs: RPG built-in functions](https://www.ibm.com/docs/en/i/7.4.0?topic=functions-built-in)
- [IBM Docs: RPG procedures and prototypes](https://www.ibm.com/docs/en/i/7.5.0?topic=parameters-prototypes)
- [IBM Docs: CL programming](https://www.ibm.com/docs/en/i/7.5.0?topic=language-control-language)
- [IBM Docs: Submit Job (SBMJOB)](https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75%2Fcl%2Fsbmjob.html)
- [IBM Docs: Override with Database File (OVRDBF)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fovrdbf.html)
- [IBM Docs: Data queues](https://www.ibm.com/docs/en/i/7.4.0?topic=apis-data-queues)

[← Previous path](learning-production-engineering.md)
