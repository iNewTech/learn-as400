# Data and files: PF, LF, DDS and native I/O

[Learning path index](README.md) · Easy

Learn IBM i physical and logical files, members, keys and RPG file operations through practical examples, level-check diagnosis and SQL comparisons.

Updated: 2026-10-11.

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

**Same keyed lookup in two RPG styles**

**Fixed format**

```rpgle
FCustomers       IF   E             K DISK
C     customerId    CHAIN     CustomerRec
C                   IF        %FOUND(Customers)
C                   EVAL      greeting = 'Hello ' + %TRIM(name)
C                   ENDIF
```

**Fully free RPG**

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

```text
DSPFD FILE(APPDATA/ORDERS) TYPE(*BASATR)
DSPFFD FILE(APPDATA/ORDERS)
DSPDBR FILE(APPDATA/ORDERS)
```

## 4. Why the correct file can still show the wrong records

An IBM i database file has several identities worth writing down: library, object name, record format and member. A physical file can contain multiple members with the same record layout. Think of the members as separate groups of records inside one described file. If a test expects October records while the program opens the default member, the field definitions can be correct and the business result still wrong.

For example, an import file named INBOUND might contain members SEP26 and OCT26. Check the member list before comparing row counts with a colleague. Also inspect which physical members a logical file member includes; an LF is not automatically a view of every member you intended. The commands below inspect descriptions without changing the data. Record the qualified file and selected member in your test notes so another developer can reproduce the result.

Expected outcome: you can identify the exact source of the records before changing the RPG logic. A matching object name alone is insufficient evidence.

**Inspect the file, members and access path — CL commands**

```text
DSPFD FILE(TESTDATA/INBOUND) TYPE(*MBRLIST)
DSPFD FILE(TESTDATA/INBOUND) TYPE(*RCDFMT)
DSPFD FILE(TESTDATA/CUSTORD) TYPE(*ACCPTH)
```

## 5. Work through a customer order range with SETLL and READE

Assume CUSTORD is an input-only keyed file whose key is CUSTOMER_ID followed by ORDER_ID. To read all orders for customer 42, supply only the leading customer key. SETLL positions the file; it does not load an order into the record fields. READE then retrieves successive records matching that key. Supplying ORDER_ID alone would not mean “find this order anywhere” because the leading key is still CUSTOMER_ID.

The calculation fragments below assume the file and numeric fields are already declared, customerId is 42, amount comes from the retrieved record, and total can hold the sum. With orders 101 and 102 worth 50 and 75, total becomes 125. If customer 42 has no orders, the first READE sets the end condition and total stays zero.

Keep the search key separate from fields overwritten by a read. Test no matching rows, one row, many rows and the next customer in the access path; that last case catches loops that accidentally use READ instead of READE.

**Input-only customer range: calculation fragments, declarations required**

**Fixed format**

```rpgle
     C                   EVAL      total = 0
     C     customerId    SETLL     CUSTORD
     C     customerId    READE     CUSTORD
     C                   DOW       not %eof(CUSTORD)
     C                   EVAL      total = total + amount
     C     customerId    READE     CUSTORD
     C                   ENDDO
```

**Fully free RPG**

```rpgle
total = 0;
setll customerId CUSTORD;
reade customerId CUSTORD;
dow not %eof(CUSTORD);
  total += amount;
  reade customerId CUSTORD;
enddo;
```

## 6. Diagnose a record format level check after a release

A program using externally described native files is compiled with knowledge of the record layout. If a deployed file has a different format level identifier, opening it can fail before your first useful read. A frequent cause is deploying the file change without rebuilding the affected programs, or compiling against one library and running against another.

Imagine a customer code grows from six characters to ten. Inspect the file in the failing job’s actual environment, compare the field definitions with the compile listing, and trace dependent files. Rebuild and test compatible consumers as part of the change. Do not treat LVLCHK(*NO) as a conversion: disabling the check does not make old field positions or lengths understand a new layout.

Expected outcome: the program and resolved file agree on the intended layout. Include both old and new boundary-length data in the regression test. A successful open proves only that one prerequisite passed; it does not prove that every business calculation is correct.

**Read the deployed record definition and dependencies**

```text
DSPFD FILE(TESTDATA/CUSTOMER) TYPE(*RCDFMT)
DSPFFD FILE(TESTDATA/CUSTOMER)
DSPDBR FILE(TESTDATA/CUSTOMER)
```

## 7. Explain why a logical-file read and SQL return different totals

A logical file can apply select/omit rules as well as a different key order. Suppose OPENORD is an LF over ORDERS that omits closed orders. An RPG loop reading OPENORD and SELECT SUM(AMOUNT) FROM ORDERS are not asking the same question. The SQL reads the base table without the LF’s filter. Copy the business meaning into the SQL predicate deliberately rather than assuming the names describe identical row sets.

For customer 42, use three test orders: OPEN for 50, OPEN for 75 and CLOSED for 90. The open-order result should contain two rows with a total of 125. The unrestricted base-table total is 215. These tiny fixtures make a migration error visible immediately. Check nullable status values and any additional LF select/omit rules before treating the example predicate as equivalent.

An SQL query also needs ORDER BY when the application depends on sequence. An index or logical file existing in the library does not make an unordered SQL result a promised customer/order sequence.

**SQL comparison against the base table — adapt the real LF rules**

```text
SELECT ORDER_ID, AMOUNT
FROM TESTDATA.ORDERS
WHERE CUSTOMER_ID = 42 AND STATUS = 'OPEN'
ORDER BY ORDER_ID;

SELECT COALESCE(SUM(AMOUNT), 0) AS OPEN_TOTAL
FROM TESTDATA.ORDERS
WHERE CUSTOMER_ID = 42 AND STATUS = 'OPEN';
```

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [Files & native file operations](files-operations.md), [DDS, physical & logical files](dds-pf-lf.md).

## IBM documentation

- [IBM: Physical files and logical files](https://www.ibm.com/docs/en/i/7.6.0?topic=program-physical-files-logical-files)
- [IBM: Defining logical file members](https://www.ibm.com/docs/en/i/7.5.0?topic=file-defining-logical-members)
- [IBM: Keys for file operations](https://www.ibm.com/docs/ssw_ibm_i_74/rzasd/fileopkeys.htm)
- [IBM: SETLL operation](https://www.ibm.com/docs/en/i/7.4.0?topic=codes-setll-set-lower-limit)
- [IBM: Display File Description command](https://www.ibm.com/docs/en/i/7.5.0?topic=d-display-file-description)
- [IBM: Create Logical File and level checking](https://www.ibm.com/docs/en/i/7.5.0?topic=c-create-logical-file)
- [IBM: DDS select/omit example](https://www.ibm.com/docs/en/i/7.4.0?topic=dds-example-describing-logical-file-using)
- [IBM: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)
- [IBM: OPEN and USROPN](https://www.ibm.com/docs/en/i/7.6.0?topic=codes-open-open-file-processing)
- [IBM: Physical and logical files](https://www.ibm.com/docs/en/i/7.4.0?topic=program-physical-files-logical-files)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)
- [IBM: Triggers and constraints](https://www.ibm.com/docs/en/i/7.4.0?topic=administration-working-triggers-constraints)
- [IBM: CREATE TRIGGER](https://www.ibm.com/docs/en/i/7.5.0?topic=statements-create-trigger)

[← Previous path](learning-platform-foundations.md) · [Next path →](learning-db2-for-i.md)
