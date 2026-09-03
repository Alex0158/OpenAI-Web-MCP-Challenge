# TASK-021: Build Cloud Receiver v2 Transport and Operations Boundary

**Status:** `closed` — Feature 6 locally verified at Receiver commit `300bce02e6a6f9b643a6de95a3596691304749b7`
**Owner:** Cloud Receiver v2 HTTP and operational boundary
**Profile:** Assured
**Scope:** `saas-boilerplate/` only, plus this Task, its ADR, evidence, and integration-test document
**Authority:** [ADR-0039](../Decisions/ADR-0039-adopt-cloud-receiver-v2-transport-operations.md)
**Source contract:** [Feature 06 — Transport, Errors, Health, and Operations](../Cloud-Receiver-Handoff/v2-build/06-transport-and-operations.md)

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Cloud Receiver v2 implementation team.
- Current increment: Add the shared bounded HTTP, error, health, and redacted-operations boundary
  after the Feature 5 acknowledgement gate is green; complete.
- Next gate: Run the received counterpart matrices and the combined Host SDK → Receiver → Local
  Connector → Host effect → acknowledgement test after their exact commits and authority mapping
  are accepted.
- Dependencies: [ADR-0010](../Decisions/ADR-0010-freeze-receiver-http-and-connector-transport.md),
  [ADR-0038](../Decisions/ADR-0038-adopt-cloud-receiver-v2-delivery-acknowledgement.md), and
  [TASK-020](TASK-020-build-cloud-receiver-v2-delivery-acknowledgement.md).

## Objective

Harden the v2 Express shell so protocol requests and operational responses have bounded bodies,
exact methods and content types, no redirects, stable redacted errors, no-store headers, and durable
readiness checks without adding compatibility or public Grant routes.

## Accepted boundary

- Preserve the exact v0.1 Event, Delivery Claim, and Delivery Acknowledgement routes and fields.
- Enforce the accepted 16 KiB request and 32 KiB JSON response limits and JSON/no-store policy.
- Map transport failures to the accepted stable codes and typed Receiver failures without messages,
  stacks, SQL, credentials, tokens, cookies, or private bindings.
- Add only shell-owned `GET /healthz` and `GET /readyz`; readiness checks PostgreSQL, and neither
  endpoint claims delivery or Host-effect success.
- Do not add public Grant, reset, diagnostics, push, WebSocket, or fallback routes.

## Acceptance gates

- `HTTP-001`–`HTTP-005` pass through the actual Express app and disposable PostgreSQL.
- All earlier Pairing, Consent, Event, Claim, and Acknowledgement suites remain green.
- Logs and responses prove secret-free behavior and bounded failures.
- Local, committed, runtime, and counterpart integration claims remain distinct.

## 4. Non-goals

Do not implement deployment/TLS termination, public Grant inspection/revocation, push delivery,
background supervision, Connector changes, Core changes, or Agent/Browser behavior.

## 5. Verification and closure

Detailed commands, runtime, database, red/green results, and counterpart exchange status are in
[CLOUD-019](../Development/CLOUD-019-cloud-receiver-v2-transport-operations.md) and the
[Cloud Receiver v2 test exchange](../Cloud-Receiver-Handoff/v2-build/09-cloud-receiver-test-exchange.md).

## 6. Reopen condition

Reopen if the transport contract needs a new route, status meaning, field, token placement, or body
limit.
