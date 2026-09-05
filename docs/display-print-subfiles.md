# Display files, subfiles & printing

[Question index](README.md) · RPG & CL development · Intermediate

Explain interactive record formats, paging, indicators, and spooled output.

## 1. What is a display file?

**Easy**

<details>
<summary>Explain the answer</summary>

A display file defines record formats used to exchange data with a display device, commonly in a 5250 application. DDS can define fields, attributes, function keys, and indicators. RPG uses operations such as WRITE and EXFMT to interact with it.

Keep presentation logic distinct from business updates. A screen format should collect and display values, while a business procedure validates and applies changes with a defined transaction. This separation makes later API or web reuse easier.

</details>

## 2. What are a subfile record and a subfile control record?

**Intermediate**

<details>
<summary>Explain the answer</summary>

The subfile record format defines one displayed row of a list. The control format governs the subfile display and related controls. Relative record numbers identify rows in the subfile’s runtime contents.

Explain loading, displaying, reading changed records, and clearing/reloading as separate steps. Indicators and DDS keywords determine when the subfile and control are displayed. Incorrect state can show old rows, produce empty displays, or cause device-file errors.

</details>

## 3. How do load-all and page-at-a-time subfiles differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A load-all approach populates the intended list into the subfile before interaction, while page-at-a-time logic loads a bounded page and manages navigation explicitly. The choice depends on row volume, response time, and device/application limits.

For large data, use stable keyed pagination and preserve selection behavior across page changes. Test first/last pages, no records, deletions between pages, and repeated navigation. Do not read an entire large table simply because the initial test dataset was small.

</details>

## 4. How do you process user-selected subfile rows?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Use changed-record processing, commonly READC, and inspect the option or edited values for each returned row. Validate every requested action against current business state rather than trusting the screen’s earlier data.

After an error, manage changed indicators and redisplay deliberately so rows needing correction remain processable. Record the underlying business key separately from the subfile relative record number. The display row position is not a durable database identity.

</details>

## 5. How do printer files relate to output queues?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A printer file describes output records and printing attributes. Programs write output that can be spooled into an output queue, where a writer or other consumer processes it. Creation of spool output and physical printing are separate stages.

Use appropriate overflow/page-heading logic for formatted reports. When a user says printing failed, inspect both the application run and the spooled file state. A correct business transaction should not need to be reposted merely because a printer is unavailable.

</details>

## 6. How do SFLSIZ and SFLPAG differ?

**Intermediate**

<details>
<summary>Explain the answer</summary>

SFLSIZ describes the subfile size allocation characteristics, while SFLPAG describes the number of records in a displayed page. They are different from the total number of rows in the underlying database query. The DDS configuration and application loading approach work together.

Choose values that fit the display layout and paging model. Test a partial last page and a list larger than one page. Do not infer that declaring a larger subfile automatically loads more database records; RPG still owns the loading logic.

</details>

## 7. How do SFLDSP, SFLDSPCTL, and SFLCLR help handle an empty list?

**Intermediate**

<details>
<summary>Explain the answer</summary>

SFLDSP controls display of subfile records, SFLDSPCTL controls the control format, and SFLCLR clears subfile records when used according to the DDS rules. An empty result should not attempt to display nonexistent subfile rows.

Clear/reset the load state, show the control/header and a useful no-records message, and enable row display only when records exist. Test switching from a populated list to an empty search so old rows do not remain visible.

</details>

## 8. How would you modernize a subfile screen without changing business behavior?

**Advanced**

<details>
<summary>Explain the answer</summary>

Document selection, paging, validation, authority, and error paths first. Extract business operations behind explicit contracts while keeping the existing screen as a caller. Then implement a new interface using the same behavior.

Test concurrent edits, no-result cases, large lists, and retry behavior. Preserve stable business identifiers rather than exposing screen row numbers as API IDs. A visually similar web table is not proof that the workflow and transaction semantics were preserved.

</details>

## 9. Why use SFLNXTCHG after validating a subfile row?

**Advanced**

<details>
<summary>Explain the answer</summary>

SFLNXTCHG can mark a subfile record so it is treated as changed for subsequent changed-record processing. It is useful when a row failed validation and must remain available for another pass even without an additional user edit.

Set and reset the relevant indicator intentionally when updating the subfile record. Otherwise a row may disappear from the retry processing or be returned repeatedly after success. Test multiple selections containing both valid and invalid actions.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Which format defines one row in a subfile?

A. Job description
B. Binding directory
C. Subfile record format
D. Subsystem description

### 2. What normally identifies a subfile row’s position?

A. Service signature
B. Memory-pool number
C. Journal receiver name
D. Relative record number

### 3. Which operation is commonly used for changed subfile rows?

A. READC
B. SETGT
C. COMMIT
D. CRTPF

### 4. For a very large result set, what needs deliberate design?

A. Only a larger title
B. Paging and stable business keys
C. Only more numeric indicators
D. Only a new printer name

### 5. If printing fails after posting succeeds, prefer:

A. Reposting the entire transaction
B. Deleting business rows
C. A report/reprint recovery path
D. Ignoring all spool status

<details>
<summary>Answer key and explanations</summary>

1. **C — Subfile record format** The control format manages display; the row format defines the row fields.

2. **D — Relative record number** A subfile RRN is a display position, not the durable business key.

3. **A — READC** READC retrieves changed subfile records for processing.

4. **B — Paging and stable business keys** Bounded loading and stable navigation avoid unnecessary full-data processing.

5. **C — A report/reprint recovery path** Separate business effects from output delivery.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: RPG file operations](https://www.ibm.com/docs/en/i/7.4.0?topic=operations-file)
- [IBM: ILE RPG reference (7.6)](https://www.ibm.com/docs/it/ssw_ibm_i_76/pdf/sc092508.pdf)
- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: SFLSIZ keyword](https://www.ibm.com/docs/en/i/7.5.0?topic=80-sflsiz-subfile-size-keyword-display-files)
- [IBM: Subfile record selection example](https://www.ibm.com/support/pages/rpg-subfile-example-record-selection)
- [IBM: SFLNXTCHG behavior](https://www.ibm.com/support/pages/using-sflmltchc-and-sflnxtchg-same-subfile)

[← Previous](cl-clle.md) · [Next →](jobs-job-queues.md)
