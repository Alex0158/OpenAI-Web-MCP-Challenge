# ADR-0013: Freeze Receiver Grant Control and Revocation

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex and project team  
**Scope:** Receiver-authenticated Grant inspection, atomic revocation, and event/delivery race semantics

## Context

ADR-0008 reserves `revoked_at` in the private Grant and requires event acceptance to reject a
revoked Grant. ADR-0009 requires claims and Host-effect acknowledgement to recheck revocation.
Current tests prove those consumers only by overriding store reads; no trusted caller can inspect
or durably revoke a Grant. RECORE-003 therefore classifies Grant control as an application-neutral
Program completion gap.

The missing boundary is not a production administration API. It is the Core rule that turns an
opaque Receiver-session authorization into one subject-scoped inspection or revocation without
letting the Host, Connector, or caller assert identity, choose a private Grant, backdate the
revocation boundary, or delete history.

## Decision

### 1. Increment boundary

This decision freezes only:

- one trusted Grant-control authority port;
- exact `inspectGrant` and `revokeGrant` Core inputs;
- one bounded private control summary and one bounded revocation result;
- an atomic compare-and-set of the existing private Grant `revoked_at` value;
- idempotent revocation replay; and
- the ordering rules between revocation, event acceptance, delivery claim, and Host effect.

It does not implement a consent or administration page, HTTP route, Grant listing, production
session, anti-CSRF layer, pairing, Connector credential revocation, private managed-context
binding, Agent activation, background cleanup, deployment, or selected-app policy.

### 2. Grant-control authority port

Receiver Core requires a `grantControlAuthority` with one `verifyControl` method. The caller
supplies only an opaque `controlToken`, the opaque public `bindingId`, and an operation selected by
the Core method. The authority returns exactly:

```text
type = webmcp.receiver_grant_control_authorization
protocol_version = 0.1
binding_id
action = inspect | revoke
subject_id
authenticated_at
expires_at
```

The attestation must be live, action-bound, binding-bound, and structurally exact. Its subject
must equal the private Grant subject. The Core clock defines the revocation time; neither the
caller nor authority may supply it.

The authority port contract requires an authenticated Receiver-owned session, anti-CSRF
protection at any browser boundary, and prior proof that the subject may control the exact Grant.
A deterministic authority proves only the Core boundary.

The raw control token is bounded to 4 KiB and is never persisted, returned, or logged. Receiver
Core verifies the token before resolving or disclosing whether the binding exists, so an
unauthenticated caller does not gain a binding-existence oracle.

### 3. Exact Core methods

`inspectGrant` accepts exactly:

```text
bindingId
controlToken
```

After authority and subject verification, it returns one immutable point-in-time summary:

```text
type = webmcp.receiver_grant_summary
protocol_version = 0.1
binding_id
correlation_id
issuer_origin
workflow_type
workflow_id
event_type
canonical_url
expires_at
human_boundary
runs_remaining
status = active | exhausted | expired | revoked
created_at
revoked_at
```

Status keeps the ADR-0008 priority `revoked`, `expired`, `exhausted`, then `active`. The summary
contains no `grant_id`, challenge, Manifest, subject, delivery target, receipt, event body,
delivery identity, Connector credential, Agent credential, or managed-context identifier. A
selected app may join its own human-readable history later; Core does not invent a run record.

`revokeGrant` accepts the same exact fields but binds authority to `action = revoke`. It returns:

```text
type = webmcp.receiver_grant_revocation
protocol_version = 0.1
binding_id
status = revoked
revoked_at
duplicate
```

The first valid call stores `revoked_at = Core now`. Any later valid call by the same authorized
subject returns the stored time with `duplicate = true`. Revocation is allowed after expiry,
run exhaustion, delivery, or acknowledgement because it records the subject's durable control
decision; it does not undo a committed Host effect.

### 4. Persistence and atomicity

The existing `receiver_grants.revoked_at` column remains the single revocation state. No schema
table, event log, or dependency is added in this increment. The persistence port adds one narrow
compare-and-set operation that writes a canonical timestamp only when `revoked_at IS NULL` and
only inside its existing synchronous write transaction.

The Grant row already stores the controlling subject. For v0.1, only that same subject may
inspect or revoke, so a second actor column or delegated-administrator model would add no current
authority. If delegated control becomes required, it needs its own audit model and decision.

