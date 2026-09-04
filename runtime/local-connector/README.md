# Re-entry Local Connector

> **Selected-product gap:** [ADR-0046](../../Docs/Decisions/ADR-0046-restore-bound-task-notification-continuation.md)
> requires persistent binding and notification of the user's existing task, without waiting for
> Game completion. This checkout still uses fresh exec and retained effect-backed delivery contracts.
> Installation below is preview setup, not implementation of the restored target. TASK-035 owns
> binding, TASK-029 notification settlement, and TASK-034 actual same-task/Browser proof. Do not
> turn process acceptance into an old effect ACK or silently fall back to a new session.

> **Cloud Receiver dependency notice — 2026-09-03:** The former
> `runtime/cloud-receiver/` service is deprecated and must not receive new pairing, credentials, or
> traffic. The `re-entry-weld.vercel.app` hostname now serves the active frontend and is not the
> Receiver API origin. This Connector remains a reusable/local preview surface and defaults to the
> accepted active-v2 preview Receiver `https://cloud-receiver-delta.vercel.app`; pass `--receiver`
> for another accepted Receiver. This preview default is not a production deployment.

Install it once on the Mac where Codex should open; after one dashboard pairing ID and code, a macOS
LaunchAgent keeps the outbound Connector running at login.

> Current boundary: this is a verified macOS Connector preview from the current checkout; the npm
> release path is open. Published `@4xeoz/re-entry@0.2.20` reports Git commit `733d77f`, but that
> commit records package version `0.2.14`, and the tarball's bundled Core client rejects the active
> instruction-bearing lease with `connector_response_invalid`. TASK-032 owns a new exact-source
> compatible release. The current checkout starts a fresh `codex exec` process with bounded context;
> it does not prove Browser/WebMCP attachment or final Host effects. Its default `start` and
> `claim-once` paths dispatch an adapter attempt but do not obtain Host-effect proof or acknowledge
> the delivery; an unacknowledged lease can be reclaimed within the accepted three-attempt delivery
> contract. Do not read successful local dispatch as completed delivery.

## One-time install

Requirements: macOS, Node.js 24+, Codex installed and signed in, and an absolute project directory
Codex may read and write.

For the current instruction-bearing active-v2 path, use this checkout only as local development
evidence until TASK-032 closes:

```sh
npm install --global /absolute/path/to/OpenAI-Web-MCP-Challenge/runtime/local-connector
re-entry install
```

The registry command remains available for the immutable `0.2.20` artifact, but that version does
not consume current active-v2 deliveries and must not be used as working simple-flow evidence:

```sh
npx --yes @4xeoz/re-entry install
```

`npx` runs a temporary copy, so it does not leave a permanent shell command behind. Install the
small CLI globally once if you want to use `re-entry` from any folder afterward:

```sh
npm install --global @4xeoz/re-entry
```

The package installs both `re-entry` and the older `reentry` spelling; `re-entry` is the documented
command. If you keep using the temporary `npx` form, run later commands with the same short
executable prefix, for example `npx --yes @4xeoz/re-entry status`.

The CLI defaults to the current Cloud Receiver v2 preview at
`https://cloud-receiver-delta.vercel.app`. Override it with `--receiver` or
`REENTRY_RECEIVER_ORIGIN` when using another accepted Receiver. This preview default is not a
production deployment.

The interactive CLI first offers Desktop, the current folder, or a small folder browser. Choose
with ↑/↓ and Enter. If you want to skip the picker, pass the workspace directly:

```sh
npx --yes @4xeoz/re-entry install \
  --codex-cd /absolute/path/to/your/project
```

The guided screen stays intentionally small: **Workspace → System check → Connect Re-entry**. On
success it shows a compact copy-paste command catalog for status, activity, testing, account
lifecycle, and local diagnostics. Internal Connector IDs, credential paths, and log paths stay out
of the normal success screen.

Run this from the Host project directory, your home directory, or another normal working
directory—not from a checked-out `runtime/local-connector` package directory. npm can treat that
source directory as the package itself and fail to create the temporary executable link.

If your npm installation cannot create the temporary `npx` executable, use the one-time global
installation instead:

```sh
npm install --global @4xeoz/re-entry
re-entry install \
  --codex-cd /absolute/path/to/your/project
```

