# Job logs & diagnostic messages

[Question index](README.md) · Runtime & work management · Intermediate

Read the whole failure chain and preserve the evidence needed to resolve it.

## 1. What is the difference between a job log and the history log?

**Easy**

<details>
<summary>Explain the answer</summary>

A job log records messages associated with a particular job, subject to its logging settings. The system history log contains selected system-level events and messages. The scopes overlap in some operational workflows but are not interchangeable.

For a program failure, start with the qualified job and its detailed log. For a system-wide incident, correlate multiple job logs with history and performance evidence. Retain timestamps and relevant message identifiers rather than only a screenshot of the final line.

</details>

## 2. Why is the last message often not the root cause?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A final escape message may only report that a command or program failed. Earlier diagnostic messages can identify the missing object, conversion problem, authority denial, or resource condition that caused it.

Read the message sequence, second-level text, call stack, and replacement data. Preserve the first meaningful failure before cleanup or wrapper messages obscure it. Search by the exact identifier and context, not merely by an English fragment that may describe many unrelated failures.

</details>

## 3. How do informational, diagnostic, escape, and inquiry messages differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Informational messages convey status; diagnostic messages describe conditions; escape messages signal failure to callers; inquiry messages request a reply. Message type affects routing and how a caller can handle the condition.

An unattended job waiting for an inquiry reply can appear hung while doing no work. Confirm the actual prompt and approved reply procedure. Do not automatically answer every inquiry with ignore, because a reply may continue processing after a serious data problem.

</details>

## 4. How should programs use application message IDs?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A message file can define stable identifiers and text with substitution data. Programs can report a consistent business or technical condition without forcing every caller to parse ad hoc prose.

Define an error contract that includes the operation, affected key, and safe diagnostic context. Keep secrets out of message data. Preserve failure severity and type so callers and schedulers can distinguish a rejected business input from an infrastructure failure.

</details>

## 5. Why might a completed job have no useful spooled job log?

**Advanced**

<details>
<summary>Explain the answer</summary>

Logging attributes and output behavior determine which messages are retained or spooled. A normally completed job may not produce the detailed log someone expects; messages can also be pending or handled under configured logging behavior.

Check effective job logging settings and how the job ended. For a reproducible failure, arrange appropriate diagnostic logging before the next run. Avoid permanently maximizing every job’s logging without considering volume, retention, and exposure of sensitive values.

</details>

## 6. What evidence should be captured before ending a stuck job?

**Advanced**

<details>
<summary>Explain the answer</summary>

Capture qualified job identity, current status, call stack, locks held and requested, recent messages, and business run/transaction identifiers. Determine whether it is waiting for an operator, another job, I/O, or an external endpoint.

Ending a job can initiate rollback, lose transient diagnostics, and create an ambiguous external outcome. Use the application recovery procedure and coordinate with the owner. Explain what is known, what ending the job will change, and how correctness will be verified afterward.

</details>

## Checkpoint — 5 MCQs

Answer all questions before checking the key. Aim for 5/5 before continuing.

### 1. Where should you look before a generic final escape message?

A. Only the source title
B. Only the output queue description
C. Earlier diagnostic messages and second-level text
D. Only the system serial number

### 2. Which message type requests a reply?

A. Informational
B. Diagnostic only
C. Completion only
D. Inquiry

### 3. Which log is scoped to a particular execution job?

A. Job log
B. Only QHST
C. A binding directory
D. A source file

### 4. Before ending a stuck job, preserve:

A. Only the short job name
B. Status, call stack, locks, and messages
C. Only a screenshot of the menu
D. Nothing because logs are always complete

### 5. Should every inquiry be automatically ignored?

A. Yes, to maintain throughput
B. Only if the job is batch
C. No, interpret the condition and approved response
D. Only when CPU is low

<details>
<summary>Answer key and explanations</summary>

1. **C — Earlier diagnostic messages and second-level text** The earlier diagnostic chain often contains the concrete cause.

2. **D — Inquiry** Inquiry messages can leave unattended work waiting for operator action.

3. **A — Job log** A job log captures job-associated messages subject to logging attributes.

4. **B — Status, call stack, locks, and messages** Transient evidence can disappear or change after termination.

5. **C — No, interpret the condition and approved response** Ignoring an inquiry may continue after an unsafe or inconsistent condition.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Send Program Message](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fsndpgmmsg.html)
- [IBM: Monitor Message (MONMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fmonmsg.html)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)

[← Previous](batch-scheduling.md) · [Next →](ile-objects.md)
