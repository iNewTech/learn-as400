# Coding lab: RPGLE and CL from fixed to free form

[Question index](README.md) · Hands-on coding · Intermediate

A production-minded coding lab with RPGLE and CL exercises for file I/O, SQL, subfiles, ILE, queues, batch jobs, recovery, and integration. RPG tasks show the same intent in fixed-format and fully free source.

Use the website workspace to write a draft, switch between RPGLE formats, save locally, download source, and run a basic structure check. The editor does not compile IBM i languages; use the requirements and test cases on an IBM i development partition before treating a solution as valid.

## 1. Read a keyed customer and print a greeting when it exists.

**Easy** · CHAIN and %FOUND

<details>
<summary>Explain the answer</summary>

Clear the output and save the requested key separately from the record fields. CHAIN retrieves the customer; only a successful %FOUND allows the returned name to be used. A missing key must never reuse the previous customer's name. Both versions trim the name and produce the same greeting.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed.

**Task and setup**

- Provide an input-only keyed Customers file with CustomerRec containing customerId packed(9:0) and name char(40); declare requestedId with exactly the key type.
- Declare greeting varchar(80) and found ind; use greeting and found as output, and display greeting only when found is on.
- Provide a caller-level I/O exception path; missing keys are normal results, while open/authority failures are exceptions.

**Test cases**

1. Existing requestedId and padded name Alice: found is on and greeting is Hello Alice without trailing padding.
2. Missing requestedId immediately after a successful call: found is off and greeting is blank; the old name is not used.
3. Customers cannot be opened because authority is missing: The I/O exception reaches the caller error path; no successful greeting is reported.

**Fixed-format RPG**

```rpgle
     C                   EVAL      greeting = ''
     C                   EVAL      found = *off
     C     requestedId   CHAIN     CustomerRec
     C                   IF        %found(Customers)
     C                   EVAL      found = *on
     C                   EVAL      greeting = 'Hello ' + %trim(name)
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
greeting = '';
found = *off;
chain requestedId CustomerRec;
if %found(Customers);
  found = *on;
  greeting = 'Hello ' + %trim(name);
endif;
```

</details>

## 2. Sum all order lines for one customer with SETLL and READE.

**Easy** · SETLL and READE

<details>
<summary>Explain the answer</summary>

Initialize total, position with SETLL and perform the first READE before entering a pre-tested DOW loop. READE sets %EOF when the next key does not match, so a separate comparison against a possibly stale record field is unnecessary. Use a saved input key and input-only access; this scan does not provide a transactionally consistent snapshot.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed.

**Task and setup**

- Provide input-only keyed Orders with customerId as the leading key and amount packed(11:2); requestedId must match the leading key type.
- Declare total packed(15:2) and reset it on every invocation; define the business policy for accumulator overflow.
- For a composite key, the single search argument is the leading customer key only; state the isolation needed if another job changes the records.

**Test cases**

1. Three matching amounts 10.25, 20.00 and -5.00: total is 25.25; no other customer is included.
2. No matching records with total previously nonzero: The loop executes zero times and total is 0.
3. Matching customer is followed by a different key: READE sets EOF at the boundary; the nonmatching record is not processed.

**Fixed-format RPG**

```rpgle
     C                   EVAL      total = 0
     C     requestedId   SETLL     Orders
     C     requestedId   READE     Orders
     C                   DOW       not %eof(Orders)
     C                   EVAL      total = total + amount
     C     requestedId   READE     Orders
     C                   ENDDO
```

**Fully free RPG**

```rpgle
**FREE
total = 0;
setll requestedId Orders;
reade requestedId Orders;
dow not %eof(Orders);
  total = total + amount;
  reade requestedId Orders;
enddo;
```

</details>

## 3. Update a product only when the row is found and the quantity is valid.

**Intermediate** · Safe UPDATE

<details>
<summary>Explain the answer</summary>

Reject a negative quantity before acquiring a record lock. CHAIN against an update file must succeed before UPDATE can run. Return separate INVALID, MISSING and UPDATED results; I/O exceptions propagate to the enclosing error handler. Reading for update without the N extender holds the record for this short change.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed. This example assumes native I/O outside commitment control; a transaction can retain locks until commit or rollback.

**Task and setup**

- Provide update-capable keyed Products with ProductRec; requestedId matches its product key and quantity/newQty share the agreed numeric type.
- Declare result char(10); provide an enclosing handler that captures lock timeout and update failures and does not report UPDATED.
- No code may read another Products record between this CHAIN and UPDATE. If a later validation rejects an already-read record, explicitly release it or end its transaction.

**Test cases**

1. Existing product and newQty=12: One record changes to 12 and result is UPDATED.
2. Negative quantity for an existing key: result is INVALID and no CHAIN or UPDATE occurs.
3. Missing key, or a lock timeout from another job: A missing key returns MISSING; a timeout takes the I/O error path and never updates.

**Fixed-format RPG**

```rpgle
     C                   EVAL      result = 'INVALID'
     C                   IF        newQty >= 0
     C                   EVAL      result = 'MISSING'
     C     requestedId   CHAIN     ProductRec
     C                   IF        %found(Products)
     C                   EVAL      quantity = newQty
     C                   UPDATE    ProductRec
     C                   EVAL      result = 'UPDATED'
     C                   ENDIF
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
result = 'INVALID';
if newQty >= 0;
  result = 'MISSING';
  chain requestedId ProductRec;
  if %found(Products);
    quantity = newQty;
    update ProductRec;
    result = 'UPDATED';
  endif;
endif;
```

</details>

## 4. Write a restartable batch loop that marks imported rows after successful processing.

**Advanced** · Restartable batch

<details>
<summary>Explain the answer</summary>

Use a pre-tested scan so an empty import file cannot process stale fields. Pass each pending row's stable identifier to a separate transaction-owning routine. That routine must re-read and lock the durable row, detect already-completed operations, apply the business change and mark the source processed in the same transaction.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed. The shown loop is dispatch only; it does not itself implement restartability or exactly-once effects.

**Task and setup**

- Provide input-only keyed Import ordered by immutable importId, with status char(1) and P meaning pending.
- Implement ProcessOne as a subroutine that copies the current importId and calls a separate transaction-capable worker; it must not change this scan cursor.
- The worker requires journaled tables, a unique operation-id constraint, atomic business/status commit, rollback, bounded retries and reconciliation for uncertain commits.

**Test cases**

1. Empty Import file: No call to ProcessOne occurs.
2. Pending and already-processed rows interleaved: Only pending identifiers are dispatched; the worker rechecks their durable status.
3. Crash during processing, then restart: A committed operation becomes a no-op; an uncommitted operation is rolled back and eligible for retry. Verify this on a host after implementing the worker.

**Fixed-format RPG**

```rpgle
     C                   READ      ImportRec
     C                   DOW       not %eof(Import)
     C                   IF        status = 'P'
     C                   EXSR      ProcessOne
     C                   ENDIF
     C                   READ      ImportRec
     C                   ENDDO
```

**Fully free RPG**

```rpgle
**FREE
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

Enforce uniqueness in the database and attempt WRITE directly after validation. A CHAIN-then-WRITE precheck cannot prevent another job inserting the same key. Initialize every output field and use WRITE(E); distinguish duplicate-key status 1021 from other I/O failures before calling another operation that can replace the status.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed.

**Task and setup**

- Provide an output-capable Orders file (fixed F specification with add capability, or free usage(*output)) and a unique access path/constraint on orderId.
- OrderRec must contain the four shown fields: orderId, customerId, amount and status. If the actual format has more fields, populate them deliberately too. Keep request fields separate from record fields.
- Declare fileStatus int(10), result char(12); require validated requestedId/requestedCustomer/requestedAmount before entry. A surrounding boundary handles open errors and commitment ownership.

**Test cases**

1. Valid new key: A complete NEW record is written and result is CREATED.
2. Existing key, including a concurrent insert race: The database rejects the write; fileStatus 1021 returns DUPLICATE without a second row.
3. Write fails for a reason other than duplicate key: result is IO_ERROR and the captured status is available to the caller; success is not reported.

**Fixed-format RPG**

```rpgle
     C                   EVAL      orderId = requestedId
     C                   EVAL      customerId = requestedCustomer
     C                   EVAL      amount = requestedAmount
     C                   EVAL      status = 'NEW'
     C                   EVAL      fileStatus = 0
     C                   WRITE(E)  OrderRec
     C                   IF        %error
     C                   EVAL      fileStatus = %status(Orders)
     C                   IF        fileStatus = 1021
     C                   EVAL      result = 'DUPLICATE'
     C                   ELSE
     C                   EVAL      result = 'IO_ERROR'
     C                   ENDIF
     C                   ELSE
     C                   EVAL      result = 'CREATED'
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
orderId = requestedId;
customerId = requestedCustomer;
amount = requestedAmount;
status = 'NEW';
fileStatus = 0;
write(e) OrderRec;
if %error;
  fileStatus = %status(Orders);
  if fileStatus = 1021;
    result = 'DUPLICATE';
  else;
    result = 'IO_ERROR';
  endif;
else;
  result = 'CREATED';
endif;
```

</details>

## 6. Handle a record-lock or conversion error without losing the job context.

**Intermediate** · MONITOR and file errors

<details>
<summary>Explain the answer</summary>

Record-lock timeout is RPG status 1218; 1211 means an operation was attempted on a closed file. Keep CHAIN and UPDATE inside the same MONITOR, and update only when %FOUND is true. Conversion errors belong in a separate validation block; they should not be mislabeled as file locks.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed. This example assumes the requested quantity was validated before entry. A failure result ends this business action; callers must clean up or roll back as appropriate.

**Task and setup**

- Provide update-capable keyed Orders and OrderRec with quantity; requestedId and newQty match their declared types.
- Declare result char(12) and fileStatus int(10); keep request values separate from fields populated by CHAIN.
- Set a suitable WAITRCD on the file/override. Do not blindly retry an UPDATE after an uncertain outcome; capture job, file, key and status in the outer diagnostic boundary.

**Test cases**

1. Existing unlocked key: The quantity is updated and result is UPDATED.
2. Missing key after a prior successful CHAIN: result is MISSING and UPDATE does not execute.
3. Another job retains the row beyond WAITRCD: ON-ERROR 1218 returns LOCKED; other I/O exceptions return IO_ERROR and their status.

**Fixed-format RPG**

```rpgle
     C                   EVAL      fileStatus = 0
     C                   EVAL      result = 'MISSING'
     C                   MONITOR
     C     requestedId   CHAIN     OrderRec
     C                   IF        %found(Orders)
     C                   EVAL      quantity = newQty
     C                   UPDATE    OrderRec
     C                   EVAL      result = 'UPDATED'
     C                   ENDIF
     C                   ON-ERROR  1218
     C                   EVAL      fileStatus = %status(Orders)
     C                   EVAL      result = 'LOCKED'
     C                   ON-ERROR
     C                   EVAL      fileStatus = %status(Orders)
     C                   EVAL      result = 'IO_ERROR'
     C                   ENDMON
```

**Fully free RPG**

```rpgle
**FREE
fileStatus = 0;
result = 'MISSING';
monitor;
  chain requestedId OrderRec;
  if %found(Orders);
    quantity = newQty;
    update OrderRec;
    result = 'UPDATED';
  endif;
on-error 1218;
  fileStatus = %status(Orders);
  result = 'LOCKED';
on-error;
  fileStatus = %status(Orders);
  result = 'IO_ERROR';
endmon;
```

</details>

## 7. Parse one delimited import line into a qualified data structure.

**Intermediate** · Data structures and parsing

<details>
<summary>Explain the answer</summary>

Parse the same deliberately restricted format in both versions: exactly two unsigned digit fields separated by one comma, with optional surrounding blanks and no CSV quoting. Locate the delimiter, reject absent/extra delimiters and empty fields, check length and digits, then convert into the qualified structure. Do not confuse fixed-position substrings with delimited parsing.

The declarations and calculations below are a parser fragment. Add a containing procedure that supplies rawLine and returns ok/importRow. The parser does not accept quoted CSV, signs, decimal points or other delimiters; no host compilation has been performed.

**Task and setup**

- Supply rawLine varchar(256), containing exactly order-id,customer-id; each trimmed token is 1 through 9 digits, and valid IDs must be greater than zero.
- The caller must use importRow only when ok is on; rejected rows are cleared and rawLine is preserved for a rejection record.
- Define the input CCSID and reject transport truncation before calling this parser. Use a real CSV parser if quoted delimiters are required.

**Test cases**

1.  123 , 456 : ok is on; importRow.orderId is 123 and customerId is 456.
2. 123, or 123,456,789: ok is off and importRow stays cleared.
3. ABC,456 or 1234567890,456 or 0,456: ok is off because tokens violate the documented numeric contract.

**Fixed-format RPG**

```rpgle
     DrawLine          S            256A   VARYING
     DleftText         S            256A   VARYING
     DrightText        S            256A   VARYING
     Dcut              S             10I 0
     Dok               S               N
     DimportRow        DS                  QUALIFIED
     DorderId                         9P 0
     DcustomerId                      9P 0
     C                   CLEAR     importRow
     C                   EVAL      ok = *off
     C                   EVAL      cut = %scan(',': rawLine)
     C                   IF        cut > 1 and cut < %len(rawLine)
     C                   IF        %scan(',': rawLine: cut + 1) = 0
     C                   EVAL      leftText = %trim(%subst(rawLine: 1: cut - 1))
     C                   EVAL      rightText = %trim(%subst(rawLine: cut + 1))
     C                   IF        %len(leftText) > 0 and %len(leftText) <= 9
     C                   IF        %len(rightText) > 0 and %len(rightText) <= 9
     C                   IF        %check('0123456789': leftText) = 0
     C                   IF        %check('0123456789': rightText) = 0
     C                   EVAL      importRow.orderId = %dec(leftText: 9: 0)
     C                   EVAL      importRow.customerId = %dec(rightText: 9: 0)
     C                   EVAL      ok = importRow.orderId > 0 and
     C                             importRow.customerId > 0
     C                   ENDIF
     C                   ENDIF
     C                   ENDIF
     C                   ENDIF
     C                   ENDIF
     C                   ENDIF
     C                   IF        not ok
     C                   CLEAR     importRow
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-s rawLine varchar(256);
dcl-s leftText varchar(256);
dcl-s rightText varchar(256);
dcl-s cut int(10);
dcl-s ok ind;
dcl-ds importRow qualified;
  orderId packed(9:0);
  customerId packed(9:0);
end-ds;
clear importRow;
ok = *off;
cut = %scan(',': rawLine);
if cut > 1 and cut < %len(rawLine);
  if %scan(',': rawLine: cut + 1) = 0;
    leftText = %trim(%subst(rawLine: 1: cut - 1));
    rightText = %trim(%subst(rawLine: cut + 1));
    if %len(leftText) > 0 and %len(leftText) <= 9;
      if %len(rightText) > 0 and %len(rightText) <= 9;
        if %check('0123456789': leftText) = 0;
          if %check('0123456789': rightText) = 0;
            importRow.orderId = %dec(leftText: 9: 0);
            importRow.customerId = %dec(rightText: 9: 0);
            ok = importRow.orderId > 0 and importRow.customerId > 0;
          endif;
        endif;
      endif;
    endif;
  endif;
endif;
if not ok;
  clear importRow;
endif;
```

</details>

## 8. Validate a date, amount, and required text before posting a transaction.

**Intermediate** · Validation and built-ins

<details>
<summary>Explain the answer</summary>

Validate all three advertised inputs in both versions: required trimmed text, an ISO date and a nonnegative decimal amount. Isolate each conversion in its own MONITOR, retain the original text and expose a field-specific error. Callers must not post when errorText is nonblank or use partially converted values.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed. %DEC conversion is not a complete wire-format validator; this exercise assumes inputAmount has already been checked against the agreed decimal grammar and maximum scale of two.

**Task and setup**

- Declare inputName/name varchar(80), inputDate char(10), postingDate date, inputAmount varchar(32), amount packed(11:2), errorText varchar(80).
- Require inputDate YYYY-MM-DD, an amount with at most two fractional digits and no grouping separators, and the agreed currency; reject overlong input before assigning it.
- Perform no database work in this fragment. The first field error wins; a containing routine returns it to the caller.

**Test cases**

1. Name Alice, 2024-02-29 and 12.34: errorText is blank; the date and amount are converted.
2. Blank name or impossible date 2025-02-29: The matching field error is returned and posting is prohibited.
3. Nonnumeric amount or a negative amount: The amount conversion/range error is returned; no transaction is posted.

**Fixed-format RPG**

```rpgle
     C                   EVAL      errorText = ''
     C                   EVAL      name = %trim(inputName)
     C                   IF        name = ''
     C                   EVAL      errorText = 'name is required'
     C                   ENDIF
     C                   IF        errorText = ''
     C                   MONITOR
     C                   EVAL      postingDate = %date(inputDate: *iso)
     C                   ON-ERROR
     C                   EVAL      errorText = 'date must be valid ISO'
     C                   ENDMON
     C                   ENDIF
     C                   IF        errorText = ''
     C                   MONITOR
     C                   EVAL      amount = %dec(inputAmount: 11: 2)
     C                   ON-ERROR
     C                   EVAL      errorText = 'amount is invalid'
     C                   ENDMON
     C                   IF        errorText = '' and amount < 0
     C                   EVAL      errorText = 'amount cannot be negative'
     C                   ENDIF
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
errorText = '';
name = %trim(inputName);
if name = '';
  errorText = 'name is required';
