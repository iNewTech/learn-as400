# Coding lab: RPGLE and CL from fixed to free form

[Question index](README.md) · Hands-on coding · Intermediate

A production-minded coding lab with RPGLE and CL exercises for file I/O, SQL, subfiles, ILE, queues, batch jobs, recovery, and integration. RPG tasks show the same intent in fixed-format and fully free source.

## 1. Read a keyed customer and print a greeting when it exists.

**Easy** · CHAIN and %FOUND

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

**Easy** · SETLL and READE

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

**Intermediate** · Safe UPDATE

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

**Advanced** · Restartable batch

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

## 5. Add a new order only when its business key is not already present.

**Easy** · WRITE and duplicate handling

<details>
<summary>Explain the answer</summary>

Validate the customer, order date, amount, and required status before writing. Use a keyed lookup or a unique database constraint to detect a duplicate, and make the duplicate outcome explicit to the caller. Do not rely on a prior screen check because another job can insert the same key between that check and the WRITE.

A production answer names the authority and commitment boundary as well. If the database enforces uniqueness, catch and translate the duplicate diagnostic rather than treating every write error as the same condition.

**Fixed-format RPG**

```rpgle
FOrders          UF   E             K DISK
C     orderId       CHAIN     OrderRec
C                   IF        NOT %FOUND(Orders)
C                   EVAL      status = 'NEW'
C                   WRITE     OrderRec
C                   ELSE
C                   EXSR      Duplicate
C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-f Orders keyed usage(*update);
chain orderId OrderRec;
if not %found(Orders);
  status = 'NEW';
  write OrderRec;
else;
  // return a duplicate-key result to the caller
endif;
```

</details>

## 6. Handle a record-lock or conversion error without losing the job context.

**Intermediate** · MONITOR and file errors

<details>
<summary>Explain the answer</summary>

Put the smallest risky operation inside MONITOR and use ON-ERROR for the expected status codes. Capture the file name, key, job identity, and error code before deciding whether to retry, return a business error, or send an escape message. Do not catch every exception and continue with partially changed fields.

The interviewer is checking that you separate a not-found result from an I/O exception. A clean handler leaves the record and transaction in a known state, writes a useful diagnostic, and gives the operator a safe next action.

**Fixed-format RPG**

```rpgle
C                   MONITOR
C     orderId       CHAIN     OrderRec
C                   UPDATE    OrderRec
C                   ON-ERROR  1211
C                   EXSR      RecordLocked
C                   ON-ERROR
C                   EXSR      FileFailure
C                   ENDMON
```

**Fully free RPG**

```rpgle
**FREE
monitor;
  chain orderId OrderRec;
  update OrderRec;
on-error 1211;
  // record lock: retry or return a conflict
on-error;
  // log unexpected I/O and leave through the error path
endmon;
```

</details>

## 7. Parse one delimited import line into a qualified data structure.

**Intermediate** · Data structures and parsing

<details>
<summary>Explain the answer</summary>

Define a qualified data structure for the parsed fields and keep the raw line separate. Split only the delimiters you support, trim fields deliberately, validate numeric and date conversions, and return a reason when a field is missing. Never let a malformed line silently become a zero or blank business value.

A robust exercise answer also states how quoted delimiters, CCSID conversion, maximum line length, and rejected-row storage will be handled. The parser should be deterministic and independently testable.

**Fixed-format RPG**

```rpgle
D rawLine         S            256A
D orderId         S              9P 0
D customerId      S              9P 0
C                   EVAL      orderId = %DEC(%TRIM(%SUBST(rawLine:1:9)):9:0)
C                   EVAL      customerId = %DEC(%TRIM(%SUBST(rawLine:11:9)):9:0)
```

**Fully free RPG**

```rpgle
**FREE
dcl-s rawLine varchar(256);
dcl-ds importRow qualified;
  orderId packed(9:0);
  customerId packed(9:0);
end-ds;
// split, validate, and convert each field; return a reason on failure
```

</details>

## 8. Validate a date, amount, and required text before posting a transaction.

**Intermediate** · Validation and built-ins

<details>
<summary>Explain the answer</summary>

Normalize the incoming character values first, then convert them with the appropriate date and decimal formats. Check required text after trimming, reject invalid ranges, and return field-level messages. Keep validation free of database side effects so it can be tested with a table of good and bad inputs.

