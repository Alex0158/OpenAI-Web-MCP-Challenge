# ADR-0049: Authorize Project-Team Standing Integration with Eyad Release Ownership

**Status:** Accepted owner decision; local implementation increment verified; hosted release open  
**Date:** 2026-09-04  
**Decision owner:** Project owner  
**Implementation owner:** Current project team  
**Release owner:** Eyad  
**Scope:** The Sleepless Kingdom bound-task notification path and the exact external source surfaces
listed in [TASK-036](../Tasks/TASK-036-implement-standing-notification-handoff.md)

## Decision

For the current hackathon increment, the project team is authorized to implement the missing
cross-stack behavior required to connect Sleepless Kingdom to the selected Re-entry path. Eyad keeps
release authority: after the implementation passes its source, protocol, security, and hosted
readiness gates, Eyad publishes any public packages and deploys the Cloud Receiver. This is a
bounded implementation ownership decision for this increment. It does not transfer package
namespace ownership, signing credentials, deployment credentials, or permanent maintenance
responsibility.

The implementation target remains the accepted product route in [ADR-0046](ADR-0046-restore-bound-task-notification-continuation.md)
and [ADR-GAME-0039](../../WebApp/Web-Game/Docs/Decisions/ADR-GAME-0039-cp14-bound-task-notification-adoption.md):
one informed standing Consent and finite v0.2 Grant notify one privately bound existing Agent task;
the Agent rereads the authenticated Game page and decides whether to act, do nothing, or request a
human decision. A later eligible signal reuses the same approved Consent, Grant, and task. The
Receiver settles at trusted notification handoff, not at an Agent turn, WebMCP call, or Game effect.

## Why this decision is needed

The Game-facing Core, Host SDK, and Local Connector source is already present in the outer `main`
history, while the candidate Receiver lives in the separate `saas-boilerplate` repository. Source
presence is not proof that the standing route is compatible, publicly released, or deployed. The
current public packages and Connector preview remain partly v0.1-shaped, and the hosted Receiver
preview still exposes only the three previously deployed v0.2 effect-backed transport routes. The
separate Receiver working tree now contains the additive standing controls and notification-handoff
implementation, but that work is not yet public or deployed. The earlier handoff report therefore
assigned external implementation to Eyad. The project owner has now explicitly selected
the faster controlled path: this team implements against the reviewed source, then hands an exact
release packet to Eyad for publication and deployment.

The implementation must not solve schedule pressure by guessing a route, importing a private signer
into the Game, using an unpinned `latest` package, creating a fresh task, or changing the meaning of
an existing effect acknowledgement.

## Ownership and edit boundary

| Surface | Current team may implement | Release or authority owner | Boundary |
|---|---|---|---|
| `reentry-core/` | Standing v0.2 handoff contract, strict schemas, client methods, and tests | Project team for this increment; shared Core review at closure | Keep v0.1 frozen; no undocumented fields or downgrade |
| `runtime/host-sdk/` | Explicit standing wrapper, exports, and tests | Eyad publishes the reviewed version | Do not reuse an old version or publish from an unreviewed tree |
| `runtime/local-connector/` | v0.2 handoff client, durable private binding, Adapter dispatch, and tests | Project team implementation; Eyad release coordination where package publication is needed | Raw task locator remains local; no fresh-session fallback |
| `saas-boilerplate/backend/` | Receiver route, service state transition, migration, and conformance tests | Eyad deploys the exact reviewed Receiver commit | Separate repository; update route allowlist and readiness evidence together |
| `WebApp/Web-Game/` | Game mapping, persistence metadata, transport adapter, UI/evidence writeback | Game owner and project team | Game remains world authority; no Cloud lease or Connector token in Game |
| Package/deployment | Prepare immutable release packet and readback procedure | Eyad publishes/deploys after gate | No deployment or public-release claim before current readback |

The Game child still treats `reentry-core/` and `mvp/` as consumed dependencies. This ADR authorizes
the outer implementation task to change shared source where required; it does not authorize a Game
module to edit those paths from inside the child boundary. The nested Receiver remains a separate
Git and deployment boundary.