endif;
if errorText = '';
  monitor;
    postingDate = %date(inputDate: *iso);
  on-error;
    errorText = 'date must be valid ISO';
  endmon;
endif;
if errorText = '';
  monitor;
    amount = %dec(inputAmount: 11: 2);
  on-error;
    errorText = 'amount is invalid';
  endmon;
  if errorText = '' and amount < 0;
    errorText = 'amount cannot be negative';
  endif;
endif;
```

</details>

## 9. Create a procedure that returns a typed result and an error message.

**Intermediate** · Prototypes and procedures

<details>
<summary>Explain the answer</summary>

Use the same contract in the prototype and procedure interface: an indicator return, a read-only packed order ID and a fixed 80-character output message. Clear the message on entry, reject nonpositive IDs and return true only for success. OPTIONS(*VARSIZE) does not make a fixed character parameter equivalent to VARCHAR and is not appropriate for this output contract.

These are module/procedure source fragments. Add H NOMAIN or ctl-opt nomain to build a module without a main procedure, export/bind only if required, and put the shared prototype in the caller copy member. No compilation has been performed.

**Task and setup**

- Use orderId packed(9:0) CONST and errorText char(80) by reference in every caller and interface; provide an indicator result at call sites.
- This example validates only positive ID syntax/range. It does not claim to check database existence, order status or authority.
- For external module use, add EXPORT to the procedure and manage the matching shared prototype and service-program export.

**Test cases**

1. orderId=123 with stale errorText: Return is on and errorText is blank.
2. orderId=0: Return is off and errorText says orderId must be positive.
3. orderId=-1: Return is off; the CONST input remains unchanged.

**Fixed-format RPG**

```rpgle
     DvalidateOrder    PR              N
     DorderId                         9P 0 CONST
     DerrorText                      80A
     PvalidateOrder    B
     D                 PI              N
     DorderId                         9P 0 CONST
     DerrorText                      80A
     C                   EVAL      errorText = ''
     C                   IF        orderId <= 0
     C                   EVAL      errorText = 'orderId must be positive'
     C                   RETURN    *off
     C                   ENDIF
     C                   RETURN    *on
     PvalidateOrder    E
```

**Fully free RPG**

```rpgle
**FREE
dcl-pr validateOrder ind;
  orderId packed(9:0) const;
  errorText char(80);
end-pr;

dcl-proc validateOrder;
  dcl-pi *n ind;
    orderId packed(9:0) const;
    errorText char(80);
  end-pi;
errorText = '';
if orderId <= 0;
  errorText = 'orderId must be positive';
  return *off;
endif;
return *on;
end-proc;
```

</details>

## 10. Call a service-program procedure while preserving a stable interface.

**Advanced** · ILE service-program call

<details>
<summary>Explain the answer</summary>

Capture a returned status with EVAL in fixed-format RPG and assignment in free-format RPG. CALLP ignores a procedure's return value, so testing an unrelated result variable afterward is incorrect. The shared prototype, binder exports and calling convention are part of the interface contract.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed. The postOrder implementation and binder source are not included.

**Task and setup**

- Declare postOrder returning int(10), taking orderId packed(9:0) CONST, in a shared copy member used by both caller and implementation.
- Declare result int(10) and serviceFailed ind; define 0 as success and document all nonzero business outcomes.
- Bind the caller to a service program exporting the compatible entry; preserve export order/signatures for supported callers and add a new export for an incompatible contract.

**Test cases**

1. postOrder returns 0: result is 0 and serviceFailed is off.
2. postOrder returns a documented nonzero conflict: The actual return is preserved and serviceFailed is on.
3. Caller built with a previously supported binder signature: A host compatibility test must resolve the original contract; changing a signature string alone does not prove compatibility.

**Fixed-format RPG**

```rpgle
     C                   EVAL      result = postOrder(orderId)
     C                   EVAL      serviceFailed = result <> 0
```

**Fully free RPG**

```rpgle
**FREE
result = postOrder(orderId);
serviceFailed = result <> 0;
```

</details>

## 11. Load a display-file subfile one page at a time from a keyed access path.

**Intermediate** · Subfile loading

<details>
<summary>Explain the answer</summary>

Clear the subfile and reset its relative record number before loading. For general forward paging, SETGT plus READ continues after the last displayed unique key; READE would restrict the scan to an equal-key group. Increment the subfile relative record number before WRITE, copy row fields and save the last displayed key. The extra read is only a lookahead to compute hasMore.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed. DDS indicators, the display/control record and the mapping helper are required; neither version is a complete screen program.

**Task and setup**

- Provide input-only keyed Orders with unique orderId, and a WORKSTN Display file using SFILE(SflRecord: sflRrn). Declare sflRrn/pageSize as suitable integers and hasMore ind.
- ClearSubfile must toggle DDS SFLCLR via the control format. CopyToScreen maps the current database row to differently named subfile fields; neither helper changes the Orders cursor.
- For a first page set firstPage on; otherwise lastId is the last key actually displayed. Keep filter and ordering unchanged across the page token. A mutable dataset is not a snapshot.

**Test cases**

1. Empty list: sflRrn is 0, no SflRecord is written and hasMore is off.
2. Exactly pageSize rows remain: RRNs 1 through pageSize are written; lookahead finds EOF and hasMore is off.
3. More than pageSize rows remain, followed by next-page request: hasMore is on and lastId is the last displayed key; SETGT resumes without skipping the lookahead row.

**Fixed-format RPG**

```rpgle
     C                   EXSR      ClearSubfile
     C                   EVAL      sflRrn = 0
     C                   IF        firstPage
     C     *loval        SETLL     Orders
     C                   ELSE
     C     lastId        SETGT     Orders
     C                   ENDIF
     C                   READ      Orders
     C                   DOW       not %eof(Orders) and sflRrn < pageSize
     C                   EVAL      sflRrn = sflRrn + 1
     C                   EXSR      CopyToScreen
     C                   WRITE     SflRecord
     C                   EVAL      lastId = orderId
     C                   READ      Orders
     C                   ENDDO
     C                   EVAL      hasMore = not %eof(Orders)
```

**Fully free RPG**

```rpgle
**FREE
exsr ClearSubfile;
sflRrn = 0;
if firstPage;
  setll *loval Orders;
else;
  setgt lastId Orders;
endif;
read Orders;
dow not %eof(Orders) and sflRrn < pageSize;
  sflRrn = sflRrn + 1;
  exsr CopyToScreen;
  write SflRecord;
  lastId = orderId;
  read Orders;
enddo;
hasMore = not %eof(Orders);
```

</details>

## 12. Process only the rows a user changed in a subfile and reject invalid edits.

**Intermediate** · READC and changed rows

<details>
<summary>Explain the answer</summary>

READC must be followed by a pre-tested loop so a screen with no changed rows does no work. For each row, validate the edit and let UpdateOne check the durable key/version. Mark errors in the subfile and rewrite its record with the DDS SFLNXTCHG option enabled when the row must be returned by a later READC; SFLNXTCHG alone does not display an error message.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed.

**Task and setup**

- Provide Display WORKSTN with SflRecord, stable rowKey, rowVersion, editedQty and a separate error field/indicator; numeric declarations match the database.
- UpdateOne must re-read by stable key, authorize and compare version, then return updateOk; it must not disturb this subfile READC position.
- MarkError sets row error fields, enables the DDS SFLNXTCHG conditioning indicator and UPDATEs the current subfile record. The outer display loop controls redisplay.

**Test cases**

1. No changed subfile records: The loop executes zero times.
2. One changed row has editedQty below zero: No database update occurs; that row is marked for correction and redisplay.
3. A valid edit has a stale version: UpdateOne returns updateOk off and MarkError preserves the row for conflict handling.

**Fixed-format RPG**

```rpgle
     C                   READC     SflRecord
     C                   DOW       not %eof(Display)
     C                   IF        editedQty >= 0
     C                   EXSR      UpdateOne
     C                   IF        not updateOk
     C                   EXSR      MarkError
     C                   ENDIF
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
  if editedQty >= 0;
    exsr UpdateOne;
    if not updateOk;
      exsr MarkError;
    endif;
  else;
    exsr MarkError;
  endif;
  readc SflRecord;
enddo;
```

</details>

## 13. Insert an order with embedded SQL and translate SQLSTATE for the caller.

**Intermediate** · Embedded SQL CRUD

<details>
<summary>Explain the answer</summary>

Use the same SQL naming convention and status handling in both source styles. Save SQLSTATE immediately after INSERT, before any later SQL operation replaces it. Translate duplicate key 23505 and missing parent 23503 separately; preserve all other nonzero states, including warnings, for explicit caller handling.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed. SQL examples require the SQL RPG precompiler and matching table definitions. This fragment does not commit.

**Task and setup**

- Compile as SQLRPGLE with NAMING(*SQL); provide APPDATA.ORDERS(order_id,customer_id,amount) with compatible host variables, unique order ID and the intended foreign key.
- Declare savedState char(5) and result char(14). Other mandatory columns must have intentional defaults or be included in INSERT.
- The transaction owner decides commit/rollback and warning policy. Do not infer that every non-00000 SQLSTATE means the INSERT made no change.

**Test cases**

1. Valid unique order and existing parent: savedState is 00000 and result is INSERTED, pending the transaction boundary.
2. Duplicate order ID: savedState 23505 maps to DUPLICATE.
3. Missing referenced customer: savedState 23503 maps to MISSING_PARENT; the caller receives the original state.

**Fixed-format RPG**

```rpgle
     C/EXEC SQL
     C+ insert into appdata.orders
     C+   (order_id, customer_id, amount)
     C+ values (:orderId, :customerId, :amount)
     C/END-EXEC
     C                   EVAL      savedState = SQLSTT
     C                   SELECT
     C                   WHEN      savedState = '00000'
     C                   EVAL      result = 'INSERTED'
     C                   WHEN      savedState = '23505'
     C                   EVAL      result = 'DUPLICATE'
     C                   WHEN      savedState = '23503'
     C                   EVAL      result = 'MISSING_PARENT'
     C                   OTHER
     C                   EVAL      result = 'SQL_CONDITION'
     C                   ENDSL
```

**Fully free RPG**

```rpgle
**FREE
exec sql insert into appdata.orders
    (order_id, customer_id, amount)
  values (:orderId, :customerId, :amount);
savedState = SQLSTT;
select;
when savedState = '00000';
  result = 'INSERTED';
when savedState = '23505';
  result = 'DUPLICATE';
when savedState = '23503';
  result = 'MISSING_PARENT';
other;
  result = 'SQL_CONDITION';
endsl;
```

</details>

## 14. Fetch a large result set in pages without holding unnecessary locks.

**Advanced** · SQL cursor paging

<details>
<summary>Explain the answer</summary>

Open a read-only cursor ordered by a unique key, fetch until the page is full or SQLSTATE 02000, and close it after the loop. Check OPEN and every FETCH before using host variables. Preserve the primary SQL condition when CLOSE also fails. Reopen for the next page using the last successfully returned key.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed. Cursor lifecycle and cleanup are shown for SQL conditions; the containing procedure also needs an exception cleanup path if row-copy code can raise a non-SQL exception.

**Task and setup**

- Use SQLRPGLE NAMING(*SQL), stable non-null unique order_id and non-null amount, compatible host variables, and a read isolation appropriate to changing rows.
- Declare rowCount/pageSize integers with pageSize > 0, lastId/orderId with the key type, cursorOpen/hasMore indicators, savedState/closeState char(5). CopyRow must copy the current row into a bounded caller-provided page without issuing SQL or raising exceptions.
- This version does not fetch a lookahead; a full page means more rows may exist. Continue using lastId; a later empty page is normal. Do not claim snapshot consistency or zero locking from FOR READ ONLY.

**Test cases**

1. No rows after lastId: FETCH returns 02000, rowCount is 0 and C1 is closed.
2. More rows than pageSize: Only pageSize rows are returned, lastId matches the last returned key and hasMore is on as a possibility.
3. OPEN or FETCH fails, or CLOSE fails: No failed-fetch values are copied. The opened cursor gets a close attempt; savedState preserves the original condition or the close failure.

**Fixed-format RPG**

```rpgle
     C/EXEC SQL
     C+ declare C1 cursor for
     C+ select order_id, amount from appdata.orders
     C+ where order_id > :lastId order by order_id
     C+ for read only
     C/END-EXEC
     C                   EVAL      rowCount = 0
     C                   EVAL      hasMore = *off
     C                   EVAL      cursorOpen = *off
     C                   EVAL      savedState = '00000'
     C/EXEC SQL
     C+ open C1
     C/END-EXEC
     C                   EVAL      savedState = SQLSTT
     C                   IF        savedState = '00000'
     C                   EVAL      cursorOpen = *on
     C                   DOW       rowCount < pageSize
     C/EXEC SQL
     C+ fetch C1 into :orderId, :amount
     C/END-EXEC
     C                   EVAL      savedState = SQLSTT
     C                   IF        savedState <> '00000'
     C                   LEAVE
     C                   ENDIF
     C                   EVAL      rowCount = rowCount + 1
     C                   EXSR      CopyRow
     C                   EVAL      lastId = orderId
     C                   ENDDO
     C                   EVAL      hasMore = rowCount = pageSize
     C                   ENDIF
     C                   IF        cursorOpen
     C/EXEC SQL
     C+ close C1
     C/END-EXEC
     C                   EVAL      closeState = SQLSTT
     C                   EVAL      cursorOpen = *off
     C                   IF        savedState = '00000' or savedState = '02000'
     C                   IF        closeState <> '00000'
     C                   EVAL      savedState = closeState
     C                   ENDIF
     C                   ENDIF
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
exec sql declare C1 cursor for
  select order_id, amount from appdata.orders
  where order_id > :lastId order by order_id
  for read only;
rowCount = 0;
hasMore = *off;
cursorOpen = *off;
savedState = '00000';
exec sql open C1;
savedState = SQLSTT;
if savedState = '00000';
  cursorOpen = *on;
  dow rowCount < pageSize;
    exec sql fetch C1 into :orderId, :amount;
    savedState = SQLSTT;
    if savedState <> '00000';
      leave;
    endif;
    rowCount = rowCount + 1;
    exsr CopyRow;
    lastId = orderId;
  enddo;
  hasMore = rowCount = pageSize;
endif;
if cursorOpen;
  exec sql close C1;
  closeState = SQLSTT;
  cursorOpen = *off;
  if savedState = '00000' or savedState = '02000';
    if closeState <> '00000';
      savedState = closeState;
    endif;
  endif;
