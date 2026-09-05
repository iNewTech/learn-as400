# Data and files: PF, LF, DDS and native I/O

[Learning path index](README.md) · Easy

This path uses simple explanations, safe code skeletons, and IBM i commands before the detailed question chapters.

## Outcomes

- Select a keyed read, sequential read, or SQL query for a task.
- Explain the relationship between a physical file and a logical view.
- Discuss not-found, end-of-file, and record-lock outcomes explicitly.

## 1. Model the record before choosing the operation

A physical file stores rows and can have keyed access paths. A logical file describes another view over one or more physical files, often with a different key or selected fields. DDS can define these objects; SQL DDL is another way to describe the database. The choice should follow the existing system and the team’s migration plan.

Before coding, name the record format, key, expected cardinality, and consistency need. That short design note prevents a developer from using a keyed operation where a set-based query or a range read is clearer.

**Flow**

1. State the business key and expected number of rows
2. Choose native I/O or SQL based on the access pattern
3. Define not-found and end-of-file behavior
4. Define the lock and commitment expectation
5. Test empty, duplicate, and concurrent cases

## 2. Read safely with native RPG operations

CHAIN is a keyed lookup. SETLL positions an access path and READE reads records with an equal key. READ reads the next record in sequence. Every operation needs an explicit status check so stale fields are never treated as a successful read.

For a write, retrieve the intended record, validate the business rule, and update that record. State what happens if another job holds the record lock. A strong interview answer describes the operator-visible message and the retry or conflict path.

**Fixed format**

```rpgle
FCustomers       IF   E             K DISK
C     customerId    CHAIN     CustomerRec
C                   IF        %FOUND(Customers)
C                   EVAL      greeting = 'Hello ' + %TRIM(name)
C                   ENDIF
```

**Fully free**

```rpgle
**FREE
dcl-f Customers keyed usage(*input);
chain customerId CustomerRec;
if %found(Customers);
  greeting = 'Hello ' + %trim(name);
endif;
```

## 3. DDS and SQL can coexist during modernization

Many IBM i estates contain DDS-described files, SQL-created tables, and logical files that support older programs. Do not remove an access path just because a new SQL statement works in a test. Check which programs depend on record formats, key order, triggers, constraints, and journaling.

A practical migration is incremental: document the current object, add a tested SQL view or index when useful, move one access path, and keep a rollback plan.

**Inspect the object before changing it**

```cl
DSPFD FILE(APPDATA/ORDERS) TYPE(*BASIC)
DSPFFD FILE(APPDATA/ORDERS)
DSPDBR FILE(APPDATA/ORDERS)
```

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [Files & native file operations](files-operations.md), [DDS, physical & logical files](dds-pf-lf.md).

## IBM documentation

- [IBM: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM: Keys for file operations](https://www.ibm.com/docs/ssw_ibm_i_74/rzasd/fileopkeys.htm)
- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)
- [IBM: OPEN and USROPN](https://www.ibm.com/docs/en/i/7.6.0?topic=codes-open-open-file-processing)
- [IBM: Physical and logical files](https://www.ibm.com/docs/en/i/7.4.0?topic=program-physical-files-logical-files)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)
- [IBM: Triggers and constraints](https://www.ibm.com/docs/en/i/7.4.0?topic=administration-working-triggers-constraints)
- [IBM: CREATE TRIGGER](https://www.ibm.com/docs/en/i/7.5.0?topic=statements-create-trigger)

[← Previous path](learning-platform-foundations.md) · [Next path →](learning-db2-for-i.md)
