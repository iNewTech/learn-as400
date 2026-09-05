# RPG opcodes & indicators

[Question index](README.md) · RPG & CL development · Intermediate

Choose the right operation and explain boundary cases rather than memorizing names.

## 1. When do you use SETGT rather than SETLL?

**Easy**

<details>
<summary>Explain the answer</summary>

SETLL positions at the first key greater than or equal to the search argument. SETGT positions beyond equal keys. Subsequent reads determine the actual record transfer. Both are positioning operations.

Use SETGT when the boundary is exclusive, such as moving beyond a completed key group. Consider key order and partial-key behavior. Test exact match, absent key, before-first, and after-last cases to explain the difference convincingly.

</details>

## 2. How do READP and READPE differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

READP retrieves the previous record in the access-path sequence. READPE retrieves a previous record while restricting processing to the equal-key group. Correct positioning before backward traversal is essential.

For reverse processing of a key group, position after the group and then read backward using the matching key. Check the appropriate status after every read. Do not describe previous as necessarily a smaller business value when the access path includes descending key fields.

</details>

## 3. What does the E extender do, and how is it different from MONITOR?

**Intermediate**

<details>
<summary>Explain the answer</summary>

For operations that support it, the E extender routes operation errors to status handling that the program can inspect, such as %ERROR and %STATUS. MONITOR/ON-ERROR establishes a structured exception-handling region for eligible exceptions.

Choose a consistent local handling strategy, and remember that already-handled errors do not automatically follow the same path as unhandled exceptions. Embedded SQL reports its own SQL status; it must be checked explicitly rather than assumed to enter RPG ON-ERROR.

</details>

## 4. What do EXFMT and READC do in display-file processing?

**Intermediate**

<details>
<summary>Explain the answer</summary>

EXFMT writes a display record format and then reads the response. READC retrieves changed subfile records, allowing an application to process the user’s selected or edited rows. Their roles are different from ordinary disk-file scanning.

Validate function keys and user options before updates. Subfile changed-state behavior, including indicators that mark records for reprocessing, affects what READC returns. Keep screen interaction outside long database transactions where practical.

</details>

## 5. How do CLEAR, RESET, and initialization differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

CLEAR sets an item to its type-appropriate default clearing value. RESET restores the saved initialization/reset value according to the item’s definition and runtime rules. INZ defines initialization at the relevant storage lifetime.

Use these deliberately for request state. A business default of status NEW is not necessarily the same as blanks. Test data structures containing initialized fields, and avoid assuming that each procedure call reconstructs all static storage from its declarations.

</details>

## 6. How do EVAL-CORR and whole-structure assignment differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

EVAL-CORR assigns corresponding compatible subfields by name according to RPG’s rules. A whole-structure assignment has its own type and layout requirements. Neither should be used without understanding which fields are actually copied.

For request mapping, verify renamed, absent, incompatible, and nested fields explicitly. Initialize the target deliberately so fields not assigned do not retain stale request data. A statement compiling successfully is not a substitute for confirming the intended mapping.

</details>

## 7. How do a subroutine and subprocedure differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A traditional subroutine invoked with EXSR shares the enclosing program’s context and has no independent typed parameter interface like a subprocedure. A subprocedure can define local data, parameters, a return value, and a reusable call contract.

Use procedures to make dependencies and testing clearer, but do not assume merely moving code removes global references. During refactoring, identify every input, output, file side effect, and indicator dependency, then express them through an intentional interface.

</details>

## 8. Why are numeric indicators risky in large programs?

**Advanced**

<details>
<summary>Explain the answer</summary>

Numeric indicators often combine unrelated meanings such as file status, screen options, and business flags. A distant operation can alter a shared indicator, making the control flow difficult to reason about.

Replace business-state uses with named Boolean fields where feasible, and use explicit file status BIFs for I/O. Preserve externally defined display indicators where needed through named mappings. Refactor incrementally because an apparently unused indicator may still control an output specification or DDS condition.

</details>

## Checkpoint — 5 MCQs

Answer all questions before checking the key. Aim for 5/5 before continuing.

### 1. Which operation skips past keys equal to the boundary?

A. SETGT
B. SETLL
C. CHAIN
D. WRITE

### 2. Which operation reads changed subfile records?

A. READP
B. READC
C. READE
D. COMMIT

### 3. EXFMT combines which actions?

A. Commit and rollback
B. Open and close every file
C. Write and then read a display format
D. Submit and end a job

### 4. Does RPG MONITOR replace SQLSTATE checks?

A. Yes, for every SQL error
B. Only for SELECT
C. Only in named activation groups
D. No

### 5. Which operation restores a reset value rather than simply clearing?

A. RESET
B. CLEAR
C. DELETE
D. SETGT

<details>
<summary>Answer key and explanations</summary>

1. **A — SETGT** SETGT uses a strict greater-than positioning boundary.

2. **B — READC** READC is intended for changed subfile rows.

3. **C — Write and then read a display format** EXFMT performs the display exchange.

4. **D — No** Embedded SQL has its own diagnostic status contract.

5. **A — RESET** RESET and CLEAR have different semantics when initialized values are non-default.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM: Keys for file operations](https://www.ibm.com/docs/ssw_ibm_i_74/rzasd/fileopkeys.htm)
- [IBM: ILE RPG reference (7.6)](https://www.ibm.com/docs/it/ssw_ibm_i_76/pdf/sc092508.pdf)

[← Previous](rpg-foundations.md) · [Next →](rpg-procedures.md)
