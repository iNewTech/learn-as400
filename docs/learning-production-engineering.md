# Production engineering: debug, secure, integrate and tune

[Learning path index](README.md) · Advanced

Debug RPGLE, investigate IBM i authority failures and record locks, and tune Db2 SQL using repeatable test cases, job evidence and Visual Explain.

Updated: 2026-10-11.

## Outcomes

- Turn a production symptom into a small set of measurable hypotheses.
- Separate object authority, adopted authority, and transport security.
- Improve performance by measuring the access path, waits, and job behavior.

## 1. Debug from evidence, not guesses

Start with the exact job, timestamp, message ID, input, and last successful step. Read the job log, inspect the call stack, and reproduce with the smallest safe input. For RPG, inspect variables at a breakpoint; for CL, trace the command and monitored message. Preserve the evidence before restarting a job.

A production fix should include a way to prove the symptom is gone: a repeatable test, a metric, a log message, or a reconciliation count.

**Useful investigation commands**

```text
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

```text
DSPOBJAUT OBJ(APPDATA/ORDENTRY) OBJTYPE(*PGM)
DSPLIB LIB(APPDATA)
DSPUSRPRF USRPRF(APPUSER) TYPE(*BASIC)
```

## 3. Tune the bottleneck you can measure

Separate CPU, I/O, lock wait, network, and queue delay. For SQL, inspect the access plan and predicates; for native I/O, inspect the key and access path; for jobs, inspect active-job wait reasons and memory-pool pressure. A new index is useful only when it improves the measured plan without creating unacceptable write cost.

Record before and after timings with the same input and concurrency. Keep the change small enough to roll back and watch the job after deployment.

**Select this test query in ACS and choose Visual Explain**

**Example**

```sql
SELECT ORDER_ID, AMOUNT
  FROM TESTDATA.ORDERS
 WHERE CUSTOMER_ID = 1001
   AND STATUS = 'OPEN';
```

## 4. Debug an RPGLE calculation with a small repeatable case

Suppose an order total is wrong only when quantity is three and the unit price has two decimal positions. Start with that input and the expected arithmetic result. Record the program object, source version, parameter types and actual output. A broad statement such as the calculation is broken gives you no test that can prove a correction.

Use a test build with suitable debug information and place a breakpoint before the calculation. Inspect the input values, then step over the calculation and inspect the result field. Check its precision and decimal positions as well as the expression. A mathematically correct expression can still lose information when assigned to a field that cannot represent the result.

STRDBG starts the debugging environment; it does not run the application for you. UPDPROD(*NO) restricts updates to database files in libraries designated as production, but it is not a complete sandbox for every API, IFS action or external call. Use isolated test data and test integrations. Repeat the original case plus zero, negative and boundary values appropriate to the business rule.

**Start and finish a controlled debug session**

```text
STRDBG PGM(TESTAPP/ORDTOTAL) UPDPROD(*NO)
/* Set breakpoints, then invoke the program with its actual parameter contract. */
/* Verify expected and actual values in the debugger. */
ENDDBG
```

## 5. Authority failure: explain why the developer succeeds

A program works for the developer but the support profile receives an authority error. First capture the failing operation and the exact qualified object. The user may be able to call the program while lacking access to a file it opens later. Seeing a menu or finding an object is not proof that every requested operation is authorised.

Inspect the library and object authorities, the active profile and relevant group memberships. If adopted authority is part of the application design, check the program attributes and call path too. Copying a test program under a different owner can change that context. Avoid making *PUBLIC powerful merely because it removes the error for one test.

Build an access test with two results: the authorised role succeeds at its required operation, and an unrelated profile is still refused. Ask the security owner to choose the intended authority mechanism, then record that decision in the deployment steps. The fix is complete only when the real application identity works after a normal release, rather than through a one-off grant nobody can explain.

**Collect authority evidence before requesting a change**

```text
DSPOBJAUT OBJ(TESTDATA) OBJTYPE(*LIB)
DSPOBJAUT OBJ(TESTDATA/ORDERS) OBJTYPE(*FILE)
DSPUSRPRF USRPRF(APPUSER) TYPE(*BASIC)
DSPPGM PGM(TESTAPP/ORDTOTAL) DETAIL(*BASIC)
```

## 6. A slow job may be waiting for a lock rather than using CPU

Two users update the same order. One leaves the record in a long transaction while the other waits. Increasing memory or adding an index does not directly remove that transaction conflict. Capture the waiting job, the object or record identified by the diagnostic, and the job that owns the incompatible lock. Then ask what work the owner is still doing.

WRKOBJLCK displays object-level requests, including locks held and requests waiting. It does not display database record locks. Use the record-lock display for the actual database file when the symptom concerns a row. Confusing these two views can lead to the false conclusion that no lock exists.

In a test environment, reproduce the conflict with two sessions and a known key. Confirm when the second session begins waiting and whether it proceeds after the first commits or rolls back. The lasting change may be a shorter transaction, consistent update order or an application message that explains retry. Ending the owner’s job is an operational decision with recovery consequences, not a diagnostic shortcut.

**Inspect file/object locks and record locks separately**

```text
WRKOBJLCK OBJ(TESTDATA/ORDERS) OBJTYPE(*FILE)
DSPRCDLCK FILE(TESTDATA/ORDERS) MBR(*FIRST)
```

## 7. Compare an SQL query plan with the business result

For an order enquiry, write down the required result before tuning: open orders for one customer, in order-ID sequence. Measure the query with representative data and record its returned row count. A faster query that omits orders or changes duplicate handling is not an improvement.

Select the statement in ACS Run SQL Scripts and use Visual Explain. Inspect how rows are accessed and filtered, whether sorting is required, and the estimates used by the optimizer. Explain-only information is an estimate; Run and Explain executes the statement. Choose deliberately, especially when analysing data-changing SQL or expensive production queries.

Compare the same statement, parameter values, data volume and concurrency after a proposed index or predicate change. Include write cost and other important workloads in the decision. A single fast run against a warm cache is weak evidence. Save the plan and timings so the next developer can see what improved and under which conditions.

**Standalone enquiry query to inspect in Visual Explain**

**Example**

```sql
SELECT ORDER_ID, AMOUNT
  FROM TESTDATA.ORDERS
 WHERE CUSTOMER_ID = 1001
   AND STATUS = 'OPEN'
 ORDER BY ORDER_ID;
