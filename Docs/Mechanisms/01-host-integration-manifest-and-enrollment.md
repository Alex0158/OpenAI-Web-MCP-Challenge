# Host Integration, Manifest, and Enrollment

**Role:** CANONICAL mechanism contract  
**Status:** Protocol-v0.1 contract retained; standing-v0.2 protocol, low-level Host signer, and Core
enrollment reference and active-v2 internal kernel locally verified; public standing controls,
normal Host facade, selected-Host storage, and effective-expiry policy unresolved; former receiver handoff historical; production consent surface
open  
**Controls:** ADR-0007, ADR-0008, historical ADR-0021, ADR-0022 and ADR-0028, plus active ADR-0035
and ADR-0041 through ADR-0045

## Selected-product enrollment requirement

[ADR-0046](../Decisions/ADR-0046-restore-bound-task-notification-continuation.md) adds a required trusted local enrollment association from approved Grant to
the user's selected existing task. Account/device selection is not task selection. The Adapter
owns durable private task custody; Manifest, Host, and Receiver never select or carry a raw task
locator. TASK-035 must specify capture, ownership, partial enrollment failure, and restart recovery;
current enrollment code does not perform this step. The v0.1/v0.2 schemas below remain unchanged.

## Responsibility

This module turns one authoritative Host workflow into a bounded re-entry offer and, after a
Receiver-owned human decision, one public Host binding plus one private continuation receipt. The
approved binding may represent a v0.1 one-run Grant or a v0.2 standing Grant; viewing either offer
creates no authority.

It owns:

- Host-side Manifest issuance and detached signing;
- trusted page-origin anchoring and canonical workflow identity;
- the distinction between viewing an offer and granting authority;
- Receiver-owned consent-challenge creation and decision verification;
- effective Grant narrowing;
- public binding and private receipt separation; and
- exact enrollment idempotency and conflict behavior.

It does not own Host business transitions, later event acceptance, delivery, Agent activation,
production browser-session security, or the selected app's consent wording and UI.

## Authority and data flow

```text
authoritative Host backend
-> signed bounded Manifest
-> live page exposes Manifest through WebMCP
-> Receiver verifies expected page origin and issuer
-> Receiver creates challenge with no future authority
-> Re-entry-owned authenticated account decision and target-device selection
-> private one-run or standing Grant + public binding + private receipt
```

The Host owns workflow identity, current state version, canonical URL, event type, and issuer key.
The Receiver owns challenge state, account identity, subject binding, delivery-target eligibility,
effective expiry, decision validity, Grant identity, and private receipt. The Host receives an
opaque consent URL and status handle. It cannot prove consent with a boolean, header, event field,
Host-supplied subject, or Host-selected Connector.

## Inputs and outputs

The exact Manifest and binding schemas are frozen by ADR-0007 and protocol vectors. At this layer:

- display title and reason are bounded untrusted presentation text;
- offer expiry and Grant expiry are separate;
- `max_runs` is one for protocol v0.1;
- protocol v0.2 uses explicit standing mode and one-active-activation scope rather than a large
  `max_runs` value;
- expected origin comes from the actual page-acquisition boundary;
- a successful approval returns only the public binding to the Host; the private receipt remains in
  the Receiver-owned Delivery path;
- the public binding contains no Grant, subject, delivery-target, Connector, Agent, or context
  credential; and
- the private receipt contains no display copy, prompt, tool list, artifact, or Host event payload.

## Standing-authorization v0.2 enrollment target

ADR-0043 allows one informed Consent decision to create one non-consumable standing Grant. Its
visible scope binds subject, issuer origin and key, canonical workflow and URL, one Agent signal
type, immutable reason/instruction, selected delivery target, effective lifetime, continuation mode,
human boundary, and a one-active-activation limit.

The Consent session remains short-lived and single-decision. The resulting authorization is a
different durable object: it survives individual signals and process restarts until revoked,
expired, security-invalidated, or materially respecified. Ordinary Host state changes do not require
re-consent. A different origin, workflow, URL, signal type, instruction, subject, target, or human
boundary does.

The additive protocol, low-level `StandingReentryHostSdk`, and Core enrollment reference are locally
verified by RECORE-007 without changing v0.1. Event ID, sequence, occurrence time, and workflow
snapshot stay explicit Host-outbox inputs. Active Cloud Receiver v2 now implements the internal
standing enrollment/decision kernel in its locally verified and committed `Re-Entry` source. Its public
standing Consent/control shell is only proposed; the normal Host facade, selected-Host persistence,
and product controls have not adopted it. TASK-028/TASK-033 own pinned-source and product proofs.

## Invariants and failure semantics

- Reading or validating a Manifest creates no Grant.
- Manifest ID reuse is idempotent only for exact canonical content.
- Unknown fields, untrusted origin, invalid signature, stale offer, invalid time ordering, or
  oversized data fail before challenge creation.
