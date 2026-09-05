# APIs, JSON & integration

[Question index](README.md) · Production engineering · Advanced

Expose business logic and connect systems with explicit contracts and reliable failure handling.

## 1. How can an RPG application expose a service?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Options include a supported Integrated Web Services deployment over suitable program/procedure interfaces or an application service layer that calls IBM i business logic. The choice depends on the contract, installed versions, security, and operational needs.

Separate HTTP concerns from reusable business procedures. Define request types, validation, response/error mapping, authentication, and transaction boundaries. Wrapping a program with HTTP does not automatically make screen-oriented global-state logic safe for concurrent requests.

</details>

## 2. What should you check before calling an IBM i API?

**Intermediate**

<details>
<summary>Explain the answer</summary>

Read the API’s exact prototype, required and optional parameter groups, qualified-name format, buffer lengths, and error-code structure. Many APIs use structured receiver formats with offsets and sizes; treating them as arbitrary strings is unsafe.

Allocate enough storage, initialize lengths correctly, and check returned bytes/diagnostics before reading fields. Use a supported format version and handle additional returned data without assuming a fixed layout copied from an old example.

</details>

## 3. Why do CCSIDs matter in integrations?

**Intermediate**

<details>
<summary>Explain the answer</summary>

CCSIDs identify character encoding interpretations. IBM i applications often exchange data between EBCDIC-oriented database fields and UTF-8-oriented web or stream interfaces. Incorrect conversion can corrupt punctuation, non-ASCII names, or JSON syntax.

Define encoding at each boundary and test multilingual content. Distinguish binary data from text; blindly translating binary payloads damages them. A transfer completing successfully does not prove the received bytes represent the intended characters.

</details>

## 4. How should an API handle retries and timeouts?

**Advanced**

<details>
<summary>Explain the answer</summary>

Set bounded connection and operation timeouts, classify retryable failures, and use backoff rather than immediate unbounded loops. A timeout means the client did not receive a timely result; it does not prove the server performed no work.

Use an idempotency key for operations such as posting payments and expose a way to retrieve the prior result. Record correlation identifiers across IBM i and the external service. Avoid holding database locks while waiting through long network retries.

</details>

## 5. How should JSON be parsed and validated?

**Advanced**

<details>
<summary>Explain the answer</summary>

Use a structured parser or supported SQL JSON facilities instead of substring slicing. Validate required fields, types, lengths, ranges, and the business meaning of identifiers. Distinguish missing, null, and empty string values.

Return predictable validation errors without exposing implementation internals. Test nested objects, escaped characters, unexpected fields, and large payload limits. Successful parsing only proves syntactic validity; it does not authorize the requested business action.

</details>

## 6. How do you design an integration that survives partial failure?

**Advanced**

<details>
<summary>Explain the answer</summary>

Write the local business change and durable outbound intent together when they share a database transaction. Dispatch independently, track delivery attempts, and make the receiver idempotent. Reconcile ambiguous outcomes using stable operation identifiers.

Define ownership of retries, compensation, and manual resolution. A local COMMIT cannot guarantee that a remote ERP or payment provider has committed the matching action. Expose operational states such as pending, delivered, rejected, and requires review rather than a single misleading success flag.

</details>

## Checkpoint — 5 MCQs

Answer all five before checking the key. Aim for 5/5 before continuing.

### 1. What does a network timeout prove?

A. The server certainly rolled back
B. The client did not receive a timely response
C. The request was never received
D. The operation must be safe to duplicate

### 2. What prevents duplicate effects on retry?

A. A different random key for every retry
B. A larger payload
C. An idempotency key with stored outcome handling
D. Only a longer timeout

### 3. Why check an API receiver length?

A. To increase job priority
B. To select a printer
C. To change the library list
D. To avoid reading beyond valid returned data

### 4. Which method is appropriate for JSON?

A. A structured parser plus schema/business validation
B. Splitting only on commas
C. Replacing quotes manually
D. Assuming ASCII always

### 5. What needs explicit definition at text boundaries?

A. Only file extension
B. Encoding/CCSID conversion
C. Only subsystem name
D. Only job queue priority

<details>
<summary>Answer key and explanations</summary>

1. **B — The client did not receive a timely response** Reconcile outcomes before retrying non-idempotent work.

2. **C — An idempotency key with stored outcome handling** The same business operation must be recognized across repeated deliveries.

3. **D — To avoid reading beyond valid returned data** Structured APIs have buffer-size and returned-data contracts.

4. **A — A structured parser plus schema/business validation** JSON nesting and escaping require proper parsing, followed by validation.

5. **B — Encoding/CCSID conversion** Correct transfer of bytes is different from correct interpretation of text.

</details>

## References

Research date: 5 September 2026. IBM i release and PTF requirements vary; check the version of each linked reference.

- [IBM: Integrated web services articles](https://www.ibm.com/support/pages/integrated-web-services-articles)
- [IBM: Data queue server](https://www.ibm.com/docs/en/i/7.6.0?topic=programs-data-queue-server)
- [IBM: Integrated file system](https://www.ibm.com/docs/en/i/7.4.0?topic=system-integrated-file-ifs)
- [IBM Redbooks: Modernizing IBM i applications](https://www.redbooks.ibm.com/redbooks/pdfs/sg248185.pdf)

[← Previous](security-authorities.md) · [Next →](performance.md)