## Compatibility and product invariants

1. Finite standing protocol v0.2 is the hackathon profile. The accepted until-revoked v0.3 semantic
   profile in [ADR-0048](ADR-0048-adopt-until-revoked-standing-lifetime-v0.3.md) remains a future
   additive profile; this increment does not introduce its wire names or migration.
2. Existing v0.1 routes and existing v0.2 effect-backed routes retain their schemas, status
   transitions, `effect_token` authority, and regression tests. Notification handoff is additive;
   it never aliases or reinterprets `/delivery-acknowledgements`.
3. The same-task target is mandatory. The Connector must resolve a durable private binding captured
   during trusted enrollment. Missing, busy, stale, wrong-owner, retired, or unavailable bindings
   fail visibly. No task search, replacement conversation, or fresh task is a fallback.
4. The Game owns world time, domain events, signal eligibility/coalescing, Game publication lease,
   cargo, combat, settlement, identity, revision, and idempotency. The Receiver owns its Event,
   delivery, and Connector lease state. Neither side claims the other's lease.
5. `CargoLostToMonster` remains the first signal. Existing Game cooldown and coalescing policy stays
   in force, including one-active backpressure; high-frequency events must not flood a task.
6. Queue acceptance, notification handoff, Agent wake, authenticated page read, WebMCP discovery,
   optional command, and resulting Game effect remain separately observable claims.
7. Event identity, positive contiguous sequence, occurrence time, workflow, canonical URL, and scope
   are server-derived and durable. Credentials, task locators, lease tokens, and private bindings do
   not enter Game payloads, Browser URLs, Agent prompts, logs, or tracked evidence.

## Implementation contract to freeze

The exact route and receipt are an additive implementation target for TASK-036 and must be frozen by
the first failing contract tests before any consumer is wired. The target shape is:

```text
POST /v0.2/delivery-notification-handoffs
request: connector_token, delivery_id, lease_token, handoff_id, runtime_admission_attestation
response: webmcp.notification_handoff_receipt
         protocol_version, delivery_id, event_id, handoff_id,
         correlation_id, workflow_id, status=handed_off, duplicate,
         runtime_admission_ref
```

`handoff_id` is stable for one delivery identity across response loss, lease reclaim, and process
restart, but it is not proof that a task runtime accepted anything. A first handoff requires a
current Receiver lease and a qualified, runtime-owned admission attestation;
Connector authentication alone is insufficient. The Receiver verifies Connector target, Grant
scope, delivery, lease, and the attestation before atomically recording the handoff and releasing
its one-active slot. The attestation and `runtime_admission_ref` are opaque and contain no raw task
locator. `effect_token` is not accepted on this route.

For this implementation increment, the attestation has one strict, transport-safe envelope so each
layer can validate the same correlations without pretending to understand a private task locator:

```text
runtime_admission_attestation:
  type: webmcp.runtime_admission_attestation
  protocol_version: 0.2
  admission_id: opaque runtime-owned identifier
  adapter_id: stable trusted Adapter identifier
  binding_generation: opaque private-binding generation digest
  delivery_id: Receiver delivery identifier
  event_id: Receiver Event identifier
  handoff_id: stable Connector handoff identifier
  accepted_at: canonical ISO timestamp
```

The Receiver validates the exact shape and delivery correlations, then delegates trust validation to
an explicitly injected `StandingRuntimeAdmissionAuthority.verifyAdmission` owned by the selected
runtime/Adapter integration. A missing authority fails closed with a typed capability error; the
Receiver must never treat a valid Connector token, a process exit, or a caller-supplied boolean as
the authority. The authority may verify a runtime-issued proof or a qualified Adapter assertion,
but that choice must be documented by the deployment and must not add a raw task locator to the
wire. The first-version route only records a verified known acceptance; it does not promise
reconciliation after a lost or ambiguous runtime reply.