Use `--receiver` to select an accepted replacement Receiver, such as a local historical preview:

```sh
npx --yes @4xeoz/re-entry install \
  --receiver http://127.0.0.1:43224 \
  --codex-cd /absolute/path/to/your/project
```

`re-entry install` performs the whole user setup:

```text
choose Desktop, the current folder, or another Codex workspace
  -> check Node + find Codex + validate the selected directory
  -> open the dedicated Re-entry user account page in the default browser
  -> sign in or create a user account
  -> land on the user dashboard and click Pair this Mac
  -> enter the pairing ID and short code in the CLI
  -> save the device credential with mode 0600
  -> install and start a per-user macOS LaunchAgent
```

The Connector opens no local port and accepts no inbound connection. It polls Re-entry over an
outbound HTTPS connection in a deployed system; loopback HTTP is accepted only by the local
preview.

## Check it

If you installed the package globally:

```sh
re-entry status
re-entry listen
re-entry --help
re-entry stop
re-entry disconnect
re-entry uninstall
```

If you used the temporary `npx` invocation:

```sh
npx --yes @4xeoz/re-entry status
npx --yes @4xeoz/re-entry listen
npx --yes @4xeoz/re-entry --help
npx --yes @4xeoz/re-entry stop
npx --yes @4xeoz/re-entry disconnect
npx --yes @4xeoz/re-entry uninstall
```

The status view checks the local authorization, background job, Receiver reachability, Node, and
Codex. If the Receiver rejects a previously saved device credential, the Connector pauses instead
of retrying forever, and `status`/`listen` tell you to disconnect before reconnecting. `listen` watches
the already-running background Connector and displays new activity until you press Ctrl+C; it does
not start a competing second poller. Useful development commands are:

```sh
npx --yes @4xeoz/re-entry doctor --codex-cd /absolute/path/to/project
npx --yes @4xeoz/re-entry connect --receiver http://127.0.0.1:43224
npx --yes @4xeoz/re-entry claim-once --codex-cd /absolute/path/to/project
npx --yes @4xeoz/re-entry start --codex-cd /absolute/path/to/project
```

`claim-once` and the background `start` loop stop at adapter dispatch. They do not call the active
v2 acknowledgement endpoint because this package has no default Host-effect authority or proof
source. The separately verified end-to-end harness uses a distinct test effect/ack worker; that
harness is evidence for the protocol seam, not behavior supplied by the default Connector CLI.

Test the local Codex handoff without waiting for Cloud work:

```sh
npx --yes @4xeoz/re-entry test "Reply with: Re-entry is working."
```

This starts one fresh local Codex process through the same adapter seam used by real deliveries. It
forwards Codex output when run in an interactive terminal, so the smoke test behaves like the
underlying direct `codex exec` command. It does not create a Grant, claim Receiver work, or prove a
Desktop UI thread, browser, or WebMCP return path. If it times out, run the equivalent direct
`codex exec` command to inspect Codex's own output; the test does not contact the Receiver.

The one-shot test allows up to one hour by default. Override it with
`--activation-timeout <milliseconds>` when needed. Background delivery keeps its separate
60-second adapter bound.

To pause or remove the local Connector:

```sh
npx --yes @4xeoz/re-entry stop
npx --yes @4xeoz/re-entry disconnect
npx --yes @4xeoz/re-entry uninstall
```

`stop` pauses the macOS background service and keeps the account connection. `uninstall` requires
typing `DELETE`, then removes only the LaunchAgent, saved Connector credential, and Connector logs.
It does not recursively delete folders or uninstall the npm package. To remove a global npm
installation separately, run `npm uninstall --global @4xeoz/re-entry`.

`disconnect` is the account-device sign-out. It uses the saved Connector token to revoke this Mac's
Cloud access, then stops the LaunchAgent, removes the local credential, and leaves log files in
place. The dashboard keeps the device row for audit and shows it as **Disconnected**; it is no longer
eligible for consent or delivery. Exact replay is safe. If the Receiver cannot confirm revocation,
the command fails visibly and keeps the credential so you can retry without orphaning remote access.
When no credential exists, it performs only idempotent local cleanup.

