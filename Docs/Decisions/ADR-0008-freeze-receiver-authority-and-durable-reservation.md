# ADR-0008: Freeze Receiver Authority and Durable Event Reservation

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex and project team  
**Scope:** Receiver-owned consent challenge, effective Grant, private receipt, event replay,
atomic run-budget reservation, pending delivery, and reference persistence port

## Context

ADR-0007 and Increment B2 locally verify the strict v0.1 protocol and Host SDK. The next
authority boundary is not an HTTP service or an Agent adapter. It is the point where viewing a
valid Manifest becomes a Receiver-owned consent challenge, an authenticated human decision may
create one private Grant, and one valid Host event may durably reserve one future continuation.

MVP1 supplies the stronger semantics: viewing an offer creates no authority, a private Grant
maps to an opaque Host binding, exact replay returns the prior reservation, and the event plus
run budget commit before any adapter call. Its fixture also reveals the failure to avoid: direct
adapter dispatch after reservation couples authenticated acceptance to an unreliable external
effect. H1 improves this with a durable pending delivery, while H2 demonstrates transactional
enrollment and lease recovery in a synthetic service harness.

MVP2 supplies useful Receiver and store seams but cannot be promoted. It accepts a
`humanApproved` boolean, exposes Receiver Grant identity to the Host, accepts caller-supplied
Host state, persists one mutable JSON aggregate, creates a run before a durable transport
boundary, and converts untrusted goal and tool metadata into an Agent instruction.

The new core must retain the stronger authority model without importing fixture state,
heartbeat polling, a managed-context identifier, an Agent prompt, or a final application.

## Decision

### 1. Increment boundary

This increment implements only:

- signed Manifest enrollment into a Receiver-owned consent challenge;
- a trusted consent-authority port rather than a caller assertion;
- one effective Grant, one opaque public binding, and one private continuation receipt;
- authenticated event resolution through that binding;
- exact event replay and conflicting-reuse rejection;
- atomic consumption of the one-run budget and creation of one private pending delivery; and
- one zero-dependency Node SQLite reference store behind a Receiver persistence port.

It does not implement a consent web page, HTTP ingress, Connector pairing, delivery leasing,
acknowledgement, Agent activation, Host-effect proof, deployment, multi-replica storage, or a
selected application.

### 2. Receiver Core ports

Receiver Core depends on narrow injected ports and values:

- **persistence store:** synchronous transaction boundary plus exact challenge, Grant, event,
  and delivery record operations;
- **issuer key resolver:** the ADR-0007 origin-, key-, and purpose-scoped public-key resolver;
- **consent authority:** verifies an opaque Receiver-session decision token and returns one
  typed stable decision attestation;
- **clock and ID source:** deterministic in tests and cryptographically unpredictable by
  default; and
- **maximum Grant lifetime:** a required deployment value used to narrow, never extend, the
  requested expiry.

The Core does not accept an Agent adapter, Host-state reader, arbitrary policy callback, or
transport fallback in this increment.

### 3. Consent challenge

`createConsentChallenge` accepts exactly one signed Manifest and the trusted page origin from
the acquisition boundary. It reuses ADR-0007 validation, calculates the effective Grant expiry
as the earlier of the requested expiry and `now + maximumGrantLifetime`, and durably stores the
canonical signed Manifest plus effective scope.

The operation is idempotent by `manifest_id` only when the canonical signed Manifest is exact.
Reuse of the same Manifest ID with different content is a conflict. Challenge creation returns
bounded display and scope details for a Receiver-owned UI; it creates no Grant, public binding,
private receipt, event, or delivery.

Display title and reason remain untrusted presentation text. The UI must escape them and must
show the effective expiry rather than the broader requested expiry.

### 4. Consent decision authority

The caller supplies an opaque `decisionToken`; it cannot supply `humanApproved`, an approval
header, an action boolean, a subject, or a delivery target as proof. Receiver Core passes the
token and challenge ID to the trusted consent-authority port. The raw token is never persisted,
returned, or logged.

