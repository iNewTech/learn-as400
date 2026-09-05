# Embedded SQL & cursors

[Question index](README.md) · Data & database · Intermediate

Handle multirow results, SQL diagnostics, transactions, and resource lifecycles.

## 1. When do you need a cursor?

**Easy**

<details>
<summary>Explain the answer</summary>

A cursor lets a procedural program fetch a multirow query result incrementally. A SELECT INTO is suitable when the contract expects at most one result row; use a cursor when several rows must be processed by procedural logic.

Prefer one set-based statement when the business operation can be expressed that way. A cursor is useful for row-dependent external calls or procedural work, but it can add round trips and locking complexity. Define its lifetime and cleanup path.

</details>

## 2. What are DECLARE, OPEN, FETCH, and CLOSE responsible for?

**Intermediate**

<details>
<summary>Explain the answer</summary>

DECLARE describes the cursor and query. OPEN establishes the result for processing. FETCH moves through and retrieves rows; CLOSE releases the active cursor resources according to the runtime rules. A declaration alone does not fetch data.

Check SQL status after OPEN and each FETCH. Stop on the no-data condition, process successful rows, and route errors through a cleanup path. Do not process the previous host-variable values after a failed or end-of-data fetch.

**Example**

```cl
DECLARE c CURSOR FOR SELECT id FROM app.orders;
OPEN c;
-- FETCH, check SQLSTATE, process, repeat
CLOSE c;
```

</details>

## 3. How should SQLCODE and SQLSTATE be interpreted?

**Intermediate**

<details>
<summary>Explain the answer</summary>

SQLSTATE is a five-character status code whose class indicates success, warning, no data, or an exception category. SQLCODE provides a numeric result. A common fetch end condition is SQLSTATE 02000 with SQLCODE +100.

Check status immediately because another SQL operation can replace diagnostic information. Capture message text and additional diagnostics where useful. Distinguish expected no-data from failures such as conversion, missing objects, authority, and locking; one blanket error branch obscures the actual recovery decision.

</details>

## 4. Why are null indicators important in embedded SQL?

**Intermediate**

<details>
<summary>Explain the answer</summary>

When a nullable result is fetched into a non-nullable host variable, an indicator communicates whether the value is null. Without the required indicator, a null result can cause a runtime SQL error rather than a usable empty value.

Initialize and inspect indicators before using the host value. In a left join, even a non-nullable base-table field can appear null in the result for an unmatched row. Define the procedure’s output contract for missing values instead of guessing a default.

</details>

## 5. How do SQL procedures and external stored procedures differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

An SQL procedure implements its body using SQL procedural language. An external procedure exposes an external program or procedure through an SQL definition and its parameter mapping. Both can be called through SQL CALL according to the declared contract.

Choose the location of business logic deliberately. Validate parameter modes, types, result sets, authority behavior, and transaction ownership. An external procedure declaration must match the underlying implementation; the SQL wrapper does not automatically repair an incompatible RPG parameter layout.

</details>

## 6. Does WITH HOLD mean a cursor survives every event?

**Advanced**

<details>
<summary>Explain the answer</summary>

WITH HOLD is designed to keep a cursor open across COMMIT, subject to the applicable SQL environment. It does not make the cursor immune to ROLLBACK, program cleanup, connection termination, or other close rules.

After committing, do not assume all update-position or lock semantics remain unchanged. For restartable batch work, a durable business checkpoint is still needed; an in-memory cursor position is not a cross-job recovery mechanism. Verify the cursor attributes and close behavior for your execution environment.

</details>

## 7. How would you improve a slow row-by-row SQL process?

**Advanced**

<details>
<summary>Explain the answer</summary>

Measure statement counts, elapsed time, rows processed, and database waits. Look for a SELECT or UPDATE repeated once per row that could become a join, MERGE, grouped update, or batched fetch. Reducing SQL calls often matters more than tuning procedural arithmetic.

Preserve error handling and commit boundaries when changing the algorithm. Test memory usage and locks with realistic volumes. If each row invokes an external system, separate database selection from idempotent outbound work rather than keeping a transaction open during network waits.

</details>

## 8. What is a common table expression, and is it always materialized?

**Advanced**

<details>
<summary>Explain the answer</summary>

A common table expression names a query expression within a statement, helping separate logical steps such as aggregation and filtering. It improves organization but is not a promise that the engine creates a persistent intermediate table or executes it only once.

The optimizer can transform the expression according to supported rules. Use a CTE to make the result grain and joins clear, then inspect the plan if repeated work matters. Recursive CTEs additionally need a sound termination condition and cycle considerations.

</details>

## 9. How do window functions differ from GROUP BY?

**Advanced**

<details>
<summary>Explain the answer</summary>

Window functions calculate across a related set of rows while retaining individual result rows. GROUP BY normally collapses rows into groups. ROW_NUMBER, ranking, and running aggregates are common window-function applications.

Specify partitioning, ordering, and frame semantics deliberately. For deterministic row numbering among equal values, add a unique tie-breaker. A running total’s frame can change how peer rows are treated, so verify the result with duplicate dates or amounts.

**Example**

```cl
SELECT id, customer_id,
 ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC, id DESC) AS rn
FROM app.orders;
```

</details>

## Checkpoint — 5 MCQs

Answer all questions before checking the key. Aim for 5/5 before continuing.

### 1. Which statement activates a declared cursor for use?

A. DECLARE alone
B. CLOSE
C. OPEN
D. COMMIT alone

### 2. What does SQLSTATE 02000 commonly indicate on FETCH?

A. Successful update of every row
B. A signature violation
C. Missing authority always
D. No more data

### 3. Why use an indicator for a nullable result?

A. To communicate NULL independently of the host value
B. To sort rows
C. To bind a module
D. To start a job queue

### 4. WITH HOLD primarily changes behavior across:

A. Every system failure
B. COMMIT
C. All connection closures
D. Every ROLLBACK

### 5. A process executes 100,000 nearly identical updates. Investigate:

A. A larger terminal window
B. Disabling status checks
C. A set-based or batched operation
D. Adding nested cursors first

<details>
<summary>Answer key and explanations</summary>

1. **C — OPEN** DECLARE describes it; OPEN prepares it for fetching.

2. **D — No more data** Handle no data as the cursor termination condition, separately from errors.

3. **A — To communicate NULL independently of the host value** A null indicator prevents treating an absent value as a valid host-variable value.

4. **B — COMMIT** It is not a durable restart mechanism or an exemption from all close rules.

5. **C — A set-based or batched operation** Reduce repeated work while preserving correctness and transaction boundaries.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Db2 for i SQL reference (7.4)](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)
- [IBM: Isolation level](https://www.ibm.com/docs/en/i/7.5.0?topic=concepts-isolation-level)
- [IBM: SQL programming guide](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafypdf.pdf)

[← Previous](sql-fundamentals.md) · [Next →](rpg-foundations.md)
