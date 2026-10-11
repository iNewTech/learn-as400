# Modern RPGLE: modules, service programs & runtime

[Learning path index](README.md) · Advanced

Build an ILE RPGLE service, understand module and binding-directory dependencies, preserve exported interfaces and troubleshoot activation-group state.

Updated: 2026-10-11.

## Outcomes

- Trace a modern RPGLE request from source member to an active ILE program.
- Differentiate modules, service programs, binding directories, and runnable programs.
- Choose a compatibility and activation-group strategy that makes resource lifetime explicit.

## 1. How the ILE pieces connect

Modern RPGLE usually means fully free source, procedures with clear prototypes, and ILE objects assembled for reuse. The important distinction is between the build-time path and the run-time path: a binding directory helps the binder find providers while an activation group owns the resources used after a program is called.

A simple order application might call an *PGM named ORDENTRY. ORDENTRY uses procedures from an *SRVPGM named ORDERAPI. ORDERAPI is made from one or more *MODULE objects. A *BNDDIR can list ORDERAPI so builders do not repeat every dependency on each create command. At run time, the program and service program activate in a chosen activation group.

- *MODULE: compiled code that is not called directly.
- *SRVPGM: a reusable, reference-bound package of exported procedures.
- *BNDDIR: a build-time list of possible modules and service programs; it holds no executable code.
- *PGM: the runnable entry object that a job calls.
- Activation group: the run-time boundary for static storage, open files, cursors, and other scoped resources.

**Flow**

1. Write RPGLE source and define the procedure contract
2. Compile each source unit into a *MODULE
3. Package shared procedures in a *SRVPGM and publish deliberate exports
4. Use a *BNDDIR at build time to resolve only the imports that are needed
5. Create the runnable *PGM that calls the procedure
6. At run time, an activation group initializes and owns the program resources

## 2. Build a small service, not a giant program

An ILE module is a compiled unit that can be bound into a program or service program. A program is a callable runnable object. A service program exposes reusable exported procedures and data through a binding contract. This separation lets a team change one implementation module and rebuild the affected object without copying the implementation into every caller.

Start an interface discussion with the procedure prototype, parameter types, error contract, and ownership of resources. The object names matter, but the contract is what protects callers. Keep a service program focused: validation, tax calculation, or customer lookup are clearer shared services than one catch-all application library.

**Compile a module, then bind the caller**

```text
CRTRPGMOD MODULE(APPDATA/ORDERMOD) SRCFILE(APPDATA/QRPGLESRC) SRCMBR(ORDERMOD)
CRTRPGMOD MODULE(APPDATA/ORDENTRY) SRCFILE(APPDATA/QRPGLESRC) SRCMBR(ORDENTRY)
CRTPGM PGM(APPDATA/ORDENTRY) MODULE(APPDATA/ORDENTRY) BNDSRVPGM(APPDATA/ORDERAPI)
```

## 3. Use a binding directory to reduce build noise

A binding directory is an optional convenience for the binding step. It lists modules and service programs the binder may inspect when an import remains unresolved. It is not a run-time registry, a deployment tool, or a way to load code dynamically.

Keep a directory focused on a logical API set. A very large, global binding directory makes builds harder to reason about and can make binding slower. Prefer a small application directory such as APPBND with the service programs the application is designed to use.

**Create and use an application binding directory**

```text
CRTBNDDIR BNDDIR(APPDATA/APPBND)
ADDBNDDIRE BNDDIR(APPDATA/APPBND) OBJ((APPDATA/ORDERAPI *SRVPGM))
CRTPGM PGM(APPDATA/ORDENTRY) MODULE(APPDATA/ORDENTRY) BNDDIR(APPDATA/APPBND)
```

## 4. Treat binding signatures as compatibility promises

A service program’s binder language describes exported procedures and a signature. When a caller binds to a signature, changing parameter order or type can break the contract. Add a new export for an intentional interface change and keep older exports while callers migrate. Avoid EXPORT(*ALL) for a stable API: it accidentally makes internal procedures part of the public contract.

