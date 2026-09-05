# IBM i mental model: objects, libraries and the IFS

[Learning path index](README.md) · Easy

This path uses simple explanations, safe code skeletons, and IBM i commands before the detailed question chapters.

## Outcomes

- Describe how an IBM i job finds an object.
- Choose the right place for an IBM i object, source member, or stream file.
- Explain why a library-list problem can look like a missing-object problem.

## 1. Start with the three namespaces

IBM i manages many resources as typed objects. A database file, program, queue, user profile, and job description have an object type and an owner. The type matters: a program name can be the same as a file name because their object types are different.

Libraries group objects in the IBM i object namespace. The integrated file system (IFS) is the path-based file system used for stream files, source archives, logs, and integration payloads. A good developer can move between both views without confusing an IFS path with a library-qualified object name.

- Library object: `APPDATA/CUSTOMER` (object CUSTOMER in library APPDATA).
- IFS stream file: `/home/app/import/customer.json` (a path, not a library object).
- Object authority is checked before an operation is allowed; a path or name alone never grants access.

**Useful orientation commands**

```cl
DSPLIBL
WRKOBJ OBJ(APPDATA/*ALL) OBJTYPE(*ALL)
DSPLNK OBJ('/home/app')
```

**Flow**

1. A user starts a job
2. The job receives a library list and authority context
3. IBM i resolves the name to an object or IFS path
4. Authority and object type are checked
5. The operation runs or a diagnostic message is recorded

## 2. Treat the library list as a search path

An unqualified object name is searched through the current library list. The system portion is searched in a defined order, followed by the product and user portions. Two jobs can run the same command and reach different objects because their library lists differ.

Qualify names in deployment scripts and in high-risk maintenance code. Use the library list for a deliberate application environment, not as a hidden dependency that only works from one developer profile.

**CL setup skeleton**

```cl
PGM
  CHGLIBL LIBL(QGPL QTEMP APPDATA)
  CALL PGM(APPDATA/ORDENTRY)
ENDPGM
```

## 3. Keep source, objects and deployment evidence distinct

A source physical file member is editable source held in a library object. A compiled program or service program is a separate object produced from that source. An IFS stream file is useful for Git checkouts, JSON, certificates, and build artifacts, but it does not replace the compiled object used by a running job.

During a release, record the source version, compiler command, target library, and object authority. That small trail makes a production question answerable: what was built, from which source, and where was it installed?

**Typical build boundary**

```cl
CRTSRCPF FILE(APPDATA/QRPGLESRC) RCDLEN(112)
ADDPFM FILE(APPDATA/QRPGLESRC) MBR(ORDENTRY)
CRTSQLRPGI OBJ(APPDATA/ORDENTRY) SRCFILE(APPDATA/QRPGLESRC) SRCMBR(ORDENTRY)
```

## Practice checkpoint

Complete the five-question checkpoint on the website before moving to the next path. The detailed chapters are: [IBM i basics](ibm-i-basics.md), [Objects & library lists](objects-libraries.md).

## IBM documentation

- [IBM: Integrated file system](https://www.ibm.com/docs/en/i/7.4.0?topic=system-integrated-file-ifs)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)

[Next path →](learning-data-and-files.md)
