# Db2 for i: SQL, cursors, commitment and isolation

[Learning path index](README.md) · Intermediate

Practise Db2 for i SQL joins, NULL handling, common table expressions and guarded updates with worked results, RPGLE host variables and IBM references.

Updated: 2026-10-11.

## Outcomes

- Explain why a set-based query is usually preferable to a row loop.
- Build a cursor plan with open, fetch, end-of-data, and close behavior.
- Choose a transaction boundary and describe the locks it creates.

## 1. Think in sets first

Db2 for i can filter, join, aggregate, and order rows close to the data. Start with the result the business needs, then write the smallest query that returns it. A loop in RPG is still useful when each row drives a side effect, but it should not replace a simple set operation.

Use explicit column lists, meaningful predicates, and a stable ordering when the result is shown to a user. Check the access plan before calling a query slow.

**Readable SQL skeleton**

**Example**

```sql
select o.customer_id, sum(o.amount) as open_total
  from appdata.orders as o
 where o.status = :status
 group by o.customer_id
 order by o.customer_id;
```

## 2. Use a cursor when the program must visit rows

A cursor has a lifecycle: declare the result, open it, fetch into host variables, handle SQLSTATE 02000, process the row, and close it. Keep the row work small and decide whether the cursor needs a stable snapshot or can see committed changes while it runs.

Never hide SQL errors behind an end-of-data check. Log SQLSTATE and the message text, then choose a retry, rollback, or operator action.

**Embedded SQL control skeleton**

**Fully free RPG**

```rpgle
exec sql
  declare c_orders cursor for
    select order_id, amount from appdata.orders
     where customer_id = :customerId;
exec sql open c_orders;
// fetch in a loop; stop only on SQLSTATE 02000
exec sql close c_orders;
```

**Flow**

1. Declare a result with a clear predicate
2. Open the cursor inside the intended transaction
3. Fetch and validate SQLSTATE
4. Process one row without doing unbounded work
5. Close the cursor and commit or roll back

## 3. Make commitment and locking a design choice

Commitment control groups changes into a unit that can be committed or rolled back. The boundary should match the business action: one order, one message, or a deliberately sized batch. A transaction that is too large holds locks and journals more work; one that is too small can leave a partial business action.

Isolation controls what a reader can see while other jobs change data. Explain the trade-off in plain language: stronger consistency can mean more waiting, while weaker isolation can expose a moving view. Test the chosen level with two concurrent jobs.

**CL transaction outline**

```text
STRCMTCTL LCKLVL(*CS) CMTSCOPE(*JOB)
CALL PGM(APPDATA/POSTORDER)
COMMIT
ENDCMTCTL
```

## 4. Keep customers with no orders using LEFT JOIN

Begin a join by stating what one result row represents. If the report needs one row per customer, joining customer, order and payment detail directly can multiply rows and inflate totals. For example, two orders joined to three independent payment rows can produce six combinations. DISTINCT does not repair a total that was calculated over the wrong combinations; aggregate each detail set to the required key first.

This smaller example counts open orders and keeps customers with none. CUSTOMER_ID is unique in CUSTOMERS and ORDER_ID is non-null in ORDERS. Put the open-status condition in ON so it restricts which orders match without removing the customer. COUNT(o.ORDER_ID) counts actual matching orders; COUNT(*) would count the preserved outer-join row even when no order matched.

With customer 42 having two open orders and customer 43 having none, expect counts 2 and 0. Moving o.STATUS into WHERE would remove customer 43. Test that missing-child case explicitly; successful-looking reports often hide it.

**Db2 for i SQL: one result row per customer**

```text
SELECT c.CUSTOMER_ID, COUNT(o.ORDER_ID) AS OPEN_ORDERS
FROM TESTDATA.CUSTOMERS AS c
LEFT JOIN TESTDATA.ORDERS AS o
  ON o.CUSTOMER_ID = c.CUSTOMER_ID
 AND o.STATUS = 'OPEN'
GROUP BY c.CUSTOMER_ID
ORDER BY c.CUSTOMER_ID;
```

