# CP-09 Gatherer Dispatch Pre-Implementation Challenge

## Review control

- Status: `CLOSED; BOUNDED IMPLEMENTATION VERIFIED LOCALLY`
- Date: 2026-09-02
- Scope: `SK-TASK-027`, one authoritative GATHERER dispatch and field role-lock rejection
- Task: [`../Tasks/SK-TASK-027-cp09-gatherer-dispatch-and-role-lock.md`](../Tasks/SK-TASK-027-cp09-gatherer-dispatch-and-role-lock.md)
- Existing authority: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md), [`../Mechanics/detail-07-role-and-loadout-lock.md`](../Mechanics/detail-07-role-and-loadout-lock.md), [`../Mechanics/detail-08-mission-dispatch-return-and-recall.md`](../Mechanics/detail-08-mission-dispatch-return-and-recall.md), and [`../Mechanics/detail-09-navigation-and-pathfinding.md`](../Mechanics/detail-09-navigation-and-pathfinding.md)
- Intended decision: [`../Decisions/ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md`](../Decisions/ADR-GAME-0018-cp09-mission-dispatch-and-role-lock.md)
- Runtime evidence: [`../Evidence/SK-EVID-016-cp09-gatherer-dispatch-runtime-verification.md`](../Evidence/SK-EVID-016-cp09-gatherer-dispatch-runtime-verification.md)
- Cross-functional audit: [`22-cp09-gatherer-dispatch-runtime-cross-functional-audit.md`](22-cp09-gatherer-dispatch-runtime-cross-functional-audit.md)

## Question and falsifiers

The question is whether one resident soldier can receive a durable, server-owned GATHERER mission
through the existing worker gateway while retaining stable identity, route/home-anchor metadata,
idempotency, and role lock, without pretending that extraction or travel already runs.

The hypothesis is falsified if any of the following is true:

- the existing schema cannot migrate atomically to store a mission phase, attempt identity, role,
  tool, target, route, return policy, and home anchor;
- a dispatch needs a client-supplied route, target ownership, or player scope to succeed;
- creating the mission, attempt, soldier transition, and `MissionDispatched` event cannot share one
  transaction and one idempotency result;
- two concurrent dispatches can put one soldier in two active attempts; or
- a role-lock rejection requires a second mission state machine instead of the existing soldier and
  mission authority.

## Affected and unaffected surfaces

| Surface | Affected disposition |
|---|---|
| Persistence schema | Add the smallest CP-09 migration from schema 2 to schema 3 for mission/attempt metadata; preserve all existing rows and contract version. |
| Persistence transaction | Add one dispatch transaction that updates the soldier, creates one mission and attempt, appends one event, and records one idempotency result. |
| Worker gateway | Add one FIFO `assignSoldierMission` operation; direct service calls remain internal tests. |
| Route planning | Build a deterministic open-grid fixture route from shelter anchor to the selected owned Wood/Rock node; store it as a plan, without advancing a soldier. |
| Role/loadout | Support the bounded GATHERER matrix (Wood→AXE, Rock→PICKAXE, tier 1); reject field reassignment visibly. |
| Snapshot/UI | Existing snapshots continue to expose the soldier state/role/tool; mission dashboard projection, travel milestones, extraction, and recall remain later work. |
| Clock/scheduler | No timer, due-work reducer, travel advancement, or world-time mutation is introduced. |
| Economy/combat/Re-entry | No cargo, coin, encounter, death, Signal, WebMCP action, or Agent delivery is created. |

## Failure modes to disprove

- **Partial dispatch:** mission or attempt exists without the soldier becoming field-active, or an
  event/idempotency row is missing after an error.
- **Duplicate effect:** retrying the same idempotency key creates another attempt, event, or route.
- **Stale overwrite:** an old soldier revision dispatches after another command and changes the newer
  state.
- **Ownership leak:** Player A dispatches Player B's soldier or node, or selects a hidden target.
- **Role/tool drift:** a field soldier changes role/tool in place, or a Wood target accepts a pickaxe
  without an explicit contract rule.
- **Two active attempts:** two serialized commands race before either caller observes the new state.
- **Route teleport:** the route is treated as an arrival or resource result rather than a deterministic
  plan with a current home anchor.
- **Schema drift:** an old database opens with missing CP-09 columns, or a failed migration leaves
  metadata/columns half-applied.

## Options

### Minimal: add a durable dispatch transaction and fixture route plan

Add only the CP-09 columns needed to represent a current mission and attempt, one `MissionService`,
and one gateway method. Use the persisted fixture's shelter and node coordinates to produce a
deterministic open-grid route. This gives CP-10 a real handoff while leaving travel and settlement
unimplemented.

### Conservative: keep dispatch in documentation

Do not add schema or runtime code until the entire mission scheduler is ready. This avoids a migration
but leaves the next checkpoint without a durable assignment boundary and cannot prove role lock.

### Expanded: implement travel, extraction, recall, and hunter combat together

This would make a more visible demo but combines CP-09, CP-10, and CP-11 state machines, clock order,
cargo settlement, and failure policy in one unmeasured increment.

## Chosen path

Choose the minimal path and record it in ADR-GAME-0018:

1. Bump the internal persistence schema from version 2 (`cp08-001`) to version 3 (`cp09-001`) while
   keeping `SK-MVP-0.2`. Existing schema 1 and 2 databases migrate transactionally; first-run schema
   creation contains the same columns.
2. Keep one mission chain per soldier. A dispatch creates a stable `mission_id`, a fresh
   `mission_attempt_id`, and `mission.phase = TRAVELLING`; the soldier changes from `AT_SHELTER` to
   `FIELD` in the same transaction. `active_attempt_id` makes the one-active-attempt invariant
   explicit.
3. Accept only server-authorized GATHERER dispatches in this task. The server derives shelter owner,
   target ownership, target position, route, and home anchor from the persisted fixture. The client
   supplies an idempotency key, expected soldier revision, role, tool, and target id, but never a
   route or authoritative position.
4. Persist one `MissionDispatched` event whose causal payload describes the route and role lock. A
   duplicate idempotency key returns the original result; a stale, unauthorized, occupied, or
   incompatible request commits no mission state.
5. Role changes while `soldier.lifecycle = FIELD` return `ROLE_LOCKED` through the same gateway. No
   movement, extraction, return, recall, settlement, or combat transition is attempted.

## Verification and recovery

The Red harness must fail before implementation for a valid fixture dispatch, duplicate replay,
stale revision, wrong-owner/target rejection, role/tool mismatch, field role lock, and schema
migration shape. Green must pass those cases plus the CP-08 predecessor aggregate, typecheck, build,
and documentation validation.

Recovery is to leave the existing CP-08 movement and gateway seams intact, reject the unverified
dispatch at a typed boundary, or disable the new mission method. Reopen instead of expanding scope if
route traversal, mission phase timing, extraction, recall, combat, or a new contract version becomes
necessary.

## Reopen triggers

Reopen before further implementation if a dispatch trusts a client route or scope, creates a second
worker/gateway/state machine, changes event order or `SK-MVP-0.2`, requires a scheduler timer,
introduces cargo/coin settlement, or cannot preserve schema migration and exactly-once idempotency.
