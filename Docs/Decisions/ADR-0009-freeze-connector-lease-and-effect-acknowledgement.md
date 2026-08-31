# ADR-0009: Freeze Connector Identity, Delivery Lease, and Effect-Backed Acknowledgement

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex and project team  
**Scope:** Connector authentication port, outbound delivery claim, short lease, bounded retry,
and Host-effect-backed acknowledgement

## Context

ADR-0008 ends event acceptance at one durable private pending delivery. The next boundary must
make that work retrievable by a separate outbound Local Connector without turning a Connector
claim, adapter return, or self-reported progress string into proof that an Agent or Host effect
occurred.

MVP1 supplies two complementary patterns. H1 keeps delivery separate from Host effect and
converges after acknowledgement loss by verifying one committed effect. H2 uses a short lease,
compare-and-set fencing, expired-lease reclamation, and an idempotent destination across process
failure. Neither is the new contract: H1 has no delivery claim lease, while H2 dispatches an
enrollment receipt to a synthetic destination rather than a future event to a Local Connector.

MVP2 and its later topology proposal supply useful Cloud Receiver, Local Connector, store, and
adapter seams. Their proposed Connector progress values are not authoritative enough for the
new core. `agent_started`, `awaiting_human`, `completed`, queue acceptance, and adapter return
are observations. A Connector cannot use them to close Receiver-owned delivery state.

The smallest trustworthy increment therefore needs two injected authorities: one resolves an
opaque Connector credential to one stable private delivery identity, and one verifies an opaque
Host-effect proof. It does not yet need a pairing UI, credential vault, HTTP service, supervised
worker, or real Agent adapter.

## Decision

### 1. Increment boundary

This decision freezes only:

- one trusted Connector-identity port;
- one authenticated outbound claim for the Connector's assigned delivery target;
- one short, replayable, fenced delivery lease;
- bounded lease attempts and explicit retry-exhaustion semantics;
- one trusted Host-effect-attestation port;
- acknowledgement only after a correlated Host effect is verified; and
- an additive version-2 SQLite delivery-state projection.

The next implementation increment may compose these ports in one process for deterministic
tests. It does not implement or prove production pairing, credential storage, HTTP, long
polling, process separation, a Connector daemon, Agent activation, Browser access, genuine
WebMCP re-entry, deployment, or a selected application.

### 2. Receiver Core ports and required policy

In addition to ADR-0008 ports, the delivery methods require:

- **Connector authority:** verifies an opaque Connector token and returns one exact stable
  Connector identity attestation;
- **Host-effect authority:** verifies an opaque effect token against expected delivery facts and
  returns one exact stable Host-effect attestation;
- **lease duration:** a required deployment value between 1 second and 5 minutes; and
- **maximum delivery attempts:** a required integer between 1 and 100.

These values are explicit policy, not hidden defaults. The Core accepts no arbitrary policy
callback, adapter object, Agent credential, Host-state object, or transport fallback.

### 3. Connector identity boundary

`claimDelivery` and `acknowledgeDelivery` accept an opaque `connectorToken`. Receiver Core
passes it to the trusted Connector authority. The caller cannot supply `connector_id`,
`subject_id`, or `delivery_target_id` as proof.

The authority returns exactly:

```text
type = webmcp.connector_identity
protocol_version = 0.1
connector_id
subject_id
delivery_target_id
authenticated_at
expires_at
```

The attestation is accepted only when its time window is live and it is structurally exact.
One v0.1 Connector identity maps to one subject and one delivery target. That target must match
both the pending delivery and its private Grant. A Connector never enumerates another target's
work.

The raw Connector token is bounded to 4 KiB and is never persisted, returned, or logged. The
authority port may be backed later by a paired device session, credential rotation, or explicit
revocation. A deterministic or pre-provisioned test token proves only the Core boundary; it is
not a production pairing claim.

### 4. Replayable delivery claim

