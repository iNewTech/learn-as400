# RPG, RPGLE & RPG IV

[Question index](README.md) · RPG & CL development · Easy

Read legacy code and write clear modern RPG with appropriate types and interfaces.

## 1. What do RPG IV, ILE RPG, RPGLE, and SQLRPGLE mean?

**Easy**

<details>
<summary>Explain the answer</summary>

RPG IV is the language generation commonly associated with ILE RPG. RPGLE is a source-type convention for ILE RPG source; SQLRPGLE identifies source containing embedded SQL that requires the SQL preprocessing/build path. These labels are related but not interchangeable layers.

In a maintenance interview, identify the source format, compiler, SQL build settings, and resulting object. A source member suffix alone does not reveal all runtime characteristics, such as activation group or commitment settings.

</details>

## 2. How does fully free RPG differ from fixed format?

**Easy**

<details>
<summary>Explain the answer</summary>

Fixed-format RPG assigns meaning to particular columns and specification types. Fully free RPG uses free-form declarations and statements, usually beginning with **FREE. It improves readability and makes structured declarations and procedures easier to review.

Changing layout does not automatically remove global state, the RPG cycle, or poor error handling. Modernization should preserve behavior through tests while introducing explicit interfaces and understandable control flow. Verify compiler support before using a newer language feature.

```text
**FREE
dcl-s total packed(11:2) inz(0);
total += amount;
```

</details>

## 3. How do packed, zoned, integer, and character fields differ?

**Easy**

<details>
<summary>Explain the answer</summary>

Packed and zoned decimal represent decimal digits using different storage layouts; integers use binary representation; character fields store text according to encoding rules. Decimal precision and scale affect the valid range and arithmetic results.

Use a domain-appropriate type: money usually needs explicit decimal precision, identifiers may be character even when composed of digits, and counters can be integers. Passing the wrong storage layout to a program can misinterpret bytes even when the displayed values look similar.

</details>

## 4. What are built-in functions used for?

**Intermediate**

<details>
<summary>Explain the answer</summary>

RPG built-in functions provide operations such as conversion, substring extraction, trimming, lookup, and I/O status checks. Examples include %CHAR, %DEC, %SUBST, %TRIM, %FOUND, and %EOF. Their arguments and results have defined types and boundary behavior.

Do not treat conversion as validation. Validate length and syntax, then handle conversion exceptions and range limits. For status functions, specify the relevant file where supported and inspect the result immediately after the operation of interest.

```text
if %found(Customers);
  displayName = %trim(customerName);
endif;
```

</details>

## 5. Why do RETURN and setting LR have different effects?

**Intermediate**

<details>
<summary>Explain the answer</summary>

RETURN transfers control back to the caller. In a traditional RPG main procedure, returning without last-record termination can preserve resources and state for a later call. Setting LR and ending the main procedure performs RPG end-of-program processing, including relevant file cleanup.

Do not apply this simplified rule blindly to every subprocedure or activation group. Explicit cleanup and well-defined initialization are important in long-lived jobs. A program that works once but fails on its second call often exposes retained state assumptions.

</details>

## 6. How do arrays, SORTA, and %LOOKUP work together?

**Intermediate**

<details>
<summary>Explain the answer</summary>

An array stores multiple elements of a defined type. SORTA orders an array according to supported sort options; %LOOKUP searches for an element and returns a matching index or the no-match result. Ordered-array declarations and search variants have specific requirements.

Track the populated portion rather than treating every allocated element as business data. Check bounds and the returned index before access. When sorting parallel information, use a structured representation or a coordinated sort so related values do not become misaligned.

</details>

## 7. Why use date types instead of numeric date arithmetic?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A real date type represents calendar values and supports date-aware operations. Adding 1 to a numeric YYYYMMDD field can produce an invalid date at month or year boundaries. Character formats also require explicit interpretation during conversion.

Validate inbound date format and use supported duration/date operations. Test leap days, month ends, and invalid values. Timestamps and time zones require separate business rules, particularly when IBM i exchanges times with web clients in other regions.

</details>

## 8. How would you safely modernize a large fixed-format program?

**Advanced**

<details>
<summary>Explain the answer</summary>

Capture representative behavior first: normal cases, invalid inputs, rounding, file updates, and error messages. Convert in small reviewable steps and keep business changes separate from mechanical syntax changes.

Then isolate business operations behind typed procedures, reduce global state, and clarify transaction ownership. Compare outputs and side effects against the old version in a controlled environment. A clean-looking free-form rewrite can still change decimal semantics, indicator flow, or record-lock duration if those are not tested.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. What does SQLRPGLE commonly identify?

A. A job description
B. Only fixed-format RPG II
C. A database schema
D. RPG source with embedded SQL

### 2. Which type choice is usually suitable for fixed-scale money?

A. Packed decimal with explicit precision and scale
B. An arbitrary text buffer
C. A job number
D. A pointer

### 3. Does free-form conversion automatically remove global state?

A. Yes, always
B. No
C. Only on Power hardware
D. Only in QTEMP

### 4. Which BIF checks whether CHAIN found a record?

A. %TRIM
B. %CHAR
C. %FOUND
D. %LEN

### 5. A program fails only on its second call in one job. Investigate:

A. Only source indentation
B. Only the terminal emulator
C. Whether the file has a long name
D. Retained state and cleanup

<details>
<summary>Answer key and explanations</summary>

1. **D — RPG source with embedded SQL** It signals the SQL-aware RPG build path.

2. **A — Packed decimal with explicit precision and scale** Decimal arithmetic supports an explicit business rounding and range policy.

3. **B — No** Source layout and program architecture are separate concerns.

4. **C — %FOUND** Check the relevant file status immediately after the read.

5. **D — Retained state and cleanup** RETURN and runtime lifecycles can preserve state across calls.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: ILE RPG reference (7.6)](https://www.ibm.com/docs/it/ssw_ibm_i_76/pdf/sc092508.pdf)
- [IBM Redbooks: Modern RPG](https://www.redbooks.ibm.com/redbooks/pdfs/sg245402.pdf)

[← Previous](sql-cursors.md) · [Next →](rpg-opcodes.md)
