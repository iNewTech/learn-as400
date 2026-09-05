# Tricky questions & common myths

[Question index](README.md) · Interview practice · Advanced

Spot missing assumptions and answer with precise, defensible boundaries.

## 1. “SETLL is always faster than CHAIN.” Is that a good answer?

**Intermediate**

<details>
<summary>Explain the answer</summary>

No. The operations have different semantics: positioning versus retrieving. If all you need is an existence/positioning check, avoiding an unnecessary record transfer may be appropriate. If you need the record, SETLL followed by a read changes the comparison.

Compare equivalent work with realistic data and access paths. Explain the semantics first, then measure. An absolute speed claim without workload assumptions is usually a weaker interview answer than a correct choice based on the required operation.

</details>

## 2. “A logical file is just an SQL index.” What is missing?

**Intermediate**

<details>
<summary>Explain the answer</summary>

An LF can define a record presentation, selection, joins, and keyed access. An SQL index is an access structure, while an SQL view expresses a query interface. These roles overlap in some uses but are not identical.

Ask which behavior the existing application depends on before replacing an LF. Consider record formats, update capability, selected rows, and native I/O. A migration that preserves sorting while changing row visibility can still be a business defect.

</details>

## 3. “No lock means no concurrency problem.” Why is that wrong?

**Advanced**

<details>
<summary>Explain the answer</summary>

Removing a read lock can avoid one blocking point while allowing a stale value to be used in an update. Two jobs can then overwrite each other or both accept a condition that only one should satisfy.

Use either a protected read-update sequence or an atomic conditional update, depending on the workflow. Concurrency correctness comes from the invariant and synchronization protocol, not from the absence of visible waits. Test with intentionally overlapping requests.

</details>

## 4. “A new activation group guarantees a clean business request.” Is that sufficient?

**Advanced**

<details>
<summary>Explain the answer</summary>

A new activation group changes certain runtime-resource lifetimes, but the request can still read shared database state, data areas, queues, or external caches. It does not create a new user identity or automatically solve transaction design.

List all relevant state and its owner. Initialize request-specific data explicitly and define transaction scope, configuration sampling, and external effects. A clean local variable set is useful but cannot establish end-to-end isolation.

</details>

## 5. “Same signature means I can change a parameter length.” Correct?

**Advanced**

<details>
<summary>Explain the answer</summary>

No. A matching service-program signature does not validate each parameter layout. A caller may still pass storage sized for the old definition, and the callee may read or write beyond that contract.

Introduce a versioned procedure, keep an adapter, or rebuild affected callers in a coordinated release. A deployment test should execute old consumers against the new implementation, not merely show that the service program activates without a signature exception.

</details>

## 6. “COMMIT returned an error, so retrying is always safe.” What is missing?

**Advanced**

<details>
<summary>Explain the answer</summary>

The caller must know whether the transaction failed, rolled back, or has an ambiguous outcome because communication failed after the server completed it. Technical failure messages need classification.

Use a durable operation ID and reconcile before replaying non-idempotent work. If retry is appropriate, repeat the intended complete unit with bounded attempts. Do not generate a new identity for each retry and thereby defeat duplicate detection.

</details>

## Checkpoint — 5 MCQs

Answer all questions before checking the key. Aim for 5/5 before continuing.

### 1. Which is the best response to an absolute performance claim?

A. Accept it because the opcode is older
B. Compare equivalent operations and measure the workload
C. Reject all measurements
D. Choose the shortest source line

### 2. A no-lock read followed by unconditional update can cause:

A. Automatic deadlock prevention and perfect safety
B. Automatic rollback of other jobs
C. Lost updates
D. A new service signature

### 3. Does an LF always have the same role as an SQL index?

A. Yes, every LF is identical to an index
B. Only when named ORDERS
C. Only in QTEMP
D. No

### 4. A matching signature with a larger output buffer contract is:

A. Potentially incompatible with old callers
B. Guaranteed safe
C. Only a cosmetic change
D. Guaranteed to fail at compile time in every caller

### 5. How should an ambiguous transaction outcome be handled?

A. Always assume rollback
B. Reconcile by operation ID before retry
C. Always assume success
D. Delete the operation ID

<details>
<summary>Answer key and explanations</summary>

1. **B — Compare equivalent operations and measure the workload** Semantics and measured conditions matter more than folklore.

2. **C — Lost updates** Removing a read lock does not protect against stale writes.

3. **D — No** LF presentation and selection semantics can go beyond an access structure.

4. **A — Potentially incompatible with old callers** The caller may still supply smaller storage despite activation succeeding.

5. **B — Reconcile by operation ID before retry** Reconciliation avoids duplicating a business effect that may already be committed.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)
- [IBM: Service program signature](https://www.ibm.com/docs/en/i/7.6?topic=language-signature)
- [IBM: Commitment definitions and activation groups](https://www.ibm.com/docs/en/i/7.4.0?topic=scoping-commitment-definitions-activation-groups)
- [IBM: Isolation level](https://www.ibm.com/docs/en/i/7.5.0?topic=concepts-isolation-level)

[← Previous](troubleshooting.md) · [Next →](common-issues.md)
