# Compile a Code Lab draft on your IBM i

The Code Lab works without an IBM i connection. Its browser checks and guided review help you reason about a draft, but they do not compile it. If you have access to an IBM i development system, you can optionally connect the Code Lab to a small companion service installed **on that system** and request a real compiler result.

The website stays on Netlify. Your source goes from your browser directly to the companion service on your IBM i. Netlify does not receive the source or a credential for that service. The companion service is separate software that your IBM i administrator must install and operate; entering an IBM i address into the website alone cannot make a browser compile RPGLE or CLLE.

## What this connection does

1. An administrator installs the companion service on an IBM i **development** partition, limits its account and working area, and gives you its HTTPS URL and a revocable compile token.
2. In Code Lab, open **Connect to IBM i**, enter that URL, and use the connection panel served by your IBM i to enter the token. The token stays in that panel's memory for the current session; it is not saved with your Code Lab draft or progress. The panel asks for confirmation before each compile; anyone who has the token and can reach the API can also call it directly.
3. Choose the source format and request a compile. Confirm the request in the IBM i panel. The service writes a temporary source stream file, invokes the corresponding IBM i compiler, and returns compiler messages and the listing to the browser.

The first version supports RPGLE, SQL RPGLE, and CLLE **module** compilation. It does not bind a program or service program, execute your code, run tests, or change a production object. A successful module compile means the compiler accepted that source in the service's configured environment. It does **not** prove that binding, runtime behavior, or business logic is correct. IBM documents the stream-file source and module options for [CRTRPGMOD](https://www.ibm.com/docs/en/i/7.5.0?topic=c-create-rpg-module), [CRTSQLRPGI](https://www.ibm.com/docs/en/i/7.4.0?topic=ssw_ibm_i_74%2Fcl%2Fcrtsqlrpgi.htm), and [CRTCLMOD](https://www.ibm.com/docs/en/i/7.5.0?topic=ssw_ibm_i_75%2Fcl%2Fcrtclmod.html).

Many Code Lab starters are deliberately partial. They may refer to a file, table, service program, or procedure that exists only in the exercise scenario. For a meaningful compile, finish the source and make approved dependencies available to the service profile's compile job. Source include directives (`/COPY`, `/INCLUDE`, SQL `INCLUDE`, and CL `INCLUDE`) are blocked by default because a compiler listing can expose readable include files. An administrator can enable them explicitly for a trusted, isolated service profile. Version one does not let a browser choose its library list or include paths. A missing object error can reflect the lab environment rather than an error in your syntax.

Each request is limited to 128 KiB of source. The service waits up to 30 seconds for the compile command and handles one request at a time; an IBM i compile job may outlive a timed-out PASE wrapper and need administrator cleanup. Oversized listings are marked as truncated. Source-line limits depend on the compiler, release, and options; the IBM i compiler reports them.

## Administrator setup checklist

