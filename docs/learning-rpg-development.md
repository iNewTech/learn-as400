# RPG development: from opcodes to procedures

[Learning path index](README.md) · Intermediate

This path uses simple explanations, safe code skeletons, and IBM i commands before the detailed question chapters.

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

**Fixed format**

```rpgle
C     orderId       CHAIN     OrderRec
C                   IF        %FOUND(Orders)
C                   EVAL      status = 'READY'
C                   UPDATE    OrderRec
C                   ENDIF
```

**Fully free**

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

**Fully free**

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

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [RPG, RPGLE & RPG IV](rpg-foundations.md), [RPG opcodes & indicators](rpg-opcodes.md), [RPG procedures & data structures](rpg-procedures.md), [Display files, subfiles & printing](display-print-subfiles.md), [Coding lab: RPGLE and CL from fixed to free form](coding-exercises.md).

## IBM documentation

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
