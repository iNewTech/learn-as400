# Messaging, data queues, data areas and recovery

[Learning path index](README.md) · Intermediate

Learn IBM i data queues, data areas and message queues with SQL and CL examples, timeout handling, duplicate detection and practical recovery scenarios.

Updated: 2026-10-11.

## Outcomes

- Select a data queue, data area, or message queue for a communication need.
- Explain ordering, waiting, ownership, and failure behavior.
- Connect asynchronous work to idempotency, journaling, and operator recovery.

## 1. Choose the smallest communication primitive

A data queue is designed for passing entries between jobs, often as a producer-consumer channel. A data area is a small named value used for configuration or coordination. A message queue carries messages for a job, user, or program and supports IBM i message handling semantics.

Do not use a data area as a general-purpose database row, and do not assume a queue is durable business history. Persist the business state separately when replay, audit, or reconciliation is required.

**Flow**

1. Producer records durable work where recovery is required
2. Producer sends a notification to the data queue
3. Consumer receives the notification using a defined wait policy
4. Consumer applies an idempotent business action
5. Application records completion or preserves failure for recovery

## 2. Make waiting and ownership explicit

A receiver should state whether it waits, how long it waits, and what an empty queue means. A sender should handle a full or unavailable queue. Include a correlation or operation identifier so an operator can trace one notification through the job log and business tables. Use QSNDDTAQ and QRCVDTAQ APIs, or the documented QSYS2 SQL services, for sending and receiving.

For a data area, define who creates it, who can change it, its length and format, and how a deployment updates it. A clear owner prevents hidden configuration changes.

**Create and inspect sample communication objects in a test library**

```text
CRTDTAQ DTAQ(TESTAPP/ORDERQ) TYPE(*STD) MAXLEN(256) SEQ(*FIFO)
CRTDTAARA DTAARA(TESTAPP/MODE) TYPE(*CHAR) LEN(10) VALUE('TEST')
DSPDTAARA DTAARA(TESTAPP/MODE)
```

## 3. Design the failure path before the happy path

By default, QRCVDTAQ removes an entry when it receives it. An application cannot assume that a database commit later acknowledges that queue entry, or that a database rollback automatically returns it to the queue. If losing a notification would lose business work, store recoverable work separately and use a durable operation identifier.

A worker must cope with both repeated and missing notifications. Record business completion with the database effect in the same transaction where applicable. Add retry limits and an operator review path for invalid work. A useful failure record includes the operation ID, object or table, reason and next safe action.

**Application recovery sketch, not a queue acknowledgement API**

**Example**

```text
receive notification with timeout
if no entry: wait again or finish normally
load the durable work item identified by operationId
if already completed: skip duplicate business work
claim pending work using the application concurrency rule
apply database change and completion marker in one transaction
on failure: record the problem and leave work recoverable
periodically reconcile unfinished work, even without a notification
```

## 4. Send an order notification and inspect it with SQL

A useful first data-queue exercise sends an order identifier rather than a complete copy of the order. The consumer can use that identifier to read the current business record. Agree the message shape, maximum length and encoding before writing either side. A producer sending a number as packed bytes and a consumer expecting printable text do not share the same contract.

Create a dedicated test queue with an explicit entry length. The SQL example uses IBM i services available on supported release and PTF levels. The queue and library arguments identify the same object used by the native QSNDDTAQ and QRCVDTAQ APIs. The sample notification includes a format version and an operation identifier so future changes and repeated work are distinguishable.

The receive uses REMOVE => NO to inspect without consuming this test entry. Repeating that inspection may show the same entry again; it is not evidence that the producer sent twice. Use a controlled test consumer to remove it when testing actual processing.

**Create the exercise queue in a test library**

```text
CRTDTAQ DTAQ(TESTAPP/ORDERQ) MAXLEN(256) SEQ(*FIFO)
```

**Send then inspect one test notification in ACS Run SQL Scripts**

**Example**

```sql
CALL QSYS2.SEND_DATA_QUEUE(
  MESSAGE_DATA => 'v1|order-1001|operation-42',
  DATA_QUEUE => 'ORDERQ', DATA_QUEUE_LIBRARY => 'TESTAPP');

SELECT MESSAGE_DATA
  FROM TABLE(QSYS2.RECEIVE_DATA_QUEUE(
    DATA_QUEUE => 'ORDERQ', DATA_QUEUE_LIBRARY => 'TESTAPP',
    REMOVE => 'NO', WAIT_TIME => 0));
```

## 5. Queue receive is not a transaction acknowledgement

Consider a consumer that receives order-1001 and crashes before updating its status. QRCVDTAQ normally removes the entry when it receives it. A later database rollback does not mean your application now has a broker-style acknowledgement and redelivery workflow. Treat queue notification and business completion as separate facts; design how unfinished work is found again.

One practical design stores pending work durably in a table and treats the queue as a wake-up signal. The consumer claims the work according to a defined concurrency rule, commits its database effect and completion marker together, and records failures for review. A reconciliation process can find pending work when a notification was lost or never sent. This is an application design, not a promise supplied by the queue API.

Test both failure windows: after notification receipt but before the business commit, and after commit but before the consumer reports success. The first should leave recoverable pending work. The second should not create a second invoice when retried. External effects such as emailing or calling another service need their own duplicate-handling agreement.

