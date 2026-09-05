# Locks, concurrency & isolation

[Question index](README.md) · Messaging & transactions · Advanced

Diagnose contention and protect correctness without unnecessarily serializing work.

## 1. How do object locks and record locks differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Object locks coordinate operations on an object, such as use, allocation, or structural changes. Record locks protect particular records during data access. The granularity and compatibility rules differ.

Identify both the holder and requester and what each is doing. A file replacement blocked by an object lock is not the same incident as two jobs attempting to update one customer row. Choose diagnostic tooling appropriate to the type of lock and preserve the evidence before intervention.

</details>

## 2. How do common isolation levels differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Uncommitted Read permits observations that may later roll back. Cursor Stability protects against reading uncommitted changes under its rules while allowing substantial concurrency. Read Stability and Repeatable Read provide stronger retention/protection, with different behavior around qualifying rows and phantoms. No Commit is a distinct IBM i option.

Choose according to the business invariant and verify Db2 for i’s exact semantics. Stronger isolation can increase lock duration and contention. Do not use terminology or defaults from another Db2 platform without checking the IBM i documentation.

</details>

## 3. What is a deadlock versus a lock timeout?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A deadlock is a cycle of dependencies: each participant waits for a resource another participant holds. A timeout means a requested wait exceeded its limit; it does not prove a cycle exists.

Capture the jobs, resources, operation order, and diagnostics. Reduce deadlocks by acquiring resources in a consistent order and keeping transactions short. Use bounded retries only when the failure category is retryable and the entire business operation is safe to repeat.

</details>

## 4. How do you prevent lost updates with optimistic concurrency?

**Advanced**

<details>
<summary>Explain the answer</summary>

Read a version or original value, then update only if it still matches. If the affected-row count is zero, the record changed or disappeared and the application must reconcile or retry. The comparison and update must be one atomic database operation.

This avoids holding a lock while a user edits a screen. Use a dedicated version counter or other reliable token, and define how conflicts are shown. Do not simply overwrite with stale screen values.

```text
UPDATE app.orders SET status = ?, version = version + 1
WHERE id = ? AND version = ?;
-- Require exactly one affected row.
```

</details>

## 5. Does UPDATE always release every relevant lock?

**Advanced**

<details>
<summary>Explain the answer</summary>

For simple native-I/O record locking, updating a record can release the current update-read lock. Under commitment control, transaction locks may remain until COMMIT or ROLLBACK. SQL isolation and cursor attributes also affect lock behavior.

Always state the access mode and commitment context when answering. “UPDATE releases the lock” is incomplete without those assumptions. Diagnose the actual lock state in the job rather than inferring it solely from the last opcode.

</details>

## 6. Would you solve contention by ending the lock holder?

**Advanced**

<details>
<summary>Explain the answer</summary>

First determine whether the holder is progressing, waiting for another resource, or abandoned. Capture its transaction purpose and expected rollback impact. Ending it can trigger lengthy recovery or interrupt critical work.

Prefer normal completion or application-supported cancellation when possible. If intervention is necessary, coordinate with the owner and verify both data consistency and waiting jobs afterward. Repeated lock incidents require a design fix such as shorter transactions, consistent ordering, or reduced hot-row updates.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Which situation proves a deadlock pattern?

A. A waits alone for a slow query
B. A waits for B while B waits for A
C. A receives an empty result
D. A compiles a module

### 2. Which isolation can allow dirty reads?

A. All isolation levels forbid them
B. Repeatable Read only
C. Uncommitted Read
D. Read Stability only

### 3. What confirms an optimistic update succeeded?

A. The SELECT previously succeeded
B. The screen stayed open
C. The job name is unchanged
D. Exactly one expected row was affected

### 4. Can transaction locks survive a native UPDATE?

A. Yes, under commitment control
B. No, never
C. Only for display files
D. Only without journaling

### 5. What helps reduce deadlocks?

A. Random update order
B. Consistent resource acquisition order
C. Longer user think time inside transactions
D. Unbounded retries

<details>
<summary>Answer key and explanations</summary>

1. **B — A waits for B while B waits for A** A cycle of resource dependencies distinguishes deadlock from a simple long wait.

2. **C — Uncommitted Read** UR permits reading changes that may not commit.

3. **D — Exactly one expected row was affected** The version predicate can fail if another writer changed the row.

4. **A — Yes, under commitment control** Transaction lock lifetime can extend to the unit-of-work boundary.

5. **B — Consistent resource acquisition order** Consistent ordering reduces circular wait opportunities.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)
- [IBM: Isolation level](https://www.ibm.com/docs/en/i/7.5.0?topic=concepts-isolation-level)
- [IBM: Db2 for i SQL reference (7.4)](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)

[← Previous](commitment-control.md) · [Next →](debugging.md)
