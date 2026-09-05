# IBM i basics

[Question index](README.md) · Foundations · Easy

Understand the platform, its object model, and the environment your applications run in.

## 1. Are AS/400, IBM i, and Power the same thing?

**Easy**

<details>
<summary>Explain the answer</summary>

AS/400 is a historical system family; IBM i is the operating system; IBM Power is the hardware platform. AS400 persists as informal shorthand in job descriptions. Separating these terms helps you discuss an application change, operating-system upgrade, and hardware migration precisely.

A typical application combines RPG, CL, Db2 for i, and IFS resources. Ask about the IBM i release, compiler features, and PTF level before promising that a modern language or SQL feature is available.

```text
Business application → IBM i services → Power hardware
```

**Interview pitfall:** A terminal interface does not define the capabilities of the platform.

</details>

## 2. Why is IBM i described as object based?

**Easy**

<details>
<summary>Explain the answer</summary>

Programs, files, libraries, and queues are typed system objects. The object type determines the supported operations; a program object is not just arbitrary bytes that can be opened as a text file. The system manages object identity and authority.

For troubleshooting, identify the qualified name and object type. Two objects can share a name within a library if their types differ. Recreating an object can also affect its ownership, authority, dependencies, and runtime use.

```text
DSPObjD OBJ(APP/ORDERS) OBJTYPE(*FILE)
```

**Interview pitfall:** A source member and a compiled *PGM are different artifacts.

</details>

## 3. How do 5250, ACS, and application code relate?

**Easy**

<details>
<summary>Explain the answer</summary>

5250 is a terminal interface. IBM i Access Client Solutions provides tools such as terminal sessions, Run SQL Scripts, and database tooling. Application code runs in server jobs regardless of whether the caller is a terminal user, a scheduler, or a web client.

A developer should be able to explain both the interface and the server-side execution. A browser timeout does not by itself prove that the server job ended; inspect its state and the application transaction before resubmitting work.

</details>

## 4. What is the difference between the IFS and a database file?

**Intermediate**

<details>
<summary>Explain the answer</summary>

The IFS exposes hierarchical paths and stream-oriented interfaces. A database file exposes structured records and can have members and record formats. Both participate in the IBM i environment, but reading a UTF-8 JSON stream differs from reading a keyed customer record.

Use stream APIs or suitable SQL services for IFS content and database interfaces for records. In integrations, define encoding, delimiters, and ownership explicitly; a file extension alone does not establish the actual CCSID or format.

```text
IFS: /home/app/inbound/orders.json
Library object: APP/ORDERS (*FILE)
```

</details>

## 5. What do compilation and execution create or use?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Source is input to a compiler. Depending on the command and language, compilation creates a module or a runnable program; binding can combine modules and references to service programs. Executing the resulting program creates runtime state within a job.

Changing a source member does not change an already compiled object. Verify the source version, compile listing, object library, and build command when someone says that a fix has been deployed but behavior is unchanged.

```text
Source → module → bound program → activation in a job
```

</details>

## 6. How would you assess an unfamiliar IBM i application?

**Advanced**

<details>
<summary>Explain the answer</summary>

Start with the business workflow and its entry points: interactive programs, scheduled jobs, database triggers, and APIs. Map the files, service programs, queues, and external dependencies used by each path. Record the libraries and profiles that define its environment.

Then inspect a successful execution and a known failure. Compare job logs, transaction boundaries, restart behavior, and runtime configuration. Propose a small reproducible test before changing production. This establishes evidence and avoids treating unfamiliar object names as an architecture.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Which term identifies the operating system?

A. Power
B. IBM i
C. 5250
D. RPG

### 2. Editing source alone changes which artifact?

A. Every active program
B. The compiled object automatically
C. The source
D. All service program signatures

### 3. Which is naturally a stream-file path?

A. APP/ORDERS *FILE
B. APP/POST *PGM
C. QBATCH *JOBQ
D. /home/app/order.json

### 4. A browser times out during a posting request. What next?

A. Check the server operation status before retrying
B. Assume the transaction rolled back
C. Immediately submit the posting twice
D. Delete the job log

### 5. What determines object operations?

A. Only the object name
B. Object type and authority
C. The screen color
D. The source member extension

<details>
<summary>Answer key and explanations</summary>

1. **B — IBM i** Power is hardware, 5250 is a terminal interface, and RPG is a programming language.

2. **C — The source** A build is required to turn changed source into a new compiled object.

3. **D — /home/app/order.json** IFS paths describe hierarchical stream resources.

4. **A — Check the server operation status before retrying** A client timeout can occur while the server operation is still executing or has committed.

5. **B — Object type and authority** Typed objects expose specific operations, and authority determines who may perform them.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Integrated file system](https://www.ibm.com/docs/en/i/7.4.0?topic=system-integrated-file-ifs)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)

[Next →](objects-libraries.md)
