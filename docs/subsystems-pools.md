# Subsystems, routing & memory pools

[Question index](README.md) · Runtime & work management · Intermediate

Understand workload admission, routing, memory, and operational isolation.

## 1. What is a subsystem?

**Easy**

<details>
<summary>Explain the answer</summary>

A subsystem is an operating environment that manages jobs and their use of resources according to its description. It can separate classes of work such as interactive sessions, batch jobs, and application servers.

A job queue supplies waiting work; it is not the subsystem itself. When designing a new batch workload, choose the intended subsystem, queue attachment, concurrency limits, and execution profile together. Adding a queue alone does not create an execution environment.

</details>

## 2. What do routing entries and routing data do?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Routing data is compared with subsystem routing entries to select a routing step. The selected entry identifies how execution begins and which class and pool configuration are used. A familiar command-processing route is only one possible setup.

If a job enters an unexpected runtime path, inspect the effective routing data and matching entry. Copying a job description from another application can import routing assumptions that are inappropriate for the new workload.

</details>

## 3. What is a memory pool?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A memory pool is an allocation of main storage used by jobs or work within the system. Shared and private pools allow workload resource organization. Activity levels influence eligible execution and can affect waiting and faulting behavior.

Memory-pool tuning is a measured system decision. Observe faulting rates, CPU utilization, job waits, and workload peaks before adjusting settings. More active jobs can reduce throughput if the working sets no longer fit and contention increases.

</details>

## 4. Why might an active job consume little CPU?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Active means admitted to execution, not continuously executing instructions. The job may wait for a database lock, message reply, timer, communications response, or I/O. Low CPU with high elapsed time often points toward waiting rather than compute demand.

Inspect job status, call stack, and wait evidence. Correlate with external-system timing and database activity. Raising priority cannot resolve a missing operator reply or a lock held by another transaction.

</details>

## 5. How would you isolate a new high-volume batch workload?

**Advanced**

<details>
<summary>Explain the answer</summary>

Create a controlled execution path with an appropriate queue, subsystem configuration, dedicated or shared pool decision, and bounded concurrency. Define service profiles, logging, scheduling, and operational ownership before production rollout.

Run a representative load test alongside existing work. Monitor latency of interactive services as well as batch throughput. Isolation helps manage resource contention, but it does not remove shared database locks, storage pressure, or dependencies on other applications.

</details>

## 6. Why is increasing MAXACT not always a performance fix?

**Advanced**

<details>
<summary>Explain the answer</summary>

A maximum-active limit controls admission. Raising it may reduce queue wait but increase simultaneous lock contention, disk I/O, memory pressure, or external API demand. The result can be more active jobs with less completed work.

Measure queue delay separately from execution duration. Increase concurrency gradually and compare throughput, tail latency, faults, and failure rates. If the workload is serialized by a shared hot record, fix that design before admitting more contenders.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Which object/environment manages running jobs?

A. Subsystem
B. Output queue alone
C. Source member
D. SQL view

### 2. Routing entries use which input to select a path?

A. Only source indentation
B. Routing data
C. The report title
D. The screen color

### 3. Low CPU and high elapsed time suggest checking:

A. Only arithmetic opcodes
B. Only compile duration
C. Waits and external dependencies
D. Only source line count

### 4. Can raising MAXACT reduce throughput?

A. No, more jobs always means more throughput
B. Only for empty queues
C. Only when SQL is absent
D. Yes, by increasing contention

### 5. Does a separate subsystem eliminate shared record locks?

A. No
B. Yes, every file is copied
C. Only for RPG
D. Only for batch

<details>
<summary>Answer key and explanations</summary>

1. **A — Subsystem** Subsystems manage jobs; queues supply work or output.

2. **B — Routing data** Routing data matches subsystem entries that define the routing step.

3. **C — Waits and external dependencies** A job may spend time blocked rather than computing.

4. **D — Yes, by increasing contention** Admission must fit resource and dependency capacity.

5. **A — No** Subsystem separation does not create independent copies of shared database rows.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Subsystems, job queues, memory pools](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-subsystems-job-queues-memory-pools)
- [IBM: A job enters the subsystem](https://www.ibm.com/docs/en/i/7.5.0?topic=life-job-enters-subsystem)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)

[← Previous](jobs-job-queues.md) · [Next →](batch-scheduling.md)
