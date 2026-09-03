# CLOUD-010: Account-First Connector Flow

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Status:** `locally_verified`  
**Opened:** 2026-09-01  
**Task:** [TASK-009](../Tasks/TASK-009-account-first-connector-flow.md)  
**Decision:** [ADR-0028](../Decisions/ADR-0028-adopt-account-first-connector-authorization.md)

> **Current disposition:** `DEPRECATED` for the Cloud Receiver implementation — this record is
> historical evidence only. The runtime it describes was retired by [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md).

> Historical compatibility record for the connector-initiated account-authorization slice. The
> current normal first-run path uses the dashboard-issued pairing code in [CLOUD-011](CLOUD-011-dashboard-issued-connector-pairing.md);
> this record remains the evidence of the earlier account-first behavior.

## Objective and closure level

Build one locally testable, low-friction path from Re-entry account authorization through a
background Local Connector to a fresh Codex session, while keeping Host organization credentials,
browser account state, and Connector credentials in separate boundaries.

Target closure is `locally_verified`. Public deployment, broad Mac compatibility, and genuine
Browser/WebMCP execution remain outside the claim.

## Affected surfaces

- `runtime/cloud-receiver/`: account-linked device authorization, Re-entry consent, organization
  key authentication, product pages, and local-preview composition;
- `runtime/local-connector/`: first-run authorization, credential reuse, long-running polling,
  terminal UX, and macOS user-service installation output;
- `runtime/host-sdk/`: server-only organization authentication and browser handoff to the
  Re-entry-owned consent URL;
- repository and package READMEs: human setup, coding-agent setup, flow, limits, and verification;
- owning Task, ADR, Core status, Mechanism, and validation records when implementation changes their
  current truth.

## Explicitly unaffected

- frozen `mvp/`, immutable references, and the application-neutral Re-entry Core contracts;
- final Host selection and Host business semantics;
- supported Browser/WebMCP session acquisition; and
- public infrastructure, TLS, billing, MFA, recovery, and production fleet administration.

## Falsification and stop conditions

Stop and revise the design if implementation requires exposing an organization API key to browser
code, storing account cookies in the Connector, putting a Connector credential in Codex context,
adding an inbound local listener, bypassing explicit human consent, weakening delivery leases, or
silently falling back to Host-owned approval.

The increment is falsified by a fresh-state test that still requires a Host pairing code, a restart
that loses the authorized Connector, an account or organization cross-boundary claim, an unbounded
idle retry, or an approved delivery that cannot traverse the existing activation and acknowledgement
contracts.

## Verification plan

1. focused store and HTTP tests for pending, approved, denied, expired, reused, and wrong-account
   device authorization;
2. focused browser-consent tests for login requirement, exact challenge, target selection, denial,
   one-time decision, and opaque Host status;
3. Local Connector tests for first run, credential reuse, bounded idle polling, graceful stop,
   readable JSON/non-TTY output, and generated macOS user-service configuration;
4. Host SDK tests proving organization credentials stay server-only and browser code receives only
   the consent URL/challenge handle;
5. same-state desktop and narrow-width browser screenshots before and after the UI changes;
6. package verification, Node 24 closure, Re-entry Core aggregate verification where the changed
   contracts touch it, and repository governance checks; and
7. exact writeback of local, process, runtime, deployment, remote, and Agent-capability claims.

## Implemented surface

- `runtime/cloud-receiver/src/account-connector-control.mjs` provides Connector-initiated,
  account-approved device authorization and one-time delivery credential issuance.
- `runtime/cloud-receiver/src/account-consent-control.mjs` and
  `browser-account-authority.mjs` keep the consent decision on the authenticated Re-entry origin and
  return only opaque status and binding values to the Host.
- `runtime/cloud-receiver/src/product-flow-store.mjs` durably records product-preview device and
  consent state; `product-preview-composition.mjs` joins it to the unchanged Receiver Core.
- `runtime/cloud-receiver/src/landing-page.mjs` and `console-pages.mjs` implement the account,
  organization, connected-Mac, installation, consent, and developer-guidance journey.
- The Connector verification URL renders a dedicated account-choice screen; its contextual login
  and registration links preserve the pending device request and return to the final Mac approval.
- `runtime/host-sdk/src/server.mjs`, `client.mjs`, and `next.mjs` keep organization credentials on
  the Host server and open the exact Re-entry consent URL from a user gesture.
- `runtime/local-connector/src/main.mjs`, `pairing-client.mjs`, and `macos-service.mjs` implement
  one-command account authorization, credential reuse, bounded background polling, readable CLI
  status, and a per-user macOS LaunchAgent with no inbound listener.
- The root and package READMEs contain the human setup path, bounded limitations, and copyable
  instructions for a coding agent.

## Verification result

The account-first HTTP test crosses registration, Mac approval, Host-key registration, signed
Manifest consent, authenticated device selection, opaque binding, signed Event ingestion, and an
authorized Connector claim. It also verifies that an unauthenticated device URL renders the
connector-specific account choice and that contextual login and registration preserve the pending
request. Focused and aggregate verification passed on the Node 24 closure
baseline: Re-entry Core 79 tests, Cloud Receiver 22 tests, Host SDK 12 tests, and Local Connector 22
tests. The same package suites passed on the available Node 26 runtime. The Host SDK Next.js sample
build passed on Node 24, and the Local Connector package dry-run preserved its executable entrypoint.

Manual browser QA covered the landing, registration, organization chooser, workspace, connected-Mac
setup drawer, tab navigation, developer docs, the connector-specific account-choice and contextual
auth screens, and a 480-CSS-pixel responsive DOM check without horizontal overflow. A disposable
local global install found the bundled Codex executable and passed the read-only Connector preflight.

This is local, loopback, and macOS preview evidence. It does not establish public deployment,
production account/session security, package-registry publication, broad Mac compatibility,
existing Codex-session attachment, genuine Browser/WebMCP acquisition, Host effect, or
acknowledgement by a supported production Agent runtime.

## Reopen conditions

Reopen if account identity, device targeting, Host authentication, popup behavior, background
process lifecycle, or credential custody differs from ADR-0028, or if new evidence shows the local
preview cannot be packaged without changing Re-entry Core authority.
