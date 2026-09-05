# Messaging, data queues, data areas and recovery

[Learning path index](README.md) · Intermediate

This path uses simple explanations, safe code skeletons, and IBM i commands before the detailed question chapters.

## Outcomes

- Select a data queue, data area, or message queue for a communication need.
- Explain ordering, waiting, ownership, and failure behavior.
- Connect asynchronous work to idempotency, journaling, and operator recovery.

## 1. Choose the smallest communication primitive

A data queue is designed for passing entries between jobs, often as a producer-consumer channel. A data area is a small named value used for configuration or coordination. A message queue carries messages for a job, user, or program and supports IBM i message handling semantics.

Do not use a data area as a general-purpose database row, and do not assume a queue is durable business history. Persist the business state separately when replay, audit, or reconciliation is required.

**Flow**

1. Producer validates and writes an entry
2. Queue preserves the agreed ordering and key
3. Consumer waits or reads with a timeout
4. Consumer applies an idempotent business action
5. Success is acknowledged; failure is retried or quarantined

## 2. Make waiting and ownership explicit

A receiver should state whether it waits, how long it waits, and what an empty queue means. A sender should handle a full or unavailable queue. Include a correlation or operation identifier so an operator can trace one message through the job log and business tables.

For a data area, define who creates it, who can change it, its length and format, and how a deployment updates it. A clear owner prevents hidden configuration changes.

**CL commands to discuss**

```cl
CRTDTAQ DTAQ(APPDATA/ORDERQ) TYPE(*STD)
SNDDTAQ DTAQ(APPDATA/ORDERQ) LEN(80) DTA('order-123')
RTVDTAQ DTAQ(APPDATA/ORDERQ) WAIT(30)
CRTDTAARA DTAARA(APPDATA/MODE) TYPE(*CHAR) LEN(10)
```

## 3. Design the failure path before the happy path

A queue consumer can fail after applying a change and before acknowledging the entry. The handler must be safe to run again or must record a durable de-duplication key. Add retry limits and a dead-letter or operator review path for poison messages.

Use message APIs and job logs to make a failure diagnosable. A useful message includes the operation ID, object or table, reason, and the next safe action.

**Fully free**

```text
receive entry with timeout
if no entry: return normally
if already processed(operationId): acknowledge and continue
apply business change in one transaction
record operationId
acknowledge only after commit
```

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [Data queues & asynchronous work](data-queues.md), [Data areas & message queues](data-areas-message-queues.md).

## IBM documentation

- [IBM: Create Data Queue](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fcrtdtaq.html)
- [IBM: Data queue server](https://www.ibm.com/docs/en/i/7.6.0?topic=programs-data-queue-server)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)
- [IBM: Using data areas](https://www.ibm.com/docs/en/i/7.5.0?topic=procedures-using-data-areas)
- [IBM: Send Program Message](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fsndpgmmsg.html)

[← Previous path](learning-ile-application-design.md) · [Next path →](learning-production-engineering.md)
