# CP-12 Human Gatherer Dispatch Pre-Implementation Challenge

**Status:** CLOSED; ACCEPTED CHALLENGE SATISFIED BY THE NAMED LOCAL RUNTIME RESULT  
**Checkpoint:** CP-12  
**Task:** [`SK-TASK-045`](../Tasks/SK-TASK-045-cp12-human-gatherer-dispatch-and-authoritative-reconciliation.md)  
**Decision:** [`ADR-GAME-0031`](../Decisions/ADR-GAME-0031-cp12-human-gatherer-dispatch-command-and-reconciliation.md)  
**Date:** 2026-09-02

## Question

What is the smallest ordinary-UI command that lets a human start the already-verified GATHERER
mission chain, while preserving server-derived scope, mission policy, distinct causal/retry identity,
worker FIFO ordering, and the one full-snapshot projection ingress?

## Current evidence and gaps

- `MissionService.assignSoldierMission()` already owns soldier/shelter/node authorization,
  `AT_SHELTER`, fixed GATHERER role/tool/tier, target availability and sensing, route/home anchor,
  attempt identity, transactionality, typed rejection, and idempotency replay.
- `WorkerCommandGateway.assignSoldierMission()` already serializes the transaction with snapshots and
  explicit clock work. There is no browser/HTTP consumer.
- `client_snapshot` already exposes resident soldier rows, sensed Wood/Rock nodes, mission attempt,
  phase, route-derived status, revisions, and next action. The UI can select from this permitted
  projection without reading hidden state.
- CP-12 movement proves the accepted local pattern: strict existing cookie, exact bounded HTTP JSON,
  one in-flight scope, domain acknowledgement without position, and WebSocket full resync as the only
  renderable replacement.
- At challenge time, mission dispatch predated the public command contract. Its input had only
  `idempotencyKey`, the request fingerprint omitted command identity, and
  `MissionDispatched.causationId` equalled the idempotency key. Exposing that directly would have
  violated the accepted identity rule.
- CP-13 remains blocked by `SK-ISSUE-001`; CP-16 still requires ordinary UI to assign, observe, and
  recover a mission without WebMCP.

## Options

### A — Expose the current mission service directly

Rejected. It would publish collapsed command/idempotency identity and omit the strict transport,
single-flight, late-scope, and authoritative reconciliation rules now required by `SK-MVP-0.2`.

### B — Add one strict local GATHERER command and reuse snapshot reconciliation (proposed)

Add distinct command identity to the existing mission transaction, then expose one bounded
local-fixture-only HTTP adapter. The page sends one fixed GATHERER intent selected from its current
projection, but the server treats every field as untrusted and keeps all role/tool/target/route policy
inside MissionService. HTTP returns metadata only; the existing full resync changes the page.

### C — Wait for WebMCP and expose only an Agent tool

Rejected. It leaves the ordinary human UI incomplete, blocks CP-16 on an unavailable adapter, and
would make WebMCP a required gameplay surface contrary to the accepted graceful-degradation rule.

### D — Implement the default scheduler and whole mission lifecycle first

Deferred. The scheduler is necessary for continuous world progress but crosses all due-work phases,
host timing, recovery, and backpressure. The existing domain chain lacks only an ordinary initiator;
closing that seam first gives later scheduler work a real user flow with smaller blast radius.

## Proposed boundary

1. **Exact request.** `POST /api/local-fixture/commands/assign-soldier-mission`, JSON at most 2 KiB,
   exact keys: `command_id`, `command_type`, `contract_version`,
   `expected_entity_revisions.soldier`, `idempotency_key`, and `typed_arguments` containing
   `soldier_id`, `role = GATHERER`, `tool` in `AXE | PICKAXE`, `equipment_tier = 1`, `target_id`, and
   `return_policy = WHEN_FULL`. Identifiers use the accepted 1-128 character grammar and command/idempotency
   identities must differ. No route, owner, scope, coordinate, mission, attempt, or event field.
2. **Strict session and transport.** Fixture-disabled/production remains unsupported. After
   route/method/readiness checks, resolve an existing recognized cookie before media/body parsing;
   bound exact JSON and per-scope admission before the gateway. Query parameters are rejected; no
   absent-cookie Player A fallback exists. Parse fixed GATHERER/tier/return-policy values and the two
   permitted tool enums, then recheck readiness before command admission.
3. **Domain remains policy owner.** The adapter maps exact untrusted values but does not match a tool
   to a target or derive route, target ownership, sensing, availability, or any mission identity.
   MissionService validates those decisions against current persisted state. The domain identity
   correction applies to every existing mission role, including HUNTER, although this HTTP/UI path
   remains GATHERER-only.