`uninstall` is the stronger local-file cleanup and also removes Connector logs; it does not replace
the remote revocation step. Run `disconnect` first when this Mac is still connected.

Each credential file accepts one connection at a time. Repeating `connect` or `install` with the
same saved connection returns `already connected`; an expired, rejected, or different-Receiver
connection is not silently replaced. Run `disconnect`, then `install`, to connect this Mac to a
different account or Receiver. `connect` repeats only account authorization, while `install` is the
normal product path because it also installs the background job. `claim-once` is the smallest manual
delivery test. The legacy Host-code `pair` command follows the same one-connection rule and remains
only for compatibility tests.

`Ctrl+C` stops a foreground `start` process or closes the `listen` view. It does not remove the
saved connection; use `stop` to pause the background service or `disconnect` to clear it.

## Give this to a coding agent

Copy this prompt into a coding-agent task:

```text
Install the Re-entry Local Connector on this Mac. First read the package README. Verify Node.js 24
or newer and locate the Connector executable. Until TASK-032 closes, use the current checkout for
instruction-bearing active-v2 verification by installing
`/absolute/path/to/OpenAI-Web-MCP-Challenge/runtime/local-connector`; do not use registry
`@4xeoz/re-entry@0.2.20` as simple-flow evidence. Let the human create or sign in to a Re-entry
account, click Pair this Mac, and enter the pairing ID and code in the CLI; never copy browser cookies, organization
keys, Connector tokens, or private keys into chat, logs, source files, or git. Finish by running
`re-entry status` and report the bounded results without claiming Browser/WebMCP or production
deployment. If only the registry artifact is available, limit the report to setup/status behavior
and label active-v2 delivery compatibility unverified.
```

## Package map

- `src/main.mjs` — `re-entry` CLI and long-running poll loop.
- `src/pairing-client.mjs` — account pairing-ID/code redemption and legacy pairing compatibility.
- `src/disconnect-lifecycle.mjs` — remote-before-local Connector disconnection ordering.
- `src/credentials.mjs` — atomic local credential storage.
- `src/macos-service.mjs` — per-user LaunchAgent install, stop, uninstall, and status.
- `src/workspace-picker.mjs` — interactive Codex workspace selection.
- `src/local-connector.mjs` — one claim and activation boundary.
- `src/codex-exec-adapter.mjs` — fresh local Codex process adapter.
- `src/terminal-ui.mjs` — dependency-free human CLI presentation.

Verify the package with Node 24:

```sh
npm run verify
```

<details>
<summary>Historical Host-code pairing notes</summary>

The material below describes the older Host-issued pairing-code preview. It remains for protocol
traceability but is not the current account-first install path.

The Local Connector is one outbound-only Node.js process. It polls the Cloud Receiver for one
short delivery lease, starts one fresh local Codex process, and then exits. It is not a web server,
does not open a port on the user's Mac, and does not accept inbound connections from the Receiver.

This is a local preview, not a background daemon or a production Agent integration.

## What must be installed

The current package is kept inside this repository, so install the repository first:

1. macOS;
2. Node.js 24 or newer;
3. the ChatGPT/Codex application or a `codex` executable available on `PATH`;
4. a Host project directory that the local Codex process can read and write; and
5. a reachable Receiver origin. `http://127.0.0.1` is allowed only for the local preview; a
   Receiver on another machine must use HTTPS.

From a clean checkout:

```sh
git clone <repository-url>
cd OpenAI-Web-MCP-Challenge/runtime/local-connector
npm install
npm run verify
```

The package bundles the reusable `@webmcp-challenge/reentry-core` modules it imports. It can be
installed from npm without a checked-out repository or a local `file:` dependency at runtime.

## Package release gate

The package name is `@4xeoz/re-entry` and the Core client is bundled into the tarball. Do not publish
from the current mixed worktree or reuse immutable `0.2.20`. TASK-032 requires a new version from
one reviewed commit whose package version and bundled Core match the artifact. Before any separately
authorized publication, verify at least:

```sh
npm whoami
npm view @4xeoz/re-entry version
npm run verify
npm pack --dry-run --json
```

