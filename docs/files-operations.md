# Files & native file operations

[Question index](README.md) · Data & database · Easy

Read, position, update, and diagnose record-oriented database access.

## 1. How do CHAIN, SETLL, and READ differ?

**Easy**

<details>
<summary>Explain the answer</summary>

CHAIN retrieves a matching record using a key or relative record number. SETLL positions the access path at a lower limit without transferring a record into program fields. READ retrieves the next record in the current access-path sequence.

Choose based on intent: one known customer suggests CHAIN; a range scan suggests positioning followed by sequential reads. Check the result immediately because a failed input operation leaves the previous field values in place.

```text
chain customerId Customers;
if %found(Customers);
  // Use the retrieved customer
endif;
```

**Interview pitfall:** SETLL is not a read, and a failed CHAIN does not clear the record buffer.

</details>

## 2. How do you process all records for one key?

**Easy**

<details>
<summary>Explain the answer</summary>

Position with SETLL, then use READE to retrieve records whose key matches the search argument. Continue until the equal-key group ends, checking %EOF for that file. Use a correctly typed composite or partial key when appropriate.

Do not use a plain READ loop without also checking the group boundary; it can continue into the next customer or order. Include a no-match test, a one-record test, and a multi-record group test.

```text
setll customerId Orders;
reade customerId Orders;
dow not %eof(Orders);
  // Process current order
  reade customerId Orders;
enddo;
```

</details>

## 3. What is the difference between input and update file reads?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Reading an update-capable disk file normally obtains a record lock for update. The N extender requests a nonlocking read for the supported input operations. An input-only file does not provide the same update path.

Choose the lock deliberately. Reading without a lock and then writing back a computed value can lose another job’s change unless you re-read under protection or use an optimistic predicate. Commitment control can retain transaction locks beyond the simple native-I/O lifecycle.

```text
chain(n) customerId Customers; // inquiry intent
```

**Interview pitfall:** No-lock inquiry is not a complete concurrent-update algorithm.

</details>

## 4. What do WRITE, UPDATE, and DELETE require?

**Intermediate**

<details>
<summary>Explain the answer</summary>

WRITE creates a record, UPDATE changes an existing record under the relevant file and lock rules, and DELETE removes a record. Externally described file operations may refer to a record format rather than the file name, depending on the opcode.

Validate found status and handle duplicate-key, constraint, and lock errors. For multi-step business work, plan a transaction rather than assuming successful individual operations guarantee a consistent result. Confirm whether triggers or constraints add further behavior.

</details>

## 5. What is an open data path, and why does sharing matter?

**Intermediate**

<details>
<summary>Explain the answer</summary>

An open data path holds runtime access state for an open file, including access method and positioning. Sharing can reduce repeated opens but can also share state between users of that path inside the applicable scope.

If one routine positions or reads a shared path, another routine may observe a changed position. When debugging surprising reads, inspect open options, sharing, overrides, and activation scope. Prefer explicit ownership of iteration instead of relying on an invisible shared cursor.

</details>

## 6. How do you explicitly control file opening with USROPN?

**Intermediate**

<details>
<summary>Explain the answer</summary>

USROPN prevents the normal automatic open for the applicable RPG file definition, making the program responsible for OPEN before use and CLOSE at the intended point. It is useful when configuration or overrides must be established before opening.

Check open errors and ensure cleanup on both normal and error paths. In a reused program, do not blindly OPEN an already open file. %OPEN can help express the intended lifecycle, but the code must still own the resource consistently.

```text
dcl-f Orders usage(*input) keyed usropn;
if not %open(Orders);
  open Orders;
endif;
// Read and handle status
close Orders;
```

</details>

## 7. How can OVRDBF change a program without recompiling it?

**Advanced**

<details>
<summary>Explain the answer</summary>

OVRDBF can redirect a file reference to another file or member and alter supported open attributes. The effective override must be in scope when the file opens; an already open path may continue to use its existing target.

Inspect overrides in the actual failing job, not a separate terminal session. Clean up temporary overrides at the intended scope. Record-format compatibility still matters, so redirecting a file does not safely erase layout differences.

```text
OVRDBF FILE(ORDERS) TOFILE(TEST/ORDERS) MBR(TESTDATA)
/* Open and run the intended test, then remove the override. */
```

**Interview pitfall:** An override is not automatically visible in a different submitted job.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Which operation positions without transferring a record?

A. CHAIN
B. READ
C. READE
D. SETLL

### 2. After a failed CHAIN, record fields are:

A. Potentially still holding the previous values
B. Automatically all zero
C. Automatically NULL
D. Guaranteed blank

### 3. Which loop stays within an equal-key group?

A. WRITE followed by READ
B. SETLL followed by READE
C. SETGT followed by DELETE
D. OPEN followed by UPDATE

### 4. What does CHAIN(N) request on an update disk file?

A. A new record
B. A commit
C. A read without obtaining the normal update lock
D. A next-member scan

### 5. An override is added after the file is already open. What must you inspect?

A. Only the source member name
B. Only the job priority
C. The printer device
D. The existing open data path and override scope

<details>
<summary>Answer key and explanations</summary>

1. **D — SETLL** SETLL changes access-path position; retrieval requires a read operation.

2. **A — Potentially still holding the previous values** Always check %FOUND before consuming the buffer.

3. **B — SETLL followed by READE** READE retrieves the equal-key group until the relevant EOF condition.

4. **C — A read without obtaining the normal update lock** N is a nonlocking input extender; it does not make a later update automatically safe.

5. **D — The existing open data path and override scope** The current open path may already have resolved the file and member.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM: Keys for file operations](https://www.ibm.com/docs/ssw_ibm_i_74/rzasd/fileopkeys.htm)
- [IBM: RPG record locking](https://www.ibm.com/docs/en/i/7.5.0?topic=gfc-record-locking)
- [IBM: OPEN and USROPN](https://www.ibm.com/docs/en/i/7.6.0?topic=codes-open-open-file-processing)

[← Previous](objects-libraries.md) · [Next →](dds-pf-lf.md)
