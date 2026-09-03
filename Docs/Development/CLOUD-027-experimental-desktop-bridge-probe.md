# CLOUD-027: Experimental Desktop Bridge Probe

**Role:** DEVELOPMENT implementation and bounded runtime evidence record  
**Status:** Local client implemented; live admission blocked before submission  
**Date:** 2026-09-04  
**Authority:** [ADR-0047](../Decisions/ADR-0047-authorize-local-desktop-bridge-probe.md)  
**Task:** [TASK-035](../Tasks/TASK-035-bind-existing-agent-task-during-enrollment.md)

## Increment and challenge

Build a default-disabled one-shot local client with one real disposable-task consumer. Test whether
the MVP 1 native Desktop task-control route can still admit a correlated input and wake the exact
existing task on the installed build. Native success alone cannot satisfy the wake claim.

This is Assured: private local IPC and one existing conversation are affected. Only the new
`runtime/experimental-desktop-bridge/` source/tests and scoped documentation are owned. No changes
to frozen `mvp/`, product Connector/SDK/Core, active Receiver, Game, deployment, branch, or global
configuration. Retained Q1 input is preserved and may be consumed when the task wakes.

## Source and runtime preflight

The frozen [P0 verdict](../../mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md) records
same-task continuation and fresh genuine WebMCP through a private current-build relay. It is a
reference for route discovery, not proof of this new client or product notification semantics.
The historical P0 app was `26.825.41651`, build `7345`. The installed app-tools wrapper still uses a
length-prefixed JSON-RPC native pipe and executor
caller metadata. The current app-provided socket is present, same-UID, non-symlink, mode `0600`;
its immediate parent has sticky mode `1777`. No endpoint permissions were changed.

Installed ChatGPT Desktop is `26.901.20858`, build `7658`. Node `24.13.1` was observed at initial
intake, but the later unqualified `node` command resolved to `26.5.0`; that runtime executed the
three real read-only connection attempts. The reproducible closure checks explicitly use Node
`24.20.0` via the installed Node 24 path, not the moving PATH default. The source branch is
shared `main`, with 29 pre-existing local commits ahead of fetched upstream at intake. Owner-held
Task 026/032, Game and RightSpot changes remain untouched.

## Verification and outcome

### Implemented boundary

The separate zero-dependency module contains a bounded native client, an exact-target probe/observer,
and a stdin-only CLI. It does not import frozen MVP code. Default mode only inspects; explicit send
mode permits one internally constructed inert input. The native client and bridge each fence repeat
submission. There is no listener, reconnect, automatic retry, alternate endpoint, or production
integration. Process-local fencing does not provide cross-process idempotency.

The endpoint is checked before and after connection, and the connection uses its verified canonical
path. This closes an ancestor-alias race found during independent review. Other reviewed regressions
cover an older queued turn being mistaken for a new-input wake and non-MCP tool activity being missed.
The observer distinguishes a new correlated turn from a response inside an already-started turn,
tracks older Q1 input independently, and keeps native error text, task content, and locators private.

### Live result

| Check | Actual observation | Claim boundary |
|---|---|---|
| New CLI read-only preflight | `preflight_failed`, `submission:not_sent`; its own connection closed | Exact-task readback was not reached |
| New native client's read-only catalog diagnostic | `native_connection_closed`, before a catalog response | No task operation or send |
| Frozen MVP native client, read-only comparison | Same immediate close before catalog, not a timeout | Frozen files unchanged; not a fallback send |
| App's existing log, bounded read-only inspection | Three `dynamic_app_tools_peer_rejected` events with reason `missing-code-signing-identity`, at `23:23:47.904`, `23:24:12.761`, and `23:24:38.722` UTC on September 3 | These correspond to the three local read-only attempts on September 4 in Europe/London |
| New B1 probe | **Not submitted** | No acceptance, input-role, turn, marker-response, Browser, or Game claim |
| Prior Q1 | No resend or removal operation | Its current queue/consumption state was not rechecked in this failed native preflight |