Extract the actual tarball into a clean consumer and prove that it accepts and preserves a valid
active-v2 `continuation.instruction`, rejects malformed instruction, retains the fixed Codex safety
frame, and passes the intended local Claim/full-chain scope on Node 24. After authorized publication,
read back `version`, `gitHead`, and integrity and confirm they match the reviewed source. Package
versions are immutable; never overwrite `0.2.20`.

After a compatible release is verified, users run `npx --yes @4xeoz/re-entry install`. The executable itself is still
named `re-entry`; the short package form works with the scoped package. The command uses the
built-in preview Receiver unless `--receiver` or
`REENTRY_RECEIVER_ORIGIN` overrides it.

A temporary `npx` invocation does not add `re-entry` to your shell `PATH`. If you prefer the shorter
bare commands, run `npm install --global @4xeoz/re-entry` once and then use `re-entry install`
directly.

## Check a Mac before pairing

Run the read-only readiness check before connecting the machine:

```sh
npm run doctor -- \
  --codex-cd "$HOME/Code/my-host-project"
```

`doctor` checks Node.js, finds Codex, runs `codex --version`, and checks that the Host directory
exists and is readable and writable. In a terminal it shows each check; with `--json` or piped
stdout it prints a bounded `connector_ready` JSON event when ready.

Codex lookup order is:

```text
--codex-binary
  -> CODEX_BINARY
  -> codex on PATH
  -> common macOS command directories
  -> ChatGPT.app/Codex.app in /Applications or ~/Applications
```

If Codex is installed in a non-standard location, configure it without changing source:

```sh
npm run doctor -- \
  --codex-binary "/path/to/codex" \
  --codex-cd "$HOME/Code/my-host-project"
```

The same `--codex-binary` and `--codex-cd` values are used by `claim-once`.

## Start with the guided CLI

For a human using the terminal, the simplest entry point is:

```sh
npm start -- \
  --receiver http://127.0.0.1:43218 \
  --codex-cd "$HOME/Code/my-host-project"
```

On the first run, the Connector checks the Mac, opens the dedicated Re-entry user account page,
waits for you to create or sign in to an account, lands on the user dashboard, and asks for the
pairing ID and code. It then stores the credential. On later runs it reuses the saved credential and
skips pairing:

```sh
npm start -- --codex-cd "$HOME/Code/my-host-project"
```

This guided command is still a one-shot preview: it exits after finding no work or after starting
one Codex session. It does not yet install itself as a background service. The explicit `pair` and
`claim-once` commands below remain available for scripts and for testing each block separately.

When attached to a terminal, the CLI shows a readable status view with steps, checks, approval
state, and next actions. When stdout is piped, or when `--json` is supplied, it emits bounded JSON
events instead so another process can consume it:

```sh
npm start -- --json --codex-cd "$HOME/Code/my-host-project"
```

## Compatibility: Host-code pairing (legacy)

Pairing connects one local Connector to one already-authenticated Host user. It is separate from
the Host organization's API key and does not give the Connector permission to create Grants or
send Host events.

The older compatibility flow is:

```text
Host backend -> Receiver: start pairing for its Host-user reference
Receiver -> Host backend: one-time user code + verification URL
Connector -> Receiver: claim the code
Connector -> browser: open the verification URL
user -> Receiver page: click Approve
Connector -> Receiver: poll until approved
Receiver -> Connector: one Connector credential
Connector -> local disk: save the credential with mode 0600
```

The current preview does not use this Host-issued code path. Use `re-entry install` above, where
the authenticated Re-entry dashboard creates the code.

```sh
curl -s -X POST http://127.0.0.1:43218/v0.1/pairing-sessions \
  -H 'Authorization: Bearer host-preview-api-key' \
  -H 'Content-Type: application/json' \
  --data '{"host_subject_ref":"host_user_001"}'
```

Run the Connector and enter the returned `user_code` when it asks for it. The code is not placed
in shell history:

```sh
npm start -- pair \
  --receiver http://127.0.0.1:43218 \
  --credential-file "$HOME/.webmcp-connector/credentials.json"
```

For a non-interactive script, pass the code explicitly instead:

```sh
npm start -- pair \
  --receiver http://127.0.0.1:43218 \
  --code 'ABCD-EFGH-IJKL-MNOP' \
  --credential-file "$HOME/.webmcp-connector/credentials.json"
```

