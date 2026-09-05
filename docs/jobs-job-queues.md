# Jobs & job queues

[Question index](README.md) · Runtime & work management · Easy

Follow a job from submission through execution, output, and completion.

## 1. What is an IBM i job?

**Easy**

<details>
<summary>Explain the answer</summary>

A job is a unit of work with an execution environment, such as user identity, library list, job attributes, and runtime resources. Interactive, batch, and server jobs have different entry paths but all run within work management.

Identify a job by its qualified number/user/name, not just its short name. Many jobs can share the same name. When reporting a failure, retain that qualified identity with the timestamp so another developer can inspect the correct execution.

</details>

## 2. What does SBMJOB actually do?

**Easy**

<details>
<summary>Explain the answer</summary>

SBMJOB submits work for batch processing. Submission places a job into a job queue under the selected job attributes; it does not guarantee the program has started or finished successfully. A subsystem must be able to select and run the job.

Treat accepted submission, started execution, and business completion as separate events. A scheduler or parent process should use an explicit completion signal if later work depends on the result.

**Example**

```cl
SBMJOB CMD(CALL PGM(APP/NIGHTLY)) JOB(NIGHTLY) JOBQ(APP/BATCHQ)
```

</details>

## 3. How is a job queue different from an output queue?

**Easy**

<details>
<summary>Explain the answer</summary>

A job queue holds jobs waiting to begin execution. An output queue holds spooled output waiting for a writer or other processing. A completed job can leave output in an output queue after its active execution has ended.

When someone says the report is stuck, establish whether the generating job has not run, is still running, or has produced a held spooled file. Each case has different evidence and a different owner.

**Example**

```cl
*JOBQ → pending work
*OUTQ → spooled output
```

</details>

## 4. Why is a submitted job not starting?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Check the job and job queue hold status, the subsystem’s activity, whether the queue is attached to the expected subsystem, and maximum-active limits. Then inspect routing and other required execution resources.

Distinguish a job still on a queue from an active job waiting on a lock or message. Repeated submissions create duplicates without repairing the cause. Record the original qualified job identity, find the admission constraint, and release only the intended work when appropriate.

</details>

## 5. Why can batch behave differently from an interactive call?

**Intermediate**

<details>
<summary>Explain the answer</summary>

The submitted job may have a different user profile, initial library list, job description, current library, CCSID, date attributes, or overrides. It also lacks interactive assumptions such as a terminal response.

Compare the actual job attributes and resolved objects. Make the batch wrapper establish its environment explicitly and use noninteractive error reporting. Do not fix the difference by adding excessive authority or assuming the submitter’s current runtime state is copied wholesale.

</details>

## 6. What do statuses such as MSGW, LCKW, and DEQW suggest?

**Intermediate**

<details>
<summary>Explain the answer</summary>

MSGW indicates a message-related wait, LCKW a lock wait, and DEQW a dequeue wait. These are investigation clues, not automatic errors. A consumer waiting for its next queue entry may be behaving normally.

Correlate status with expected workload, call stack, and recent messages. For MSGW inspect the inquiry and approved reply; for LCKW find the resource and holder; for DEQW verify whether work is expected and whether the producer is active.

</details>

## 7. How do job description, class, and subsystem description differ?

**Advanced**

<details>
<summary>Explain the answer</summary>

A job description supplies many starting attributes for a job. A class describes execution attributes such as run priority and time slice for the routing step. A subsystem description defines work-entry and resource-routing configuration.

These objects influence different stages of job setup and execution. Diagnose the path from submission parameters to job description to subsystem routing and class rather than changing one global default. Confirm the effective runtime value because overrides and configuration can alter the initial settings.

</details>

## Checkpoint — 5 MCQs

Answer all questions before checking the key. Aim for 5/5 before continuing.

### 1. Does successful SBMJOB prove the business process succeeded?

A. Yes, every record committed
B. Yes, the job ended normally
C. Only when submitted by an administrator
D. No, it proves submission succeeded

### 2. Which identity best selects a specific job?

A. Number/user/name
B. Short job name alone
C. Library name alone
D. Subsystem text description

### 3. What is stored on an output queue?

A. Only unstarted programs
B. Spooled output
C. Only source members
D. Service-program exports

### 4. A queued job is not starting. Check:

A. Only decimal precision
B. Only binder signature
C. Holds, subsystem state, and active limits
D. Only the report width

### 5. Batch works only when called interactively. Compare:

A. Only source comments
B. Only keyboard layout
C. Only the terminal color
D. User and execution environment

<details>
<summary>Answer key and explanations</summary>

1. **D — No, it proves submission succeeded** Submission and business completion are separate states.

2. **A — Number/user/name** Qualified job identity avoids confusion between jobs sharing a name.

3. **B — Spooled output** Output queues serve spooled files rather than pending job execution.

4. **C — Holds, subsystem state, and active limits** Work-management admission conditions can prevent execution.

5. **D — User and execution environment** Library lists, authorities, and job attributes often explain the difference.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: A job enters the subsystem](https://www.ibm.com/docs/en/i/7.5.0?topic=life-job-enters-subsystem)
- [IBM: Subsystems, job queues, memory pools](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-subsystems-job-queues-memory-pools)

[← Previous](display-print-subfiles.md) · [Next →](subsystems-pools.md)
