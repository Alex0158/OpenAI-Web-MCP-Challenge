# Research 25: Until-Revoked Standing Lifetime Proposal

**Role:** SUPPORTING implementation and decision proposal  
**Status:** Proposed, not an accepted protocol or authorization to change existing Grants  
**Date:** 2026-09-04  
**Owner:** [TASK-027](../Tasks/TASK-027-reconcile-consent-and-grant-expiry.md)

## 1. Objective and current authority

The user endorses one Consent establishing ongoing website-Agent coordination, with no scheduled
Grant expiry and no per-Event renewal. Translate that intent into an explicit contract before
changing signed protocol objects, stored authority, or public enrollment. ADR-0043 currently
accepts non-consumable authorization, while ADR-0045 and current v0.2 code still require finite
expiry. This proposal does not silently override either decision.

The intended user-visible rule is: authorization continues until explicit revocation, security
invalidation, or a material scope change. Browser closure, ordinary Events, process restarts,
and expiration of the original Consent page do not consume or recreate it. This does not promise
uninterrupted operation when account, Host, Connector, or network access is unavailable.

### Confirmed offline and user-control direction

The user explicitly confirmed on 2026-09-03 that offline operation must preserve authorization:
re-entry exists to resume useful work after absence. This agrees with ADR-0043's restart and
non-consumable-authority boundary. Network loss, device sleep, closing the Browser, stopping the
Connector process, or an absence of polling is not user revocation. Finite existing Grants still
obey their independently accepted deadlines; this clarification does not extend them.

Execution availability and Grant authority are separate state dimensions. While a local device
is unavailable, its Connector cannot start an Agent. Work is retained/coalesced under the accepted
outbox and one-open-activation rules; after eligible authenticated connectivity returns, the Agent
must read current Game state rather than blindly replay stale gameplay commands. This is not a
promise to power on an offline computer, retain an unlimited backlog, or bypass expired credentials.

The user wants an explicit revocation action in Local Connector and a possible future entry in
Game Settings. These are user-facing initiation surfaces, not new authorities. The smallest
proposed integration opens Receiver-owned authenticated management for the selected authorization;
the owning user selects and confirms the bounded scope, and Receiver applies the revocation.
A delivery-only Connector token, Host Organization key, browser-supplied account, or Agent prompt
must not gain Grant-management authority. Exact UI, routes and authenticated handoff remain proposed.

Do not equate "stop Connector", "revoke this Game authorization", and "remove this device and all
its authorizations". The user's clarification confirms offline retention and intentional user
revocation, not a blanket device-wide cascade or target rebinding. The scope of explicit device
decommission remains a separate decision. Preserve history and the in-flight revocation limitation.
If a local revocation request cannot reach Receiver, show pending/unconfirmed state, not successful
cloud revocation; any local execution stop is a distinct fact.

## 2. Verified source constraints

Reviewed parent source is `01c7c415d54358829d8abef252e074d0e9884186`; active Receiver executable
source is `9156e68fe9b988f2ec7423d1c93930da3a105d4e`. No executable file changes in this proposal.

| Surface | Current requirement | Required change for no scheduled expiry |
| --- | --- | --- |
| Core `standing-protocol.mjs` | Exact signed Manifest `grant_expires_at`; binding and receipt `expires_at` | An explicit signed lifetime representation with strict validation |
| Core standing authority | Finite policy cap, admission checks, status, lease cap, receipt consistency | Separate authorization lifetime from every operational clock |
| Core Connector and Agent Adapter | Parse receipt expiry and require lease within it | Explicit lifetime-aware validation; retain finite lease checks |
| SQLite standing schema/store | Non-null finite Grant and Consent-effective deadlines | Versioned additive migration and validated lifetime discriminator |
| Receiver standing protocol/service | Independent finite validators, policy cap, predicates and projections | Matching implementation behind a new reviewed Core pin |
| Receiver seventh migration | Non-null deadlines and relational lifetime checks | A new migration; never rewrite the committed migration |
| Host SDK and product Connector | Explicit signed scope and version-selected transport | Exact compatible artifacts and capability selection |
| Game | Stable binding, outbox sequence, accepted signal and human boundary | Display and persist the approved lifetime without new gameplay authority |

Source anchors: [Core protocol](../../reentry-core/src/standing-protocol.mjs),
[Core authority](../../reentry-core/src/standing-authorization-core.mjs),
[Agent Adapter](../../reentry-core/src/agent-adapter.mjs),
[Receiver service](../../saas-boilerplate/backend/src/modules/standing/standing.service.ts), and
[committed migration](../../saas-boilerplate/backend/prisma/migrations/20260903193000_standing_authorization_v02/migration.sql).

## 3. Recommended lifetime semantics

Use a signed, exact discriminator such as `lifetime: { mode: "until_revoked" }` in the selected
new contract. Public bindings and private receipts must unambiguously carry the same authority.
Do not use a far-future timestamp, implicit missing field, `null` alone, `Infinity`, a large run
counter, or automatic renewal. Mixed or inconsistent lifetime representations fail closed.

