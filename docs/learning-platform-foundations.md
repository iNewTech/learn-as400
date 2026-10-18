# IBM i mental model: objects, libraries and the IFS

[Learning path index](README.md) · Easy

Learn AS400 and IBM i basics with practical examples of objects, library lists, QTEMP, source members and IFS paths, plus a first troubleshooting checklist.

Updated: 2026-10-11.

## Outcomes

- Describe how an IBM i job finds an object.
- Choose the right place for an IBM i object, source member, or stream file.
- Explain why a library-list problem can look like a missing-object problem.

## 1. Start with the three namespaces

IBM i manages many resources as typed objects. A database file, program, queue, user profile, and job description have an object type and an owner. The type matters: a program name can be the same as a file name because their object types are different.

Libraries group objects in the IBM i object namespace. The integrated file system (IFS) is the path-based file system used for stream files, source archives, logs, and integration payloads. A good developer can move between both views without confusing an IFS path with a library-qualified object name.

- Library object: `APPDATA/CUSTOMER` (object CUSTOMER in library APPDATA).
- IFS stream file: `/home/app/import/customer.json` (a path, not a library object).
- Object authority is checked before an operation is allowed; a path or name alone never grants access.

**Useful orientation commands**

```text
DSPLIBL
WRKOBJ OBJ(APPDATA/*ALL) OBJTYPE(*ALL)
DSPLNK OBJ('/home/app')
```

**Flow**

1. A user starts a job
2. The job receives a library list and authority context
3. IBM i resolves the name to an object or IFS path
4. Authority and object type are checked
5. The operation runs or a diagnostic message is recorded

## 2. Treat the library list as a search path

For object references resolved through *LIBL, IBM i searches the system portion, product libraries, current library and user portion in that order. Two jobs can resolve the same unqualified name to different objects because their environments differ. Explicitly qualified references and file overrides must also be checked when investigating which object an application uses.

Qualify names in deployment scripts and in high-risk maintenance code. Use the library list for a deliberate application environment, not as a hidden dependency that only works from one developer profile.

**CL setup skeleton**

```text
PGM
  CHGLIBL LIBL(QGPL QTEMP APPDATA)
  CALL PGM(APPDATA/ORDENTRY)
ENDPGM
```

## 3. Keep source, objects and deployment evidence distinct

A source physical file member is editable source held in a library object. A compiled program or service program is a separate object produced from that source. An IFS stream file is useful for Git checkouts, JSON, certificates, and build artifacts, but it does not replace the compiled object used by a running job.

During a release, record the source version, compiler command, target library, and object authority. That small trail makes a production question answerable: what was built, from which source, and where was it installed?

**Typical build boundary**

```text
CRTSRCPF FILE(APPDATA/QRPGLESRC) RCDLEN(112)
ADDPFM FILE(APPDATA/QRPGLESRC) MBR(ORDENTRY)
CRTSQLRPGI OBJ(APPDATA/ORDENTRY) SRCFILE(APPDATA/QRPGLESRC) SRCMBR(ORDENTRY)
```

## 4. AS400 basics: follow one customer enquiry through IBM i

If you searched for AS400 programming, AS/400 commands or iSeries development, start by learning the IBM i environment your application runs in. Teams still use those older names in application documentation and job descriptions. In this guide, IBM i identifies the operating-system environment; RPGLE, CL and SQL are ways to write instructions for it. A 5250 screen is one interface to an application. The screen alone does not tell you where its data or business rules live.

Imagine that an operator enters customer 1001 on an enquiry screen. The application calls a program, the program reads a database file, and the job carries the identity and environment used for that work. Your first investigation is therefore a small map: which program, which library, which file, and which job? Write those four answers down before opening source code. A screen label such as Customer Enquiry is not necessarily the compiled program name.

Use object descriptions to confirm the map. A successful display proves you found an object of the requested type in that library. It does not prove that the running screen used that object or that its business data is correct.

**Inspect an example application without running it**

```text
DSPOBJD OBJ(TESTAPP/CUSTENQ) OBJTYPE(*PGM) DETAIL(*FULL)
DSPOBJD OBJ(TESTDATA/CUSTOMER) OBJTYPE(*FILE) DETAIL(*FULL)
DSPJOB JOB(*) OPTION(*PGMSTK)
```

## 5. Worked library-list example: the right name in the wrong library

Suppose TESTDATA/CUSTOMER contains ten test customers and PRODDATA/CUSTOMER contains live customers. An unqualified native-file reference may find either object depending on the job environment. Looking only at the source name CUSTOMER misses the important part of the problem. Record the resolved library from the job and compare it with the library intended for that test.

