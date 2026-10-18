# Jobs, CL and batch work management

[Learning path index](README.md) · Intermediate

Troubleshoot IBM i batch jobs with SBMJOB, job queues, MSGW, job logs and CL examples. Learn to separate submission, execution and business completion.

Updated: 2026-10-11.

## Outcomes

- Trace a job from submission to a subsystem and job queue.
- Use CL as an orchestrator with clear message handling.
- Design a batch run that can be monitored and restarted.

## 1. A job is the runtime boundary

A job carries identity, library lists, environment values, routing data, and a job log. Interactive and batch jobs can call the same program but have different response and monitoring expectations. A job queue holds work until a subsystem has an available activity level.

When a program behaves differently in batch, compare the job attributes and library list before changing code. The diagnostic message often tells you which resolution or authority assumption failed.

**Observe the work-management path**

```text
WRKACTJOB SBS(QBATCH)
WRKJOBQ JOBQ(APPDATA/BATCHQ)
DSPJOB JOB(*) OPTION(*JOBLOG)
DSPJOBLOG JOB(*)
```

**Flow**

1. Submit or start a job
2. Job enters a job queue or is routed directly
3. A subsystem selects the job for an activity level
4. The program runs with its job context
5. Messages and completion status go to the job log

## 2. Let CL coordinate and report

CLLE is a good boundary for setting the library list, creating temporary objects, calling programs in order, and reacting to expected messages. Keep business rules in RPG or SQL, where they can be tested with data. Use MONMSG narrowly and preserve the original message information.

An operator should be able to tell whether a failure is retryable, data-related, or a configuration problem. Send a useful diagnostic or escape message instead of allowing a silent fall-through.

**CLLE orchestration skeleton**

**Example**

```clle
PGM PARM(&RUNID)
  DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
  MONMSG MSGID(CPF0000) EXEC(GOTO CMDLBL(ERROR))
  CALL PGM(APPDATA/LOADORDERS) PARM(&RUNID)
  CALL PGM(APPDATA/POSTORDERS) PARM(&RUNID)
  RETURN
ERROR:
  SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
    MSGDTA('Batch run failed; inspect the job log for the original error.') +
    MSGTYPE(*ESCAPE)
ENDPGM
```

## 3. Make batch processing restartable

A restartable batch design has deterministic selection, a status or work table, an operation identifier, and a defined commit boundary. Mark a row complete only after the business effect succeeds. Reconcile the small failure window where the business effect succeeds but the status update does not.

Schedule the job with an owner, expected duration, alert rule, and operator runbook. A schedule entry without a recovery plan is only a timer.

**Example test schedule and inspection; replace all sample objects**

```text
ADDJOBSCDE JOB(NIGHTLY) CMD(CALL PGM(TESTAPP/NIGHTLY)) +
  FRQ(*WEEKLY) SCDDATE(*NONE) SCDDAY(*MON) SCDTIME(220000) +
  JOBQ(TESTAPP/BATCHQ) JOBD(TESTAPP/BATCHJOB)
WRKJOBSCDE
/* Use the actual number/user/name of a submitted run. */
WRKJOB JOB(123456/APPUSER/NIGHTLY)
```

## 4. SBMJOB succeeded, but did the batch program run?

An operator submits an invoice export and receives a successful submission message. That confirms the request was accepted; it is not the export result. The job may still be queued, may start later, or may fail after startup. Record the qualified job identifier returned by the submission and track that exact run. A job name such as EXPORT can be reused many times, so the job number and user are important.

The example explicitly identifies a program, job queue and initial user library list. Replace those sample objects with your application’s agreed test environment. Once submitted, inspect the queue and then the identified job. If a job is waiting, determine whether the queue is held, attached to an active subsystem and eligible for an available activity slot. Resubmitting immediately can create two exports when capacity becomes available.

Finish the investigation by checking the application’s completion evidence: exported row count, output filename and run status. A normal job end with zero rows can still be wrong when the business expected five thousand records.

**Submit one test run, then inspect the queue**

```text
SBMJOB CMD(CALL PGM(TESTAPP/EXPORT)) JOB(EXPORT) +
  JOBQ(TESTAPP/BATCHQ) INLLIBL(QTEMP TESTAPP TESTDATA)
WRKJOBQ JOBQ(TESTAPP/BATCHQ)
/* Replace with the job identifier returned by submission. */
WRKJOB JOB(123456/APPUSER/EXPORT)
```

## 5. Works interactively, fails in batch: compare the environment

A CL program calls an RPG program successfully from your terminal but fails in the nightly run. Recompiling the program first adds noise. Build a two-column comparison of the successful interactive job and failed batch job: user, current library, user library list, file overrides, parameters and job description. Also check whether the program expects a display or other resource that is unavailable in its batch use.

SBMJOB can take the initial user library list from the submitting context, from a job description or from an explicit list. Therefore a test launched from your customised development session may inherit conveniences that the scheduler never has. A job description documents intended settings, but inspect the actual active job because application startup code may change them.

Reproduce under the same restricted application identity and startup path using a small test dataset. A convincing correction works without your private library list and does not require the operator to sign on as the program owner. Record the differing setting and its source so the next deployment does not recreate the problem.

**Inspect a specific active job’s context**