The exact wire shape and version require an ADR; the fragment above is not a callable contract.
A Receiver unable to provide this lifetime rejects enrollment rather than silently issuing a
shorter or auto-renewing Grant. User approval must show the actual effective lifetime.

### Clock separation

| Clock | Proposed behavior |
| --- | --- |
| Signed Host offer | Finite, existing signature and freshness validation retained |
| Consent decision | Earlier of offer expiry and creation plus ten minutes |
| Consent page token | Same fixed absolute deadline, including approved/declined terminal access |
| Grant | No scheduled expiry; explicit revocation/security cutoff |
| Event signature freshness | Existing finite freshness checks retained |
| Connector authentication | Finite validity remains; no permanent bearer |
| Delivery lease | Short finite deadline remains, capped by current Connector validity |
| User control session / CSRF | Finite authenticated authority remains |

Ten minutes is a proposed maximum, not an already accepted product setting. No sliding page-token
renewal. After its expiry, the owner uses authenticated authorization management, not an old
Consent URL. Account switching and terminal pages still require owner checks.

Removing the Grant deadline removes only that cap from lease calculation. It must not remove
lease expiry, stale-worker checks, attempt limits, effect timing, or acknowledgement correlation.
If a private receipt itself becomes lifetime-bearing rather than time-bounded, it must remain
non-bearer scope evidence: the finite authenticated Delivery lease is still mandatory at dispatch
and the Receiver still verifies current authority. Test these predicates explicitly, never via
`Date.parse(null)` or missing-value comparisons.

## 4. Version and storage decision

Two independently reviewed alternatives are viable; neither is selected by this document.

| Alternative | Benefit | Required proof / cost |
| --- | --- | --- |
| Explicitly revise unreleased v0.2 with a new exact Core/spec pin and matching artifacts | Smallest maintained protocol surface | Prove no independently retained/deployed consumer depends on the old exact v0.2 shape; preserve old finite objects and forbid incompatible binaries on the upgraded store |
| Add an explicit v0.3 until-revoked profile; retain finite v0.2 | Clear compatibility boundary without assuming every consumer can move together | Another version through signing, routes, receipts, adapters and conformance; old binaries must still be isolated from new rows |

**Recommendation:** first confirm the complete v0.2 consumer/deployment inventory with the source
owners. If its consumers are only the jointly controlled unpublished reference and Receiver,
prefer an explicitly accepted v0.2 revision with a new pin and package identities. Local-only
evidence is not proof that this condition holds elsewhere. If it cannot be established, use a
new protocol version. Do not silently broaden current strict v0.2 or claim old binaries support it.

Storage topology is a separate decision, not automatically five new tables per wire version.
Prefer reuse of the standing table family only if an additive migration can preserve every old
row and constraint meaning, enforce exact mode/deadline consistency, isolate all version-sensitive
queries, and enforce a minimum compatible binary/schema set. Existing old claim queries have no
new-profile discriminator; new HTTP routes alone cannot make shared new rows safe for old binaries.
If this cannot be proven, isolate the new authority and work rows. Table reuse must not win by
weakening constraints; table duplication must not become an unmeasured default.

Existing v0.1 and finite-standing Grants retain their IDs, canonical signed bytes, deadlines,
history and authority. A new informed Consent creates new until-revoked authority; never extend
or convert an old Grant in place. Preserve expired, revoked and security-disabled legacy rows.
Rollback disables new enrollment/routing and retains data. The exact old executable may be used
only if proven safe against the upgraded schema; otherwise rollback requires a compatible binary.
No destructive down-migration or invented recovery promise.

## 5. Security invalidation and unavailable targets

Until-revoked must define more than a nullable deadline. Current Receiver Event admission locks
and checks the consented Host key; claim checks the Grant and current Connector but does not make
an equivalent current Host-key check. Event admission does not revalidate the bound Connector's
revocation or expiry, which is distinct from tolerating an ordinarily offline device. Current
disconnect updates Connector revocation without a standing-Grant invalidation cascade. These are
static observations, not a reproduced exploit or permission to change finite v0.2.

The new contract must explicitly decide:

- **Issuer revocation/material invalidation:** prevent new Events and new/reclaimed claims, with
  a durable cutoff or equivalently serialized live-authority check. Preserve accepted history and
  define terminal treatment of pending work. A key being valid again must not silently recreate
  revoked authority. Mere temporary lookup failure must not invent permanent revocation.
- **Temporary offline/expired Connector authentication:** no claim without current valid identity;
  do not equate an offline device with a revoked Grant. Pending work, one-open backpressure and
  same-identity recovery need bounded, visible semantics, not endless unobservable retries. Offline
  authorization retention is user-confirmed above; authentication recovery remains a separate gate.
- **Explicit Connector disconnect/decommission:** decide whether it revokes dependent Grants or
  leaves them visibly unusable, and how pending work terminates. Current sticky subject binding
  prevents assuming revoke plus new Consent can transfer to another target.

Keep subject, Host origin/key ID/material, workflow/URL, signal type, instruction, human boundary,
target and approved lifetime immutable. New key material or device/target is not ordinary game
state. Until an audited same-authority rotation/recovery contract exists, do not promise seamless
key/device replacement or carry authority to a new identity.