## 5. Make NULL and zero mean different things

NULL represents a missing or unknown value; zero is a known numeric value. If three adjustment rows contain 10, 0 and NULL, COUNT(*) returns 3 while COUNT(AMOUNT) returns 2. Replacing every NULL with zero changes the question, especially for averages: the missing observation should not automatically become a measured zero.

The self-contained query below gives you a small dataset without creating a table. Expect ROWS_SEEN = 3, KNOWN_AMOUNTS = 2 and TOTAL = 10. Use IS NULL to find the missing amount. Do not write AMOUNT = NULL as a missing-value test; use the SQL null predicate.

When a report intentionally displays zero for an empty total, COALESCE can express that output rule. Explain why the replacement is appropriate instead of using it to hide incomplete data. In embedded SQL, a nullable result also needs an appropriate indicator variable unless the expression intentionally supplies a non-null replacement; the host variable alone cannot represent both states.

**Read-only SQL fixture: compare row count with known-value count**

```text
WITH Adjustments(AMOUNT) AS (
  VALUES DECIMAL(10, 9, 2),
         DECIMAL(0, 9, 2),
         CAST(NULL AS DECIMAL(9, 2))
)
SELECT COUNT(*) AS ROWS_SEEN,
       COUNT(AMOUNT) AS KNOWN_AMOUNTS,
       SUM(AMOUNT) AS TOTAL
FROM Adjustments;
```

## 6. Use a CTE to show the steps in a business query

A common table expression, introduced by WITH, names an intermediate query result within a statement. CustomerTotals below first groups orders by customer. The outer query then filters those totals. For customer 42 with orders worth 6000 and 5000, the sum is 11000, so that customer appears. Customer 43 with a total of exactly 10000 does not pass the greater-than condition.

This example uses one CTE reference. It is a way to organise SQL, not a CREATE TABLE statement or a persistent object you can query later. A view is a different choice when several statements should reuse a named query definition.

Execution details matter when performance is involved. IBM documents that IBM i 7.5 changed the default handling of shared CTEs referenced multiple times to capture their results for consistency. Avoid a blanket rule that every CTE is always merged or always captured on every release. Inspect the actual plan and release/PTF behavior before tuning a slow report.

**Db2 for i SQL: group first, then filter the customer totals**

```text
WITH CustomerTotals AS (
  SELECT CUSTOMER_ID, SUM(AMOUNT) AS TOTAL_AMOUNT
  FROM TESTDATA.ORDERS
  GROUP BY CUSTOMER_ID
)
SELECT CUSTOMER_ID, TOTAL_AMOUNT
FROM CustomerTotals
WHERE TOTAL_AMOUNT > 10000
ORDER BY TOTAL_AMOUNT DESC, CUSTOMER_ID;
```

## 7. Use a guarded UPDATE and check the affected-row count

Consider a reservation request for three units of item A100. Reading quantity 5 and later writing quantity 2 can lose another job’s change if both jobs read the old value. A conditional UPDATE expresses the change and minimum-stock rule in one statement. This does not replace transaction design, but it avoids a separate unprotected read-modify-write calculation.

The SQLRPGLE fragments assume matching declared host variables and a unique ITEM_ID. A successful update of one row means the reservation applied. Zero affected rows means no row satisfied the predicate; it could be a missing item or insufficient quantity, so choose the user-facing explanation deliberately. More than one affected row indicates the unique-key assumption is wrong. Reject zero or negative requested quantities before executing the statement.

Capture the original SQL status, retrieve diagnostics immediately, and handle errors before relying on the count. If the reservation also creates an order line, put both changes in the same intended transaction and commit only after both succeed. These fragments omit that caller-owned transaction and error-reporting code.

**Embedded SQLRPGLE fragments: host declarations and transaction handling required**

**Fixed format**

