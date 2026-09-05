# ILE: modules, programs & services

[Question index](README.md) · ILE & application design · Intermediate

Understand what gets compiled, bound, activated, and shared.

## 1. What problem does ILE solve?

**Easy**

<details>
<summary>Explain the answer</summary>

The Integrated Language Environment supports modular applications and compatible calls across participating languages. It separates compilation into modules from binding into executable objects and provides runtime organization through activation groups.

The practical benefit is reusable procedures with explicit contracts. A CL orchestration layer can call RPG business logic and other ILE routines without placing all code in one source member. Modularity still requires versioning, ownership, and build discipline.

</details>

## 2. Is a module directly callable with CALL?

**Easy**

<details>
<summary>Explain the answer</summary>

A *MODULE is a compiled unit intended for binding. It is not a standalone *PGM you invoke with the CL CALL command. A program or service program incorporates modules and exposes the appropriate callable entry points.

If asked to deploy a recompiled module, explain which containing objects must be updated or rebuilt. Copying a new module into the library does not automatically replace the code already bound into a program.

```text
CRTRPGMOD → *MODULE
CRTPGM → *PGM
CRTSRVPGM → *SRVPGM
```

</details>

## 3. How do a program and service program differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A *PGM provides a program entry point for a program call. A *SRVPGM supplies exported procedures or data used by bound consumers. A service program is normally invoked through those procedure references, not by issuing CALL to it as though it were a program.

Use service programs for stable shared business functions, and keep their public surface small. Document runtime state and transaction ownership because sharing reusable code does not automatically make it stateless or independently transactional.

</details>

## 4. What is bind by copy versus bind by reference?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Modules selected for an ILE program or service program are copied into that object during binding. References to supplying service programs remain references and are resolved into callable addresses during activation.

Consequently, replacing a standalone module does not refresh programs that copied it. Compatible service-program implementation changes can be deployed differently, but active jobs and interface compatibility still require planning. Inspect dependencies and restart/activation behavior during rollout.

</details>

## 5. What does a binding directory contain?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A binding directory lists modules and service programs that the binder can search to resolve imports. It is a build-time resolution aid, not a runtime queue, source-code repository, or container of executable copies.

The existence of an entry does not mean every object in the directory is pulled into a program. Resolution follows binder rules and unresolved imports. Keep directories intentional and qualified enough to avoid binding an unexpected library’s implementation.

</details>

## 6. How would you split a monolithic application into service programs?

**Advanced**

<details>
<summary>Explain the answer</summary>

Identify stable business capabilities such as pricing, customer validation, or posting. Define typed contracts that avoid leaking internal file layouts unnecessarily. Separate user-interface, orchestration, and persistence decisions where that clarifies ownership.

Begin with one capability and preserve existing behavior through comparison tests. Avoid a single giant service program that requires every consumer to redeploy for unrelated changes. Plan compatibility, activation lifetime, error semantics, and caller-owned transactions before expanding the public API.

</details>

## 7. How do module and program entry procedures differ?

**Advanced**

<details>
<summary>Explain the answer</summary>

A module has an entry procedure associated with its compilation model. When modules are bound into a program, one module provides the program entry point used for a program call. Other exported procedures can satisfy bound calls without being the program’s entry.

Understand this distinction when composing multiple modules or diagnosing an unexpected startup path. A module with reusable no-main procedures serves a different role from a main program module. Verify the binder’s entry selection and exported symbols instead of relying on source member order.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Can CL CALL directly execute a standalone *MODULE?

A. Yes, always
B. Only if the source is free-form
C. Only in QTEMP
D. No

### 2. What is copied into a program during binding?

A. Selected module code
B. Every job in QBATCH
C. All source members automatically
D. The entire library list

### 3. What does a binding directory provide?

A. Runtime message storage
B. Candidates for resolving imports
C. A list of active jobs
D. A record-format buffer

### 4. How are service-program functions normally called?

A. By CALL directly to *SRVPGM
B. By RCVF
C. Through exported procedure references
D. By adding a job queue entry

### 5. Replacing a *MODULE alone updates all bound consumers:

A. True immediately
B. True after the next CHAIN
C. True only for CL callers
D. False

<details>
<summary>Answer key and explanations</summary>

1. **D — No** Modules must be incorporated into a callable program or service program.

2. **A — Selected module code** Bind by copy incorporates selected modules into the resulting object.

3. **B — Candidates for resolving imports** It is used by the binder to find exports for unresolved imports.

4. **C — Through exported procedure references** Consumers bind to exported procedures rather than treating the service object as a normal program entry.

5. **D — False** Consumers contain copied code and need an appropriate update or rebuild.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Binder functions](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-binder-functions)
- [IBM: Binder language](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-binder-language)
- [IBM Redbooks: Modern RPG](https://www.redbooks.ibm.com/redbooks/pdfs/sg245402.pdf)

[← Previous](job-logs-messages.md) · [Next →](binding-signatures.md)
