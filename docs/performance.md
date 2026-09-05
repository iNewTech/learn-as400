# Performance & SQL tuning

[Question index](README.md) · Production engineering · Advanced

Measure elapsed time, query plans, I/O, and contention before choosing a fix.

## 1. How do you begin a performance investigation?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Define the slow operation, expected service level, input size, time window, and baseline. Separate queue delay, application execution, database work, and external waits. Capture comparable successful and slow runs.

Use evidence from job state, CPU, I/O, locks, and SQL activity. A single high CPU percentage or one slow user report is insufficient to choose a fix. Measure the outcome the business cares about, such as completed orders per minute or response-time percentiles.

</details>

## 2. What can the SQL plan cache and Visual Explain reveal?

**Intermediate**

<details>
<summary>Explain the answer</summary>

The SQL plan cache records query-plan and execution information useful for identifying expensive statements. ACS tooling can inspect statements and Visual Explain can show the chosen access strategy. The cache is finite and changes over time.

Capture relevant statements or snapshots while the evidence exists. Compare parameters, row counts, selectivity, and access paths for slow and fast cases. A plan diagram is a hypothesis about cost; validate its practical impact with measured execution.

</details>

## 3. Why can an index be useful and still not be chosen?

**Intermediate**

<details>
<summary>Explain the answer</summary>

The optimizer estimates whether an access path is cheaper for the query and data distribution. A table scan can be reasonable for a large fraction of rows; an index may not match useful leading keys or may require expensive lookups.

Inspect predicates, conversions, selectivity, statistics, and required ordering. Do not force an index solely because it exists. Additional indexes impose write and storage costs, so evaluate both read improvement and overall workload impact.

</details>

## 4. What makes a predicate less index friendly?

**Advanced**

<details>
<summary>Explain the answer</summary>

Applying transformations to indexed columns or comparing incompatible types can prevent or weaken efficient keyed access, depending on optimizer support. Broad wildcard patterns and low-selectivity conditions can also limit benefit.

Express a range directly when possible and keep types aligned. For a timestamp day filter, compare against start and next-day boundaries rather than assuming a formatting function is free. Confirm the actual plan; some expressions can be optimized or supported by suitable indexes.

</details>

## 5. How would you tune a native RPG read loop?

**Advanced**

<details>
<summary>Explain the answer</summary>

Measure record count, reads per result, key access, repeated opens, and work inside the loop. Eliminate unnecessary full scans and repeated lookups where a correct keyed path or set-based query helps.

Keep correctness first: selective reads must still include every qualifying record, and changing locking can change behavior. Compare representative volumes and concurrency. Do not assume CHAIN is universally faster than SQL or that changing opcodes is the main bottleneck.

</details>

## 6. How do you prove a tuning change improved the system?

**Advanced**

<details>
<summary>Explain the answer</summary>

Compare before and after on representative data and load, measuring throughput, elapsed distribution, resource usage, lock waits, and error rates. Verify output equivalence and transaction behavior.

Account for warm caches, concurrent workloads, and different parameters. A faster isolated query can slow writers or consume excessive memory under load. Document the measurement conditions and keep a rollback path for plan or workload regressions.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. High elapsed time with little CPU suggests investigating:

A. Only multiplication speed
B. Only the source filename
C. Wait time, I/O, locks, and dependencies
D. Only screen refresh

### 2. Why preserve a plan-cache snapshot promptly?

A. The cache is permanent source control
B. Every query is stored forever
C. It replaces all backups
D. Relevant entries can be evicted or replaced

### 3. Is every table scan a performance bug?

A. No, it can be appropriate for many rows
B. Yes, always
C. Only on Db2 for i
D. Only with a primary key

### 4. What is a cost of adding indexes?

A. Automatic loss of all rows
B. Additional write maintenance and storage
C. Removal of all locks
D. Disabling SQL

### 5. What should accompany a faster timing result?

A. Only a smaller code file
B. Only fewer comments
C. Correctness and representative-load validation
D. Only a new job name

<details>
<summary>Answer key and explanations</summary>

1. **C — Wait time, I/O, locks, and dependencies** The bottleneck may be outside active instruction execution.

2. **D — Relevant entries can be evicted or replaced** Plan-cache evidence is finite and changes over time.

3. **A — No, it can be appropriate for many rows** The optimizer compares access costs for the query and data.

4. **B — Additional write maintenance and storage** Evaluate the whole workload, not only one read query.

5. **C — Correctness and representative-load validation** Performance gains must preserve results and remain useful under actual workload conditions.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: SQL plan cache properties](https://www.ibm.com/docs/en/i/7.5.0?topic=cache-properties)
- [IBM: SQL plan cache statements](https://www.ibm.com/docs/en/i/7.4.0?topic=cache-show-statements)
- [IBM: Authority options for SQL tuning](https://www.ibm.com/docs/ssw_ibm_i_74/rzahf/rzahfauthopt.htm)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)

[← Previous](apis-integration.md) · [Next →](real-world-scenarios.md)
