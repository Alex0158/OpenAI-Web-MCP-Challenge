# ADR-0045 — Adopt the Standing Transport Profile v0.2

**Status:** Accepted  
**Date:** 2026-09-03  
**Owners:** Re-entry Core, Host SDK, Cloud Receiver v2, Local Connector  
**Related:** ADR-0007 through ADR-0013, ADR-0041, ADR-0043, ADR-0044, TASK-028,
TASK-029, TASK-032, TASK-033

## Context

ADR-0043 defines standing authorization and the Core/SQLite reference implements its state
transitions, but every ordinary transport surface still selects protocol v0.1. The existing Host
SDK fixes `max_runs = 1` and sequence one, the HTTP adapter exposes only `/v0.1/*`, the Connector
client validates only v0.1 leases and acknowledgements, and the Agent Adapter rejects sequence
greater than one. Reusing those routes with different response bodies would create silent version
ambiguity and could let one component interpret standing authority as a one-shot Grant.

The standing Core also marks `activation_in_progress` as retryable, while the frozen v0.1 HTTP
error body exposes only a bounded error code. A Host outbox cannot safely preserve and retry the same
Event identity unless v0.2 transports that disposition explicitly.

## Decision

Re-entry will add an explicit, additive standing transport profile. Protocol v0.1 routes, shapes,
defaults, vectors, and rejection behavior remain unchanged.

The protocol-kernel routes are:

| Operation | Protocol v0.1 | Standing protocol v0.2 |
|---|---|---|
| Event acceptance | `/v0.1/events` | `/v0.2/events` |
| Delivery claim | `/v0.1/delivery-claims` | `/v0.2/delivery-claims` |
| Effect acknowledgement | `/v0.1/delivery-acknowledgements` | `/v0.2/delivery-acknowledgements` |

An adapter dispatches solely from the exact route to the matching Receiver profile. It must not
infer a version from body fields, retry another version, follow a redirect as negotiation, or return
a v0.2 body from a v0.1 route.

Successful v0.2 Event, claim, no-work, and acknowledgement status codes retain the corresponding
v0.1 transport meanings. Their protocol objects identify version `0.2`; a standing lease carries a
standing receipt and a positive per-Grant Event sequence. Claim and acknowledgement request field
names remain unchanged because version selection is already explicit in the route.

Every v0.2 HTTP failure returns an exact bounded body:

```json
{"error":{"code":"activation_in_progress","retryable":true}}
```

`retryable` is always a boolean. It is `true` only when the normative typed failure explicitly marks
the same request safe to retry; it is `false` for validation, authority, scope, conflict, and unknown
failures without that mark. The v0.1 error body remains `{ "error": { "code": "..." } }`.

## Host SDK boundary

The Core package will expose a separate `StandingReentryHostSdk`; it will not overload the frozen
v0.1 class. The standing SDK issues signed v0.2 Manifests and Events, but it does not own Host
business state, network transport, Consent, or sequence persistence.

For every new signal, the Host supplies an outbox-persisted `eventId`, positive `eventSequence`,
`occurredAt`, and workflow snapshot. The SDK never increments a process-memory counter. Exact retry
reuses the same inputs and therefore the same canonical signed Event body. The Receiver remains the
authority for contiguous sequence acceptance and one-active backpressure.

The later normal facade may expose `enroll -> confirm -> signal -> inspect/revoke`, but it must keep
the Host private key, organization credential, standing handle, and sequence allocator server-side.
This ADR does not invent active-v2 Consent, inspection, or revocation paths.

## Connector and Agent Adapter boundary

The outbound Connector client selects one supported protocol version before a claim. Its default
remains v0.1 for compatibility. Selecting v0.2 changes the exact route and response validator; it
does not enable fallback or downgrade. A v0.2 response on a v0.1 request, or the reverse, fails.

The Agent Adapter accepts one credential-free activation derived from either a valid v0.1 lease or a
valid v0.2 standing lease. It preserves the selected protocol version and Event sequence but never
receives the standing Grant, Consent token, Connector credential, or authority to schedule another
activation. Standing authorization changes how often Deliveries may be created, not the authority
inside one Agent turn.

Adapter acceptance is not Host-effect proof. Neither profile automatically acknowledges a Delivery
from an Agent result; TASK-029 still owns the real effect-authority composition.

## Shell-owned surfaces

Consent sessions, account identity, target selection, Connector pairing, Grant inspection,
revocation UI, health, readiness, and operator controls remain Receiver-shell responsibilities.
The active Receiver must add a same-user/session-authorized standing control surface before product
closure; an Organization API key or Host-supplied subject cannot inspect or revoke a user's Grant.
Its route names require an exact-source active-v2 contract and are intentionally not standardized by
this kernel transport decision.

## Compatibility and release enforcement

- Unsupported versions fail closed; there is no content negotiation or implicit upgrade.
- A v0.1 Grant is never upgraded in place. One new informed Consent creates a v0.2 Grant.
- The first local slice may select v0.2 explicitly in constructors and tests. Product pairing and
  stored Connector credentials need an explicit capability-selection design before v0.2 becomes a
  CLI or service default.
- ADR-0044's pinned black-box conformance gate applies to every retained Receiver implementation.
- Exact active-v2 PostgreSQL migration, account controls, deployment, and Connector publication are
  separate reviewed increments; local reference success is not deployed evidence.

## Consequences

The Host, Receiver, Connector, and Agent Adapter can move to standing authorization without
weakening or ambiguously reinterpreting v0.1. Retryable backpressure survives the HTTP boundary and
the Host retains durable identity control. The cost is explicit dual-version dispatch and tests
across every retained transport implementation.

## Rejected alternatives

### Reuse `/v0.1/*` and inspect body version

This makes route meaning unstable, risks downgrade confusion, and breaks frozen consumers.

### Auto-negotiate or retry another version

Authority-bearing operations must not silently change semantics after a failure.

### Hide Event sequence inside the SDK process

An in-memory counter loses exact replay identity across restart and cannot share authority with a
durable Host outbox.

### Treat Agent completion as acknowledgement

Agent narration or adapter return does not prove a correlated Host effect.

## Verification requirement

The local reference must prove one standing Consent, two sequential signed Events over `/v0.2`,
retryable backpressure before the first acknowledgement, two Connector claim/dispatch/effect/ACK
cycles, restart, inspection, revocation, and rejection of a third Event. Focused tests must also
prove exact v0.1 regression, wrong-version rejection, positive v0.2 sequence, response bounds,
credential omission, and no automatic retry or acknowledgement.