A good answer distinguishes compile-time binding from run-time lookup and explains how the team detects an incompatible service program before production. Replacing a module alone does not refresh a program that has copied it during static binding; rebuild or update the bound consumer through a controlled release.

**Binder language outline**

**Example**

```binder
STRPGMEXP PGMLVL(*CURRENT) SIGNATURE('ORDERAPI V2')
  EXPORT SYMBOL('postOrder')
  EXPORT SYMBOL('cancelOrder')
ENDPGMEXP
/* Keep prior signatures when compatibility is required. */
```

## 5. Activation groups define lifetime and cleanup

An activation group is the runtime scope for static storage, open files, SQL cursors, and resources used by ILE programs. *NEW, *CALLER, and named activation groups have different reuse and cleanup behavior. Choose deliberately: reuse can preserve state and reduce setup, while a fresh group can isolate state and simplify cleanup.

*CALLER is often suitable for a cooperating service that should share the caller's scope. A named group can keep a complete application alive across calls when its state and cleanup are managed deliberately. *NEW gives a separate fresh group. When an issue appears, ask which object opened the resource, which group owns it, and what happens on return or reclaim. Do not fix a leak by changing the group attribute without understanding the lifecycle.

**Inspect compiled attributes**

```text
DSPPGM PGM(APPDATA/ORDENTRY)
DSPSRVPGM SRVPGM(APPDATA/ORDERAPI)
WRKOBJ OBJ(APPDATA/*ALL) OBJTYPE(*PGM)
```

## 6. Build and call a reusable tax service in a test library

Use one small feature to understand the build chain. TAXMOD contains an exported calculateTax procedure and no independent business entry point. TAXAPI is the service program that publishes that procedure. TAXTEST is a separate program whose prototype matches the service and whose job is to call it with known inputs. The library TRAINING and the source members below are prerequisites, not objects these commands create automatically.

First compile the implementation module. Then create TAXAPI using binder source that deliberately exports calculateTax. Compile TAXTEST and bind it to TAXAPI. A caller import must match the exported symbol, including its defined spelling; do not guess the binder name from a mixed-case source label. Inspect the module’s exports and use that spelling in the binder member.

Expected outcome: a test program can call the shared calculation without copying the implementation source into the caller. Compiling TAXMOD again does not by itself replace the copy already bound inside TAXAPI. A release must rebuild or update the containing service program and verify its callers.

**CL build outline — existing test source and binder members required**

```text
CRTRPGMOD MODULE(TRAINING/TAXMOD) SRCFILE(TRAINING/QRPGLESRC) SRCMBR(TAXMOD)
CRTSRVPGM SRVPGM(TRAINING/TAXAPI) MODULE(TRAINING/TAXMOD) EXPORT(*SRCFILE) SRCFILE(TRAINING/QSRVSRC) SRCMBR(TAXAPI) ACTGRP(*CALLER)
CRTRPGMOD MODULE(TRAINING/TAXTEST) SRCFILE(TRAINING/QRPGLESRC) SRCMBR(TAXTEST)
CRTPGM PGM(TRAINING/TAXTEST) MODULE(TRAINING/TAXTEST) BNDSRVPGM(TRAINING/TAXAPI) ACTGRP(*NEW)
```

## 7. Evolve a service-program interface without misleading callers

Suppose version one publishes calculateTax(amount), and a new requirement needs a country code. Changing the existing parameter list while keeping the old name can break a caller that still passes one argument. A generated binder signature is based on exported names and order; it does not validate the RPG parameter definitions. Therefore a signature that still matches is not proof that the procedure contract remains compatible.

A practical design is to preserve the existing procedure’s behavior and add calculateTaxForCountry with a new prototype. Maintain export order and the required previous signatures in binder source according to the chosen versioning approach. Exercise an old caller and a newly built caller against the replacement service before promotion. Do not remove an old export merely because no new source uses it; an existing bound object may still depend on it.

If compatibility cannot be preserved, make the incompatibility intentional and rebuild the affected consumers together. Record the service version and caller build in the release evidence so a rollback restores a compatible set.