Revocation deletes nothing. Challenge, Grant, event, delivery, attempt, effect, and acknowledgement
records remain available under their existing private boundaries.

### 5. Race and replay rules

Event acceptance and revocation both re-read and fence the Grant inside the store's write
transaction. Their commit order is authoritative:

- **revocation first:** a new event cannot consume a run or create an event or delivery;
- **event acceptance first:** the accepted event and one pending delivery remain historical, but
  revocation prevents a later lease; the next claim cancels the pending delivery without adapter
  invocation;
- **exact accepted-event replay after revocation:** returns the prior duplicate acceptance and
  creates no new work;
- **lease first:** revocation prevents a new or replayed lease; existing ADR-0009 fencing keeps the
  final lease only for bounded effect convergence;
- **Host effect confirmed before revocation:** a late acknowledgement may converge under
  ADR-0009 even though no new activation is authorized;
- **Host effect confirmed at or after revocation:** acknowledgement fails;
- **acknowledgement first:** revocation cannot reverse the committed Host effect, but prevents any
  future authority; and
- **concurrent revocations:** one write wins and every later valid caller receives the same stored
  boundary as a duplicate.

No sweeper is required for authority. A pending or leased delivery may retain its prior stored
projection until the next claim or acknowledgement transaction applies the existing ADR-0009
terminal rule; it cannot be activated or acknowledged outside the revocation boundary.

## Consequences

### Positive

- Revocation becomes a real Receiver-owned lifecycle rather than a synthetic read override.
- Host and Connector roles gain no Grant-control authority.
- The existing schema, zero-runtime-dependency package, and delivery state machine remain intact.
- The exact atomic rule is independent of final app, identity provider, hosting platform, and
  concrete Agent adapter.

### Costs and open risks

- A production control session, anti-CSRF implementation, UI, and recovery path remain unproved.
- The control surface addresses one exact binding; enumeration and multi-Grant administration are
  deliberately absent.
- Private managed-context binding remains a separate Program gap.
- Separate-process revocation and fault-matrix evidence remains a later bounded increment.
- Delegated administrators, organization policy, retention, and compliance audit exports are not
  modeled.

## Rejected alternatives

- **Reuse the consent decision token:** approval and later control have different action,
  lifetime, and session boundaries.
- **Let the Host revoke by binding alone:** possession of an opaque Host binding is not human
  authority.
- **Let the Connector revoke:** delivery identity cannot widen into Grant administration.
- **Accept a caller-supplied subject or timestamp:** permits identity assertion or backdating of
  the effect boundary.
- **Store the raw control token:** creates an unnecessary bearer secret at rest.
- **Add a revocation table or schema version now:** the frozen Grant already has the only state
  required by a same-subject, one-revocation v0.1 contract.
- **Cancel or delete all delivery records inside revocation:** destroys audit history and risks
  breaking pre-revocation Host-effect convergence.
- **Add an administration HTTP route with deterministic authentication:** would turn test
  authority into a runtime security claim.
- **Add background cleanup or retry:** authority is effective through transaction checks and
  needs no sweeper or fallback.

## Verification gates

Implementation must prove:

- malformed, missing, expired, wrong-action, wrong-binding, wrong-subject, or unverified control
  authorization exposes no Grant and changes no state;
- inspection returns the exact summary and no private identity, receipt, token, or context value;
- the first revocation persists one Core timestamp and exact authorized replay returns it as a
  duplicate without another write;
- revocation before event acceptance creates no event or delivery;
- revocation after event acceptance blocks leasing while exact event replay remains historical;
- revocation after lease fences claim replay and applies the existing before/after-effect rule;
- injected post-write failure rolls back revocation;
- file close and reopen preserve revocation and duplicate behavior;
- the raw control token is absent from persisted files and bounded outputs;
- focused and aggregate tests pass on Node 24 and the current runtime with no dependency or package
  expansion beyond the changed runtime source; and
- no HTTP, UI, production identity, pairing, private context binding, Agent, Browser, WebMCP
  runtime, deployment, or selected-app claim is inferred.

## Reopen triggers

Reopen this decision if a supported Receiver identity model requires delegated revocation, a
selected app requires batch or organization-level controls, a real store cannot serialize event
acceptance and revocation, or a supported Agent topology requires revocation to terminate active
platform work rather than only fence future Receiver authority.
