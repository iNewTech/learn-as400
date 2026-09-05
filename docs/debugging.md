# Debugging RPG, CL & batch

[Question index](README.md) · Production engineering · Intermediate

Reproduce failures in the correct job and inspect the code that is actually running.

## 1. What is needed for useful source-level debugging?

**Easy**

<details>
<summary>Explain the answer</summary>

Compile with appropriate debug information and retain the source/build identity used for the object. Start a supported debugger against the correct program and job. Without matching views, the displayed source may not accurately represent executable behavior.

Prefer a controlled test environment with representative data. Verify the object library and build attributes before stepping through code. Optimization can affect variable visibility and stepping, so interpret the debugger in the context of the compiled object.

</details>

## 2. How do you debug a batch job?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Identify the exact target job and arrange for it to pause before the failing code, using a supported service-job/debug workflow or an IDE debugger. STRSRVJOB and STRDBG are common command-based parts of such a workflow, followed by appropriate cleanup.

Avoid racing a short-lived job that finishes before attachment. Use a controlled held submission or agreed breakpoint setup, then release it intentionally. Debugging can suspend work and retain locks, so plan the impact before targeting an active production process.

</details>

## 3. Why is a breakpoint not being hit?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Verify that the invoked object is the expected library/version, that the target job is correct, and that the execution path reaches the line. Check whether the code resides in a service-program procedure or a different module than assumed.

Also inspect debug views and optimization. A stale active object or a second build in another library can explain the mismatch. Begin with a reliable entry breakpoint and trace the real call path instead of adding random breakpoints throughout the source.

</details>

## 4. How do you debug decimal-data errors?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Locate the failing operation and inspect the source of the invalid numeric representation. Common causes include incompatible call parameters, character-to-number conversion, malformed imported data, or interpreting a record with the wrong layout.

Trace the data back to its boundary and compare types, lengths, scale, and CCSID where relevant. Fix validation or interface compatibility there. Replacing the failing value with zero may hide the symptom while changing a financial result.

</details>

## 5. How do you debug SQL errors inside RPG?

**Advanced**

<details>
<summary>Explain the answer</summary>

Capture SQLSTATE, SQLCODE, diagnostics, and relevant input values immediately after the failing statement. Check host-variable types, null indicators, schema resolution, commitment options, and parameter values.

RPG exception handling and SQL diagnostics are separate mechanisms. Reproduce the statement with equivalent settings and data, not merely similar SQL text in another session. Avoid logging sensitive payloads; retain enough context to identify the operation and reproduce it safely.

</details>

## 6. How do you investigate an intermittent production failure?

**Advanced**

<details>
<summary>Explain the answer</summary>

Correlate failures by job, business key, time, release, and dependency state. Compare successful and failed cases to find a differentiator such as concurrent updates, a specific character encoding, or a reused server job.

Add targeted observability at suspected boundaries, then build a controlled reproduction. Capture lock timing, retries, and transaction outcomes for races. Avoid a broad rewrite or repeated restarts that remove the evidence without explaining the fault.

</details>

## Checkpoint — 5 MCQs

Answer all questions before checking the key. Aim for 5/5 before continuing.

### 1. A breakpoint is missed. Verify first:

A. Only the monitor size
B. Only the source comment
C. Target job, object library/version, and execution path
D. Only the user’s keyboard

### 2. Which command is commonly used to select a service job for debugging?

A. CRTPF
B. DSPDTAARA
C. SETGT
D. STRSRVJOB

### 3. Why can debugging affect other users?

A. Paused work may retain locks and resources
B. It always changes every record
C. It deletes all indexes
D. It automatically ends the subsystem

### 4. What should be captured after a failing embedded SQL statement?

A. Only %EOF
B. SQLSTATE, SQLCODE, and diagnostics
C. Only the last screen text
D. Only the compile timestamp

### 5. A decimal-data error follows a program call. Investigate:

A. Only job priority
B. Only the output queue
C. Parameter storage compatibility
D. Only database indexes

<details>
<summary>Answer key and explanations</summary>

1. **C — Target job, object library/version, and execution path** Debugging the wrong object or job is a common cause.

2. **D — STRSRVJOB** STRSRVJOB is part of the command-based workflow for servicing another job.

3. **A — Paused work may retain locks and resources** A breakpoint can prolong resource ownership.

4. **B — SQLSTATE, SQLCODE, and diagnostics** SQL status identifies the database failure category and context.

5. **C — Parameter storage compatibility** A type or size mismatch can make valid bytes invalid under the callee’s interpretation.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Starting debug mode](https://www.ibm.com/docs/en/i/7.6.0?topic=programs-starting-debug-mode)
- [IBM: ILE RPG reference (7.6)](https://www.ibm.com/docs/it/ssw_ibm_i_76/pdf/sc092508.pdf)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)

[← Previous](locks-isolation.md) · [Next →](system-operations.md)
