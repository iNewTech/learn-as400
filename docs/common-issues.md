# Common IBM i issues & fixes

[Question index](README.md) · Troubleshooting · All levels

A symptom-first playbook for the problems IBM i developers meet in development, batch, and production. Use the evidence, then choose the smallest safe fix.

## 1. A program fails with CPF9801 (object not found). What should you check first?

**Easy** · Object discovery

<details>
<summary>Explain the answer</summary>

Capture the complete message, including the object name, object type, and library context. Then confirm the object exists with the appropriate display command and check whether the failing job is resolving an unqualified name through its library list. A program can work interactively and fail in batch because the two jobs have different libraries or current libraries.

Compare the job's library list, current library, product libraries, and any overrides with a successful job. If the dependency is intentional, initialise and validate the environment in one wrapper or qualify the critical object. Avoid adding random libraries globally; that can make the next deployment resolve an unintended object.

**Example**

```cl
DSPLIBL
DSPOBJD OBJ(APP/POSTORD) OBJTYPE(*PGM)
```

**Interview pitfall:** The message may name a dependent object, so checking only the top-level program can hide the real missing library.

**IBM documentation for this exercise**

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: Object and library authority](https://www.ibm.com/docs/ssw_ibm_i_74/rzamv/rzamvundhowobjandlibauthtog.htm)

</details>

## 2. The same call works in ACS but runs an older program in batch. Why?

**Easy** · Library lists

<details>
<summary>Explain the answer</summary>

Unqualified names are resolved in the context of the job. ACS, a submitted job, an HTTP server job, and a service job can have different user libraries, current libraries, product libraries, and environment setup. The source may be identical while the resolved program object is not. First capture the qualified object that actually ran.

Use a controlled startup or wrapper to establish the approved library list, and log the resolved library and object type at a useful diagnostic level. Qualify administrative and migration commands. Keep business code independent of environment-specific library names where possible, and test both interactive and submitted paths.

**Example**

```cl
DSPJOB OPTION(*LIBL)
DSPLIBL
DSPPGM PGM(APP/POSTORD)
```

**Interview pitfall:** A successful CALL proves only that some object was found; it does not prove that the intended release ran.

**IBM documentation for this exercise**

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)

</details>

## 3. A create command fails with CPF2105 because the object already exists. How do you fix it safely?

**Easy** · Object lifecycle

<details>
<summary>Explain the answer</summary>

Treat CPF2105 as a deployment decision, not an instruction to delete blindly. Identify the existing object's type, owner, authority, dependencies, and whether another job is using it. For a repeatable deployment, prefer an explicit replace or versioned object strategy supported by the command and your change process.

If replacement is required, take a backup or save, coordinate the object lock and active users, and recreate or replace with the expected owner and authority. For temporary work objects, use a job-private name or QTEMP. Log the decision so a later operator can distinguish an intentional rerun from an unsafe cleanup.

**Example**

```cl
DSPOBJD OBJ(APP/WORK) OBJTYPE(*ALL)
WRKOBJLCK APP/WORK *ALL
```

**Interview pitfall:** DLTOBJ or DLTF can remove a valid production object and its data; existence checks must include object type and purpose.

