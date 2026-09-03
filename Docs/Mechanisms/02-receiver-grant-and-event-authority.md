# Receiver Grant and Event Authority

**Role:** CANONICAL mechanism contract  
**Status:** Protocol-v0.1 and additive standing-v0.2 Core/SQLite/HTTP references locally verified;
active v2 adds a locally verified standing kernel alongside unchanged v0.1 under an accepted but
unproven full pinned-conformance architecture; local committed-source upgrade is verified, while lifetime policy and product
controls remain open  
**Controls:** ADR-0007, ADR-0008, ADR-0013, ADR-0035, ADR-0036, ADR-0041, and ADR-0043 through
ADR-0045

## Selected-product notification boundary

[ADR-0046](../Decisions/ADR-0046-restore-bound-task-notification-continuation.md) keeps standing Consent, authenticated Event scope, deduplication, and
revocation, but makes the selected Receiver a notification authority, not an Agent/Game progress
monitor. Offline status alone does not revoke authorization. Pending notification capacity must
not wait for Game effects or Agent completion. TASK-029 owns exact settlement/backpressure and
protocol transition; TASK-027/TASK-033 retain their lifetime/control gates. Existing v0.1/v0.2
reservation and effect-ACK semantics below remain retained compatibility behavior, not the new
product acceptance test.

## Responsibility

This module owns the Receiver trust boundary after enrollment: the effective private Grant,
authenticated event acceptance, replay handling, atomic activation reservation, Grant inspection
and revocation, and creation of private pending Deliveries. The implemented v0.1 profile consumes
one run; the accepted v0.2 target keeps standing authority separate from each activation.

It does not own Host business truth, Connector transport, Agent activation, a production control
session, or a selected application's administration UI.

## Authority chain

```text
opaque public binding
-> private Grant resolution
-> stored issuer origin plus consented key ID select the trusted verification key
-> signed typed event matched to exact Grant scope
-> atomic v0.1 run consumption or v0.2 activation reservation
-> event + pending delivery
```

The event body cannot select its own issuer authority. The Receiver resolves the private Grant
first and uses the stored issuer origin, binding, correlation, workflow, event type, canonical URL,
expiry, revocation state, protocol mode, accepted sequence, and active reservation as the acceptance
boundary.

## Grant lifecycle

The effective status order is:

```text
revoked -> expired -> exhausted -> active
```

The Grant remains private. An authenticated same-subject control authority may inspect a bounded
summary or record one irreversible revocation time. Revocation deletes no history and cannot undo
a committed Host effect.

## Implemented protocol-v0.1 Event and replay contract

- protocol v0.1 accepts one bounded typed event and one run;
- `event_id` is the sole wire idempotency identity;
- exact replay returns the prior acceptance without another run or delivery;
- conflicting event-ID reuse fails;
- signature, time window, origin, binding, correlation, workflow, event type, sequence, state
  version, and canonical URL are validated;
- prompt, goal, tool list, artifact, free-form event payload, raw Grant, and context identity are
  forbidden; and
- event acceptance records pending work but performs no Connector or Agent call.

The page, not the event, remains authoritative for current Host state before mutation.

## Accepted protocol-v0.2 standing contract

ADR-0043 adds a versioned target without changing v0.1:

- one Consent decision creates one scoped, non-consumable standing Grant;
- `event_id` remains exact replay identity;
- Host-visible approval exposes only the public binding; the private receipt stays in the
  Receiver-owned Delivery path;
- every Event must use the exact Host key ID and SHA-256 SPKI public-key fingerprint consented for
  that Grant, unless a separately accepted audited rotation contract updates the binding; an
  alternate same-origin trusted key or same-ID resolver rebinding fails closed;
- `event_sequence` is positive and contiguous per standing Grant for newly accepted signals;
- one transaction advances sequence, records the Event, reserves one activation, and creates one
  pending Delivery;
- at most one Delivery may be non-terminal for a standing Grant in the initial profile;
- another new signal while that activation is open fails retryably as `activation_in_progress`, is
  not recorded, and does not consume its sequence;
- exact replay returns stored truth even after later revocation and never creates another Delivery;
- acknowledgement or explicit terminal Delivery state releases the activation slot but does not
  consume the standing Grant; and
- revocation, expiry, security invalidation, or material scope change ends future acceptance; and
- an Event whose `occurred_at` is at or after the Grant expiry is outside scope even when delivery
  and signature timestamps are otherwise valid.

