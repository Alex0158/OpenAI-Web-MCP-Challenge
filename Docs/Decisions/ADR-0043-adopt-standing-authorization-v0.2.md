# ADR-0043 — Adopt Standing Authorization v0.2

**Status:** Accepted  
**Date:** 2026-09-03  
**Owners:** Project manager, Re-entry Core, Host SDK, Cloud Receiver v2, Local Connector  
**Related:** ADR-0007 through ADR-0013, ADR-0035 through ADR-0042, TASK-027 through TASK-029,
TASK-033

## Selected-product amendment

[ADR-0046](ADR-0046-restore-bound-task-notification-continuation.md) controls the selected product:
notify the bound existing task, with no Receiver dependency on Agent/Game completion. Fresh-session
sufficiency and effect-gated product completion are superseded for that target. This record's
exact preview/compatibility implementation, routes, objects, and evidence remain unchanged; no
generic adapter result may be substituted into an existing effect ACK. TASK-029 owns the explicit
notification-protocol transition, and TASK-035/TASK-034 own real binding/runtime integration.

## Context

Protocol v0.1 intentionally authorizes one bounded future Event and consumes the private Grant when
that Event creates one pending Delivery. This makes Consent, replay, revocation, and delivery races
small and auditable, but it does not support a Host whose authoritative state repeatedly creates new
Agent work.

Sleepless Kingdom supplies the concrete pressure. A soldier may return, deposit resources, and
become idle many times. Asking the user to approve a new Re-entry Grant after every such transition
would defeat the intended continuous coordination between the website and the Agent. Conversely,
making `max_runs` very large would preserve the wrong abstraction: it would hide long-lived
authority inside a consumable counter without defining concurrency, backpressure, sequence,
revocation, scope change, or user visibility.

## Decision

Re-entry will add an additive protocol-v0.2 **standing authorization** mode. Protocol v0.1 remains
frozen and valid for one-shot continuations.

One Receiver-owned, authenticated human Consent decision may create one private standing Grant and
one opaque public Host binding. The Grant is non-consumable across matching Events. It remains live
across page, browser, Agent, Connector, and Receiver restarts until the first of:

- explicit user or authorized-control revocation;
- effective expiry or policy-mandated renewal;
- issuer/security invalidation; or
- a material change to the consented scope.

Standing does not mean unbounded execution. Every accepted Event atomically reserves exactly one
bounded activation and creates exactly one pending Delivery. The initial conformance profile permits
at most one non-terminal activation per standing Grant.

## Consented scope

The approved scope binds at least:

- authenticated subject;
- trusted issuer origin and Host key identity plus public-key material;
- canonical workflow identity and URL;
- one bounded Agent signal type;
- immutable displayed reason/instruction;
- selected delivery target;
- continuation mode;
- human consequence boundary;
- effective lifetime; and
- one-active-activation limit.

A change to any of those values requires a new Consent decision, except an explicitly designed,
authenticated, and audited credential rotation that preserves the same authority. Ordinary Host
state, artifact revision, resource totals, soldier state, and other current business data are not
consent scope; the Agent must read them from the canonical page on every activation.

The reference pins the key ID and SHA-256 fingerprint of the consented Ed25519 public key's SPKI
DER bytes. An origin-trusted alternate key or a resolver that rebinds the same key ID to different
material cannot exercise that Grant. Key registration or alias replacement is not an audited
rotation path.

## Signal, sequence, and replay semantics

Protocol v0.2 Events are bounded Agent signals, not raw domain-event transport. The Host may keep a
high-frequency immutable domain-event log, but it must coalesce relevant transitions into a durable
signal such as `idle_soldier_available`. The signal means “read current authoritative state; useful
Agent work may exist,” not “blindly repeat the prior command.”

`idle_soldier_available` is an illustrative product signal, not an accepted Sleepless Kingdom wire
contract. The selected Game's first integration proof remains its already governed
`CargoLostToMonster` signal; any new idle-soldier signal requires the scoped Game authority to accept
its eligibility, coalescing, command boundary, and evidence separately.

For each standing Grant:

1. `event_id` is the exact replay identity.
2. `event_sequence` is a positive contiguous ordering value for newly accepted signals.
3. Exact replay of an accepted canonical Event returns its stored acceptance and creates no work.
4. Conflicting reuse of an Event ID or accepted sequence fails.
5. A new signal with the next sequence is accepted only when no prior activation is non-terminal.
6. While an activation is open, a new signal returns retryable `activation_in_progress`; the Event
   is not stored and its sequence is not consumed.
7. Event acceptance, sequence advancement, activation reservation, Event persistence, and pending
   Delivery creation commit atomically.
8. Acknowledged or explicit terminal Delivery state releases the activation slot. Terminal failure
   remains visible and is never reported as success.

The Host outbox retries a retryable signal using the same Event ID and sequence. It must not generate
new identities to evade backpressure.

## Delivery, effect, and acknowledgement

Queue acceptance proves only durable pending work. It does not prove Connector claim, Agent
activation, Browser/WebMCP access, Host mutation, or completion.

The existing delivery model remains: one eligible Connector claims a short lease; one Adapter
receives one credential-free activation; the Agent opens the canonical page and reads current state;
and only a separate trusted Host-effect authority can justify acknowledgement. A fresh Agent session
per activation is compatible with this decision because continuity lives in Host state and Receiver
authority, not hidden model memory.

## Revocation and races

Revocation is idempotent and serializes with Event acceptance and delivery claims:

- revocation committed first rejects a new Event;
- Event acceptance committed first preserves that Event and its audit history;
- revocation blocks a new or reclaimed lease after its commit;
- exact replay of an Event accepted before revocation remains historical truth; and
- an effect committed before revocation may still converge through acknowledgement under the
  existing effect-attestation rules.

Revocation cannot retract a request already delivered to an external Agent. The control surface must
state this in-flight limitation. Strong cancellation before Host mutation would require the Host
effect path to perform a live pre-effect authorization check and needs a later decision.

## Compatibility and migration

- Protocol `0.1` keeps `max_runs = 1`, `event_sequence = 1`, its vectors, and its behavior.
- Protocol `0.2` uses an explicit standing mode; a large v0.1 run count is not accepted as an alias.
- A v0.1 Grant is never upgraded in place. The user creates a new v0.2 Consent decision.
- Version negotiation fails closed. An old SDK, Receiver, or Connector must reject unsupported v0.2
  data rather than treating it as v0.1.
- The Core reference store adds v0.2 state additively. Active Cloud Receiver v2 migration is a
  separate exact-source change controlled by TASK-028 and TASK-033.
- Earlier local standing-preview schemas did not retain public-key material evidence. Their rows
  remain preserved, but schema 6 security-disables those legacy Grants and requires fresh Consent;
  it never invents a key fingerprint from a mutable current resolver. This is an issuer/security
  invalidation, not per-Event renewal or an upgrade of a v0.1 Grant.

## Consequences

The user approves a stable coordination relationship once instead of approving every business
signal. A high-frequency Host can advance repeatedly while retaining explicit scope, inspection,
revocation, ordering, and one-activation backpressure.

The cost is a materially larger authority surface. Expiry UX, audit visibility, abuse quotas,
coalescing, scope-change detection, durable sequence allocation, one-open-activation constraints,
and in-flight revocation wording become required product behavior. Green one-shot tests cannot be
relabelled as standing-authorization evidence.

## Rejected alternatives

### Repeat Consent for every Event

This preserves v0.1 safety but fails the continuous-coordination product objective and creates
high-frequency approval fatigue.

### Set `max_runs` to a large number

This hides persistent authority in a counter and leaves concurrency, backpressure, replay ordering,
renewal, and user comprehension undefined.

### Keep a browser, socket, or Agent session permanently open

Transport lifetime is not authorization. It is brittle across sleep, restart, network loss, and
device change, and it weakens rather than defines authority.

### Queue every raw domain event

This can cause Agent storms and stale work. Domain events remain in the Host; Re-entry receives a
coalesced signal and the Agent reads current page state.

### Allow parallel activations immediately

Parallel work creates conflicting Host actions and difficult revoke/effect races. The initial
profile fixes one active activation; measured applications may reopen the decision later.

## Verification requirement

The first acceptable proof is one Consent decision, two sequential effect-acknowledged signals,
explicit rejection of a concurrent signal, durable restart, then revocation rejecting a third
signal, with the complete protocol-v0.1 suite still passing. TASK-033 owns implementation and
cross-surface closure.
