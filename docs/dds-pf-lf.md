# DDS, physical & logical files

[Question index](README.md) · Data & database · Easy

Understand record formats, access paths, members, joins, and level checks.

## 1. How do a physical file and logical file differ?

**Easy**

<details>
<summary>Explain the answer</summary>

A physical file stores records. A logical file describes an alternative presentation or access path over physical data, such as keyed ordering, selected records, or a join. The logical file does not hold an independent copy of the business rows.

Additional access paths still consume storage and maintenance work. When an application updates data through an eligible logical file, it changes the underlying physical data. Join logical files have more restrictive capabilities than simple logical files.

```text
Customer PF → by-name LF and by-region LF
```

**Interview pitfall:** “No business rows stored” does not mean an LF has zero storage or maintenance cost.

</details>

## 2. What are DDS record formats and keys?

**Easy**

<details>
<summary>Explain the answer</summary>

DDS describes externally defined file layouts and related attributes. A record format names a layout of fields; key definitions establish a keyed access path. The compiler can use those external definitions so program fields agree with the file description.

Distinguish field layout from access order. Adding a key can change access behavior, while changing a field type or length can affect compiled consumers. Review downstream programs and files before promoting schema changes.

</details>

## 3. What is a file member?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A database file can contain members that share the file description but have separate record collections. Source physical files commonly use one member per source unit. Data files may use multiple members for legacy partitioning patterns.

Native access can select a member using an override or open settings. SQL normally addresses a table’s default member; an SQL alias can name a particular member. Do not assume SELECT automatically reads every member.

```text
CREATE ALIAS TEST.ORD_JAN FOR APP.ORDERS(JAN);
```

**Interview pitfall:** Members are not interchangeable with modern SQL partitioning features.

</details>

## 4. What is a level-check error?

**Intermediate**

<details>
<summary>Explain the answer</summary>

An externally described program expects a particular record-format level identifier. If the runtime file layout does not match that expectation, level checking can reject the open. This often follows a file change without rebuilding dependent consumers, or resolution to the wrong library.

Compare the resolved object and formats, inspect dependencies, then rebuild the appropriate programs and files. Turning level checking off can conceal an incompatible layout and corrupt interpretation of data; it is not the default repair.

```text
DSPFFD FILE(APP/ORDERS)
DSPDBR FILE(APP/ORDERS)
```

</details>

## 5. How do join and select/omit logical files differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A join LF combines fields from related physical files according to its DDS join rules. Select/omit definitions control which records are visible through a logical file. Neither should be assumed to behave identically to every SQL view or join.

For an interview scenario, explain the required row set and whether updates are needed. A join LF is read-only for native update purposes. SQL may be clearer for aggregates and flexible joins, while existing applications may rely on DDS format compatibility.

</details>

## 6. When should a rule be a constraint instead of only RPG validation?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Use database constraints for invariants that must hold regardless of which application writes the data: required values, uniqueness, valid ranges, and referential integrity are common examples. RPG validation still helps produce helpful user feedback.

A screen-only check can be bypassed by batch or integration updates. Before adding a constraint to legacy data, inspect existing violations and define cleanup and rollout. Test expected failure diagnostics so every caller handles rejected writes meaningfully.

</details>

## 7. Would you replace every LF with an SQL index?

**Advanced**

<details>
<summary>Explain the answer</summary>

No. First distinguish the role: record-format projection, selection, joins, or keyed access for native I/O. SQL views and indexes serve different purposes; a one-for-one replacement can lose semantics or break a compiled interface.

Inventory consumers, preserve externally visible contracts where required, and compare query plans and write costs. Modernizing database definitions is a migration project with compatibility tests, not a naming conversion. Verify the resulting rows, key behavior, nullability, and dependency rebuild requirements.

</details>

## 8. What are BEFORE and AFTER triggers used for?

**Advanced**

<details>
<summary>Explain the answer</summary>

Triggers execute in response to specified database events. BEFORE logic can validate or adjust eligible incoming values under the supported rules; AFTER logic acts after the triggering change and can implement related database actions. The exact capabilities depend on the trigger definition and event.

Keep effects understandable and avoid hidden network calls in a lock-holding path. Test multirow statements, recursion/cascades, errors, and transaction rollback. A single application UPDATE may invoke more database work than the caller’s source reveals.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Where are the underlying business records stored?

A. Physical file
B. Logical file definition alone
C. Binding directory
D. Job description

### 2. A level check starts after deployment. Best first step?

A. Disable all level checks
B. Compare runtime file formats and resolved libraries
C. Delete the job queue
D. Increase CPU priority

### 3. How can SQL address a specific database member?

A. Add a job queue
B. Use a service program signature
C. Use an alias defined for that member
D. Rename the terminal session

### 4. Can a join LF be treated as a normal native update file?

A. Yes, all joins are updatable
B. Only after a COMMIT
C. Only with CHAIN(N)
D. No, it is read-only for that purpose

### 5. Does an LF always have zero maintenance cost?

A. No, access paths can require storage and updates
B. Yes, it contains no business rows
C. Yes, it is only source text
D. Only when keyed

<details>
<summary>Answer key and explanations</summary>

1. **A — Physical file** The PF stores records; an LF exposes a representation of physical data.

2. **B — Compare runtime file formats and resolved libraries** Find whether the wrong object or an incompatible format caused the mismatch.

3. **C — Use an alias defined for that member** CREATE ALIAS can identify a member of a database file.

4. **D — No, it is read-only for that purpose** Do not apply simple-LF update assumptions to a join logical file.

5. **A — No, access paths can require storage and updates** Derived access structures still have a cost even without independent business rows.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Physical and logical files](https://www.ibm.com/docs/en/i/7.4.0?topic=program-physical-files-logical-files)
- [IBM: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)
- [IBM: Triggers and constraints](https://www.ibm.com/docs/en/i/7.4.0?topic=administration-working-triggers-constraints)
- [IBM: CREATE TRIGGER](https://www.ibm.com/docs/en/i/7.5.0?topic=statements-create-trigger)

[← Previous](files-operations.md) · [Next →](sql-fundamentals.md)
