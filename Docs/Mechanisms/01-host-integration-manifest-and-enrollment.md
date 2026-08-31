# Host Integration, Manifest, and Enrollment

**Role:** CANONICAL mechanism contract  
**Status:** Application-neutral contract locally verified; production consent surface open  
**Controls:** ADR-0007 and ADR-0008

## Responsibility

This module turns one authoritative Host workflow state into a bounded re-entry offer and, after
a Receiver-owned human decision, one public Host binding plus one private continuation receipt.

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
-> Receiver-owned authenticated decision
-> private one-run Grant + public binding + private receipt
```

The Host owns workflow identity, current state version, canonical URL, event type, and issuer key.
The Receiver owns challenge state, subject identity, delivery target eligibility, effective expiry,
decision validity, Grant identity, and private receipt. The caller cannot prove consent with a
boolean, header, event field, or Host-supplied subject.

## Inputs and outputs

The exact Manifest and binding schemas are frozen by ADR-0007 and protocol vectors. At this layer:

- display title and reason are bounded untrusted presentation text;
- offer expiry and Grant expiry are separate;
- `max_runs` is one for protocol v0.1;
- expected origin comes from the actual page-acquisition boundary;
- the public binding contains no Grant, subject, delivery-target, Connector, Agent, or context
  credential; and
- the private receipt contains no display copy, prompt, tool list, artifact, or Host event payload.

## Invariants and failure semantics

- Reading or validating a Manifest creates no Grant.
- Manifest ID reuse is idempotent only for exact canonical content.
- Unknown fields, untrusted origin, invalid signature, stale offer, invalid time ordering, or
  oversized data fail before challenge creation.
- Decline creates no future authority.
- Approval is accepted only from the configured consent authority and only while the effective
  offer and Grant windows remain live.
- The Receiver may narrow requested authority and never broaden it.
- Raw consent tokens are not persisted, returned, or logged.
- No fallback enrollment or default delivery target exists.

## Code and focused verification

| Surface | Current source | Focused tests |
|---|---|---|
| Manifest schema, canonical JSON, signatures, bindings, receipts | `reentry-core/src/protocol.mjs` | `reentry-core/test/protocol.test.mjs` |
| Host issuance | `reentry-core/src/host-sdk.mjs` | `reentry-core/test/host-sdk.test.mjs` |
| Challenge and decision integration | `reentry-core/src/receiver-core.mjs` | `reentry-core/test/receiver-core.test.mjs` |
| Durable reference enrollment state | `reentry-core/src/sqlite-receiver-store.mjs` | `reentry-core/test/sqlite-receiver-store.test.mjs` |

## Current evidence and non-claims

Strict shapes, signing, origin anchoring, challenge creation, deterministic trusted consent,
private/public separation, idempotency, expiry narrowing, and durable reference persistence are
locally verified. The deterministic consent authority does not prove a production Receiver UI,
browser session, anti-CSRF implementation, identity provider, pairing flow, key lifecycle, or
real-user consent comprehension.

## Application integration obligations

A selected Host application must supply a real workflow record, domain-language explanation,
canonical URL, current state version, one legitimate later event, issuer key custody, and a normal
human UI. It must not create a Grant merely because the user or Agent viewed an offer.

## Reopen conditions

Reopen if a selected app proves a missing Manifest field cannot be obtained from the canonical
page, a supported WebMCP contract supplies a safer enrollment primitive, or production consent
identity cannot implement the current authority port without weakening subject or action binding.