endif;
```

</details>

## 15. Post an order and its audit row as one transaction.

**Advanced** · Commit and rollback

<details>
<summary>Explain the answer</summary>

Only execute the audit INSERT after the order UPDATE succeeds and changes exactly one eligible row. Save the first SQL condition before the next statement can replace it. COMMIT runs only after both writes succeed; otherwise ROLLBACK runs, and its own status must also be checked. A failed or uncertain COMMIT cannot be reported as success or retried blindly.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed. A dedicated transaction boundary with active commitment control, journaled tables and no unrelated pending work must already exist. SET TRANSACTION alone is not a substitute for this setup.

**Task and setup**

- Use SQLRPGLE NAMING(*SQL) and a non-*NONE commitment level. Provide ORDERS(order_id,status) and ORDER_AUDIT(order_id,posted_at), with order_id unique and OPEN as the eligible state.
- Declare firstState/endState char(5), affected int(10), orderId with matching type and result char(12). This routine owns the complete transaction; do not embed it in a caller transaction that it would accidentally commit.
- Capture failed statement diagnostics before further SQL. On COMMIT_ERROR determine durable outcome by operation ID; on recovery error stop for operator reconciliation. External side effects need a separate durable design.

**Test cases**

1. One OPEN order and valid audit insert: Both records commit and result is COMMITTED.
2. UPDATE fails, matches no eligible row, or audit INSERT fails: Later business steps are skipped as applicable; ROLLBACK is attempted and no success is returned.
3. COMMIT reports failure/connection loss: result is COMMIT_ERROR with endState preserved; reconcile before any retry, even if a rollback is later attempted by recovery code.

**Fixed-format RPG**

```rpgle
     C                   EVAL      firstState = '00000'
     C                   EVAL      affected = 0
     C/EXEC SQL
     C+ update appdata.orders set status = 'POSTED'
     C+ where order_id = :orderId and status = 'OPEN'
     C/END-EXEC
     C                   EVAL      firstState = SQLSTT
     C                   IF        firstState = '00000'
     C/EXEC SQL
     C+ get diagnostics :affected = row_count
     C/END-EXEC
     C                   EVAL      firstState = SQLSTT
     C                   ENDIF
     C                   IF        firstState = '00000' and affected = 1
     C/EXEC SQL
     C+ insert into appdata.order_audit
     C+   (order_id, posted_at)
     C+ values (:orderId, current_timestamp)
     C/END-EXEC
     C                   EVAL      firstState = SQLSTT
     C                   ENDIF
     C                   IF        firstState = '00000' and affected = 1
     C/EXEC SQL
     C+ commit
     C/END-EXEC
     C                   EVAL      endState = SQLSTT
     C                   IF        endState = '00000'
     C                   EVAL      result = 'COMMITTED'
     C                   ELSE
     C                   EVAL      result = 'COMMIT_ERROR'
     C                   ENDIF
     C                   ELSE
     C/EXEC SQL
     C+ rollback
     C/END-EXEC
     C                   EVAL      endState = SQLSTT
     C                   IF        endState = '00000'
     C                   EVAL      result = 'NOT_POSTED'
     C                   ELSE
     C                   EVAL      result = 'RECOVERY_ERR'
     C                   ENDIF
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
firstState = '00000';
affected = 0;
exec sql update appdata.orders set status = 'POSTED'
  where order_id = :orderId and status = 'OPEN';
firstState = SQLSTT;
if firstState = '00000';
  exec sql get diagnostics :affected = row_count;
  firstState = SQLSTT;
endif;
if firstState = '00000' and affected = 1;
  exec sql insert into appdata.order_audit
      (order_id, posted_at)
    values (:orderId, current_timestamp);
  firstState = SQLSTT;
endif;
if firstState = '00000' and affected = 1;
  exec sql commit;
  endState = SQLSTT;
  if endState = '00000';
    result = 'COMMITTED';
  else;
    result = 'COMMIT_ERROR';
  endif;
else;
  exec sql rollback;
  endState = SQLSTT;
  if endState = '00000';
    result = 'NOT_POSTED';
  else;
    result = 'RECOVERY_ERR';
  endif;
endif;
```

</details>

## 16. Build an idempotent data-queue worker with a bounded wait.

**Advanced** · Data queue worker

<details>
<summary>Explain the answer</summary>

QRCVDTAQ requires five parameters: queue name, library, returned data length, data buffer and wait time. Test returned length = 0 for timeout; waitSeconds is an input. The default receive removes the entry immediately. IBM i data queues do not provide a separate acknowledgment that can make dequeue and a database commit atomic.

The two examples perform one bounded destructive receive and dispatch its bytes. They are API fragments, not a reliable-delivery worker. To survive a crash after receive, keep the durable work item in a database/outbox and treat the queue as a wake-up hint, or implement a documented recovery mechanism. A processed-operation table alone prevents duplicate effects but does not recover a lost entry. No host execution has been performed.

**Task and setup**

- Use a standard non-keyed queue APPDATA/ORDERQ with MAXLEN(256). Declare queueName/libraryName char(10), dataLength/waitSeconds packed(5:0), queueData char(256); set waitSeconds to 5.
- Declare ReceiveQueue EXTPGM('QRCVDTAQ') with those five parameters in that order, passed by reference and with exactly those types; the returned length/data are output-capable, not CONST.
- ProcessQueue must consume only %subst(queueData:1:dataLength), validate the operation ID, and use durable work storage plus atomic business/processed-marker commit. The surrounding handler captures API exceptions; poison entries need durable quarantine and bounded retry.

**Test cases**

1. Queue empty for five seconds: dataLength is zero and result is NO_WORK; stale buffer bytes are ignored.
2. One entry of length 40: Exactly those 40 bytes are dispatched; the queue entry has already been removed.
3. Job ends after receive but before business commit: The entry is not automatically redelivered. The durable work/outbox reconciliation path must recover it; the bare snippet cannot.

**Fixed-format RPG**

```rpgle
     C                   EVAL      queueName = 'ORDERQ'
     C                   EVAL      libraryName = 'APPDATA'
     C                   EVAL      waitSeconds = 5
     C                   EVAL      dataLength = 0
     C                   CLEAR     queueData
     C                   CALLP     ReceiveQueue(queueName: libraryName:
     C                             dataLength: queueData: waitSeconds)
     C                   IF        dataLength = 0
     C                   EVAL      result = 'NO_WORK'
     C                   ELSE
     C                   EXSR      ProcessQueue
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
queueName = 'ORDERQ';
libraryName = 'APPDATA';
waitSeconds = 5;
dataLength = 0;
clear queueData;
callp ReceiveQueue(queueName: libraryName: dataLength: queueData: waitSeconds);
if dataLength = 0;
  result = 'NO_WORK';
else;
  exsr ProcessQueue;
endif;
```

</details>

## 17. Write a parameterized CLLE wrapper that calls two programs and preserves failures.

**Intermediate** · CL parameters and MONMSG

<details>
<summary>Explain the answer</summary>

CLLE uses one command syntax, not RPG fixed/free columns. Declare the input, reject a blank run ID and call both qualified programs in order. If LOAD fails, POST must not run. If POST fails, the wrapper must also escape. A catch-all is justified only to add context and preserve a failed return; it is not recovery.

This wrapper adds a CPF9898 escape after leaving the original command messages in the job log. It does not claim to resend the original message identifier or undo a partially completed LOAD. The helper programs and their transaction/restart contracts are prerequisites; no CL compilation has been performed.

**Task and setup**

- LOAD and POST accept exactly one char(20) parameter and send an escape when they fail; APPDATA and program authorities are configured.
- The called programs must qualify their own dependencies or run with an explicitly configured job library list; this example does not change the caller library list.
- Use MSGID(CPF9898) MSGF(QCPFMSG) MSGDTA(...) MSGTYPE(*ESCAPE) for a message-based escape; free-form MSG(...) is not valid for this message type.

**Test cases**

1. Nonblank run ID and both programs succeed: LOAD runs before POST and the wrapper returns normally.
2. LOAD sends an escape: POST does not run; original diagnostics remain and the wrapper sends CPF9898 with the run ID.
3. POST sends an escape or RUNID is blank: The wrapper returns an escape; a blank RUNID causes neither business program to run.

**CLLE source fragment**

```cl
PGM PARM(&RUNID)
  DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
  IF COND(&RUNID *EQ ' ') THEN(DO)
    SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
      MSGDTA('RUNID is required') MSGTYPE(*ESCAPE)
  ENDDO
  CALL PGM(APPDATA/LOAD) PARM(&RUNID)
  MONMSG MSGID(CPF0000 MCH0000) EXEC(GOTO CMDLBL(ERROR))
  CALL PGM(APPDATA/POST) PARM(&RUNID)
  MONMSG MSGID(CPF0000 MCH0000) EXEC(GOTO CMDLBL(ERROR))
  RETURN
ERROR:
  SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
    MSGDTA('Run failed; inspect job log: ' *CAT &RUNID) +
    MSGTYPE(*ESCAPE)
ENDPGM
```

</details>

## 18. Process a selected input member with OVRDBF and remove the override safely.

**Intermediate** · OVRDBF and cleanup

<details>
<summary>Explain the answer</summary>

Install a call-level override before PROCESSIN opens INPUT, then delete that override on both successful and failed calls. Monitor the CALL itself: monitoring only OVRDBF does not catch processing failures. Do not attempt cleanup after an override-creation failure as if the override were known to exist.

This CLLE fragment assumes a dedicated wrapper call level and a known compatible member. It preserves a failed outcome with CPF9898; original and cleanup diagnostics remain in the job log. No host compilation or override-scope test has been performed.

**Task and setup**

- Accept an allowed member in APPDATA/INBOUND; the concrete example permits only DAILY. Add the application-specific allowlist if more members are needed.
- PROCESSIN must open INPUT after the override, honor the selected member and close it before return; the record format must be compatible and authorized.
- OVRSCOPE(*CALLLVL) is explicit and DLTOVR LVL(*) removes this call-level override. Verify called-program activation-group/open behavior in a host integration test.

**Test cases**

1. Allowed existing member and successful processor: The selected member is processed and the call-level override is removed.
2. PROCESSIN fails after override creation: The wrapper attempts DLTOVR and sends an escape, even if cleanup also fails.
3. Disallowed/missing member or OVRDBF failure: The processor is not called; the wrapper returns an escape and does not delete an uncreated override.

**CLLE source fragment**

```cl
PGM PARM(&MBR)
  DCL VAR(&MBR) TYPE(*CHAR) LEN(10)
  IF COND(&MBR *NE 'DAILY') THEN(GOTO CMDLBL(ERROR))
  CHKOBJ OBJ(APPDATA/INBOUND) OBJTYPE(*FILE) MBR(&MBR)
  MONMSG MSGID(CPF0000) EXEC(GOTO CMDLBL(ERROR))
  OVRDBF FILE(INPUT) TOFILE(APPDATA/INBOUND) +
    MBR(&MBR) OVRSCOPE(*CALLLVL)
  MONMSG MSGID(CPF0000) EXEC(GOTO CMDLBL(ERROR))
  CALL PGM(APPDATA/PROCESSIN)
  MONMSG MSGID(CPF0000 MCH0000) EXEC(GOTO CMDLBL(CLEANERR))
  DLTOVR FILE(INPUT) LVL(*)
  MONMSG MSGID(CPF0000) EXEC(GOTO CMDLBL(ERROR))
  RETURN
CLEANERR:
  DLTOVR FILE(INPUT) LVL(*)
  MONMSG MSGID(CPF0000)
ERROR:
  SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
            MSGDTA('Input member failed; inspect the job log') +
            MSGTYPE(*ESCAPE)
ENDPGM
```

</details>

## 19. Submit a batch job with an explicit job queue and run identifier.

**Intermediate** · SBMJOB and batch context

<details>
<summary>Explain the answer</summary>

Submit the qualified batch program with an explicit job queue, job description, execution user policy and initial library list. A successful SBMJOB confirms submission only; it says nothing about whether NIGHTLY later succeeds. Persist the run ID and record the submitted job identity from the completion message or a job-tracking mechanism.

This CLLE fragment validates and submits the request. It does not include durable run tracking, job-completion monitoring or parameter-marshalling tests. No job has been submitted or host compilation performed.

**Task and setup**

- NIGHTLY accepts char(20), and BATCHQ/NIGHTJD exist. USER(*CURRENT) is an intentional choice here; it requires the submitter to be suitable for executing the batch work.
- INLLIBL(*JOBD) chooses the job description library list instead of silently inheriting the interactive one; inspect the actual NIGHTJD contents and authorities.
- Validate and store RUNID before submission; capture the submitted job number/user/name for completion tracking and prevent duplicate submission by the same run ID.

**Test cases**

1. Valid run ID and usable job queue: One job is submitted with the selected context; submission and completion remain separate states.
2. Submission denied or job queue missing: A CPF9898 escape reports failure and the original submission diagnostic remains in the job log.
3. NIGHTLY later fails in batch: The completion monitor marks the run failed; a successful SBMJOB is not treated as successful business processing.

**CLLE source fragment**

```cl
PGM PARM(&RUNID)
  DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
  IF COND(&RUNID *EQ ' ') THEN(GOTO CMDLBL(ERROR))
  SBMJOB CMD(CALL PGM(APPDATA/NIGHTLY) PARM(&RUNID)) +
    JOBQ(APPDATA/BATCHQ) JOBD(APPDATA/NIGHTJD) +
    USER(*CURRENT) INLLIBL(*JOBD)
  MONMSG MSGID(CPF0000) EXEC(GOTO CMDLBL(ERROR))
  RETURN
ERROR:
  SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
    MSGDTA('Run not submitted; inspect job log') MSGTYPE(*ESCAPE)
ENDPGM
```

</details>

## 20. Make a CL deployment step safe to run twice when creating a data queue.

**Advanced** · CL deployment idempotency

<details>
<summary>Explain the answer</summary>

Use CHKOBJ to distinguish an existing queue from CPF9801 object-not-found, then create only when absent. A queue's mere existence does not prove its attributes match the contract. Retrieve and compare the description with QMHQRDQD or QSYS2.DATA_QUEUE_INFO before reuse. DSPDTAQ is not a shipped command for this example.

The CL fragment delegates attribute verification to an application helper CHECKQ, which must escape on mismatch. It is not a complete deployment until that helper is implemented. Deployments are serialized; if another creator wins between CHKOBJ and CRTDTAQ, this run fails safely and can be rerun instead of hiding arbitrary creation failures. No host execution has been performed.

**Task and setup**

- Implement APPDATA/CHECKQ with no parameters for this fixed queue. It must verify standard type, FIFO sequence, maximum entry length 256, SENDERID(*NO) and FORCE(*YES), plus the desired authority policy.
- Use QMHQRDQD with the documented receiver layout/error code or DATA_QUEUE_INFO available at the target release/PTF; CHECKQ is an application program, not an IBM command.
- Do not use CPF2105 as an object-already-exists handler. Preserve entries in an existing queue, stop on incompatible attributes and serialize deployment attempts.

**Test cases**

1. Queue does not exist: CHKOBJ CPF9801 enters creation, then CHECKQ verifies the resulting attributes.
2. Compatible queue exists with entries: No create/delete occurs; CHECKQ passes and existing entries remain.
3. Incompatible queue, missing library, authority failure or create race: The deployment fails with diagnostics; it does not delete or silently reuse incompatible state.

**CLLE source fragment**

```cl
PGM
  CHKOBJ OBJ(APPDATA/ORDERQ) OBJTYPE(*DTAQ)
  MONMSG MSGID(CPF9801) EXEC(GOTO CMDLBL(CREATE))
  GOTO CMDLBL(VERIFY)
CREATE:
  CRTDTAQ DTAQ(APPDATA/ORDERQ) TYPE(*STD) +
    MAXLEN(256) SEQ(*FIFO) SENDERID(*NO) FORCE(*YES)
VERIFY:
  /* Application helper: retrieve and compare queue attributes. */
  CALL PGM(APPDATA/CHECKQ)
ENDPGM
```

</details>

## 21. Read an IFS input file, validate its size, and hand it to a batch program.

**Advanced** · IFS ingestion

<details>
<summary>Explain the answer</summary>

Stage into a run-specific member, validate the path/file through an application helper, and submit the processor with that member and run ID. MBROPT(*ADD) into a newly created member avoids replacing a shared inbound member while another job is processing it. CPYFRMIMPF interprets import data; it is not a raw byte-copy or a complete file-security check.

This is a CLLE orchestration fragment. PREPIFS is a required application helper, not an IBM command: it validates and snapshots the input into a protected staging directory, checks size/identity and returns the stable snapshot path. The receiving programs and file schema are omitted. No IFS file was read and no batch job was submitted.

**Task and setup**

- Inputs are PATH char(256), MBR char(10) and RUNID char(20). PREPIFS accepts those by reference, validates the allowed path/member/run ID, resolves links/races and returns a protected immutable snapshot in PATH.
- INBOUND is a physical file with a schema matching the documented CSV contract. A fresh unique member is required per run; add explicit delimiter/date/CCSID settings as dictated by the real input contract.
- PROCESSMBR accepts MBR char(10), RUNID char(20), opens that member explicitly and uses a durable run ledger. Retain failed staging members for diagnosis; do not automatically delete/reuse them.

**Test cases**

1. Valid approved snapshot and unused member name: A fresh member is loaded and a batch request receives that member and run ID.
2. Oversized/unapproved source or duplicate member: The helper or ADDPFM fails; no processing job is submitted and existing member data is preserved.
3. Import conversion or submission failure: The wrapper escapes, retaining staged evidence; the run ledger makes a later recovery/retry deliberate.

**CLLE source fragment**

```cl
PGM PARM(&PATH &MBR &RUNID)
  DCL VAR(&PATH) TYPE(*CHAR) LEN(256)
  DCL VAR(&MBR) TYPE(*CHAR) LEN(10)
  DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
  CALL PGM(APPDATA/PREPIFS) PARM(&PATH &MBR &RUNID)
  MONMSG MSGID(CPF0000 MCH0000) EXEC(GOTO CMDLBL(ERROR))
  ADDPFM FILE(APPDATA/INBOUND) MBR(&MBR)
  MONMSG MSGID(CPF0000) EXEC(GOTO CMDLBL(ERROR))
  CPYFRMIMPF FROMSTMF(&PATH) TOFILE(APPDATA/INBOUND &MBR) +
    MBROPT(*ADD) RCDDLM(*CRLF) DTAFMT(*DLM)
  MONMSG MSGID(CPF0000) EXEC(GOTO CMDLBL(ERROR))
  SBMJOB CMD(CALL PGM(APPDATA/PROCESSMBR) PARM(&MBR &RUNID)) +
    JOBQ(APPDATA/BATCHQ) JOBD(APPDATA/NIGHTJD) INLLIBL(*JOBD)
  MONMSG MSGID(CPF0000) EXEC(GOTO CMDLBL(ERROR))
  RETURN