An exact replay whose handoff receipt is already stored returns that historical receipt with
`duplicate=true` even if the original lease has expired or the Grant has subsequently been revoked;
history is not rewritten and the stale lease never authorizes a new handoff. A new `handoff_id` or an
unrecorded replay without a current lease is rejected. If the owning runtime cannot provide an
idempotent admission operation or authoritative lookup after a process/response crash, the
Connector keeps a visible `unknown` outcome and does not blind-resend or claim crash-recoverable
delivery. Idempotency is a recovery capability, not a prerequisite to the first qualified runtime
acceptance.

This shape is a bounded v0.2 profile for the selected trace. Any incompatible runtime requirement,
different attestation, or changed completion boundary requires a new decision before code widens.

## Execution sequence and gates

The full implementation follows the single task [TASK-036](../Tasks/TASK-036-implement-standing-notification-handoff.md):

1. **Baseline and provenance:** record repository, nested Receiver, Core pin, package manifests,
   current tests, and dirty-file ownership. Freeze exact refs; do not use `latest`.
2. **Contract red tests:** add strict receipt, route, duplicate, lease, scope, replay, and durable
   state tests. The expected initial failure is the absent handoff capability.
3. **Receiver transition:** add the smallest additive schema/migration, route allowlist entry,
   service transition, typed errors, idempotent response replay, and route tests. Retained routes
   must pass unchanged.
4. **Core and Host SDK:** add the standing handoff value objects/client method and an explicit Host
   wrapper/export. Persist sequence and occurrence metadata in the caller; do not hide counters in
   process memory.
5. **Connector and private binding:** add restart-safe local binding custody, v0.2 Adapter
   admission, stable handoff identity, busy/unknown handling, and separate handoff outcome. A
   failed same-task capability is a visible stop gate, never a fresh-session fallback.
6. **Game adapter:** add only the server-side mapping and minimal schema migration required for
   external event identity/time/workflow/binding; preserve Game outbox lease and coalescing. Map a
   Receiver queue response only to the narrow Game publication boundary, never to Agent completion.
7. **Vertical trace:** run two ordered eligible Game signals under one Consent/Grant/task, including
   restart, duplicate, response-loss, busy burst, revocation, wrong-scope denial, deliberate
   no-action, and optional action branches.
8. **Release and hosted readback:** create the [`CP-14 release packet`](../../WebApp/Web-Game/Docs/Engineering/CP-14-eyad-release-packet-2026-09-04.md);
   Eyad publishes/deploys; then read back package metadata, deployed source identity, health/readiness,
   migration, and the redacted trace. Only the readback may raise the claim above local verification.

## Verification and stop conditions

The minimum matrix is defined in TASK-036. It must include positive and negative protocol tests,
retained v0.1/v0.2 regressions, restart and response-loss convergence, cross-player/cross-shelter
denial, no per-event task flood, same-task wake, authenticated page read, genuine WebMCP discovery,
and separate optional Game-effect evidence. Node 24 is the reproducible baseline; commands must
record the actual runtime and immutable source identity.

Stop before consumer integration if any route is guessed, source/package identity is mutable, the
same-task runtime cannot be legitimately admitted, raw task identity or secrets would cross a
boundary, notification receipt would reuse effect authority, unknown would be relabelled success,
or a collaborator's dirty file would be overwritten. Stop before release if the package tarball,
Receiver commit, migration, deployed source, or hosted readback cannot be matched exactly.

## Consequences and reopen trigger

This concentrates implementation control so the team can close the hackathon vertical slice without
waiting for a separate external coding cycle. It also makes this team responsible for cross-layer
contract correctness and a complete release packet; Eyad remains the final publication/deployment
authority. The first implementation increment is larger than a Game-only adapter, but it avoids an
unverifiable handoff and preserves one source of truth per boundary.

Reopen this decision if the selected runtime requires different task custody or admission authority,
if notification handoff cannot be proven at the named boundary, if the Receiver must change the
finite/v0.3 compatibility choice, or if Eyad cannot publish/deploy the exact reviewed artifacts.
