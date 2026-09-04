# TASK-027: Reconcile Consent and Grant Expiry

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `decision`
- Lifecycle: `in_progress`
- Priority: `P1`
- Owner: Project team, Re-entry Core, Host SDK, and Cloud Receiver v2 owners.
- Current increment: The until-revoked proposal has a read-only consumer inventory: Core, active
  Receiver, SDK, Connector, registry artifacts, and hosted evidence do not share one proven
  v0.2 provenance. Research 25 therefore recommends an additive v0.3 profile while retaining
  finite v0.2; exact lifetime, storage, invalidation, and target-decommission decisions remain open.
- Next gate: Accept or revise the version recommendation and fix the intended windows, existing-row
  policy, public projection, invalidation scope, and boundary tests without silently widening authority.
- Dependencies: ADR-0007, ADR-0035, ADR-0041, AUDIT-V2-002 in Core/09, and TASK-012.

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

[Research 25](../Research/25-until-revoked-standing-lifetime-proposal.md) now records a source-backed
implementation proposal for no scheduled expiry. It separates short Consent/page clocks from
Grant authority and bounded execution, retains all existing finite Grants, and compares an explicit
unreleased-v0.2 revision against a new protocol profile. Complete consumer inventory and target/key
invalidation semantics are decision prerequisites. The user endorsed the direction, not an exact
wire version, migration topology, public route contract, or automatic credential renewal. This
proposal does not close the older simple-facade expiry discrepancy or authorize schema changes.

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