ERROR:
  SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
    MSGDTA('Staging/submission failed; inspect run and job log') +
    MSGTYPE(*ESCAPE)
ENDPGM
```

</details>

## 22. Return a useful diagnostic when a nightly job cannot resolve its program.

**Advanced** · Job-log diagnostics

<details>
<summary>Explain the answer</summary>

Preflight the qualified program with CHKOBJ and monitor its documented CPF9801 object-not-found condition. A generic CPF0001 does not establish that program resolution failed. Keep authority failures distinct. A failure from CALL itself must remain a failed return; simply receiving its exception message does not propagate it.

This wrapper reports context using CPF9898 and keeps the original diagnostics in the job log. It does not re-send the original message ID. The full job monitor should store job identity/run ID and inspect the first relevant diagnostic; no program call or host compilation was performed.

**Task and setup**

- NIGHTLY accepts RUNID char(20); preflight with AUT(*USE) and use a qualified APPDATA/NIGHTLY reference.
- Do not treat CHKOBJ as allocation: the object can change between preflight and CALL, so still handle CALL failure.
- Unexpected CHKOBJ conditions such as missing library/authority propagate. The NOTFOUND label is reserved for CHKOBJ CPF9801.

**Test cases**

1. Program is absent in existing APPDATA library: CHKOBJ CPF9801 routes to a specific missing-program escape with the run ID.
2. Program exists but authority is insufficient: The authority diagnostic propagates; it is not mislabeled as missing program.
3. Program disappears after preflight or fails during CALL: The CALL error path escapes with run context, preserving original job-log diagnostics.

**CLLE source fragment**

```cl
PGM PARM(&RUNID)
  DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
  CHKOBJ OBJ(APPDATA/NIGHTLY) OBJTYPE(*PGM) AUT(*USE)
  MONMSG MSGID(CPF9801) EXEC(GOTO CMDLBL(NOTFOUND))
  CALL PGM(APPDATA/NIGHTLY) PARM(&RUNID)
  MONMSG MSGID(CPF0000 MCH0000) EXEC(GOTO CMDLBL(FAILED))
  RETURN
NOTFOUND:
  SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
    MSGDTA('APPDATA/NIGHTLY missing; run ' *CAT &RUNID) +
    MSGTYPE(*ESCAPE)
  RETURN
FAILED:
  SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
    MSGDTA('NIGHTLY call failed; inspect job log; run ' *CAT &RUNID) +
    MSGTYPE(*ESCAPE)
ENDPGM
```

</details>

## 23. Expose one RPG procedure as a stable API boundary for an integration caller.

**Advanced** · API boundary

<details>
<summary>Explain the answer</summary>

A procedure that declares a response structure return must actually return that structure on every normal path. Keep the request/response definitions identical in both versions, copy the correlation identifier and reject invalid requests before calling the business helper. Return the helper's documented result rather than implicitly declaring success.

These are procedure/module fragments for an RPG caller, not a complete HTTP or JSON API. ApplyRequest is an omitted helper that must authorize, deduplicate and atomically apply the business effect. Add NOMAIN/module binding and shared prototypes as appropriate; neither source has been compiled.

**Task and setup**

- Use Request_t with operationId char(40) and customerId packed(9:0); Response_t contains code int(10), message varchar(256), correlationId char(40). Both are qualified templates.
- Implement ApplyRequest(request CONST) returning Response_t. It must authorize the caller, check the durable operation ID and return documented codes after a known transaction outcome; it may not trust caller-supplied authority fields.
- Use a shared prototype for external callers and a versioned exported interface. A non-RPG caller additionally needs an explicit ABI/transport contract; a data-structure return is not automatically language-neutral.

**Test cases**

1. Blank operation ID or nonpositive customer ID: Response code 1 is returned with Invalid request; ApplyRequest is not called.
2. Valid request and successful helper result: The helper response is returned with the original operation ID as correlationId.
3. Duplicate request or denied authority: ApplyRequest returns the documented no-op/denial result; no duplicate or unauthorized effect occurs.

**Fixed-format RPG**

```rpgle
     DRequest_t        DS                  QUALIFIED TEMPLATE
     DoperationId                    40A
     DcustomerId                      9P 0
     DResponse_t       DS                  QUALIFIED TEMPLATE
     Dcode                           10I 0
     Dmessage                       256A   VARYING
     DcorrelationId                  40A
     DprocessRequest   PR                  LIKEDS(Response_t)
     Drequest                              LIKEDS(Request_t) CONST
     DApplyRequest     PR                  LIKEDS(Response_t)
     Drequest                              LIKEDS(Request_t) CONST
     PprocessRequest   B                   EXPORT
     D                 PI                  LIKEDS(Response_t)
     Drequest                              LIKEDS(Request_t) CONST
     Dresponse         DS                  LIKEDS(Response_t)
     C                   CLEAR     response
     C                   EVAL      response.correlationId = request.operationId
     C                   IF        %trim(request.operationId) = '' or
     C                             request.customerId <= 0
     C                   EVAL      response.code = 1
     C                   EVAL      response.message = 'Invalid request'
     C                   RETURN    response
     C                   ENDIF
     C                   EVAL      response = ApplyRequest(request)
     C                   EVAL      response.correlationId = request.operationId
     C                   RETURN    response
     PprocessRequest   E
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
  correlationId char(40);
end-ds;
dcl-pr processRequest likeds(Response_t);
  request likeds(Request_t) const;
end-pr;
dcl-pr ApplyRequest likeds(Response_t);
  request likeds(Request_t) const;
end-pr;
dcl-proc processRequest export;
  dcl-pi *n likeds(Response_t);
    request likeds(Request_t) const;
  end-pi;
  dcl-ds response likeds(Response_t);
clear response;
response.correlationId = request.operationId;
if %trim(request.operationId) = '' or request.customerId <= 0;
  response.code = 1;
  response.message = 'Invalid request';
  return response;
endif;
response = ApplyRequest(request);
response.correlationId = request.operationId;
return response;
end-proc;
```

</details>

## 24. Measure and improve a lookup for the earliest open order for one customer without guessing at an index.

**Advanced** · Performance measurement

<details>
<summary>Explain the answer</summary>

First fix the lookup contract: a singleton SELECT INTO must not arbitrarily match every open order for a customer. This example asks for the earliest open order by unique order_id, orders explicitly and bounds the result to one row. If the business needs all orders, use a cursor/page instead. Clear output and check SQLSTATE before accepting returned values.

These are equivalent calculation fragments, not complete programs. Add the declarations, file/schema fixtures and helper implementations listed below; no IBM i compilation or execution has been performed. Timing helpers, representative data and an IBM i access-plan measurement session are omitted. The snippet shows a measurable query contract, not a demonstrated performance improvement.

**Task and setup**

- Use SQLRPGLE NAMING(*SQL), non-null order_id and amount, compatible host variables, savedState char(5) and found ind.
- StartTiming and RecordTiming are application subroutines; they measure elapsed time without replacing savedState or issuing another copy of the business query.
- Record baseline latency distribution, row counts, CPU/I/O and lock waits; evaluate a candidate access path against reads and write overhead with the same workload. No index is asserted to be optimal.

**Test cases**

1. Customer has several OPEN orders: At most one row is returned: the lowest order_id, deterministically.
2. Customer has no OPEN order after a previous success: savedState is 02000, found is off and cleared outputs are not mistaken for a row.
3. Representative large/hot-customer dataset before and after one change: Measure the same correct result contract and compare latency, I/O, locks and write cost; reject a change that violates the agreed thresholds.

**Fixed-format RPG**

```rpgle
     C                   CLEAR     orderId
     C                   CLEAR     amount
     C                   EVAL      found = *off
     C                   EXSR      StartTiming
     C/EXEC SQL
     C+ select order_id, amount into :orderId, :amount
     C+ from appdata.orders
     C+ where customer_id = :customerId and status = 'OPEN'
     C+ order by order_id fetch first 1 row only
     C/END-EXEC
     C                   EVAL      savedState = SQLSTT
     C                   IF        savedState = '00000'
     C                   EVAL      found = *on
     C                   ENDIF
     C                   EXSR      RecordTiming
```

**Fully free RPG**

```rpgle
**FREE
clear orderId;
clear amount;
found = *off;
exsr StartTiming;
exec sql select order_id, amount into :orderId, :amount
  from appdata.orders
  where customer_id = :customerId and status = 'OPEN'
  order by order_id fetch first 1 row only;
savedState = SQLSTT;
if savedState = '00000';
  found = *on;
endif;
exsr RecordTiming;
```

</details>

## 25. A supplier sends unit prices with four decimal places. Calculate each invoice line and round once to two decimal places, including credit lines.

**Easy** · Decimal rounding at the invoice-line boundary

<details>
<summary>Explain the answer</summary>

Fragment assumptions: the caller supplies validated unitPrice and qty in the declared packed-decimal fields; these declarations and calculations belong inside an existing program. Multiply at four decimal places into rawAmount, then use %DECH to half-adjust the complete line to cents. Both examples deliberately preserve fractional cents until the line amount is known.

The business rule is half-adjust rounding, including ties away from zero for negative amounts. It is not a rule to round every unit price first: three units at 1.0050 produce 3.02 under this contract. Validate the supported quantity and price range before this fragment and retain the original precision for audit; a different contractual rounding rule needs a different implementation.

**Task and setup**

- Use packed decimal arithmetic, with four fractional digits in the intermediate result.
- Apply half-adjust once after multiplying the quantity and price.
- Produce the same rounded amount for positive and negative test inputs in both source formats.

<details>
<summary>Need a hint?</summary>

- %DECH takes the result precision and decimal places as its second and third arguments.
- Rounding 1.0050 before multiplying by three changes this example’s answer.

</details>

**Test cases**

1. qty=3, unitPrice=1.0050 → rawAmount=3.0150, lineAmount=3.02.
2. qty=1, unitPrice=-1.0050 → lineAmount=-1.01.
3. qty=2, unitPrice=19.9950 → lineAmount=39.99.

**Fixed-format RPG**

```rpgle
     DunitPrice        S             11P 4
     Dqty              S              5P 0
     DrawAmount        S             17P 4
     DlineAmount       S             15P 2
     C                   EVAL      rawAmount = qty * unitPrice
     C                   EVAL      lineAmount = %dech(rawAmount:15:2)
```

**Fully free RPG**

```rpgle
**FREE
dcl-s unitPrice packed(11:4);
dcl-s qty packed(5:0);
dcl-s rawAmount packed(17:4);
dcl-s lineAmount packed(15:2);
rawAmount = qty * unitPrice;
lineAmount = %dech(rawAmount:15:2);
```

**IBM documentation for this exercise**

- [IBM Docs: %DECH: packed decimal with half adjust](https://www.ibm.com/docs/en/i/7.5.0?topic=functions-dech-convert-packed-decimal-format-half-adjust)
- [IBM Docs: Ensuring accuracy](https://www.ibm.com/docs/ssw_ibm_i_74/rzasd/arithacc.htm)

</details>

## 26. Consolidate one incoming SKU into a five-slot picking list: merge a duplicate, append a new SKU, or report that the list is full.

**Intermediate** · Bounded arrays and duplicate SKU consolidation

<details>
<summary>Explain the answer</summary>

Fragment assumptions: the caller loads codes, amounts and used with a valid existing list, where 0 <= used <= 5 and occupied codes are unique. newCode is nonblank and newQty is positive; all totals fit packed(9:0). Search only occupied slots. A match adds to its quantity without increasing used, while a new code consumes one slot only if capacity remains.

Initialize pos on every invocation and skip %LOOKUP when used is zero, because there is no occupied range to search. Check the returned index rather than %FOUND: the lookup built-in does not establish a file-found result. FULL must leave the existing arrays and count untouched so the caller can split the picking list without losing quantities.

**Task and setup**

- Search only elements 1 through used and handle an empty list explicitly.
- Merge a duplicate without consuming capacity.
- Reject a sixth distinct SKU without changing existing values.

<details>
<summary>Need a hint?</summary>

- %LOOKUP returns zero when the searched value is absent.
- Test for an existing SKU before rejecting a list that already contains five items.

</details>

**Test cases**

1. used=2, codes=[A,B], amounts=[4,2], newCode=A, newQty=3 → MERGED, used=2, amounts=[7,2].
2. used=0, newCode=C, newQty=5 → ADDED, used=1, codes(1)=C, amounts(1)=5.
3. used=5, codes=[A,B,C,D,E], newCode=F, newQty=1 → FULL; arrays and used remain unchanged.

**Fixed-format RPG**

```rpgle
     Dcodes            S             10A   DIM(5)
     Damounts          S              9P 0 DIM(5)
     Dused             S             10I 0
     DnewCode          S             10A
     DnewQty           S              9P 0
     Dpos              S             10I 0
     Doutcome          S              8A
     C                   EVAL      pos = 0
     C                   IF        used > 0
     C                   EVAL      pos = %lookup(newCode:codes:1:used)
     C                   ENDIF
     C                   IF        pos > 0
     C                   EVAL      amounts(pos) += newQty
     C                   EVAL      outcome = 'MERGED'
     C                   ELSEIF    used < %elem(codes)
     C                   EVAL      used += 1
     C                   EVAL      codes(used) = newCode
     C                   EVAL      amounts(used) = newQty
     C                   EVAL      outcome = 'ADDED'
     C                   ELSE
     C                   EVAL      outcome = 'FULL'
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-s codes char(10) dim(5);
dcl-s amounts packed(9:0) dim(5);
dcl-s used int(10);
dcl-s newCode char(10);
dcl-s newQty packed(9:0);
dcl-s pos int(10);
dcl-s outcome char(8);
pos = 0;
if used > 0;
  pos = %lookup(newCode:codes:1:used);
endif;
if pos > 0;
  amounts(pos) += newQty;
  outcome = 'MERGED';
elseif used < %elem(codes);
  used += 1;
  codes(used) = newCode;
  amounts(used) = newQty;
  outcome = 'ADDED';
else;
  outcome = 'FULL';
endif;
```

**IBM documentation for this exercise**

- [IBM Docs: Searching arrays](https://www.ibm.com/docs/en/i/7.5.0?topic=tables-searching-arrays)
- [IBM Docs: %LOOKUPxx](https://www.ibm.com/docs/it/ssw_ibm_i_76/pdf/sc092508.pdf)

</details>

## 27. Assign an unpaid invoice to CURRENT, DUE1_30, DUE31_60, or OVER60 using an explicit reporting date.

**Easy** · Calendar-day invoice aging

<details>
<summary>Explain the answer</summary>

Fragment assumptions: dueDate and asOf are valid RPG date values supplied by the caller. The fragment calculates elapsed calendar days as reporting date minus due date. An invoice due today or in the future is CURRENT; positive ages from 1 through 30 and 31 through 60 occupy the next two buckets, with larger ages in OVER60.

Passing asOf makes a historical report reproducible instead of letting the machine date change the answer between runs. %DIFF with *DAYS performs date arithmetic across month ends and leap days. The classification here excludes payment allocation, business-day calendars and time zones because its inputs are already business dates; those belong in the surrounding reporting contract.

**Task and setup**

- Use valid date fields and an explicit asOf value.
- Keep day 30 in DUE1_30 and day 60 in DUE31_60.
- Treat zero and negative ages as CURRENT.

<details>
<summary>Need a hint?</summary>

- The order of the first two %DIFF arguments determines the sign.
- Use successive upper bounds after the previous bucket has already been excluded.

</details>

**Test cases**

1. dueDate=2024-02-28, asOf=2024-03-01 → ageDays=2, DUE1_30.
2. dueDate=2026-01-01, asOf=2026-03-02 → ageDays=60, DUE31_60.
3. dueDate=2026-09-10, asOf=2026-09-05 → ageDays=-5, CURRENT.

**Fixed-format RPG**

```rpgle
     DdueDate          S               D
     DasOf             S               D
     DageDays          S             10I 0
     Dbucket           S              8A
     C                   EVAL      ageDays = %diff(asOf:dueDate:*days)
     C                   IF        ageDays <= 0
     C                   EVAL      bucket = 'CURRENT'
     C                   ELSEIF    ageDays <= 30
     C                   EVAL      bucket = 'DUE1_30'
     C                   ELSEIF    ageDays <= 60
     C                   EVAL      bucket = 'DUE31_60'
     C                   ELSE
     C                   EVAL      bucket = 'OVER60'
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-s dueDate date;
dcl-s asOf date;
dcl-s ageDays int(10);
dcl-s bucket char(8);
ageDays = %diff(asOf:dueDate:*days);
if ageDays <= 0;
  bucket = 'CURRENT';
