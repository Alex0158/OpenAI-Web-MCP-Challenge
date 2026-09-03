# HOST-002: WebMCP and Host SDK Composition

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Status:** `locally_verified` with bounded Browser runtime evidence  
**Opened:** 2026-09-01  
**Task:** [TASK-010](../Tasks/TASK-010-compose-webmcp-with-host-sdk.md)  
**Decision:** [ADR-0028](../Decisions/ADR-0028-adopt-account-first-connector-authorization.md)  
**Mechanism:** [Host Re-entry, WebMCP, and Human Boundary](../Mechanisms/05-host-reentry-webmcp-and-human-boundary.md)

## Objective and authority review

Make one ordinary browser JavaScript function reusable by the Host's normal UI and a top-level
WebMCP Site Tool, then require authenticated Receiver status confirmation before the browser can
receive a safe continuation identifier.

No new ADR was required. The implementation composes the accepted ADR-0028 browser handoff with
the existing Mechanism 05 Site Tool contract. It does not change Receiver Grant authority, the
Host Event, Connector polling, Agent activation, or the later human-consequence boundary.

## Affected and unaffected surfaces

Affected:

- `runtime/host-sdk/src/client.mjs`: shared consent action and imperative Site Tool registration;
- `runtime/host-sdk/app/`: runnable Next.js consumer, server confirmation, demo binding retention,
  and separate later-Event simulation;
- package and repository READMEs plus the owning Task, Mechanism, status, and evidence records.

Unaffected:

- frozen `mvp/`, immutable references, and Re-entry Core protocol values;
- Receiver consent, Grant, delivery-lease, effect, and acknowledgement authority;
- final Host selection, business event semantics, and resumed-stage tool inventory; and
- public deployment, npm publication, production Host persistence, and supported Agent selection.

## Implemented behavior

`@webmcp-challenge/host-sdk` v0.3 exports:

- `createReentryConsentAction`, which creates the Host consent session, shows the existing exact-
  origin popup handoff, and calls the Host confirmation callback only after an approved completion;
- `registerReentryWebMcpTool`, which registers that same function through top-level JavaScript and
  returns a visible `webmcp_unavailable` result without replacing the normal UI; and
- `ReentryConsentActionError`, which exposes bounded action-state and confirmation failures.

The browser action accepts only a safe continuation identifier from confirmation. An extra private
binding field is rejected. The sample's confirmation route re-reads Receiver status and keeps the
binding in a process-local server store; its separate Event route demonstrates that the later Host
business trigger, not the Site Tool invocation, sends the signed Event.

## Failure and recovery boundary

- If WebMCP is absent, the normal button remains available and the page reports that it is using the
  normal browser path.
- If consent is declined or cancelled, no Host confirmation callback runs.
- If a popup says approved but the Host server cannot confirm approved Receiver status, the action
  fails visibly and returns no continuation identifier.
- Concurrent use of the same action fails visibly rather than opening overlapping consent sessions.
- The sample continuation store clears on process restart. A real Host must retain the binding in
  its own durable, authenticated workflow store.

## Verification result

- Node 26.8.1: `cd runtime/host-sdk && npm run verify` passed 18 of 18 tests.
- Node 24.20.0: `node --test test/*.test.mjs` passed 18 of 18 tests.
- Node 24.20.0: the Next.js 16.3.4 sample production build passed and emitted the page plus consent,
  consent-status, and Event routes.
- `npm ls --omit=dev --all --json` reported only the intended local Re-entry Core runtime
  dependency.
- `npm pack --dry-run --json`, using a disposable cache because the machine npm cache is not
  writable, produced the intended five-file v0.3.0 package surface.
- The current Codex in-app Browser discovered `request_codex_reentry` on the live local page and
  invoked it with `{}`. The invocation returned the bounded `sdk_demo_not_configured` result and the
  page changed to the matching visible setup state, correlating the real Site Tool call to the shared
  React/SDK action.
- `cd runtime/cloud-receiver && npm run verify` passed 22 of 22 tests with loopback permission,
  preserving the consent-status, signed Event, and claimable-delivery integration contracts.
- Repository validator tests, repository validation, sensitive-pattern tests and scan, diff checks,
  and the changed-file English scan passed.

The Browser run intentionally omitted organization and signing secrets. It proves live registration,
discovery, invocation, and visible handler execution, not a newly configured consent, Event,
Connector, or Codex return chain. CLOUD-010 remains the local account-first chain evidence.

## Closure and residual risk

The increment is `locally_verified` with bounded Browser runtime evidence. Production Host storage,
real application input schemas, fresh resumed-stage Site Tools, a configured Browser-to-Receiver run,
cross-machine continuation, and a supported production Codex return remain open under the selected
Host and TASK-003 gates.

Reopen if the supported WebMCP registration shape changes, the shared action can approve without
server confirmation, browser output can contain the binding, or a selected Host cannot map the safe
continuation identifier back to an authenticated workflow and later Event.