Mention locale and time-zone assumptions when dates cross an integration boundary. If a conversion can raise an exception, protect only that conversion and preserve the original input in the diagnostic.

**Fixed-format RPG**

```rpgle
C                   EVAL      name = %TRIM(inputName)
C                   IF        name = *BLANKS
C                   EXSR      MissingName
C                   ENDIF
C                   EVAL      amount = %DEC(inputAmount:11:2)
C                   IF        amount < 0
C                   EXSR      InvalidAmount
C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
name = %trim(inputName);
if name = '';
  return validationError('name is required');
endif;
monitor;
  amount = %dec(inputAmount: 11: 2);
on-error;
  return validationError('amount is not numeric');
endmon;
if amount < 0; return validationError('amount cannot be negative'); endif;
```

</details>

## 9. Create a procedure that returns a typed result and an error message.

**Intermediate** · Prototypes and procedures

<details>
<summary>Explain the answer</summary>

Define a prototype with typed parameters and a return value, then repeat the contract in the procedure interface. Return one predictable result for success and a structured error for validation or data failure. Use CONST for inputs that the procedure must not change and document whether a parameter is optional.

A strong answer explains that prototyped calls let the compiler check parameter count and type. It also describes how a caller in another module receives the prototype through a /COPY member or a service-program interface.

**Fixed-format RPG**

```rpgle
D validateOrder    PR             1N
D   orderId                       9P 0 CONST
D   errorText                    80A   OPTIONS(*VARSIZE)
P validateOrder    B
D                 PI             1N
D   orderId                       9P 0 CONST
D   errorText                    80A   OPTIONS(*VARSIZE)
C                   RETURN    *ON
P validateOrder    E
```

**Fully free RPG**

```rpgle
**FREE
dcl-pr validateOrder ind;
  orderId packed(9:0) const;
  errorText varchar(80);
end-pr;

dcl-proc validateOrder;
  dcl-pi *n ind;
    orderId packed(9:0) const;
    errorText varchar(80);
  end-pi;
  // validate and set one clear error; return *on only for success
  return *on;
end-proc;
```

</details>

## 10. Call a service-program procedure while preserving a stable interface.

**Advanced** · ILE service-program call

<details>
<summary>Explain the answer</summary>

Put the prototype in a shared /COPY member, call the exported procedure by its contract, and keep implementation details private to the service program. Explain how the binder signature is versioned when a new parameter is needed. The caller should receive a documented return code or result data structure, not depend on a global variable.

Test both the current and previous supported signature when compatibility is promised. At release time, inspect the service program exports and bind the caller in a controlled library.

**Fixed-format RPG**

```rpgle
D postOrder       PR             10I 0
D   orderId                       9P 0 CONST
C                   CALLP     postOrder(orderId)
C                   IF        result <> 0
C                   EXSR      ServiceError
C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-pr postOrder int(10);
  orderId packed(9:0) const;
end-pr;
result = postOrder(orderId);
if result <> 0;
  // translate service result and include the correlation ID
endif;
```

</details>

## 11. Load a display-file subfile one page at a time from a keyed access path.

**Intermediate** · Subfile loading

<details>
<summary>Explain the answer</summary>

Clear the subfile, position the access path from the user’s key, read up to the page size, and set the end-of-list indicator when no more rows are available. Keep screen indicators in the display procedure and keep the data selection in a procedure that can be tested separately.

State what happens when the key is before the first row, when the list is empty, and when a user changes the filter while paging. A page token or repeatable key range is safer than relying on a mutable relative record number.

**Fixed-format RPG**

```rpgle
C                   Z-ADD     0             SflCount
C     startKey      SETLL     Orders
C     startKey      READE     Orders
C                   DOW       NOT %EOF(Orders) AND SflCount < PageSize
C                   WRITE     SflRecord
C                   ADD       1             SflCount
C     startKey      READE     Orders
C                   ENDDO
```

**Fully free RPG**

```rpgle
**FREE
clearSubfile();
setll startKey Orders;
reade startKey Orders;
 dow not %eof(Orders) and sflCount < pageSize;
   write SflRecord;
   sflCount += 1;
   reade startKey Orders;
 enddo;
// show a next-page option only when another key exists
```

</details>

## 12. Process only the rows a user changed in a subfile and reject invalid edits.

**Intermediate** · READC and changed rows

<details>
<summary>Explain the answer</summary>