The Connector generates a fresh 32-byte random value, encodes it as canonical unpadded
base64url, and supplies it as `claimToken` with its authenticated claim. The value becomes the
lease token if the claim succeeds. Receiver Core stores only its SHA-256 digest.

Making the claim token Connector-generated gives claim-response-loss recovery without storing
or reissuing a raw bearer secret. An exact retry by the same authenticated Connector and the
same unexpired active claim token returns the same lease with `duplicate = true` and does not
increment the attempt count. Once that lease expires, its token is retired for claiming and a
new attempt requires a fresh token. Reuse of any retired token, or reuse against another
delivery or identity, is a conflict.

If no exact active replay exists, one transaction selects the oldest eligible delivery for the
attested target. It may claim a `pending` delivery or reclaim a prior `leased` delivery whose
lease has expired and whose attempt count remains below the configured maximum. The
transaction rechecks:

- the Connector subject and target;
- the delivery, event, and private Grant linkage;
- Grant revocation and expiry;
- current delivery status, prior lease digest, and prior lease expiry; and
- the maximum-attempt fence.

One target may hold at most one unexpired lease at a time. A different claim token does not
steal or duplicate that lease. Selection is ordered by delivery creation time and delivery ID,
and one claim processes at most one candidate.

### 5. Lease lifetime and retry exhaustion

Mutable delivery status is exactly `pending`, `leased`, `retry_exhausted`, `acknowledged`, or
`cancelled`. `acknowledged` is the terminal effect-backed outcome. `cancelled` is the terminal
no-effect outcome for a delivery that never held a lease. `retry_exhausted` authorizes no new
activation but may still converge to `acknowledged` through the exact final lease proof.

The new lease expiry is the earliest of `now + leaseDuration`, the private Grant expiry, and the
verified Connector identity expiry. A lease is never authority beyond either attestation. Each
successful new claim increments `attempt` once; an exact claim replay does not.

After an expired lease reaches the maximum attempt count, no further activation lease may be
issued. The delivery becomes `retry_exhausted`. It retains only the final lease digest and
correlation needed to accept a late, already-committed Host-effect proof from that final lease.
It cannot return to `pending` or authorize another adapter dispatch.

A delivery that loses Grant authority before any lease becomes `cancelled`. Reasons are bounded
to `grant_expired` or `grant_revoked`. `retry_exhausted` reasons are bounded to those values or
`attempt_limit_reached`. There is no retry loop, fallback transport, dead-letter redispatch, or
background sweeper in this increment. Later operational retention must not change authority
semantics.

If Grant expiry or revocation occurs after a lease was issued, no new lease may be created. The
last lease correlation remains only so an effect confirmed before the applicable expiry or
revocation boundary can converge. An effect confirmed after that boundary is rejected.

### 6. Private delivery lease

A successful claim returns an outer exact result containing `duplicate` and one private lease:

```text
type = webmcp.delivery_lease
protocol_version = 0.1
delivery_id
event_id
attempt
lease_token
lease_expires_at
continuation
receipt
```

`continuation` contains exactly:

```text
correlation_id
workflow_id
event_type
event_sequence
state_version
occurred_at
canonical_url
```

`receipt` is the exact private ADR-0007 continuation receipt stored under ADR-0008. It may
contain the private Grant identity because the authenticated Connector channel is private. The
lease contains no Connector identity, subject, delivery target, Host signature, display copy,
prompt, goal, tool list, full artifact, business-state assertion, Agent credential, or raw
managed-context identifier.

No eligible work returns `null`; it does not invoke an Agent to discover that the queue is
empty. A future Cloud shell may map that result to a bounded transport response without
changing Core semantics.

### 7. Host-effect authority

`acknowledgeDelivery` accepts exactly an opaque Connector token, delivery ID, lease token, and
opaque `effectToken`. Receiver Core authenticates the Connector, fences the exact current or
retry-exhausted lease, and asks the trusted Host-effect authority to verify the token against
the expected delivery, event, correlation, and workflow facts.

