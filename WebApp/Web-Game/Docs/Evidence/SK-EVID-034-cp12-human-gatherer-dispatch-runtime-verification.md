# SK-EVID-034: CP-12 Human Gatherer Dispatch Runtime Verification

## Identity

- Evidence ID: `SK-EVID-034`
- Related task and decision: [`SK-TASK-045`](../Tasks/SK-TASK-045-cp12-human-gatherer-dispatch-and-authoritative-reconciliation.md); [`ADR-GAME-0031`](../Decisions/ADR-GAME-0031-cp12-human-gatherer-dispatch-command-and-reconciliation.md)
- Evidence class: `process-runtime`
- Ladder level: `4` — one real local browser context over the rebuilt optimized Next page, strict fixture command adapter, shared worker gateway, full WebSocket reconciliation, and file-backed SQLite state
- Executor and date: Codex, 2026-09-02, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit, push, deploy, or hosted claim)
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`; no persistence schema, realtime-frame, world-clock, scheduler, WebMCP, or Re-entry contract revision
- Runtime versions: Node.js `v24.13.1`; TypeScript `7.0.2`; Next.js `16.3.4`; React `19.2.8`; `ws` `8.21.3`
- Browser and session: Codex In-app Browser, browser id `10`, session `01a05e51-a22e-7922-bd7a-d6edcc82557b`, fresh task-local tab at `http://127.0.0.1:3192/`
- Fixture world and seed: `sleepless-mvp-01`, accepted G2 fixture; task-local SQLite path `/tmp/sleepless-kingdom-task045.aOKgGf/world.sqlite`
- Environment and configuration: `NODE_ENV=test`, `LOCAL_FIXTURE_MODE=1`, `HOST=127.0.0.1`, `PORT=3192`; the final two lifecycle runs used `next({ dev: false })` over the rebuilt `.next` output
- Source manifest: 73 regular files under `app/`, `src/`, and `tests/` plus `package.json`, `package-lock.json`, `next.config.ts`, and `tsconfig.json`; sorted relative-path/NUL/individual-SHA-256-entry manifest digest `916071db6140f5ec11310944f67d58a7c4c80c7fe827dccd2bc40d9d81a32096`

## Objective and claim boundary

- Behavior under test: One keyboard-submitted ordinary-page command assigns Player A's resident `soldier-a-01` as a tier-1 GATHERER with `PICKAXE`, `node-rock-a`, and `WHEN_FULL`; the page changes mission state only after a matching authoritative full snapshot.
- Claim this evidence may support: The named local desktop page can issue, reconcile, persist, reload, restart, and explain one strict-session Rock gatherer dispatch while preserving server authority, separate causal/retry identity, and one projection ingress.
- Claims this evidence cannot support: Travel or world-time progression, extraction, combat, deposit, autonomous scheduling, continuous movement, independent sessions, production identity, positive WebMCP, Re-entry, hosted continuity, performance, or the complete CP-16 slice.

## Preconditions and fixture

- Starting state: Player A was at `(16,64)` revision `0`; five Alpha soldiers were resident; one sensed Wood node and one sensed Rock node were available; world time, coins, events, missions, attempts, cargo, encounters, Agent Signal slots, and outbox deliveries were zero.
- Real boundaries: React form behavior, strict fixture-session HTTP admission, request parsing, shared page/server mutation admission, worker FIFO, `MissionService`, mission/attempt/event/idempotency transaction, WebSocket resync, projection validation, SQLite restart, and optimized entrypoint shutdown were real local code.
- Synthetic or absent boundaries: No world scheduler, elapsed-time advance, external service, WebMCP tool call, Agent Signal delivery, Re-entry callback, second browser identity, or production authentication was used.

## Red, Green, and focused verification

