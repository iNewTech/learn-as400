# RPG development: from opcodes to procedures

[Learning path index](README.md) · Intermediate

Learn RPGLE variables, decimal calculations, arrays, date validation and procedure parameters with fixed-format and fully free examples and test cases.

Updated: 2026-10-11.

## Outcomes

- Read an RPG program as declarations, calculations, I/O, and procedure calls.
- Translate a fixed-format operation into modern free-form RPG deliberately.
- Explain parameter contracts, indicators, data structures, and test seams.

## 1. Read RPG in the order the compiler sees it

Begin with control options and file or data declarations. Then identify entry parameters, procedures, and the main business operation. Finally trace I/O and status checks. This order is more reliable than starting at the first calculation line and guessing what every field means.

RPG opcodes express intent such as CHAIN, SETLL, READE, UPDATE, CALL, and EXSR. Built-in functions such as %FOUND, %EOF, %TRIM, and %SUBST report state or transform values. Say what state each operation changes before explaining syntax.

**Flow**

1. Declare files, prototypes, and data
2. Receive parameters and validate input
3. Read or query the required records
4. Apply business rules in a procedure
5. Write results and return a clear status

## 2. Fixed format and fully free format carry the same intent

Fixed-format RPG is common in maintenance code because its columns carry meaning. Fully free RPG makes declarations and operations easier to review in new work. The important interview skill is preserving behavior while making status handling and data scope clearer.

Keep examples small enough to test. A keyed read should show the found check, and a write should show the validation and error path.

**One behavior, two source styles**

**Fixed format**

```rpgle
C     orderId       CHAIN     OrderRec
C                   IF        %FOUND(Orders)
C                   EVAL      status = 'READY'
C                   UPDATE    OrderRec
C                   ENDIF
```

**Fully free RPG**

```rpgle
**FREE
chain orderId OrderRec;
if %found(Orders);
  status = 'READY';
  update OrderRec;
endif;
```

## 3. Use procedures as contracts

A procedure should have a clear purpose, typed parameters, and a predictable result. Put conversion, validation, and database access behind small procedures so a test can exercise them without running an entire display program.

For subfiles and display files, keep screen flow separate from data retrieval. The UI procedure can request a page of rows; a data procedure can own the key range and status rules.

**Procedure skeleton**

**Fully free RPG**

```rpgle
dcl-pr buildGreeting varchar(80);
  customerId packed(9:0) const;
end-pr;

dcl-proc buildGreeting;
  dcl-pi *n varchar(80);
    customerId packed(9:0) const;
  end-pi;
  // validate, read, and return one explicit result
end-proc;
```

## 4. Choose decimal precision before calculating an invoice

An RPG declaration describes the values a variable can hold. PACKED(9:2) provides nine decimal digits in total, with two after the decimal point. That leaves seven digits before it. This matters when a small unit price is multiplied by a large quantity, or when a total accumulates many lines. A field that displays today’s examples can still overflow at the business maximum.

The fragments below start with an exact decimal value of 12.345 and place it in a two-decimal result. Ordinary assignment drops the extra fractional digit here, giving 12.34. EVAL(H) applies half adjustment, giving 12.35. The point is to make the rounding policy visible, not to round every intermediate calculation automatically.

For an invoice, agree whether the business rounds each line or the final sum; the results can differ. Test positive and negative adjustments, zero, a half-cent boundary and the largest permitted amount. Keep money in an appropriate decimal representation and reserve formatted text for the display or export boundary.

**Decimal declaration and calculation fragments in both RPG styles**

**Fixed format**

```rpgle
     Draw              S              7P3  INZ(12.345)
     Damount           S              9P2  INZ(0)
     C                   EVAL      amount = raw
     C                   EVAL(H)   amount = raw
```

**Fully free RPG**

```rpgle
dcl-s raw packed(7:3) inz(12.345);
dcl-s amount packed(9:2) inz(0);

amount = raw;       // 12.34
eval(h) amount = raw; // 12.35
```

## 5. Use SORTA and %LOOKUP only on populated array elements

An array’s capacity and its business row count are different. You may allocate one hundred elements while receiving only three values. Sorting every allocated element can move unused zero or blank entries ahead of real data. Track the populated count, validate it against the capacity, and use the same range for sorting, searching and processing.