```rpgle
     C/EXEC SQL
     C+ UPDATE TESTDATA.STOCK
     C+ SET AVAILABLE = AVAILABLE - :qty
     C+ WHERE ITEM_ID = :itemId AND AVAILABLE >= :qty
     C/END-EXEC
     C                   EVAL      savedState = SQLSTATE
     C/EXEC SQL
     C+ GET DIAGNOSTICS :changed = ROW_COUNT
     C/END-EXEC
```

**Fully free RPG**

```rpgle
exec sql
  update TESTDATA.STOCK
     set AVAILABLE = AVAILABLE - :qty
   where ITEM_ID = :itemId and AVAILABLE >= :qty;
savedState = SQLSTATE;
exec sql get diagnostics :changed = ROW_COUNT;
// Check savedState and diagnostics status before using changed.
// Commit or roll back the complete business transaction in the caller.
```

<details>
<summary>Quick Revision · 2-minute recap</summary>

### Keep these in mind

- Define the intended row set before writing SELECT or UPDATE.
- Use host variables for values; preserve NULL with indicators.
- SELECT INTO is for one row; a cursor processes multiple rows.
- Check SQLSTATE immediately after each executable SQL statement.
- Choose commit boundaries around a business unit of work.
- Measure query plans and locking with representative data.

**Remember this pattern**

```text
SELECT CUSTOMER_ID, SUM(AMOUNT) AS TOTAL_AMOUNT
FROM APPDATA.ORDERS
GROUP BY CUSTOMER_ID
HAVING SUM(AMOUNT) > 10000;
```

**Common mistake:** Do not treat no row, NULL and numeric zero as the same outcome.

**Think it through:** A report needs totals per customer above 10000. Should RPG fetch and total every row?

<details>
<summary>Show the reasoning</summary>

Start with a grouped SQL query. Return the smaller result set unless application rules require individual row processing.

</details>

</details>

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [Db2 for i & SQL foundations](sql-fundamentals.md), [Embedded SQL & cursors](sql-cursors.md), [Commitment control & journaling](commitment-control.md), [Locks, concurrency & isolation](locks-isolation.md).

## IBM documentation

- [IBM: Subselect examples including LEFT OUTER JOIN](https://www.ibm.com/docs/en/i/7.5.0?topic=subselect-examples)
- [IBM: COUNT function](https://www.ibm.com/docs/en/i/7.5.0?topic=functions-count)
- [IBM: Using table expressions](https://www.ibm.com/docs/en/i/7.5.0?topic=statement-using-table-expressions)
- [IBM: Shared CTE behavior on IBM i 7.5](https://www.ibm.com/docs/en/i/7.5.0?topic=dc-change-implementation-some-shared-common-table-expressions-sql-queries)
- [IBM: GET DIAGNOSTICS](https://www.ibm.com/docs/en/i/7.4.0?topic=statements-get-diagnostics)
- [IBM: SQL diagnostic information](https://www.ibm.com/docs/en/i/7.5.0?topic=statements-sql-diagnostic-information)
- [IBM: ILE RPG SQLCA fields](https://www.ibm.com/docs/en/i/7.5.0?topic=area-include-sqlca-declarations)
- [IBM: Db2 for i SQL reference (7.4)](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)
- [IBM: Isolation level](https://www.ibm.com/docs/en/i/7.5.0?topic=concepts-isolation-level)
- [IBM: SQL programming guide](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafypdf.pdf)
- [IBM: Using COMMIT](https://www.ibm.com/docs/en/i/7.4.0?topic=control-using-commit-operation)
- [IBM: Commitment definitions and activation groups](https://www.ibm.com/docs/en/i/7.4.0?topic=scoping-commitment-definitions-activation-groups)
- [IBM: Journal and commit APIs](https://www.ibm.com/docs/en/i/7.5.0?topic=category-journal-commit)
- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)

[← Previous path](learning-data-and-files.md) · [Next path →](learning-rpg-development.md)