Protocol-v0.2 Events are coalesced Agent signals, not a mirror of every Host domain event. They stay
payload-minimal and require the Agent to read current state at the canonical page. This section is a
locally verified application-neutral reference under RECORE-007. TASK-028 and TASK-033 own active-v2
pinned conformance, migration, and product adoption.

Schema 6 preserves older local preview rows but security-disables standing Grants that lack a
consented public-key fingerprint. They require a fresh Consent decision; current trust-directory
contents cannot retroactively supply missing consent evidence. Frozen v0.1 Grants are unaffected.

## Atomicity and races

One store transaction rechecks the live Grant and then either consumes the v0.1 run or reserves the
v0.2 activation while recording the Event and creating the private pending Delivery. A rollback
exposes none of those effects.

Revocation and event acceptance serialize by commit order:

- revocation first blocks a new event;
- event first preserves one accepted Delivery; a later revocation prevents further activation
  authority;
- exact accepted-event replay remains historical after revocation; and
- pre-revocation Host-effect convergence is handled by the delivery module without reopening the
  Grant.

## Code and focused verification

| Surface | Current source | Focused tests |
|---|---|---|
| Grant, event, replay, control methods | `reentry-core/src/receiver-core.mjs` | `reentry-core/test/receiver-core.test.mjs` |
| Standing Grant, ordered signal, one-active reservation, replay, and revocation | `reentry-core/src/standing-authorization-core.mjs` | `reentry-core/test/standing-authorization.test.mjs` and RECORE-007 |
| Durable atomic state | `reentry-core/src/sqlite-receiver-store.mjs` | `reentry-core/test/sqlite-receiver-store.test.mjs` |
| Schema and projections | `reentry-core/src/sqlite-receiver-schema.mjs` | store and migration cases |
| Versioned Event HTTP mapping and retryability | `reentry-core/src/cloud-receiver-http.mjs` and `receiver-http-contract.mjs` | `reentry-core/test/cloud-receiver-http.test.mjs` and `standing-cross-layer.test.mjs` |
| Cross-process fault boundaries | shared process fixtures | `reentry-core/test/process-fault-matrix.test.mjs` |
| Active v2 Grant, signed Event, replay, and reservation | `saas-boilerplate/backend/src/modules/consent/`, `modules/events/`, and Prisma `Grant`, `Event`, `Delivery` | `CONSENT-001`–`005`, `EVENT-001`–`004`, SDK Event contract, and SDK-006 |

## Current evidence and non-claims

Deterministic and separate-test-process protocol-v0.1 Core evidence covers exact replay, conflicts,
durable reopen, inspection, atomic revocation, revocation/event ordering, and one pre-commit forced
termination case. Active v2 separately covers signed Event acceptance, exact replay, invalid scope,
expiry/exhaustion/revocation fences, one-run reservation, and pending delivery in PostgreSQL.
The locally committed `Re-Entry` kernel also passes an additive standing migration, real Express two-signal
trace, and deterministic PostgreSQL authority/expiry/concurrency tests. ADR-0044 permits active v2
to remain independent only behind pinned black-box conformance, which is still open under TASK-028;
the minimum trace and exact-source PostgreSQL upgrade are locally verified, not full release
conformance. CLOUD-023 owns the reviewed identities and preserved-row evidence. Its effective Grant lifetime remains a
decision under TASK-027.
Neither suite proves arbitrary crash placement, power-loss safety,
multi-replica serialization, production identity, public Grant control, or a real Host-effect
authority. The Node 24 Core suite now proves standing authorization, sequence greater than one, two
effect-acknowledged Deliveries under one Grant, one-active backpressure, exact `/v0.2` HTTP,
Connector/Agent-Adapter handoff, replay, revocation, and durable restart at local reference scope. It
does not prove active-v2 release conformance, the normal Host facade, product Connector selection,
selected Host, distributed, or production behavior. Public account controls are proposed under
TASK-033, not implied by the internal same-user service seams.

## Application integration obligations

The selected Host backend must commit its business transition and event intent atomically, deliver
the same signed event at least once, retain issuer-key custody, and expose current workflow truth at
the canonical page. It cannot use the Receiver as the source of business state.

## Reopen conditions

Reopen ADR-0043 if a selected app requires multiple signal types under one authorization, parallel
activations, stronger in-flight cancellation, or backlog semantics beyond Host-side coalescing.
Reopen this module if a real store cannot preserve the transaction boundary, production identity
requires delegated control, or a measured consumer requires a versioned field the canonical page
cannot supply later.