The authority returns exactly:

```text
type = webmcp.host_effect_attestation
protocol_version = 0.1
effect_id
delivery_id
event_id
correlation_id
workflow_id
outcome = effect_applied_awaiting_human
confirmed_at
```

The effect authority, not the Connector, is responsible for proving that one idempotent Host
effect already occurred on the canonical application path and that the declared human
consequence boundary remains. Verification is read-only; the authority port cannot perform the
Host mutation it is asked to attest. Its selected-app implementation must verify current Host
identity, authorization, workflow state, expected revision, and idempotency. The generic Core
does not accept or invent those domain facts.

The attestation must match every expected identifier. `confirmed_at` must be at or after the
final lease issue time and strictly earlier than the final lease expiry, Grant expiry, and any
recorded Grant revocation. A bounded future clock-skew check still applies. The raw effect token
is bounded to 4 KiB and is never persisted, returned, or logged.

### 8. Effect-backed acknowledgement and replay

Receiver Core verifies the effect outside the persistence transaction, then one transaction
rechecks Connector ownership, current lease digest, state, and stored facts before it commits:

- `status = acknowledged`;
- the stable `effect_id` and canonical effect attestation;
- `acknowledged_at`; and
- no new lease or attempt.

The final lease may be acknowledged after its lease window if the attested effect was confirmed
inside that window and no newer lease replaced its token. This is the acknowledgement-loss
convergence path. Once a newer lease replaces the digest, the stale lease cannot acknowledge.

An exact acknowledgement retry reauthenticates both opaque tokens, returns the prior outcome
with `duplicate = true`, and creates no second effect or transition. A different effect,
different lease, or mutated attestation after acknowledgement is a conflict.

The bounded acknowledgement contains exactly:

```text
type = webmcp.delivery_acknowledgement
protocol_version = 0.1
delivery_id
event_id
effect_id
acknowledged = true
duplicate
status = acknowledged
```

It contains no lease token, receipt, Grant, Connector, subject, target, or Host-domain payload.

### 9. Non-authoritative Connector and adapter observations

The following do not acknowledge delivery:

- lease or queue acceptance;
- Connector process health;
- `agent_started`, `awaiting_human`, `completed`, or similar caller strings;
- adapter return, task creation, thread selection, or scheduler creation;
- Browser navigation without a correlated Host effect;
- Agent narration, screenshot, or untrusted client telemetry; or
- a silent fallback result.

An adapter may return typed `unsupported` or bounded diagnostic evidence to the Connector, but
that observation is not sent through the acknowledgement contract as authority. Without a
valid Host-effect attestation, the delivery remains leased, becomes reclaimable, or reaches
`retry_exhausted` visibly.

### 10. Reference persistence evolution

The SQLite reference store advances additively from schema version 1 to version 2. The existing
challenge, Grant, event, and immutable delivery-creation records remain unchanged. A new
one-row-per-delivery state table owns mutable delivery status, current attempt, current
Connector ID and lease digest, effect attestation, acknowledgement time, bounded terminal reason,
and update time. A second bounded attempt ledger records each attempt number, Connector ID,
globally unique lease-token digest, and lease timestamps. The configured maximum is snapshotted
on delivery creation, so later Receiver reconfiguration cannot widen existing authority; it
limits that ledger to at most 100 rows per delivery.

Attempt history is necessary for fencing: a retired digest can never become a later lease. If
only the current digest were stored, an old token could be reused after another lease expired
and a stale worker could regain current authority.

Version-1 databases migrate in one `BEGIN IMMEDIATE` transaction by creating the state and
attempt tables, conservatively seeding every existing delivery state as `pending` with a
one-attempt maximum, and advancing `user_version` only after success.
The base delivery row's historical `status = pending` remains its creation fact; all current
delivery status reads use the version-2 state row. No JSON, memory, or destructive rebuild
fallback is allowed.

