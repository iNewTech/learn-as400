# Commitment control & journaling

[Question index](README.md) · Messaging & transactions · Advanced

Define atomic business units and explain what commit and rollback actually cover.

## 1. What does commitment control provide?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Commitment control groups eligible changes into a unit of work that can be committed or rolled back. Its purpose is to preserve business consistency across multiple operations, such as reducing inventory and recording an order.

The application must establish the relevant commitment definition, open/access resources under the intended rules, and choose commit boundaries. Adding a COMMIT statement after unrelated nonparticipating operations does not retroactively make them atomic.

</details>

## 2. How are journaling and commitment control related?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Journaling records changes and supports recovery capabilities. Database updates under commitment control require the appropriate journaling setup. Journaling alone does not mean every application operation is inside a transaction.

Verify the files or tables, journal configuration, SQL commitment options, and native-I/O settings used by the real job. A table can be journaled while an application accesses it without commitment control. Explain both the recovery mechanism and the application’s transaction policy.

</details>

## 3. What is job scope versus activation-group scope?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A commitment definition can be scoped to a job or to an activation group, subject to the platform rules. Scope determines which participating work shares the definition. It is distinct from simply placing files in the same library.

When two procedures must succeed or fail together, confirm that they operate under the same intended definition. Test a failure in the second procedure and verify the first procedure’s changes roll back. A diagram of calls is insufficient without the runtime scope.

</details>

## 4. Who should own COMMIT in a layered application?

**Advanced**

<details>
<summary>Explain the answer</summary>

The component that knows the complete business unit should normally coordinate the transaction. Lower-level reusable routines should document participation and avoid silently committing their caller’s unrelated changes.

For example, a posting coordinator can call debit, credit, and audit routines, then commit only after all succeed. If each helper commits independently, the coordinator cannot guarantee atomicity. Define error propagation and rollback ownership in the procedure contracts.

</details>

## 5. What does ROLLBACK not undo?

**Advanced**

<details>
<summary>Explain the answer</summary>

Rollback covers participating transactional changes. It does not generally retract an email, unsend a network request, undo arbitrary IFS output, or reverse ordinary queue operations simply because they happened between database statements.

Inventory external side effects and design a recovery protocol. Use durable intent, idempotent consumers, or compensating business actions as appropriate. Never promise atomic behavior across independent systems without a mechanism that actually coordinates those systems.

</details>

## 6. How should a transaction handle a failure halfway through?

**Advanced**

<details>
<summary>Explain the answer</summary>

Capture the original error, stop further business updates, and roll back the intended unit if the transaction outcome is known and rollback is appropriate. Report a result that distinguishes business rejection from technical failure.

If the connection disappears during COMMIT, the outcome may be ambiguous to the caller. Query a durable operation identifier before retrying. Repeating the entire request blindly can duplicate a transaction that committed successfully even though its response was lost.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Does journaling alone prove an application uses commitment control?

A. No
B. Yes, always
C. Only for RPG
D. Only for SQL

### 2. Who should usually decide the final commit?

A. Every helper independently
B. The business transaction coordinator
C. The UI renderer after every field
D. A random cleanup routine

### 3. Does database rollback normally unsend an email?

A. Yes, if sent before COMMIT
B. Only from CL
C. No
D. Only in *NEW

### 4. Which scope must be checked when composing ILE updates?

A. Only library description
B. Only source member type
C. Only output queue scope
D. Commitment-definition scope

### 5. A COMMIT response is lost. Best next action?

A. Reconcile using a durable operation ID before retrying
B. Assume rollback and post again
C. Delete the journal
D. Ignore the operation forever

<details>
<summary>Answer key and explanations</summary>

1. **A — No** Access settings and commitment definitions determine transaction participation.

2. **B — The business transaction coordinator** Only the coordinator knows whether the entire business unit succeeded.

3. **C — No** External side effects need a separate consistency/recovery design.

4. **D — Commitment-definition scope** Activation-group and job scope affect which changes share a transaction.

5. **A — Reconcile using a durable operation ID before retrying** The server may have committed before the client lost the response.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Using COMMIT](https://www.ibm.com/docs/en/i/7.4.0?topic=control-using-commit-operation)
- [IBM: Commitment definitions and activation groups](https://www.ibm.com/docs/en/i/7.4.0?topic=scoping-commitment-definitions-activation-groups)
- [IBM: Isolation level](https://www.ibm.com/docs/en/i/7.5.0?topic=concepts-isolation-level)
- [IBM: Journal and commit APIs](https://www.ibm.com/docs/en/i/7.5.0?topic=category-journal-commit)

[← Previous](data-areas-message-queues.md) · [Next →](locks-isolation.md)