**IBM documentation for this exercise**

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: Object and library authority](https://www.ibm.com/docs/ssw_ibm_i_74/rzamv/rzamvundhowobjandlibauthtog.htm)

</details>

## 4. What usually causes a record-format or level-check error after a file change?

**Easy** · Record formats

<details>
<summary>Explain the answer</summary>

A program was compiled against a record format or level that no longer matches the file object it opens. Check the message details, the file and record-format level, the program's compile listing, and the object actually opened at runtime. A source change alone does not refresh an existing program object.

Recompile dependent programs in the correct library and deployment order, then test the path that opens the file. For a planned schema change, identify logical files, views, triggers, constraints, and service programs that depend on the format. Do not suppress a level check merely to make an incompatible object run.

**Example**

```cl
DSPFD FILE(APP/ORDERS) TYPE(*RCDFMT)
DSPPGMREF PGM(APP/POSTORD)
```

**Interview pitfall:** Recompiling the source member in the wrong source file or library leaves the running program unchanged.

**IBM documentation for this exercise**

- [IBM: Physical and logical files](https://www.ibm.com/docs/en/i/7.4.0?topic=program-physical-files-logical-files)
- [IBM: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)

</details>

## 5. Why does MONMSG CPF0000 sometimes fail to catch the problem you see?

**Easy** · CL message handling

<details>
<summary>Explain the answer</summary>

MONMSG matches message identifiers and scopes. CPF0000 is a generic CPF pattern; it does not automatically match every message family, machine exception, inquiry message, or a message that has already been transformed into a function check. A command-level monitor must also be placed immediately after the command whose failure it is intended to handle.

Monitor the specific expected condition at command level and keep a narrow program-level safety monitor for unexpected errors. In an error path, receive and forward the original exception details, preserve the job log context, and return a meaningful status to the caller. Test both diagnostic and escape message paths.

**Example**

```cl
CHKOBJ OBJ(APP/POSTORD) OBJTYPE(*PGM)
MONMSG MSGID(CPF9801) EXEC(GOTO CMDLBL(NOTFOUND))
```

**Interview pitfall:** A broad monitor that ignores every CPF message can turn a failed update into a false success.

**IBM documentation for this exercise**

- [IBM: Monitor Message (MONMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fmonmsg.html)
- [IBM: Send Program Message](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fsndpgmmsg.html)

</details>

## 6. A CLLE RCVF loop ends unexpectedly. How do you recognise end of file?

**Easy** · CL file input

<details>
<summary>Explain the answer</summary>

RCVF signals that no more records are available through the CPF0864 end-of-file message. The normal loop pattern is to monitor that condition immediately after RCVF, branch to a controlled end label, and process each record only when the receive succeeded. The declared file, record format, and OPNID must match the open operation.

Before changing the loop, verify the file override, member, position, format name, and whether another command changed the open data path. Keep end-of-file handling separate from an actual I/O failure. If a keyed position is used, confirm whether the requested key is exact or allows the next greater record.

**Example**

```cl
RCVF OPNID(INFILE)
MONMSG MSGID(CPF0864) EXEC(GOTO CMDLBL(EOF))
```

**Interview pitfall:** Treating CPF0864 as a generic error can cause a valid batch completion to be reported as a failure.

**IBM documentation for this exercise**

- [IBM: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM: Monitor Message (MONMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fmonmsg.html)

</details>

## 7. A batch job is in MSGW. What should an operator or developer do first?

**Easy** · Job messages

<details>
<summary>Explain the answer</summary>

Inspect the waiting message and its second-level text before replying. MSGW means the job is waiting for a reply or for message handling; it does not identify the correct response by itself. Determine the command or program that sent it, whether the request is safe to retry, and whether an operator policy already defines the response.

For recurring conditions, fix the underlying configuration or add deliberate error handling. In CL, monitor expected messages and send useful context to the caller or an operator queue. For production jobs, retain enough job-log detail to correlate the message with input, job identity, and transaction state before choosing retry, cancel, or a corrected rerun.

**Example**

```cl
WRKACTJOB SBS(*ALL)
DSPJOB JOB(123456/USER/BATCH) OPTION(*JOBLOG)
```

**Interview pitfall:** Replying with 'I' or 'R' without understanding the message can duplicate work or bypass a required recovery step.

**IBM documentation for this exercise**

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: Send Program Message](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fsndpgmmsg.html)

</details>

## 8. The object exists, but the job receives an authority failure. What is the correct diagnosis?

**Easy** · Authority

<details>
<summary>Explain the answer</summary>

Separate object authority, library authority, data authority, and authority to the path or dependent object. The user may be able to see an object but not use it, update its records, or traverse its library. Capture the failing qualified name and object type, then inspect the effective authority for the actual user and job.

Choose the least privilege that permits the operation. Correct the deployment owner, private/public authority, group profile, or an explicitly approved adopted-authority boundary. Test under the same profile and job attributes as production. Avoid granting *ALLOBJ or making every library public as a debugging shortcut.

**Example**

```cl
DSPOBJAUT OBJ(APP/ORDERS) OBJTYPE(*FILE)
DSPAUTUSR USRPRF(APPUSER)
```

**Interview pitfall:** Being able to run a program does not mean the caller has authority to every object the program touches.

**IBM documentation for this exercise**

- [IBM: Object and library authority](https://www.ibm.com/docs/ssw_ibm_i_74/rzamv/rzamvundhowobjandlibauthtog.htm)
- [IBM: Authority options for SQL tuning](https://www.ibm.com/docs/ssw_ibm_i_74/rzahf/rzahfauthopt.htm)

</details>

## 9. How do you investigate CPF5026 or CPF5032 record-lock errors?

**Intermediate** · Record locks

<details>
<summary>Explain the answer</summary>

First identify the file, member, record or key, and the job that reported the message. Then inspect active locks and the owning job with the appropriate work-management or database services. A lock may be held by another interactive job, a long-running batch job, an open-for-update read, or an uncommitted transaction.

Decide whether the correct fix is to wait, roll back or commit, close or unlock the record, end a failed job, or change the access pattern. Use read-only SQL cursors when no update is intended and keep transactions short. Never kill an unknown job until you understand its business and recovery state.

**Example**

```cl
DSPRCDLCK FILE(APP/ORDERS) MBR(*FIRST)
SELECT * FROM QSYS2.RECORD_LOCK_INFO WHERE TABLE_SCHEMA = 'APP';
```

**Interview pitfall:** The job reporting the lock is not necessarily the job holding it; inspect the lock owner before changing code.

**IBM documentation for this exercise**

- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)
- [IBM: Record lock information service](https://www.ibm.com/docs/en/i/7.6.0?topic=services-record-lock-info-view)

</details>

## 10. An embedded SQL SELECT finds no row. Why might the RPG program appear to continue normally?

**Intermediate** · SQL no-data conditions

<details>
<summary>Explain the answer</summary>

A no-row result is a defined SQL condition, commonly SQLSTATE 02000 or SQLCODE +100. It is different from a syntax or connection failure. Embedded SQL updates the SQL communication area or declared diagnostics, so the program must test the condition immediately and decide whether 'not found' is expected for that operation.

Handle the no-data path explicitly: initialise output fields, set a not-found status, or branch to the next input item. For a cursor, distinguish no row on FETCH from an actual error and close the cursor in both normal and error paths. Do not rely on old SQLCODE values from a previous statement.

**Example**

```cl
exec sql
  select status into :status from APP/ORDERS where order_id = :orderId;
// Check SQLSTATE or SQLCODE here.
```

**Interview pitfall:** A stale host variable can look like a successful lookup when no row was returned.

**IBM documentation for this exercise**

- [IBM: Db2 for i SQL reference (7.4)](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)
- [IBM: SQL programming guide](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafypdf.pdf)

</details>

## 11. Why does an SQLRPGLE statement fail when a nullable column is assigned to a non-nullable host variable?

**Intermediate** · SQL NULL values

<details>
<summary>Explain the answer</summary>

SQL NULL is not the same as a blank, zero, or default value. If a SELECT can return NULL and the host variable has no null-indicator support, Db2 cannot safely represent the result and reports a null-assignment condition such as SQLCODE -305. Define the business meaning of missing data before choosing a fallback.

Use a correctly typed null indicator or an SQL expression such as COALESCE when a default is genuinely correct. Check indicators after every statement that can return NULL and avoid silently converting an unknown value into a valid-looking value. Test both NULL and non-NULL rows, including inserts and updates.

**Example**

```cl
exec sql
  select phone, :phoneNullInd into :phone :phoneNullInd
    from APP/CUSTOMER where customer_id = :customerId;
```

**Interview pitfall:** COALESCE hides the distinction between missing and intentionally empty data if the domain has both meanings.

**IBM documentation for this exercise**

- [IBM: Db2 for i SQL reference (7.4)](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)

</details>

## 12. A query works in Run SQL Scripts but fails in embedded SQL with a conversion error. What is different?

**Intermediate** · SQL conversion errors

<details>
<summary>Explain the answer</summary>

The client and the embedded program may use different host-variable types, CCSIDs, date formats, decimal precision, naming conventions, or precompiler options. A literal in ACS can be implicitly cast while an RPG packed or character variable cannot. Read the full SQL message and identify the exact expression or target column before changing the query.

Make conversions explicit with compatible casts and correctly sized host variables. Validate packed-decimal data before arithmetic, use typed date/time values, and define character encoding at the integration boundary. Re-precompile and compile the actual source member that the running program uses, then test boundary values rather than only a happy-path row.

**Example**

```cl
select cast(:amount as decimal(11,2)) from SYSIBM.SYSDUMMY1;
// Confirm the RPG host field precision and CCSID.
```

**Interview pitfall:** Changing a client-side display format does not repair invalid data already stored in a numeric column.

**IBM documentation for this exercise**

- [IBM: Db2 for i SQL reference (7.4)](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)
- [IBM: SQL programming guide](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafypdf.pdf)

</details>

## 13. What is a safe response to SQLCODE -911 or -913 during a batch update?

**Intermediate** · SQL concurrency

<details>
<summary>Explain the answer</summary>

These conditions indicate a deadlock or timeout decision made by the database manager. Do not immediately rerun the entire batch: determine whether the unit of work was rolled back, whether a partial external side effect occurred, and which objects or transactions were involved. The job log and SQL diagnostics are part of the incident evidence.

Reduce the conflict window by using a consistent access order, short transactions, appropriate indexes, and a deliberate isolation level. Retry only idempotent units with bounded backoff and a duplicate-protection key. If the business operation cannot be retried safely, place it in a recovery queue for review instead of guessing.

**Example**

```cl
Monitor SQLSTATE/SQLCODE after COMMIT or UPDATE.
Retry one idempotent order, not the entire input file.
```

**Interview pitfall:** A second run can double an external payment or message even when the database transaction was rolled back.

**IBM documentation for this exercise**

- [IBM: Isolation level](https://www.ibm.com/docs/en/i/7.5.0?topic=concepts-isolation-level)
- [IBM: Journal and commit APIs](https://www.ibm.com/docs/en/i/7.5.0?topic=category-journal-commit)

</details>

## 14. An RPG program raises a decimal-data or numeric exception only for certain records. How do you debug it?

**Intermediate** · RPG decimal data

<details>
<summary>Explain the answer</summary>

A field contains a value that does not conform to the data type the program is interpreting, or a conversion/operation exceeds the defined precision. Capture the failing record key and statement, inspect the raw source field and its CCSID or packed representation, and compare it with a successful record. Do not assume the screen value is the stored value.

Validate and cleanse input at the boundary, use appropriately sized zoned or packed fields, and make conversions explicit. Add monitored error handling that records the offending key and returns a controlled status. After correction, replay the isolated record in a test library; do not mask the exception globally and continue with unknown financial values.

**Example**

```cl
// Check source field before conversion; log key + raw value.
monitor; amount = %dec(rawAmount : 11 : 2); on-error; // quarantine row
endmon;
```

**Interview pitfall:** A character field containing spaces or non-numeric signs is not automatically a valid packed-decimal value.

**IBM documentation for this exercise**

- [IBM: ILE RPG reference (7.6)](https://www.ibm.com/docs/it/ssw_ibm_i_76/pdf/sc092508.pdf)

</details>

## 15. What evidence do you need before fixing RNX0301, RNQ0202, or MCH3601 pointer errors?

**Intermediate** · RPG pointers

<details>
<summary>Explain the answer</summary>

The message identifies an invalid or unset address, but the fix depends on how the pointer was obtained and how long the target should live. Capture the procedure, statement, call stack, pointer value or based variable, and the job state. Common causes include dereferencing *NULL, using storage after it was freed, and mismatched prototypes.

Validate pointer state before use, keep allocation and release ownership clear, and make prototypes match the called procedure exactly. Use qualified APIs and error indicators for allocation or IFS operations. Reproduce with the smallest input that fails and run under the debugger or service-entry instrumentation; changing optimisation or adding a delay is not a repair.

**Example**

```cl
if ptr = *null; return; endif;
// Ensure the prototype and parameter storage remain valid.
```

**Interview pitfall:** A pointer address that is non-zero can still refer to released or incompatible storage.

**IBM documentation for this exercise**

- [IBM: ILE RPG reference (7.6)](https://www.ibm.com/docs/it/ssw_ibm_i_76/pdf/sc092508.pdf)
- [IBM: Starting debug mode](https://www.ibm.com/docs/en/i/7.6.0?topic=programs-starting-debug-mode)

</details>

## 16. Why can a program read the wrong file member after an override or OPNQRYF change?

**Intermediate** · Overrides and open data paths

<details>
<summary>Explain the answer</summary>

Overrides and open data paths are job-scoped state. A previous call, CL wrapper, or long-lived server job may have redirected a file to another library, member, format, or selection. The source declaration can look correct while the job opens a different object or retains an old path. Inspect active overrides and open files in the failing job.

Establish overrides in one well-defined boundary, scope them to the call when appropriate, and delete or restore them on every exit path. Prefer modern SQL or declared file access when it expresses the requirement clearly. For reusable server jobs, reset request-specific state before processing the next request and test repeated calls in the same job.

**Example**

```cl
DSPJOB OPTION(*OPNF)
OVRDBF FILE(ORDERS) TOFILE(TEST/ORDERS) MBR(TESTDATA)
```

**Interview pitfall:** A successful first request does not prove that the next request in a persistent job sees the same open data path.

**IBM documentation for this exercise**

- [IBM: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM: OPEN and USROPN](https://www.ibm.com/docs/en/i/7.6.0?topic=codes-open-open-file-processing)

</details>

## 17. A submitted job remains on a job queue. Which checks separate configuration from capacity?

**Intermediate** · Batch work management

<details>
<summary>Explain the answer</summary>

Confirm the job queue status, its attached subsystem, the subsystem's active job limit, routing entries, job priority, and whether the queue is held. Compare the job description and queue with a job that starts successfully. A job can be eligible but wait because the subsystem has no available activity level or the queue is not attached where expected.

Use work-management commands and job logs to record the state before changing it. Correct the queue or routing configuration through change control, then release or resubmit one controlled job. Avoid increasing limits blindly; that can overload a memory pool or database and make the original scheduling problem harder to see.

**Example**

```cl
DSPJOBQ JOBQ(APP/BATCHQ)
WRKACTJOB SBS(*ALL)
DSPSBSD SBSD(APP/BATCH)
```

**Interview pitfall:** A held job queue and a full subsystem are different faults with different owners and fixes.

**IBM documentation for this exercise**

- [IBM: Subsystems, job queues, memory pools](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-subsystems-job-queues-memory-pools)
- [IBM: A job enters the subsystem](https://www.ibm.com/docs/en/i/7.5.0?topic=life-job-enters-subsystem)

</details>

## 18. A report completed, but users cannot find the printed output. What should you trace?

**Intermediate** · Printing and spooled files

<details>
<summary>Explain the answer</summary>

Trace the spooled file from the producing job to its output queue, writer, status, form type, and user or output-queue ownership. A printer device can be unavailable, the job can inherit a different output queue, or the writer can be held. The report may exist even when no paper was produced.

Use the job log and spooled-file attributes to identify the actual destination, then correct routing or release the writer according to operations policy. For automation, make the output queue and retention expectations explicit and alert on failed or held spooled files. Do not rerun a financial report until you know whether the first copy exists.

**Example**

```cl
WRKJOB JOB(123456/USER/REPORT) OPTION(*SPLF)
WRKOUTQ OUTQ(APP/REPORTQ)
```

**Interview pitfall:** A missing printer does not mean the report program failed; it can be a downstream spool or writer issue.

**IBM documentation for this exercise**

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)

</details>

## 19. A service-program call fails after deployment with a signature or procedure-resolution error. How do you reason about it?

**Advanced** · ILE binding

<details>
<summary>Explain the answer</summary>

An ILE caller binds to exported procedures and a service-program signature, not merely to a source member name. Compare the caller's bound service-program information, exported procedure names, binder language, signature level, and activation-group context with the deployed object. A rebuilt service program can be incompatible even when the source procedure still exists.

Preserve compatible signatures when adding exports, rebuild callers when an intentional breaking change is made, and use a versioned binder strategy for controlled evolution. Verify that the job resolves the intended service program and that the activation group lifecycle matches the resource ownership. Keep a rollback object available for a production migration.

**Example**

```cl
DSPPGMREF PGM(APP/ORDERAPI)
DSPSRVPGM SRVPGM(APP/ORDERAPI)
```

**Interview pitfall:** Matching procedure names alone does not guarantee a compatible service-program interface.

**IBM documentation for this exercise**

- [IBM: Service program signature](https://www.ibm.com/docs/en/i/7.6?topic=language-signature)
- [IBM: Binder language](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-binder-language)

</details>

## 20. A job ends or a connection drops and some changes remain while others disappear. What must you inspect?

**Advanced** · Commitment control

<details>
<summary>Explain the answer</summary>

Map each changed resource to its commitment definition, journal, activation group, and unit-of-work boundaries. A job can update non-committed objects alongside committed database changes, and different activation groups can have different commitment scopes. A disconnect or abnormal end may roll back one unit while an external side effect has already happened.

Define the transaction boundary before changing code. Start commitment control with the intended isolation and journal configuration, commit only after all required changes succeed, and roll back on every failure path. Make external calls idempotent or stage them for after commit. Verify recovery by testing normal, timeout, and abnormal-end scenarios.

**Example**

```cl
STRCMTCTL LCKLVL(*CS) CMTSCOPE(*ACTGRP)
// update A + update B
COMMIT
```

**Interview pitfall:** A COMMIT statement cannot undo an email, API call, or queue message that happened outside the database unit of work.

**IBM documentation for this exercise**

- [IBM: Using COMMIT](https://www.ibm.com/docs/en/i/7.4.0?topic=control-using-commit-operation)
- [IBM: Commitment definitions and activation groups](https://www.ibm.com/docs/en/i/7.4.0?topic=scoping-commitment-definitions-activation-groups)

</details>

## 21. An imported UTF-8 JSON file is readable in one tool but becomes garbled in an IBM i program. Where is the fault likely to be?

**Advanced** · IFS encoding

<details>
<summary>Explain the answer</summary>

The IFS stream file has an encoding and CCSID, while the consuming API or program may assume another one. Inspect the stream-file attributes, byte-order mark, delimiters, and the conversion options used by the read or copy command. A terminal display can hide an encoding error until a non-ASCII customer name arrives.

Set the contract at the boundary: record the producer encoding, convert once with an explicit CCSID, and validate malformed input before parsing. Keep the original file for replay, write failures to a quarantine path, and test accented characters and emoji when the business data permits them. Do not fix an encoding problem by deleting bytes until the text looks readable.

**Example**

```cl
WRKLNK OBJ('/home/app/inbound/orders.json')
// Inspect the stream file and define CCSID conversion before JSON parsing.
```

**Interview pitfall:** The file extension says nothing about the actual CCSID or whether a BOM is present.

**IBM documentation for this exercise**

- [IBM: Integrated file system](https://www.ibm.com/docs/en/i/7.4.0?topic=system-integrated-file-ifs)
- [IBM: Integrated web services articles](https://www.ibm.com/support/pages/integrated-web-services-articles)

</details>

## 22. A data-queue consumer sometimes processes the same business request twice. How do you make the flow safe?

**Advanced** · Asynchronous work

<details>
<summary>Explain the answer</summary>

A data queue transports messages; it does not by itself provide an end-to-end business transaction or deduplication policy. Determine whether the duplicate was caused by a timeout before acknowledgement, a consumer restart, producer retry, or a second enqueue. Include a durable request identifier and record the state transition in the business database.

Make the consumer idempotent: claim a request key once, commit the business update and processed marker together, and retry only when the operation is safe. Decide what happens to poison messages, queue waits, and shutdowns. Monitor depth and age, and document whether ordering is required or merely convenient.

**Example**

```cl
Request ID → claim in APP/INBOX → apply update → commit → mark processed
```

**Interview pitfall:** Removing a duplicate from the queue without checking the database can lose a legitimate retry that never committed.

**IBM documentation for this exercise**

- [IBM: Create Data Queue](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fcrtdtaq.html)
- [IBM: Data queue server](https://www.ibm.com/docs/en/i/7.6.0?topic=programs-data-queue-server)

</details>

## 23. A query became slow after data growth even though the SQL text did not change. What evidence should guide the fix?

**Advanced** · SQL performance

<details>
<summary>Explain the answer</summary>

Measure the statement in the actual workload and inspect its plan-cache information, estimated versus actual work, selection predicates, joins, temporary storage, and index usage. Data distribution and statistics can change as a table grows, and a plan that was adequate for a small test file can become expensive in production.

Choose the smallest evidence-backed change: a better predicate, an appropriate index, refreshed statistics, a rewritten join, or a bounded batch. Re-measure under representative concurrency and authority. Keep a rollback plan, because an index can improve one query while increasing write cost or competing with another workload.

**Example**

```cl
// Inspect the statement and access plan in ACS Run SQL Scripts.
// Compare estimated cost, index use, and rows before and after the change.
```

**Interview pitfall:** Adding indexes based only on column names can increase write cost without helping the actual access path.

**IBM documentation for this exercise**

- [IBM: SQL plan cache properties](https://www.ibm.com/docs/en/i/7.5.0?topic=cache-properties)
- [IBM: SQL plan cache statements](https://www.ibm.com/docs/en/i/7.4.0?topic=cache-show-statements)

</details>

## 24. How do you troubleshoot a failure that involves CL, RPG, SQL, and a batch job at the same time?

**Advanced** · Evidence-first triage

<details>
<summary>Explain the answer</summary>

Start with one failing job identity and a precise timeline. Preserve the first diagnostic and escape messages, the job log, submitted-command text, resolved libraries, overrides, SQLSTATE/SQLCODE, input identifiers, and transaction state. Build a causal chain from the first failure rather than treating every later CPF or function-check message as a separate root cause.

Reproduce one input in a safe library with the same profile and job attributes. Change one variable at a time, then add the smallest fix that prevents recurrence and preserves recovery. Close the loop with a test for the original symptom, a test for duplicate or partial work, and an operator runbook that says when to stop and escalate.

**Example**

```cl
1. DSPJOBLOG
2. DSPLIBL + DSPJOB OPTION(*OPNF)
3. Capture SQL diagnostics
4. Re-run one input safely
```

**Interview pitfall:** The last message in a job log is often a consequence such as CPF9999, not the first actionable error.

**IBM documentation for this exercise**

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: Starting debug mode](https://www.ibm.com/docs/en/i/7.6.0?topic=programs-starting-debug-mode)
- [IBM: Db2 for i SQL reference (7.4)](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)

</details>

## Checkpoint — 10 MCQs

Answer all questions before checking the key. Aim for 10/10 before continuing.

### 1. CPF9801 usually means:

A. The object was not found in the job's resolution context
B. The printer has no paper
C. A cursor reached end of data
D. The service-program signature is valid

### 2. Which is the safest first response to MSGW?

A. Reply I immediately
B. Inspect the message and second-level text
C. End every job in the subsystem
D. Resubmit the batch job twice

### 3. What does CPF0864 normally indicate after RCVF?

A. Authority failure
B. A deadlock
C. A missing program object
D. End of available records

### 4. Why can ACS and batch resolve different program objects?

A. They always use the same library list
B. RPG changes object names at runtime
C. Jobs can have different library lists and attributes
D. Batch ignores object types

### 5. What protects an SQLRPGLE SELECT that can return NULL?

A. A larger screen field
B. MONMSG CPF0000
C. A null indicator or an intentional SQL default
D. A second COMMIT

### 6. A record lock is reported by a job. Which job matters next?

A. Only the reporting job
B. The printer writer
C. The job holding the lock
D. The source editor

### 7. What is the main purpose of a service-program signature?

A. To identify compatible exported interfaces
B. To set a printer queue
C. To convert CCSIDs
D. To release a record lock

### 8. Which retry design is safest after SQL -911?

A. Retry the entire batch without checking
B. Ignore the SQL diagnostics
C. Retry a bounded idempotent unit after confirming rollback
D. Grant *ALLOBJ

### 9. What is a good first performance evidence source?

A. A guess based on the table name
B. The terminal colour
C. Plan-cache and workload measurements
D. The source member extension

### 10. Which message is often a consequence rather than the root cause?

A. The first diagnostic message
B. The original SQLSTATE
C. The record key in the error
D. CPF9999 after an unhandled failure

<details>
<summary>Answer key and explanations</summary>

1. **A — The object was not found in the job's resolution context** Confirm the qualified object, type, library list, and dependent objects before changing code.

2. **B — Inspect the message and second-level text** The message and business state determine whether reply, retry, cancel, or recovery is safe.

3. **D — End of available records** Handle end of file as a controlled loop condition and keep it separate from I/O errors.

4. **C — Jobs can have different library lists and attributes** Object resolution is job-context dependent, so compare the actual libraries and qualified object.

5. **C — A null indicator or an intentional SQL default** NULL needs an indicator or an explicitly chosen expression such as COALESCE.

6. **C — The job holding the lock** Inspect lock ownership and transaction state before ending or changing a job.

7. **A — To identify compatible exported interfaces** Signatures help the binder and runtime validate the caller's expected service-program interface.

8. **C — Retry a bounded idempotent unit after confirming rollback** Confirm transaction outcome and retry only an operation that cannot duplicate external or business effects.

9. **C — Plan-cache and workload measurements** Use observed plans, predicates, data distribution, and concurrency before selecting an index or rewrite.

10. **D — CPF9999 after an unhandled failure** Trace the job log backward to the first actionable diagnostic instead of stopping at a generic function check.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)
- [IBM: Monitor Message (MONMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fmonmsg.html)
- [IBM: Db2 for i SQL reference (7.4)](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)
- [IBM: Object and library authority](https://www.ibm.com/docs/ssw_ibm_i_74/rzamv/rzamvundhowobjandlibauthtog.htm)

[← Previous](tricky-questions.md) · [Next →](coding-exercises.md)