In the calculation fragments below, nums has capacity 5 and the first three entries are 30, 10 and 20. The remaining slots are unused. Sorting the populated portion produces 10, 20, 30. Looking up 20 returns index 2; searching for 99 returns 0. Check the returned index before accessing nums(pos), because element zero is not a valid match.

Sorting is not required for every basic equality lookup. Ordered-array declarations and other lookup variants carry additional requirements. Also avoid sorting customer numbers independently from a parallel array of customer names: the relationship would be lost. Use a record-like data structure when several values belong together.

**Array calculation fragments: declare nums, used and pos first**

**Fixed format**

```rpgle
     C                   EVAL      used = 3
     C                   EVAL      nums(1) = 30
     C                   EVAL      nums(2) = 10
     C                   EVAL      nums(3) = 20
     C                   IF        used > 0 and used <= %elem(nums)
     C                   SORTA(A)  %subarr(nums:1:used)
     C                   EVAL      pos = %lookup(20:nums:1:used)
     C                   ENDIF
```

**Fully free RPG**

```rpgle
used = 3;
nums(1) = 30;
nums(2) = 10;
nums(3) = 20;
if used > 0 and used <= %elem(nums);
  sorta(a) %subarr(nums:1:used);
  pos = %lookup(20:nums:1:used);
  // Access nums(pos) only when pos > 0.
endif;
```

## 6. Validate an incoming date before using it

A ten-character field containing 2026-02-30 looks like a date but does not identify a real calendar day. Treat incoming screen, CSV and API values as text until validation succeeds. An explicit format also avoids depending on the job’s date format when interpreting an integration payload.

The fragments convert ISO-formatted text inside a small MONITOR block. Declare rawDate as CHAR(10), orderDate as DATE and validDate as an indicator before using them. For 2026-02-28, conversion succeeds and validDate stays on. For 2026-02-30, the error path turns it off. The caller must check the flag before reading orderDate; a failed assignment does not establish a valid replacement value.

Keep this monitor narrow so a later file or calculation failure is not mislabeled “invalid date.” Report the offending input and expected format to the caller. Test a leap-day input, blank text, wrong separators and an impossible day. If a blank means “not supplied,” handle that business case separately from a malformed date.

**Date-validation calculation fragments — declarations required**

**Fixed format**

```rpgle
     C                   EVAL      validDate = *on
     C                   MONITOR
     C                   EVAL      orderDate = %date(rawDate:*iso)
     C                   ON-ERROR
     C                   EVAL      validDate = *off
     C                   ENDMON
```

**Fully free RPG**

```rpgle
validDate = *on;
monitor;
  orderDate = %date(rawDate:*iso);
on-error;
  validDate = *off;
endmon;
// Do not use orderDate unless validDate is on.
```

## 7. Make procedure parameters explain who can change the data

A prototype is a contract between an RPG caller and a procedure. It describes the return type, parameter types and passing rules. A matching procedure interface describes the implementation side. CONST marks a read-only reference parameter: the procedure must not change it through that parameter. An ordinary reference parameter can be used to return a changed value, so its purpose needs to be clear at the call site.

The prototype below describes calculateTax: it receives a decimal amount and returns a decimal tax value. It is a declaration fragment, not an implementation. In a real example, the procedure interface must match and the body must apply the agreed tax and rounding rules. Keep the shared prototype in a controlled copy member so callers do not maintain divergent definitions.

Use small tests with known amounts to verify the contract before connecting screens or files. A useful test also confirms that the input value is unchanged after the call. When parameter size or meaning must change, review every caller; an unchanged procedure name does not make incompatible interfaces safe.

**Prototype declaration fragments — implementation and matching PI required**

**Fixed format**

```rpgle
     DcalculateTax     PR             9P2
     DbaseAmount                      9P2  CONST
```

**Fully free RPG**

```rpgle
dcl-pr calculateTax packed(9:2);
  baseAmount packed(9:2) const;
end-pr;

// Example call once the procedure is implemented and bound:
// tax = calculateTax(invoiceAmount);
```

<details>
<summary>Quick Revision · 2-minute recap</summary>

### Keep these in mind