```

<details>
<summary>Quick Revision · 2-minute recap</summary>

### Keep these in mind

- Capture job identity, timestamp, messages and object versions first.
- Debug the object actually running with the matching source view.
- Separate CPU, SQL, lock and external-system waits.
- Give the runtime identity only the authority it needs.
- Validate integration input, encoding and retry behavior.
- Compare performance before and after with the same workload.

**Remember this pattern**

```text
WRKACTJOB
DSPJOBLOG
DSPOBJAUT OBJ(APP/ORDERS) OBJTYPE(*FILE)
```

**Common mistake:** A job that ends normally can still produce the wrong business result.

**Think it through:** An API times out after posting an order. Should the caller retry immediately?

<details>
<summary>Show the reasoning</summary>

First resolve the request ID and recorded outcome. Retry only under an idempotent contract so an uncertain response does not create a second order.

</details>

</details>

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [Debugging RPG, CL & batch](debugging.md), [System operations & recovery](system-operations.md), [Security & authorities](security-authorities.md), [APIs, JSON & integration](apis-integration.md), [Performance & SQL tuning](performance.md).

## IBM documentation

- [IBM: Starting debug mode](https://www.ibm.com/docs/en/i/7.4.0?topic=programs-starting-debug-mode)
- [IBM: Preventing database updates during debugging](https://www.ibm.com/docs/en/i/7.4?topic=mode-preventing-updates-database-files-in-production-libraries)
- [IBM: Work with Object Locks (WRKOBJLCK)](https://www.ibm.com/docs/en/i/7.5.0?topic=w-work-object-locks)
- [IBM: Starting Visual Explain](https://www.ibm.com/docs/en/i/7.4.0?topic=explain-start)
- [IBM: Viewing queries with Visual Explain](https://www.ibm.com/docs/en/i/7.4?topic=tools-visual-explain)
- [IBM: Analyzing object and library authorities](https://www.ibm.com/docs/en/i/7.5.0?topic=security-analyzing-object-library-authorities)
- [IBM: Display Object Authority (DSPOBJAUT)](https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75%2Fcl%2Fdspobjaut.html)
- [IBM: Display Record Locks (DSPRCDLCK)](https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75%2Fcl%2Fdsprcdlck.html)
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