| Replayable command or procedure | Result |
|---|---|
| Initial focused Red contracts | Failed as intended before implementation for missing distinct mission `commandId`, public adapter, client reconciliation, and accessible command surface. Later adversarial Reds exposed forged event payload/identity acceptance, weak rejected-idempotency collision handling, foreign-target privacy leakage, and stale rejection readback requirements. |
| `npm run test:cp12-dispatch` under the Node 24 baseline | **Passed 31/31** across strict HTTP/session/admission, gateway FIFO, restart/replay, client reconciliation, rendered-source accessibility contract, server hardening, and rejection refresh. |
| Node 24 test runner over `tests/cp09-mission-dispatch.test.ts`, `tests/cp09-route-milestone.test.ts`, `tests/cp10-deposit-settlement.test.ts`, and `tests/cp11-hunter.test.ts` | **Passed 42/42** across the changed mission identity, route, settlement/reuse, and HUNTER seams. |
| Node 24 test runner over `tests/cp12-projection.test.ts`, `tests/cp12-fixture-session.test.ts`, `tests/cp12-reconnect.test.ts`, `tests/cp12-keyboard-movement.test.ts`, and `tests/cp12-visual-assets.test.tsx` | **Passed 28/28** across the affected projection, fixture, reconnect, page mutation, keyboard, and visual seams. |
| `npm run typecheck` under Node 24 | **Passed**. |
| `npm run build` under Node 24 | **Passed**; Next.js `16.3.4` produced the optimized `/` route. |

No broad aggregate suite was run. The selected checks cover every changed mission, persistence,
transport, gateway, client, fixture, reconnect, input, visual, type, and build seam.

## Browser, persistence, and lifecycle execution

| Procedure | Observed result |
|---|---|
| Open the optimized canonical page against the fresh task-local fixture | `Connection: READY`, `Realtime capability: supported`, world time `0`, Player A at `(16,64)` revision `0`, `shelter-a`, coins `0`, Wood/Rock `1/1`, five resident soldiers, no causal events, and a disabled dispatch submit appeared. |
| Select `soldier-a-01` and `node-rock-a` | The fixed policy rendered `GATHERER`, tier 1, `PICKAXE`, and `WHEN_FULL`; the submit became enabled. No mission, FIELD soldier, route, or event appeared before submission. |
| Focus the labelled submit and press `Enter` | The shared page mutation lease synchronously disabled dispatch and movement. The page reported `Dispatch accepted. Mission reconciled from the authoritative snapshot.` and later re-enabled movement after the matching full frame. |
| Inspect the reconciled page | `soldier-a-01` rendered as `TRAVELLING`, role `GATHERER`, tool `PICKAXE`, target `node-rock-a`, cargo `0/5`, and next action `MONITOR`. Causal history contained exactly one `MissionDispatched` at world time `0`; no optimistic intermediate mission row was used. |
| Inspect rendered semantics and the observed desktop layout | The command used a native `FIELDSET` with legend `Dispatch gatherer`; label targets exactly matched `dispatch-soldier` and `dispatch-target`; the polite result status was outside the disabled fieldset. The `1422`-pixel viewport had no horizontal overflow, no browser warnings or errors, and the fixed cargo-risk copy remained visible. |
| Reload, then stop and restart the optimized entrypoint over the same database | Both reload and process restart restored the same FIELD soldier, ACTIVE/TRAVELLING mission, attempt, Rock/PICKAXE policy, single event, world time `0`, Player A position/revision, and coin balance. The page returned to `READY` without a client-memory dependency. |
| Inspect final SQLite state | One committed idempotency record bound the browser request to one mission, one attempt, and one event. `MissionDispatched.causation_id` was the browser `command_id`; its different `idempotency_key` remained retry identity. Mission and attempt were ACTIVE/TRAVELLING with due time `6`; soldier revision was `1`; route source/target were `(16,64)` and `(34,64)`. |
| Inspect forbidden effects | World time and world revision remained `0`; Player A remained `(16,64)` revision `0`; shelter coins remained `0`; cargo rows/quantity, encounters, Agent Signal slots, outbox deliveries, and non-dispatch events were all `0`. |
| Stop the final optimized entrypoint with `SIGINT` and inspect the listener | The runtime logged `runtime_draining_SIGINT`, `runtime_stopped`, and `task045_optimized_shutdown` with `timedOut:false` and `errorCode:null`; port `3192` was free afterward. |

No cookie value, local storage, credential, password, private Agent context, or external service was
inspected.

## Compact SQLite readback

