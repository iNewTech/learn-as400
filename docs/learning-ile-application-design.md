# Modern RPGLE: modules, service programs & runtime

[Learning path index](README.md) · Advanced

This path uses simple explanations, safe code skeletons, and IBM i commands before the detailed question chapters.

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

```cl
CRTRPGMOD MODULE(APPDATA/ORDERMOD) SRCFILE(APPDATA/QRPGLESRC) SRCMBR(ORDERMOD)
CRTRPGMOD MODULE(APPDATA/ORDENTRY) SRCFILE(APPDATA/QRPGLESRC) SRCMBR(ORDENTRY)
CRTPGM PGM(APPDATA/ORDENTRY) MODULE(APPDATA/ORDENTRY) BNDSRVPGM(APPDATA/ORDERAPI)
```

## 3. Use a binding directory to reduce build noise

A binding directory is an optional convenience for the binding step. It lists modules and service programs the binder may inspect when an import remains unresolved. It is not a run-time registry, a deployment tool, or a way to load code dynamically.

Keep a directory focused on a logical API set. A very large, global binding directory makes builds harder to reason about and can make binding slower. Prefer a small application directory such as APPBND with the service programs the application is designed to use.

**Create and use an application binding directory**

```cl
CRTBNDDIR BNDDIR(APPDATA/APPBND)
ADDBNDDIRE BNDDIR(APPDATA/APPBND) OBJ((APPDATA/ORDERAPI *SRVPGM))
CRTPGM PGM(APPDATA/ORDENTRY) MODULE(APPDATA/ORDENTRY) BNDDIR(APPDATA/APPBND)
```

## 4. Treat binding signatures as compatibility promises

A service program’s binder language describes exported procedures and a signature. When a caller binds to a signature, changing parameter order or type can break the contract. Add a new export for an intentional interface change and keep older exports while callers migrate. Avoid EXPORT(*ALL) for a stable API: it accidentally makes internal procedures part of the public contract.

A good answer distinguishes compile-time binding from run-time lookup and explains how the team detects an incompatible service program before production. Replacing a module alone does not refresh a program that has copied it during static binding; rebuild or update the bound consumer through a controlled release.

**Fully free**

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

```cl
DSPPGM PGM(APPDATA/ORDENTRY)
DSPSRVPGM SRVPGM(APPDATA/ORDERAPI)
WRKOBJ OBJ(APPDATA/*ALL) OBJTYPE(*PGM)
```

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [ILE: modules, programs & services](ile-objects.md), [Binding, calling & signatures](binding-signatures.md), [Activation groups & lifecycle](activation-groups.md).

## IBM documentation

- [IBM: Binder functions](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-binder-functions)
- [IBM: Binder language](https://www.ibm.com/docs/en/i/7.4.0?topic=concepts-binder-language)
- [IBM Redbooks: Modern RPG](https://www.redbooks.ibm.com/redbooks/pdfs/sg245402.pdf)
- [IBM: Service program signature](https://www.ibm.com/docs/en/i/7.6?topic=language-signature)
- [IBM: Commitment definitions and activation groups](https://www.ibm.com/docs/en/i/7.4.0?topic=scoping-commitment-definitions-activation-groups)

[← Previous path](learning-jobs-and-cl.md) · [Next path →](learning-messaging-and-recovery.md)
