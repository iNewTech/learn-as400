# Jobs, CL and batch work management

[Learning path index](README.md) · Intermediate

This path uses simple explanations, safe code skeletons, and IBM i commands before the detailed question chapters.

## Outcomes

- Trace a job from submission to a subsystem and job queue.
- Use CL as an orchestrator with clear message handling.
- Design a batch run that can be monitored and restarted.

## 1. A job is the runtime boundary

A job carries identity, library lists, environment values, routing data, and a job log. Interactive and batch jobs can call the same program but have different response and monitoring expectations. A job queue holds work until a subsystem has an available activity level.

When a program behaves differently in batch, compare the job attributes and library list before changing code. The diagnostic message often tells you which resolution or authority assumption failed.

**Observe the work-management path**

```cl
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

**Fully free**

```clle
PGM PARM(&RUNID)
  DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
  MONMSG MSGID(CPF0000) EXEC(GOTO CMDLBL(ERROR))
  CALL PGM(APPDATA/LOADORDERS) PARM(&RUNID)
  CALL PGM(APPDATA/POSTORDERS) PARM(&RUNID)
  RETURN
ERROR:
  SNDPGMMSG MSG('Batch run failed; inspect the job log.') TOPGMQ(*SAME) MSGTYPE(*ESCAPE)
ENDPGM
```

## 3. Make batch processing restartable

A restartable batch design has deterministic selection, a status or work table, an operation identifier, and a defined commit boundary. Mark a row complete only after the business effect succeeds. Reconcile the small failure window where the business effect succeeds but the status update does not.

Schedule the job with an owner, expected duration, alert rule, and operator runbook. A schedule entry without a recovery plan is only a timer.

**Schedule and inspect a run**

```cl
ADDJOBSCDE JOB(APPDATA/NIGHTLY) CMD(CALL PGM(APPDATA/NIGHTLY)) FRQ(*WEEKLY)
WRKJOBSCDE
DSPJOBLOG JOB(APPDATA/NIGHTLY)
```

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [CL & CLLE orchestration](cl-clle.md), [Jobs & job queues](jobs-job-queues.md), [Subsystems, routing & memory pools](subsystems-pools.md), [Batch processing & scheduling](batch-scheduling.md), [Job logs & diagnostic messages](job-logs-messages.md).

## IBM documentation

- [IBM: Monitor Message (MONMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fmonmsg.html)
- [IBM: Send Program Message](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fsndpgmmsg.html)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: A job enters the subsystem](https://www.ibm.com/docs/en/i/7.5.0?topic=life-job-enters-subsystem)
- [IBM: Subsystems, job queues, memory pools](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-subsystems-job-queues-memory-pools)
- [IBM: Add Job Schedule Entry](https://www.ibm.com/docs/en/i/7.5.0?topic=beginning-add-job-schedule-entry)
- [IBM: Using COMMIT](https://www.ibm.com/docs/en/i/7.4.0?topic=control-using-commit-operation)

[← Previous path](learning-rpg-development.md) · [Next path →](learning-ile-application-design.md)
