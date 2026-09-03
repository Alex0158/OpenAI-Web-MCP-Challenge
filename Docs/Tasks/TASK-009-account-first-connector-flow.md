# TASK-009: Build the Account-First Connector Flow

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-01

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P0`
- Owner: Eyad and project team
- Current increment: Account-linked device authorization, Re-entry-owned consent, background
  delivery polling, and fresh Codex dispatch now form one locally verified happy path.
- Next gate: TASK-003 owns production deployment, production identity, cross-machine evidence, and
  the supported Agent-runtime gate.
- Dependencies: TASK-003, ADR-0028, and the accepted Re-entry Core delivery contracts.

## Objective

Make Re-entry feel like install once, connect once, then leave it running:

1. the Connector starts authorization and opens Re-entry;
2. the user signs in and approves this Mac;
3. the Connector stores one scoped credential and can run in the background;
4. a Host backend requests consent with its organization credential;
5. the signed-in user approves on a Re-entry-owned surface and selects an authorized device; and
6. approved work reaches that Connector and starts one fresh Codex session with bounded context.

## Current gap and falsifiable outcome

Before this increment, the preview began with a Host-generated pairing code, required the user to
paste that code into the CLI, exited after one delivery check, and had the Host page forward a
consent decision. The dashboard's organization keys were also disconnected from the fixed preview
Host route.

The increment fails if, from fresh local state, the user must copy a Host pairing code, if a browser
credential or organization API key reaches the Connector or Codex prompt, if a second launch asks the
user to pair again, or if an approved delivery cannot be dispatched through the existing Connector
lease and acknowledgement contract.

## Required outcome

1. Add an outbound device-authorization flow initiated by the Connector and approved by an
   authenticated Re-entry account.
2. Keep developer organization API keys in Host server code and connect dashboard-issued keys to
   Host control-plane authentication in the product-preview composition.
3. Move the authoritative consent decision to a Re-entry-owned browser surface; return only opaque
   binding and status values to the Host.
4. Add a bounded long-running Connector command with graceful shutdown and no inbound listener.
5. Add a macOS installation path, readable terminal UX, and copyable human and coding-agent setup
   instructions without silently installing software or bypassing Codex login.
6. Preserve Receiver-owned Grant, delivery lease, activation, effect, and acknowledgement semantics.

## 4. Non-goals

- public deployment, production TLS, billing, MFA, account recovery, or fleet administration;
- silent installation, privilege escalation, automatic Codex login, or credential recovery;
- selecting a final Host product or claiming genuine Browser/WebMCP acquisition;
- resuming an existing Codex conversation instead of the accepted fresh-session preview;
- replacing Re-entry Core authority or weakening delivery leases and effect acknowledgement; or
- claiming broad macOS reliability from one-machine local evidence.

## 5. Verification and closure

Move to `verification_pending` only after the account authorization, browser consent, reused local
credential, background idle loop, one approved delivery, and fresh Codex dispatch all have focused
tests. Close at `locally_verified` only after package verification, browser comparison, Node 24
closure, current-truth writeback, and an exact claim-boundary review pass.

## Verification evidence

- A fresh account authorizes one Mac without a Host pairing code, then reuses the stored local
  credential.
- A dashboard-issued organization key authenticates Host-key registration and signed Manifest
  enrollment; the authenticated Re-entry page owns approval and device selection.
- One signed Event becomes a target-scoped delivery and traverses the existing Connector lease and
  fresh Codex dispatch seam without moving Host, browser, or Connector credentials across
  boundaries.
- Cloud Receiver, Host SDK, Local Connector, Re-entry Core, package, Next.js build, and responsive
  browser checks pass at the bounded local-preview claim recorded in CLOUD-010.

## 6. Reopen condition

Reopen if browser account identity is confused with Host identity, a Host can choose a Connector
without the user's consent, a Connector can claim across account or organization boundaries, the
background process retries unboundedly, or installation requires undocumented manual state repair.
