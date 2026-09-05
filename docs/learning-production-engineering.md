# Production engineering: debug, secure, integrate and tune

[Learning path index](README.md) · Advanced

This path uses simple explanations, safe code skeletons, and IBM i commands before the detailed question chapters.

## Outcomes

- Turn a production symptom into a small set of measurable hypotheses.
- Separate object authority, adopted authority, and transport security.
- Improve performance by measuring the access path, waits, and job behavior.

## 1. Debug from evidence, not guesses

Start with the exact job, timestamp, message ID, input, and last successful step. Read the job log, inspect the call stack, and reproduce with the smallest safe input. For RPG, inspect variables at a breakpoint; for CL, trace the command and monitored message. Preserve the evidence before restarting a job.

A production fix should include a way to prove the symptom is gone: a repeatable test, a metric, a log message, or a reconciliation count.

**Useful investigation commands**

```cl
DSPJOB JOB(123456/USER/BATCH) OPTION(*JOBLOG)
DSPJOBLOG JOB(123456/USER/BATCH)
STRDBG PGM(APPDATA/ORDENTRY)
DSPPFM FILE(APPDATA/QRPGLESRC) MBR(ORDENTRY)
```

**Flow**

1. Capture symptom, job, timestamp, and message ID
2. Check job log and call stack
3. Form one hypothesis and inspect its evidence
4. Reproduce safely or add a targeted diagnostic
5. Fix, verify, and document the recovery

## 2. Security is part of the design

Check the object owner, public authority, private authorities, adopted authority, and the profile under which a job runs. A program that works for its owner may fail for a real user. Avoid broad *PUBLIC authority as a convenience; grant the smallest access required and document why an exception exists.

For an API, validate input, protect credentials, use TLS, log a correlation ID without secrets, and define how a timeout or duplicate request is handled. IBM i authority does not replace transport and application controls.

**Inspect authority before changing it**

```cl
DSPOBJAUT OBJ(APPDATA/ORDENTRY) OBJTYPE(*PGM)
DSPLIB LIB(APPDATA)
DSPUSRPRF USRPRF(APPUSER) TYPE(*BASIC)
```

## 3. Tune the bottleneck you can measure

Separate CPU, I/O, lock wait, network, and queue delay. For SQL, inspect the access plan and predicates; for native I/O, inspect the key and access path; for jobs, inspect active-job wait reasons and memory-pool pressure. A new index is useful only when it improves the measured plan without creating unacceptable write cost.

Record before and after timings with the same input and concurrency. Keep the change small enough to roll back and watch the job after deployment.

**Fully free**

```sql
-- inspect the plan in the target release
explain plan for
  select order_id, amount
    from appdata.orders
   where customer_id = :customerId
     and status = 'OPEN';
```

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [Debugging RPG, CL & batch](debugging.md), [System operations & recovery](system-operations.md), [Security & authorities](security-authorities.md), [APIs, JSON & integration](apis-integration.md), [Performance & SQL tuning](performance.md).

## IBM documentation

- [IBM: Starting debug mode](https://www.ibm.com/docs/en/i/7.6.0?topic=programs-starting-debug-mode)
- [IBM: ILE RPG reference (7.6)](https://www.ibm.com/docs/it/ssw_ibm_i_76/pdf/sc092508.pdf)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: Integrated file system](https://www.ibm.com/docs/en/i/7.4.0?topic=system-integrated-file-ifs)
- [IBM: Journal and commit APIs](https://www.ibm.com/docs/en/i/7.5.0?topic=category-journal-commit)
- [IBM: Object and library authority](https://www.ibm.com/docs/ssw_ibm_i_74/rzamv/rzamvundhowobjandlibauthtog.htm)
- [IBM: Batch workload and elevated authority analysis](https://www.ibm.com/support/pages/batch-workload-visibility-and-elevated-authority-analysis)
- [IBM: Authority options for SQL tuning](https://www.ibm.com/docs/ssw_ibm_i_74/rzahf/rzahfauthopt.htm)
- [IBM: Integrated web services articles](https://www.ibm.com/support/pages/integrated-web-services-articles)
- [IBM: Data queue server](https://www.ibm.com/docs/en/i/7.6.0?topic=programs-data-queue-server)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)
- [IBM: SQL plan cache properties](https://www.ibm.com/docs/en/i/7.5.0?topic=cache-properties)
- [IBM: SQL plan cache statements](https://www.ibm.com/docs/en/i/7.4.0?topic=cache-show-statements)

[← Previous path](learning-messaging-and-recovery.md) · [Next path →](learning-interview-lab.md)