The port returns one of two exact internal attestations.

Approval contains:

```text
type
protocol_version
decision_id
challenge_id
action = approve
subject_id
delivery_target_id
decided_at
```

Decline contains the same fields except `delivery_target_id`, with `action = decline`.
`subject_id` and `delivery_target_id` are bounded opaque Receiver identifiers, not credentials.
The delivery target must already be eligible according to the consent authority; the Host
cannot choose it.

The authority port contract requires an authenticated Receiver-owned session, same decision
subject, exact challenge and action binding, anti-CSRF enforcement, bounded expiry, and a stable
decision ID. A deterministic test authority proves Core integration only. It does not prove a
production browser session or anti-CSRF implementation.

Approval is valid only while the offer and effective Grant window remain live. The same
decision ID is idempotent and returns the same outcome. A different decision after a terminal
decision is a conflict. Decline creates no Grant or future authority.

### 5. Private Grant and public binding

An approved private Grant stores exactly the authority needed by Receiver Core:

```text
grant_id
challenge_id
manifest_id
binding_id
subject_id
delivery_target_id
correlation_id
issuer_origin
workflow_type
workflow_id
event_type
canonical_url
expires_at
human_boundary
runs_remaining = 1
revoked_at = null
receipt_json
created_at
```

Expiry is derived from the clock and `runs_remaining`; no sweeper is needed to make an expired
or exhausted Grant ineffective. Revocation is represented in the record but its authenticated
control surface belongs to the later lease and Grant-control increment.

The Host receives only the exact ADR-0007 public binding. It never receives `grant_id`,
`subject_id`, `delivery_target_id`, receipt content, a Connector credential, or an Agent-context
identifier. The binding status is derived as `revoked`, `expired`, `exhausted`, or `active` in
that priority order.

Receiver Core derives the exact ADR-0007 private receipt from normalized effective Grant
fields. The reference store keeps it private. It is not a bearer authorization and no adapter
receives it in this increment.

### 6. Event resolution and authentication

Receiver Core first parses the bounded canonical event body only far enough to obtain its
opaque `binding_id`. That untrusted value resolves a private Grant. The stored Grant issuer
origin then becomes the required `expectedOrigin` for ADR-0007 detached-signature verification.
The event body cannot select its own authority by naming an origin and key.

After authentication, the event must exactly match the Grant's binding, correlation, issuer,
workflow, event type, and canonical URL. The Grant must not be revoked or expired and must have
one remaining run. The event occurrence time must precede Grant expiry.

Receiver Core deliberately does not accept an `authoritativeWorkflow` argument or compare the
event against caller-supplied Host state. `state_version` is preserved for canonical-page
revalidation; it is not treated as independent current-state proof inside Receiver Core.

### 7. Atomic reservation and replay

One persistence transaction performs all first-acceptance effects:

1. assert no conflicting record owns `event_id`;
2. re-read and fence the exact live Grant;
3. persist the canonical event and stable acceptance outcome;
4. create one private `PENDING` delivery bound to the Grant's delivery target; and
5. change `runs_remaining` from `1` to `0`.

The transaction commits before the Host receives acceptance. No adapter, Connector, network
call, or Host mutation occurs inside it.

An exact replay must pass authentication again and then returns the original acceptance with
`duplicate = true`. It creates no second event, delivery, or budget reservation. Reuse of the
same `event_id` with different canonical bytes is a conflict even when the other event is
otherwise valid.

The public acceptance has exactly:

```text
type = webmcp.continuation_acceptance
protocol_version = 0.1
event_id
correlation_id
accepted = true
duplicate
status = accepted
```

The private `delivery_id`, Grant identity, target identity, receipt, and live delivery state do
not appear in the Host response.

### 8. Delivery ledger boundary

First acceptance creates one private delivery with:

```text
delivery_id
event_id
grant_id
delivery_target_id
status = pending
created_at
```