elseif ageDays <= 30;
  bucket = 'DUE1_30';
elseif ageDays <= 60;
  bucket = 'DUE31_60';
else;
  bucket = 'OVER60';
endif;
```

**IBM documentation for this exercise**

- [IBM Docs: %DIFF: difference between date values](https://www.ibm.com/docs/en/i/7.4.0?topic=bif-diff-difference-between-two-date-time-timestamp-values)

</details>

## 28. Find the highest shipment sequence for one customer without accidentally returning a neighboring customer’s shipment.

**Intermediate** · Reverse keyed reads for latest shipment

<details>
<summary>Explain the answer</summary>

Fragment assumptions: Shipment is an externally described, input-only file with an ascending composite access path (customer number packed(9:0), shipNo packed(9:0)); shipNo is an input field from its record format. wantCust matches the leading key exactly. Both fragments position after the requested customer group with SETGT and retrieve the preceding matching row with an explicitly keyed READPE.

The largest sequence is treated as the latest shipment only because that is the application’s ordering contract. READPE reports the boundary through %EOF when the previous row belongs to another customer, so the result remains zero with hasShip off. Keep the requested key separate from fields overwritten by input and reposition on every invocation; a prior end-of-file state must not control a new search.

**Task and setup**

- Use an ascending customer/sequence key and a separate search variable.
- Supply the same explicit customer key to SETGT and READPE.
- Return hasShip off with lastShip zero when the customer has no rows.

<details>
<summary>Need a hint?</summary>

- SETGT skips beyond the whole leading-key group.
- For READPE, %EOF also represents reaching the beginning or an unequal-key boundary.

</details>

**Test cases**

1. Rows (101,10), (101,20), (103,9); wantCust=101 → hasShip on, lastShip=20.
2. Same rows; wantCust=102 → hasShip off, lastShip=0.
3. Empty Shipment file; wantCust=101 → hasShip off, lastShip=0.

**Fixed-format RPG**

```rpgle
     FShipment  IF   E           K DISK
     DwantCust         S              9P 0
     DlastShip         S              9P 0
     DhasShip          S               N
     C                   EVAL      lastShip = 0
     C                   EVAL      hasShip = *off
     C     wantCust      SETGT     Shipment
     C     wantCust      READPE    Shipment
     C                   IF        not %eof(Shipment)
     C                   EVAL      lastShip = shipNo
     C                   EVAL      hasShip = *on
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-f Shipment keyed usage(*input);
dcl-s wantCust packed(9:0);
dcl-s lastShip packed(9:0);
dcl-s hasShip ind;
lastShip = 0;
hasShip = *off;
setgt wantCust Shipment;
readpe wantCust Shipment;
if not %eof(Shipment);
  lastShip = shipNo;
  hasShip = *on;
endif;
```

**IBM documentation for this exercise**

- [IBM Docs: SETGT](https://www.ibm.com/docs/en/i/7.6?topic=codes-setgt-set-greater-than)
- [IBM Docs: READPE](https://www.ibm.com/docs/en/i/7.6.0?topic=codes-readpe-read-prior-equal)

</details>

## 29. Extend an order-label procedure with an optional prefix while allowing existing one-parameter callers to continue working.

**Intermediate** · Optional parameters with a stable default

<details>
<summary>Explain the answer</summary>

Subprocedure assumptions: insert the fixed-format prototype in the declaration section and the P-spec procedure after the enclosing program’s main calculations; the free version supplies the equivalent prototype and procedure. OrderLabel returns char(40), accepts a required char(10) orderId, and accepts a trailing char(10) prefix declared CONST OPTIONS(*NOPASS). Both implementations default to ORD on every call and examine prefix only when %PARMS confirms it exists.

Not passing a parameter differs from passing blanks. This contract deliberately honors a supplied blank prefix, which produces a leading hyphen, while a one-argument call uses ORD. The prototype and procedure interface must agree, and every parameter after the first *NOPASS parameter must also be optional. This example does not allow *OMIT; supporting *OMIT would require an additional availability check.

**Task and setup**

- Keep matching prototype and procedure-interface declarations.
- Never reference the second parameter unless it was passed.
- Distinguish an omitted prefix from a supplied blank prefix.

<details>
<summary>Need a hint?</summary>

- The number returned by %PARMS includes supplied arguments, even when an argument contains blanks.
- Assign the default before checking the optional argument so repeated calls are predictable.

</details>

**Test cases**

1. OrderLabel('4711') → 'ORD-4711' padded to 40 characters.
2. OrderLabel('4711':'RET') → 'RET-4711' padded to 40 characters.
3. OrderLabel('4711':'') → '-4711' padded to 40 characters.

**Fixed-format RPG**

```rpgle
     DOrderLabel       PR            40A
     DorderId                        10A   CONST
     Dprefix                         10A   CONST OPTIONS(*NOPASS)
     POrderLabel       B
     DOrderLabel       PI            40A
     DorderId                        10A   CONST
     Dprefix                         10A   CONST OPTIONS(*NOPASS)
     DusePrefix        S             10A
     C                   EVAL      usePrefix = 'ORD'
     C                   IF        %parms() >= 2
     C                   EVAL      usePrefix = prefix
     C                   ENDIF
     C                   RETURN    %trim(usePrefix) + '-' + %trim(orderId)
     POrderLabel       E
```

**Fully free RPG**

```rpgle
**FREE
dcl-pr OrderLabel char(40);
  orderId char(10) const;
  prefix char(10) const options(*nopass);
end-pr;

dcl-proc OrderLabel;
  dcl-pi *n char(40);
    orderId char(10) const;
    prefix char(10) const options(*nopass);
  end-pi;
  dcl-s usePrefix char(10);
  usePrefix = 'ORD';
  if %parms() >= 2;
    usePrefix = prefix;
  endif;
  return %trim(usePrefix) + '-' + %trim(orderId);
end-proc;
```

**IBM documentation for this exercise**

- [IBM Docs: Leaving out parameters](https://www.ibm.com/docs/en/i/7.5.0?topic=parameters-leaving-out)
- [IBM Docs: %PARMS](https://www.ibm.com/docs/he/ssw_ibm_i_74/rzasd/bbparm.htm)

</details>

## 30. Load an optional keyed configuration only when enabled, and close the file when this routine opened it.

**Intermediate** · USROPN and conditional resource use

<details>
<summary>Explain the answer</summary>

Fragment assumptions: Config is an input-only externally described keyed file declared USROPN, cfgKey exactly matches its key, and enabled is supplied by the caller. The enclosing routine may call this fragment when Config is already open. didOpen records ownership of a successful OPEN so cleanup closes only the open performed here. outcome distinguishes disabled, missing, loaded, and I/O failure.

OPEN(E) and CHAIN(E) set %ERROR for their own operation, so check it immediately before another extended operation changes it. A failed OPEN skips the read. The normal cleanup uses CLOSE(E) and reports CLOSEERR if closing fails; a production caller should preserve detailed %STATUS information and arrange cleanup for unexpected exceptions outside these shown operations. A disabled request does no file I/O.

**Task and setup**

- Declare Config with USROPN and skip all I/O for a disabled request.
- Check OPEN and CHAIN errors before interpreting a found result.
- Close an open owned by this fragment while preserving a file already open on entry.

<details>
<summary>Need a hint?</summary>

- %OPEN describes the current file state; didOpen records which routine owns the cleanup.
- A successful read and a successful close are separate operations.

</details>

**Test cases**

1. enabled off, Config closed → DISABLED; Config stays closed.
2. enabled on, Config closed, matching key and successful I/O → LOADED; Config is closed on exit.
3. enabled on, Config already open, missing key → MISSING; Config stays open.

**Fixed-format RPG**

```rpgle
     FConfig    IF   E           K DISK    USROPN
     Denabled          S               N
     DcfgKey           S             10A
     DdidOpen          S               N
     Doutcome          S             10A
     C                   EVAL      didOpen = *off
     C                   EVAL      outcome = 'DISABLED'
     C                   IF        enabled
     C                   EVAL      outcome = 'OPENERR'
     C                   IF        not %open(Config)
     C                   OPEN(E)   Config
     C                   IF        not %error()
     C                   EVAL      didOpen = *on
     C                   ENDIF
     C                   ENDIF
     C                   IF        %open(Config)
     C     cfgKey        CHAIN(E)  Config
     C                   IF        %error()
     C                   EVAL      outcome = 'READERR'
     C                   ELSEIF    %found(Config)
     C                   EVAL      outcome = 'LOADED'
     C                   ELSE
     C                   EVAL      outcome = 'MISSING'
     C                   ENDIF
     C                   ENDIF
     C                   ENDIF
     C                   IF        didOpen
     C                   CLOSE(E)  Config
     C                   IF        %error()
     C                   EVAL      outcome = 'CLOSEERR'
     C                   ENDIF
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-f Config keyed usage(*input) usropn;
dcl-s enabled ind;
dcl-s cfgKey char(10);
dcl-s didOpen ind;
dcl-s outcome char(10);
didOpen = *off;
outcome = 'DISABLED';
if enabled;
  outcome = 'OPENERR';
  if not %open(Config);
    open(e) Config;
    if not %error();
      didOpen = *on;
    endif;
  endif;
  if %open(Config);
    chain(e) cfgKey Config;
    if %error();
      outcome = 'READERR';
    elseif %found(Config);
      outcome = 'LOADED';
    else;
      outcome = 'MISSING';
    endif;
  endif;
endif;
if didOpen;
  close(e) Config;
  if %error();
    outcome = 'CLOSEERR';
  endif;
endif;
```

**IBM documentation for this exercise**

- [IBM Docs: OPEN and USROPN](https://www.ibm.com/docs/en/i/7.6.0?topic=codes-open-open-file-processing)
- [IBM Docs: %OPEN](https://www.ibm.com/docs/en/i/7.5.0?topic=functions-open-return-file-open-condition)

</details>

## 31. Total stock units for one region and warehouse when the access path also includes SKU as its third key.

**Intermediate** · Composite partial keys for warehouse totals

<details>
<summary>Explain the answer</summary>

Fragment assumptions: BinStock is an externally described input file keyed in ascending order by region char(2), warehouse char(3), and SKU char(10). Its units field is packed(9:0); the search variables have identical key attributes and CCSIDs. The fixed version builds a two-field KLIST, while the free version supplies the same two values as a parenthesized key list.

Only a leading portion of the composite key can be omitted this way: region plus warehouse is valid, but warehouse alone would not mean the desired selection. Initialize totalUnits and rowCount, position once, and process each successful READE. An unmatched warehouse produces zero rows and zero units without reading stale fields from the last successful request.

**Task and setup**

- Use exactly the first two key fields in their access-path order.
- Read every SKU in the selected warehouse and no neighboring warehouse.
- Initialize both totals before positioning the file.

<details>
<summary>Need a hint?</summary>

- A KLIST with fewer KFLD entries expresses a partial key in fixed format.
- READE tests the supplied leading-key group, so no manual SKU boundary is necessary.

</details>

**Test cases**

1. Rows (NE,001,A,5), (NE,001,B,7), (NE,002,A,100); select NE/001 → rowCount=2, totalUnits=12.
2. Same rows; select NE/003 → rowCount=0, totalUnits=0.
3. Rows (NE,001,A,5), (SW,001,A,9); select SW/001 → rowCount=1, totalUnits=9.

**Fixed-format RPG**

```rpgle
     FBinStock  IF   E           K DISK
     DwantReg          S              2A
     DwantWhs          S              3A
     DtotalUnits       S             15P 0
     DrowCount         S             10I 0
     C     WhsKey        KLIST
     C                   KFLD                    wantReg
     C                   KFLD                    wantWhs
     C                   EVAL      totalUnits = 0
     C                   EVAL      rowCount = 0
     C     WhsKey        SETLL     BinStock
     C     WhsKey        READE     BinStock
     C                   DOW       not %eof(BinStock)
     C                   EVAL      totalUnits += units
     C                   EVAL      rowCount += 1
     C     WhsKey        READE     BinStock
     C                   ENDDO
```

**Fully free RPG**

```rpgle
**FREE
dcl-f BinStock keyed usage(*input);
dcl-s wantReg char(2);
dcl-s wantWhs char(3);
dcl-s totalUnits packed(15:0);
dcl-s rowCount int(10);
// Fixed form uses WhsKey with these two fields.
// First key: wantReg.
// Second key: wantWhs.
totalUnits = 0;
rowCount = 0;
setll (wantReg:wantWhs) BinStock;
reade (wantReg:wantWhs) BinStock;
dow not %eof(BinStock);
  totalUnits += units;
  rowCount += 1;
  reade (wantReg:wantWhs) BinStock;
enddo;
```

**IBM documentation for this exercise**

- [IBM Docs: Referring to a partial key](https://www.ibm.com/docs/vi/ssw_ibm_i_74/rzasc/partialkey.htm)
- [IBM Docs: Keys for file operations](https://www.ibm.com/docs/ssw_ibm_i_74/rzasd/fileopkeys.htm)

</details>

## 32. Delete a canceled reservation only after locking and verifying its current state; release the lock when the reservation is still active.

**Advanced** · Conditional delete and explicit unlock

<details>
<summary>Explain the answer</summary>

Fragment assumptions: Reserve is an externally described keyed update/delete-capable file with record format ResRec, key packed(9:0), and rsvStatus char(1); C means canceled. The file is not under commitment control in this focused example. CHAIN reads with a lock, and DELETE without a search key targets exactly that current locked record after its status has been checked.

MISSING performs no deletion. An active reservation returns RETAINED after UNLOCK so the routine does not hold a record while its caller decides what to do. These snippets show the successful-I/O business path; I/O exceptions deliberately propagate to the surrounding error boundary. Real application integration must add diagnostics and cleanup appropriate to its transaction policy, and must not claim RETAINED or DELETED after a failed operation.

**Task and setup**

- Read with a lock and inspect the retrieved current status.
- Delete the current record only when its status is C.
- Release the active record’s lock before returning RETAINED.

<details>
<summary>Need a hint?</summary>

- CHAIN(N) would not provide the lock required for a keyless DELETE.
- The UNLOCK operand is the file name, while DELETE can name the record format.

</details>

**Test cases**

1. reserveId=81 exists with rsvStatus=C → DELETED; row 81 is absent afterward.
2. reserveId=82 exists with rsvStatus=A → RETAINED; row is unchanged and its read lock is released.
3. reserveId=99 is absent → MISSING; no row is changed.

**Fixed-format RPG**

```rpgle
     FReserve   UF   E           K DISK
     DreserveId        S              9P 0
     Doutcome          S              8A
     C                   EVAL      outcome = 'MISSING'
     C     reserveId     CHAIN     ResRec
     C                   IF        %found(Reserve)
     C                   IF        rsvStatus = 'C'
     C                   DELETE    ResRec
     C                   EVAL      outcome = 'DELETED'
     C                   ELSE
     C                   UNLOCK    Reserve
     C                   EVAL      outcome = 'RETAINED'
     C                   ENDIF
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-f Reserve keyed usage(*update:*delete);
dcl-s reserveId packed(9:0);
dcl-s outcome char(8);
outcome = 'MISSING';
chain reserveId ResRec;
if %found(Reserve);
  if rsvStatus = 'C';
    delete ResRec;
    outcome = 'DELETED';
  else;
    unlock Reserve;
    outcome = 'RETAINED';
  endif;