```text
DSPJOB JOB(123456/APPUSER/EXPORT) OPTION(*LIBL)
DSPJOB JOB(123456/APPUSER/EXPORT) OPTION(*FILOVR)
DSPJOBD JOBD(TESTAPP/BATCHJOB)
```

## 6. Read a job log from the cause to the final failure

A final escape message often says that a program ended, while an earlier diagnostic explains the missing object, conversion failure or authority problem. Read the messages around the failure as a sequence. Capture the exact message identifier, replacement values and second-level text. The same identifier with a different library or record key may describe a different incident.

For an active job, display its log and call stack. For an ended job, locate its job log through the available job-log or spooled-file displays; QPJOBLOG is the common spooled job-log name. Do not assume that inspecting your own current job shows the batch failure. Logging configuration also affects how much detail is retained.

A job in message wait needs a deliberate response to its inquiry. Read the valid reply choices and assess what the application has already changed before replying. Record the chosen reply and why. Restarting, cancelling or answering a retry option can each have different business effects; the job status alone cannot choose among them.

**Inspect messages and the call stack for the failing run**

```text
DSPJOBLOG JOB(123456/APPUSER/EXPORT)
DSPJOB JOB(123456/APPUSER/EXPORT) OPTION(*PGMSTK)
WRKJOBLOG
```

## 7. Test a scheduled batch with a small reconciliation checklist

Scheduling controls when work is submitted, not a promise of when it starts or finishes. For a nightly import, record the scheduled time, submission time, start time and completion time separately. If submission is timely but start is late, investigate queue capacity. If start is timely but completion is late, investigate the program and its dependencies.

Before enabling the schedule, test three input cases: no eligible records, one valid record and one intentionally invalid record in test data. Decide whether an invalid record stops the complete run or is reported while other records continue. The completion message and status table should make that policy visible.

Reconcile attempted, completed and rejected counts after each test. Then simulate a restart after a completed business operation and verify it is not posted twice. Keep the original operation identifier during that retry. A new timestamp-based identifier for every attempt can hide duplicate work. These checks turn a successful scheduler entry into evidence that the business process can run unattended.

**Read existing schedules before adding another one**

```text
WRKJOBSCDE
WRKJOBQ JOBQ(TESTAPP/BATCHQ)
WRKACTJOB SBS(QBATCH)
```

<details>
<summary>Quick Revision · 2-minute recap</summary>

### Keep these in mind

- CL coordinates commands, environment and failure handling.
- SBMJOB submits work; it does not mean the work has finished.
- A job queue holds waiting jobs; a subsystem runs eligible work.
- Job descriptions, library lists and authorities affect batch behavior.
- MSGW needs message investigation; scheduling does not resolve inquiries.
- Restartable batches need durable checkpoints and overlap protection.

**Remember this pattern**

```text
WRKJOBQ JOBQ(QBATCH)
WRKACTJOB
DSPJOBLOG
```

**Common mistake:** Do not ignore escape messages or rerun a partially completed batch blindly.

**Think it through:** A scheduled import is queued but never starts. Where do you look?

<details>
<summary>Show the reasoning</summary>

Check queue hold status, subsystem/job-queue attachment and activity limits before investigating application code.

</details>

</details>

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [CL & CLLE orchestration](cl-clle.md), [Jobs & job queues](jobs-job-queues.md), [Subsystems, routing & memory pools](subsystems-pools.md), [Batch processing & scheduling](batch-scheduling.md), [Job logs & diagnostic messages](job-logs-messages.md).

## IBM documentation

- [IBM: Submit Job (SBMJOB)](https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75%2Fcl%2Fsbmjob.html)
- [IBM: Work with Job (WRKJOB)](https://www.ibm.com/docs/en/i/7.5.0?topic=w-work-job)
- [IBM: Displaying job logs](https://www.ibm.com/docs/en/i/7.5.0?topic=logs-displaying-job)
- [IBM: JOB_QUEUE_INFO view](https://www.ibm.com/docs/ssw_ibm_i_74/rzajq/rzajqviewjobqueueinfo.htm)
- [IBM: Add Job Schedule Entry (ADDJOBSCDE)](https://www.ibm.com/docs/en/i/7.4.0?topic=beginning-add-job-schedule-entry)
- [IBM: Display Job (DSPJOB)](https://www.ibm.com/docs/en/i/7.5.0?topic=d-display-job)
- [IBM: Escape and notify messages](https://www.ibm.com/docs/en/i/7.4.0?topic=program-escape-notify-messages)
- [IBM: Monitor Message (MONMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fmonmsg.html)
- [IBM: Send Program Message](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fsndpgmmsg.html)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: A job enters the subsystem](https://www.ibm.com/docs/en/i/7.5.0?topic=life-job-enters-subsystem)
- [IBM: Subsystems, job queues, memory pools](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-subsystems-job-queues-memory-pools)
- [IBM: Add Job Schedule Entry](https://www.ibm.com/docs/en/i/7.5.0?topic=beginning-add-job-schedule-entry)
- [IBM: Using COMMIT](https://www.ibm.com/docs/en/i/7.4.0?topic=control-using-commit-operation)

[← Previous path](learning-rpg-development.md) · [Next path →](learning-ile-application-design.md)
