# TASK-036: Implement the Standing Game-to-Existing-Task Notification Handoff

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-04

## Task Control

- Type: `implementation`
- Lifecycle: `in_progress`
- Priority: `P0`
- Owner: Current project team for implementation; Eyad for final package publication and hosted deployment.
- Current increment: Freeze exact source ownership and protocol baselines, register the additive finite-v0.2 notification-handoff contract, and write the first failing Receiver/persistence tests before wiring any consumer.
- Next gate: The baseline packet is recorded, the exact candidate refs are immutable, and the first red tests fail only because the named handoff route/state transition is not implemented.
- Dependencies: [ADR-0049](../Decisions/ADR-0049-game-team-standing-integration-and-eyad-release.md); [ADR-0046](../Decisions/ADR-0046-restore-bound-task-notification-continuation.md); [ADR-0045](../Decisions/ADR-0045-adopt-standing-transport-profile-v0.2.md); [ADR-GAME-0039](../../WebApp/Web-Game/Docs/Decisions/ADR-GAME-0039-cp14-bound-task-notification-adoption.md); TASK-029, TASK-033, TASK-034, and TASK-035.

## 1. Problem and objective

Deliver one reviewable, source-pinned implementation candidate that carries an eligible
Sleepless Kingdom `CargoLostToMonster` signal through the finite standing v0.2 path to the same
privately enrolled existing Agent task. The candidate must separate Game publication, Receiver
queue acceptance, trusted notification handoff, actual Agent wake, authenticated page/WebMCP read,
optional Game command, and Game effect evidence. After local and hosted gates pass, hand Eyad an
immutable release packet for package publication and Receiver deployment.

This task coordinates the cross-stack implementation; the existing module tasks remain the owners
of their detailed contract concerns. It does not make an unverified external runtime or deployment
claim.

## 2. Current evidence and assumptions

### Verified

- `reentry-core/`, `runtime/host-sdk/`, and `runtime/local-connector/` source are present in the
  outer `main` history; no pending Eddy branch merge is required.
- The candidate Receiver is the nested `saas-boilerplate` repository and is a separate deployment
  boundary. Its current public v0.2 transport exposes Event, claim, and effect-backed acknowledgement
  routes; consent/control services and notification handoff are not yet a complete public path.
- The Game already owns authoritative events, signal coalescing, publication outbox, page state,
  identity, and command ownership. `CargoLostToMonster` is the selected first signal.
- The current Game and external source trees contain collaborator-owned dirty work. Baseline and
  staging must preserve it exactly.

### Accepted target

- One informed standing Consent and finite v0.2 Grant may deliver repeated in-scope signals to one
  existing task until its explicit finite authority expires or is revoked.
- Same-task continuation is mandatory; fresh-session creation is not a fallback.
- Agent discretion is real: action, deliberate no-action, and human-decision outcomes remain valid.
- Receiver settlement is trusted notification handoff, not Agent or Game completion.

### Unknown until verified

- The legitimate host-mediated API that admits a notification to an idle existing task.
- Whether that runtime can return an idempotent admission receipt or authoritative lookup after a
  Connector/App crash; without it, the first profile can retain an explicit unknown but cannot claim
  automatic crash recovery.
- The exact public standing enrollment/control routes and the runtime attestation needed for a
  handoff receipt.
- The deployed Receiver, package artifacts, and hosted source identity matching the candidate refs.

## 3. Scope, ownership, and implementation plan

The current team may edit only the following named surfaces for this task, while preserving any
pre-existing unrelated changes:

| Area | Allowed paths | Required result |
|---|---|---|
| Core | `reentry-core/src/`, `reentry-core/test/`, and its focused contract docs | Strict additive handoff value/client behavior; v0.1 remains frozen |
| Host SDK | `runtime/host-sdk/src/`, `runtime/host-sdk/test/`, package metadata and lockfile only when required | Explicit standing wrapper/export with exact version candidate |
| Local Connector | `runtime/local-connector/src/`, focused tests, package metadata only when required | Durable private binding and v0.2 handoff dispatch; no fresh task |
| Receiver | `saas-boilerplate/backend/src/`, Prisma schema/migrations, focused tests/docs | Additive route/state transition and conformance evidence |
| Game | `WebApp/Web-Game/src/`, focused tests, and CP-14 task/evidence/validation/docs | Server-side mapping and persistence only; preserve gameplay semantics |
| Release packet | Untracked local redacted manifest outside tracked source, then reviewed handoff note | Exact SHAs, package hashes, migration, commands, and readback results |