The search order includes the system portion, product libraries, the current library and then the user portion. This means placing TESTDATA first in the user portion is not a universal guarantee that it wins every lookup. Check all portions, any file overrides and explicit names in the program. A fully qualified production reference is not redirected just because you changed the library list.

The example below compares the two candidates directly. The expected evidence is two different qualified objects, followed by the failing job’s actual environment. Fix the application startup or test configuration that introduced the mismatch, then repeat the same enquiry. Avoid copying production objects into a random library simply to make the missing-object message disappear.

**Compare candidate objects and the current job environment**

```text
DSPLIBL
DSPOBJD OBJ(TESTDATA/CUSTOMER) OBJTYPE(*FILE)
DSPOBJD OBJ(PRODDATA/CUSTOMER) OBJTYPE(*FILE)
DSPJOB JOB(*) OPTION(*FILOVR)
```

## 6. Why your QTEMP file disappears in a submitted job

A developer creates a temporary work file, submits an export job, and the export cannot find that file. Both programs say QTEMP/WORKFILE, so the source appears consistent. The missing detail is that each job owns its own QTEMP. The submitted job sees its own library, not the submitting session’s temporary objects. Ending the owning job also removes its QTEMP objects.

Choose the lifetime you actually need. Build the temporary file inside the export job when it is only scratch space. Use an application-controlled persistent staging table with a run identifier when two jobs must exchange records. Give that table an explicit cleanup and access policy. The word temporary in a business requirement does not automatically mean the IBM i library QTEMP.

A useful test uses two separate jobs and records both qualified job names. Create or inspect the work object in the first job, then inspect from the second. The expected difference is the teaching point. Do not use this experiment to conclude that QTEMP is a suitable recovery store for work that must survive job completion.

**Inspect this job’s own temporary library**

```text
DSPLIB LIB(QTEMP)
DSPJOB JOB(*) OPTION(*STSA)
```

## 7. Read an object name, a source member and an IFS path correctly

A release ticket might mention TESTAPP/ORDENTRY, TESTSRC/QRPGLESRC member ORDENTRY, and /home/dev/orders/ordentry.rpgle. Those are three different references: a compiled object, source inside a source physical file, and a stream file. Decide which one a tool expects before supplying the name. A compiler option for a source member and one for a stream file are not interchangeable.

For a first application inventory, record each program’s object type and library, where its editable source is maintained, and how the build connects them. If the source changed yesterday but the object was last built last month, checking the source alone cannot explain today’s running behaviour. Object timestamps are useful clues; your build record or release commit provides the stronger connection to a source version.

The practical outcome is a short, repeatable handover: another developer can find the object, locate its source, identify the build target and inspect the job that calls it. That is more valuable than memorising a long command list without knowing which namespace each command uses.

**Inspect member-based source and path-based source**

```text
DSPPFM FILE(TESTSRC/QRPGLESRC) MBR(ORDENTRY)
DSPLNK OBJ('/home/dev/orders/ordentry.rpgle')
DSPOBJD OBJ(TESTAPP/ORDENTRY) OBJTYPE(*PGM) DETAIL(*FULL)
```

<details>
<summary>Quick Revision · 2-minute recap</summary>

### Keep these in mind

- IBM i is the operating system; Power is the hardware platform.
- An object has a name, library and type; an IFS stream file has a path.
- Source members and compiled programs are separate artifacts.
- Unqualified names can resolve differently in different jobs.
- Check the job environment and authority before blaming the code.

**Remember this pattern**

```text
DSPLIBL
WRKOBJ OBJ(APPDATA/CUSTOMER) OBJTYPE(*FILE)
```

**Common mistake:** Do not assume an interactive test uses the same library list as batch.

**Think it through:** A program finds the wrong CUSTOMER file in batch. What do you inspect?

<details>
<summary>Show the reasoning</summary>

Compare the batch library list, overrides, qualified references and effective authority with the interactive job.

</details>

</details>

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [IBM i basics](ibm-i-basics.md), [Objects & library lists](objects-libraries.md).

## IBM documentation

- [IBM: Library lists and their search order](https://www.ibm.com/docs/en/i/7.4.0?topic=security-library-lists)
- [IBM: Display Object Description (DSPOBJD)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fdspobjd.html)
- [IBM: QTEMP library description and FAQs](https://www.ibm.com/support/pages/qtemp-library-description-and-other-faqs)
- [IBM: Library lists, current library and create commands](https://www.ibm.com/docs/en/i/7.6.0?topic=libraries-library-lists)
- [IBM: Display Job (DSPJOB)](https://www.ibm.com/docs/en/i/7.5.0?topic=d-display-job)
- [IBM: Integrated file system](https://www.ibm.com/docs/en/i/7.4.0?topic=system-integrated-file-ifs)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)

[Next path →](learning-data-and-files.md)
