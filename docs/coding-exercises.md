# Coding exercises: fixed and fully free RPG

[Question index](README.md) · Hands-on coding · Intermediate

Hands-on interview tasks with the same intent shown in legacy fixed-format RPG and modern fully free RPG.

## 1. Read a keyed customer and print a greeting when it exists.

**Easy**

<details>
<summary>Explain the answer</summary>

Define a keyed customer file, receive a customer number, and use a keyed read. Explain how you represent not-found status, avoid displaying stale fields, and test both an existing and missing key. The file definition, key field, and record format must match the compiled object.

Fixed format is common in maintenance interviews; fully free format is preferred for new RPG. The operation is the same in both examples, so describe the behavior first and syntax second.

**Fixed-format RPG**

```rpgle
FCustomers       IF   E             K DISK
C     customerId    CHAIN     CustomerRec
C                   IF        %FOUND(Customers)
C                   EVAL      greeting = 'Hello ' + name
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

</details>

## 2. Sum all order lines for one customer with SETLL and READE.

**Easy**

<details>
<summary>Explain the answer</summary>

SETLL positions the access path; READE retrieves records whose key equals the requested value. Initialize the accumulator before the loop and stop when end of file or a different key is reached. Mention decimal precision, no matching rows, and the locking assumption.

Interviewers often test whether you confuse positioning with retrieval. A strong answer also explains how concurrent updates could affect a long read loop and what consistency guarantee the application needs.

**Fixed-format RPG**

```rpgle
FOrders          IF   E             K DISK
C     customerId    SETLL     Orders
C     customerId    READE     Orders
C                   DOU       %EOF(Orders) OR orderCustomer <> customerId
C                   ADD       amount        total
C     customerId    READE     Orders
C                   ENDDO
```

**Fully free RPG**

```rpgle
**FREE
dcl-f Orders keyed usage(*input);
setll customerId Orders;
reade customerId Orders;
dow not %eof(Orders) and orderCustomer = customerId;
  total += amount;
  reade customerId Orders;
enddo;
```

</details>

## 3. Update a product only when the row is found and the quantity is valid.

**Intermediate**

<details>
<summary>Explain the answer</summary>

Use an update-capable keyed read, validate the requested quantity, then UPDATE only the retrieved record. Separate not-found, invalid-input, lock failure, and success outcomes. For concurrency, explain whether you hold a lock through the change or use a version predicate to detect a stale edit.

The essential grading point is safe behavior, not memorized syntax. An unconditional update can affect the wrong business state, while an explicit found check and conflict path make the operation reviewable and testable.

**Fixed-format RPG**

```rpgle
FProducts        UF   E             K DISK
C     productId    CHAIN     ProductRec
C                   IF        %FOUND(Products) AND newQty >= 0
C                   EVAL      quantity = newQty
C                   UPDATE    ProductRec
C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-f Products keyed usage(*update);
chain productId ProductRec;
if %found(Products) and newQty >= 0;
  quantity = newQty;
  update ProductRec;
endif;
```

</details>

## 4. Write a restartable batch loop that marks imported rows after successful processing.

**Advanced**

<details>
<summary>Explain the answer</summary>

Read pending rows in deterministic order, validate each row, apply the business change, and mark the source row processed only after success. Choose a commit boundary and record an operation identifier so a restart can distinguish completed work from retryable work.

Explain the failure window between the business update and status update. A production design needs idempotency, reconciliation for ambiguous outcomes, retry limits, and an operator path. The code below is deliberately a skeleton for an interview discussion.

**Fixed-format RPG**

```rpgle
FImport          UF   E             K DISK
C                   READ      ImportRec
C                   DOU       %EOF(Import)
C                   IF        status = 'P'
C                   EXSR      ProcessOne
C                   ENDIF
C                   READ      ImportRec
C                   ENDDO
```

**Fully free RPG**

```rpgle
**FREE
dcl-f Import keyed usage(*update);
read ImportRec;
dow not %eof(Import);
  if status = 'P';
    exsr ProcessOne;
  endif;
  read ImportRec;
enddo;
```

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Complete the keyed RPG read: `_____ customerId CustomerRec;`

A. chain
B. setll
C. read
D. update

### 2. Which operation positions a file without retrieving a record?

A. READE
B. SETLL
C. CHAIN
D. UPDATE

### 3. Complete the matching-key loop: `dow not %eof(Orders) and _____;`

A. %found(Orders)
B. orderCustomer = customerId
C. SQLSTATE = '00000'
D. %open(Orders)

### 4. What must happen before an imported row is marked processed?

A. The business change succeeds
B. The job ends
C. The queue is cleared
D. The row is deleted first

### 5. Which format is fully free RPG?

A. A source member with /FREE and /END-FREE only
B. A declaration beginning with **FREE
C. DDS source
D. CLLE source

<details>
<summary>Answer key and explanations</summary>

1. **A — chain** CHAIN retrieves a record by key and sets the found status used by the following condition.

2. **B — SETLL** SETLL positions the access path; a subsequent read retrieves a record.

3. **B — orderCustomer = customerId** The key comparison keeps processing within the requested equal-key group.

4. **A — The business change succeeds** Marking after the business effect succeeds supports restartability and recovery reasoning.

5. **B — A declaration beginning with **FREE** **FREE enables fully free RPG source; fixed-format columns are no longer required.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM Docs: RPG IV Reference](https://www.ibm.com/docs/en/i/7.4.0?topic=languages-rpg-iv)
- [IBM Docs: RPG built-in functions](https://www.ibm.com/docs/en/i/7.4.0?topic=functions-built-in)

[← Previous](tricky-questions.md) · 
