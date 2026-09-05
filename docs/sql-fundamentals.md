# Db2 for i & SQL foundations

[Question index](README.md) · Data & database · Easy

Build correct queries with joins, grouping, null handling, and safe parameters.

## 1. How do SQL tables, views, and indexes differ?

**Easy**

<details>
<summary>Explain the answer</summary>

A table holds rows. A view defines a query interface over data. An index provides an access structure the optimizer may choose. A view does not inherently guarantee an indexed access strategy, and an index does not replace a query’s result definition.

Choose each for its purpose: tables for persistence, views for a stable projection or restricted interface, and indexes for measured access needs. Database objects also have IBM i system representations, which matter to native consumers.

</details>

## 2. What is the difference between WHERE and HAVING?

**Easy**

<details>
<summary>Explain the answer</summary>

WHERE filters input rows before grouping. HAVING filters groups after aggregation. Putting a row condition in the wrong place can change totals or prevent a valid query.

For example, filter cancelled orders before calculating revenue by customer, then use HAVING to retain customers whose total exceeds a threshold. State the business definition of the total before optimizing the query.

```text
SELECT customer_id, SUM(amount) AS total
FROM app.orders WHERE status <> 'CANCELLED'
GROUP BY customer_id HAVING SUM(amount) > 1000;
```

</details>

## 3. How does SQL NULL differ from blanks or zero?

**Easy**

<details>
<summary>Explain the answer</summary>

NULL represents a missing or unknown value, not a particular numeric or character value. Comparisons involving NULL usually yield unknown, so use IS NULL rather than = NULL. Many aggregates ignore null operands; COUNT(*) counts rows while COUNT(column) counts non-null values.

Use COALESCE only when a replacement matches the business meaning. Converting an unknown payment amount to zero may make a report look complete while hiding a data-quality issue.

</details>

## 4. How can a LEFT JOIN accidentally become an inner join?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A LEFT JOIN preserves unmatched left rows by supplying nulls for right-side columns. A WHERE predicate requiring a right-side value can reject those null-extended rows and remove the preservation you intended.

Place a right-side eligibility condition in ON when the requirement is to retain every left row but attach only qualifying matches. Validate the result with customers who have no orders and customers whose orders all fail the condition.

```text
SELECT c.id, o.id
FROM app.customer c LEFT JOIN app.orders o
  ON o.customer_id=c.id AND o.status='OPEN';
```

</details>

## 5. Why use parameter markers or host variables?

**Intermediate**

<details>
<summary>Explain the answer</summary>

They separate values from SQL statement structure, helping prevent SQL injection and reducing unnecessary variations in statement text. Embedded SQL uses host variables; prepared dynamic SQL commonly uses parameter markers.

Parameters do not substitute for arbitrary identifiers such as column names. For a selectable sort column, map an approved choice to known SQL text, and bind the value predicates. Also align parameter types with indexed columns to avoid unnecessary conversions.

```text
SELECT id FROM app.orders WHERE customer_id = ?
```

</details>

## 6. How do UNION and UNION ALL differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

UNION combines compatible result sets and removes duplicate result rows. UNION ALL retains duplicates and avoids that duplicate-elimination requirement. The right choice follows the required result semantics, not a universal performance rule.

If two sources can legitimately contain identical transactions, UNION may silently collapse information the report should retain. Apply a final ORDER BY when ordering is required; the order of the input SELECT statements does not establish a guaranteed output order.

</details>

## 7. When is EXISTS preferable to joining a child table?

**Intermediate**

<details>
<summary>Explain the answer</summary>

EXISTS tests whether a qualifying row is present. It is useful when the required output is one parent row if any matching child exists, rather than a row for every child. It expresses that intent without multiplying the parent by its matches.

Use it for customers with at least one overdue invoice, for example. Do not assume it is always faster than every join; inspect the actual plan. Its main advantage here is correct and clear cardinality.

```text
SELECT c.id FROM app.customer c
WHERE EXISTS (SELECT 1 FROM app.invoice i
 WHERE i.customer_id=c.id AND i.status='OVERDUE');
```

</details>

## 8. Can you rely on row order without ORDER BY?

**Intermediate**

<details>
<summary>Explain the answer</summary>

No. An access path used today does not create an SQL ordering contract. Different plans, statistics, data volume, or release levels can change the observed order. Include ORDER BY whenever output order is part of the requirement.

For paging, include a unique tie-breaker so equal sort values have a deterministic sequence. If data can change between pages, choose and document an appropriate consistency strategy. FETCH FIRST without a meaningful order does not reliably select the “latest” business rows.

</details>

## 9. Why does a join produce duplicate totals?

**Advanced**

<details>
<summary>Explain the answer</summary>

Check the cardinality at every join. Joining a header to both detail lines and payments can multiply rows when both sides are one-to-many. SUM then counts the same line multiple times even though each join predicate is individually valid.

Aggregate each child to the intended grain before joining, or use EXISTS for a pure existence condition. State the desired output grain—one row per order, customer, or line—and verify it with a small case containing multiple children on both sides.

```text
2 order lines × 3 payments can produce 6 joined rows.
```

**Interview pitfall:** DISTINCT may hide symptoms without repairing the aggregation logic.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Which condition detects missing values?

A. = NULL
B. IS NULL
C. = blanks
D. IS ZERO

### 2. Which clause filters grouped totals?

A. ON only
B. ORDER BY
C. HAVING
D. FETCH FIRST

### 3. What preserves customers with no qualifying order?

A. Require order status in WHERE
B. Use an INNER JOIN
C. Remove the customer table
D. Put order eligibility in the LEFT JOIN ON clause

### 4. Can a parameter marker safely stand for any table name?

A. No, validate identifiers separately
B. Yes, in all statements
C. Only if it contains quotes
D. Only under *ALLOBJ

### 5. Two lines joined to three payments can yield how many rows?

A. Two always
B. Six
C. Three always
D. One always

<details>
<summary>Answer key and explanations</summary>

1. **B — IS NULL** NULL is tested using IS NULL; ordinary equality does not produce true for unknown values.

2. **C — HAVING** HAVING applies conditions after grouping and aggregation.

3. **D — Put order eligibility in the LEFT JOIN ON clause** A right-side WHERE condition can reject unmatched rows.

4. **A — No, validate identifiers separately** Markers bind values, not arbitrary SQL identifiers or syntax.

5. **B — Six** Independent one-to-many joins can multiply rows; aggregate at the intended grain.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Db2 for i SQL reference (7.4)](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)

[← Previous](dds-pf-lf.md) · [Next →](sql-cursors.md)