Use READC to retrieve changed subfile records, validate each row again on the server, and update by a stable key. Do not trust a screen value or assume that a changed row is still current. Return a row-level error and leave it visible for correction when validation or locking fails.

Explain how SFLNXTCHG and the subfile indicators affect the next display. For a high-contention table, add an optimistic version or timestamp check and show the conflict instead of overwriting another user’s change.

**Fixed-format RPG**

```rpgle
C                   READC     SflRecord
C                   DOU       %EOF(Display)
C                   IF        qty >= 0
C                   EXSR      UpdateOne
C                   ELSE
C                   EXSR      MarkError
C                   ENDIF
C                   READC     SflRecord
C                   ENDDO
```

**Fully free RPG**

```rpgle
**FREE
readc SflRecord;
dow not %eof(Display);
  if qty >= 0;
    // update by key and check the row version
  else;
    // set SFLNXTCHG so the user sees the validation error
  endif;
  readc SflRecord;
enddo;
```

</details>

## 13. Insert an order with embedded SQL and translate SQLSTATE for the caller.

**Intermediate** · Embedded SQL CRUD

<details>
<summary>Explain the answer</summary>

Bind host variables with a clear naming convention, insert only the columns the business action owns, and check SQLSTATE immediately. Map a duplicate key, missing parent, data conversion error, and connection or authority failure to distinct outcomes. Keep transaction ownership at the boundary that knows whether the whole business action succeeded.

Do not use a generic ‘SQL failed’ message. Include the operation identifier and safe context, while keeping credentials and sensitive data out of logs. Test the insert under both success and duplicate conditions.

**Fixed-format RPG**

```rpgle
C/EXEC SQL
C+ INSERT INTO APPDATA/ORDERS
C+   (ORDER_ID, CUSTOMER_ID, AMOUNT)
C+ VALUES (:orderId, :customerId, :amount)
C/END-EXEC
C                   IF        SQLCOD = -803
C                   EXSR      Duplicate
C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
exec sql
  insert into appdata.orders (order_id, customer_id, amount)
  values (:orderId, :customerId, :amount);
if sqlState = '23505';
  // duplicate key: return a business-level conflict
elseif sqlState <> '00000';
  // log SQLSTATE and leave through the error path
endif;
```

</details>

## 14. Fetch a large result set in pages without holding unnecessary locks.

**Advanced** · SQL cursor paging

<details>
<summary>Explain the answer</summary>

Choose a stable ordering key and use a continuation value such as the last key returned. Declare a cursor only when the result cannot be expressed as a bounded keyset query. Fetch the requested page, stop on SQLSTATE 02000, and close resources on every exit path.

Explain the isolation and commitment choice. A long cursor can see changing rows or hold resources depending on how it is declared and used. Measure memory, response time, and lock waits with realistic concurrency before choosing multi-row fetch or a larger page.

**Fixed-format RPG**

```rpgle
C/EXEC SQL
C+ DECLARE C1 CURSOR FOR
C+   SELECT ORDER_ID, AMOUNT FROM APPDATA/ORDERS
C+    WHERE ORDER_ID > :lastId ORDER BY ORDER_ID
C/END-EXEC
C/EXEC SQL OPEN C1 C/END-EXEC
C/EXEC SQL FETCH C1 INTO :orderId, :amount C/END-EXEC
```

**Fully free RPG**

```rpgle
**FREE
exec sql declare c1 cursor for
  select order_id, amount from appdata.orders
   where order_id > :lastId
   order by order_id;
exec sql open c1;
// fetch one page, handle 02000, and close in the cleanup path
exec sql close c1;
```

</details>

## 15. Post an order and its audit row as one transaction.

**Advanced** · Commit and rollback

<details>
<summary>Explain the answer</summary>

Start commitment control at the correct job or activation-group scope, perform the business update and audit insert, and commit only after both succeed. On any expected failure, roll back and return a status that tells the caller whether retrying is safe. Keep external calls outside the transaction unless they are idempotent and the failure window is understood.

Describe how journaling, isolation, and lock duration support the chosen boundary. Test a failure after the first statement to prove that no partial order remains.

**Fixed-format RPG**

```rpgle
C                   EXSR      StartCommit
C/EXEC SQL
C+ UPDATE APPDATA/ORDERS SET STATUS = 'POSTED' WHERE ORDER_ID = :orderId
C/END-EXEC
C/EXEC SQL
C+ INSERT INTO APPDATA/ORDER_AUDIT VALUES(:orderId, CURRENT_TIMESTAMP)
C/END-EXEC
C                   COMMIT
```

