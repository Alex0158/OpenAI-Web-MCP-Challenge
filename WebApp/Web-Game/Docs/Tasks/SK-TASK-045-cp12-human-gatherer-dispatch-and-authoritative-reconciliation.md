# SK-TASK-045: CP-12 Human Gatherer Dispatch and Authoritative Reconciliation

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-12`
- Owner: Game owner
- Current increment: Closed the accepted ordinary-UI GATHERER dispatch path with focused Red/Green coverage, one optimized browser Rock dispatch, authoritative full-frame reconciliation, SQLite restart proof, and synchronized evidence.
- Next gate: [`SK-TASK-046`](SK-TASK-046-cp06-boundary-safe-gameplay-phase-coordinator.md) must close the same-world-time phase composition and replay boundary before any autonomous wall-time scheduler is admitted.

## Identity

- Task ID: `SK-TASK-045`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The page command crosses soldier ownership and revision, role/tool/target validation, mission-attempt and event identity, command/idempotency semantics, worker serialization, realtime reconciliation, reconnect scope, accessibility, and the later scheduler/WebMCP/Re-entry handoffs.

## Objective

Let the current server-scoped local player dispatch one resident soldier from the canonical page as a
tier-1 GATHERER to one currently sensed and available Wood or Rock node. The browser presents the
accepted fixed role/tool/target combinations but treats every submitted field as untrusted. The
acknowledgement exposes bounded identity/revision metadata to the reconciliation gate; rendered
mission, soldier, route, and phase state changes only after the existing full WebSocket projection
matches the acknowledged vector.

## Success and non-goals

- Success: A `READY` page with a current snapshot lets the human choose one resident
  `nextAction = DISPATCH` soldier and one Wood/Rock target marked `AVAILABLE` in the latest
  authoritative snapshot through a readable,
  keyboard-accessible control.
- Success: One exact local-only typed HTTP command uses strict existing-session scope, distinct
  command/idempotency identities, the resident soldier revision from `snapshot.soldiers`, one shared
  page/server per-player mutation gate, and the
  existing worker gateway/MissionService transaction.
- Success: The server validates ownership, `AT_SHELTER`, GATHERER, target-matched AXE/PICKAXE, tier 1,
  sensed/available target, `WHEN_FULL`, revision, route, active-attempt, and idempotency rules. The
  entrypoint never derives or duplicates those domain decisions.
- Success: HTTP returns a bounded acknowledgement or typed failure without a renderable mission or
  route projection; only a matching newer full snapshot can change Canvas or semantic mission rows.
- Success: Duplicate, stale, role-locked, target-unavailable, tool-incompatible, unauthorized,
  readiness, unknown-outcome, reconnect, and changed-scope behavior are visible and bounded.
- Non-goals: HUNTER dispatch, recall, mission travel or clock advance, extraction timing, combat,
  scheduler composition, mobile-specific controls, WebMCP tools, Re-entry, production identity,
  independent two-session proof, hosted continuity, or balance tuning.

## Scope and authority

- In scope: One shared mission-command contract, distinct `commandId` propagation through
  `MissionService`, one strict local fixture HTTP adapter, shared movement/dispatch admission,
  gateway FIFO,
  acknowledgement-to-resync client gate, resident soldier and sensed resource controls, focused
  tests, one local browser proof, and synchronized evidence/core documents.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, new persistence schema, new realtime frames, new
  clock/scheduler, mission reducers after dispatch, production authentication, external services,
  and hidden fallback behavior.
- Allowed actions: Complete the challenge and decision, add the smallest server/client path and
  focused tests, run an isolated file-backed local browser proof, and update linked evidence/audit
  documents. Do not stage, commit, push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: Mission input/result or event identity, fixture session, soldier/resource
  projection, gateway ordering, realtime reconciliation, reconnect scope, or ordinary-UI command
  policy changes.

## Owning authority

- Mission dispatch and role lock: [`../Decisions/ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md`](../Decisions/ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md), [`SK-TASK-027`](SK-TASK-027-cp09-gatherer-dispatch-and-role-lock.md)
- Projection and local identity: [`../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md), [`../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Command and reconciliation pattern: [`../Decisions/ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md`](../Decisions/ADR-GAME-0030-cp12-discrete-keyboard-command-and-reconciliation.md)
- Current challenge and decision: [`../Validation/54-cp12-human-gatherer-dispatch-preimplementation-challenge.md`](../Validation/54-cp12-human-gatherer-dispatch-preimplementation-challenge.md), [`../Decisions/ADR-GAME-0031-cp12-human-gatherer-dispatch-command-and-reconciliation.md`](../Decisions/ADR-GAME-0031-cp12-human-gatherer-dispatch-command-and-reconciliation.md)
- Human-slice requirement: [`../Engineering/07-hackathon-mvp-build-gate.md`](../Engineering/07-hackathon-mvp-build-gate.md), [`../Scenarios/16-cp16-local-vertical-slice-fixtures.md`](../Scenarios/16-cp16-local-vertical-slice-fixtures.md)

## Evidence status

- Verified predecessor: CP-09 commits one server-derived Wood/Rock GATHERER mission, deterministic
  route, soldier transition, attempt, event, and idempotency result atomically through the worker
  gateway; CP-09/10/11 reducers already consume that state.
- Verified predecessor: CP-12 supplies a strict existing-session local fixture, one real hydrated
  page, explicit reconnect/stale behavior, a server-authoritative movement command pattern, and one
  accepted full-snapshot projection ingress.
- Verified correction: `AssignSoldierMissionInput`, its fingerprint, store validation, and
  `MissionDispatched.causationId` now preserve a distinct `commandId`; `idempotencyKey` remains retry
  identity. Exact retry replays one result, and changed or forged identity/payload fails closed.
- Verified correction: Existing replay is checked first; a new owned-soldier request validates the
  expected soldier revision before mutable mission policy, and a definitive rejection is returned
  only after its exact retry outcome is durable. Replayed owned rejections retain the stored code and
  obtain a serialized live soldier revision.
- External gate: The adapter capability is now proven for one disposable page under SK-EVID-045; this
  human command remains useful without canonical game-page WebMCP and does
  not simulate, polyfill, or claim Agent capability.

## Cross-functional checks

1. **Authority:** JSON may express soldier, fixed role/tool/tier, target, return policy, revision, and
   retry identity. Cookie scope and persisted mission authority decide whether it is legal; the page
   never supplies route, owner, position, mission id, attempt id, or event id.
2. **Identity:** `command_id` enters the request fingerprint and becomes event causation;
   `idempotency_key` remains retry identity. Same key plus different command or payload is
   `DUPLICATE_COMMAND`; same command plus a new key is an explicit ledger/reopen question.
3. **Ordering:** Movement and dispatch share one synchronous page mutation gate and the same
   server-side per-player admission token. Public overlap admits one and returns one typed `429`;
   one gateway operation still serializes internal command/read ordering. Request handlers do not
   advance world time or queue work for later.
4. **Reconciliation:** HTTP acknowledgement carries effect, mission/attempt/event ids, and committed
   soldier/mission/attempt revision minima but no route or mission row. A current frame settles either
   the same attempt at all minima or an accepted-and-advanced stable mission lineage under ADR0031;
   only the existing sequenced full frame can replace UI state.
5. **UX:** A native labelled form explains soldier, latest-observed target, derived tool, and the
   fixed truthful risk that cargo remains unbanked until shelter deposit; it makes no route-specific
   risk or ETA claim. Unavailable choices are disabled with text. Pending, accepted, stale, rejected,
   unknown, and unavailable outcomes do not rely on color.
6. **Cross-module effects:** A successful dispatch may create only the existing mission/soldier/event
   state and due marker. It does not travel, extract, fight, deposit, wake an Agent, or advance time.

## Executed reversible increment

Focused Red contracts first bound distinct mission command identity, strict-session HTTP admission,
result/failure shape, shared mutation admission, gateway FIFO, rejection durability/privacy, and
snapshot-only UI reconciliation. The Green increment then reused the existing MissionService and
gateway for only the fixed GATHERER Wood/Rock path. It added no scheduler, schema, wire frame,
WebMCP fallback, or client-owned mission state.

## Verification and closure result

- Focused verification: Task045 dispatch suites passed `31/31`; affected CP-09/10/11 suites passed
  `42/42`; CP-12 projection/fixture/reconnect/keyboard/visual regressions passed `28/28`; Node 24
  typecheck and optimized build passed.
- Runtime verification: One real browser keyboard submission dispatched `soldier-a-01` to
  `node-rock-a` as GATHERER/PICKAXE/`WHEN_FULL`; only the matching full snapshot rendered
  ACTIVE/TRAVELLING state. Reload and optimized process restart preserved one mission, attempt,
  event, and retry record while world time, player movement, cargo, coins, combat, Agent Signal, and
  outbox state remained unchanged.
- Evidence and audit: [`SK-EVID-034`](../Evidence/SK-EVID-034-cp12-human-gatherer-dispatch-runtime-verification.md)
  and [`Validation/55`](../Validation/55-cp12-human-gatherer-dispatch-runtime-cross-functional-audit.md).
- Closure: `runtime_verified` for the named local ordinary-UI Rock GATHERER dispatch path. No
  scheduler, WebMCP, Re-entry, independent-session, hosted, or full vertical-slice claim follows.
- Rollback or remediation: Remove no unrelated files. If any client or adapter becomes mission
  authority, retain the verified read-only dashboard and CP-09 gateway while removing only the new
  task-scoped command surface.
- Reopen trigger: client-supplied route/owner/mission identity, equal command/idempotency identity,
  duplicate effect, optimistic mission state, stale-scope resync, new wire/persistence/clock policy,
  or a need to broaden beyond the one GATHERER path.

## Residual boundaries

- The idempotency store does not globally reserve one `commandId` across different keys.
- Unshipped pre-Task045 mission fingerprints omit `commandId` and fail closed as
  `DUPLICATE_COMMAND`; this task makes no backwards-migration claim.
- Command settlement has no wall-time acceptance deadline, and the public queue/connection budget
  remains undefined.
- General target eligibility projection, autonomous phase scheduling, independent sessions,
  production identity, WebMCP, Re-entry, hosted continuity, and balance remain later gates.