endif;
```

**IBM documentation for this exercise**

- [IBM Docs: DELETE](https://www.ibm.com/docs/en/i/7.4.0?topic=codes-delete-delete-record)
- [IBM Docs: UNLOCK](https://www.ibm.com/docs/en/i/7.4.0?topic=codes-unlock-unlock-data-area-release-record)

</details>

## 33. Read an optional shipment date and distinguish an unscheduled order from a missing order or a database error.

**Intermediate** · SQL NULL indicators without stale output

<details>
<summary>Explain the answer</summary>

SQL fragment assumptions: compile as SQLRPGLE with SQL naming and the normal SQLCA. APPDATA.ORDERPLAN has unique integer ORDER_ID and nullable DATE SHIP_DATE. The caller supplies orderId. shipInd is a two-byte signed integer, paired with shipDate in SELECT INTO. Only a successful, non-null result is converted into the character output shown to the caller.

A nullable date is not a blank date or a zero date. A negative output indicator means the associated date must not be used. Initialize dateText each time, distinguish SQLSTATE 02000 from a successful NULL, and treat other states as SQLERR. This prevents a previous order’s date from appearing after a null or missing-row lookup; dateText is meaningful as a date only with outcome DATED.

**Task and setup**

- Declare the SQL indicator as int(5), distinct from an RPG boolean indicator.
- Check SQLSTATE before checking the indicator or using the date.
- Clear display output before every request to avoid showing stale values.

<details>
<summary>Need a hint?</summary>

- The indicator follows its host variable without a separating comma.
- No row and one row containing NULL are different outcomes.

</details>

**Test cases**

1. ORDER_ID=10, SHIP_DATE=2026-09-07 → DATED and dateText=2026-09-07.
2. ORDER_ID=11, SHIP_DATE=NULL, dateText previously 2026-09-07 → UNPLANNED and dateText blank.
3. ORDER_ID=99 absent → MISSING and dateText blank.

**Fixed-format RPG**

```rpgle
     DorderId          S             10I 0
     DshipDate         S               D
     DshipInd          S              5I 0
     DdateText         S             10A
     Doutcome          S             10A
     C                   EVAL      dateText = *blanks
     C                   EVAL      outcome = 'SQLERR'
     C/EXEC SQL
     C+ SELECT SHIP_DATE INTO :shipDate :shipInd
     C+ FROM APPDATA.ORDERPLAN WHERE ORDER_ID = :orderId
     C/END-EXEC
     C                   IF        SQLSTATE = '00000'
     C                   IF        shipInd < 0
     C                   EVAL      outcome = 'UNPLANNED'
     C                   ELSE
     C                   EVAL      dateText = %char(shipDate:*iso)
     C                   EVAL      outcome = 'DATED'
     C                   ENDIF
     C                   ELSEIF    SQLSTATE = '02000'
     C                   EVAL      outcome = 'MISSING'
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-s orderId int(10);
dcl-s shipDate date;
dcl-s shipInd int(5);
dcl-s dateText char(10);
dcl-s outcome char(10);
dateText = *blanks;
outcome = 'SQLERR';
exec sql
  SELECT SHIP_DATE INTO :shipDate :shipInd
  FROM APPDATA.ORDERPLAN WHERE ORDER_ID = :orderId;
if SQLSTATE = '00000';
  if shipInd < 0;
    outcome = 'UNPLANNED';
  else;
    dateText = %char(shipDate:*iso);
    outcome = 'DATED';
  endif;
elseif SQLSTATE = '02000';
  outcome = 'MISSING';
endif;
```

**IBM documentation for this exercise**

- [IBM Docs: References to host variables](https://www.ibm.com/docs/en/i/7.5.0?topic=variables-references-host)
- [IBM Docs: Using indicator variables in ILE RPG](https://www.ibm.com/docs/en/i/7.5.0?topic=cssiira-using-indicator-variables-in-ile-rpg-applications-that-use-sql)

</details>

## 34. Save a stock edit only if the row still has the version displayed to the user, and report a conflict when it changed.

**Advanced** · Optimistic concurrency with an application version

<details>
<summary>Explain the answer</summary>

SQL fragment assumptions: compile as SQLRPGLE with SQL naming and the normal SQLCA. APPDATA.STOCKEDIT has unique integer ITEM_ID, integer QTY, and a non-null integer REVISION. The caller supplies a validated nonnegative newQty and the oldVersion it originally read. Every writer increments REVISION, versions are not reset or reused for an identity, and overflow is prevented by the application contract.

The update tests identity and old version in one statement while incrementing the version in that same statement. Capture SQLSTATE and SQLERRD(3) immediately: one affected row means UPDATED, and zero means the row is missing or stale, reported together as CONFLICT. Do not silently retry using a freshly read version, because that would discard the user’s opportunity to review another person’s edit. The surrounding caller owns commit or rollback and reports final persistence only after its transaction succeeds.

**Task and setup**

- Use a single UPDATE with both unique identity and original version predicates.
- Increment the version atomically and capture the affected-row count immediately.
- Treat zero changed rows as a conflict and leave transaction ownership with the caller.

<details>
<summary>Need a hint?</summary>

- A version check in a separate SELECT leaves a race before the UPDATE.
- A unique item key limits the statement to zero or one qualifying row.

</details>

**Test cases**

1. Row (itemId=7, QTY=10, REVISION=4), oldVersion=4, newQty=12 → UPDATED; QTY=12, REVISION=5 before caller commit.
2. Same row at REVISION=5, oldVersion=4, newQty=99 → CONFLICT; QTY and REVISION unchanged.
3. itemId=99 absent, oldVersion=1, newQty=3 → CONFLICT; no row inserted.

**Fixed-format RPG**

```rpgle
     DitemId           S             10I 0
     DnewQty           S             10I 0
     DoldVersion       S             10I 0
     Dchanged          S             10I 0
     DsaveState        S              5A
     Doutcome          S             10A
     C/EXEC SQL
     C+ UPDATE APPDATA.STOCKEDIT
     C+ SET QTY = :newQty, REVISION = REVISION + 1
     C+ WHERE ITEM_ID = :itemId AND REVISION = :oldVersion
     C/END-EXEC
     C                   EVAL      saveState = SQLSTATE
     C                   EVAL      changed = SQLERRD(3)
     C                   EVAL      outcome = 'SQLERR'
     C                   IF        saveState = '00000' or saveState = '02000'
     C                   IF        changed = 1
     C                   EVAL      outcome = 'UPDATED'
     C                   ELSEIF    changed = 0
     C                   EVAL      outcome = 'CONFLICT'
     C                   ENDIF
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-s itemId int(10);
dcl-s newQty int(10);
dcl-s oldVersion int(10);
dcl-s changed int(10);
dcl-s saveState char(5);
dcl-s outcome char(10);
exec sql
  UPDATE APPDATA.STOCKEDIT
  SET QTY = :newQty, REVISION = REVISION + 1
  WHERE ITEM_ID = :itemId AND REVISION = :oldVersion;
saveState = SQLSTATE;
changed = SQLERRD(3);
outcome = 'SQLERR';
if saveState = '00000' or saveState = '02000';
  if changed = 1;
    outcome = 'UPDATED';
  elseif changed = 0;
    outcome = 'CONFLICT';
  endif;
endif;
```

**IBM documentation for this exercise**

- [IBM Docs: Optimistic locking through searched updates](https://www.ibm.com/docs/en/i/7.5.0?topic=driver-select-stringent-level-commitment-control)
- [IBM Docs: SQLCA field descriptions](https://www.ibm.com/docs/en/i/7.6.0?topic=area-field-descriptions)

</details>

## 35. Compare a staged payment batch with its trailer count and total before the posting process can proceed.

**Advanced** · Batch reconciliation with count and amount controls

<details>
<summary>Explain the answer</summary>

SQL fragment assumptions: compile as SQLRPGLE with SQL naming. APPDATA.PAYSTAGE has BATCH_ID char(10) and non-null AMOUNT decimal(11,2). The batch is frozen for validation and posting, all rows have passed field-level validation, and totals fit packed(17:2). The caller supplies batchId, expectedCount and expectedTotal from a validated trailer. A single aggregate query returns both observed controls for precisely that batch.

BALANCED requires both the count and the sum to match; checking money alone can hide missing or duplicated records with offsetting amounts. COALESCE supplies zero for the empty batch’s null SUM, making a declared zero-row batch a defined case. The check is a posting gate, not a complete integrity proof: enforce unique payment identifiers separately and preserve the same frozen batch or transaction boundary until posting consumes it.

**Task and setup**

- Filter by the supplied batch identifier and calculate both controls in one statement.
- Allow posting only when both expected controls match.
- Define empty-batch behavior and prevent concurrent changes between validation and posting.

<details>
<summary>Need a hint?</summary>

- An aggregate query without GROUP BY still returns one result row for an empty selection.
- COALESCE around SUM prevents an empty batch from requiring a nullable total host variable.

</details>

**Test cases**

1. Batch B1 amounts [60.00,40.00], expectedCount=2, expectedTotal=100.00 → BALANCED.
2. Batch B2 amounts [100.00], expectedCount=2, expectedTotal=100.00 → MISMATCH despite matching money.
3. Batch B3 has no rows, expectedCount=0, expectedTotal=0.00 → BALANCED, gotCount=0, gotTotal=0.00.

**Fixed-format RPG**

```rpgle
     DbatchId          S             10A
     DexpectedCount    S             10I 0
     DexpectedTotal    S             17P 2
     DgotCount         S             10I 0
     DgotTotal         S             17P 2
     Doutcome          S             10A
     C                   EVAL      outcome = 'SQLERR'
     C/EXEC SQL
     C+ SELECT COUNT(*), COALESCE(SUM(AMOUNT), 0)
     C+ INTO :gotCount, :gotTotal FROM APPDATA.PAYSTAGE
     C+ WHERE BATCH_ID = :batchId
     C/END-EXEC
     C                   IF        SQLSTATE = '00000'
     C                   IF        gotCount = expectedCount
     C                   IF        gotTotal = expectedTotal
     C                   EVAL      outcome = 'BALANCED'
     C                   ELSE
     C                   EVAL      outcome = 'MISMATCH'
     C                   ENDIF
     C                   ELSE
     C                   EVAL      outcome = 'MISMATCH'
     C                   ENDIF
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-s batchId char(10);
dcl-s expectedCount int(10);
dcl-s expectedTotal packed(17:2);
dcl-s gotCount int(10);
dcl-s gotTotal packed(17:2);
dcl-s outcome char(10);
outcome = 'SQLERR';
exec sql
  SELECT COUNT(*), COALESCE(SUM(AMOUNT), 0)
  INTO :gotCount, :gotTotal FROM APPDATA.PAYSTAGE
  WHERE BATCH_ID = :batchId;
if SQLSTATE = '00000';
  if gotCount = expectedCount;
    if gotTotal = expectedTotal;
      outcome = 'BALANCED';
    else;
      outcome = 'MISMATCH';
    endif;
  else;
    outcome = 'MISMATCH';
  endif;
endif;
```

**IBM documentation for this exercise**

- [IBM Docs: COALESCE](https://www.ibm.com/docs/en/i/7.5.0?topic=functions-coalesce)
- [IBM Docs: Db2 for i SQL Reference](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)

</details>

## 36. Fetch up to twenty orders into a host-structure array and total only the rows actually returned, including the final partial batch.

**Advanced** · Multi-row fetch and the final partial batch

<details>
<summary>Explain the answer</summary>

SQL fragment assumptions: compile as SQLRPGLE with the normal SQLCA and SQL naming. The owning routine has declared and successfully opened cursor C1 for SELECT ORDER_ID, AMOUNT FROM APPDATA.ORDERS ORDER BY ORDER_ID, where ORDER_ID is a unique non-null INTEGER and AMOUNT is non-null DECIMAL(11,2). This is one-fetch processing, not the whole cursor lifecycle. batch has exactly the same column order and twenty elements.

Copy SQLSTATE and SQLERRD(3) immediately after FETCH, then process only elements 1 through gotRows for success or normal no-data completion. A short final batch may arrive with SQLSTATE 02000 while still containing valid rows; discarding all 02000 batches loses data. The caller repeats after a full successful batch, stops after processing a 02000 batch, handles every other state as failure, and closes C1 on each exit path. Old values outside gotRows are deliberately ignored.

**Task and setup**

- Match array subfields to selected SQL columns and never request more rows than the array dimension.
- Read the fetched-row count before executing another SQL statement.
- Process a successful partial batch before reacting to end-of-data, and ignore unused elements.

<details>
<summary>Need a hint?</summary>

- SQLERRD(3) is the number of returned rows, not the array capacity.
- The owning routine must save the fetch result before CLOSE replaces the current SQL status.

</details>

**Test cases**

1. Next 20 orders each have amount=2.00 → gotRows=20 and batchTotal=40.00; the caller fetches again if the state is 00000.
2. Only 7 rows remain, each amount=3.00; unused array elements contain old 99.00 values → gotRows=7, batchTotal=21.00, then stop on 02000.
3. Cursor has no remaining rows → SQLSTATE=02000, gotRows=0 and batchTotal=0.00.

**Fixed-format RPG**

```rpgle
     Dbatch            DS                  QUALIFIED DIM(20)
     DorderId                        10I 0
     Damount                         11P 2
     DgotRows          S             10I 0
     Didx              S             10I 0
     DfetchState       S              5A
     DbatchTotal       S             15P 2
     C/EXEC SQL
     C+ FETCH C1 FOR 20 ROWS INTO :batch
     C/END-EXEC
     C                   EVAL      fetchState = SQLSTATE
     C                   EVAL      gotRows = SQLERRD(3)
     C                   EVAL      batchTotal = 0
     C                   IF        fetchState = '00000' or fetchState = '02000'
     C                   FOR       idx = 1 to gotRows
     C                   EVAL      batchTotal += batch(idx).amount
     C                   ENDFOR
     C                   ELSE
     C                   EVAL      gotRows = 0
     C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
dcl-ds batch qualified dim(20);
  orderId int(10);
  amount packed(11:2);
end-ds;
dcl-s gotRows int(10);
dcl-s idx int(10);
dcl-s fetchState char(5);
dcl-s batchTotal packed(15:2);
exec sql
  FETCH C1 FOR 20 ROWS INTO :batch;
fetchState = SQLSTATE;
gotRows = SQLERRD(3);
batchTotal = 0;
if fetchState = '00000' or fetchState = '02000';
  for idx = 1 to gotRows;
    batchTotal += batch(idx).amount;
  endfor;
else;
  gotRows = 0;
endif;
```

**IBM documentation for this exercise**

- [IBM Docs: FETCH: multiple-row fetch](https://www.ibm.com/docs/en/i/7.5.0?topic=statements-fetch)
- [IBM Docs: Host structure arrays](https://www.ibm.com/docs/en/i/7.5.0?topic=variables-host-structure-arrays)

</details>

## 37. Count and total every record in a database file without counting the last record twice at end of file.

**Easy** · CLLE DCLF, RCVF, and end of file

<details>
<summary>Explain the answer</summary>

Use a lab physical file APPDATA/LABORD that exists at compile time and contains a non-null packed-decimal AMOUNT field of length 9 with 2 decimal places. DCLF supplies the record fields as CL variables. Return COUNT as packed decimal (7,0) and TOTAL as packed decimal (15,2); initialize both before the first read. The example processes every row in the selected member and does not apply a business filter.

Keep the CPF0864 monitor immediately after RCVF and leave the loop before using the fields. On this exception the record fields retain their previous values, which is why processing first and checking later duplicates the final amount. Other I/O or arithmetic exceptions must escape; callers must discard partial output parameters after a failure. Run the lab against stable test data because this loop does not promise a transactional snapshot.

**Task and setup**

- Compile after creating the documented LABORD schema, and pass output parameters with exactly the declared packed-decimal attributes.
- Perform arithmetic only after a successful RCVF; treat CPF0864 as the only normal termination condition.
- Explain how the caller distinguishes a valid zero-row result from an exception with partially accumulated totals.

<details>
<summary>Need a hint?</summary>

- RCVF implicitly opens the declared database file; no OPNDBF is needed for this loop.
- Place MONMSG before either CHGVAR, because a failed read does not clear the previous AMOUNT.

</details>

**Test cases**

1. An empty LABORD member returns COUNT=0 and TOTAL=0.00 without entering the arithmetic statements.
2. Rows with AMOUNT 12.50, 7.25, and -2.00 return COUNT=3 and TOTAL=17.75; a fourth RCVF does not add -2.00 again.
3. Call under a test profile without read authority to LABORD: no successful result is returned, and the file-open exception remains visible to the caller.

**Example**

```cl
PGM PARM(&COUNT &TOTAL)
  DCL VAR(&COUNT) TYPE(*DEC) LEN(7 0)
  DCL VAR(&TOTAL) TYPE(*DEC) LEN(15 2)
  DCLF FILE(APPDATA/LABORD)

  CHGVAR VAR(&COUNT) VALUE(0)
  CHGVAR VAR(&TOTAL) VALUE(0)
