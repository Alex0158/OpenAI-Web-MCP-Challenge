# TASK-027: Reconcile Consent and Grant Expiry

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `decision`
- Lifecycle: `pending`
- Priority: `P1`
- Owner: Project team, Re-entry Core, Host SDK, and Cloud Receiver v2 owners.
- Current increment: Decide separate Consent-session and effective-Grant lifetime semantics for the
  simple facade and define what expiry the user must see.
- Next gate: An accepted decision fixes the intended windows, existing-row policy, public projection,
  and boundary tests without silently widening authority.
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