This is durable work availability, not a run, wake attempt, Agent effect, or acknowledgement.
Lease tokens, attempts, retry timing, terminal errors, acknowledgement, and activation records
remain absent until their contract has a real Connector consumer and an accepted follow-up
decision.

### 9. Reference persistence

The reference store uses Node 24's built-in `node:sqlite` and adds no runtime dependency. A
file-backed store enables foreign keys, uses `BEGIN IMMEDIATE` for write transactions, requests
WAL journaling and full synchronous durability, and rejects unknown schema versions. An
in-memory database is allowed only for deterministic tests.

The store never falls back to a JSON file or volatile memory when open, migration, constraint,
or commit fails. The file path is caller-selected; Core does not create directories, move old
state, or hide persistence errors.

Canonical event bodies and private receipts are bounded by ADR-0007. The store does not persist
decision tokens, issuer private keys, raw Connector credentials, Agent credentials, or raw
managed-context identifiers.

## Consequences

### Positive

- Human authority can no longer be represented by a boolean or request header.
- The Host never learns Receiver Grant or delivery-target identity.
- Authenticated acceptance survives process restart without invoking an Agent.
- Exact replay and one-run reservation share one durable transaction.
- The Core remains domain-neutral and zero-runtime-dependency.
- Delivery leasing can be added later without changing Host event semantics.

### Costs and open risks

- The production consent session, anti-CSRF implementation, and identity provider remain
  unimplemented until the Cloud Receiver shell exists.
- Delivery-target eligibility is trusted through the consent-authority port until Connector
  pairing is implemented and separately verified.
- Built-in SQLite proves one-process file durability and restart behavior, not shared-volume,
  multi-replica, disaster-recovery, or hosted database behavior.
- Revocation, lease recovery, acknowledgement loss, dead-letter policy, retention, and
  multi-process contention remain later increments.
- Canonical page re-entry still must verify current Host identity, authorization, state, and
  revision before any mutation.

## Rejected alternatives

- **Caller `humanApproved` boolean or header:** cannot prove a Receiver-owned human decision.
- **Expose `grant_id` to simplify Host events:** violates the private authority boundary and is
  unnecessary because the opaque binding already resolves the Grant.
- **Dispatch the Agent during event acceptance:** couples durable authority to an unreliable
  external effect and can lose or duplicate work at a crash boundary.
- **Accept caller-supplied authoritative Host state:** creates false cross-process authority.
- **Persist one JSON aggregate:** lacks transactional compare-and-set, uniqueness, indexes, and
  crash-safe multi-record reservation semantics.
- **Add a broker or ORM now:** adds operational and dependency weight without a current
  consumer.
- **Fallback to memory on persistence failure:** hides lost authority and accepted work.
- **Create lease and retry fields speculatively:** deferred until the Connector protocol fixes
  their actual consumer and failure semantics.

## Verification gates

Implementation must prove:

- challenge creation alone creates no Grant or delivery;
- approval requires a consent-authority attestation and decline creates no Grant;
- exact decision replay converges while a conflicting decision fails;
- requested expiry is narrowed by Receiver policy;
- public outputs contain no private Grant, subject, target, receipt, or token;
- invalid, tampered, wrong-scope, expired, or exhausted events create no record;
- one valid event atomically creates one event and one pending delivery and consumes one run;
- exact event replay returns the prior acceptance and conflicting reuse fails;
- close and reopen preserve challenge, Grant, event, delivery, and duplicate outcome;
- an injected failure before commit leaves no partial event, delivery, or budget change;
- Node 24 focused and aggregate tests pass with no runtime dependency; and
- no HTTP, Connector, Agent, Browser, WebMCP runtime, or deployment claim is inferred.

## Reopen triggers

Reopen this decision if a real Cloud Receiver requires an asynchronous or multi-replica store,
a selected app proves the one-run record is insufficient, an official platform supplies a
stronger consent or Agent binding, or Connector pairing proves that delivery-target identity
must be represented differently.
