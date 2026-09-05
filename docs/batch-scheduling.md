# Batch processing & scheduling

[Question index](README.md) · Runtime & work management · Intermediate

Make unattended work restartable, observable, and safe to rerun.

## 1. How do you schedule recurring IBM i work?

**Easy**

<details>
<summary>Explain the answer</summary>

The basic job scheduler supports entries such as those created with ADDJOBSCDE and managed with WRKJOBSCDE. A schedule specifies when to submit a command and relevant job settings. More complex dependency management may use another scheduler.

Confirm the system’s time settings, calendar expectations, missed-run behavior, and job environment. A schedule firing is not the same as a completed batch. Define how operations sees success, failure, and overdue work.

</details>

## 2. What makes a batch process restartable?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Persistent state identifies the business work completed and the work remaining. Commit units should align with an explicit restart checkpoint so a failure does not force a guess about partially processed records.

Use stable business keys and a run identifier rather than relying on an in-memory cursor or QTEMP table. Test a forced failure before, during, and after a commit. On restart, reconcile committed work and avoid repeating external side effects.

</details>

## 3. What is idempotency in a batch process?

**Intermediate**

<details>
<summary>Explain the answer</summary>

An idempotent operation produces the intended effect once even when a request or work item is delivered repeatedly. A unique business operation key and transactional status check can prevent duplicate posting.

A simple check-then-insert without protection is vulnerable to concurrent workers. Use a uniqueness constraint or an atomic claim/update strategy and return the existing outcome for duplicates. Define what should happen if the earlier attempt is still running or ended ambiguously.

</details>

## 4. How do you prevent overlapping scheduled runs?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Decide whether overlap is allowed. If not, use a supported scheduler constraint or an application-level claim with a clear owner and expiry/recovery policy. The claim must be atomic; two jobs reading the same unlocked flag can both decide they may run.

A stale flag after a crash must not block work forever. Record job/run identity and timestamps, verify the previous owner’s status, and provide a controlled recovery procedure. Avoid interpreting a duplicate process name as sufficient proof of ownership.

</details>

## 5. Where should you place batch commit boundaries?

**Advanced**

<details>
<summary>Explain the answer</summary>

Balance business atomicity with lock duration, recovery effort, and throughput. One commit for an entire huge run may hold resources too long; committing every row may impose unnecessary overhead and break a multirow business invariant.

Choose a coherent unit such as one order or a bounded group of independent items. Save its checkpoint consistently with the business changes. If external actions are involved, coordinate through durable intent and idempotency rather than assuming COMMIT spans every system.

</details>

## 6. How should dependent jobs coordinate?

**Advanced**

<details>
<summary>Explain the answer</summary>

Dependency should be based on an explicit successful business outcome, not a fixed sleep or the fact that a predecessor was submitted. Store a run status or use scheduler dependencies that distinguish success, failure, and cancellation.

Pass the run identifier and relevant input version to downstream work. Define retry policy and how operators resume the chain after a partial failure. Prevent a late completion from yesterday’s run from incorrectly unlocking today’s dependent processing.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Which tool manages basic schedule entries?

A. DSPFFD
B. WRKJOBSCDE
C. CRTSRVPGM
D. SETLL

### 2. Which checkpoint survives the original job ending?

A. A local variable
B. QTEMP only
C. A persistent application record
D. A cursor position only

### 3. How should a duplicate payment request be handled?

A. Post again unconditionally
B. Assume no duplicate can occur
C. Delete the previous payment
D. Recognize its operation key and return the established result

### 4. Why is a read-then-set overlap flag unsafe without protection?

A. Two jobs can both observe it as free
B. It always stops the subsystem
C. It automatically commits all files
D. It changes the compiler

### 5. When should a dependent job start?

A. After any successful submission
B. After verified predecessor business success
C. After an arbitrary five-second wait
D. Whenever its short job name changes

<details>
<summary>Answer key and explanations</summary>

1. **B — WRKJOBSCDE** WRKJOBSCDE manages the basic IBM i scheduler entries.

2. **C — A persistent application record** Cross-job restart needs durable state.

3. **D — Recognize its operation key and return the established result** Idempotency prevents repeated delivery from repeating the business effect.

4. **A — Two jobs can both observe it as free** The check and claim must be atomic; otherwise both jobs can start from the same free state.

5. **B — After verified predecessor business success** Submission or elapsed time does not prove prerequisite completion.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Add Job Schedule Entry](https://www.ibm.com/docs/en/i/7.5.0?topic=beginning-add-job-schedule-entry)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: Using COMMIT](https://www.ibm.com/docs/en/i/7.4.0?topic=control-using-commit-operation)

[← Previous](subsystems-pools.md) · [Next →](job-logs-messages.md)
