# Objects & library lists

[Question index](README.md) · Foundations · Easy

Resolve names correctly and keep development, test, and production environments separate.

## 1. What is a library, and how is it different from a folder?

**Easy**

<details>
<summary>Explain the answer</summary>

A library is a *LIB object that provides a namespace for library-based objects. It is not a general nested directory tree. IFS directories provide that hierarchical model. Database schemas and libraries are closely related on IBM i, though their creation defaults and contained objects can differ.

Use qualified object names when identity matters. APP/ORDERS describes a library object, while /app/orders is an IFS path. Do not interchange these forms without using the appropriate interface.

</details>

## 2. What is the library list used for?

**Easy**

<details>
<summary>Explain the answer</summary>

The library list provides ordered search locations for supported unqualified object references. It has system, product when applicable, current-library, and user portions. Resolution depends on the interface and requested object type.

When development and production have objects with identical names, the resolved object may differ by job. Display the actual job library list and compare the chosen object. A successful unqualified call does not establish that the intended version ran.

```text
DSPLIBL
DSPPGM PGM(APP/POSTORD)
```

**Interview pitfall:** SQL naming and schema settings need separate attention; do not assume every SQL name uses *LIBL.

</details>

## 3. What makes QTEMP useful?

**Easy**

<details>
<summary>Explain the answer</summary>

Each job has its own QTEMP library. Objects created there are isolated from objects of the same name in another job and disappear when the job ends. It is useful for scratch tables and work files that should not survive a run.

It is unsuitable for a durable restart checkpoint or direct sharing between producer and consumer jobs. Long-lived server jobs can retain QTEMP state across requests, so explicitly initialize or clear request-specific data.

```text
Two jobs can each create QTEMP/WORK without sharing its rows.
```

</details>

## 4. How do you diagnose an object-not-found error?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Capture the message identifier and fully qualified object type/name being sought. Check that the object exists in the expected library, then inspect the failing job environment, including its library list, current library, SQL naming settings, and overrides where relevant.

Compare execution under the same user and job attributes. Also inspect authority and dependent objects; an error about a missing dependency may be misread as failure to find the top-level program. Avoid fixing discovery by adding every library globally.

</details>

## 5. When should an application qualify object names?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Explicit qualification makes environment-sensitive dependencies unambiguous, especially for administrative operations and shared infrastructure. Unqualified references can support controlled library-list-based deployment, provided entry points initialize and validate the environment.

Choose a consistent policy rather than scattering production library names through business logic. One useful pattern is an environment-specific wrapper that establishes approved libraries, followed by reusable business procedures with stable contracts. Test both interactive and submitted jobs.

</details>

## 6. Could the same name refer to different objects in one library?

**Advanced**

<details>
<summary>Explain the answer</summary>

Yes, object identity includes type. A library can contain objects with the same name but different object types. However, different database file attributes such as PF and LF still use *FILE, so that distinction does not permit two *FILE objects with the same name in one library.

When writing tooling, retain type along with library and name. A cleanup script that assumes a name uniquely identifies every object can operate on the wrong target.

```text
APP/ORDERS *PGM and APP/ORDERS *FILE can coexist.
```

**Interview pitfall:** PF and LF are attributes, not separate object types for this naming rule.

</details>

## 7. How do SQL naming conventions affect library/schema resolution?

**Advanced**

<details>
<summary>Explain the answer</summary>

IBM i supports SQL and system naming conventions, with differences in qualified-name syntax and unqualified-name resolution. SQL naming uses schema.table notation; system naming commonly supports library/file notation and library-list-oriented behavior. Other settings such as current schema and SQL path also matter.

Confirm the connection or precompile naming option and the actual statement context. Do not assume the same unqualified query in ACS and embedded SQL reaches the same table. Qualify critical references or establish a documented environment contract.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Where should job-private scratch data normally go?

A. A shared production table without a key
B. QSYS source members
C. QTEMP
D. A shared data area

### 2. A batch job runs the wrong program version. Check first:

A. The terminal font
B. The printer queue
C. The SQL cursor count
D. Its resolved program and library list

### 3. Can APP/X *PGM and APP/X *FILE coexist?

A. Yes, their object types differ
B. No, all names are globally unique
C. Only if X has no source
D. Only in QTEMP

### 4. Is QTEMP a durable restart store?

A. Yes, it survives every IPL
B. No, it ends with the job
C. Yes, all jobs share it
D. Only when the screen stays open

### 5. Which naming form is library qualified?

A. /home/orders.json
B. orders.json
C. APP/ORDERS
D. https://orders

<details>
<summary>Answer key and explanations</summary>

1. **C — QTEMP** QTEMP isolates objects per job and is removed when that job ends.

2. **D — Its resolved program and library list** Unqualified program resolution may differ between interactive and batch environments.

3. **A — Yes, their object types differ** Object identity includes library, name, and object type.

4. **B — No, it ends with the job** Use persistent application data for recovery across jobs.

5. **C — APP/ORDERS** The slash in a CL qualified name separates library and object, rather than describing a general IFS path.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: Integrated file system](https://www.ibm.com/docs/en/i/7.4.0?topic=system-integrated-file-ifs)

[← Previous](ibm-i-basics.md) · [Next →](files-operations.md)
