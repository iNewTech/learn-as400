# Binding, calling & signatures

[Question index](README.md) · ILE & application design · Advanced

Evolve public interfaces without surprising existing callers.

## 1. How do dynamic program calls and bound procedure calls differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A dynamic program call identifies a program object for invocation. A bound procedure call uses an imported/exported procedure relationship established by binding and activation. They have different interface and deployment considerations.

Choose based on the contract and architecture, not a slogan that one is always superior. A stable procedure interface is useful for shared business services; a dynamic program entry may suit an orchestration boundary. Both need compatible arguments and intentional object resolution.

</details>

## 2. What are imports and exports?

**Intermediate**

<details>
<summary>Explain the answer</summary>

An export is a symbol a module or service program makes available. An import is a reference that requires a matching implementation. The binder resolves imports using the selected modules, service programs, and directories.

An unresolved import can reflect a missing provider, spelling or case mismatch, unexported procedure, or incorrect build environment. Inspect the bind listing and provider’s exports. Do not add unrelated libraries until the error happens to disappear.

</details>

## 3. What is binder language used for?

**Advanced**

<details>
<summary>Explain the answer</summary>

Binder language defines the ordered public exports and their signature levels for a service program. It is a declaration of the public surface, not executable CL business logic. It allows interface evolution to be managed deliberately.

Keep export order stable and append compatible additions. Decide whether to use explicit signatures or generated signature levels according to a documented compatibility policy. Never hide an incompatible parameter change behind an unchanged signature.

**Example**

```cl
STRPGMEXP PGMLVL(*CURRENT) SIGNATURE('ORDERAPI_V1')
  EXPORT SYMBOL('ValidateOrder')
ENDPGMEXP
```

</details>

## 4. When can callers use a changed service program without rebinding?

**Advanced**

<details>
<summary>Explain the answer</summary>

A compatible implementation change that preserves the supported signature and procedure contracts can avoid rebuilding all consumers. The deployment must still account for objects already active in long-lived jobs.

Adding exports requires correct binder management. Removing or reordering existing exports, or altering their parameter contracts, can break compatibility. Verify old callers against the new object and plan job recycling or activation renewal as required by the runtime situation.

</details>

## 5. How do you investigate a signature violation?

**Advanced**

<details>
<summary>Explain the answer</summary>

Identify the actual service-program library and object used at activation. Compare its supported signatures with the caller’s bound expectations and the intended build artifacts. This can expose a mismatched promotion or incorrect environment resolution.

Rebuild or restore a compatible set according to the release plan. Do not change signature text merely to silence the check; the underlying procedure contracts and export order must remain compatible. Record which consumers require coordinated rebuilding.

</details>

## 6. Why is EXPORT(*ALL) often a poor long-term API policy?

**Advanced**

<details>
<summary>Explain the answer</summary>

Exporting everything can accidentally make internal procedures part of the consumer-visible contract. Later cleanup then becomes a compatibility issue. A narrowly maintained binder source makes the intended public interface reviewable.

Use explicit exports for reusable services and keep helper routines private where possible. Treat a new public procedure like an API addition: document types, side effects, transaction behavior, and errors. Broad export choices may be convenient during exploration, but deserve review before stable deployment.

</details>

## Checkpoint — 5 MCQs

Answer all questions before checking the key. Aim for 5/5 before continuing.

### 1. A binder signature validates which thing most directly?

A. The service program export interface identity
B. Every runtime parameter byte
C. The database row contents
D. The user password

### 2. Where should a compatible new export normally be added?

A. Before every old export
B. At the end of the existing ordered exports
C. By randomly reordering the list
D. By deleting unused-looking exports

### 3. What should you inspect for an unresolved import?

A. Only CPU utilization
B. Only printer setup
C. Provider exports and bind listing
D. Only job-log retention

### 4. What is risky about EXPORT(*ALL)?

A. It disables compilation
B. It deletes source
C. It prevents all calls
D. Accidentally exposing internal procedures

### 5. Can changing signature text alone repair an incompatible ABI?

A. No
B. Yes, always
C. Only for numeric parameters
D. Only for a new job

<details>
<summary>Answer key and explanations</summary>

1. **A — The service program export interface identity** It does not perform full parameter-layout compatibility checking.

2. **B — At the end of the existing ordered exports** Stable positions preserve existing consumers under the compatibility rules.

3. **C — Provider exports and bind listing** The binder needs a matching exported symbol from a selected provider.

4. **D — Accidentally exposing internal procedures** An accidental public surface makes future changes harder to manage safely.

5. **A — No** The procedure contract must actually remain compatible or callers must be rebuilt.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Service program signature](https://www.ibm.com/docs/en/i/7.6?topic=language-signature)
- [IBM: Binder language](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-binder-language)
- [IBM: Binder functions](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-binder-functions)

[← Previous](ile-objects.md) · [Next →](activation-groups.md)
