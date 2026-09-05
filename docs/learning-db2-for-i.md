# Db2 for i: SQL, cursors, commitment and isolation

[Learning path index](README.md) · Intermediate

This path uses simple explanations, safe code skeletons, and IBM i commands before the detailed question chapters.

## Outcomes

- Explain why a set-based query is usually preferable to a row loop.
- Build a cursor plan with open, fetch, end-of-data, and close behavior.
- Choose a transaction boundary and describe the locks it creates.

## 1. Think in sets first

Db2 for i can filter, join, aggregate, and order rows close to the data. Start with the result the business needs, then write the smallest query that returns it. A loop in RPG is still useful when each row drives a side effect, but it should not replace a simple set operation.

Use explicit column lists, meaningful predicates, and a stable ordering when the result is shown to a user. Check the access plan before calling a query slow.

**Fully free**

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

**Fully free**

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

```cl
STRCMTCTL LCKLVL(*CS) CMTSCOPE(*JOB)
CALL PGM(APPDATA/POSTORDER)
COMMIT
ENDCMTCTL
```

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [Db2 for i & SQL foundations](sql-fundamentals.md), [Embedded SQL & cursors](sql-cursors.md), [Commitment control & journaling](commitment-control.md), [Locks, concurrency & isolation](locks-isolation.md).

## IBM documentation

- [IBM: Db2 for i SQL reference (7.4)](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)
- [IBM: Isolation level](https://www.ibm.com/docs/en/i/7.5.0?topic=concepts-isolation-level)
- [IBM: SQL programming guide](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafypdf.pdf)
- [IBM: Using COMMIT](https://www.ibm.com/docs/en/i/7.4.0?topic=control-using-commit-operation)
- [IBM: Commitment definitions and activation groups](https://www.ibm.com/docs/en/i/7.4.0?topic=scoping-commitment-definitions-activation-groups)
- [IBM: Journal and commit APIs](https://www.ibm.com/docs/en/i/7.5.0?topic=category-journal-commit)
- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)

[← Previous path](learning-data-and-files.md) · [Next path →](learning-rpg-development.md)