Do not edit `mvp/`, frozen references, generated artifacts, credentials, mutable runtime databases,
or unrelated collaborator files. The Game child cannot directly modify shared Core; such edits occur
under this outer task and are consumed by the Game after review.

### 3.1 Contract invariants

1. **Finite v0.2 profile:** Do not introduce the until-revoked v0.3 wire/migration in this task.
2. **Additive handoff:** Add `POST /v0.2/delivery-notification-handoffs` as a separately named
   profile only after the red contract fixes its schema. Existing ACK and `effect_token` semantics
   are unchanged.
3. **Stable identity:** `handoff_id` is deterministic and durable for one Receiver delivery across
   retries, response loss, lease reclaim, and Connector restart. Exact replay of an already-recorded
   receipt returns historical truth even after lease expiry or revocation; it never creates a second
   task notification. A new/unrecorded handoff still requires a current lease.
4. **Authority:** Receiver verifies Connector credential, target, Grant, Event, delivery, current
   lease, and a runtime-owned admission attestation. Connector authentication and `handoff_id` alone
   do not prove task-runtime acceptance. Local Adapter verifies private task binding, owner, binding
   generation, and legitimate host admission. No client-selected task, player, or shelter is trusted.
5. **One-active/backpressure:** At most one handoff may be open for a standing Grant/task. Game
   cooldown/coalescing remains authoritative; a busy or retryable result is visible and does not
   consume a new sequence or flood the task.
6. **Data minimization:** Event fields contain only approved identifiers, sequence, state version,
   `occurred_at`, workflow, scope, and canonical URL. Raw task locators, connector/lease tokens,
   signing keys, credentials, prompts, and arbitrary resource payloads stay out of transport/logs.
7. **Separated claims:** A Game `accepted` result means only the configured Game publication or
   Receiver queue boundary. It never means handoff, wake, page read, WebMCP use, or effect.
8. **Unknown is first-class:** A lost response or ambiguous runtime state remains `unknown` until
   the same identity is safely reconciled. Automatic crash recovery is claimed only if the owning
   runtime supplies an idempotent operation or authoritative lookup; otherwise no blind resend or
   success relabeling is allowed.

### 3.2 Phase plan and definition of done

### Phase A — Baseline and provenance

Record the repo root, branch/HEAD/upstream divergence, nested Receiver ref, Core source pin,
package manifests, Node 24 command set, current dirty-file ownership, and current route/schema
observations. Produce a redacted baseline note. **DoD:** every implementation input is immutable or
explicitly marked unknown; no `latest` dependency is used.

### Phase B — Receiver contract and persistence

Write red tests for strict request/receipt validation, current-lease/scope checks, qualified
runtime-attestation requirement, duplicate replay, historical receipt replay after lease
expiry/revocation, response-loss identity, one-active release, expiry/revocation, wrong-scope denial,
and migration compatibility. Implement the smallest additive Receiver migration, service transition,
route, middleware allowlist, typed failures, idempotent response replay, and focused tests. **DoD:**
the handoff tests are green and all retained v0.1/v0.2 route tests remain green.

### Phase C — Public standing enrollment/control

Reconcile the existing consent module before adding public controls. Expose only the exact same-user
session/Origin/CSRF-protected enrollment, inspection, and revocation routes required by the trace;
do not create aliases. Persist the approved binding and finite lifetime. **DoD:** one user can
approve one Grant, inspect it, revoke it, and no other account/target can use it.

### Phase D — Core, Host SDK, Connector, and Adapter

Add the standing wrapper/export and v0.2 handoff client. Add a private local binding store with the
same restrictive file permissions as the existing credential store, stable handoff journal identity,
restart recovery, busy/unknown outcomes, a qualified runtime-owned admission attestation, and a
legitimate same-task Adapter call. **DoD:** a local two-signal source-pinned trace reaches the exact
existing task or stops with a typed unsupported capability; it never starts a fresh task. If runtime
idempotency/lookup is unavailable, record the unknown crash window and stop only the stronger
automatic recovery claim rather than inventing one.

### Phase E — Game mapping and persistence

Add only the minimal schema/versioned mapping for Receiver binding, workflow, event sequence, and
stable ISO occurrence time. Keep Receiver secrets and leases out of Game. Map `signalId` to
`event_id`, use a durable external sequence, use the accepted causal page version for
`state_version`, and preserve Game publication lease/coalescing. **DoD:** two eligible ordered
signals use one Consent/Grant/task and retry the same identity after an unknown outcome.