The final database was opened read-only with Node 24 `DatabaseSync`. `PRAGMA quick_check` returned
`ok`; `PRAGMA foreign_key_check` returned zero rows. The following compact readback is replayable
against the named path:

```text
world/base = 0|1|0|16|64|0|0|0|20|0
mission/attempt = FIELD|GATHERER|PICKAXE|soldier_revision 1|ACTIVE|TRAVELLING|node-rock-a|WHEN_FULL|mission_revision 0|due 6|ACTIVE|TRAVELLING|tier 1|attempt_revision 0|due 6|route (16,64)->(34,64)|eta 6|waypoints 19|work/active joins 1|1|1
event/idempotency = MissionDispatched|cursor 1|worldTime 0|command browser-dispatch-command:02badd96-e320-4bc5-b842-0b307ca4cc35|retry browser-dispatch-idempotency:34b26af4-cf0f-4975-ae3a-d3dc66627187|distinct 1|aggregate 1|scope shelter-a|binding fixture-binding-a|contract SK-MVP-0.2|committed|fingerprint command 1|target node-rock-a|result attempt/event 1|1|event ids 1
counts = missions 1|attempts 1|events 1|idempotency 1|cargo 0|encounters 0|signals 0|outbox 0|snapshots 1|otherEvents 0|collapsedIds 0|otherChangedSoldiers 0|changedNodes 0
```

The readback confirms one browser dispatch effect, one causal event, one retry record, and no
movement, extraction, combat, settlement, Agent Signal, or outbox side effect.

## Assertions

- **Authority and privacy:** The page expresses only the bounded soldier/role/tool/tier/target/return/revision intent. Server session scope and persisted state own player, shelter, sensing, availability, route, mission identity, and event identity. Foreign soldier and target probes do not disclose another player's revisions or resources.
- **Identity and replay:** `command_id` and `idempotency_key` are distinct and validated through the fingerprint, event, and committed payload. Exact success or rejection replay is durable; changed identity/payload and forged store inputs fail without a second effect.
- **Ordering and reconciliation:** Movement and dispatch share page/server admission; worker operations remain FIFO. HTTP returns bounded identity/revision metadata rather than renderable state, and only `RealtimeProjectionClient.accept()` replaces the page from a matching full frame.
- **Failure and lifecycle:** Definitive owned rejections preserve their stored code and obtain a post-gateway live soldier revision. Unknown transport outcomes request at most one readback and never retry the mutation automatically. Late completion remains bound to the original world/player/shelter scope.
- **UX and accessibility:** Native labels, selects, fieldset/legend, fixed policy text, cargo risk, disabled choices, and a separate polite result expose the path without relying on Canvas or color. The actual keyboard submit and optimized desktop layout were exercised.
- **Cross-module effects:** Dispatch created only the existing mission, attempt, soldier transition, due marker, event, and idempotency result. It did not move the player, advance the world, travel, extract, fight, settle, wake an Agent, or write an outbox delivery.

## Analysis and closure

- Failure classification: `none` for the named optimized local human GATHERER dispatch path.
- Accepted residuals: Persistence still has no global command-id ledger across different idempotency keys. A silent accepted command has no wall-time settlement deadline. Public-load queue/connection limits, general target eligibility projection, a rendered DOM test harness, independent session delivery, continuous gameplay scheduling, WebMCP, Re-entry, and hosted behavior remain separate gates.
- Compatibility boundary: Pre-Task045 unshipped mission idempotency fingerprints do not contain `commandId` and intentionally fail closed as `DUPLICATE_COMMAND`; this fresh-database proof makes no backwards-migration or weak-compatibility claim.
- Invalidation triggers: Changes to mission command/result identity, rejected-idempotency persistence, privacy mapping, fixture-session scope, shared admission, gateway ordering, full-frame reconciliation, form semantics, build/runtime versions, fixture seed, or browser surface invalidate this record.
- Exact conclusion: **`SK-TASK-045` is runtime-verified for one local ordinary-UI Rock GATHERER dispatch and authoritative reconciliation path. Scheduler-driven progression, independent sessions, WebMCP, Re-entry, hosted continuity, and the complete vertical slice remain open.**