4. **Distinct identity.** Add `commandId` to `AssignSoldierMissionInput`, validation, and request
   fingerprint. Use it as `MissionDispatched.causationId`; keep `idempotencyKey` for retry identity
   and deterministic result/event/attempt ids. Exact retry replays; same key plus changed command or
   payload returns `DUPLICATE_COMMAND`.
5. **Revision and durable rejection precedence.** Resolve the server-owned world/player/binding and
   exact idempotency replay without exposing another binding's result. For a new owned-soldier request,
   compare `expectedSoldierRevision` before resident/active state, target, availability, or tool policy;
   the transaction rechecks it. Store every definitive rejection before returning it. If that write
   fails, return recovery/store failure rather than a non-replayable domain result. The expected
   revision comes from matching `snapshot.soldiers[].revision`, never `missions[].revision`.
6. **Bounded success.** `200` returns exactly command identity, contract,
   `effect = mission_dispatched`, duplicate flag, soldier/mission/attempt/event ids, and
   `committed_entity_revisions { soldier, mission, mission_attempt }`. These are minima recorded by
   the original commit, not live revisions. It omits route, home anchor, node state, and any renderable
   row; the serializer whitelists fields rather than spreading the internal result.
7. **Bounded failure and privacy.** Durable owned-soldier conflicts use exact `409` command results:
   `STALE_REVISION`, `ROLE_LOCKED`, `NOT_AT_SHELTER`, `TARGET_UNAVAILABLE`, `TOOL_INCOMPATIBLE`,
   `MISSION_ACTIVE`, or `DUPLICATE_COMMAND`, with `current_entity_revisions.soldier`. Missing or foreign
   soldiers use the same `403 NOT_OWNER` result with an empty revision object. Missing, foreign,
   depleted, or unsensed targets collapse to `TARGET_UNAVAILABLE` after soldier ownership is known.
   Replayed rejection keeps its stored effect/code while its revision is a post-gateway live
   observation. Invalid envelope/fixed values or contract, session, media, size, method, admission,
   gateway/store, and recovery failures are bounded transport errors without entity revisions.
8. **One projection ingress.** Success triggers `resync_request`. Only
   `RealtimeProjectionClient.accept()` may update rows/Canvas. Movement and dispatch may use separate
   UI controls but share the server gateway ordering and cannot create two projection clients.
9. **Client admission.** Enable only at `READY` with a current matching snapshot, no page mutation pending,
   at least one resident row whose next action is `DISPATCH`, and one sensed Wood/Rock node marked
   `AVAILABLE` in the latest authoritative snapshot. Join `missions[]` to `soldiers[]` by soldier id:
   mission-row state decides eligibility, while only `soldiers[].revision` supplies the expected
   soldier revision. The UI offers the fixed AXE/PICKAXE combination and never creates an optimistic mission. Movement and
   dispatch share this synchronous page gate and the same server per-player admission instance;
   their public requests do not overlap.
10. **Exact reconciliation.** The acknowledgement names `soldier_id`, `mission_id`,
   `mission_attempt_id`, `event_id`,
   and committed minimum soldier, mission, and attempt revisions. A full frame satisfies it when the
   matching mission row carries the same mission/attempt ids and at least the mission/attempt
   revisions, joined with the same `snapshot.soldiers` row at or above the soldier revision. The
   authoritative row may already be in a later legal phase for the same attempt; it need not remain
   `TRAVELLING`. If a definitive committed acknowledgement has already been superseded, the same stable
   mission id plus mission revision strictly above the committed minimum and soldier revision at or
   above its minimum settles as accepted-and-advanced even when the current attempt differs or is
   absent. One coalesced lower or otherwise wrong-identity frame gets one follow-up read; a second
   mismatch remains visibly stale.
11. **Late/unknown/reconnect.** Unknown transport outcome triggers one full readback without automatic
   mutation retry and never announces success or failure before the readback. Same-scope reconnect
   preserves the attempt token and a matching first frame may reconcile it. A late acknowledgement
   must match both that token and contract/world/player/shelter scope before it can resync the current
   socket. Changed scope invalidates the token, selection, and old command status; its completion is
   ignored. After acknowledgement, the old mission row remains rendered and all mutations remain
   disabled until matching reconciliation.
12. **No time or downstream effects.** Dispatch may commit only existing mission/soldier/event/due
   state. It cannot advance travel, extraction, combat, return, deposit, world time, outbox, or Agent
   delivery.

## Cross-module acceptance matrix