**Flow**

1. Store pending operation with a stable identifier
2. Send a queue notification
3. Consumer claims the durable work item
4. Commit database effect and completion record together
5. Reconcile pending work and investigate failed attempts

## 6. Handle empty queues, retries and poison messages differently

An empty queue after a timed wait is a normal outcome for a worker. With the native receive API, a zero data length identifies the no-entry outcome; with the SQL table function, no matching entry produces no result row. Clear or reset your processing state before the next receive so yesterday’s message buffer cannot be processed again by accident.

A temporary resource conflict may be retryable, while a message with an unknown format version is unlikely to become valid after ten identical attempts. Set an attempt limit and delay policy for recoverable failures. Save the operation ID, attempt count and diagnostic details in a review record for invalid work. Do not continuously remove and immediately re-send the same failing item at maximum speed.

For your test, send one valid notification, one unknown-version notification and then leave the queue empty. Expect one completed operation, one clearly reported rejected operation and an idle consumer. Measure those outcomes separately. Queue ordering alone does not guarantee completion ordering when several workers process entries at different speeds.

- Empty: wait or finish normally according to the worker contract.
- Transient failure: retry with a bounded delay and the same operation ID.
- Invalid payload: preserve diagnostic evidence for correction and controlled replay.

## 7. Data area configuration: read safely and coordinate updates

A ten-character data area can hold an application mode such as TEST or LIVE. A CL wrapper retrieves the value into a compatible variable and validates it before deciding what to do. Do not interpret a blank or unexpected value as permission to proceed with the most powerful mode. The value contract belongs in the deployment and operations documentation.

RTVDTAARA protects the individual retrieval operation, but a sequence that reads a shared counter, adds one and writes it back needs coordination across the whole sequence. Otherwise two jobs can both read 41 and both write 42. Explicit object allocation is one IBM i option for such a multi-command data-area operation; cleanup must release the allocation on both success and error paths. A database sequence or transactional table is often clearer for business identifiers.

A local data area belongs to its job. A named application data area is a different shared object with its own authority. During testing, identify which kind the application actually uses, then verify behaviour for the valid, blank and invalid configuration values.

**CLLE reads and validates a named character data area**

**Example**

```clle
PGM
  DCL VAR(&MODE) TYPE(*CHAR) LEN(10)
  RTVDTAARA DTAARA(TESTAPP/MODE) RTNVAR(&MODE)
  IF COND(&MODE *NE 'TEST') THEN(DO)
    SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
      MSGDTA('This exercise requires MODE=TEST.') +
      MSGTYPE(*ESCAPE)
  ENDDO
  /* Continue the test operation here. */
ENDPGM
```

<details>
<summary>Quick Revision · 2-minute recap</summary>

### Keep these in mind

- Data queues exchange work entries; message queues carry messages and inquiries.
- A data area holds a small shared value or configuration item.
- Coordinate shared read-modify-write operations to avoid lost updates.
- Ordinary data-queue operations do not join database rollback.
- A worker needs durable work identity, retry limits and duplicate protection.
- Journals support recovery; backups and tested restore procedures are still needed.

**Remember this pattern**

```text
DSPDTAARA DTAARA(APP/CONTROL)
DSPMSG MSGQ(APP/OPERATOR)
```

**Common mistake:** Receiving a queue entry is not proof that its business work committed.

**Think it through:** A consumer crashes after receiving a payment request. How can it recover?

<details>
<summary>Show the reasoning</summary>

Use a durable request/status record and idempotent processing. A queue notification alone cannot recover the lost business intent.

</details>

</details>

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [Data queues & asynchronous work](data-queues.md), [Data areas & message queues](data-areas-message-queues.md).

## IBM documentation

- [IBM: Create Data Queue (CRTDTAQ)](https://www.ibm.com/docs/en/i/7.5.0?topic=c-create-data-queue)
- [IBM: Receive Data Queue (QRCVDTAQ) API](https://www.ibm.com/docs/en/i/7.4?topic=ssw_ibm_i_74%2Fapis%2Fqrcvdtaq.htm)
- [IBM: Send Data Queue (QSNDDTAQ) API](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fapis%2Fqsnddtaq.htm)
- [IBM: RECEIVE_DATA_QUEUE table function](https://www.ibm.com/docs/en/i/7.4.0?topic=services-receive-data-queue-table-function)
- [IBM: Data queue API and SQL examples](https://www.ibm.com/support/pages/node/638819)
- [IBM: Retrieve Data Area (RTVDTAARA)](https://www.ibm.com/docs/en/i/7.5.0?topic=r-retrieve-data-area)
- [IBM: Escape and notify messages](https://www.ibm.com/docs/en/i/7.4.0?topic=program-escape-notify-messages)
- [IBM: Create Data Queue](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fcrtdtaq.html)
- [IBM: Data queue server](https://www.ibm.com/docs/en/i/7.6.0?topic=programs-data-queue-server)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)
- [IBM: Using data areas](https://www.ibm.com/docs/en/i/7.5.0?topic=procedures-using-data-areas)
- [IBM: Send Program Message](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fsndpgmmsg.html)

[← Previous path](learning-ile-application-design.md) · [Next path →](learning-production-engineering.md)