**Fully free RPG**

```rpgle
**FREE
exec sql set transaction isolation level read committed;
exec sql update appdata.orders set status = 'POSTED' where order_id = :orderId;
exec sql insert into appdata.order_audit values (:orderId, current_timestamp);
if sqlState = '00000';
  exec sql commit;
else;
  exec sql rollback;
endif;
```

</details>

## 16. Build an idempotent data-queue worker with a bounded wait.

**Advanced** · Data queue worker

<details>
<summary>Explain the answer</summary>

Receive an entry with a timeout, validate its operation identifier, and check a durable processed table before applying the business change. Commit the change and the processed marker together, then acknowledge or remove the entry according to the queue API you chose. A duplicate delivery must become a safe no-op.

Define what happens on timeout, malformed data, a locked row, and a poison message. Add retry counting and operator visibility; an infinite receive-and-retry loop can hide a production incident.

**Fixed-format RPG**

```rpgle
D qData           S            256A
C                   CALL      'QRCVDTAQ'
C                   IF        waitSeconds = 0
C                   EXSR      NoWork
C                   ELSE
C                   EXSR      ProcessQueueEntry
C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-s qData varchar(256);
// receive with a bounded wait; return normally when the queue is empty
if not alreadyProcessed(operationId);
  // apply business change and processed marker in one transaction
endif;
// send a diagnostic and quarantine after the retry limit
```

</details>

## 17. Write a parameterized CLLE wrapper that calls two programs and preserves failures.

**Intermediate** · CL parameters and MONMSG

<details>
<summary>Explain the answer</summary>

Declare and validate the input parameter, set the intended library list, call the programs in order, and monitor the specific escape messages that can be recovered. For an unexpected escape, send a diagnostic with the run ID and re-send an escape so the submitted job is marked failed.

Keep MONMSG close to the command whose failure it handles. A procedure-level catch-all can clean up, but it should not turn a failed business step into a successful return code.

**Fixed-format RPG**

```rpgle
PGM PARM(&RUNID)
DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
CHGLIBL LIBL(QGPL QTEMP APPDATA)
CALL PGM(APPDATA/LOAD) PARM(&RUNID)
MONMSG MSGID(CPF0000) EXEC(GOTO ERROR)
CALL PGM(APPDATA/POST) PARM(&RUNID)
RETURN
ERROR: SNDPGMMSG MSG('Run failed') MSGTYPE(*ESCAPE)
ENDPGM
```

**Fully free RPG**

```rpgle
/* CLLE source uses commands rather than RPG fixed/free columns. */
PGM PARM(&RUNID)
  DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
  CHGLIBL LIBL(QGPL QTEMP APPDATA)
  CALL PGM(APPDATA/LOAD) PARM(&RUNID)
  MONMSG MSGID(CPF0000) EXEC(GOTO CMDLBL(ERROR))
  CALL PGM(APPDATA/POST) PARM(&RUNID)
  RETURN
ERROR:
  SNDPGMMSG MSG('Run failed; inspect the job log.') MSGTYPE(*ESCAPE)
ENDPGM
```

</details>

## 18. Process a selected input member with OVRDBF and remove the override safely.

**Intermediate** · OVRDBF and cleanup

<details>
<summary>Explain the answer</summary>

Validate the member name against an allowed set, issue OVRDBF before the called program opens the file, call the processor, and remove the override in both success and error paths. Explain the call-level scope and why a leftover override can change a later program’s data unexpectedly.

Check that the overriding file has a compatible record format and that authority allows the operation. Keep LVLCHK(*NO) out of a shortcut solution unless you can prove the formats are compatible and have a controlled migration reason.

**Fixed-format RPG**

```rpgle
PGM PARM(&MBR)
DCL VAR(&MBR) TYPE(*CHAR) LEN(10)
OVRDBF FILE(INPUT) TOFILE(APPDATA/INBOUND) MBR(&MBR)
MONMSG MSGID(CPF0000) EXEC(GOTO ERROR)
CALL PGM(APPDATA/PROCESSIN)
DLTOVR FILE(INPUT)
RETURN
ERROR:
DLTOVR FILE(INPUT)
SNDPGMMSG MSG('Input member failed') MSGTYPE(*ESCAPE)
ENDPGM
```

**Fully free RPG**

