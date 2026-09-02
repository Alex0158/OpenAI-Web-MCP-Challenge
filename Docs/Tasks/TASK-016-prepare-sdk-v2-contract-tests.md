# TASK-016: Prepare SDK to Cloud Receiver v2 Contract Tests

**Status:** `closed` — all v2 SDK contract cases and real local browser flows green against the tested Receiver commit
**Owner:** SDK development and Cloud Receiver v2 teams
**Profile:** Assured
**Scope:** `runtime/host-sdk/test/`, the v2 SDK handoff document, and the SDK development record
**Authority:** [ADR-0035](../Decisions/ADR-0035-adopt-cloud-receiver-v2-consent-targeting.md)
**Source contract:** [SDK to Cloud Receiver v2 Integration Contract](../Cloud-Receiver-Handoff/v2-build/08-sdk-cloud-receiver-integration.md)

## Task Control

- Type: `verification`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: SDK development and Cloud Receiver v2 teams.
- Current increment: Exercise the actual SDK Host-key, consent-session, consent-status, and
  browser completion handoff calls against the v2 Receiver contract.
- Next gate: None for TASK-016. Public Grant control and Event work remain separately gated.
- Dependencies: Feature 2 at [TASK-015](TASK-015-build-cloud-receiver-v2-consent-targeting.md), [ADR-0035](../Decisions/ADR-0035-adopt-cloud-receiver-v2-consent-targeting.md), and the [Primary Development Runbook](../Engineering/03-primary-development-runbook.md).

## 1. Objective

Prepare red/contract tests that prove how the SDK calls Cloud Receiver v2 and what the Receiver must
return for Host-key registration, consent-session creation, consent status, and browser handoff.
The tests must cross the real SDK request builder and the real v2 app/database boundary without
adding production fallbacks or treating local evidence as deployed integration.

## 2. Acceptance gates

- `SDK-V2-001` proves `registerHostKey()` sends only the public Ed25519 key with organization Bearer
  authentication and accepts the v2 `webmcp.reentry_host_key` envelope plus idempotent replay.
- `SDK-V2-002` proves `createConsentSession()` sends the complete SDK-signed Manifest and accepts
  the opaque v2 session/URL envelope without exposing the Host subject or organization key.
- `SDK-V2-003` proves `getConsentSession()` returns pending and approved status, including only the
  public binding shape and no Connector or delivery-target identifiers.
- `SDK-V2-004` asserts the Receiver HTML emits the exact
  `reentry.consent.complete` popup message required by `createReentryConsentPrompt()`.
- All four cases run against the actual `saas-boilerplate/backend` app and disposable PostgreSQL;
  `SDK-V2-004` is green after the Receiver emits the event on successful decisions.

## 3. Assumptions and boundaries

- Feature 2 and the consent-popup handoff are green locally at Receiver commit
  `f67e741dd0392dd04f14d7d02764b7c0a7179dc5`; the commit is not claimed pushed, deployed, or
  externally verified.
- The test harness uses the real Express app through Supertest and a fresh PostgreSQL database. It
  does not fabricate successful Receiver responses and does not prove a hosted endpoint.
- The account decision is Receiver-owned at `POST /v0.1/account-consent-decisions`. The SDK's
  older `decideConsent()` path at `/v0.1/consent-decisions` is not used as a fallback and remains
  outside the v2 account-first contract.
- The browser completion message is exactly `{ type, consent_session_id, status }`, sent by the
  consent popup to the exact consent origin. The SDK will not poll or accept another transport.

## 4. Non-goals

- Do not add SDK fallback routes, polling, alternate transports, or response-shape coercion.
- Do not begin Event ingress, delivery, acknowledgement, public Grant control, deployment, or
  production integration.
- Do not modify `mvp/`, immutable references, the retired v1 Receiver, or Re-entry Core.

## 5. Verification and closure

Execution results and remaining blockers are recorded in
[`SDK-003`](../Development/SDK-003-cloud-receiver-v2-contract-tests.md).

### Closure condition

This task is closed: all four SDK contract cases were run against the real local v2 Receiver and
disposable PostgreSQL, and the unchanged browser SDK completed real local approve and decline popup
flows through the Receiver. No SDK fallback, polling, or alternate route was added.

### Closure evidence — 2026-09-02

- `SDK-V2-001`–`SDK-V2-004`: `4/4` passed against the actual Receiver app and fresh PostgreSQL.
- Normal SDK syntax and unit/adapter verification: `18/18` passed.
- Backend regression: `5/5` suites and `17/17` tests passed, including the Receiver popup handoff
  test.
- Real browser: Google Chrome headless via Playwright passed both approve and decline popup flows;
  each decision returned HTTP `200`, the SDK accepted the exact completion event from the matching
  popup source and origin, and Receiver status was verified as `approved` / `active` or `declined`
  with no binding.
- Runtime/database: Node `v26.8.1`; PostgreSQL `14.18` on `127.0.0.1:55436`, database
  `sdk_v2_contract_final`; credentials were supplied only in the shell.
- Receiver commit: `f67e741dd0392dd04f14d7d02764b7c0a7179dc5`; Local Connector source was unchanged.
- Browser assumption: the real-browser run used same-origin local configuration with
  `FRONTEND_URL=RECEIVER_PUBLIC_URL=http://127.0.0.1:4010`; no split-origin or deployed integration
  claim is made.
- Public Grant control, Event work, deployment, and production integration remain out of scope.

## 6. Reopen condition

Reopen if a required SDK v2 response shape, Receiver route, browser completion message, authority
boundary, or privacy assertion changes; if a split-origin or deployed browser flow is required as a
new gate; or if any future work proposes polling, a fallback route, an alternate transport, or a
change to the unchanged SDK production behavior.
