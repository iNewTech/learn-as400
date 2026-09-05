# Data queues & asynchronous work

[Question index](README.md) · Messaging & transactions · Intermediate

Design producer-consumer flows with correct payloads and recovery behavior.

## 1. What is a data queue used for?

**Easy**

<details>
<summary>Explain the answer</summary>

A *DTAQ allows programs or jobs to send and receive entries for interprocess communication. It can decouple a producer from a consumer and support FIFO, LIFO, or keyed organization as configured.

A queue transports work information; it does not by itself define a business workflow. Specify the payload format, sender/receiver behavior, waiting policy, and failure recovery. A queue name alone is not a guarantee of durable end-to-end processing.

</details>

## 2. Which APIs send and receive data-queue entries?

**Intermediate**

<details>
<summary>Explain the answer</summary>

QSNDDTAQ sends an entry and QRCVDTAQ receives one using the relevant API parameters. Correct queue/library naming, data length, payload storage, and optional keyed behavior matter. Receiving can wait according to the requested wait parameter.

Prototype the APIs accurately and follow their documented parameter types. Include a payload version and correlation identifier so both ends can evolve without silently interpreting different byte layouts. Test empty queues, timeouts, invalid lengths, and malformed entries.

</details>

## 3. How do FIFO, LIFO, and keyed queues change processing?

**Intermediate**

<details>
<summary>Explain the answer</summary>

FIFO favors arrival order; LIFO favors the most recently added entry; keyed queues support selection using a key and the specified comparison behavior. The choice should match how consumers identify and prioritize work.

Arrival order alone does not prove business ordering across multiple producers or concurrent consumers. If two updates to the same order must be serialized, define a per-order sequencing policy. Avoid claiming exactly-once execution merely because a queue is FIFO.

</details>

## 4. What if a consumer crashes after receiving an entry?

**Advanced**

<details>
<summary>Explain the answer</summary>

If the receive removes the entry, a crash before successful business processing can leave the transport entry gone while the work remains incomplete. Conversely, retry logic can repeat a business effect if it cannot tell whether the earlier attempt committed.

Persist business intent and status separately, and use idempotent processing with reconciliation. A robust design can send a durable work-record key on the queue, allowing unfinished work to be rediscovered. Treat the queue as a notification path, not the only evidence of business obligation.

</details>

## 5. Does database ROLLBACK undo a normal data-queue send?

**Advanced**

<details>
<summary>Explain the answer</summary>

Do not assume ordinary queue sends and receives are atomic participants in the database transaction. Journaling a queue and rolling back database changes are different capabilities.

For database-plus-message consistency, write durable outbound intent in the same database transaction as the business change, then let a dispatcher send and retry. A consumer uses an operation key to handle duplicates. This outbox approach addresses the gap between committing data and notifying another component.

</details>

## 6. How do you investigate a growing queue backlog?

**Advanced**

<details>
<summary>Explain the answer</summary>

Measure arrival and consumption rates, oldest work age, active consumers, receive waits, and processing duration. Separate a stopped consumer from a slow database, repeated poison entry, or saturated external service.

Use bounded retries and a defined quarantine/dead-letter process in the application design. Preserve the original work key and failure context. Increasing consumers may help independent work but can worsen contention when every entry updates the same hot record.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Which API sends a data-queue entry?

A. QRCVDTAQ
B. CRTPGM
C. QSNDDTAQ
D. DSPFFD

### 2. Does FIFO guarantee exactly-once business processing?

A. Yes, even after crashes
B. Only with two consumers
C. Only for RPG
D. No

### 3. A consumer loses an entry after receive then crashes. What design helps?

A. Durable work records and reconciliation
B. Only a larger terminal window
C. A shorter object name
D. Ignoring failed work

### 4. How should database changes and notification intent be coordinated?

A. Assume every send rolls back
B. Persist outbound intent in the same database transaction
C. Send twice before every COMMIT
D. Keep all intent only in a variable

### 5. Which backlog metric identifies aging work?

A. Only the queue object name
B. Only source line count
C. Age of the oldest pending item
D. Only compile duration

<details>
<summary>Answer key and explanations</summary>

1. **C — QSNDDTAQ** QSNDDTAQ sends entries and QRCVDTAQ receives them; their parameter contracts must match the queue and payload.

2. **D — No** Ordering and end-to-end delivery guarantees are different concerns.

3. **A — Durable work records and reconciliation** Persisted intent lets the system rediscover incomplete business work.

4. **B — Persist outbound intent in the same database transaction** An outbox avoids losing intent between database commit and external notification.

5. **C — Age of the oldest pending item** Depth plus age and throughput are useful operational indicators.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Create Data Queue](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fcrtdtaq.html)
- [IBM: Data queue server](https://www.ibm.com/docs/en/i/7.6.0?topic=programs-data-queue-server)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)

[← Previous](activation-groups.md) · [Next →](data-areas-message-queues.md)