```rpgle
/* CLLE command-oriented wrapper; cleanup is explicit. */
PGM PARM(&MBR)
  DCL VAR(&MBR) TYPE(*CHAR) LEN(10)
  OVRDBF FILE(INPUT) TOFILE(APPDATA/INBOUND) MBR(&MBR)
  MONMSG MSGID(CPF0000) EXEC(GOTO CMDLBL(ERROR))
  CALL PGM(APPDATA/PROCESSIN)
  DLTOVR FILE(INPUT)
  RETURN
ERROR:
  DLTOVR FILE(INPUT)
  SNDPGMMSG MSG('Input member failed') MSGTYPE(*ESCAPE)
ENDPGM
```

</details>

## 19. Submit a batch job with an explicit job queue and run identifier.

**Intermediate** · SBMJOB and batch context

<details>
<summary>Explain the answer</summary>

Pass the run identifier as request data or a parameter, qualify the command and job queue, and choose the job description and user profile deliberately. Explain which authority the submitter and submitted job need. The caller should record the returned job identity or a correlation key so an operator can find the job later.

Test the difference between a command that works interactively and one that fails in batch because of a library list, authority, commitment scope, or missing environment variable. Use the job log as the source of truth.

**Fixed-format RPG**

```rpgle
PGM PARM(&RUNID)
DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
SBMJOB CMD(CALL PGM(APPDATA/NIGHTLY) PARM(&RUNID)) +
       JOBQ(APPDATA/BATCHQ) JOBD(APPDATA/NIGHTJD)
MONMSG MSGID(CPF0000) EXEC(SNDPGMMSG MSG('Submit failed') MSGTYPE(*ESCAPE))
ENDPGM
```

**Fully free RPG**

```rpgle
/* CLLE command-oriented submit wrapper. */
PGM PARM(&RUNID)
  DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
  SBMJOB CMD(CALL PGM(APPDATA/NIGHTLY) PARM(&RUNID)) +
         JOBQ(APPDATA/BATCHQ) JOBD(APPDATA/NIGHTJD)
  MONMSG MSGID(CPF0000) EXEC(SNDPGMMSG MSG('Submit failed') MSGTYPE(*ESCAPE))
ENDPGM
```

</details>

## 20. Make a CL deployment step safe to run twice when creating a data queue.

**Advanced** · CL deployment idempotency

<details>
<summary>Explain the answer</summary>

Check for the object or attempt the create command with a narrow expected-object-exists handler. Verify the existing object’s attributes before deciding it is compatible; silently reusing a queue with the wrong length or type is unsafe. If the object is incompatible, stop with an operator-facing escape message.

Idempotent deployment means a second run reaches the same declared state without destroying live data. Never delete a production queue just to make a create command pass unless the runbook explicitly proves that data loss is acceptable.

**Fixed-format RPG**

```rpgle
PGM
CRTDTAQ DTAQ(APPDATA/ORDERQ) TYPE(*STD) MAXLEN(256)
MONMSG MSGID(CPF2105) EXEC(GOTO EXISTS)
RETURN
EXISTS:
DSPDTAQ DTAQ(APPDATA/ORDERQ)
SNDPGMMSG MSG('Verify ORDERQ attributes before reuse') MSGTYPE(*INFO)
ENDPGM
```

**Fully free RPG**

```rpgle
/* CLLE command-oriented idempotent deployment. */
PGM
  CRTDTAQ DTAQ(APPDATA/ORDERQ) TYPE(*STD) MAXLEN(256)
  MONMSG MSGID(CPF2105) EXEC(GOTO CMDLBL(EXISTS))
  RETURN
EXISTS:
  DSPDTAQ DTAQ(APPDATA/ORDERQ)
  SNDPGMMSG MSG('Verify ORDERQ attributes before reuse') MSGTYPE(*INFO)
ENDPGM
```

</details>

## 21. Read an IFS input file, validate its size, and hand it to a batch program.

**Advanced** · IFS ingestion

<details>
<summary>Explain the answer</summary>

Validate the path against an approved directory, inspect the stream-file attributes, and copy or stage the file into a controlled library object before processing. Do not pass an arbitrary path into a privileged command. Record the source path, checksum or file identity, and run ID for reconciliation.

The safe design separates transport concerns from business parsing. A rejected file should remain available for operator review, while a successfully staged file should be processed exactly once or be safe to replay.

**Fixed-format RPG**

