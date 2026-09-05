# RPG procedures & data structures

[Question index](README.md) · RPG & CL development · Intermediate

Design typed contracts, manage storage lifetime, and prevent parameter mismatches.

## 1. What is the difference between a prototype and a procedure interface?

**Easy**

<details>
<summary>Explain the answer</summary>

A prototype describes a callable contract to the compiler at the call site. The procedure interface describes the parameters and return type within the implementation. Keep their types, lengths, passing conventions, and options compatible.

A shared definition reduces drift. A mismatch can corrupt data or storage even if a call binds successfully. Compiler checking is strongest when callers have the correct prototype and are rebuilt when the contract changes.

</details>

## 2. How do value, reference, and CONST parameters differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Reference passing gives access to caller-provided storage, so the callee can normally alter it. VALUE passes a value according to the supported ABI. CONST expresses a read-only reference contract and may allow compatible expressions or temporary values.

Choose based on semantics, not just performance folklore. Use an output parameter deliberately when the caller should receive a change. Do not pass short storage to an interface expecting a larger structure; the callee’s declaration is not proof of the caller’s actual buffer size.

</details>

## 3. Why use qualified data structures and templates?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Qualified data structures scope field references under the structure name, reducing collisions and making ownership visible. Templates and LIKE/LIKEDS-style definitions keep related layouts consistent. This is especially useful for request/response contracts and external record definitions.

Avoid copying field definitions into many programs. When the source layout changes, rebuild and validate dependent contracts rather than assuming a shared template magically updates already compiled callers.

**Example**

```cl
dcl-ds order qualified;
  id int(10);
  total packed(11:2);
end-ds;
order.total = 0;
```

</details>

## 4. How do automatic and static storage affect repeat calls?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Automatic local storage has an invocation lifetime. Static storage persists according to its program or activation lifetime. Global variables and explicitly static local state can retain values across calls.

Use automatic data for independent request processing where possible. If state must persist, define who initializes, resets, and synchronizes it. Long-lived server jobs and concurrent execution expose bugs that short interactive test runs can hide.

</details>

## 5. How should a procedure report business failure versus technical failure?

**Advanced**

<details>
<summary>Explain the answer</summary>

A business rejection, such as insufficient stock, should have a defined result the caller can handle. A technical failure, such as database unavailability or a malformed API response, needs diagnostic context and a recovery policy.

Design explicit result/status contracts and preserve relevant messages. Document whether the procedure commits, leaves rollback to the caller, or has external side effects. Returning a Boolean alone may hide whether retrying is safe or whether partial work occurred.

</details>

## 6. Can an unchanged service-program signature prove parameter compatibility?

**Advanced**

<details>
<summary>Explain the answer</summary>

No. A service-program signature identifies an exported interface list, not a full runtime validation of each parameter layout. Changing a parameter’s type, length, or passing convention can break callers even if an explicit signature remains unchanged.

Version the procedure contract or coordinate caller recompilation and rebinding for incompatible changes. Keep old entry points as adapters when practical. Add tests that exercise old and new callers, not merely a check that activation succeeds.

**Example**

```cl
Old: customer ID packed(7:0)
New: customer ID char(12)
Same export name does not make these ABI compatible.
```

</details>

## Checkpoint — 5 MCQs

Answer all questions before checking the key. Aim for 5/5 before continuing.

### 1. Which definition informs the caller about parameters?

A. Job description
B. Prototype
C. Access path
D. Output queue

### 2. Which parameter convention normally permits modifying caller storage?

A. Read-only CONST
B. A copied VALUE input only
C. Reference
D. No parameters

### 3. Why qualify data-structure fields?

A. To force an SQL commit
B. To run in a new subsystem
C. To eliminate all compile dependencies
D. To make ownership explicit and avoid collisions

### 4. Which state can survive procedure calls?

A. Static storage
B. Every automatic local forever
C. Only SQL null indicators
D. No RPG state ever

### 5. Does a matching binder signature validate each parameter type?

A. Yes, all byte layouts
B. No
C. Only for packed values
D. Only on 7.6

<details>
<summary>Answer key and explanations</summary>

1. **B — Prototype** The prototype supplies compile-time information at the call site.

2. **C — Reference** Reference parameters can expose the caller’s storage directly.

3. **D — To make ownership explicit and avoid collisions** Qualified names clarify which structure owns a field.

4. **A — Static storage** Storage lifetime matters in repeated and long-lived execution.

5. **B — No** The binder signature does not replace a compatible procedure ABI.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: ILE RPG reference (7.6)](https://www.ibm.com/docs/it/ssw_ibm_i_76/pdf/sc092508.pdf)
- [IBM Redbooks: Modern RPG](https://www.redbooks.ibm.com/redbooks/pdfs/sg245402.pdf)
- [IBM: Service program signature](https://www.ibm.com/docs/en/i/7.6?topic=language-signature)

[← Previous](rpg-opcodes.md) · [Next →](cl-clle.md)