In an interactive terminal, the Connector shows the verification URL and waits for you to press
Enter before opening the approval page. If the browser does not open, use the displayed URL
manually and click **Approve**. The command keeps polling until approval or expiry, then prints
`connector_paired`. JSON and other non-interactive callers continue without the Enter prompt.

The credential file contains the local bearer credential and is protected with filesystem mode
0600. Do not commit it, copy it into a Host prompt, or put it in a repository. The Connector never
prints the bearer value. The current preview permits one active pairing for a Host user; a second
pairing returns `host_subject_already_paired` until the preview state is revoked or reset.

## Claim one delivery and start Codex

After pairing, run one manual poll:

```sh
npm start -- claim-once \
  --credential-file "$HOME/.webmcp-connector/credentials.json" \
  --codex-cd "$HOME/Code/my-host-project"
```

The command performs this sequence:

```text
read local credential
  -> preflight Node, Codex, and Host directory
  -> ask Receiver for one delivery lease
  -> validate the lease
  -> start `codex exec --cd <Host project> <fixed continuation prompt>`
  -> print the typed activation result
```

The fixed prompt contains the canonical page, workflow, event, state version, and human decision
boundary. It does not contain the Receiver bearer, lease token, or private process configuration.
There is no existing-session lookup or thread mapping.

The result meanings are:

- `connector_idle`: no pending delivery was available;
- `activation_dispatch_accepted`: the local Codex process exited successfully; and
- `outcome_unknown` or another typed result: the process failed, timed out, or the activation was
  rejected.

`activation_dispatch_accepted` does not prove that Browser access, page-bound WebMCP execution,
Host-effect verification, or acknowledgement occurred. Browser permission and the Agent-to-Browser
connection remain separate runtime capabilities. A future production Connector may run this
operation under a supervisor or scheduler; the current CLI is one-shot.

## Troubleshooting

| Code | Meaning | Next action |
|---|---|---|
| `connector_node_unsupported` | Node is older than 24 | Install/use Node 24 or newer |
| `connector_codex_not_found` | No default Codex executable was found | Install Codex, add it to `PATH`, or use `--codex-binary` |
| `connector_codex_binary_not_found` | The configured executable is missing or not executable | Correct the path or remove the override |
| `connector_codex_unusable` | `codex --version` failed | Open/login/update Codex, then rerun `doctor` |
| `connector_codex_cd_missing` | The Host directory does not exist | Correct `--codex-cd` |
| `connector_codex_cd_unusable` | The Host directory is not readable and writable | Fix local permissions |
| `connector_credentials_missing` | Pairing has not been completed for this credential file | Run `pair` |
| `connector_pairing_id_missing` | Guided account pairing needs the public pairing ID | Copy the pairing ID shown beside the code in the Re-entry dashboard |
| `connector_pairing_code_missing` | Guided account pairing needs a one-time code | Ask the Host backend for a new pairing ID and code, then run `connect` again |
| `account_pairing_code_invalid` | The entered account code is invalid | Use the eight-character code shown in the Re-entry dashboard |
| `pairing_code_invalid` | The entered code is not the expected 16-character Host code | Use a code like `ABCD-EFGH-IJKL-MNOP` from the Host backend |
| `pairing_request_timeout` | Receiver did not answer in time | Check the Receiver origin and network |
| `pairing_expired` | The one-time pairing window expired | Ask the Host backend for a new code |

## Package boundary

- `src/codex-discovery.mjs` — Codex lookup, version verification, Node check, and Host-directory check;
- `src/pairing-client.mjs` — one-time pairing claim, browser open, and poll;
- `src/credentials.mjs` — atomic local credential file with restrictive permissions;
- `src/local-connector.mjs` — one claim and typed adapter dispatch;
- `src/codex-exec-adapter.mjs` — the fresh-session Codex adapter inside the Connector process;
- `src/terminal-ui.mjs` — the dependency-free human terminal presentation; and
- `src/main.mjs` — the small CLI process, guided `start`, and `doctor` command.

Run package checks with:

```sh
npm run check:syntax
npm run test:codex
npm test
npm run verify
```

The reusable delivery protocol remains in `reentry-core/`; this package consumes it rather than
forking Receiver or delivery semantics.

</details>
