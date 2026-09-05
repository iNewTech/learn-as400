# Real-world design scenarios

[Question index](README.md) · Interview practice · Advanced

Practice explaining an end-to-end solution and defending its trade-offs.

## 1. Design an order-posting operation that updates stock and accounts.

**Intermediate**

<details>
<summary>Explain the answer</summary>

Define one order as a business transaction with a stable operation ID. Validate the order, obtain required stock/account protection in a consistent order, make participating updates, record the result, and commit only when the invariant holds.

Keep remote notification outside the lock-holding path by recording outbound intent. On failure, roll back and report a meaningful result. Test insufficient stock, concurrent posting, duplicate requests, and a lost response after COMMIT. Explain who owns retry and reconciliation.

</details>

## 2. Design a nightly import of a large external file.

**Advanced**

<details>
<summary>Explain the answer</summary>

Land the file in a controlled IFS location with an explicit encoding and immutable input identity. Validate its format and counts, load into staging, and classify bad rows with actionable reasons before updating production data.

Process in coherent commit units with durable checkpoints and unique business keys. Keep a run ledger with accepted/rejected counts and reconciliation totals. Avoid a single opaque “file processed” flag; a partial failure should identify exactly which business units can be safely resumed.

</details>

## 3. Two clerks edit the same customer. How do you avoid overwriting changes?

**Advanced**

<details>
<summary>Explain the answer</summary>

Do not hold a database lock for the entire human editing interval unless that is a deliberate business requirement. Return a version token with the displayed data, then condition the update on that version.

If no row is updated, reload and show a conflict instead of overwriting blindly. Decide whether field-level merging is acceptable or whether the user must review the entire record. Audit the accepted change and test updates arriving in either order.

</details>

## 4. Design a data-queue worker for payment posting.

**Advanced**

<details>
<summary>Explain the answer</summary>

Persist the payment request with a unique operation key and status. Send a notification containing that key, then let a worker atomically claim or validate the request and perform the business transaction.

Record completion durably and treat repeated queue entries as expected duplicates. Reconcile pending records if a worker dies after receive. Add bounded retries, quarantine for invalid requests, and monitoring of age as well as queue depth. Do not rely on the queue as the sole payment ledger.

</details>

## 5. A legacy program must become an API. What would you change first?

**Advanced**

<details>
<summary>Explain the answer</summary>

Identify the business function beneath the screen flow and extract a typed request/response boundary. Remove assumptions about display files, per-user globals, interactive inquiry replies, and caller library lists.

Define authorization, idempotency, error mapping, and commit ownership before adding the HTTP wrapper. Test repeated requests in the same server job and parallel calls where supported. Preserve old screen callers through an adapter if that reduces rollout risk.

</details>

## 6. How would you migrate a critical DDS file toward SQL definitions?

**Advanced**

<details>
<summary>Explain the answer</summary>

Inventory physical data, logical files, constraints, native consumers, record formats, and level-check expectations. Define the target schema and compatibility approach, then rehearse migration on a realistic copy with row counts and business reconciliations.

Plan dependency rebuilds, authorities, journaling, cutover, and rollback. Compare both native and SQL behavior, including nulls, keys, and defaults. A successful CREATE TABLE is only a small part of proving that existing business applications still behave correctly.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Who should commit an order that changes stock and accounts?

A. Each low-level update independently
B. The printer program
C. The queue consumer before validation
D. The coordinator of the complete order unit

### 2. What makes a large import restartable?

A. Durable run identity and coherent checkpoints
B. Only a progress percentage on screen
C. Only QTEMP staging
D. Only a large buffer

### 3. What avoids overwriting a clerk’s intervening change?

A. An unconditional update from the stale screen
B. Conditional update using a version token
C. Only a longer timeout
D. Only a different terminal

### 4. What should a payment queue entry reference?

A. Only an untracked amount
B. Only the terminal number
C. A durable request with a unique operation key
D. Only the current time

### 5. Before exposing a screen program as an API, remove:

A. All validation
B. All authorization
C. All error reporting
D. Interactive and hidden per-session assumptions

<details>
<summary>Answer key and explanations</summary>

1. **D — The coordinator of the complete order unit** The complete invariant must hold before the unit commits.

2. **A — Durable run identity and coherent checkpoints** A new job must be able to identify completed and remaining business work.

3. **B — Conditional update using a version token** Optimistic conflict detection protects changes made after the initial read.

4. **C — A durable request with a unique operation key** A durable request supports deduplication and crash recovery.

5. **D — Interactive and hidden per-session assumptions** Server requests need explicit contracts and predictable state lifetimes.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Using COMMIT](https://www.ibm.com/docs/en/i/7.4.0?topic=control-using-commit-operation)
- [IBM: Isolation level](https://www.ibm.com/docs/en/i/7.5.0?topic=concepts-isolation-level)
- [IBM: Create Data Queue](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fcrtdtaq.html)
- [IBM: Integrated web services articles](https://www.ibm.com/support/pages/integrated-web-services-articles)

[← Previous](performance.md) · [Next →](troubleshooting.md)