- Declarations describe data types, files and callable interfaces.
- Use appropriately sized numeric and character fields.
- Keep populated array count separate from allocated capacity.
- SORTA changes order; check a %LOOKUP result before indexing.
- Use procedures with explicit parameters instead of hidden global state.
- Handle not-found and I/O exceptions as different paths.

**Fully free fragment; call only when usedCount > 0**

```text
index = %lookup(wanted : codes : 1 : usedCount);
if index > 0;
  // Use codes(index).
endif;
```

**Common mistake:** Sorting one of several parallel arrays can break the relationship between their elements.

**Think it through:** A lookup returns index zero. Can you use array(index)?

<details>
<summary>Show the reasoning</summary>

No. Branch on the no-match result before accessing an element.

</details>

</details>

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [RPG, RPGLE & RPG IV](rpg-foundations.md), [RPG opcodes & indicators](rpg-opcodes.md), [RPG procedures & data structures](rpg-procedures.md), [Display files, subfiles & printing](display-print-subfiles.md), [Coding lab: RPGLE and CL from fixed to free form](coding-exercises.md).

## IBM documentation

- [IBM: Ensuring arithmetic accuracy](https://www.ibm.com/docs/ssw_ibm_i_74/rzasd/arithacc.htm)
- [IBM: Array operations](https://www.ibm.com/docs/en/i/7.5.0?topic=operations-array)
- [IBM: SORTA and array portions](https://www.ibm.com/docs/en/i/7.6.0?topic=codes-sorta-sort-array)
- [IBM: MONITOR operation](https://www.ibm.com/docs/en/i/7.5.0?topic=codes-monitor-begin-monitor-group)
- [IBM: CONST and read-only reference parameters](https://www.ibm.com/docs/en/i/7.5.0?topic=keywords-constconstant)
- [IBM: Prototyped parameter definitions](https://www.ibm.com/docs/en/i/7.5.0?topic=specifications-definition-prototyped-parameter)
- [IBM: %DATE conversion](https://www.ibm.com/docs/ssw_ibm_i_74/rzasd/bbdate.htm)
- [IBM: ILE RPG reference (7.6)](https://www.ibm.com/docs/it/ssw_ibm_i_76/pdf/sc092508.pdf)
- [IBM Redbooks: Modern RPG](https://www.redbooks.ibm.com/redbooks/pdfs/sg245402.pdf)
- [IBM Docs: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM: Keys for file operations](https://www.ibm.com/docs/ssw_ibm_i_74/rzasd/fileopkeys.htm)
- [IBM: Service program signature](https://www.ibm.com/docs/en/i/7.6?topic=language-signature)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: SFLSIZ keyword](https://www.ibm.com/docs/en/i/7.5.0?topic=80-sflsiz-subfile-size-keyword-display-files)
- [IBM: Subfile record selection example](https://www.ibm.com/support/pages/rpg-subfile-example-record-selection)
- [IBM: SFLNXTCHG behavior](https://www.ibm.com/support/pages/using-sflmltchc-and-sflnxtchg-same-subfile)
- [IBM Docs: RPG IV Reference](https://www.ibm.com/docs/en/i/7.4.0?topic=languages-rpg-iv)
- [IBM Docs: RPG built-in functions](https://www.ibm.com/docs/en/i/7.4.0?topic=functions-built-in)
- [IBM Docs: RPG procedures and prototypes](https://www.ibm.com/docs/en/i/7.5.0?topic=parameters-prototypes)
- [IBM Docs: Embedded SQL programming](https://www.ibm.com/docs/en/ssw_ibm_i_74/pdf/rbafzpdf.pdf)
- [IBM Docs: CL programming](https://www.ibm.com/docs/en/i/7.5.0?topic=language-control-language)
- [IBM Docs: Monitor Message (MONMSG)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fmonmsg.html)
- [IBM Docs: Submit Job (SBMJOB)](https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75%2Fcl%2Fsbmjob.html)
- [IBM Docs: Override with Database File (OVRDBF)](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fovrdbf.html)
- [IBM Docs: Data queues](https://www.ibm.com/docs/en/i/7.4.0?topic=apis-data-queues)

[← Previous path](learning-db2-for-i.md) · [Next path →](learning-jobs-and-cl.md)
