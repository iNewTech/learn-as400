# Security & authorities

[Question index](README.md) · Production engineering · Advanced

Apply least privilege across libraries, objects, programs, SQL, and remote entry points.

## 1. How do object authority and library authority interact?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Access to a library-based object generally requires the appropriate authority to the containing library as well as the authority needed for the object operation. Library *EXECUTE is a common requirement for locating/using contained objects.

Inspect the effective profile, groups, public authority, authorization lists, and adopted authority where applicable. A user who can see an object’s name is not necessarily authorized for every operation on its data. Diagnose the specific denied action before granting broader access.

</details>

## 2. What is the difference between *USE, *CHANGE, and *ALL?

**Intermediate**

<details>
<summary>Explain the answer</summary>

These are convenient authority combinations with different capabilities. *USE supports basic use/read operations as defined for the object; *CHANGE adds data-changing capabilities; *ALL is broader and includes object-related powers. Exact requirements depend on object type and operation.

Grant the smallest combination that satisfies the application. Do not equate SQL SELECT permission with authority to replace a file or delete its object. Review public authority and ownership when promoting newly created objects.

</details>

## 3. What is adopted authority, and why does it need care?

**Advanced**

<details>
<summary>Explain the answer</summary>

A program configured to adopt its owner’s authority can allow called work to perform operations using that authority according to the adoption rules. This can support a narrow controlled business function without broadly authorizing every user.

The entry point must validate inputs and avoid arbitrary command execution or uncontrolled object names. Understand call-chain behavior and where adoption is or is not honored. An adopted program owned by a highly privileged profile can expand the impact of a small input-validation defect.

</details>

## 4. Why is menu security insufficient?

**Advanced**

<details>
<summary>Explain the answer</summary>

A menu restricts one navigation path, but data and programs may also be reachable through SQL, file transfer, APIs, remote commands, or other interfaces. Object and data authority must enforce the real access policy.

Test with the actual low-privilege user through every supported entry point. Remove unnecessary authority, use appropriate service identities, and audit sensitive operations. Hiding a menu option does not prevent direct access if the underlying object remains broadly authorized.

</details>

## 5. How do you fix an authority error without granting *ALLOBJ?

**Advanced**

<details>
<summary>Explain the answer</summary>

Capture the denied operation and the job’s effective identity. Determine the library and object authorities required, then inspect group, authorization-list, public, and adopted paths. Grant a narrowly scoped entitlement through the application’s established security model.

Re-test both the intended operation and operations that should remain denied. Document why the access is needed and who owns it. *ALLOBJ can make a symptom disappear while removing essential boundaries across unrelated application data.

</details>

## 6. What security checks matter for scheduled and server jobs?

**Advanced**

<details>
<summary>Explain the answer</summary>

Inspect the run-under profile, special authorities, program adoption, library-list integrity, and who can change job descriptions, schedule entries, or executable objects. Batch entry points can expose privileged work without an interactive sign-on.

Separate deployment authority from routine execution, protect configuration and credentials, and log meaningful business actions. Verify external interfaces use encrypted transport and limited credentials. A disabled interactive login alone is not a complete statement about every supported execution path.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. Is library authority alone always enough to update a file?

A. No, the file operation also requires authority
B. Yes, all contained files become writable
C. Only for SQL
D. Only in batch

### 2. Why avoid *ALLOBJ as a routine fix?

A. It slows every CHAIN
B. It grants much broader access than the specific operation needs
C. It prevents program calls
D. It removes all job logs

### 3. Does hiding a menu option secure the underlying table?

A. Yes, against every interface
B. Only if the menu is CL
C. No
D. Only on 5250

### 4. An adopted-authority program must especially validate:

A. Only screen colors
B. Only report margins
C. Only source comments
D. Inputs and allowed operations/object names

### 5. What matters for batch security?

A. Run-under identity and who can modify its execution path
B. Only whether anyone signs on interactively
C. Only job name length
D. Only printer status

<details>
<summary>Answer key and explanations</summary>

1. **A — No, the file operation also requires authority** Both containing-library and object requirements must be considered.

2. **B — It grants much broader access than the specific operation needs** Diagnose and grant the narrow required authority instead.

3. **C — No** Other entry points can reach the data if object authority permits.

4. **D — Inputs and allowed operations/object names** It can execute with elevated effective authority, so a broad command path is dangerous.

5. **A — Run-under identity and who can modify its execution path** Scheduled execution has its own identity and configuration attack surface.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Object and library authority](https://www.ibm.com/docs/ssw_ibm_i_74/rzamv/rzamvundhowobjandlibauthtog.htm)
- [IBM: Batch workload and elevated authority analysis](https://www.ibm.com/support/pages/batch-workload-visibility-and-elevated-authority-analysis)
- [IBM: Authority options for SQL tuning](https://www.ibm.com/docs/ssw_ibm_i_74/rzahf/rzahfauthopt.htm)

[← Previous](system-operations.md) · [Next →](apis-integration.md)