### Phase F — Cross-functional local trace

Exercise one Player A and one Player B context as needed, with two ordered losses, busy burst,
duplicate, restart, response loss, revocation, wrong-scope, deliberate no-action, optional action,
and independent Game-state readback. **DoD:** every boundary has a separate observation and no
forbidden fallback or cross-player mutation occurs.

### Phase G — Hosted candidate and release packet

Run focused aggregate checks against the exact source, generate package tarballs and SHA-256 hashes,
record migration and environment key names (never values), and prepare a redacted trace and rollback
notes. **DoD:** a reviewer can reproduce the candidate without credentials or mutable local state.

### Phase H — Eyad publication/deployment and readback

Give Eyad the packet. Eyad publishes the exact package versions and deploys the exact Receiver commit.
Re-read public package metadata, deployed source/build identity, `/healthz`, `/readyz`, migrations,
and the hosted trace. **DoD:** hosted claims are raised only from current readback; failed or
unavailable publication remains an explicit residual gate.

### 3.3 Minimum acceptance matrix

| Boundary | Required proof | Failure that stops closure |
|---|---|---|
| Protocol | Strict positive/negative request, receipt, version, duplicate, sequence, and scope vectors | Undocumented field, downgrade, or permissive parser |
| Receiver state | Atomic handoff record, qualified runtime attestation, one-active release, historical replay after lease expiry, expiry, revoke, wrong target | Handoff stored without runtime/lease/target authority or duplicate task notification |
| Enrollment | Same-user Consent/Grant, private binding capture, restart recovery, intentional revoke | Fresh task, raw locator transport, cross-account binding |
| Connector | Claim → qualified same-task runtime admission attestation → handoff report; busy/unknown visible | Process exit, Connector auth, or local staging treated as runtime admission; blind retry |
| Game | Two ordered `CargoLostToMonster` signals, stable `event_id`/sequence/time, coalescing | Game claims Cloud lease/ACK or drops an ambiguous signal |
| Agent/Page | Same task wakes, authenticated canonical page read, genuine WebMCP discovery | New task, unauthenticated page, fabricated tool/effect proof |
| UX/authority | Action, no-action, interruption, human decision, and typed rejection remain distinct | Receiver waits for or requires Game effect |
| Release | Source SHA, package/tarball hash, migration, deployment readback match | Mutable ref, `latest`, or unverified hosted endpoint |

### 3.4 Verification budget

Inner-loop checks are the affected Core/Receiver/SDK/Connector/Game tests only. The first aggregate
is due after the shared handoff schema, Receiver persistence, or Game schema changes. The hosted
aggregate is due only after Eyad's deployment readback. Reusable local evidence remains valid only
when source, schema, identity, and protocol profile are unchanged. Do not run the full repository
suite after every phase; use the narrowest stable test, then the task aggregate at each named gate.
Every closure note records commands, runtime, source identity, passes/skips, intentionally omitted
checks, claim ceiling, and reopen triggers.

## 4. Non-goals

- No new gameplay, combat, economy, shelter, resource, or WebMCP command feature.
- No until-revoked v0.3 migration, public route alias, or automatic version fallback.
- No second queue, Receiver monitor of Game effects, hidden retry loop, fresh-session fallback, or
  client-selected identity.
- No direct deployment, public package publication, credential handling, or destructive restore by
  this task; Eyad owns the final release action after review.
- Stop at the smallest unsupported capability and continue independent safe work. Do not mark the
  task blocked merely because hosted release is pending; record it as the next gate. Do not claim
  automatic crash recovery until the owning runtime supplies idempotent admission or authoritative
  lookup.

## 5. Verification and closure

Close only after Phases A–G are locally verified and Phase H has a current hosted readback, or create
an explicit narrower terminal record if the owner later changes the submission scope. A local green
test, commit, package build, or Eyad's deployment attempt alone does not close the task. Reopen for
any source drift, route/schema change, sequence loss, cross-scope acceptance, fresh-task creation,
false completion, unknown relabelled success, or hosted artifact mismatch.

## 6. Reopen condition

Reopen this task when any closure prerequisite is invalidated: source or package drift, a changed
route/schema, sequence loss, cross-scope acceptance, fresh-task creation, a false completion claim,
an `unknown` outcome relabelled as success, or a hosted artifact mismatch. A hosted publication
failure remains an open release gate rather than evidence that the implementation is complete.
