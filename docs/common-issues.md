# Common IBM i issues & fixes

[Question index](README.md) · Troubleshooting · All levels

A symptom-first playbook for IBM i development, support, testing, and administration. Each issue includes a likely cause, evidence to collect, safe diagnostic steps, a verification check, and official IBM references.

## 1. A program fails with CPF9801 (object not found). What should you check first?

**Easy** · Object discovery

<details>
<summary>Explain the answer</summary>

Capture the complete message, including the object name, object type, and library context. Then confirm the object exists with the appropriate display command and check whether the failing job is resolving an unqualified name through its library list. A program can work interactively and fail in batch because the two jobs have different libraries or current libraries.

Compare the job's library list, current library, product libraries, and any overrides with a successful job. If the dependency is intentional, initialise and validate the environment in one wrapper or qualify the critical object. Avoid adding random libraries globally; that can make the next deployment resolve an unintended object.

**Diagnose and resolve**

1. **Read the exact failure:** Capture the CPF9801 message and its second-level text from the failing job. Record the named object, object type, and whether the name was qualified.

   ```cl
   DSPJOBLOG
   ```

2. **Check the object and resolution path:** Confirm the intended object exists in the expected library, then inspect the failing job's current library and library list rather than assuming they match your interactive job.

   ```cl
   DSPOBJD OBJ(APP/POSTORD) OBJTYPE(*PGM)
   ```

3. **Compare a working job:** Compare the resolved library and relevant overrides in a successful job with the failing job. Look for a missing dependency or a same-named object in another library.

**Verify the result:** In a controlled job with the failing profile and job description, confirm that the intended qualified object and its dependencies resolve before repeating the original call.

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

**Diagnose and resolve**

1. **Identify the object that actually ran:** Record the qualified program name and creation details from the batch job's evidence; do not infer the version from the source member or ACS session.

2. **Compare job library lists:** Inspect the batch job's current, product, and user libraries and compare their order with the interactive job.

   ```cl
   DSPJOB OPTION(*LIBL)
   ```

3. **Check both program objects:** Display each same-named program in the candidate libraries and compare build details and dependencies.

   ```cl
   DSPPGM PGM(APP/POSTORD)
   ```

**Verify the result:** A new controlled batch job and the interactive job should resolve the same intended qualified program; confirm this from job evidence, not only from a successful return code.

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

## 3. A create command says the object already exists. How do you fix the deployment safely?

**Easy** · Object lifecycle

<details>
<summary>Explain the answer</summary>

An already-exists message, such as CPF2112 on commands that use it, means a qualified object of the relevant type already occupies the target name. Read the actual command and message rather than assuming one message ID applies to every create command. CPF2105 means an object was not found, so it must never be handled as an existence collision. Before changing anything, identify the existing object, owner, authority, dependencies, and active users.

An expected rerun may need a command-supported replace operation, a versioned object, or an explicit migration plan. If replacement is approved, save or back up the object, coordinate any required lock or outage, and verify ownership and authority after creation. For temporary work objects, use a job-private name or QTEMP. Do not delete an unknown production object merely to make a create command succeed.

**Diagnose and resolve**

1. **Read the actual message and target:** Record the create command, message ID, qualified target, and object type; inspect the existing object before considering replacement.

   ```cl
   DSPOBJD OBJ(APP/WORK) OBJTYPE(*ALL)
   ```

2. **Check active use and dependencies:** Find jobs using the object and dependent programs or files so a deployment decision does not disrupt live work.

3. **Review the intended deployment contract:** Compare the create command's replace behavior and the release procedure with the existing object. Determine whether the run is an expected rerun or an unexpected collision.

**Verify the result:** After an approved deployment, display the object again and confirm its type, owner, authority, and build identity match the release record; a successful command alone is not enough.

**Example**

```cl
DSPOBJD OBJ(APP/WORK) OBJTYPE(*ALL)
WRKOBJLCK OBJ(APP/WORK) OBJTYPE(*ALL)
```

**Interview pitfall:** DLTOBJ or DLTF can remove a valid production object and its data; existence checks must include object type and purpose.

**IBM documentation for this exercise**