The reference store still proves only local SQLite transaction, reopen, and bounded
multi-process behavior that is actually tested. It is not a hosted, multi-replica, disaster-
recovery, or production credential-store claim.

## Consequences

### Positive

- A Connector cannot choose its subject or delivery target.
- Claim response loss can converge without persisting raw lease secrets.
- Expired workers are fenced and retries have a hard activation bound.
- Receiver acknowledgement means one trusted Host effect, not merely Agent or queue activity.
- Late acknowledgement can converge without authorizing another activation.
- The contract remains application-neutral, adapter-neutral, zero-runtime-dependency, and
  compatible with an outbound-only Connector.

### Costs and open risks

- Production pairing, credential custody, rotation, revocation, and recovery remain
  unimplemented.
- A trusted Host-effect authority must be specialized after app selection; a deterministic
  authority proves only Core integration.
- The correct poll cadence, offline window, attempt limit, lease duration, and retention require
  selected-app operating data.
- A lost Connector claim token cannot be recovered before lease expiry; the Connector must
  durably retain it before sending the claim if that failure matters.
- SQLite schema version 2 does not prove multi-replica claiming or hosted failover.
- No supported Connector-to-Agent-to-Browser/WebMCP route has yet passed.

## Rejected alternatives

- **Connector-supplied target or subject:** lets a bearer choose authority rather than prove it.
- **Store the raw lease token for response replay:** increases bearer-secret exposure at rest.
- **Receiver-generated unrecoverable lease token:** turns a lost claim response into avoidable
  lease-window delay.
- **A lease with no attempt bound:** permits unbounded activation amplification.
- **Acknowledge `agent_started`, `completed`, or adapter success:** confuses transport progress
  with a committed Host effect.
- **Acknowledge immediately after lease:** can lose work after queue acceptance and before any
  useful effect.
- **Put Host state or artifact data in the generic acknowledgement:** duplicates selected-app
  authority and widens the protocol prematurely.
- **Implement pairing UI, Keychain, long polling, installer, and real adapter together:** mixes
  five independently falsifiable boundaries and expands failure surface before the core
  contract is proven.
- **Add a broker, ORM, or retry framework now:** adds weight without a demonstrated consumer.

## Verification gates

Implementation must prove:

- unknown, expired, malformed, wrong-Connector, wrong-subject, or wrong-target identity changes
  no delivery state;
- raw Connector, claim, lease, and effect tokens are absent from persisted values and bounded
  public outputs;
- one authenticated claim leases only the oldest eligible target delivery;
- exact unexpired claim replay returns the same lease without another attempt, while an expired
  or previously used claim token cannot create a later attempt;
- concurrent or conflicting claims produce one current lease;
- expiry permits bounded reclamation while a stale lease cannot acknowledge after replacement;
- the maximum attempt count prevents further activation and preserves late final-effect
  convergence;
- pending authority expiry or revocation cancels without adapter invocation;
- queue, Connector, and adapter progress assertions cannot acknowledge;
- only one exact trusted Host-effect attestation acknowledges the delivery;
- acknowledgement response loss converges to one stored effect and one duplicate response;
- injected claim and acknowledgement failures leave no partial state;
- schema version 1 migrates atomically to version 2 and close/reopen preserves state;
- Node 24 focused and aggregate tests pass with no runtime dependency; and
- no process, HTTP, pairing, Agent, Browser, WebMCP runtime, deployment, or production claim is
  inferred.

## Reopen triggers

Reopen this decision if a real Connector cannot durably retain a client-generated claim token,
production identity requires one credential to own multiple targets, a selected Host cannot
produce an idempotent correlated effect proof, hosted storage cannot provide equivalent claim
fencing, or a supported hosted Agent topology removes the device Connector boundary entirely.
