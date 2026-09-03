# TASK-015: Build Cloud Receiver v2 Consent, Targeting, and Internal Revocation Fence

**Status:** `closed` — Feature 2 locally verified
**Owner:** Cloud Receiver v2 implementation
**Profile:** Assured
**Scope:** `saas-boilerplate/` only, plus this Task's development/evidence record
**Authority:** [ADR-0035](../Decisions/ADR-0035-adopt-cloud-receiver-v2-consent-targeting.md)
**Source contract:** `Docs/Cloud-Receiver-Handoff/v2-build/02-consent-targeting-and-revocation.md`

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P0`
- Owner: Cloud Receiver v2 implementation team.
- Current increment: Implement and verify Consent, Targeting, and the configured-authority internal Grant revocation fence in the active v2 repository.
- Next gate: No next gate for TASK-015. Event work requires a separate authorized increment after this Feature 2 closure; public Grant inspection/revocation remains blocked by ADR-0013.
- Dependencies: [ADR-0035](../Decisions/ADR-0035-adopt-cloud-receiver-v2-consent-targeting.md), [ADR-0007](../Decisions/ADR-0007-freeze-reentry-core-v0.1-contract-kernel.md), [ADR-0008](../Decisions/ADR-0008-freeze-receiver-authority-and-durable-reservation.md), and the [Primary Development Runbook](../Engineering/03-primary-development-runbook.md).

## Objective

Implement and verify Feature 2 of Cloud Receiver v2: authenticated Host consent-session creation,
account approval/decline, one-subject/one-target binding, derived Grant status, and an internal
configured-authority revocation fence using Prisma and PostgreSQL.

## Acceptance gates

- `CONSENT-001`–`CONSENT-004` pass over real HTTP against PostgreSQL.
- `TARGET-001`–`TARGET-002` pass over real HTTP against PostgreSQL.
- `REVOKE-001` passes through the configured internal Grant-control authority; `revoked_at` is
  durable and the admission fence rejects further work as `grant_revoked`.
- Consent decisions, target binding, and Grant history survive direct database inspection.
- Host-facing responses contain no User account id, Connector id/token, delivery target id, or
  private binding fields.
- Public Grant inspection/revocation routes remain unavailable pending ADR-0013 acceptance.
- No Event ingress, signed Event implementation, delivery claim, or effect acknowledgment is
  started by this Task.

## 4. Non-goals

- Do not implement public Grant inspection or revocation. That remains a separate ADR-0013
  decision, tracked by ADR-0034.
- Do not implement Event work. The private Grant admission/revocation fence is the maximum
  Feature 2 revocation surface and is not an Event implementation.
- Do not modify the frozen `mvp/`, immutable reference snapshots, old Cloud Receiver, or
  Re-entry Core source.

## Verification record

The command, commit, runtime, database, and evidence are recorded in
[`CLOUD-015`](../Development/CLOUD-015-cloud-receiver-v2-consent-targeting.md) before closure.

## 5. Verification and closure

Feature 2 is closed at the locally verified boundary. `CONSENT-001`–`CONSENT-004`,
`TARGET-001`–`TARGET-002`, and `REVOKE-001` pass over real HTTP against disposable PostgreSQL;
the aggregate backend regression is green; and the host privacy, durable target, status, and
internal revocation-fence assertions, including the consent-popup handoff, are recorded in
[CLOUD-015](../Development/CLOUD-015-cloud-receiver-v2-consent-targeting.md).

Event work was not started and remains paused for a separate authorization. Public Grant
inspection/revocation routes were not implemented pending ADR-0013.

### Closure evidence — 2026-09-02

- **Commit:** Cloud Receiver v2 Feature 2 plus the consent-popup handoff is committed locally in
  `saas-boilerplate/` at `f67e741dd0392dd04f14d7d02764b7c0a7179dc5` on `main`; the local and
  remote branches now match after the exact tested commit was pushed to `origin/main`. It is not
  deployed. The parent repository's unrelated dirty work was not staged or changed for this
  implementation.
- **Verification:** The Feature 2 suite passed `1` suite and `7/7` tests, including `CONSENT-004`.
  The final backend aggregate passed `5` suites and `17/17` tests, including the Pairing regression.
  Prisma generate, migration, backend type-check/build, test type-check, and the frontend webpack
  build passed.
- **Runtime/database:** Node `v26.8.1` was the executed runtime; Node 24 was not installed on the
  machine. PostgreSQL `14.18` ran in a disposable local Homebrew cluster on `127.0.0.1:55435`,
  using fresh database `cloud_receiver_2_popup_handoff`; all three Prisma migrations applied
  successfully. Credentials were injected only in the shell and are redacted from this record.
- **Behavioral evidence:** Consent session creation validates the Host key and signed Manifest;
  approval/decline and pending/expired status are durable; one Host subject remains bound to one
  target; Host-facing responses omit account, Connector, target, and private Grant/binding fields;
  raw consent and Connector credentials are not persisted or logged; and the configured internal
  revocation authority durably sets `revoked_at` and fences later work as `grant_revoked`. A
  successful popup approve or decline emits only the public `reentry.consent.complete` message
  with the current consent-session id, decision status, and `window.location.origin`; failed
  decisions emit no message.
- **Boundary evidence:** Public Grant inspection/revocation requests return the generic
  `http_route_not_found` response, the Event route is absent, and no Event implementation was
  started. ADR-0013 and proposed ADR-0034 remain separate gates for any future public Grant
  control surface.

## 6. Reopen condition

Reopen if Consent authority, target selection, Host-facing privacy, Grant status or revocation,
public-route availability, or the recorded persistence and replay boundary changes.
