# Activation groups & lifecycle

[Question index](README.md) · ILE & application design · Advanced

Reason about storage, open files, commitment scope, and repeated calls.

## 1. What is an activation group?

**Intermediate**

<details>
<summary>Explain the answer</summary>

An activation group is a resource grouping within a job for ILE execution. It helps organize activated programs and associated storage, files, and other scoped resources. It is not a separate job or a security identity.

Use it to reason about lifecycle and isolation of runtime resources. Two groups can still access the same database records and contend on locks. Explain how the application creates, reuses, and ends the group rather than treating its name as a performance setting.

</details>

## 2. What do named, *NEW, and *CALLER choices imply?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A named activation group can be reused across calls in a job. A program using *NEW gets a new activation group for its invocation. *CALLER runs in the caller’s activation group where that attribute is supported.

These choices affect resource lifetime and interaction with the caller. Service programs have their own supported activation attributes and are not configured identically to every program. Check object attributes and command rules rather than applying one compile recipe to all ILE object types.

</details>

## 3. Is an activation group the same as a transaction?

**Advanced**

<details>
<summary>Explain the answer</summary>

No. An activation group is a runtime resource boundary. Commitment control may be scoped to an activation group or to a job, so transactions and activation groups have related but distinct lifecycles.

A procedure in another group may not participate in the transaction you expected if it uses a different commitment definition. Establish and document commitment scope before composing updates across components. Verify rollback behavior with an intentional failure after the first update.

</details>

## 4. Why can a service retain yesterday’s configuration in one server job?

**Advanced**

<details>
<summary>Explain the answer</summary>

The service may cache configuration in static or global state that persists for its activation lifetime. Long-lived jobs can continue using that state even after the underlying configuration has changed.

Define invalidation explicitly: a version check, bounded cache lifetime, reload operation, or controlled job recycling. Do not assume recompiling source or changing a data area causes active cached variables to refresh. Test repeated requests within the same job, not only fresh calls in new jobs.

</details>

## 5. When is reclaiming an activation group appropriate?

**Advanced**

<details>
<summary>Explain the answer</summary>

It can be appropriate to release a group’s resources when the application is quiescent and the group’s lifecycle is understood. Reclaiming is not a substitute for application cleanup or a universal fix for every persistent-state bug.

Determine whether procedures are active, whether files or transactions are in use, and how callers expect resources to persist. Coordinate with the application owner and validate after reclamation. The precise reclaim restrictions and behavior depend on object/runtime conditions.

</details>

## 6. How do you choose activation-group strategy for a reusable component?

**Advanced**

<details>
<summary>Explain the answer</summary>

Start with desired ownership: should the caller own state and transaction scope, or should the component maintain a deliberate independent lifecycle? Identify file sharing, static state, error propagation, and concurrency requirements.

Prefer simple explicit contracts and measure actual activation overhead if performance matters. Avoid choosing a single group for the entire estate by habit. Document the decision and test independent callers, repeated calls, failure cleanup, and long-lived server behavior.

</details>

## Checkpoint — 5 MCQs

Answer all questions before checking the key. Aim for 5/5 before continuing.

### 1. Is an activation group a separate job?

A. Yes, with its own job queue
B. No
C. Only when named
D. Only for SQL

### 2. Which choice commonly reuses a named group within a job?

A. Always *NEW
B. A new job queue
C. A named activation group
D. An output queue

### 3. Does a new group necessarily create the desired independent transaction?

A. Yes, always
B. Only for CL
C. Only for data areas
D. No, commitment scope must be checked

### 4. A configuration cache is stale in one long-lived job. Check:

A. Static state and invalidation
B. Only source file timestamps
C. Only terminal settings
D. Only the library object size

### 5. Should reclamation be used blindly on an active application?

A. Yes, after every request
B. No, understand resource ownership and activity
C. Yes, it is just a cache clear
D. Only when a user complains

<details>
<summary>Answer key and explanations</summary>

1. **B — No** Activation groups are resource subdivisions within a job.

2. **C — A named activation group** Named groups can retain resources across calls in that job.

3. **D — No, commitment scope must be checked** Commitment definitions and runtime grouping are distinct concepts.

4. **A — Static state and invalidation** Persisted runtime state may outlive configuration changes.

5. **B — No, understand resource ownership and activity** Reclamation changes resource lifecycle and requires application context.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Commitment definitions and activation groups](https://www.ibm.com/docs/en/i/7.4.0?topic=scoping-commitment-definitions-activation-groups)
- [IBM: Binder functions](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-binder-functions)
- [IBM Redbooks: Modern RPG](https://www.redbooks.ibm.com/redbooks/pdfs/sg245402.pdf)

[← Previous](binding-signatures.md) · [Next →](data-queues.md)