READNEXT:
  RCVF
  MONMSG MSGID(CPF0864) EXEC(GOTO CMDLBL(DONE))
  CHGVAR VAR(&COUNT) VALUE(&COUNT + 1)
  CHGVAR VAR(&TOTAL) VALUE(&TOTAL + &AMOUNT)
  GOTO CMDLBL(READNEXT)
DONE:
  RETURN
ENDPGM
```

**IBM documentation for this exercise**

- [IBM Docs: Declare File (DCLF)](https://www.ibm.com/docs/en/i/7.5.0?topic=d-declare-file)
- [IBM Docs: Receiving data from a database file (RCVF)](https://www.ibm.com/docs/en/i/7.6.0?topic=procedures-receiving-data-from-database-file-rcvf-command)

</details>

## 38. Allocate a sequence number from a shared data area and release the allocation on success and on every handled update failure.

**Advanced** · CLLE data area locking and cleanup

<details>
<summary>Explain the answer</summary>

Prepare APPLAB/LABSEQ as a decimal data area (9,0) containing the last issued number, initially zero. One job must own an exclusive allocation across the retrieve, increment, and change commands. The output NEXT is packed decimal (9,0). The listing releases only the allocation it acquired, using the same qualified object, lock state, and job scope on both commands; an allocation failure occurs before any cleanup path is entered.

The failure path attempts to release the lock and sends an escape even if cleanup succeeds. A cleanup failure produces a diagnostic instead of being silently ignored. The sequence is not a business transaction: a number may have been consumed before a later failure, so the caller must discard NEXT on any escape and must not reuse gaps automatically. This lab assumes a single-threaded job and no other same-job routine manages this allocation.

**Task and setup**

- Create only the lab data area, validate its decimal (9,0) contract, and reject negative or exhausted counters before changing it.
- Keep the exclusive allocation across both data-area commands and release it on the normal and handled failure paths.
- Report update and cleanup failures, and document that sequence gaps are allowed and output is invalid after an escape.

<details>
<summary>Need a hint?</summary>

- RTVDTAARA and CHGDTAARA each take their own command-duration lock; those separate locks do not protect the whole read-modify-write sequence.
- Entering FAILED implies ALCOBJ succeeded. Do not add a catch around ALCOBJ that jumps to this cleanup without tracking ownership.

</details>

**Test cases**

1. With LABSEQ=41 and no competing allocation, NEXT returns 42, LABSEQ becomes 42, and a second job can immediately acquire the lock.
2. With LABSEQ=999999999, the program sends CPF9898, leaves the value unchanged, and a second job can allocate the data area after the handler finishes.
3. Hold the exclusive allocation from another job for longer than 5 seconds: this call fails before retrieval, leaves LABSEQ unchanged, and does not release the other job's allocation.

**Example**

```cl
PGM PARM(&NEXT)
  DCL VAR(&NEXT) TYPE(*DEC) LEN(9 0)
  DCL VAR(&WHY) TYPE(*CHAR) LEN(100) +
      VALUE('Sequence update failed; inspect preceding messages.')

  ALCOBJ OBJ((APPLAB/LABSEQ *DTAARA *EXCL)) +
      WAIT(5) SCOPE(*JOB)
  RTVDTAARA DTAARA(APPLAB/LABSEQ *ALL) RTNVAR(&NEXT)
  MONMSG MSGID(CPF0000 MCH0000) EXEC(GOTO CMDLBL(FAILED))
  IF COND(&NEXT *LT 0 *OR &NEXT *GE 999999999) THEN(DO)
    CHGVAR VAR(&WHY) VALUE('Sequence value is invalid or exhausted.')
    GOTO CMDLBL(FAILED)
  ENDDO
  CHGVAR VAR(&NEXT) VALUE(&NEXT + 1)
  MONMSG MSGID(CPF0000 MCH0000) EXEC(GOTO CMDLBL(FAILED))
  CHGDTAARA DTAARA(APPLAB/LABSEQ *ALL) VALUE(&NEXT)
  MONMSG MSGID(CPF0000 MCH0000) EXEC(GOTO CMDLBL(FAILED))
  DLCOBJ OBJ((APPLAB/LABSEQ *DTAARA *EXCL)) SCOPE(*JOB)
  RETURN

FAILED:
  DLCOBJ OBJ((APPLAB/LABSEQ *DTAARA *EXCL)) SCOPE(*JOB)
  MONMSG MSGID(CPF0000 MCH0000) EXEC(SNDPGMMSG +
      MSG('Sequence lock cleanup failed; inspect the job log.') +
      MSGTYPE(*DIAG))
  SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) MSGDTA(&WHY) +
      MSGTYPE(*ESCAPE)
ENDPGM
```

**IBM documentation for this exercise**

- [IBM Docs: Allocate Object (ALCOBJ)](https://www.ibm.com/docs/en/i/7.6.0?topic=ssw_ibm_i_76%2Fcl%2Falcobj.html)
- [IBM Docs: Deallocate Object (DLCOBJ)](https://www.ibm.com/docs/en/i/7.5.0?topic=d-deallocate-object)
- [IBM Docs: CL overview and concepts — data area locking and allocation](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rbam6pdf.pdf)
- [IBM Docs: Send Program Message (SNDPGMMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=s-send-program-message)

</details>

## 39. Total sales and credits from two files that both contain AMOUNT, allowing either file to be empty or longer than the other.

**Intermediate** · CLLE multiple files and OPNID

<details>
<summary>Explain the answer</summary>

Create APPDATA/LABSALE and APPDATA/LABCREDIT as single-format lab physical files, each with a non-null packed-decimal AMOUNT (9,2). Declare them with different OPNID values so their generated variables become &S_AMOUNT and &C_AMOUNT. Return SALES, CREDITS, and NET as packed decimal (15,2). Credits are positive values to subtract, and the example reads stable test members from beginning to end.

Use independent read loops with a separate EOF branch for each open identifier. A paired read loop would incorrectly stop when the shorter file ends and would imply a relationship between row positions that this report does not have. Calculate NET only when both loops finish normally. A real accounting reconciliation may need a shared cutoff or consistent snapshot, which is a separate requirement from identifying the files correctly.

**Task and setup**

- Use distinct OPNID values in DCLF and specify the matching identifier on every RCVF.
- Accumulate each file independently, without assuming equal row counts or shared row ordering.
- Define credit sign conventions and discard all three output parameters when any unexpected exception escapes.

<details>
<summary>Need a hint?</summary>

- The variable prefix is the open identifier followed by an underscore, not the database file name.
- Reaching sales EOF should start the credit loop; reaching credit EOF should finish the calculation.

</details>

**Test cases**

1. Sales [100.00, 50.00, 25.00] and credits [10.00] return SALES=175.00, CREDITS=10.00, NET=165.00.
2. An empty sales member and credits [4.00, 6.00] return SALES=0.00, CREDITS=10.00, NET=-10.00.
3. Sales [9.50] and an empty credit member return SALES=9.50, CREDITS=0.00, NET=9.50 without reusing the sales field as a credit.

**Example**

```cl
PGM PARM(&SALES &CREDITS &NET)
  DCL VAR(&SALES) TYPE(*DEC) LEN(15 2)
  DCL VAR(&CREDITS) TYPE(*DEC) LEN(15 2)
  DCL VAR(&NET) TYPE(*DEC) LEN(15 2)
  DCLF FILE(APPDATA/LABSALE) OPNID(S)
  DCLF FILE(APPDATA/LABCREDIT) OPNID(C)

  CHGVAR VAR(&SALES) VALUE(0)
  CHGVAR VAR(&CREDITS) VALUE(0)
  CHGVAR VAR(&NET) VALUE(0)
READSALE:
  RCVF OPNID(S)
  MONMSG MSGID(CPF0864) EXEC(GOTO CMDLBL(READCREDIT))
  CHGVAR VAR(&SALES) VALUE(&SALES + &S_AMOUNT)
  GOTO CMDLBL(READSALE)
READCREDIT:
  RCVF OPNID(C)
  MONMSG MSGID(CPF0864) EXEC(GOTO CMDLBL(DONE))
  CHGVAR VAR(&CREDITS) VALUE(&CREDITS + &C_AMOUNT)
  GOTO CMDLBL(READCREDIT)
DONE:
  CHGVAR VAR(&NET) VALUE(&SALES - &CREDITS)
  RETURN