- Decline creates no future authority.
- Approval is accepted only from the configured consent authority and only while the effective
  offer and Grant windows remain live.
- A standing Grant persists the exact consented Host key ID and SHA-256 SPKI public-key fingerprint.
  Another trusted key for the same origin, including different material resolved under the same
  key ID, cannot exercise that Grant without new Consent or a separately accepted audited rotation
  path. Approval's `decided_at` must precede both the offer and effective Grant expiry.
- The Receiver may narrow requested authority and never broaden it.
- Raw browser consent tokens are not persisted or logged. In the account-first preview, a
  short-lived token is carried only inside the Re-entry URL; the Host receives an opaque challenge
  handle and later an opaque status and binding.
- No fallback enrollment or default delivery target exists.

## Code and focused verification

> `runtime/cloud-receiver/` entries describe the retired implementation. `saas-boilerplate/` is the
> active v2 implementation, but it does not become normative merely by existing; Core/09 records
> its expiry and Receiver-Core conformance decisions.

| Surface | Current source | Focused tests |
|---|---|---|
| Manifest schema, canonical JSON, signatures, bindings, receipts | `reentry-core/src/protocol.mjs` | `reentry-core/test/protocol.test.mjs` |
| Standing Manifest, binding, receipt, and Consent reference | `reentry-core/src/standing-protocol.mjs`, `standing-authorization-core.mjs`, and schema-v6 `receiver_standing_*` tables | `reentry-core/test/standing-authorization.test.mjs` and RECORE-007 |
| Host issuance | `reentry-core/src/host-sdk.mjs` | `reentry-core/test/host-sdk.test.mjs` |
| Standing Host issuance with explicit durable Event identity | `reentry-core/src/standing-host-sdk.mjs` | `reentry-core/test/standing-host-sdk.test.mjs` and `standing-cross-layer.test.mjs` |
| Challenge and decision integration | `reentry-core/src/receiver-core.mjs` | `reentry-core/test/receiver-core.test.mjs` |
| Durable reference enrollment state | `reentry-core/src/sqlite-receiver-store.mjs` | `reentry-core/test/sqlite-receiver-store.test.mjs` |
| Local preview Host-key registration and lookup | `runtime/cloud-receiver/src/host-key-control.mjs` and `pairing-store.mjs` | `runtime/cloud-receiver/test/host-key-control.test.mjs` |
| Local preview consent-session handoff | `runtime/cloud-receiver/src/consent-control.mjs`, `pairing-store.mjs`, and `runtime/host-sdk/src/` | `runtime/cloud-receiver/test/consent-control.test.mjs` and `runtime/host-sdk/test/` |
| Account-first consent and device selection | `runtime/cloud-receiver/src/account-consent-control.mjs`, `browser-account-authority.mjs`, `product-flow-store.mjs`, and `runtime/host-sdk/src/` | `runtime/cloud-receiver/test/product-flow.test.mjs` and `runtime/host-sdk/test/` |
| Active v2 Host key, Consent session, target binding, and Grant | `saas-boilerplate/backend/src/modules/consent/`, Prisma `HostKey`, `ConsentSession`, `HostSubjectBinding`, and `Grant`; `runtime/host-sdk/src/server.mjs` | active v2 `CONSENT-001`–`005`, `TARGET-001`–`002`, `REVOKE-001`, SDK v2 contract tests, and SDK-006 |
| Active consent document and popup completion | `saas-boilerplate/backend/src/modules/consent/consent-page.ts`; `runtime/host-sdk/src/client.mjs` | consent renderer tests, `CONSENT-004`–`005`, SDK browser tests, and CLOUD-022 |

## Current evidence and non-claims

Strict shapes, signing, origin anchoring, challenge creation, active v2 organization-authenticated
consent handoff, authenticated account approval, explicit target selection, private/public
separation, idempotency, and durable persistence are locally verified. **CONFLICTED:** the retained
active-v2 v0.1 path uses the shorter Consent-session expiry as the approved Grant expiry and does not display it;
TASK-027 must select and verify the policy. Current evidence does not prove a production identity
provider, key rotation/recovery, deployed full flow, or real-user consent comprehension.

## Application integration obligations

A selected Host application must supply a real workflow record, domain-language explanation,
canonical URL, current state version, one legitimate later signal, issuer key custody, and a normal
human UI. For v0.2 it must also expose standing scope, lifetime, target, activity, and revocation
clearly. It must not create a Grant merely because the user or Agent viewed an offer.

## Reopen conditions

Reopen if a selected app proves a missing Manifest field cannot be obtained from the canonical
page, a supported WebMCP contract supplies a safer enrollment primitive, or production consent
identity cannot implement the current authority port without weakening subject or action binding.
