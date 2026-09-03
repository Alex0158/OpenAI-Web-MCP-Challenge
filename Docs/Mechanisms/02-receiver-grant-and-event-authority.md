# Receiver Grant and Event Authority

**Role:** CANONICAL mechanism contract  
**Status:** Core/SQLite reference and active v2 behavior locally verified separately; effective
Grant expiry and shared-Core conformance decisions open  
**Controls:** ADR-0007, ADR-0008, ADR-0013, ADR-0035, ADR-0036, and ADR-0041

## Responsibility

This module owns the Receiver trust boundary after enrollment: the effective private Grant,
authenticated event acceptance, replay handling, atomic one-run reservation, Grant inspection and
revocation, and creation of one private pending delivery.

It does not own Host business truth, Connector transport, Agent activation, a production control
session, or a selected application's administration UI.

## Authority chain

```text
opaque public binding
-> private Grant resolution
-> stored issuer origin selects trusted verification key
-> signed typed event matched to exact Grant scope
-> atomic run-budget consumption + event + pending delivery
```

The event body cannot select its own issuer authority. The Receiver resolves the private Grant
first and uses the stored issuer origin, binding, correlation, workflow, event type, canonical URL,
expiry, revocation state, and remaining run budget as the acceptance boundary.

## Grant lifecycle

The effective status order is:

```text
revoked -> expired -> exhausted -> active
```

The Grant remains private. An authenticated same-subject control authority may inspect a bounded
summary or record one irreversible revocation time. Revocation deletes no history and cannot undo
a committed Host effect.

## Event and replay contract

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

## Atomicity and races

One store transaction rechecks the live Grant, records the event, consumes the run, and creates
the private pending delivery. A rollback exposes none of those effects.

Revocation and event acceptance serialize by commit order:

- revocation first blocks a new event;
- event first preserves one accepted delivery but prevents later new activation authority;
- exact accepted-event replay remains historical after revocation; and
- pre-revocation Host-effect convergence is handled by the delivery module without reopening the
  Grant.

## Code and focused verification

| Surface | Current source | Focused tests |
|---|---|---|
| Grant, event, replay, control methods | `reentry-core/src/receiver-core.mjs` | `reentry-core/test/receiver-core.test.mjs` |
| Durable atomic state | `reentry-core/src/sqlite-receiver-store.mjs` | `reentry-core/test/sqlite-receiver-store.test.mjs` |
| Schema and projections | `reentry-core/src/sqlite-receiver-schema.mjs` | store and migration cases |
| Event HTTP mapping | `reentry-core/src/cloud-receiver-http.mjs` | `reentry-core/test/cloud-receiver-http.test.mjs` |
| Cross-process fault boundaries | shared process fixtures | `reentry-core/test/process-fault-matrix.test.mjs` |
| Active v2 Grant, signed Event, replay, and reservation | `saas-boilerplate/backend/src/modules/consent/`, `modules/events/`, and Prisma `Grant`, `Event`, `Delivery` | `CONSENT-001`–`005`, `EVENT-001`–`004`, SDK Event contract, and SDK-006 |

## Current evidence and non-claims

Deterministic and separate-test-process Core evidence covers exact replay, conflicts, rollback,
durable reopen, inspection, atomic revocation, revocation/event ordering, and one pre-commit forced
termination case. Active v2 separately covers signed Event acceptance, exact replay, invalid scope,
expiry/exhaustion/revocation fences, one-run reservation, and pending delivery in PostgreSQL.
**CONFLICTED:** active v2 does not compose Receiver Core (TASK-028), and its effective Grant lifetime
remains a decision under TASK-027. Neither suite proves arbitrary crash placement, power-loss safety,
multi-replica serialization, production identity, public Grant control, or a real Host-effect
authority.

## Application integration obligations

The selected Host backend must commit its business transition and event intent atomically, deliver
the same signed event at least once, retain issuer-key custody, and expose current workflow truth at
the canonical page. It cannot use the Receiver as the source of business state.

## Reopen conditions

Reopen if a selected app requires multiple event types or runs per Grant, a real store cannot
preserve the transaction boundary, production identity requires delegated control, or a measured
consumer requires a versioned event field that the page cannot supply later.