- Use an IBM i release with the required RPG/CL/SQL compiler products and a supported Node.js installation in PASE. IBM documents [Node.js on IBM i](https://www.ibm.com/docs/en/i/7.5.0?topic=languages-nodejs). Check the compiler licences, Technology Refresh and PTF level on your partition.
- Run the companion service under a dedicated, restricted profile. Give it only the authorities needed for its private temporary source directory, scratch object library, and approved compile-time dependencies. Its compiler can inspect objects and files readable by that profile, and listings can reveal their source text when includes are enabled. Treat the token as sensitive read-and-compile access to that profile's environment. Use a development partition or isolated development environment; do not point it at production libraries.
- Make the service reachable from the learner's browser over **trusted HTTPS**, preferably through a VPN or other private network. The certificate must match the hostname used in Code Lab. IBM's [HTTP Server for i TLS guidance](https://www.ibm.com/docs/en/i/7.5.0?topic=security-considerations-using-tls-http-server) explains why HTTPS protects the connection; it does not replace access control.
- Set the exact allowed website origin in the service configuration so only the intended Code Lab can embed and message its connection panel. This origin restriction does not prevent a token holder from calling the HTTPS API directly. Do not use a wildcard origin. Issue an expiring token for this installed service; rotate it to revoke access. Keep tokens out of shell history, repositories, screenshots, and support tickets.
- Verify that the service is unable to target arbitrary libraries or execute arbitrary CL commands supplied by a browser. Its compile destination, limits, and available libraries should be configured on the IBM i side. The service should clean temporary source and objects after each request.

### Start the companion service

From a PASE shell on the IBM i development system, use the repository's `ibmi-compile-agent/` directory and Node.js 18 or newer. Create a dedicated scratch library first and grant the service profile only the authority it needs to create and delete its lab modules there. Use an uppercase IBM i library name of 1–10 valid characters. Choose a private IFS work directory that the same profile can write. Do not use a production library as the scratch library.

Generate a strong token and its SHA-256 hash locally:

```sh
node ibmi-compile-agent/server.mjs --generate-token
```

The command prints the **token once**, the hash to configure on the service, and a suggested expiry time. Give the token to the learner through an approved private channel. Configure the following environment variables in a protected service startup configuration; use the printed hash and an ISO 8601 UTC expiry timestamp, never the raw token:

| Variable | Value |
| --- | --- |
| `SITE_ORIGIN` | Exact site origin, for example `https://learn-as400.netlify.app` (no trailing slash). |
| `AGENT_TOKEN_HASH` | Lowercase SHA-256 hash printed by `--generate-token`. |
| `AGENT_TOKEN_EXPIRES_AT` | Future ISO 8601 UTC expiry timestamp in `YYYY-MM-DDTHH:mm:ssZ` format. |
| `SCRATCH_LIBRARY` | Dedicated IBM i library for temporary lab `*MODULE` objects. |
| `TLS_CERT_PATH`, `TLS_KEY_PATH` | Paths to the trusted HTTPS certificate and private key readable by the service profile. |
| `HOST` | Optional listen address; defaults to `127.0.0.1`. Set a private, reachable interface only if learners connect directly rather than through a reverse proxy. |
| `PORT` | Optional HTTPS port; defaults to `8443`. |
| `WORK_DIR` | Optional private IFS directory for temporary source files. |
| `ALLOW_INCLUDES` | Optional `true` to permit source include directives. Default is disabled. Enable only when the service profile and its readable files are isolated appropriately. |

Then start the service:

```sh
node ibmi-compile-agent/server.mjs
```

For direct access, the learner enters a URL such as `https://ibmi.example.internal:8443/` in Code Lab. The hostname must resolve and its certificate must be trusted **on the learner's device**. A service bound to the default loopback address needs an administrator-managed reverse proxy or tunnel; simply using the IBM i IP in the browser will not reach it. The service accepts an **HTTPS** `SITE_ORIGIN`, so local development must use HTTPS with a matching origin or test from the deployed website.

To revoke access, generate a new token, replace `AGENT_TOKEN_HASH` and `AGENT_TOKEN_EXPIRES_AT`, then restart the service. Version one has one active token per installed service. Inspect the scratch library for orphaned lab modules after an abrupt service failure or compile timeout; normal requests remove their temporary source and module. The public site does not install or start the service for you.

## Privacy and progress

The site never asks for your IBM i user profile password. Use only the compile token issued for this service, and enter it into the IBM i-served panel. Neither the token nor compiler responses become part of the site's browser-local progress record. A remote compile result is shown separately from the exercise's guided self-review and does not automatically mark an exercise or checkpoint as passed.

Source may contain proprietary field names, literals, or business logic. Obtain permission before sending it to any service, even one on your own organization's IBM i. The service owner controls its access logs and retention. The website cannot verify how a third-party installation is configured.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Connection panel does not load | Open the service HTTPS URL directly on the same device and network. Check VPN, firewall, listener, and the IBM i job running the service. |
| Browser reports a certificate problem | Use a hostname covered by a trusted certificate. Do not bypass a certificate warning to send source or a token. |
| Panel is blocked inside Code Lab | Check the service's allowed website origin and frame policy. Some managed browsers forbid embedded internal sites; ask your administrator about the browser policy. |
| Desktop connects but mobile does not | The phone must also reach the IBM i network and trust its certificate. If the host is private or local, the browser may additionally request local-network access. |
| Token is rejected | Ask the administrator to check expiry, revocation, and the service clock. Do not substitute your IBM i password. |
| An include directive is rejected | The service blocks source includes by default. Ask the administrator whether the service profile is isolated enough to enable them; do not enable them against sensitive libraries or IFS files. |
| Compile fails despite valid syntax | Check source format, missing copybooks/files/tables, library list, CCSID, authority, compiler licence, and release/PTF differences. Read the returned IBM i messages before changing source. |
| Compile passes but the exercise still shows incomplete | Compiler feedback and learning progress are separate. Finish the guided review and the exercise's graded decision to record progress. |

For browser network behavior, see Chrome's [local network access guidance](https://developer.chrome.com/blog/local-network-access). For compiler details, consult the IBM command pages linked above for **your** IBM i release.
