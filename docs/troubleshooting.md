# Production troubleshooting drills

[Question index](README.md) · Interview practice · Advanced

Work from symptoms to evidence, diagnosis, correction, and verification.

## 1. The job completed normally but business rows are missing. What next?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Separate normal program termination from business success. Check the input set, selected member/library, predicates, commit outcome, and whether a broad error handler suppressed failures. Compare run counts and expected control totals.

Trace one missing business key end to end. Confirm that the output is not simply being queried from a different environment. Repair the root cause and use a controlled replay keyed by durable state, rather than rerunning all work without duplicate protection.

</details>

## 2. CHAIN fails only in production. What do you compare?

**Advanced**

<details>
<summary>Explain the answer</summary>

Compare the exact key values and types, resolved file and member, access-path definition, select/omit rules, overrides, and job environment. Check for trailing blanks, scale differences, and status handling that reads stale fields.

Reproduce the specific key under the same access path and authority. Inspect concurrency and error status separately from a simple no-match result. Do not assume the production data is absent merely because a different session can find a row through another interface.

</details>

## 3. A batch slows dramatically after a release. How do you narrow it down?

**Advanced**

<details>
<summary>Explain the answer</summary>

Compare row volumes, query counts/plans, library resolution, lock waits, and external latency with the previous baseline. Identify whether queue wait or execution duration changed. Inspect new per-record SQL, index maintenance, or longer transaction boundaries.

Use a representative sample and preserve current evidence. Roll back a demonstrably harmful change when the release plan supports it, but keep investigating the cause. A reboot that temporarily warms or clears state does not establish why the regression occurred.

</details>

## 4. A service-program change works in new jobs but not old jobs. Why?

**Advanced**

<details>
<summary>Explain the answer</summary>

Long-lived jobs may retain activated code/resources or cached application state, while new jobs activate the newly deployed version. Also check whether consumers were bound to a different object or signature.

Compare qualified objects and job lifecycles. Use a coordinated recycle or activation-management procedure after compatibility checks. Avoid ending every subsystem as a first move; identify the affected application jobs and confirm their transaction/recovery state.

</details>

## 5. A deadlock happens once a day. How do you reproduce it?

**Advanced**

<details>
<summary>Explain the answer</summary>

Find the involved business keys, jobs, and lock acquisition order. Build a controlled two-worker test that pauses each transaction after acquiring its first resource, then requests the other resource in the observed order.

Use the reproduction to validate consistent ordering or shorter units of work. Add bounded retry handling only for classified retryable failures and verify that it repeats the entire safe unit. Keep diagnostic correlation so future contention can be distinguished from the original cycle.

</details>

## 6. The integration reports success but the partner has no record. What now?

**Advanced**

<details>
<summary>Explain the answer</summary>

Determine what success meant: local commit, accepted HTTP request, queue send, or confirmed partner business completion. Correlate the operation ID across the outbound ledger, transport response, and partner lookup.

Do not resend blindly. Reconcile whether the partner rejected, delayed, or completed the request under another identifier. Improve the status model so accepted and completed are distinct, and alert on aging pending operations. This avoids misleading users with a success flag at the wrong boundary.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Does normal job termination prove every intended row was posted?

A. No
B. Yes, always
C. Only for CLLE
D. Only on an empty queue

### 2. Production CHAIN differs from a test SQL query. Compare:

A. Only the query editor theme
B. Keys, access paths, members, and resolved objects
C. Only screen size
D. Only source indentation

### 3. Old server jobs behave differently after deployment. Inspect:

A. Only disk capacity
B. Only scheduled day
C. Activation and cached state
D. Only the output queue name

### 4. What makes a deadlock test meaningful?

A. Sleeping randomly once
B. Only running a single transaction
C. Changing every lock timeout
D. Reproducing the actual resource acquisition order

### 5. What is the first step after ambiguous integration success?

A. Correlate and reconcile the operation outcome
B. Send the same payment with a new key
C. Delete pending work
D. Assume the partner failed

<details>
<summary>Answer key and explanations</summary>

1. **A — No** Business completion needs explicit counts/outcomes and transaction verification.

2. **B — Keys, access paths, members, and resolved objects** The two operations may not address the same data or predicate semantics.

3. **C — Activation and cached state** Existing jobs can retain runtime state that new jobs do not have.

4. **D — Reproducing the actual resource acquisition order** A controlled interleaving exposes the circular dependency.

5. **A — Correlate and reconcile the operation outcome** Transport acceptance and business completion are different milestones.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM: Service program signature](https://www.ibm.com/docs/en/i/7.6?topic=language-signature)
- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)

[← Previous](real-world-scenarios.md) · [Next →](tricky-questions.md)