| Surface | Positive proof | Negative or boundary proof |
|---|---|---|
| Session/scope | Recognized alpha cookie dispatches alpha's resident soldier | Missing/unknown/duplicate cookie, body/query scope, Player B soldier/node, and production mode cannot mutate |
| Identity/retry | Distinct command/key exact replay returns one attempt/event | Equal ids, same key plus changed command/payload, stale revision, and restart replay create no second effect |
| Domain policy | Wood+AXE and Rock+PICKAXE tier-1 GATHERER `WHEN_FULL` commit | Wrong role/tool/tier/policy, field soldier, depleted/hidden/foreign target, and active attempt reject visibly |
| Ordering | Shared page/server admission admits one human mutation; gateway dispatch completes before its requested full snapshot | Public movement/dispatch overlap returns one `429`; gateway FIFO is tested independently; request handler advances no time and creates no second queue |
| Projection | Fresh dispatch reaches the acknowledged attempt in `TRAVELLING`; same-attempt or accepted-and-advanced rules settle later/replayed acknowledgements | HTTP result cannot edit UI; wrong ids or low revisions cannot satisfy the pending gate or loop reads |
| UX | Soldier, target, tool, pending, accepted, and failure text is keyboard/screen-reader usable | Stale/offline/missing snapshot/pending/unavailable choices admit no command and no optimistic state |
| Effects | One mission, attempt, soldier transition, due marker, event, and idempotency result | No travel, cargo, coins, combat, signal, outbox delivery, clock advance, WebMCP, or Re-entry effect |

## Required Red, Green, and runtime proof

1. Red the distinct mission `commandId` contract and event causation before changing MissionService.
2. Red strict session/HTTP envelope, query rejection, bounds, stale-before-policy and durable
   rejection, the exact public success/failure/privacy map, shared movement/dispatch admission,
   and duplicate/stale/role/tool/target outcomes.
3. Red client eligibility, no-optimistic-update, acknowledgement-to-resync, one follow-up, unknown
   outcome, same/changed-scope late completion, and movement/dispatch command interaction.
   Include fresh-resident and post-deposit resident joins where soldier and mission revisions differ,
   plus old-key replay after completion/re-dispatch settling against the newer stable mission lineage.
4. Green only the fixed GATHERER path; refactor shared command/reconciliation helpers only when it
   reduces duplicated policy without coupling movement and mission domain results.
5. Regress focused CP-09 mission/gateway, one HUNTER causation assertion, and CP-12
   projection/fixture/reconnect/keyboard surfaces,
   typecheck/build, then run one isolated browser Rock dispatch and SQLite/event readback.

## Stop and reopen conditions

Stop before implementation if the UI must supply a route/owner/mission identity, the adapter must
derive domain policy, mission acknowledgement must render directly, a new realtime frame/schema or
world-time advance is required, command identity cannot be separated without changing contract
semantics, or the bounded UI cannot distinguish stale/unknown/rejected outcomes.

## Fixed-fixture UX and projection limit

The current snapshot is sufficient for the accepted `sleepless-mvp-01` browser proof: it exposes five
resident `DISPATCH` rows and the sensed Alpha Wood/Rock nodes with type, position, observation time,
revision, and `AVAILABLE`/`DEPLETED`, while withholding quantity. It does not expose target owner or a
general `dispatchEligible` flag. The UI therefore says “available in the latest authoritative
snapshot,” submits only the accepted fixed-fixture choices, and lets MissionService make the final
ownership/sensing/availability decision. `TARGET_UNAVAILABLE`, stale, or role-locked results trigger
one authoritative resync so obsolete options are not left presented as current.

The minimum accessible control is a native `<form>` with `<fieldset>`/`<legend>`, labelled soldier
and target `<select>` elements, disabled choices with textual reasons, a read-only summary of
GATHERER/tier-1/tool/`WHEN_FULL`, fixed cargo-risk copy, a disabled/`aria-busy` fieldset while pending,
and a separate polite live result. Local selection state is allowed; it may not insert a mission row,
route, Canvas actor, or FIELD soldier before authoritative reconciliation. A request accepted by the
server but never settled can still hold this page-wide gate because no command acceptance deadline
is added in this task.

## Post-implementation challenge result

The accepted option B was implemented without crossing a stop condition. Distinct mission command
identity, strict-session HTTP admission, stale-before-policy validation, durable exact rejection,
privacy collapse, shared movement/dispatch admission, gateway FIFO, bounded acknowledgement,
full-frame-only rendering, late/scope handling, and native accessible controls are covered by
focused tests and the real browser path.

[`SK-EVID-034`](../Evidence/SK-EVID-034-cp12-human-gatherer-dispatch-runtime-verification.md)
records one optimized Rock dispatch, authoritative TRAVELLING readback, reload and process restart,
one `MissionDispatched`, distinct causal/retry identity, zero downstream world/economy/combat/outbox
effects, and clean shutdown. [`Validation/55`](55-cp12-human-gatherer-dispatch-runtime-cross-functional-audit.md)
accepts the named local scope and preserves the scheduler, independent-session, WebMCP, Re-entry,
hosted, command-ledger, and acceptance-deadline gates.
