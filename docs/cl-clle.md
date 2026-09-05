# CL & CLLE orchestration

[Question index](README.md) · RPG & CL development · Intermediate

Build reliable wrappers with typed parameters, scoped error handling, and cleanup.

## 1. What should CL do in an application?

**Easy**

<details>
<summary>Explain the answer</summary>

CL is well suited to orchestration: establish libraries and overrides, invoke programs, submit jobs, inspect attributes, and route messages. RPG or SQL is generally a better fit for substantial business-data transformation.

Keep the wrapper’s contract explicit. It should validate parameters, establish a known environment, call the business operation, and propagate failures meaningfully. A wrapper that silently ignores every message can turn a failed business process into a false scheduler success.

</details>

## 2. How do CLP and CLLE differ in the build flow?

**Easy**

<details>
<summary>Explain the answer</summary>

CLP is commonly associated with OPM CL program source, while CLLE uses the ILE CL compiler and can participate in modular ILE builds. CRTCLPGM creates an OPM CL program; CRTBNDCL creates a bound ILE CL program; CRTCLMOD creates an ILE CL module.

The actual build command controls the resulting object. When debugging behavior, inspect the compiled program attributes instead of relying only on the source member type.

</details>

## 3. What is command-level versus program-level MONMSG?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A command-level MONMSG immediately follows the command it monitors. A program-level MONMSG is placed in the declaration portion and provides broader handling for eligible messages not handled locally. MONMSG handles escape, notify, and status messages, not every informational message in the job log.

Use narrow handlers for expected conditions, such as end of file. Broad handlers should preserve diagnostics, clean up, and report failure. Do not suppress CPF0000 just to make a script appear successful.

</details>

## 4. How do DCLF and RCVF support file processing?

**Intermediate**

<details>
<summary>Explain the answer</summary>

DCLF declares a file and brings its externally described fields into a CL program. RCVF receives a record from that declared file; a supported EOF message can be monitored to end a database read loop. Multiple-file usage requires the applicable declaration and identification conventions.

Use CL file reading for simple control tasks. Complex joins and transformations are usually clearer in SQL or RPG. Confirm which file is being read, and route unexpected file errors separately from normal end of input.

</details>

## 5. Why can CALL parameters cause decimal-data errors?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A called program interprets the bytes it receives according to its parameter definitions. A caller supplying a different length or numeric representation can cause invalid decimal data or silent truncation. Interactive command defaults may not match the declared RPG interface.

Define typed CL variables for the call and match the receiving program exactly. Check character length, packed precision/scale, argument order, and omitted parameters. Diagnose the interface before blaming the contents of the database.

</details>

## 6. How do you structure loops and branches in CL?

**Intermediate**

<details>
<summary>Explain the answer</summary>

CL supports conditional commands and structured groups such as IF/ELSE, DO/ENDDO, and supported loop constructs including DOWHILE, DOUNTIL, and DOFOR. Choose the form that clearly expresses the termination condition.

For a file loop, distinguish normal EOF from unexpected errors and ensure each iteration makes progress. For retries, add a bounded attempt count and delay policy. A loop that ignores every error can turn a transient failure into a permanently active job.

</details>

## 7. How should a CL wrapper clean up and report failure?

**Advanced**

<details>
<summary>Explain the answer</summary>

Record the original failure context before cleanup commands generate additional messages. Remove only the overrides and temporary resources owned by the wrapper, and preserve the business operation’s failure status for its caller or scheduler.

Use distinct success and error paths, with common cleanup where practical. Do not issue an unconditional success message after a failed call. If rollback ownership belongs to the called transaction coordinator, the wrapper should not independently commit partial work.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Which command creates an ILE CL module?

A. CRTCLPGM
B. CRTPF
C. CRTCLMOD
D. SBMJOB

### 2. Where does command-level MONMSG belong?

A. Only at the end of the source
B. Inside a DDS record format
C. In a binding directory
D. Immediately after the monitored command

### 3. Which is a suitable CL responsibility?

A. Establish environment and orchestrate calls
B. Replace every database query with text parsing
C. Change all system values on startup
D. Suppress all exceptions

### 4. What should a broad error handler preserve?

A. Only a success message
B. Original diagnostic context and failure status
C. Only the last cleanup message
D. Nothing after cleanup

### 5. A called RPG program expects packed(9:2). The caller must:

A. Pass any nine-character text
B. Always use an integer
C. Pass a compatible representation and size
D. Rely on the display value only

<details>
<summary>Answer key and explanations</summary>

1. **C — CRTCLMOD** CRTCLMOD produces a module that can be bound into an ILE object.

2. **D — Immediately after the monitored command** Placement determines which command it monitors.

3. **A — Establish environment and orchestrate calls** CL wrappers are useful for controlled orchestration.

4. **B — Original diagnostic context and failure status** Cleanup should not hide the cause or falsely signal success.

5. **C — Pass a compatible representation and size** Parameter compatibility includes storage layout and scale, not just appearance.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Monitor Message (MONMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fmonmsg.html)
- [IBM: Send Program Message](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fsndpgmmsg.html)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)

[← Previous](rpg-procedures.md) · [Next →](display-print-subfiles.md)