```rpgle
PGM PARM(&PATH)
DCL VAR(&PATH) TYPE(*CHAR) LEN(256)
/* Validate approved prefix before using IFS commands. */
CPYFRMIMPF FROMSTMF(&PATH) TOFILE(APPDATA/INBOUND) MBROPT(*REPLACE)
MONMSG MSGID(CPF0000) EXEC(SNDPGMMSG MSG('Stage failed') MSGTYPE(*ESCAPE))
SBMJOB CMD(CALL PGM(APPDATA/PROCESSIN)) JOBQ(APPDATA/BATCHQ)
ENDPGM
```

**Fully free RPG**

```rpgle
/* CLLE command-oriented IFS staging wrapper. */
PGM PARM(&PATH)
  DCL VAR(&PATH) TYPE(*CHAR) LEN(256)
  /* Validate the approved directory before CPYFRMIMPF. */
  CPYFRMIMPF FROMSTMF(&PATH) TOFILE(APPDATA/INBOUND) MBROPT(*REPLACE)
  MONMSG MSGID(CPF0000) EXEC(SNDPGMMSG MSG('Stage failed') MSGTYPE(*ESCAPE))
  SBMJOB CMD(CALL PGM(APPDATA/PROCESSIN)) JOBQ(APPDATA/BATCHQ)
ENDPGM
```

</details>

## 22. Return a useful diagnostic when a nightly job cannot resolve its program.

**Advanced** · Job-log diagnostics

<details>
<summary>Explain the answer</summary>

Capture the run ID and compare the batch job’s library list with the interactive job. Inspect the job log for the first escape and diagnostic messages, then qualify the called program or correct the job description. Send one actionable diagnostic and preserve the original message instead of replacing it with a generic failure.

A good fix also adds a preflight check and a monitoring signal so the same configuration drift is found before the business window. Do not grant broad authority as a substitute for resolving the correct object.

**Fixed-format RPG**

```rpgle
PGM PARM(&RUNID)
DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
CALL PGM(APPDATA/NIGHTLY)
MONMSG MSGID(CPF0001) EXEC(DO)
  SNDPGMMSG MSG('Program resolution failed for run ' *CAT &RUNID) MSGTYPE(*DIAG)
  RCVMSG MSGTYPE(*EXCP)
ENDDO
ENDPGM
```

**Fully free RPG**

```rpgle
/* CLLE command-oriented diagnostic wrapper. */
PGM PARM(&RUNID)
  DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
  CALL PGM(APPDATA/NIGHTLY)
  MONMSG MSGID(CPF0001) EXEC(DO)
    SNDPGMMSG MSG('Program resolution failed; inspect the job log') MSGTYPE(*DIAG)
    RCVMSG MSGTYPE(*EXCP)
  ENDDO
ENDPGM
```

</details>

## 23. Expose one RPG procedure as a stable API boundary for an integration caller.

**Advanced** · API boundary

<details>
<summary>Explain the answer</summary>

Define a procedure interface that accepts a validated request data structure and returns a response structure with a status, message, and correlation ID. Keep JSON or transport parsing outside the business procedure when possible. Reject unknown or unsafe fields, enforce authority at the boundary, and make duplicate requests safe with an operation identifier.

Document the contract version and failure codes. If the procedure is exported from a service program, add new exports for incompatible changes rather than changing the meaning of an existing parameter.

**Fixed-format RPG**

```rpgle
D processRequest   PR                  LIKEDS(Response_t)
D   request                       LIKEDS(Request_t) CONST
P processRequest   B                   EXPORT
D                 PI                  LIKEDS(Response_t)
D   request                       LIKEDS(Request_t) CONST
C                   EXSR      Validate
C                   EXSR      ApplyBusinessChange
P processRequest   E
```

**Fully free RPG**

```rpgle
**FREE
dcl-ds Request_t qualified template;
  operationId char(40);
  customerId packed(9:0);
end-ds;
dcl-ds Response_t qualified template;
  code int(10);
  message varchar(256);
end-ds;
dcl-proc processRequest export;
  dcl-pi *n likeds(Response_t);
    request likeds(Request_t) const;
  end-pi;
  // validate, authorize, apply idempotently, and return a response
end-proc;
```

</details>

## 24. Reduce a slow order lookup without guessing at an index.

**Advanced** · Performance measurement

<details>
<summary>Explain the answer</summary>

