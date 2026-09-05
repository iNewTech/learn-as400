# System operations & recovery

[Question index](README.md) · Production engineering · Intermediate

Connect application behavior to storage, output, backups, and system change.

## 1. What operational commands should a developer understand?

**Easy**

<details>
<summary>Explain the answer</summary>

Understand how to inspect active jobs, job details, spooled output, object descriptions, file descriptions, and libraries. Examples include WRKACTJOB, WRKJOB, WRKSPLF, DSPOBJD, DSPFD, and DSPLIBL.

The interview value is knowing what evidence each reveals. If a report is absent, trace generation, spooling, queue state, and writer processing in order. A memorized command list without an investigation path does not demonstrate operational reasoning.

</details>

## 2. How do you troubleshoot a report that never prints?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Find the generating job and establish whether it completed. If output exists, inspect the spooled file’s status, output queue, hold state, and writer/device status. If no output exists, inspect the program path and job log.

Avoid rerunning the business posting just to regenerate a report. Separate report generation from irreversible business work where possible, and use an approved reprint path. Distinguish an empty report from a missing or held spooled file.

</details>

## 3. How do backups and journals support recovery differently?

**Intermediate**

<details>
<summary>Explain the answer</summary>

A backup captures recoverable object/data state at a point or over a coordinated save process. Journals record changes that can support recovery forward from a suitable save and other auditing/replication use cases. Neither is a complete recovery plan by itself.

Define recovery point and recovery time objectives, receiver retention, restore order, and dependency coverage. Include programs, authorities, IFS resources, and configuration. Prove the plan with a restore exercise rather than relying solely on successful save messages.

</details>

## 4. What is an IPL, and why does it matter to applications?

**Intermediate**

<details>
<summary>Explain the answer</summary>

An initial program load starts or restarts the system operating environment. Applications may require subsystem startup, server startup, queue recovery, scheduled-work reconciliation, and external dependency checks afterward.

A planned IPL should have a runbook that verifies readiness and reconciles in-flight work. Do not assume every interrupted external action rolled back. Check durable run state and communication outcomes before replaying work.

</details>

## 5. How do you respond to rapidly increasing storage usage?

**Advanced**

<details>
<summary>Explain the answer</summary>

Identify which storage pool and object categories are growing. Examine journal receivers, spooled output, temporary objects, large database members, and IFS files using appropriate authorized tools. Correlate growth with a job or workload change.

Preserve required recovery/audit data and confirm retention rules before deleting. Stopping a runaway producer may be more effective than repeatedly clearing its output. A sustainable fix sets retention, monitoring, and ownership for the growth source.

</details>

## 6. How should a developer prepare an operating-system upgrade?

**Advanced**

<details>
<summary>Explain the answer</summary>

Inventory the release and PTF dependencies of compilers, SQL services, middleware, and external drivers. Test representative business flows, batch schedules, encoding boundaries, authority-sensitive operations, and recovery procedures on the target level.

Record a rollback/recovery plan and coordinate application change timing. Do not bundle unrelated business rewrites into an upgrade unless necessary. Verify post-upgrade service readiness and performance against a baseline rather than only checking that users can sign on.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Which command helps inspect spooled output?

A. CRTBNDRPG
B. CHAIN
C. CRTDTAARA
D. WRKSPLF

### 2. A report is held but posting succeeded. Best action?

A. Use the output/reprint workflow without repeating posting
B. Post all transactions again
C. Delete the journal
D. Recompile all programs

### 3. What proves a backup plan is usable?

A. Only a green dashboard
B. A successful restore and recovery exercise
C. Only a source archive
D. Only journal existence

### 4. Before deleting growing journal receivers, check:

A. Only filename length
B. Only the user interface color
C. Recovery and retention requirements
D. Nothing if old

### 5. After an IPL, interrupted work should be:

A. Always replayed blindly
B. Always considered successful
C. Ignored permanently
D. Reconciled using durable state

<details>
<summary>Answer key and explanations</summary>

1. **D — WRKSPLF** WRKSPLF works with spooled files so you can inspect output independently of the generating job.

2. **A — Use the output/reprint workflow without repeating posting** Printing and business posting should be diagnosed separately.

3. **B — A successful restore and recovery exercise** Recovery must be tested against the intended objectives.

4. **C — Recovery and retention requirements** Receivers may be needed for recovery or replication.

5. **D — Reconciled using durable state** Restart changes runtime state but does not answer every business-outcome question.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Work management (7.5)](https://www.ibm.com/docs/en/ssw_ibm_i_75/pdf/rzakspdf.pdf)
- [IBM: Integrated file system](https://www.ibm.com/docs/en/i/7.4.0?topic=system-integrated-file-ifs)
- [IBM: Journal and commit APIs](https://www.ibm.com/docs/en/i/7.5.0?topic=category-journal-commit)

[← Previous](debugging.md) · [Next →](security-authorities.md)