**Inspect the published interface before and after the change**

```text
DSPSRVPGM SRVPGM(TRAINING/TAXAPI) DETAIL(*SIGNATURE *PROCEXP)
DSPPGM PGM(TRAINING/TAXTEST) DETAIL(*SRVPGM)
```

## 8. Reproduce a second-call bug caused by retained state

A common ILE testing trap is calling a program once in a fresh job and concluding its state handling is correct. Static storage belongs to an activation. When that activation is reused, an application can retain values that were intended for only one request. Replacing the source with clearer procedure names does not automatically remove this lifetime issue.

Imagine a lookup service stores the last successful customer name in static storage. Request A finds customer 42. Request B asks for a missing customer and returns without clearing the output. The screen can now show customer 42’s name for request B. Fix the output contract: initialise request-specific results, return found/not-found explicitly, and let the caller use data only for a successful result.

Run A then B in the same job and same intended activation group, repeat B, and compare with a fresh job. Also test different customers in succession. Activation groups isolate activations, but they are not a substitute for clean per-request data handling. Reclaiming a group can hide the symptom while leaving the defect in the code. The earlier TAXTEST build uses ACTGRP(*NEW), which creates a fresh group for each call; use a named/reused activation group for this specific lifetime test.

**Flow**

1. Call with a known customer and verify the returned fields
2. Call with a missing customer in the same activation
3. Assert not-found and no usable previous-customer output
4. Repeat in a fresh job to expose lifetime differences
5. Fix initialisation and result handling, then repeat both tests

## 9. Separate compile, bind and activation failures when troubleshooting

An ILE failure becomes easier to diagnose once you identify the phase. A source compilation error concerns the RPG syntax, declarations, include members or external definitions available to the compiler. An unresolved import during binding concerns the modules and service-program exports available to assemble the object. An activation failure happens later, when the running job must locate required service programs and validate their supported signatures.

For example, a test build might bind successfully to TRAINING/TAXAPI, but a production job might resolve a different deployed service or lack the expected object. Adding random entries to a binding directory does not diagnose the running job. Inspect the failing program’s recorded service dependencies, the available service signatures, the job’s library context and the actual diagnostic message.

Write down the phase, qualified object names and first relevant message before rebuilding. The expected outcome is a specific explanation such as “caller requires a signature this deployed service does not support,” followed by a coordinated deployment fix. Recompiling everything without that evidence can make a mismatch harder to reproduce.

**Flow**

1. Compile: inspect the source listing and referenced declarations
2. Bind: inspect unresolved imports and candidate exports
3. Activate: inspect required service objects and signatures
4. Run: inspect business status and resource state
5. Retest the exact failing caller in its real job context

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [ILE: modules, programs & services](ile-objects.md), [Binding, calling & signatures](binding-signatures.md), [Activation groups & lifecycle](activation-groups.md).

## IBM documentation

- [IBM: Create Service Program command](https://www.ibm.com/docs/en/i/7.5.0?topic=c-create-service-program)
- [IBM: Binder language](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-binder-language)
- [IBM: Signatures and export ordering](https://www.ibm.com/docs/en/i/7.5.0?topic=commands-signature-parameter-strpgmexp-command)
- [IBM: Activation and static storage](https://www.ibm.com/docs/en/i/7.5.0?topic=concepts-activation)
- [IBM: Program activation](https://www.ibm.com/docs/en/i/7.5.0?topic=concepts-program-activation)
- [IBM: Binder functions](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-binder-functions)
- [IBM Redbooks: Modern RPG](https://www.redbooks.ibm.com/redbooks/pdfs/sg245402.pdf)
- [IBM: Service program signature](https://www.ibm.com/docs/en/i/7.6?topic=language-signature)
- [IBM: Commitment definitions and activation groups](https://www.ibm.com/docs/en/i/7.4.0?topic=scoping-commitment-definitions-activation-groups)

[← Previous path](learning-jobs-and-cl.md) · [Next path →](learning-messaging-and-recovery.md)
