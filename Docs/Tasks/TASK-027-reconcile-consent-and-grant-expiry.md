# TASK-027: Reconcile Consent and Grant Expiry

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `decision`
- Lifecycle: `in_progress`
- Priority: `P1`
- Owner: Project team, Re-entry Core, Host SDK, and Cloud Receiver v2 owners.
- Current increment: The project owner accepted the semantic rollout boundary in ADR-0048: retain
  finite standing v0.2 for the current compatibility/demo slice and add an explicitly versioned
  v0.3 until-revoked profile for the long-lived standing product. The consumer inventory shows
  that Core, active Receiver, SDK, Connector, registry artifacts, and hosted evidence do not share
  one proven v0.2 provenance, so v0.2 must not be silently revised in place.
- Next gate: Reconcile ADR-0048 with ADR-0043/0045 and TASK-029/TASK-033, then select the exact
  v0.3 wire namespace, storage/migration boundary, public control surface, invalidation semantics,
  and focused tests without widening authority or changing retained v0.2 behavior.
- Dependencies: ADR-0007, ADR-0035, ADR-0041, ADR-0043, ADR-0045, ADR-0048, AUDIT-V2-002 in Core/09,
  TASK-012, TASK-029, and TASK-033.

## 1. Problem and objective

The Host SDK requests a five-minute offer and thirty-minute Grant, while active v2 assigns the
minimum of those times to the Consent session and then copies it into the approved Grant. The
Receiver may narrow authority, but no accepted record selects this effective lifetime for the simple
later-event flow, and the consent page does not display it.

The objective is to make the lifetime policy explicit, user-visible, and consistently enforced.

The additive standing kernel now stores the two deadlines separately and requires a trusted
Receiver caller to supply `maximumGrantLifetimeMs`; it does not select the product maximum.
Protocol v0.2 still requires a finite `grant_expires_at`. Non-consumable authorization therefore
does not yet mean no-expiry authorization. Neither a distant expiry nor silent automatic renewal
may substitute for an accepted lifetime decision. The
[standing control-plane proposal](../../saas-boilerplate/backend/src/modules/standing/CONTROL-PLANE-PROPOSAL.md)
records the public-shell implications without choosing a duration or changing existing v0.1 rows.

[Research 25](../Research/25-until-revoked-standing-lifetime-proposal.md) records the source-backed
design basis for ADR-0048. It separates short Consent/page clocks from Grant authority and bounded
execution, retains all existing finite Grants, and selects an additive v0.3 compatibility boundary
because the current v0.2 consumer set is not proven to be jointly controlled. The semantic policy
is accepted; exact wire names, migration topology, public route contract, and executable behavior
remain implementation gates. This decision does not close the older simple-facade expiry
discrepancy or authorize an unreviewed schema change.

## Accepted decision package — 2026-09-04

The accepted policy has two deliberately separate layers:

1. **Current v0.2 compatibility/demo slice:** retain finite `grant_expires_at`, existing routes,
   rows, validators, and package behavior. It may support repeated signals during its explicit
   finite lifetime and remains the active integration target for the current Game/Receiver/Connector
   work.
2. **Future v0.3 standing profile:** use an explicit signed `until_revoked` lifetime discriminator,
   preserve finite Consent/page, Event, Connector, lease, and control-session clocks, and require
   explicit revocation or security invalidation. It uses a version-selected wire/storage namespace
   and never rewrites an existing v0.2 Grant.

The v0.3 transport route and notification-handoff receipt are one coordinated protocol decision;
TASK-027 must not define a route that conflicts with TASK-029 or Research 27. The selected product
continues to use the ADR-0046 notification-handoff boundary: lifetime does not wait for Game effect
or Agent completion. One-active activation, ordered durable signals, exact replay, and bounded
backpressure remain required.

The user explicitly confirmed offline authorization retention and intentional user revocation on
2026-09-03. Local Connector is the intended revocation entry, with Game Settings a possible future
entry; Receiver-owned same-user authorization remains unchanged. Stopping/offlining a Connector is
not revoking a Grant, and the clarification does not authorize a device-wide cascade. Research 25
records exact scope distinctions, pending/unconfirmed offline revocation, and additional acceptance
tests. This aligns with ADR-0043; no new public route, authentication authority, lifetime version,
or executable behavior is accepted by this clarification. Core status and the public-shell gate
therefore remain unchanged.

## 2. Authority and evidence

- ADR-0007 owns distinct offer and Grant fields and Receiver narrowing.
- ADR-0035 owns active v2 Consent and target behavior; ADR-0041 owns the simple facade.
- Core/04 requires an understandable expiry boundary.
- Current source and tests are listed in Core/09 AUDIT-V2-002. Green tests prove current behavior,
  not that the product policy was selected.

## 3. Scope

Decide Consent-session TTL, effective Grant TTL, narrowing visibility, confirmation behavior near
expiry, delayed Event behavior, and treatment of already-created pending sessions and active Grants.
Then reconcile the ADRs, Core, Mechanisms, SDK/Receiver code, and focused time-boundary tests.

## 4. Non-goals

- silently extending an already-issued Grant;
- changing `max_runs`, Event type, target binding, or revocation authority;
- adding background expiry jobs when derived state is sufficient; or
- treating a locally fast integration test as proof of an asynchronous lifetime policy.

## 5. Verification and closure

Close only after the accepted policy is visible on the consent surface and tests cover approval and
Event submission immediately before and after each relevant expiry. Record any existing-row
migration or non-migration decision and rerun the SDK-to-v2 contract matrix.

## 6. Reopen condition

Reopen if facade defaults, Receiver narrowing, displayed scope, stored expiry, status derivation, or
Event admission timing changes.