- [IBM: Create command already-exists message](https://www.ibm.com/docs/en/i/7.5.0?topic=c-create-alert-table)
- [IBM: CPF2105 means object not found](https://www.ibm.com/docs/en/i/7.5.0?topic=d-display-object-description)
- [IBM: Work with Object Locks](https://www.ibm.com/docs/en/i/7.5.0?topic=w-work-object-locks)

</details>

## 4. What usually causes a record-format or level-check error after a file change?

**Easy** · Record formats

<details>
<summary>Explain the answer</summary>

A program was compiled against a record format or level that no longer matches the file object it opens. Check the message details, the file and record-format level, the program's compile listing, and the object actually opened at runtime. A source change alone does not refresh an existing program object.

Recompile dependent programs in the correct library and deployment order, then test the path that opens the file. For a planned schema change, identify logical files, views, triggers, constraints, and service programs that depend on the format. Do not suppress a level check merely to make an incompatible object run.

**Diagnose and resolve**

1. **Identify the opened file and format:** Use the job message to record the qualified file, member, record format, and the program that opened it. Account for any override.

2. **Compare format levels:** Display the current file's record-format information and compare it with the program's compile listing or referenced-file details.

   ```cl
   DSPFD FILE(APP/ORDERS) TYPE(*RCDFMT)
   ```

3. **Trace dependent objects:** Find programs, logical files, and other dependencies affected by the changed physical file before choosing a rebuild order.

   ```cl
   DSPPGMREF PGM(APP/POSTORD)
   ```

**Verify the result:** In a development job with the deployment library list and overrides, confirm the intended file opens without a level check and that the tested program object is the newly built version.

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

**Diagnose and resolve**

1. **Capture the original message:** Read the first diagnostic or escape message and its message ID in the job log, not only the later function-check or wrapper message.

   ```cl
   DSPJOBLOG
   ```

2. **Check monitor placement:** Inspect whether the MONMSG is command-level immediately after the intended command or program-level, and whether its ID pattern matches the actual message family.

3. **Follow the error path:** Review what the handler does after a match: preserving message details, setting failure status, or incorrectly continuing as success.

**Verify the result:** A controlled test of the expected failure should reach the intended handler and report failure with the original message; an unrelated failure should remain visible rather than being swallowed.

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

**Diagnose and resolve**

1. **Confirm the end-of-file signal:** Read the message immediately following RCVF. CPF0864 means no record was available; distinguish it from another I/O or authority error.

   ```cl
   DSPJOBLOG
   ```

2. **Inspect the open file context:** Confirm the declared file, record format, OPNID, member, active overrides, and current open-file position in the failing job.

   ```cl
   DSPJOB OPTION(*OPNF)
   ```

3. **Trace loop control:** Inspect source flow around RCVF and its adjacent MONMSG. Ensure row processing occurs only after a successful receive and that a keyed position uses the intended comparison.

**Verify the result:** With a small read-only test file, verify that every expected record is visited once, CPF0864 ends the loop normally, and a different receive error remains visible.

**Example**

```cl
RCVF OPNID(INFILE)
MONMSG MSGID(CPF0864) EXEC(GOTO CMDLBL(EOF))
```

**Interview pitfall:** Treating CPF0864 as a generic error can cause a valid batch completion to be reported as a failure.

**IBM documentation for this exercise**

- [IBM: CL RCVF end-of-file handling](https://www.ibm.com/docs/en/i/7.5.0?topic=procedures-receiving-data-from-database-file-rcvf-command)
- [IBM: Monitor Message (MONMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fmonmsg.html)

</details>

## 7. A batch job is in MSGW. What should an operator or developer do first?

**Easy** · Job messages

<details>
<summary>Explain the answer</summary>

Inspect the waiting message and its second-level text before replying. MSGW means the job is waiting for a reply or for message handling; it does not identify the correct response by itself. Determine the command or program that sent it, whether the request is safe to retry, and whether an operator policy already defines the response.

For recurring conditions, fix the underlying configuration or add deliberate error handling. In CL, monitor expected messages and send useful context to the caller or an operator queue. For production jobs, retain enough job-log detail to correlate the message with input, job identity, and transaction state before choosing retry, cancel, or a corrected rerun.

**Diagnose and resolve**

1. **Read the inquiry before replying:** Record the exact waiting message, second-level text, sender, and permitted replies. Do not choose a reply from the MSGW status alone.

   ```cl
   DSPJOBLOG
   ```

2. **Locate the blocked operation:** Identify the program or command at the wait point and the input or transaction being processed by that job.

3. **Check recovery policy:** Compare the message with the runbook, prior job messages, and business state to determine whether reply, correction, or escalation is authorised.

**Verify the result:** After the authorised action, check the job log and business record to confirm the job advanced exactly once and did not hide a partial or duplicated operation.

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

**Diagnose and resolve**

1. **Capture the denied operation:** Record the failing profile, qualified object or IFS path, object type, and requested operation from the message details.

2. **Inspect effective authority:** Check access to both the containing library and target object, including group and adopted authority relevant to the actual job.

   ```cl
   DSPOBJAUT OBJ(APP/ORDERS) OBJTYPE(*FILE)
   ```

3. **Review dependent access:** Follow any file, program, service program, or IFS parent directory that the operation touches; the named object may not be the only required authority.

**Verify the result:** Under the same non-privileged profile and job attributes, confirm the authorised operation works while unrelated objects remain inaccessible; do not use *ALLOBJ as the test.

**Example**

```cl
DSPOBJAUT OBJ(APP/ORDERS) OBJTYPE(*FILE)
DSPUSRPRF USRPRF(APPUSER)
```

**Interview pitfall:** Being able to run a program does not mean the caller has authority to every object the program touches.

**IBM documentation for this exercise**

- [IBM: Object and library authority](https://www.ibm.com/docs/ssw_ibm_i_74/rzamv/rzamvundhowobjandlibauthtog.htm)
- [IBM: Working with security commands](https://www.ibm.com/docs/en/i/7.5.0?topic=information-working-security-commands)

</details>

## 9. CRTBNDRPG reports RNF7030, 'name or indicator is not defined.' How do you find the real source error?

**Easy** · RPG compile diagnostics

<details>
<summary>Explain the answer</summary>

RNF7030 means the compiler cannot resolve a name at the cited statement. A spelling error or missing DCL-S is common, but a failed /COPY, excluded conditional branch, or wrong source member can remove a declaration too. The last error in the listing may be a consequence of an earlier one.

Generate a compiler listing, locate the first high-severity message, and follow its statement number back to the expanded source. Compare the referenced name with declarations and copy members actually included in that compile. Fix the first cause, rebuild the intended object, and inspect the new listing rather than treating every later RNF message separately.

**Diagnose and resolve**

1. **Read the first failure:** Open the existing compile listing and find the earliest high-severity RNF message and statement number.

   ```cl
   WRKSPLF
   ```

2. **Trace the name:** Check the cited line, declaration spelling, scope, and any /COPY member shown in the listing.

3. **Confirm the target:** Verify the source file, member, output library, and command options used by the actual build.

**Verify the result:** The intended program compiles with no unresolved-name messages, and the listing identifies the expected source and included members.

**Example**

```cl
Listing: RNF7030 at statement 42 for totalDue. Check whether DCL-S totalDue appears in the expanded source before changing the calculation.
```

**Interview pitfall:** Renaming the use site can hide a missing copy member and produce a different, incorrect program.

**IBM documentation for this exercise**

- [IBM: RPG IV beginner's tutorial](https://www.ibm.com/support/pages/coding-rpg-iv-beginners-tutorial)
- [IBM: Obtaining an RPG compiler listing](https://www.ibm.com/docs/en/i/7.5.0?topic=listing-obtaining-compiler)

</details>

## 10. Why does a long RPG statement fail or lose text when it looks valid in the editor?

**Easy** · Fully free-form source

<details>
<summary>Explain the answer</summary>

Free-form RPG has two source modes. If **FREE is not in column 1 of the first source line, the member remains column-limited and statements must stay in columns 8 through 80. An editor can display characters beyond column 80 even though they are not interpreted as the programmer expects.

Inspect the actual source member and the compiler listing, including line numbers and column positions. Either split the statement within the column limit or convert the complete member to fully free-form source by placing **FREE correctly at the beginning. Check copy members separately, because each copy file has its own source mode.

**Diagnose and resolve**

1. **Identify source mode:** Check whether **FREE is in column 1 of the first line with nothing else on that line.

2. **Inspect the failing line:** Compare the editor text with the compiler listing and locate characters beyond column 80.

3. **Check included source:** Inspect each /COPY member's own first line; the parent member's mode does not automatically apply inside it.

**Verify the result:** The full statement appears in the compile listing and the rebuilt object passes the targeted compile and execution test.

**Example**

```cl
A calculation extending past column 80 fails in a column-limited member; place **FREE on line 1, column 1, or split that calculation before column 80.
```

**Interview pitfall:** Adding **FREE halfway down a member does not switch the member into fully free-form mode.

**IBM documentation for this exercise**

- [IBM: Fully free-form statements](https://www.ibm.com/docs/en/i/7.5.0?topic=statements-fully-free-form)
- [IBM: Free-form statement columns](https://www.ibm.com/docs/en/i/7.4.0?topic=specifications-free-form-statements)

</details>

## 11. Why does an RPG compile fail on EXEC SQL even though the SQL statement is valid?

**Easy** · SQLRPGLE build commands

<details>
<summary>Explain the answer</summary>

Embedded SQL needs an SQL precompile step before the RPG compiler can process the generated source. Running CRTBNDRPG or CRTRPGMOD directly against SQLRPGLE source bypasses that step. The resulting RPG messages may point at SQL syntax even though the real issue is the build command.

Check the source type and the recorded compile command. Use CRTSQLRPGI for embedded SQL and select the intended OBJTYPE, source member, commit level, and listing options. Read the SQL precompiler messages before the RPG messages; a failed precompile may prevent the RPG compiler from being called at all.

**Diagnose and resolve**

1. **Confirm embedded SQL:** Look for EXEC SQL in the exact member or stream file being compiled.

2. **Inspect the build command:** Check whether it invokes CRTSQLRPGI and whether OBJTYPE matches the expected program, module, or service program.

3. **Read both stages:** Review the SQL precompiler listing first, then the RPG compiler listing if generation proceeded.

**Verify the result:** CRTSQLRPGI completes both stages and creates the intended object with no SQL precompile errors.

**Example**

```cl
For a test SQLRPGLE member, use CRTSQLRPGI OBJ(TESTLIB/LOOKUP) SRCFILE(TESTLIB/QRPGLESRC) OBJTYPE(*PGM) OUTPUT(*PRINT).
```

**Interview pitfall:** Changing SQL text to satisfy an RPG-only compile can alter correct SQL while leaving the missing precompile step unresolved.

**IBM documentation for this exercise**

- [IBM: Create SQL ILE RPG Object](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fcrtsqlrpgi.html)
- [IBM: Compiling an ILE application that uses SQL](https://www.ibm.com/docs/en/i/7.6.0?topic=commands-compiling-ile-application-program-that-uses-sql)

</details>

## 12. SQL0204 says a table is not found, but DSPOBJD shows it exists. How can both be true?

**Easy** · SQL object resolution

<details>
<summary>Explain the answer</summary>

SQL resolves an unqualified table name using the statement's naming convention and current schema or library context. Under SQL naming, the assumed schema can differ from the library list a developer expects from command-line work. A batch or client job can therefore search a different location from an interactive test.

Record the object name and library reported by SQL0204, then compare the executing job's naming setting and current schema with the actual table location. Qualify the table in the SQL statement or set the intended session context in the application's connection setup. Retest from the same kind of job and user profile that failed.

**Diagnose and resolve**

1. **Read the qualifier:** Capture the missing object name, object type, and library or schema named in SQL0204.

2. **Locate the table:** Display the actual table object and compare it with the failed job's library context.

   ```cl
   DSPOBJD OBJ(TESTLIB/ORDERS) OBJTYPE(*FILE)
   ```

3. **Check naming:** Inspect the SQL naming convention and current schema for the failing connection, not a different interactive session.

**Verify the result:** The failing job resolves the intended qualified table and the SQL statement succeeds under its normal profile.

**Example**

```cl
SQL0204 says ORDERS in APPUSER was not found, while the table exists in TESTLIB. Verify the current schema or write TESTLIB.ORDERS.
```

**Interview pitfall:** Adding a library to a command-line library list may have no effect on a connection using SQL naming and a different current schema.

**IBM documentation for this exercise**

- [IBM: SQL naming and qualifying objects](https://www.ibm.com/support/pages/sql-naming-and-qualifying-objects)
- [IBM: Library-list resolution under system naming](https://www.ibm.com/docs/en/i/7.6.0?topic=uf-can-i-use-library-list-resolving-unqualified-table-view-names)

</details>

## 13. A batch job ended, but there is no QPJOBLOG spooled file. Where did its job log go?

**Easy** · Job-log output

<details>
<summary>Explain the answer</summary>

An ended job can retain a pending job log instead of producing a QPJOBLOG spooled file. LOGOUTPUT(*PND) does this deliberately, while LOGOUTPUT(*JOBLOGSVR) delegates production to a job-log server. The LOG message level and *NOLIST setting also affect which messages and normal-end logs are produced. First establish the fully qualified job name and whether its log is pending, spooled, or absent.

Search pending and spooled logs with WRKJOBLOG, setting PERIOD to include the failed run; its default period is the current day. If a pending log exists, read it before changing any logging policy. Inspect the job description and job logging attributes for the next run, then agree on LOG and LOGOUTPUT settings with operations so the needed evidence is retained without generating unnecessary logs for every normal completion.

**Diagnose and resolve**

1. **Identify the ended job:** Capture the fully qualified job name and completion time from the scheduler history, completion message, or submitted-job records; WRKUSRJOB may not list an ended job with a pending log.

2. **Search both log states:** Search pending and spooled logs for the exact qualified job, with a PERIOD that includes the failed run rather than the default current day.

   ```cl
   WRKJOBLOG JOBLOGSTT(*PENDING *SPOOLED) PERIOD((*AVAIL *BEGIN) (*AVAIL *END)) JOB(123456/APPUSER/NIGHTRUN)
   ```

3. **Inspect logging defaults:** Read the job description's LOG, LOGOUTPUT, and output-queue attributes before proposing a change.

   ```cl
   DSPJOBD JOBD(APP/BATCHJOBD)
   ```

**Verify the result:** The correct job's messages are readable in a pending or spooled log, or its documented LOG settings explain why no log was produced.

**Example**

```cl
WRKJOBLOG JOBLOGSTT(*PENDING *SPOOLED) PERIOD((*AVAIL *BEGIN) (*AVAIL *END)) JOB(123456/APPUSER/NIGHTRUN)
```

**Interview pitfall:** No QPJOBLOG in WRKSPLF does not prove the job never ran or that all diagnostic messages were lost.

**IBM documentation for this exercise**

- [IBM: How job logs are created](https://www.ibm.com/docs/en/i/7.5.0?topic=logs-how-job-are-created)
- [IBM: Work with Job Logs](https://www.ibm.com/docs/en/i/7.5.0?topic=w-work-job-logs)

</details>

## 14. A job schedule entry reached its time but no batch job was submitted. Could the entry itself be held?

**Easy** · Held schedule entries

<details>
<summary>Explain the answer</summary>

A held job schedule entry is different from a submitted job that is held on a job queue. IBM's SCHEDULED_JOB_INFO view reports STATUS=HELD for an entry that will not submit a job at its scheduled date and time. Check the entry status and last attempted and successful submission timestamps before investigating the subsystem or the application program.

If the entry was intentionally held, record the reason and leave it with its owner. If it should run again, the scheduler owner can release or correct the entry after checking its next date, command, user profile, and job queue. A newly submitted job then follows the ordinary job-queue and subsystem rules; releasing the schedule entry alone does not prove the business task completed.

**Diagnose and resolve**

1. **Read the entry state:** Inspect STATUS and NEXT_SUBMISSION_DATE for the named schedule entry.

   ```cl
   SELECT SCHEDULED_JOB_NAME, STATUS, NEXT_SUBMISSION_DATE FROM QSYS2.SCHEDULED_JOB_INFO WHERE SCHEDULED_JOB_NAME = 'NIGHTRUN'
   ```

2. **Check submission history:** Compare the last attempted and successful submission timestamps and reported status.

   ```cl
   SELECT LAST_ATTEMPTED_SUBMISSION_TIMESTAMP, LAST_ATTEMPTED_SUBMISSION_STATUS, LAST_SUCCESSFUL_SUBMISSION_TIMESTAMP FROM QSYS2.SCHEDULED_JOB_INFO WHERE SCHEDULED_JOB_NAME = 'NIGHTRUN'
   ```

3. **Confirm job-queue destination:** Read the configured queue and job description before troubleshooting a nonexistent submitted job.

   ```cl
   WRKJOBSCDE
   ```

**Verify the result:** The entry status and submission timestamps account for the missing job, and its next scheduled run is visible after the scheduler owner corrects the entry.

**Example**

```cl
SELECT SCHEDULED_JOB_NAME, STATUS, NEXT_SUBMISSION_DATE FROM QSYS2.SCHEDULED_JOB_INFO WHERE STATUS = 'HELD'
```

**Interview pitfall:** A HELD schedule entry does not place a held job on the queue; no job was submitted at that time.

**IBM documentation for this exercise**

- [IBM: SCHEDULED_JOB_INFO view](https://www.ibm.com/docs/en/i/7.5.0?topic=services-scheduled-job-info-view)

</details>

## 15. The scheduler received CPF1240 for a batch job. What does that message actually tell you?

**Easy** · Abnormal batch completion

<details>
<summary>Explain the answer</summary>

CPF1240 reports that a batch job ended abnormally; it is a completion summary, not the root-cause diagnostic. The message can include timing and resource counts, which help identify the correct run. The specific failure is usually recorded earlier in that job's log as a diagnostic, escape, or inquiry message. Start with the full job identity rather than the scheduler entry name alone.

Open the matching active, pending, or spooled job log and read backward from the end to the first actionable failure. Correlate that message with the command, SQL statement, or file operation that preceded it. A rerun is a separate business decision: check whether the job committed partial work or produced output before anyone submits it again.

**Diagnose and resolve**

1. **Capture the completion identity:** Record the job number, user, name, and timestamp from the completion message on its configured message queue.

2. **Find that job's log:** Search pending and spooled job logs for the exact qualified job.

   ```cl
   WRKJOBLOG JOBLOGSTT(*PENDING *SPOOLED) JOB(123456/APPUSER/NIGHTRUN)
   ```

3. **Read earlier diagnostics:** Open the matching pending or spooled log from WRKJOBLOG, inspect earlier messages, and note any transaction or output side effects.

**Verify the result:** A concrete earlier message and operation explain the abnormal completion, and the team has determined whether the run left partial business effects.

**Example**

```cl
CPF1240 identifies the failed job; WRKJOBLOG JOBLOGSTT(*PENDING *SPOOLED) finds its log for closer inspection.
```

**Interview pitfall:** Treating CPF1240 itself as the cause can lead to an unsafe blind rerun.

**IBM documentation for this exercise**

- [IBM: Job completion messages CPF1240 and CPF1241](https://www.ibm.com/support/pages/ibm-i-job-completion-messages-cpf1240-and-cpf1241)
- [IBM: Displaying a job log](https://www.ibm.com/docs/en/i/7.5.0?topic=log-displaying-job)

</details>

## 16. Why does a test fail because SQL rows appear in a different order after a PTF or data change?

**Easy** · Deterministic SQL tests

<details>
<summary>Explain the answer</summary>

A SELECT result has no guaranteed row order unless the outer query specifies ORDER BY. An access plan, parallelism, index, PTF, or release change can alter the order that happened to appear previously. A test that compares the first returned row or an entire sequence without requesting order is asserting behavior that the SQL statement never promised.

Decide whether row order is part of the business requirement. If it is, add ORDER BY with enough keys to break ties, such as a unique identifier after the primary sort column, and assert that sequence. If order is irrelevant, compare rows as a set or by stable keys. Use representative duplicate sort values in the test so a partial ORDER BY cannot hide nondeterminism.

**Diagnose and resolve**

1. **Inspect the outer SELECT:** Check whether it has ORDER BY; an inner query's ordering alone may not define the final result.

2. **Check tie cases:** Identify rows that share all current sort values and could appear in either order.

   ```cl
   SELECT STATUS, COUNT(*) FROM APP.ORDERS GROUP BY STATUS HAVING COUNT(*) > 1
   ```

3. **Review the assertion:** Determine whether the test requires ordered results or only the correct row set.

**Verify the result:** The query has a complete business-required ORDER BY and the ordered assertion is stable, or the test compares the intended unordered result set.

**Example**

```cl
SELECT ORDER_ID, STATUS FROM APP.ORDERS ORDER BY STATUS, ORDER_ID
```

**Interview pitfall:** An index or arrival sequence that usually returns the desired order is not an SQL ordering guarantee.

**IBM documentation for this exercise**

- [IBM: ORDER BY clause](https://www.ibm.com/docs/en/i/7.5.0?topic=statement-order-by-clause)
- [IBM: Why a query can return a different order](https://www.ibm.com/support/pages/why-my-reportquery-being-returned-different-order)

</details>

## 17. How do you investigate CPF5027 or CPF5032 record-lock errors?

**Intermediate** · Record locks

<details>
<summary>Explain the answer</summary>

Read the exact message before naming the cause. CPF5027 means a record is in use by another job; CPF5032 means the record is already allocated to this job. CPF5026 is a duplicate-key error, not a lock error. Record the file, member, record number or key, operation, and reporting job, then inspect the held and waiting record locks. The holder may be another interactive or batch job, or the same job through a prior open-for-update read.

Examine the holder’s call stack and commitment scope before choosing a remedy. A safe fix may be to wait within a bound, commit or roll back the owning transaction, unlock a record, or change an unintended update read to read-only access. Never end a job or force a commit without understanding its business state, and do not treat a duplicate key as a retryable record lock.

**Diagnose and resolve**

1. **Identify the contested record:** Capture CPF5027 or CPF5032, the file, member, record number or key, operation, and reporting job; distinguish another-job from same-job allocation.

2. **Find the lock holder:** Inspect held and waiting record locks. CPF5027 points to another holder; CPF5032 points to a record already allocated to the reporting job.

   ```cl
   DSPRCDLCK FILE(APP/ORDERS) MBR(*FIRST)
   ```

3. **Inspect the holder's work:** Read the holder's job messages and transaction state to tell an active update from an abandoned wait or a long-running commitment scope.

**Verify the result:** In a controlled concurrent test, verify the intended lock duration and that the losing path waits or reports a bounded conflict without corrupting or duplicating the record.

**Example**

```cl
DSPRCDLCK FILE(APP/ORDERS) MBR(*FIRST)
SELECT * FROM QSYS2.RECORD_LOCK_INFO WHERE TABLE_SCHEMA = 'APP';
```

**Interview pitfall:** CPF5026 means duplicate key. CPF5032 can be a same-job lock, so do not assume every record-lock message implicates another job.

**IBM documentation for this exercise**

- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)
- [IBM: Record lock information service](https://www.ibm.com/docs/en/i/7.6.0?topic=services-record-lock-info-view)
- [IBM: Database file message IDs](https://www.ibm.com/docs/en/i/7.4.0?topic=program-determining-which-messages-you-want-monitor)

</details>

## 18. An embedded SQL SELECT finds no row. Why might the RPG program appear to continue normally?

**Intermediate** · SQL no-data conditions

<details>
<summary>Explain the answer</summary>

A no-row result is a defined SQL condition, commonly SQLSTATE 02000 or SQLCODE +100. It is different from a syntax or connection failure. Embedded SQL updates the SQL communication area or declared diagnostics, so the program must test the condition immediately and decide whether 'not found' is expected for that operation.

Handle the no-data path explicitly: initialise output fields, set a not-found status, or branch to the next input item. For a cursor, distinguish no row on FETCH from an actual error and close the cursor in both normal and error paths. Do not rely on old SQLCODE values from a previous statement.

**Diagnose and resolve**

1. **Capture status immediately:** Inspect SQLSTATE or SQLCODE immediately after the SELECT INTO or FETCH; 02000 or +100 is a no-row result, not a successful new row.

2. **Inspect output use:** Trace where RPG host variables are read after the statement. Determine whether stale values from an earlier successful row can leak into this path.

3. **Check expected cardinality:** Review the predicate and key. Decide whether zero rows is valid and whether the operation expects one row or should use a cursor.

**Verify the result:** In a development test with an existing and a missing key, confirm the missing-key path returns not-found without reusing prior host-variable data.

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

## 19. Why does an SQLRPGLE statement fail when a nullable column is assigned to a non-nullable host variable?

**Intermediate** · SQL NULL values

<details>
<summary>Explain the answer</summary>

SQL NULL is not the same as a blank, zero, or default value. If a SELECT can return NULL and the host variable has no null-indicator support, Db2 cannot safely represent the result and reports a null-assignment condition such as SQLCODE -305. Define the business meaning of missing data before choosing a fallback.

Use a correctly typed null indicator or an SQL expression such as COALESCE when a default is genuinely correct. Check indicators after every statement that can return NULL and avoid silently converting an unknown value into a valid-looking value. Test both NULL and non-NULL rows, including inserts and updates.

**Diagnose and resolve**

1. **Find the nullable column:** Read the SQL diagnostic and identify the exact selected column and RPG host variable involved in the null-assignment failure.

2. **Compare data definitions:** Inspect the table column's nullability and the host variable's type, size, and indicator declaration; blank or zero is not SQL NULL.

3. **Check the business meaning:** Determine whether a missing value must remain distinguishable or an explicit SQL default is valid for that field.

**Verify the result:** Test one NULL and one non-NULL row in a development table; confirm the indicator or approved default produces the intended result without retaining stale host data.

**Example**

```cl
exec sql
  select PHONE
    into :phone :phoneNullInd
    from APP.CUSTOMER
   where CUSTOMER_ID = :customerId;
// phoneNullInd is a signed SMALLINT-compatible RPG indicator.
// A negative value means PHONE was NULL; do not read phone then.
```

**Interview pitfall:** COALESCE hides the distinction between missing and intentionally empty data if the domain has both meanings.

**IBM documentation for this exercise**

- [IBM: Db2 for i SQL reference (7.4)](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)
- [IBM: SQL indicator variables in ILE RPG](https://www.ibm.com/docs/en/i/7.5.0?topic=cssiira-using-indicator-variables-in-ile-rpg-applications-that-use-sql)

</details>

## 20. A query works in Run SQL Scripts but fails in embedded SQL with a conversion error. What is different?

**Intermediate** · SQL conversion errors

<details>
<summary>Explain the answer</summary>

The client and the embedded program may use different host-variable types, CCSIDs, date formats, decimal precision, naming conventions, or precompiler options. A literal in ACS can be implicitly cast while an RPG packed or character variable cannot. Read the full SQL message and identify the exact expression or target column before changing the query.

Make conversions explicit with compatible casts and correctly sized host variables. Validate packed-decimal data before arithmetic, use typed date/time values, and define character encoding at the integration boundary. Re-precompile and compile the actual source member that the running program uses, then test boundary values rather than only a happy-path row.

**Diagnose and resolve**

1. **Read the complete SQL diagnostic:** Capture SQLSTATE, SQLCODE, message text, expression, and target column from the embedded job before changing a cast.

2. **Compare input representations:** Inspect the RPG host field's type, length, precision, scale, CCSID, and date format against the SQL column and the literal used in ACS.

3. **Check precompile context:** Compare the SQL naming option, library resolution, compile options, and actual running object with the interactive query environment.

**Verify the result:** On a development copy, run the same boundary values through both ACS and the rebuilt embedded program; confirm equivalent typed inputs and matching outcomes.

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

## 21. What is a safe response to SQLCODE -911 or -913 during a batch update?

**Intermediate** · SQL concurrency

<details>
<summary>Explain the answer</summary>

These conditions indicate a deadlock or timeout decision made by the database manager. Do not immediately rerun the entire batch: determine whether the unit of work was rolled back, whether a partial external side effect occurred, and which objects or transactions were involved. The job log and SQL diagnostics are part of the incident evidence.

Reduce the conflict window by using a consistent access order, short transactions, appropriate indexes, and a deliberate isolation level. Retry only idempotent units with bounded backoff and a duplicate-protection key. If the business operation cannot be retried safely, place it in a recovery queue for review instead of guessing.

**Diagnose and resolve**

1. **Determine transaction outcome:** Preserve SQLCODE, SQLSTATE, and job messages. Establish whether the unit of work was rolled back or is still pending before considering a retry.

2. **Map the conflict:** Identify the two jobs, locked objects, access order, isolation level, and elapsed time around the deadlock or timeout.

3. **Check outside effects:** Inspect whether the failed unit already sent a payment, API call, data-queue entry, or other effect that the database rollback cannot undo.

**Verify the result:** A controlled conflict test should show a bounded retry of one idempotent unit or an explicit recovery state, with no duplicate business or external effect.

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

## 22. An RPG program raises a decimal-data or numeric exception only for certain records. How do you debug it?

**Intermediate** · RPG decimal data

<details>
<summary>Explain the answer</summary>

A field contains a value that does not conform to the data type the program is interpreting, or a conversion/operation exceeds the defined precision. Capture the failing record key and statement, inspect the raw source field and its CCSID or packed representation, and compare it with a successful record. Do not assume the screen value is the stored value.

Validate and cleanse input at the boundary, use appropriately sized zoned or packed fields, and make conversions explicit. Add monitored error handling that records the offending key and returns a controlled status. After correction, replay the isolated record in a test library; do not mask the exception globally and continue with unknown financial values.

**Diagnose and resolve**

1. **Pin down the failing input:** Record the job, RPG statement, record key, and error message for one failing case. Do not log more sensitive field content than the investigation requires.

2. **Inspect the stored representation:** Compare the raw character, zoned, or packed field with its declared precision, scale, sign, and CCSID; a displayed value can hide invalid bytes.

3. **Compare a passing record:** Check the conversion path and field sizes against a similar valid record to distinguish malformed input from arithmetic overflow.

**Verify the result:** On an isolated development copy, replay the identified record and boundary values; confirm valid data computes correctly and invalid data follows a controlled error path.

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

## 23. What evidence do you need before fixing RNX0301, RNQ0202, or MCH3601 pointer errors?

**Intermediate** · RPG pointers

<details>
<summary>Explain the answer</summary>

The message identifies an invalid or unset address, but the fix depends on how the pointer was obtained and how long the target should live. Capture the procedure, statement, call stack, pointer value or based variable, and the job state. Common causes include dereferencing *NULL, using storage after it was freed, and mismatched prototypes.

Validate pointer state before use, keep allocation and release ownership clear, and make prototypes match the called procedure exactly. Use qualified APIs and error indicators for allocation or IFS operations. Reproduce with the smallest input that fails and run under the debugger or service-entry instrumentation; changing optimisation or adding a delay is not a repair.

**Diagnose and resolve**

1. **Capture the failing location:** Record the message ID, procedure, statement, call stack, and the based variable or pointer involved before altering optimisation or timing.

2. **Trace pointer ownership:** Follow allocation, assignment, passed parameters, and release of the target storage. Check for *NULL, use-after-free, and job or activation-group lifetime mismatches.

3. **Compare call contracts:** Check prototype and procedure interface types, lengths, passing methods, and parameter order on both caller and callee.

**Verify the result:** Reproduce the smallest failing input under development debugging, then confirm the pointer remains valid across the call and the original exception no longer occurs.

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

## 24. Why can a program read the wrong file member after an override or OPNQRYF change?

**Intermediate** · Overrides and open data paths

<details>
<summary>Explain the answer</summary>

Overrides and open data paths can remain active at call level, activation-group level, or job level, depending on OVRSCOPE and OPNSCOPE. A previous call, CL wrapper, or long-lived server job may therefore redirect a file to another library or member, or leave a shared open data path active. The RPG file declaration can look correct while the running job opens a different object. Inspect the actual open files and the scope of the relevant override.

Establish each override in a defined boundary and choose its scope deliberately. Delete or restore it on every applicable exit path, and confirm when the open data path is closed; removing an override alone does not retroactively change an already-open file. For reused server jobs, test repeated requests in the same job. Prefer qualified access or SQL where it expresses the requirement more clearly.

**Diagnose and resolve**

1. **Inspect what the job opened:** Read the failing job's open-file information and record the qualified file, member, and open data path rather than trusting the RPG F specification alone.

   ```cl
   DSPJOB OPTION(*OPNF)
   ```

2. **Trace override scope:** Inspect active overrides and their OVRSCOPE, plus any OPNQRYF OPNSCOPE or shared-open settings established by the wrapper or an earlier request.

3. **Check repeated calls:** For a reused server job, compare the first and later request in the same job to see whether request-specific file state remains active.

**Verify the result:** In a controlled same-job sequence, confirm every request opens the intended qualified file and member and that an error exit does not leave a stale override.

**Example**

```cl
DSPJOB OPTION(*OPNF)
OVRDBF FILE(ORDERS) TOFILE(TEST/ORDERS) MBR(TESTDATA)
```

**Interview pitfall:** A successful first request does not prove that the next request in a persistent job sees the same open data path.

**IBM documentation for this exercise**

- [IBM: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM: OPEN and USROPN](https://www.ibm.com/docs/en/i/7.6.0?topic=codes-open-open-file-processing)
- [IBM: Override with Database File scope](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fovrdbf.html)

</details>

## 25. A submitted job remains on a job queue. Which checks separate configuration from capacity?

**Intermediate** · Batch work management

<details>
<summary>Explain the answer</summary>

Confirm the job queue status, its attached subsystem, the subsystem's active job limit, routing entries, job priority, and whether the queue is held. Compare the job description and queue with a job that starts successfully. A job can be eligible but wait because the subsystem has no available activity level or the queue is not attached where expected.

Use work-management commands and job logs to record the state before changing it. Correct the queue or routing configuration through change control, then release or resubmit one controlled job. Avoid increasing limits blindly; that can overload a memory pool or database and make the original scheduling problem harder to see.

**Diagnose and resolve**

1. **Check the job and queue state:** Confirm the submitted job's actual job queue, held or released state, and priority before blaming the program.

   ```cl
   DSPJOBQ JOBQ(APP/BATCHQ)
   ```

2. **Inspect subsystem routing:** Check whether the queue is attached to the expected active subsystem and whether routing entries or maximum active jobs permit this job to start.

   ```cl
   DSPSBSD SBSD(APP/BATCH)
   ```

3. **Compare capacity with a working job:** Compare job description, queue entry, subsystem activity, and memory-pool pressure with a similar job that started successfully.

**Verify the result:** After an approved configuration change, observe one controlled submitted job leave the intended queue, enter the intended subsystem, and finish without an unexplained hold.

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

## 26. A report completed, but users cannot find the printed output. What should you trace?

**Intermediate** · Printing and spooled files

<details>
<summary>Explain the answer</summary>

Trace the spooled file from the producing job to its output queue, writer, status, form type, and user or output-queue ownership. A printer device can be unavailable, the job can inherit a different output queue, or the writer can be held. The report may exist even when no paper was produced.

Use the job log and spooled-file attributes to identify the actual destination, then correct routing or release the writer according to operations policy. For automation, make the output queue and retention expectations explicit and alert on failed or held spooled files. Do not rerun a financial report until you know whether the first copy exists.

**Diagnose and resolve**

1. **Locate the spooled file:** Inspect the producing job's spooled-file list and job log before rerunning the report. Record spool ID, creation time, status, and output queue.

2. **Trace output routing:** Compare the job's OUTQ and printer attributes with the report's form type and the intended writer or device.

3. **Check access and retention:** Determine whether the spool is held, moved, expired, or visible only to another authorised user; preserve evidence of the first copy.

**Verify the result:** Confirm the original spool is located in the expected output queue and its final writer or delivery status is known before any controlled rerun.

**Example**

```cl
WRKJOB JOB(123456/USER/REPORT) OPTION(*SPLF)
WRKOUTQ OUTQ(APP/REPORTQ)
```

**Interview pitfall:** A missing printer does not mean the report program failed; it can be a downstream spool or writer issue.

**IBM documentation for this exercise**

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)

</details>

## 27. An RPG /COPY works on one system but the compiler cannot find it on another. What should you compare?

**Intermediate** · RPG copy members

<details>
<summary>Explain the answer</summary>

A /COPY or /INCLUDE reference is resolved from its written form and the compile environment. A source-member reference can depend on a source file in the library list; an IFS reference can depend on its path or the include search path. A successful compile elsewhere may have included a different member with the same name.

Read the directive exactly as compiled and inspect the listing's /COPY member table. Verify the source file, member, library list, or IFS include path in the failing build. Qualify the dependency or make its search path part of the build configuration, then compare the expanded source to the expected revision before accepting the object.

**Diagnose and resolve**

1. **Inspect the directive:** Distinguish a library/source-file/member reference from an IFS path and check its exact spelling.

2. **Inspect expansion:** Use the compiler listing's /COPY member table and *SHOWCPY output to see what was found.

3. **Compare environments:** Check the failing job's library list or INCDIR configuration against the successful build.

   ```cl
   DSPLIBL
   ```

**Verify the result:** The listing shows the intended copy member and its definitions, and the same build succeeds in a clean job with the documented search path.

**Example**

```cl
/COPY QRPGLESRC,PRICEPR is unqualified; check which QRPGLESRC the compile job finds before editing PRICEPR.
```

**Interview pitfall:** A copy member with the right name in the wrong library can compile cleanly while supplying an obsolete prototype.

**IBM documentation for this exercise**

- [IBM: /COPY or /INCLUDE directive](https://www.ibm.com/docs/en/i/7.5.0?topic=directives-copy-include)
- [IBM: Obtaining an RPG compiler listing](https://www.ibm.com/docs/en/i/7.5.0?topic=listing-obtaining-compiler)

</details>

## 28. SQL0312 says a host variable in SQLRPGLE is undefined or unusable. What should you inspect?

**Intermediate** · Embedded SQL host variables

<details>
<summary>Explain the answer</summary>

The SQL precompiler recognizes only supported RPG declarations and the variables in scope for the SQL statement. A missing colon, a declaration in another procedure, or an unsupported host type can make a valid RPG field unusable in SQL. A /COPY expansion problem can also leave the precompiler without the definition.

Read SQL0312's second-level text and the precompiler cross-reference rather than guessing from the RPG compiler output. Check the declaration's type and scope, then confirm that every SQL host reference has a colon. If the field comes from a directive, inspect RPGPPOPT and expanded source. Use a supported intermediary variable when the original RPG type cannot be a host variable.

**Diagnose and resolve**

1. **Read the reason:** Find SQL0312 or SQL5011 in the SQL precompiler listing and expand its detailed message.

2. **Check declaration:** Compare the field's RPG type, name, scope, and colon prefix with IBM's host-variable rules.

3. **Check source expansion:** If the declaration is in a copy member, confirm the precompiler saw that member and the intended conditional branch.

**Verify the result:** The SQL precompiler cross-reference lists the expected host variable and the statement compiles without SQL0312/SQL5011.

**Example**

```cl
EXEC SQL SELECT AMOUNT INTO :amount FROM TESTLIB.ORDERS WHERE ID = :orderId; both amount and orderId need supported declarations visible at this statement.
```

**Interview pitfall:** An RPG field that compiles in calculations is not automatically a legal SQL host variable.

**IBM documentation for this exercise**

- [IBM: Using host variables in ILE RPG](https://www.ibm.com/docs/en/i/7.6.0?topic=cssiira-using-host-variables-in-ile-rpg-applications-that-use-sql)
- [IBM: Declaring host variables in ILE RPG](https://www.ibm.com/docs/en/i/7.5.0?topic=uhviiratus-declaring-host-variables-in-ile-rpg-applications-that-use-sql)
- [IBM: Interpreting SQL compile errors](https://www.ibm.com/docs/en/i/7.5.0?topic=prpss-interpreting-compile-errors-in-applications-that-use-sql)

</details>

## 29. A SELECT or FETCH returns SQL0802 only for some rows. What evidence identifies the conversion fault?

**Intermediate** · SQL data mapping

<details>
<summary>Explain the answer</summary>

SQL0802 covers several data-conversion and mapping failures, including invalid numeric data, date conversion, overflow, and character conversion. The same statement may succeed for many rows and stop at the first offending value. The SQLCODE alone cannot tell you which column or expression caused it.

Read the full job-log message and SQL diagnostics, then narrow the SELECT list or predicate in a test session until the failing expression and row are known. Compare the stored value with the receiving host variable's type, precision, and length. Correct the data or mapping at its source and retest the original query; do not silently coerce unknown values.

**Diagnose and resolve**

1. **Capture diagnostics:** Record SQL0802's detailed error type, row context, and any preceding messages from the job log.

2. **Isolate the expression:** In a test session, project fewer columns and filter to a known failing key without changing stored data.

3. **Compare types:** Inspect the value and receiving host variable for invalid data, precision loss, or unsupported conversion.

**Verify the result:** The formerly failing row is read by the original statement with the expected value and no SQL0802 or hidden warning.

**Example**

```cl
SELECT AMOUNT FROM TESTLIB.ORDERS WHERE ORDER_ID = 42 isolates one read; compare the returned numeric value with the declared RPG host precision.
```

**Interview pitfall:** Increasing a host field's length cannot repair malformed packed or zoned decimal data already stored in a file.

**IBM documentation for this exercise**

- [IBM: SQL messages and codes](https://www.ibm.com/docs/en/i/7.6.0?topic=codes-listing-sql-messages)
- [IBM: SQL data retrieval errors](https://www.ibm.com/docs/en/i/7.5.0?topic=statement-data-retrieval-errors)

</details>

## 30. SQL7008 says a file is not valid for an operation. Why must you read the reason code before changing commitment control?

**Intermediate** · SQL7008 reason codes

<details>
<summary>Explain the answer</summary>

SQL7008 is a family of conditions, not a single journaling error. Its reason code can identify a table with no members, saved storage that was freed, a journaling or journal-authority problem, or a debug-mode restriction in a production library. Treating every SQL7008 as a reason to disable commitment control can erase the transaction protection the application needs.

Capture the complete message, including the reason code, using the job log or DSPMSGD. For code 3, check the file's journal state, the journal's availability, authority, and the statement's isolation level. Fix the specific setup problem through the approved database process; use COMMIT(*NONE) only when the application's transaction design explicitly allows it.

**Diagnose and resolve**

1. **Decode the message:** Read the substituted reason code and its recovery text, not only SQLCODE -7008.

   ```cl
   DSPMSGD MSGID(SQL7008) MSGF(QSQLMSG)
   ```

2. **Inspect the file:** Check the target file's member and journal attributes and whether the current profile can use the journal.

3. **Inspect transaction mode:** Compare the statement's isolation level or CRTSQLRPGI COMMIT option with the application's intended transaction boundary.

**Verify the result:** The same statement succeeds under the intended commit level, and the journal and transaction behavior still match the application's requirements.

**Example**

```cl
SQL7008 reason code 3 points investigation toward journaling or journal authority; reason code 1 instead points to a table without members.
```

**Interview pitfall:** Changing COMMIT to *NONE may remove an error while also removing rollback protection.

**IBM documentation for this exercise**

- [IBM: Interpreting SQL7008 reason codes](https://www.ibm.com/docs/en/i/7.6.0?topic=uf-how-do-you-interpret-sqlcode-associated-tokens-reported-in-sql0969n-error-message)
- [IBM: Journaled files and commitment control](https://www.ibm.com/docs/en/i/7.5?topic=objects-journaled-files-commitment-control)

</details>

## 31. A DDS physical file will not create because REF or REFFLD cannot resolve a field. What do you check?

**Intermediate** · DDS field references

<details>
<summary>Explain the answer</summary>

REF and REFFLD copy field attributes from a reference file or another field in the same DDS source. Resolution depends on the specified file, library, record format, field name, and search rules. A reference file that exists in a developer's library may be absent or different in the build library.

Read the create listing's first field-reference error and inspect the exact REF and REFFLD operands. Verify that the referenced file has already been created and contains the expected field and format; remember that a same-source reference must point to an earlier field. Qualify the intended dependency or correct the build order, then compare the created field description with the design.

**Diagnose and resolve**

1. **Read the DDS listing:** Locate the first REF or REFFLD error and identify the field and record format being resolved.

2. **Inspect the reference:** Display the expected reference file's field descriptions and confirm its library and build version.

   ```cl
   DSPFFD FILE(TESTLIB/FLDREF)
   ```

3. **Check search and order:** Check the explicit qualifier, library list, and whether a *SRC field appears earlier in the source.

**Verify the result:** The file creates in a clean test library, and DSPFFD shows the expected field type, length, and decimal positions.

**Example**

```cl
REFFLD(PRICE TESTLIB/FLDREF) must find PRICE in that specific file; REFFLD(PRICE *SRC) requires an earlier PRICE definition in the same DDS source.
```

**Interview pitfall:** An unqualified reference can silently use a similarly named reference file from another library.

**IBM documentation for this exercise**

- [IBM: REFFLD keyword for physical files](https://www.ibm.com/docs/en/i/7.6.0?topic=80-reffld-referenced-field-keywordphysical-files-only)
- [IBM: Field reference files](https://www.ibm.com/docs/en/i/7.4.0?topic=ddfud-using-existing-field-descriptions-field-reference-files-describe-database-file)

</details>

## 32. RPG WRITE reports file status 01021. Should the program simply retry the insert?

**Intermediate** · Duplicate-key writes

<details>
<summary>Explain the answer</summary>

Status 01021 means a WRITE tried to create a record that already exists under a unique key, or to reuse a subfile relative record number. The duplicate can come from an input replay, a wrong key value, or a concurrent writer. Retrying the same unchanged write usually repeats the same error.

Capture %STATUS(file) immediately after WRITE(E) and inspect the complete key in the target file. Determine the business rule: reject a duplicate, update an existing record, or treat a replay as already completed. Handle the duplicate as an explicit outcome and preserve the conflicting key in diagnostics. A pre-insert lookup alone is not enough because another job can insert between the lookup and WRITE.

**Diagnose and resolve**

1. **Confirm status:** Check %ERROR and %STATUS(file) immediately after WRITE(E), then read the related job-log message.

2. **Inspect the key:** Compare all unique-key fields and the attempted record values with the existing test record.

3. **Choose the outcome:** Apply the documented rule for duplicate input, replay, or update and keep that path testable.

**Verify the result:** A unique input inserts once, while a duplicate follows the intended conflict or idempotency path without an unhandled exception.

**Example**

```cl
write(e) OrderRec; if %error and %status(Orders) = 01021; // report or handle this key as a duplicate; endif;
```

**Interview pitfall:** CHAIN followed by WRITE is not a concurrency guarantee; another job can write the key after the CHAIN.

**IBM documentation for this exercise**

- [IBM: RPG file status codes](https://www.ibm.com/docs/en/i/7.6.0?topic=structure-file-status-codes)
- [IBM: %STATUS built-in function](https://www.ibm.com/docs/en/i/7.6.0?topic=functions-status-return-file-program-status)

</details>

## 33. Why does RPG UPDATE fail with file status 01221 even when the record exists?

**Intermediate** · RPG update sequence

<details>
<summary>Explain the answer</summary>

Status 01221 indicates an UPDATE without a successful prior read for update. The row's existence is separate from the current file cursor and lock state. A failed CHAIN, a CHAIN(N) that read without an update lock, an intervening positioning operation, or a previous UPDATE can leave no eligible record for the next UPDATE.

Trace the exact I/O sequence in the failing branch. Check %FOUND after CHAIN, %ERROR and %STATUS after the read, and whether an N extender or another operation changed lock state. Read the intended record for update immediately before modifying it, then issue one UPDATE against that record format. Test missing-row and locked-row paths separately.

**Diagnose and resolve**

1. **Confirm the failure:** Capture %STATUS(file) just after UPDATE(E) and identify the input operation before it.

2. **Check read result:** Verify that the preceding CHAIN or READ succeeded and was eligible to lock for update.

3. **Trace intervening I/O:** Look for CHAIN(N), SETLL, another read, UNLOCK, COMMIT, or prior UPDATE between read and update.

**Verify the result:** The targeted record updates once after a successful update read; not-found and lock errors take separate controlled paths.

**Example**

```cl
chain(e) orderId Orders; if not %error and %found(Orders); update(e) OrderRec; endif; // Use an update-capable read, not CHAIN(N).
```

**Interview pitfall:** A previous successful CHAIN elsewhere in the procedure does not establish a valid update position for this branch.

**IBM documentation for this exercise**

- [IBM: RPG file status codes](https://www.ibm.com/docs/en/i/7.6.0?topic=structure-file-status-codes)
- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.4.0?topic=gfc-record-locking)
- [IBM: CHAIN operation](https://www.ibm.com/docs/en/i/7.4.0?topic=codes-chain-random-retrieval-from-file)

</details>

## 34. A scheduled run was missed while the IBM i partition was down or restricted. Will it run automatically afterward?

**Intermediate** · Missed scheduled runs

<details>
<summary>Explain the answer</summary>

Job schedule entries cannot submit work at a scheduled time while the system is powered down or in restricted state. Their recovery action decides whether a missed occurrence is submitted released, submitted held, or not submitted after availability returns. IBM documents that only one job is submitted from an entry even if several occurrences were missed, so a recurring backlog is not automatically replayed one occurrence at a time.

Read the entry's RECOVERY_ACTION, its last submission status, and the system timeline around the outage. Compare those facts with any job already queued or completed before planning a catch-up run. The business owner should decide whether the task is safe to replay, whether it needs a date-specific input, and how duplicate effects are detected.

**Diagnose and resolve**

1. **Confirm the availability window:** Review system history around the expected run time for shutdown, IPL, or restricted-state events.

   ```cl
   DSPLOG LOG(QHST)
   ```

2. **Read recovery behavior:** Inspect the entry's recovery action and its last attempted and successful submission status.

   ```cl
   SELECT SCHEDULED_JOB_NAME, RECOVERY_ACTION, LAST_ATTEMPTED_SUBMISSION_STATUS, LAST_SUCCESSFUL_SUBMISSION_TIMESTAMP FROM QSYS2.SCHEDULED_JOB_INFO WHERE SCHEDULED_JOB_NAME = 'NIGHTRUN'
   ```

3. **Look for catch-up work:** Check whether the scheduler already submitted a job before proposing any manual replay.

   ```cl
   WRKUSRJOB USER(APPUSER)
   ```

**Verify the result:** The outage window, configured recovery action, and actual submitted-job history explain whether a catch-up job should exist.

**Example**

```cl
SELECT SCHEDULED_JOB_NAME, RECOVERY_ACTION, LAST_SUCCESSFUL_SUBMISSION_TIMESTAMP FROM QSYS2.SCHEDULED_JOB_INFO WHERE SCHEDULED_JOB_NAME = 'NIGHTRUN'
```

**Interview pitfall:** Submitting every missed recurrence manually can duplicate work; IBM's normal recovery submits at most one job per missed entry.

**IBM documentation for this exercise**

- [IBM: Job scheduling and system availability](https://www.ibm.com/docs/en/i/7.5.0?topic=options-job-scheduling-system-availability)
- [IBM: SCHEDULED_JOB_INFO view](https://www.ibm.com/docs/en/i/7.5.0?topic=services-scheduled-job-info-view)

</details>

## 35. A data-queue consumer appears to hang, or a receive returns zero length. What should you check?

**Intermediate** · Data-queue waits

<details>
<summary>Explain the answer</summary>

QRCVDTAQ uses the wait-time argument to decide what happens when no matching entry exists. Zero returns immediately with length zero; a positive value waits for the stated interval, and a negative value waits indefinitely. A keyed receive can also wait while other keys are present. A waiting consumer therefore does not by itself prove that the queue or subsystem has failed.

Read the queue's current-message count, sequence, and key length without receiving an entry, then compare the consumer's qualified queue name, key comparison, and wait setting with the producer's send path. If the queue contains entries but none match the requested key, fix the contract or routing. If it is empty, investigate why the producer did not send.

**Diagnose and resolve**

1. **Check queue depth:** Read current messages and queue type without consuming data.

   ```cl
   SELECT DATA_QUEUE_LIBRARY, DATA_QUEUE_NAME, CURRENT_MESSAGES, SEQUENCE, KEY_LENGTH FROM QSYS2.DATA_QUEUE_INFO WHERE DATA_QUEUE_LIBRARY = 'APP' AND DATA_QUEUE_NAME = 'WORKQ'
   ```

2. **Inspect the consumer:** Read its job log for API errors and record the configured wait time and key-selection values.

   ```cl
   DSPJOBLOG JOB(123456/APPUSER/CONSUMER)
   ```

3. **Inspect the producer:** Confirm that the producer addresses the same library and queue and that its send succeeded.

   ```cl
   DSPJOBLOG JOB(123457/APPUSER/PRODUCER)
   ```

**Verify the result:** The observed queue depth and the documented wait or key condition explain the consumer state, and a controlled test receives the expected entry once.

**Example**

```cl
SELECT CURRENT_MESSAGES, SEQUENCE, KEY_LENGTH FROM QSYS2.DATA_QUEUE_INFO WHERE DATA_QUEUE_LIBRARY = 'APP' AND DATA_QUEUE_NAME = 'WORKQ'
```

**Interview pitfall:** Calling QRCVDTAQ just to inspect production data normally removes an entry; use a read-only queue description or view for initial triage.

**IBM documentation for this exercise**

- [IBM: Receive Data Queue API](https://www.ibm.com/docs/en/i/7.5?topic=ssw_ibm_i_75%2Fapis%2Fqrcvdtaq.html)
- [IBM: DATA_QUEUE_INFO view](https://www.ibm.com/docs/en/i/7.4.0?topic=services-data-queue-info-view)

</details>

## 36. Why does QSNDDTAQ reject an entry with a length or key error even though the queue exists?

**Intermediate** · Data-queue send contracts

<details>
<summary>Explain the answer</summary>

The sender's data length must fit the queue's MAXLEN, and a keyed queue requires the key length used when it was created. A non-keyed queue requires a zero key length if the optional key parameters are supplied. IBM documents separate errors for an oversized data value and invalid or mismatched key lengths, so the exact message ID matters more than a generic send-failed label.

Read the queue's maximum message length, sequence, and key length, then compare them with the caller's parameter definitions and actual payload size. Check the failed job's message details before changing either side of the interface. Correct the producer's length and key contract in development and retest with boundary values; do not rebuild a production queue simply to fit one malformed send.

**Diagnose and resolve**

1. **Capture the exact API error:** Read the sending job's CPF message and second-level text.

   ```cl
   DSPJOBLOG JOB(123457/APPUSER/PRODUCER)
   ```

2. **Read queue attributes:** Compare MAXLEN, sequence type, and key length with the application's send contract.

   ```cl
   SELECT MAXIMUM_MESSAGE_LENGTH, SEQUENCE, KEY_LENGTH FROM QSYS2.DATA_QUEUE_INFO WHERE DATA_QUEUE_LIBRARY = 'APP' AND DATA_QUEUE_NAME = 'WORKQ'
   ```

3. **Check caller definitions:** Review the packed length parameters and actual buffer length in the source or call trace.

**Verify the result:** A development send with a valid payload and key succeeds, while oversized or wrong-key inputs produce the expected handled error.

**Example**

```cl
SELECT MAXIMUM_MESSAGE_LENGTH, SEQUENCE, KEY_LENGTH FROM QSYS2.DATA_QUEUE_INFO WHERE DATA_QUEUE_LIBRARY = 'APP' AND DATA_QUEUE_NAME = 'WORKQ'
```

**Interview pitfall:** Changing MAXLEN does not repair an incorrect packed parameter definition or a keyed-versus-non-keyed mismatch.

**IBM documentation for this exercise**

- [IBM: Send Data Queue API parameters and errors](https://www.ibm.com/docs/en/i/7.4?topic=ssw_ibm_i_74%2Fapis%2Fqsnddtaq.htm)
- [IBM: DATA_QUEUE_INFO view](https://www.ibm.com/docs/en/i/7.4.0?topic=services-data-queue-info-view)

</details>

## 37. An RPG job cannot update a data area that other jobs can still read. What lock should you look for?

**Intermediate** · Data-area locks

<details>
<summary>Explain the answer</summary>

An RPG IN operation with *LOCK places an exclusive-allow-read lock on a data area. Other programs may still retrieve its value, yet cannot update or acquire a conflicting lock until the owner performs a suitable OUT or UNLOCK, or the program ends. A data-area data structure marked for automatic handling can also read and lock at program initialization, making the lock lifetime less obvious.

Display the data area's lock holders and the owning job's log before changing the program. Trace whether the job intentionally protects a multi-step read-update sequence or failed to release the lock on an error path. Correct the release path in a controlled test and keep the critical section short; ending the holder without understanding its update state can lose intended work.

**Diagnose and resolve**

1. **Identify the holder:** Inspect held and waiting object locks on the fully qualified data area.

   ```cl
   WRKOBJLCK OBJ(APP/NEXTNUM) OBJTYPE(*DTAARA)
   ```

2. **Check the current value:** Read the value only if permitted; this does not identify the lock owner by itself.

   ```cl
   DSPDTAARA DTAARA(APP/NEXTNUM)
   ```

3. **Trace RPG operations:** Inspect the holder's job log and source for IN *LOCK, automatic data-area handling, OUT, and UNLOCK.

   ```cl
   DSPJOBLOG JOB(123456/APPUSER/NUMBERJOB)
   ```

**Verify the result:** A controlled test shows the intended job acquires and releases the data-area lock on both success and failure paths.

**Example**

```cl
WRKOBJLCK OBJ(APP/NEXTNUM) OBJTYPE(*DTAARA)
```

**Interview pitfall:** Being able to display the data-area value does not mean it is available for update.

**IBM documentation for this exercise**

- [IBM: RPG data-area operations](https://www.ibm.com/docs/en/i/7.5.0?topic=operations-data-area)
- [IBM: Work with Object Locks](https://www.ibm.com/docs/en/i/7.5.0?topic=w-work-object-locks)

</details>

## 38. A subfile screen shows headings but no rows after a refresh. What should you inspect first?

**Intermediate** · Blank subfiles

<details>
<summary>Explain the answer</summary>

Headings can come from the subfile control record while SFLDSP is off, no subfile records were written, or a refresh cleared them afterward. IBM's subfile example conditions SFLDSP and SFLDSPCTL separately from SFLCLR; the program must write records with increasing relative record numbers before outputting the control record when it expects visible rows. A truly empty result should have an intentional display path.

Trace one refresh in order: source rows selected, SFLCLR indicator, relative record number, subfile WRITE count, SFLDSP indicator, and final control-record output. Compare the DDS indicator conditions with the RPG program's values at each point. Fix the sequence or indicator logic and test both a nonempty page and an empty page so clearing old rows does not hide new ones.

**Diagnose and resolve**

1. **Confirm source rows:** Check the query or keyed file selection used to populate the display, using the same test input.

2. **Trace load and clear:** Record SFLCLR state, starting RRN, and how many subfile records the program writes.

3. **Trace final display:** Inspect SFLDSP and SFLDSPCTL indicators when the control record is output.

**Verify the result:** A test with rows displays exactly the loaded records, and a no-row test displays the intended empty state without stale rows.

**Example**

```cl
Expected sequence: clear old subfile, set RRN to zero, write each selected row with the next RRN, then display the control record with SFLDSP enabled.
```

**Interview pitfall:** Leaving SFLCLR selected on the final control-record output can erase the rows just loaded.

**IBM documentation for this exercise**

- [IBM: SFLCLR keyword](https://www.ibm.com/docs/en/i/7.5.0?topic=s-sflclr)
- [IBM: Subfile example](https://www.ibm.com/docs/en/i/7.5.0?topic=type-example-subfile-sflpag-value-equal-sflsiz-value)
- [IBM: SFLDSP keyword](https://www.ibm.com/docs/en/i/7.6.0?topic=s-sfldsp)

</details>

## 39. A journal receiver keeps growing and disk use rises. Is it safe to remove old receivers?

**Intermediate** · Journal receiver growth

<details>
<summary>Explain the answer</summary>

A receiver stores journal entries needed for recovery, and receiver size depends on write activity and whether receiver changes are managed by the system or by the application team. Under manual management, a threshold can trigger a message that requires an operational response. Even with system management, detached receivers may still be needed and must follow the site's save and retention policy.

Inspect the journal's current receiver, receiver directory, management mode, thresholds, and QHST messages. Determine which receivers are attached, detached, saved, and still required for recovery or replication before any storage action is planned. If automatic changes stopped, resolve the recorded reason and arrange a controlled receiver change; do not delete a receiver based only on age or size.

**Diagnose and resolve**

1. **Read journal attributes:** Identify receiver management mode, current receiver, and configured threshold.

   ```cl
   WRKJRNA JRN(APP/ORDERJRN)
   ```

2. **Inspect receiver status:** Read receiver attributes and directory information to distinguish attached from detached receivers.

   ```cl
   DSPJRNRCVA JRNRCV(APP/ORDRCV0001)
   ```

3. **Check related messages:** Look for threshold or receiver-change failures around the growth window.

   ```cl
   DSPLOG LOG(QHST)
   ```

**Verify the result:** The current and detached receiver chain, save status, and growth cause are documented, with a recovery-safe management plan approved by the journal owner.

**Example**

```cl
WRKJRNA JRN(APP/ORDERJRN)
```

**Interview pitfall:** A detached receiver can still be essential to recover changes since the last save; size alone is not a deletion criterion.

**IBM documentation for this exercise**

- [IBM: Manual versus system journal-receiver management](https://www.ibm.com/docs/en/i/7.5.0?topic=journals-manual-versus-system-journal-receiver-management)
- [IBM: Displaying journals and receiver information](https://www.ibm.com/docs/en/i/7.4.0?topic=journals-displaying-information-journaled-objects-receivers)

</details>

## 40. A PTF is on the system, but the reported defect still occurs. What does its status mean?

**Intermediate** · PTF activation

<details>
<summary>Explain the answer</summary>

A PTF being present is not the same as its fix being active. DSPPTF can show a save file only, loaded but not applied, temporarily or permanently applied, pending action, or superseded status. A superseded PTF requires checking the successor's status. IBM also cautions that an ACN marker does not by itself prove the fix is inactive; the required action may already have occurred but the status cannot yet verify it.

Record the exact PTF and product release, read its detailed status and cover letter, and check any prerequisite or superseding PTF. Follow the documented activation action through the normal maintenance process, then reproduce the original symptom. Do not infer that an immediate IPL is always required, and do not claim success merely because the PTF appears in inventory.

**Diagnose and resolve**

1. **Read exact status:** Inspect the PTF for the affected product and note loaded, applied, pending, and superseded indicators.

   ```cl
   DSPPTF LICPGM(5770SS1) SELECT(SI12345)
   ```

2. **Read activation instructions:** Check the PTF cover letter and requisite or dependent fixes.

   ```cl
   DSPPTFCVR LICPGM(5770SS1) SELECT(SI12345)
   ```

3. **Compare symptom evidence:** Capture the original failing message or job log after the documented action has taken effect.

   ```cl
   DSPJOBLOG JOB(123456/APPUSER/FAILJOB)
   ```

**Verify the result:** The relevant PTF or its successor has an effective status under IBM's definitions, and the specific original symptom no longer reproduces in a controlled test.

**Example**

```cl
DSPPTF LICPGM(5770SS1) SELECT(SI12345)
```

**Interview pitfall:** Temporarily applied - ACN does not necessarily mean the fix is inactive or that an immediate IPL must be scheduled.

**IBM documentation for this exercise**

- [IBM: Fix status descriptions](https://www.ibm.com/docs/en/i/7.5.0?topic=information-status-descriptions-using-command-interface)
- [IBM: Displaying properties of a fix](https://www.ibm.com/docs/en/i/7.5?topic=system-displaying-properties-fix)

</details>

## 41. An object saved on a newer IBM i release will not restore to an older test partition. What should you verify?

**Intermediate** · Cross-release restores

<details>
<summary>Explain the answer</summary>

A save from a newer release is not automatically compatible with an older target. IBM's current-to-previous-release support depends on the source and target release pair, the object type, the create and save TGTRLS values, and whether the object uses newer functions. The restore message and both partitions' release levels must be captured before treating the save file as damaged.

Check IBM's supported release table for the actual source release, then inspect how the program or object was created and saved. Rebuild or save with an appropriate target release only when the object type and used functions support it. Run the restore in an isolated test library and verify the object's behavior there before changing a shared environment.

**Diagnose and resolve**

1. **Capture the restore failure:** Read the exact message ID, reason, object type, and save-file identity from the restore job log.

   ```cl
   DSPJOBLOG
   ```

2. **Compare release levels:** Read installed software releases on source and target partitions.

   ```cl
   DSPSFWRSC
   ```

3. **Inspect saved contents:** Confirm the expected object and save metadata before rebuilding for a supported target.

   ```cl
   DSPSAVF FILE(APP/DEPLOYSAVF)
   ```

**Verify the result:** The source-target release pair and TGTRLS support are documented, and a compatible object restores and runs in the isolated target test library.

**Example**

```cl
DSPSFWRSC on both partitions; compare the object type and target release with IBM's release-to-release support table.
```

**Interview pitfall:** Setting TGTRLS cannot make a program that uses newer unsupported functions run on an older release.

**IBM documentation for this exercise**

- [IBM: Current release to previous release support](https://www.ibm.com/docs/en/i/7.5.0?topic=support-current-release-previous-release)
- [IBM: IBM i release interoperability](https://www.ibm.com/docs/en/i/7.5.0?topic=reference-i-release-interoperability)

</details>

## 42. A running job becomes held with CPI112E after a large query. Why?

**Intermediate** · Temporary-storage limits

<details>
<summary>Explain the answer</summary>

CPI112E identifies a job held because its maximum temporary-storage limit was exceeded. The MAXTMPSTG limit can be set for a class or job, and temporary storage can come from an application, the optimizer, or other system work. The message gives a specific cause for the hold, but it does not identify which query plan or allocation made the limit unsuitable.

Read the job log, job attributes, and current temporary-storage use, then correlate the spike with its statements or input batch. Reduce the workload or query's temporary demand where practical; change the limit only after checking available capacity and the job's intended safeguards. Any release of the held job should follow the application owner's assessment of its current transaction state.

**Diagnose and resolve**

1. **Confirm CPI112E:** Read the held job's message text and surrounding query or application messages.

   ```cl
   DSPJOBLOG JOB(123456/APPUSER/BIGQUERY)
   ```

2. **Read usage and limits:** Inspect job status, temporary storage, and MAXTMPSTG without changing the job.

   ```cl
   WRKACTJOB SEQ(*TMPSTG)
   ```

3. **Inspect system capacity:** Compare current storage and workload context before recommending a different limit.

   ```cl
   DSPSYSSTS
   ```

**Verify the result:** The held status is explained by CPI112E and measured temporary-storage use; the revised workload completes within an agreed capacity limit in a controlled rerun.

**Example**

```cl
WRKACTJOB SEQ(*TMPSTG)
```

**Interview pitfall:** Blindly raising MAXTMPSTG and releasing the job can remove a deliberate capacity safeguard while the same query still allocates excessive storage.

**IBM documentation for this exercise**

- [IBM: Limiting temporary storage and CPU used by queries](https://www.ibm.com/docs/en/i/7.5.0?topic=tools-limiting-temporary-storage-cpu-used-by-queries)
- [IBM: Work with Active Jobs](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fwrkactjob.html)

</details>

## 43. A released queue feeds an active subsystem, yet one batch job still waits. Which active limits should you compare?

**Intermediate** · Batch active-job limits

<details>
<summary>Explain the answer</summary>

A released job is not guaranteed an immediate run slot. The subsystem's maximum active jobs, the job-queue entry's MAXACT, and its maximum active count for the job's priority can each prevent selection. Queue sequence and job priority affect which eligible work enters first. This case begins only after confirming the queue is attached to an active subsystem, so the remaining question is capacity and selection order.

Read the waiting job's queue priority, the subsystem description, the job-queue entry limits, and the currently active jobs. Compare all values at the same point in time and identify which limit is saturated. Let the workload owner decide whether to wait, rebalance planned work, or change capacity; increasing a limit without understanding the subsystem's memory pool can worsen response for every job.

**Diagnose and resolve**

1. **Confirm queue and priority:** Read the waiting job's queue and job-priority attributes and confirm the queue is released.

   ```cl
   WRKJOBQ JOBQ(APP/BATCHQ)
   ```

2. **Read subsystem limits:** Inspect the subsystem's maximum active value and the queue entry's MAXACT and priority-specific limits.

   ```cl
   DSPSBSD SBSD(APP/BATCHSBS)
   ```

3. **Count active work:** Compare jobs currently running in that subsystem with the configured limits.

   ```cl
   WRKACTJOB SBS(BATCHSBS)
   ```

**Verify the result:** A specific saturated active-job limit or selection priority explains the wait, and the job starts when an eligible slot becomes available without an unexplained configuration change.

**Example**

```cl
WRKJOBQ JOBQ(APP/BATCHQ) followed by DSPSBSD SBSD(APP/BATCHSBS) and WRKACTJOB SBS(BATCHSBS)
```

**Interview pitfall:** A released queue and active subsystem rule out two causes, but do not prove capacity is available for every job priority.

**IBM documentation for this exercise**

- [IBM: My job is hung](https://www.ibm.com/docs/en/i/7.5.0?topic=management-my-job-is-hung)
- [IBM: Job queue entry](https://www.ibm.com/docs/en/i/7.5.0?topic=queues-job-queue-entry)

</details>

## 44. Why does a database file restore fail during deployment even though the save file and target library are correct?

**Intermediate** · Object lock during file deployment

<details>
<summary>Explain the answer</summary>

Restoring a database file requires exclusive use of that file; IBM notes that no member can be used during the restore, including through a logical file. An application job holding a compatible everyday read or update lock can therefore prevent the restore from obtaining the lock it needs. The deployment job log and message details should establish that allocation, rather than authority, save media, or object identity, caused this specific failure.

Inspect the exact target file and any member named in the message, then compare held and waiting locks with the jobs shown. Ask the workload owner when those jobs can finish or release their use of the file, and retry within an approved deployment window. Do not end a production job simply because it appears as a lock holder; its open file may belong to a transaction that must finish cleanly.

**Diagnose and resolve**

1. **Read the restore message:** Record the failing object, member if named, message ID, and message help before treating the failure as a lock conflict.

   ```cl
   WRKJOB JOB(123456/DEPLOY/RSTAPP)
   ```

2. **Inspect held and waiting locks:** Check the exact file for the deployment request and its current holders; inspect member locks when the message names a member.

   ```cl
   WRKOBJLCK OBJ(APP/ORDERS) OBJTYPE(*FILE)
   ```

3. **Identify the holder's work:** Open the holder's job details and confirm with its owner whether it can finish before the next restore attempt.

   ```cl
   WRKJOB JOB(123457/APPUSR/ORDERJOB)
   ```

**Verify the result:** The restore job's message identifies allocation as the cause, the conflicting holder is accounted for, and a later approved restore completes with no file-lock message.

**Example**

```cl
RSTOBJ of APP/ORDERS reports an allocation failure while WRKOBJLCK shows an application job holding a lock on that file; after the application reaches its agreed maintenance pause, the restore succeeds.
```

**Interview pitfall:** A program replacement may use different rules from a database-file restore. Do not assume every object being deployed requires all users to sign off, and do not confuse WRKOBJLCK's object locks with record locks.

**IBM documentation for this exercise**

- [IBM: Restoring database files](https://www.ibm.com/docs/en/i/7.5.0?topic=information-restoring-database-files)
- [IBM: Work with Object Locks](https://www.ibm.com/docs/en/i/7.5.0?topic=w-work-object-locks)
- [IBM: Displaying the lock states for objects](https://www.ibm.com/docs/en/i/7.4.0?topic=resources-displaying-lock-states-objects)

</details>

## 45. Why can a batch user see authority to an IFS stream file but still get an authority error opening its full path?

**Intermediate** · IFS directory traversal authority

<details>
<summary>Explain the answer</summary>

Authority to the final stream file is only part of an integrated file system access check. The job must be able to traverse each directory in the path prefix, which normally requires *X authority on those directories. For example, a user with *R on /apps/inbound/orders.csv can still fail to open it when the user lacks *X on /apps or /apps/inbound. The same path may work in an administrator's session because that job has different effective authority.

Capture the complete path and the batch job's running identity, then inspect each directory component and the final object with an appropriately authorized security administrator. Compare the operation with IBM's authority requirements: reading an existing stream file and creating a new one need different target and parent authorities. Grant only the missing authority through the application's planned group or authorization list after the security owner approves it; retest using the actual batch identity.

**Diagnose and resolve**

1. **Capture path and identity:** Read the authority message and confirm the full absolute path, operation, and user profile of the failing batch job.

   ```cl
   WRKJOB JOB(123456/APPUSER/IMPORT)
   ```

2. **Check every directory prefix:** Have an authorized administrator inspect /, /apps, and /apps/inbound for effective traversal authority, including group and authorization-list entries.

   ```cl
   DSPAUT OBJ('/apps/inbound')
   ```

3. **Check the target operation:** For a read, inspect the existing file's *R authority; for a create, inspect the containing directory's required *WX authority.

   ```cl
   DSPAUT OBJ('/apps/inbound/orders.csv')
   ```

**Verify the result:** The batch identity has the needed authority on every directory prefix and on the target or creating directory, and the original file operation succeeds without an authority error.

**Example**

```cl
A service profile has *R to /apps/inbound/orders.csv but no *X on /apps; the job fails to open the full path until the planned traversal authority is granted.
```

**Interview pitfall:** Seeing the final file's authority does not prove the whole path is accessible. DSPAUT itself may require elevated object-management authority, so a failure to display authority is not proof that the file is missing.

**IBM documentation for this exercise**

- [IBM: General rules for object authorities on commands](https://www.ibm.com/docs/en/i/7.5.0?topic=commands-general-rules-object-authorities)
- [IBM: Integrated file system command authorities](https://www.ibm.com/docs/en/i/7.5.0?topic=commands-integrated-file-system)
- [IBM: Display Authority](https://www.ibm.com/docs/en/i/7.5.0?topic=d-display-authority)

</details>

## 46. Why is a scheduled batch job still running under a service profile whose password or profile has expired?

**Intermediate** · Disabled profile and batch execution

<details>
<summary>Explain the answer</summary>

A password expiration and a user-profile expiration are different events. An expired password requires a change at sign-on, while a profile expiration date normally disables the profile. IBM documents that a disabled profile is invalid for sign-on but can still be used to submit batch jobs; disabling it also does not forcibly end a batch job that is already active. Therefore, a running job under a disabled service profile is not, by itself, evidence that expiration failed.

Compare the profile's STATUS, password-expiration fields, and user-expiration date with the job's submission and start times. Check the expiration schedule if your security role permits it, because an entry can also specify deletion rather than disabling. If the operational goal is to stop unattended work, coordinate a specific scheduler, queue, or application control with the workload and security owners; changing the profile's sign-on status alone is not that control.

**Diagnose and resolve**

1. **Read profile state:** Distinguish STATUS and user expiration from the separate password-expiration indicators.

   ```cl
   DSPUSRPRF USRPRF(APPBATCH)
   ```

2. **Read expiration action:** With the required *ALLOBJ authority, inspect whether the expiration schedule disables or deletes the profile and when it acts.

   ```cl
   DSPEXPSCD
   ```

3. **Compare batch timing:** Check job submission, start time, running user, and messages against the profile-expiration event.

   ```cl
   WRKJOB JOB(123456/APPBATCH/NIGHTLY)
   ```

**Verify the result:** The profile and job evidence explains whether sign-on was restricted while batch work continued, or whether a different scheduler or job condition caused the symptom.

**Example**

```cl
APPBATCH reaches its user expiration date and shows STATUS(*DISABLED), yet an existing NIGHTLY batch job remains active. That matches IBM's documented separation between sign-on status and batch execution.
```

**Interview pitfall:** Do not treat PWDEXP(*YES), profile STATUS(*DISABLED), and an expiration-schedule ACTION(*DELETE) as equivalent; they have different meanings and consequences.

**IBM documentation for this exercise**

- [IBM: Change User Profile status and expiration parameters](https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75%2Fcl%2Fchgusrprf.html)
- [IBM: Display Expiration Schedule](https://www.ibm.com/docs/en/i/7.5.0?topic=d-display-expiration-schedule)
- [IBM: Batch workload under disabled profiles](https://www.ibm.com/support/pages/batch-workload-visibility-and-elevated-authority-analysis)

</details>

## 47. A service-program call fails after deployment with a signature or procedure-resolution error. How do you reason about it?

**Advanced** · ILE binding

<details>
<summary>Explain the answer</summary>

An ILE caller binds to exported procedures and a service-program signature, not merely to a source member name. Compare the caller's bound service-program information, exported procedure names, binder language, signature level, and activation-group context with the deployed object. A rebuilt service program can be incompatible even when the source procedure still exists.

Preserve compatible signatures when adding exports, rebuild callers when an intentional breaking change is made, and use a versioned binder strategy for controlled evolution. Verify that the job resolves the intended service program and that the activation group lifecycle matches the resource ownership. Keep a rollback object available for a production migration.

**Diagnose and resolve**

1. **Capture the failing interface:** Record the runtime message, expected procedure name, caller, qualified service program, and activation-group context.

2. **Inspect bound references:** Compare the caller's referenced service program and recorded signature with the deployed service program's exports and signatures.

   ```cl
   DSPPGM PGM(APP/ORDERCALL) DETAIL(*SRVPGM)
   DSPSRVPGM SRVPGM(APP/ORDERAPI) DETAIL(*SIGNATURE *PROCEXP)
   ```

3. **Compare build inputs:** Review the binding directory entries, binder source, export order, and the libraries used for the prior and current builds.

**Verify the result:** A fresh development job should resolve the intended service program and call the exported procedure successfully; also test a long-running job where activation lifecycle matters.

**Example**

```cl
DSPPGM PGM(APP/ORDERCALL) DETAIL(*SRVPGM)
DSPSRVPGM SRVPGM(APP/ORDERAPI) DETAIL(*SIGNATURE *PROCEXP)
```

**Interview pitfall:** Matching procedure names alone does not guarantee a compatible service-program interface.

**IBM documentation for this exercise**

- [IBM: Service program signature](https://www.ibm.com/docs/en/i/7.6?topic=language-signature)
- [IBM: Binder language](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-binder-language)
- [IBM: Display Service Program exports and signatures](https://www.ibm.com/docs/en/i/7.4.0?topic=d-display-service-program)
- [IBM: Bound service programs view](https://www.ibm.com/docs/en/i/7.6.0?topic=services-bound-srvpgm-info-view)

</details>

## 48. A job ends or a connection drops and some changes remain while others disappear. What must you inspect?

**Advanced** · Commitment control

<details>
<summary>Explain the answer</summary>

Map each changed resource to its commitment definition, journal, activation group, and unit-of-work boundaries. A job can update non-committed objects alongside committed database changes, and different activation groups can have different commitment scopes. A disconnect or abnormal end may roll back one unit while an external side effect has already happened.

Define the transaction boundary before changing code. Start commitment control with the intended isolation and journal configuration, commit only after all required changes succeed, and roll back on every failure path. Make external calls idempotent or stage them for after commit. Verify recovery by testing normal, timeout, and abnormal-end scenarios.

**Diagnose and resolve**

1. **Build a resource timeline:** List every database row, data area, data queue, file, and external effect changed by the request, with the last confirmed operation before disconnect.

2. **Map commitment scopes:** Inspect the job's commitment definitions, journaled files, activation groups, and commit or rollback points. Distinguish uncommitted database work from effects outside commitment control.

3. **Check recovery evidence:** Read the job log and journal evidence to determine which unit of work committed, rolled back, or never participated in a transaction.

**Verify the result:** In a development recovery test, compare database and external state after normal completion, timeout, and abnormal end; each path should match the documented transaction boundary.

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

## 49. An imported UTF-8 JSON file is readable in one tool but becomes garbled in an IBM i program. Where is the fault likely to be?

**Advanced** · IFS encoding

<details>
<summary>Explain the answer</summary>

The IFS stream file has an encoding and CCSID, while the consuming API or program may assume another one. Inspect the stream-file attributes, byte-order mark, delimiters, and the conversion options used by the read or copy command. A terminal display can hide an encoding error until a non-ASCII customer name arrives.

Set the contract at the boundary: record the producer encoding, convert once with an explicit CCSID, and validate malformed input before parsing. Keep the original file for replay, write failures to a quarantine path, and test accented characters and emoji when the business data permits them. Do not fix an encoding problem by deleting bytes until the text looks readable.

**Diagnose and resolve**

1. **Inspect source bytes and tag:** Record the IFS stream file's CCSID attribute, any BOM, and a sample containing non-ASCII characters without changing the original file.

2. **Trace conversion points:** Identify the producer encoding and each copy, read API, parser, or job CCSID conversion before the RPG variable is populated.

3. **Compare raw and parsed values:** Use one known character sequence to locate where the value first differs; a terminal display alone may misrepresent correctly stored bytes.

**Verify the result:** On an unchanged development copy, confirm ASCII and non-ASCII test values survive the complete read and JSON parse path with the expected code points.

**Example**

```cl
WRKLNK OBJ('/home/app/inbound/orders.json')
// Inspect the stream file and define CCSID conversion before JSON parsing.
```

**Interview pitfall:** The file extension says nothing about the actual CCSID or whether a BOM is present.

**IBM documentation for this exercise**

- [IBM: Integrated file system](https://www.ibm.com/docs/en/i/7.4.0?topic=system-integrated-file-ifs)
- [IBM: Copy to Stream File and CCSID options](https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75%2Fcl%2Fcpytostmf.html)

</details>

## 50. A data-queue consumer sometimes processes the same business request twice. How do you make the flow safe?

**Advanced** · Asynchronous work

<details>
<summary>Explain the answer</summary>

A data queue transports messages; it does not by itself provide an end-to-end business transaction or deduplication policy. Determine whether the duplicate was caused by a timeout before acknowledgement, a consumer restart, producer retry, or a second enqueue. Include a durable request identifier and record the state transition in the business database.

Make the consumer idempotent: claim a request key once, commit the business update and processed marker together, and retry only when the operation is safe. Decide what happens to poison messages, queue waits, and shutdowns. Monitor depth and age, and document whether ordering is required or merely convenient.

**Diagnose and resolve**

1. **Correlate duplicate requests:** Find the stable business request ID, enqueue timestamps, consumer jobs, and each database update associated with the duplicate outcome.

2. **Locate the retry boundary:** Determine whether producer retry, consumer restart, timeout, or a second enqueue occurred before or after the durable business commit.

3. **Inspect the deduplication claim:** Check whether request-key uniqueness and processed-state recording share the business transaction; queue delivery alone is not proof of exactly-once processing.

**Verify the result:** In a development replay of the same request ID, confirm one business effect is committed and later deliveries are recognised without silently discarding an uncommitted first attempt.

**Example**

```cl
Request ID → claim in APP/INBOX → apply business update + mark processed → commit both together
```

**Interview pitfall:** Removing a duplicate from the queue without checking the database can lose a legitimate retry that never committed.

**IBM documentation for this exercise**

- [IBM: Create Data Queue](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fcrtdtaq.html)
- [IBM: Data queue server](https://www.ibm.com/docs/en/i/7.6.0?topic=programs-data-queue-server)

</details>

## 51. A query became slow after data growth even though the SQL text did not change. What evidence should guide the fix?

**Advanced** · SQL performance

<details>
<summary>Explain the answer</summary>

Measure the statement in the actual workload and inspect its plan-cache information, estimated versus actual work, selection predicates, joins, temporary storage, and index usage. Data distribution and statistics can change as a table grows, and a plan that was adequate for a small test file can become expensive in production.

Choose the smallest evidence-backed change: a better predicate, an appropriate index, refreshed statistics, a rewritten join, or a bounded batch. Re-measure under representative concurrency and authority. Keep a rollback plan, because an index can improve one query while increasing write cost or competing with another workload.

**Diagnose and resolve**

1. **Measure the real statement:** Capture representative elapsed time, row counts, concurrency, and the precise SQL statement in the affected workload.

2. **Inspect the access plan:** Use ACS Visual Explain or plan-cache evidence to compare predicates, join order, indexes, temporary work, and estimated versus observed rows.

3. **Compare data growth and statistics:** Check table cardinality, distribution, statistics freshness, and the cost of writes before proposing an index or rewrite.

**Verify the result:** Re-measure the same workload and representative concurrency after an approved change; record both read improvement and any write or storage regression.

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

## 52. How do you troubleshoot a failure that involves CL, RPG, SQL, and a batch job at the same time?

**Advanced** · Evidence-first triage

<details>
<summary>Explain the answer</summary>

Start with one failing job identity and a precise timeline. Preserve the first diagnostic and escape messages, the job log, submitted-command text, resolved libraries, overrides, SQLSTATE/SQLCODE, input identifiers, and transaction state. Build a causal chain from the first failure rather than treating every later CPF or function-check message as a separate root cause.

Reproduce one input in a safe library with the same profile and job attributes. Change one variable at a time, then add the smallest fix that prevents recurrence and preserves recovery. Close the loop with a test for the original symptom, a test for duplicate or partial work, and an operator runbook that says when to stop and escalate.

**Diagnose and resolve**

1. **Anchor one failing job:** Record the full job identity, input identifier, start time, and first diagnostic message before following later CPF9999 or wrapper messages.

   ```cl
   DSPJOBLOG
   ```

2. **Trace cross-layer context:** Capture submitted command, library list, overrides, open files, RPG statement, SQLSTATE or SQLCODE, and transaction state in timestamp order.

   ```cl
   DSPJOB OPTION(*OPNF)
   ```

3. **Form and test one cause:** Compare a successful job with the failing job, choose the earliest divergence, and investigate that dependency before changing several layers at once.

**Verify the result:** A controlled replay of the original input should pass without duplicate or partial work, and its job log should show the expected object resolution and transaction outcome.

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

## 53. CRTPGM or CRTSRVPGM fails with an unresolved imported procedure. How do you find the missing export?

**Advanced** · ILE unresolved imports

<details>
<summary>Explain the answer</summary>

The ILE binder matches an imported symbol from a module to an exported symbol in the supplied modules and service programs. A binding directory is only a search list; its entry is useful only if the object exists and exports the needed name. A wrong library, stale service program, or prototype/export mismatch can leave the import unresolved.

Read the binder listing to capture the exact unresolved symbol. Inspect the importing module with DSPMOD DETAIL(*IMPORT), the candidate service program's exports with DSPSRVPGM, and the binding directory's order and qualifiers. Correct the provider or binding input and rebuild with normal reference resolution. Do not accept unresolved references just to produce an object; using one later can raise MCH4439.

**Diagnose and resolve**

1. **Capture the symbol:** Read the binder information listing and record the exact imported procedure name.

2. **Inspect the objects:** Compare the module import with the exports of each intended provider.

   ```cl
   DSPMOD MODULE(TESTLIB/MYMOD) DETAIL(*IMPORT)
   ```

3. **Inspect binding order:** Check BNDSRVPGM and BNDDIR entries, their libraries, and whether they point to the expected build.

**Verify the result:** The program binds with all imports resolved and calls the intended exported procedure in a test job.

**Example**

```cl
If MYMOD imports CalcTax, inspect DSPSRVPGM DETAIL(*PROCEXP) for CalcTax in the service program that the binding directory actually resolves.
```

**Interview pitfall:** OPTION(*UNRSLVREF) can move an unresolved import from build time to an MCH4439 runtime failure.

**IBM documentation for this exercise**

- [IBM: Binding directory processing](https://www.ibm.com/docs/en/i/7.6.0?topic=directory-binding-processing)
- [IBM: Using the binder](https://www.ibm.com/docs/en/i/7.5.0?topic=steps-using-binder-create-program)
- [IBM: Create Program reference resolution](https://www.ibm.com/docs/en/i/7.6.0?topic=c-create-program)

</details>

## 54. A replacement service program works in a fresh job, but an existing server job still behaves as before. What should you inspect?

**Advanced** · Persistent ILE activations

<details>
<summary>Explain the answer</summary>

ILE resolves service-program references and allocates static storage when a program or service program activates. An activation in a named group can remain after a procedure returns, so replacing an object on disk does not prove that a long-running job has begun using a fresh activation. The job may also resolve a different library when a bound reference uses *LIBL.

Compare the caller's bound service-program information, its activation group, and the library list in the long-running job with a fresh test job. Verify the new object and signature, then use the application's planned quiesce and restart boundary to obtain a new activation. Avoid indiscriminate RCLACTGRP: reclaiming a group can close files and affect pending commitment resources.

**Diagnose and resolve**

1. **Compare jobs:** Reproduce the call once in a fresh test job and record whether only the long-running job differs.

2. **Inspect activation:** Display the target job's activation groups and the caller's bound service programs.

   ```cl
   DSPJOB OPTION(*ACTGRP)
   ```

3. **Inspect resolution:** Check the service-program library and signature, including any *LIBL binding and the server job's library list.

**Verify the result:** After a controlled application restart, the server job and fresh test job resolve the same service program and produce the same expected result.

**Example**

```cl
A prestart job returns the old tax calculation while a fresh job returns the new one; compare activation groups and resolved service-program libraries before recycling that application job.
```

**Interview pitfall:** RCLACTGRP can release open files and pending commitment resources, so it is not a safe blanket refresh command for an active application.

**IBM documentation for this exercise**

- [IBM: Program activation creation](https://www.ibm.com/docs/en/i/7.5.0?topic=activation-program-creation)
- [IBM: Activation behavior](https://www.ibm.com/docs/en/i/7.6.0?topic=concepts-activation)
- [IBM: Reclaim Activation Group restrictions](https://www.ibm.com/docs/en/i/7.5.0?topic=r-reclaim-activation-group)

</details>

## 55. How do you test a failing update and prove rollback without changing real business records?

**Advanced** · Test isolation and rollback

<details>
<summary>Explain the answer</summary>

Use a dedicated test library and fixture rows with known keys so the test never points at live business files. QTEMP is useful for job-private scratch objects, but its contents disappear when the job ends; use a deliberately configured journaled test file when the purpose is to exercise commitment control. A rollback affects only resources enrolled in the current commitment definition since its last boundary.

Before running the test, verify the resolved file names, journal state, and transaction scope. Capture the fixture's starting values, run one controlled update under the intended commit level, and check its intermediate result inside the transaction. Roll back, then read the same keys again and confirm their original values. Keep external effects such as messages or API calls out of this rollback test because database rollback does not make them disappear.

**Diagnose and resolve**

1. **Prove isolation:** Confirm every input and output object resolves to the dedicated test library and identify any external side effects.

   ```cl
   DSPOBJD OBJ(TESTLIB/ORDERS) OBJTYPE(*FILE)
   ```

2. **Prove enrollment:** Check journaling and the job's commitment definition before issuing the test update.

3. **Compare before and after:** Read fixture keys before the transaction, after the update, and again after ROLLBACK.

**Verify the result:** The fixture changes within the test transaction, returns to its original values after ROLLBACK, and no live library or external endpoint was touched.

**Example**

```cl
In TESTLIB only: record order 42's amount; run the update under commitment control; inspect the changed amount; ROLLBACK; verify order 42 has its original amount.
```

**Interview pitfall:** ROLLBACK cannot undo changes made outside the active commitment definition or reverse an email, remote API call, or other nonparticipating side effect.

**IBM documentation for this exercise**

- [IBM: QTEMP library description](https://www.ibm.com/support/pages/node/7239493)
- [IBM: Rollback operation](https://www.ibm.com/docs/en/i/7.5.0?topic=work-rollback-operation)
- [IBM: Using commitment control in RPG](https://www.ibm.com/docs/en/i/7.6.0?topic=adf-using-commitment-control)

</details>

## 56. Why does a program gain or lose access to a protected file after deployment when the caller's own authority did not change?

**Advanced** · Adopted authority after deployment

<details>
<summary>Explain the answer</summary>

A program or service program with USRPRF(*OWNER) adds its owner's authority while it is active in the call stack. A called program may use authority adopted by a preceding program when USEADPAUT(*YES) is set, even if the called program itself uses USRPRF(*USER). A deployment can therefore change effective access if the actual program owner, adopted-authority attributes, or called program in the resolved library differs from what was tested. Direct access outside that call stack need not behave the same way.

Inspect the exact object selected at runtime, its owner, and its USRPRF and USEADPAUT attributes. Trace the active call stack and compare the protected file's authority with the caller and relevant owner profile. Have the security and application owners restore the intended ownership and program attributes through the approved deployment process; avoid broad grants to the caller as a shortcut. IBM notes that replacing an existing program with REPLACE(*YES) preserves certain attributes from the replaced object, so verify the result rather than assuming the compile parameters won.

**Diagnose and resolve**

1. **Inspect the resolved program:** Confirm the library-qualified program actually called and read its owner, User profile, and Use adopted authority attributes.

   ```cl
   DSPPGM PGM(APP/PAYUPD)
   ```

2. **Inspect the call chain:** Display the active job's call stack and inspect any earlier adopting program or service program that may pass authority.

   ```cl
   WRKJOB JOB(123456/APPUSER/PAYJOB)
   ```

3. **Compare protected-object authority:** Read the protected file's owner, authorization list, and assigned authorities for the caller and adopting owner.

   ```cl
   DSPOBJAUT OBJ(APP/PAYFILE) OBJTYPE(*FILE)
   ```

**Verify the result:** The resolved program and call stack explain the effective authority at the failing operation, and the intended access succeeds through the approved program without granting unnecessary direct file access.

**Example**

```cl
APP/PAYUPD runs with USRPRF(*OWNER). After a new object is deployed under a different owner profile, the same caller fails to update APP/PAYFILE because that owner lacks the required file authority.
```

**Interview pitfall:** USEADPAUT(*YES) means a program can use authority already adopted by a caller; it does not mean the program adopts its own owner. USRPRF(*OWNER) controls that separate behavior.

**IBM documentation for this exercise**

- [IBM: Objects that adopt the owner's authority](https://www.ibm.com/docs/en/i/7.4.0?topic=security-objects-that-adopt-owners-authority)
- [IBM: Limiting the use of adopted authority](https://www.ibm.com/docs/en/i/7.5.0?topic=exposures-limiting-use-adopted-authority)
- [IBM: PROGRAM_INFO attributes](https://www.ibm.com/docs/en/i/7.5.0?topic=services-program-info-view)

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

Research date: 3 October 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)
- [IBM: Monitor Message (MONMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fmonmsg.html)
- [IBM: Db2 for i SQL reference (7.4)](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)
- [IBM: Object and library authority](https://www.ibm.com/docs/ssw_ibm_i_74/rzamv/rzamvundhowobjandlibauthtog.htm)

[← Previous](tricky-questions.md) · [Next →](coding-exercises.md)