ENDPGM
```

**IBM documentation for this exercise**

- [IBM Docs: Declare File (DCLF)](https://www.ibm.com/docs/en/i/7.5.0?topic=d-declare-file)
- [IBM Docs: Receiving data from a database file (RCVF)](https://www.ibm.com/docs/en/i/7.6.0?topic=procedures-receiving-data-from-database-file-rcvf-command)

</details>

## 40. Build a private object-inventory report in QTEMP, refuse a same-job name collision, and clean up only the file created by this invocation.

**Advanced** · CLLE QTEMP report staging

<details>
<summary>Explain the answer</summary>

Provide APPLAB/OBJMODEL as an empty model file with the QADSPOBJ layout required by DSPOBJD, and authorize the lab user to duplicate it. APPLAB/OBJREPORT is an exercise worker taking two CHAR(10) parameters, library then file; it reads that inventory, produces the report, closes its files, and sends an escape on failure. First create QTEMP/LABOBJ with CRTDUPOBJ. An existing object makes creation fail before the program can replace or delete its contents.

Only after successful creation may DSPOBJD replace the owned member and the worker consume it. On failure, the wrapper attempts a targeted delete and propagates an escape with the earlier diagnostics still in the job log. QTEMP belongs to the executing job, so this entire wrapper must run inside the job that produces the report; submitting only OBJREPORT would give it another QTEMP. This inventory is a report of visible objects, not proof that the user can see every object in the library.

**Task and setup**

- Prepare OBJMODEL with the documented DSPOBJD layout and a worker with the stated two-parameter contract; do not treat those fixtures as built-in commands.
- Begin ownership only after CRTDUPOBJ succeeds, and never delete or clear a pre-existing QTEMP/LABOBJ.
- Create, populate, and consume the staging file in the same job; treat cleanup failure as visible failure.

<details>
<summary>Need a hint?</summary>

- Do not catch the initial CRTDUPOBJ error with the FAILED label; that label assumes the file belongs to this invocation.
- Another job can use the same QTEMP object name independently, but a recursive call within this job should hit the collision safeguard.

</details>

**Test cases**

1. With no QTEMP/LABOBJ and two known visible test programs in APPLAB, the worker receives QTEMP and LABOBJ, its report includes both programs, and the staging file is deleted.
2. Pre-create QTEMP/LABOBJ containing a sentinel row: creation fails, OBJREPORT is not called, and the sentinel file is unchanged.
3. Make OBJREPORT send a test escape after closing its files: the wrapper removes its staging file and sends CPF9898; the worker's preceding error remains in the job log.

**Example**

```cl
PGM
  DCL VAR(&LIB) TYPE(*CHAR) LEN(10) VALUE('QTEMP')
  DCL VAR(&FILE) TYPE(*CHAR) LEN(10) VALUE('LABOBJ')

  CRTDUPOBJ OBJ(OBJMODEL) FROMLIB(APPLAB) OBJTYPE(*FILE) +
      TOLIB(QTEMP) NEWOBJ(LABOBJ) DATA(*NO)
  DSPOBJD OBJ(APPLAB/*ALL) OBJTYPE(*PGM) DETAIL(*BASIC) +
      OUTPUT(*OUTFILE) OUTFILE(QTEMP/LABOBJ) +
      OUTMBR(*FIRST *REPLACE)
  MONMSG MSGID(CPF0000 MCH0000) EXEC(GOTO CMDLBL(FAILED))
  CALL PGM(APPLAB/OBJREPORT) PARM(&LIB &FILE)
  MONMSG MSGID(CPF0000 MCH0000) EXEC(GOTO CMDLBL(FAILED))
  DLTF FILE(QTEMP/LABOBJ)
  RETURN

FAILED:
  DLTF FILE(QTEMP/LABOBJ)
  MONMSG MSGID(CPF0000 MCH0000) EXEC(SNDPGMMSG +
      MSG('Could not delete this run''s QTEMP/LABOBJ file.') +
      MSGTYPE(*DIAG))
  SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
      MSGDTA('Inventory report failed; inspect preceding messages.') +
      MSGTYPE(*ESCAPE)
ENDPGM
```

**IBM documentation for this exercise**

- [IBM Docs: Create Duplicate Object (CRTDUPOBJ)](https://www.ibm.com/docs/en/i/7.5.0?topic=c-create-duplicate-object)
- [IBM Docs: Display Object Description (DSPOBJD)](https://www.ibm.com/docs/en/i/7.6.0?topic=ssw_ibm_i_76%2Fcl%2Fdspobjd.html)
- [IBM Support: QTEMP Library Description and other FAQs](https://www.ibm.com/support/pages/qtemp-library-description-and-other-faqs)
- [IBM Docs: Send Program Message (SNDPGMMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=s-send-program-message)

</details>

## 41. Preflight a read-only worker and its input member using explicit authority checks, while preserving failures from the actual call.

**Intermediate** · CLLE authority preflight

<details>
<summary>Explain the answer</summary>

Prepare APPLAB/READORD as a read-only lab worker that reads APPDATA/LABORD and closes it before returning. CHKOBJ without AUT only tests existence. The listing requests use authority for the program and the operational/read authorities required by the lab file, including its first member. Run the wrapper without adopted owner authority when testing the caller's own effective access; otherwise document which authority context the check is evaluating.

Leave the original errors available to the caller: for example, CPF9801 identifies an object that cannot be found, CPF9802 identifies missing object authority, and CPF9820 identifies missing library-use authority. Passing a preflight does not reserve the object or freeze permissions, so CALL must still be allowed to fail. Do not repair a failed check by granting broad authority or substituting another library-list object. DONE, a CHAR(1) output, becomes Y only after the worker returns normally.

**Task and setup**

- Use qualified object names, check the actual input member, and explicitly request the authorities needed by the read-only contract.
- Let missing-object, missing-authority, and worker exceptions escape without a blanket success handler or automatic authority change.
- Test without adopted owner authority and explain why a passed CHKOBJ is not a guarantee about the following CALL.

<details>
<summary>Need a hint?</summary>

- The AUT default is *NONE; an existence-only test cannot prove that the next read is authorized.
- Object access may change between checking and using it. Error handling belongs at the real operation as well as at preflight.

</details>

**Test cases**

1. A profile with use authority to READORD, access to both libraries, and operational/read authority to LABORD completes the worker and returns DONE=Y.
2. A profile that can access the libraries and program but lacks read authority to LABORD receives CPF9802 at CHKOBJ, keeps DONE=N, and never calls READORD.
3. With both checks passing, make READORD send CPF9898 for a test validation failure: that escape reaches the caller and DONE remains N.

**Example**

```cl
PGM PARM(&DONE)
  DCL VAR(&DONE) TYPE(*CHAR) LEN(1)

  CHGVAR VAR(&DONE) VALUE('N')
  CHKOBJ OBJ(APPLAB/READORD) OBJTYPE(*PGM) AUT(*USE)
  CHKOBJ OBJ(APPDATA/LABORD) OBJTYPE(*FILE) +
      MBR(*FIRST) AUT(*OBJOPR *READ)
  CALL PGM(APPLAB/READORD)
  CHGVAR VAR(&DONE) VALUE('Y')
  RETURN
ENDPGM
```

**IBM documentation for this exercise**

- [IBM Docs: Check Object (CHKOBJ)](https://www.ibm.com/docs/en/i/7.6.0?topic=c-check-object)

</details>

## 42. Capture a worker's escape before adding a run diagnostic, then re-send its message ID, qualified message file, and replacement data.

**Advanced** · CLLE RCVMSG and preserved escape details

<details>
<summary>Explain the answer</summary>

APPLAB/CHECKRUN is a lab worker taking a CHAR(20) run ID. For this bounded exercise its application escapes use CPF-prefixed message IDs and character replacement data no longer than 512 bytes. A command-level monitor transfers control immediately after the failed call, and RCVMSG captures the newest exception on this call entry before the wrapper adds another message. Keep the original message on the queue for job-log context and carry its returned message-file library with its name.

Re-send the captured ID with exactly the returned data length, treating a zero-length data record separately to avoid a zero-length substring. The wrapper also detects absent message metadata or data larger than its buffer and sends a clear fallback escape rather than claiming to preserve truncated data. This is a limited teaching wrapper, not a universal exception copier: binary or pointer-bearing system messages and arbitrary large replacement data require a suitably designed message API handler. Unmonitored exception families continue to escape normally.

**Task and setup**

- Capture the exception before sending the wrapper diagnostic, and preserve both the message file and the returned library.
- Use a worker fixture with CPF-prefixed, character-data messages and enforce the documented 512-byte buffer boundary.
- Handle zero replacement-data length and oversized messages explicitly; every handled worker failure must still end with an escape.

<details>
<summary>Need a hint?</summary>

- Use MSGDTALEN to distinguish the available data length from the receiving buffer capacity.
- SNDPGMMSG MSG(text) cannot send an escape. Supply a predefined MSGID and MSGF, with any replacement text in MSGDTA.

</details>

**Test cases**

1. Make CHECKRUN send CPF9898 from QSYS/QCPFMSG with data "Run R17 rejected": the caller receives CPF9898 with that data, and the extra run diagnostic is in the job log.
2. Make CHECKRUN send a lab CPF-prefixed message defined with no replacement fields: the wrapper re-sends its ID and qualified file without evaluating a zero-length %SST.
3. Make CHECKRUN send a lab message carrying 600 bytes of character replacement data: the caller receives the fallback CPF9898, while the full original message is retained for diagnosis.

**Example**

```cl
PGM PARM(&RUNID)
  DCL VAR(&RUNID) TYPE(*CHAR) LEN(20)
  DCL VAR(&MID) TYPE(*CHAR) LEN(7)
  DCL VAR(&MFILE) TYPE(*CHAR) LEN(10)
  DCL VAR(&MLIB) TYPE(*CHAR) LEN(10)
  DCL VAR(&MDATA) TYPE(*CHAR) LEN(512)
  DCL VAR(&DLEN) TYPE(*DEC) LEN(5 0)

  CALL PGM(APPLAB/CHECKRUN) PARM(&RUNID)
  MONMSG MSGID(CPF0000) EXEC(GOTO CMDLBL(CAPTURE))
  RETURN

CAPTURE:
  RCVMSG PGMQ(*SAME) MSGTYPE(*EXCP) WAIT(0) RMV(*NO) +
      MSGID(&MID) MSGF(&MFILE) MSGFLIB(&MLIB) +
      MSGDTA(&MDATA) MSGDTALEN(&DLEN)
  SNDPGMMSG MSG('CHECKRUN failed for run' *BCAT &RUNID) +
      MSGTYPE(*DIAG)
  IF COND(&MID *EQ ' ' *OR &MFILE *EQ ' ' *OR +
      &MLIB *EQ ' ' *OR &DLEN *GT 512) +
      THEN(GOTO CMDLBL(FALLBACK))
  IF COND(&DLEN *EQ 0) THEN(DO)
    SNDPGMMSG MSGID(&MID) MSGF(&MLIB/&MFILE) +
        MSGTYPE(*ESCAPE)
    RETURN
  ENDDO
  SNDPGMMSG MSGID(&MID) MSGF(&MLIB/&MFILE) +
      MSGDTA(%SST(&MDATA 1 &DLEN)) MSGTYPE(*ESCAPE)
  RETURN

FALLBACK:
  SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
      MSGDTA('CHECKRUN failed; full error is in the job log.') +
      MSGTYPE(*ESCAPE)
ENDPGM
```

**IBM documentation for this exercise**

- [IBM Docs: Receive Message (RCVMSG)](https://www.ibm.com/docs/en/i/7.5.0?topic=r-receive-message)
- [IBM Docs: Send Program Message (SNDPGMMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=s-send-program-message)

</details>

## 43. Probe a lab gate with at most three allocation attempts, pausing two seconds between retryable failures and failing clearly when attempts are exhausted.

**Intermediate** · CLLE bounded allocation retries

<details>
<summary>Explain the answer</summary>

Create APPLAB/RETRYGATE as a lab data area. The routine receives TRIES as packed decimal (3,0), increments it before each attempt, and uses WAIT(0) so ALCOBJ itself does not add an unbounded wait. Its policy retries only CPF1002, the command's cannot-allocate response; other failures propagate immediately. The listing is an allocation probe: after success it releases its allocation and returns the number of attempts.

After the third failed attempt, send an escape without another delay. DLYJOB DLY(2) supplies a real pause between attempts, and CTLEND(*END), as documented on the IBM i 7.5 command, lets a controlled end terminate the waiting job. Inspect preceding diagnostics if allocation remains impossible; CPF1002 alone is not proof that every cause is transient. A real critical operation belongs while the lock is held and needs the cleanup discipline from the data-area exercise; this probe does not reserve future access.

**Task and setup**

- Count attempts before ALCOBJ, use WAIT(0), and allow no more than three attempts and two explicit delays.
- Retry only the documented CPF1002 policy case; preserve all other exceptions and report exhaustion as failure.
- Release a successful allocation and describe how the design changes when real work is added inside the critical section.

<details>
<summary>Need a hint?</summary>

- The limit check belongs before DLYJOB in the failure branch, so exhaustion does not cause an unnecessary final wait.
- A broad MONMSG CPF0000 retry handler could repeatedly retry authorization or damaged-object failures that need intervention.

</details>

**Test cases**

1. With RETRYGATE free, the routine returns TRIES=1, performs no DLYJOB, and leaves the gate available to another job.
2. Hold RETRYGATE in a second job, then release it one second after the first failed attempt: the next attempt after the two-second pause succeeds with TRIES=2.
3. Hold RETRYGATE throughout the test: attempts occur approximately at 0, 2, and 4 seconds, TRIES=3, and CPF9898 is sent without a third delay; allow scheduling overhead.

**Example**

```cl
PGM PARM(&TRIES)
  DCL VAR(&TRIES) TYPE(*DEC) LEN(3 0)

  CHGVAR VAR(&TRIES) VALUE(0)
TRYLOCK:
  CHGVAR VAR(&TRIES) VALUE(&TRIES + 1)
  ALCOBJ OBJ((APPLAB/RETRYGATE *DTAARA *EXCL)) +
      WAIT(0) SCOPE(*JOB)
  MONMSG MSGID(CPF1002) EXEC(GOTO CMDLBL(BUSY))
  DLCOBJ OBJ((APPLAB/RETRYGATE *DTAARA *EXCL)) SCOPE(*JOB)
  RETURN

BUSY:
  IF COND(&TRIES *GE 3) THEN(GOTO CMDLBL(EXHAUSTED))
  DLYJOB DLY(2) CTLEND(*END)
  GOTO CMDLBL(TRYLOCK)
EXHAUSTED:
  SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
      MSGDTA('Gate allocation failed after three attempts.') +
      MSGTYPE(*ESCAPE)
ENDPGM
```

**IBM documentation for this exercise**

- [IBM Docs: Allocate Object (ALCOBJ)](https://www.ibm.com/docs/en/i/7.6.0?topic=ssw_ibm_i_76%2Fcl%2Falcobj.html)
- [IBM Docs: Deallocate Object (DLCOBJ)](https://www.ibm.com/docs/en/i/7.5.0?topic=d-deallocate-object)
- [IBM Docs: Delay Job (DLYJOB)](https://www.ibm.com/docs/en/i/7.5.0?topic=d-delay-job)

</details>

## 44. Route one report wrapper to an interactive preview or a batch report using the actual job type, and record both job identity and current user.

**Intermediate** · CLLE job attributes and batch-safe branching

<details>
<summary>Explain the answer</summary>

Retrieve TYPE into CHAR(1), JOB and USER into CHAR(10), NBR into CHAR(6), and CURUSER into CHAR(10). TYPE returns character 0 for batch and 1 for interactive. Build the qualified job identifier from number/user/name; USER is the job's original user component, while CURUSER reports the current profile. These values answer different diagnostic questions, especially in server or profile-switched work.

Provide APPLAB/BATCHRPT and APPLAB/PREVIEW with the same two input parameters: the qualified job identifier as CHAR(28), then current user as CHAR(10). Only PREVIEW may perform workstation I/O. The wrapper calls exactly one worker and propagates its errors. It does not infer interactivity from the job name, submitter, or current user, and a fallback escape prevents an unexpected type from falling through to a display operation.

**Task and setup**

- Declare each receiver with the documented type and minimum length; retain job USER separately from CURUSER.
- Supply the two lab workers with matching CHAR(28) and CHAR(10) contracts and keep all display I/O in PREVIEW.
- Call one worker according to TYPE and propagate failures without treating a batch invocation as an interactive session.

<details>
<summary>Need a hint?</summary>

- RTVJOBA TYPE returns one-character values, not the strings *BATCH and *INTERACT.
- Do not replace the middle component of a qualified job name with CURUSER; that could identify the wrong job.

</details>

**Test cases**

1. Call from interactive job 123456/LEARNER/DSP01: PREVIEW alone is called and receives "123456/LEARNER/DSP01" padded to CHAR(28).
2. Call in batch job 654321/LEARNER/NIGHTRPT: BATCHRPT alone is called and no workstation input is requested.
3. In a controlled test where job USER=SUBMITTER and CURUSER=RUNNER, the qualified job keeps SUBMITTER while the worker's second parameter is RUNNER; job type still decides the branch.

**Example**

```cl
PGM
  DCL VAR(&TYPE) TYPE(*CHAR) LEN(1)
  DCL VAR(&JOB) TYPE(*CHAR) LEN(10)
  DCL VAR(&USER) TYPE(*CHAR) LEN(10)
  DCL VAR(&NBR) TYPE(*CHAR) LEN(6)
  DCL VAR(&CURUSER) TYPE(*CHAR) LEN(10)
  DCL VAR(&QUALJOB) TYPE(*CHAR) LEN(28)

  RTVJOBA JOB(&JOB) USER(&USER) NBR(&NBR) +
      TYPE(&TYPE) CURUSER(&CURUSER)
  CHGVAR VAR(&QUALJOB) VALUE(&NBR *TCAT '/' *TCAT +
      &USER *TCAT '/' *TCAT &JOB)
  SNDPGMMSG MSG('Job' *BCAT &QUALJOB *BCAT +
      'current user' *BCAT &CURUSER) MSGTYPE(*INFO)
  IF COND(&TYPE *EQ '0') THEN(DO)
    CALL PGM(APPLAB/BATCHRPT) PARM(&QUALJOB &CURUSER)
    RETURN
  ENDDO
  IF COND(&TYPE *EQ '1') THEN(DO)
    CALL PGM(APPLAB/PREVIEW) PARM(&QUALJOB &CURUSER)
    RETURN
  ENDDO
  SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) +
      MSGDTA('Unsupported job type; no report worker was called.') +
      MSGTYPE(*ESCAPE)
ENDPGM
```

**IBM documentation for this exercise**

- [IBM Docs: Retrieve Job Attributes (RTVJOBA)](https://www.ibm.com/docs/en/i/7.6.0?topic=r-retrieve-job-attributes)

</details>

## Checkpoint — 22 MCQs

Answer all questions before checking the key. Aim for 22/22 before continuing.

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

### 13. Complete the line-level half-adjust operation: `lineAmount = _____(rawAmount:15:2);`

A. %dec
B. %int
C. %dech
D. %char

### 14. Complete the guard before reading a second parameter declared OPTIONS(*NOPASS): `if _____; usePrefix = prefix; endif;`

A. %found()
B. %parms() >= 2
C. prefix <> *blanks
D. %open(prefix)

### 15. Complete the latest-customer-shipment lookup after `setgt wantCust Shipment;`: `_____ wantCust Shipment;`

A. read
B. reade
C. setll
D. readpe

### 16. Complete the successful nullable-date check: `if shipInd _____; outcome = 'UNPLANNED'; endif;`

A. < 0
B. = *on
C. > 0
D. = 'NULL'

### 17. Complete the bound after a multi-row FETCH: `for idx = 1 to _____; batchTotal += batch(idx).amount; endfor;`

A. %elem(batch)
B. 20
C. gotRows
D. SQLCODE

### 18. Complete the CLLE read loop so EOF cannot process a stale AMOUNT: `RCVF` followed by `_____`, then `CHGVAR VAR(&TOTAL) VALUE(&TOTAL + &AMOUNT)`.

A. MONMSG MSGID(CPF0000)
B. MONMSG MSGID(CPF0864) EXEC(CHGVAR VAR(&AMOUNT) VALUE(0))
C. MONMSG MSGID(CPF0864) EXEC(GOTO CMDLBL(DONE))
D. MONMSG MSGID(CPF9801) EXEC(GOTO CMDLBL(DONE))

### 19. A CLLE program declares `DCLF FILE(APPDATA/LABCREDIT) OPNID(C)`. Complete the field reference after `RCVF OPNID(C)`: `CHGVAR VAR(&TOTAL) VALUE(&TOTAL + _____)`. The file field is AMOUNT.

A. &C_AMOUNT
B. &LABCREDIT_AMOUNT
C. &AMOUNT(C)
D. &AMOUNT

### 20. Debug this CLLE statement: `SNDPGMMSG MSG('Import rejected') MSGTYPE(*ESCAPE)`. Which replacement correctly sends that text as an escape?

A. SNDPGMMSG MSG('Import rejected') MSGTYPE(*INFO)
B. SNDPGMMSG MSGID(CPF9898) MSG('Import rejected') MSGTYPE(*ESCAPE)
C. SNDPGMMSG MSGDTA('Import rejected') MSGTYPE(*ESCAPE)
D. SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) MSGDTA('Import rejected') MSGTYPE(*ESCAPE)

### 21. Complete the batch-only branch after `DCL VAR(&TYPE) TYPE(*CHAR) LEN(1)` and `RTVJOBA TYPE(&TYPE)`: `IF COND(_____) THEN(GOTO CMDLBL(BATCH))`.

A. &TYPE *EQ '*BATCH'
B. &TYPE *EQ '0'
C. &TYPE *EQ '1'
D. &TYPE *EQ 'B'

### 22. A retry loop increments TRIES before `ALCOBJ ... WAIT(0)` and branches to BUSY only for CPF1002. Complete BUSY so it makes at most three attempts with no delay after the last failure: `_____` then `DLYJOB DLY(2)` then `GOTO CMDLBL(TRYLOCK)`.

A. IF COND(&TRIES *GT 3) THEN(GOTO CMDLBL(EXHAUSTED))
B. CHGVAR VAR(&TRIES) VALUE(0)
C. IF COND(&TRIES *GE 3) THEN(GOTO CMDLBL(EXHAUSTED))
D. MONMSG MSGID(CPF0000) EXEC(RETURN)

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

13. **C — %dech** %DECH half-adjusts a numeric expression to the requested decimal precision. Keep rawAmount at sufficient precision until this step.

14. **B — %parms() >= 2** %PARMS confirms the optional parameter exists. Inspecting prefix itself before that check can access an argument that was never passed.

15. **D — readpe** READPE retrieves the previous record only if its key matches wantCust. With the same explicit partial key, SETGT followed by READPE reaches the last record in that customer group.

16. **A — < 0** A negative SQL output indicator denotes a null result. SQL indicators are small signed integers, and the associated date must not be used for a null result.

17. **C — gotRows** gotRows is copied from SQLERRD(3). Process only the rows returned, including a partial final batch, so stale values in unused elements never enter the total.

18. **C — MONMSG MSGID(CPF0864) EXEC(GOTO CMDLBL(DONE))** CPF0864 is the normal end-of-file exception. Branch out before using the fields because RCVF leaves them unchanged at EOF; clearing one field does not end the loop.

19. **A — &C_AMOUNT** An explicit OPNID prefixes each generated field variable with the identifier and an underscore, so AMOUNT becomes &C_AMOUNT.

20. **D — SNDPGMMSG MSGID(CPF9898) MSGF(QCPFMSG) MSGDTA('Import rejected') MSGTYPE(*ESCAPE)** An escape requires a predefined message ID. CPF9898 accepts the supplied text through MSGDTA; MSG cannot be combined with MSGID or used for an immediate escape.

21. **B — &TYPE *EQ '0'** RTVJOBA TYPE returns character 0 for batch and 1 for interactive. The one-character receiver cannot contain the text *BATCH.

22. **C — IF COND(&TRIES *GE 3) THEN(GOTO CMDLBL(EXHAUSTED))** The third failure must reach EXHAUSTED before the delay. Testing greater than 3 allows a fourth attempt, while resetting TRIES removes the bound.

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

[← Previous](common-issues.md)