Capture the exact SQL or native I/O statement, input distribution, response time, rows examined, and concurrent workload. Inspect the query access plan or keyed access path, then change one predicate, index, or fetch pattern at a time. Re-run with the same representative inputs and compare CPU, I/O, lock wait, and write overhead.

Do not optimize only the happy path. A covering index can speed reads while increasing insert cost, and a larger page can reduce round trips while increasing memory. Record the decision and a rollback threshold.

**Fixed-format RPG**

```rpgle
C/EXEC SQL
C+ SELECT ORDER_ID, AMOUNT INTO :orderId, :amount
C+   FROM APPDATA/ORDERS
C+  WHERE CUSTOMER_ID = :customerId
C+    AND STATUS = 'OPEN'
C/END-EXEC
C                   EXSR      RecordTiming
```

**Fully free RPG**

```rpgle
**FREE
// Measure before changing the access path.
exec sql
  select order_id, amount into :orderId, :amount
    from appdata.orders
   where customer_id = :customerId
     and status = 'OPEN';
// compare plan, elapsed time, I/O, and lock wait after one change
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

### 6. Which RPG structure handles a selected file-operation error?

A. MONITOR with ON-ERROR
B. SETLL without a key
C. EXCEPT only
D. A second CHAIN

### 7. Which operation retrieves a changed subfile record?

A. READC
B. READE
C. READP
D. WRITE

### 8. Which SQLSTATE normally means no more cursor rows?

A. 00000
B. 02000
C. 23505
D. 08001

### 9. When should a processed-operation marker be committed?

A. Before the business change
B. With the successful business change
C. Only when the job ends
D. After deleting the source row first

### 10. Which CL command removes a file override?

A. DLTOVR
B. OVRDBF
C. DSPFD
D. RLSJOB

### 11. What protects a compatible service-program interface?

A. A binder signature and export list
B. The library-list order alone
C. A display-file format
D. The job queue name

### 12. Which command submits work to run later as batch?

A. SBMJOB
B. STRDBG
C. DSPLIBL
D. CHGPF

<details>
<summary>Answer key and explanations</summary>

1. **A — chain** CHAIN retrieves a record by key and sets the found status used by the following condition.

2. **B — SETLL** SETLL positions the access path; a subsequent read retrieves a record.

3. **B — orderCustomer = customerId** The key comparison keeps processing within the requested equal-key group.

4. **A — The business change succeeds** Marking after the business effect succeeds supports restartability and recovery reasoning.

5. **B — A declaration beginning with **FREE** **FREE enables fully free RPG source; fixed-format columns are no longer required.

6. **A — MONITOR with ON-ERROR** MONITOR and ON-ERROR let the program separate expected operation errors from normal not-found or end-of-file status.

7. **A — READC** READC reads the next changed record from a subfile so the program can validate and update only user edits.

8. **B — 02000** SQLSTATE 02000 is the no-data condition used to end a normal cursor fetch loop; other states represent success or errors.

9. **B — With the successful business change** Committing the marker with the business effect makes a retry either a safe no-op or a complete operation.

10. **A — DLTOVR** DLTOVR removes an override in the applicable call level; leaving an override active can change a later file operation.

11. **A — A binder signature and export list** Binder signatures and ordered exports let a service program evolve while supported callers continue to resolve their contract.

12. **A — SBMJOB** SBMJOB places a job on a job queue for later processing and can pass the command and run context to the submitted job.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM Docs: RPG IV Reference](https://www.ibm.com/docs/en/i/7.4.0?topic=languages-rpg-iv)
- [IBM Docs: RPG built-in functions](https://www.ibm.com/docs/en/i/7.4.0?topic=functions-built-in)
- [IBM Docs: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM Docs: RPG procedures and prototypes](https://www.ibm.com/docs/en/i/7.5.0?topic=parameters-prototypes)
- [IBM Docs: Embedded SQL programming](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)
- [IBM Docs: CL programming](https://www.ibm.com/docs/en/i/7.5.0?topic=language-control-language)
- [IBM Docs: Monitor Message (MONMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fmonmsg.html)
- [IBM Docs: Submit Job (SBMJOB)](https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75%2Fcl%2Fsbmjob.html)
- [IBM Docs: Override with Database File (OVRDBF)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fovrdbf.html)
- [IBM Docs: Data queues](https://www.ibm.com/docs/en/i/7.4.0?topic=apis-data-queues)

[← Previous](tricky-questions.md) · 