Revocation fences future admission and claims; it cannot recall an activation already delivered
to an external Agent. Preserve the accepted ordering and correlated pre-cutoff effect/ACK rules.
Stronger cancellation needs a separately accepted Host pre-effect authorization check.

## 6. Implementation order and acceptance tests

1. Accept version, lifetime/clock, existing-row, invalidation and binary-compatibility decisions;
   reconcile TASK-027, ADR-0043/0045 and owning Mechanisms before executable changes.
2. Add strict parser/signature fixtures and one real reference consumer; preserve all finite-mode
   regressions and historical canonical object replay.
3. Add the durable reference migration and authority transitions; prove one Consent, two bounded
   signals/effects/ACKs, backpressure, restart, revoke and rejection of the third signal.
4. Implement the exact independent Receiver profile and new migration; seed both old one-shot
   and finite-standing data before upgrade, compare before reseeding, and test old/new query and
   rollback-binary behavior. Keep source pin and full conformance release gates explicit.
5. Implement public enrollment/inspect/revoke only after the separate shell contract is accepted;
   cover same-user ownership, strict input/Origin/CSRF, login return, token custody, terminal access,
   durable decision retries, redaction and coherent inspection snapshots.
6. Integrate compatible SDK/Connector artifacts and the accepted Game signal. A real authenticated
   Browser route and independent Game effect remain separate prerequisites, not lifetime evidence.

Additional negative cases: lifetime tampering; null/mixed/unknown fields; cross-version receipts;
Consent/page deadlines just before/at/after expiry and after lock waits; unchanged Grant after
page-token expiry; finite credentials/leases still expiring; issuer/Connector invalidation races;
wrong scope/key/target; no mutation on rejected Events; response loss and process interruption;
offline-to-online recovery without re-consent or duplicate effects; no implicit revoke from process
exit; selected-Grant versus device-wide scope fencing; offline revoke never falsely reported complete.

## 7. Approval package and remaining boundaries

The next decision should cover one coherent package: explicit until-revoked authority, short
Consent/page clocks, unchanged existing Grants, retained finite execution/authentication limits,
and the measured version/storage/invalidation strategy. Source owners first supply the consumer
inventory and target-decommission policy needed to make that choice concrete.

The existing [public control-plane proposal](../../saas-boilerplate/backend/src/modules/standing/CONTROL-PLANE-PROPOSAL.md)
still requires exact route, identity, token, CSRF, login, retry and abuse-control acceptance.
Until-revoked approval alone does not approve all candidate public routes. TASK-027's older
one-shot five-minute/thirty-minute discrepancy also remains separate; this proposal does not
silently close or change it. No new Event type, automatic soldier dispatch, parallel activation,
same-thread Agent promise, production migration, or release is included.

## 8. Consumer inventory snapshot — 2026-09-04

The version decision prerequisite is not satisfied by local source alone. The following read-only
inventory was checked against the parent repository and the nested active Receiver checkout:

| Consumer or artifact | Current identity | Compatibility implication |
| --- | --- | --- |
| Re-entry Core standing reference | Parent `main` at `fed5c05`; standing source introduced at `58d8d71`; finite `grant_expires_at` remains required | Local v0.2 behavior is committed and must remain unchanged until a new accepted profile exists |
| Host SDK checkout | Local package `0.3.1`; facade and bundled standing source are present | Checkout is ahead of the published artifact and cannot be treated as the registry consumer |
| Host SDK registry artifact | Published `0.3.1`, `gitHead=9864ba09b79a76641d8662502ccf918cd3fd4b3b` (SDK-006 readback) | The immutable registry package predates `createReentry()`; a v0.2 revision would not reach every caller |
| Local Connector checkout | Local package `0.2.20` | Current source is a separate release candidate and has its own exact-source gate |
| Local Connector registry artifact | Published `0.2.20`, reported `gitHead=733d77f` while source records `0.2.14`; its bundled parser rejects the active instruction-bearing lease (SDK-006) | Existing published consumers are not a reliable v0.2 standing baseline |
| Active Receiver | Nested checkout `Re-Entry` at `5a2117b`; standing implementation source last committed at `9156e68`; branch has no upstream and has uncommitted pairing changes | A working tree and a remote merge are distinct source identities; no until-revoked release provenance is established |
| Hosted Receiver/frontend evidence | CLOUD-022 records Vercel deployments from a working-tree snapshot without exact Git attestation | Hosted evidence cannot prove that a particular v0.2 binary or schema is the only consumer |

This inventory is provenance evidence, not a claim that every listed artifact is currently serving
standing traffic. It does establish that the condition for silently revising unreleased v0.2 — a
complete, jointly controlled, unpublished consumer set — has not been proven. The safer recommendation
is therefore an additive, explicitly versioned v0.3 until-revoked profile, retaining finite v0.2 and
requiring exact source pins for every new artifact. This recommendation remains subject to owner
acceptance, deployment-owner confirmation, and the target decommission decision.