The first CLI revision returned exit zero despite its structured preflight failure; closure fixes
that to nonzero and adds fixed allowlisted native failure codes. The failed real invocation is not
relabelled as having run the corrected CLI. Final subprocess tests verify the corrected failure path
against fake sockets, without another real connection.

### Cause and limits

Read-only inspection of the installed `app.asar`, entry `.vite/build/main-b_QrpbvH.js`, verifies:

- `pie`/`gie` accept the attempted JSON-RPC `tools/list` shape; framing remains four-byte
  little-endian length plus UTF-8 JSON on this machine.
- `mie` uses the default `Tf()` socket peer authorizer. `Zre.handleSocketConnection` runs it before
  installing the message handler, and immediately destroys unauthorized connections.
- The packaged macOS production build enables the native peer-authorization addon. Its static
  reason strings include missing/untrusted code-signing identity; live logs supply the specific
  observed rejection above.

This is an admission failure at the current App's process-identity boundary, not a demonstrated
task-continuity failure or a reason to create fresh tasks. The exact accepted signing/parent-process
policy and a supported standalone enrollment route are **not established** by these observations.
Do not infer that merely signing the Connector will grant access. Do not switch executables,
spoof a trusted process, disable the authorizer, or modify app/global settings to force admission.

The historical P0 same-task/Browser/WebMCP success remains valid for its named old build and private
route. It cannot close the current-build standalone Connector gate. The supported queue result in
CLOUD-026 remains separate partial evidence; neither result establishes that all possible supported
same-task routes are impossible.

### Local checks and Git closure

The final Node `24.20.0` suite passes **89/89** unit, fake-socket, and subprocess checks. The native
client contributes 43, the bridge 24, and CLI subprocess coverage 22. These checks use only fixture
identities and endpoints; subprocesses do not inherit real caller/pipe environment. Syntax checks
pass. Earlier unqualified Node `26.5.0` runs are supplementary, not the closure baseline.

Repository validator tests pass `6/6`, sensitive-scanner tests pass `3/3`, indexed repository
validation passes, and the staged diff has no whitespace errors. The 15 owned files contain no
scanner findings, CJK text, or UUID-shaped private locators. The full-repository sensitive scan
still fails with **21 pre-existing matches in seven unchanged Game documents**; no scanner rule or
Game file was changed to suppress them. Whole-repository scan closure remains open.

Independent review checked endpoint races, observation attribution, failure codes/exits, and
canonical next-step consistency. Result: no remaining identified blocker to this disabled local
harness and its evidence record; live admission itself remains blocked. No Core/Receiver aggregate
was rerun because no product executable, transport contract, or dependency was changed. No new real
submission, Receiver operation, authenticated Game tool, or release check was attempted.

Only the 15 owned experimental source/test/document paths are included in local closure. At the
pre-commit readback (`f3fc1c4`), shared `main` is 34 commits ahead of fetched `origin/main`, reflecting concurrent
owner work beyond the 29-commit intake. This increment does not validate or authorize publishing
those commits. No push, CI, deployment, publication, or judge-reproduction claim is made; owner-held
Game, RightSpot, and other Task changes remain untouched.

## Reconciliation and remaining gates

ADR-0047 authorizes this experiment only. ADR-0046's selected product is unchanged. Mechanism 04
and Core/00 now distinguish the implemented local harness from blocked native admission. TASK-035's
durable enrollment, TASK-029's notification receipt, and TASK-034's authenticated Game Browser/WebMCP
remain open. This source is disabled experimental work, not a shipping Adapter.

The highest-leverage next gate is to establish an App-recognized, supported way for the external
Connector to address the owning Desktop runtime and existing task, including legitimate peer
identity/custody requirements. If none is exposed, obtain an explicit platform integration decision;
do not replace the product with fresh Agents or polling disguised as event wake. Reopen the live
probe only after that admission boundary is resolved and its route is reviewed. Binding-store,
notification-receipt, and Game integration implementation do not resolve this blocker by themselves.
