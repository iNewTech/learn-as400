# ILE design: modules, service programs and activation groups

[Learning path index](README.md) · Advanced

This path uses simple explanations, safe code skeletons, and IBM i commands before the detailed question chapters.

## Outcomes

- Differentiate a module, program, and service program.
- Explain how a binder signature protects a service-program interface.
- Choose an activation-group strategy and describe its cleanup behavior.

## 1. Separate compile units from runnable objects

An ILE module is a compiled unit that can be bound into a program or service program. A program is a callable runnable object. A service program exposes reusable exported procedures and data through a binding contract. This separation lets a team change one module and rebind a dependent object without copying code everywhere.

Start an interface discussion with the procedure prototype, parameter types, error contract, and ownership of resources. The object names matter, but the contract is what protects callers.

**Typical ILE build sequence**

```cl
CRTRPGMOD MODULE(APPDATA/ORDERMOD) SRCFILE(APPDATA/QRPGLESRC) SRCMBR(ORDERMOD)
CRTSRVPGM SRVPGM(APPDATA/ORDERAPI) MODULE(APPDATA/ORDERMOD) EXPORT(*ALL)
CRTPGM PGM(APPDATA/ORDENTRY) MODULE(APPDATA/ORDENTRY) BNDSRVPGM(APPDATA/ORDERAPI)
```

**Flow**

1. Compile source into one or more modules
2. Bind modules into a program or service program
3. Resolve exported procedure names and signatures
4. Run in an activation group with defined storage lifetime
5. Rebind or replace the object through a controlled release

## 2. Treat binding signatures as compatibility promises

A service program’s binder language describes exported procedures and a signature. When a caller binds to a signature, changing parameter order or type can break the contract. Add a new export for an intentional interface change and keep older exports while callers migrate.

A good answer distinguishes compile-time binding from run-time lookup and explains how the team detects an incompatible service program before production.

**Fully free**

```binder
STRPGMEXP PGMLVL(*CURRENT) SIGNATURE('ORDERAPI V2')
  EXPORT SYMBOL('postOrder')
  EXPORT SYMBOL('cancelOrder')
ENDPGMEXP
/* Keep prior signatures when compatibility is required. */
```

## 3. Activation groups define lifetime and cleanup

An activation group is the runtime scope for static storage, open files, and resources used by ILE programs. *NEW, *CALLER, and named activation groups have different reuse and cleanup behavior. Choose deliberately: reuse can preserve state and reduce setup, while a fresh group can isolate state and simplify cleanup.

When an activation-group issue appears, ask which object opened the resource, which group owns it, and what happens on return or reclaim. Do not fix a leak by changing the group attribute without understanding the lifecycle.

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
