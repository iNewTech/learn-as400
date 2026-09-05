# Data areas & message queues

[Question index](README.md) · Messaging & transactions · Intermediate

Distinguish shared state, job-local state, and operator messaging.

## 1. What is a data area, and when is it useful?

**Easy**

<details>
<summary>Explain the answer</summary>

A data area stores a small piece of data accessible through IBM i interfaces. Applications use it for configuration, control information, or legacy shared values. It differs from a queue because it represents a current value rather than a sequence of work entries.

Define who may read or change it, its exact layout, and whether readers cache it. For structured or transactional state with history and queries, a database table is often easier to govern and evolve.

</details>

## 2. How does the local data area differ from a shared data area?

**Easy**

<details>
<summary>Explain the answer</summary>

The local data area is associated with a job and accessed using its special interface, rather than behaving like an ordinary named shared *DTAARA object. It is often used by legacy code to carry job-specific parameters or control values.

Do not expect unrelated jobs to observe the same local data area. Explicitly pass required context across submission boundaries and verify the relevant inheritance rules. For a new interface, typed parameters or a documented request record usually make dependencies clearer.

</details>

## 3. Which commands inspect and change data areas?

**Intermediate**

<details>
<summary>Explain the answer</summary>

DSPDTAARA displays a data area, RTVDTAARA retrieves data into CL variables, and CHGDTAARA changes values. Other interfaces, including RPG operations and APIs, can access data areas with their own locking conventions.

Treat its layout as a contract. A change to offsets, length, or numeric representation can break old programs. Keep configuration changes auditable, and do not assume a read-modify-write sequence is atomic merely because the storage object is small.

</details>

## 4. How do you prevent lost updates to a shared counter?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Protect the entire read-modify-write critical section using the appropriate data-area locking protocol followed by reliable release. Without that protection, two jobs can read the same value and both write the same incremented result.

For new designs, consider a database identity, sequence, or transactional row update that better expresses the requirement. Define crash recovery and whether gaps are acceptable. A requirement for unique IDs is different from a requirement for gapless legal document numbering.

</details>

## 5. How is a message queue different from a data queue?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A message queue supports IBM i messages with types, identifiers, routing, and potentially replies. It is suited to operational and program messaging. A data queue transports application entries in a producer-consumer design.

Choose based on semantics. An operator inquiry belongs in a message workflow; a high-volume work stream needs an explicit transport and processing contract. Neither object automatically substitutes for a full transactional business ledger.

</details>

## 6. Why is a data-area switch not always a safe deployment control?

**Advanced**

<details>
<summary>Explain the answer</summary>

A shared switch can be read at different times or cached by different jobs. Changing it may cause some requests to use old behavior and others new behavior while a single business operation is still in progress.

Define when configuration is sampled and record its version with the run or request. For incompatible schema or interface changes, coordinate deployment rather than hoping a flag prevents mixed versions. Test a flag change during a long-running batch and specify the expected behavior.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Which object best represents one small shared current value?

A. Job queue
B. Binding directory
C. Output queue
D. Data area

### 2. Which command displays a data area?

A. DSPDTAARA
B. DSPSRVPGM
C. CRTPGM
D. WRKJOBSCDE

### 3. What must be protected for a shared increment?

A. Only the final screen display
B. The entire read-modify-write sequence
C. Only the source compile
D. Nothing if the field is numeric

### 4. Which object supports inquiry messages and replies?

A. Binding directory
B. Logical file index
C. Message queue
D. Memory pool

### 5. Can a configuration flag change affect jobs at different times?

A. No, every job reads simultaneously
B. Only if names differ
C. Only without CL
D. Yes, especially with cached state

<details>
<summary>Answer key and explanations</summary>

1. **D — Data area** Data areas store current data rather than a sequence of work entries.

2. **A — DSPDTAARA** DSPDTAARA is the display command for a data area.

3. **B — The entire read-modify-write sequence** Locking only one part leaves a lost-update race.

4. **C — Message queue** Message queues provide message types and reply-oriented workflows.

5. **D — Yes, especially with cached state** Sampling and invalidation must be defined explicitly.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Using data areas](https://www.ibm.com/docs/en/i/7.5.0?topic=procedures-using-data-areas)
- [IBM: Send Program Message](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fsndpgmmsg.html)
- [IBM: Create Data Queue](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fcrtdtaq.html)

[← Previous](data-queues.md) · [Next →](commitment-control.md)
