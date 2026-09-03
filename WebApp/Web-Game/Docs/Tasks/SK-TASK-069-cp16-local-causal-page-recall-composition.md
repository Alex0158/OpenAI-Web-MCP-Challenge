# SK-TASK-069: CP-16 Local Causal Page-Recall Composition

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-16`
- Owner: Game owner
- Current increment: The real successful monster-loss/reissue path composes with the verified local Re-entry port, canonical page HTTP fresh reads, and one signal-provenance-checked recall action under [`SK-EVID-056`](../Evidence/SK-EVID-056-cp16-local-causal-page-recall-composition-runtime-verification.md) and [`Validation/82`](../Validation/82-cp16-local-causal-page-recall-composition-runtime-cross-functional-audit.md); no external boundary is claimed.
- Next gate: No further gate remains for this named local composition; external Receiver/Connector, Agent wake, genuine WebMCP dynamic recall, browser, hosted, and judge evidence remain separate gates.

## Identity

- Task ID: `SK-TASK-069`
- Date: `2026-09-03`
- Risk profile: `Assured`
- Reason for profile: This test crosses combat settlement, automatic reissue, durable signal/outbox state, local delivery acknowledgement, page readback, revision-gated recall, idempotency, and scope privacy. It must demonstrate composition without turning a local stub into external Agent evidence.

## Objective

Add one replayable local integration trace that starts with the seeded worker producing a real
`CargoLostToMonster` event with a safe automatic reissue, pumps the resulting signal through the
existing game-side `ReentryDeliveryPort` and a labelled accepted transport, rereads the canonical
page through its HTTP page-tool boundary, and executes the bounded `force_recall_soldier` action with
the durable signal and causal event provenance.

## Success and non-goals

- Success: A fresh file-backed `sleepless-mvp-01` fixture reaches the real monster contact, records one terminal loss, and creates one active reissued attempt for Player A.
- Success: The local port delivers one envelope, acknowledges the durable signal once, and preserves the signal identity and event metadata.
- Success: Fresh page reads expose the acknowledged continuation, current mission revisions, and visible causal history; a valid recall transitions the reissued mission to `RETURNING`.
- Success: A duplicate recall is idempotent, world time and combat settlement are not repeated, and Player B cannot read Player A's continuation or private loss history.
- Success: Focused CP-13/CP-14/CP-16 tests, typecheck, documentation validation, and a precise local-only evidence record pass.
- Non-goals: Modifying production source, combat or recall semantics, page contracts, WebMCP registration, Agent grants, the Cloud Receiver, Local Connector, Codex Thread, hosted scheduling, deployment, or external services.

## Scope and authority

- In scope: one test file, one package script, this task, its evidence and validation records, and narrow task/index/current-status/roadmap references.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, Eddy's branch, external services, credentials, generated databases, screenshots, and unrelated dirty files.
- Allowed actions: Add a test-only local composition trace, use the existing fixture and page HTTP seam, run the smallest affected Node 24 checks and documentation validators, and commit only the Game-owned scope. Do not push, merge, deploy, or contact external parties.
- Revalidate when: the worker reissue path, signal slot/port envelope, page read or recall contract, fixture identity, or Eddy's delivered external contract changes.

## Owning authority

- CP-16 causal slice: [`SK-TASK-050`](SK-TASK-050-cp16-local-causal-slice-pre-agent-gates.md), [`SK-EVID-039`](../Evidence/SK-EVID-039-cp16-local-causal-slice-pre-agent-gates-runtime-verification.md), and [`Validation/61`](../Validation/61-cp16-local-causal-slice-runtime-cross-functional-audit.md)
- Local delivery seam: [`SK-TASK-062`](SK-TASK-062-cp14-game-side-local-stub-delivery-port.md), [`SK-TASK-068`](SK-TASK-068-cp14-causal-event-to-local-stub-trace.md), [`SK-EVID-050`](../Evidence/SK-EVID-050-cp14-game-side-local-stub-delivery-port-runtime-verification.md), and [`SK-EVID-055`](../Evidence/SK-EVID-055-cp14-causal-event-to-local-stub-trace-runtime-verification.md)
- Page reads and bounded recall: [`SK-TASK-061`](SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md), [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md), [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md), and [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md)
- Causal policy: [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md), [`Chain C08`](../Mechanics/Chains/08-event-to-reentry-action.md), and [`CP-16 fixtures`](../Scenarios/16-cp16-local-vertical-slice-fixtures.md)
- Execution controls: [`Session Runbook`](../00-Workflow/01-session-runbook.md) and [`Test and Verification Runbook`](../00-Workflow/02-test-and-verification-runbook.md)

## Evidence status

- Verified predecessor: the worker/combat path and successful danger-cell reissue are runtime-verified locally; the game-side port is runtime-verified against a labelled transport; canonical page reads and the server recall transition are separately runtime-verified.
- Gap: no one test currently proves the successful real reissue path, local port acknowledgement, canonical page reread, and provenance-checked recall in one continuous local run.
- Claim limit: a labelled transport and local page HTTP call remain test instrumentation. This task cannot support live Receiver/Connector delivery, Codex Thread wake, Agent invocation, WebMCP capability, hosted continuity, independent browser delivery, or judge reproduction.

## Smallest reversible action

1. Add a fresh file-backed entrypoint test using the existing fixture, move the encounter to the documented safe reissue position, and advance the real worker through loss/reissue.
2. Pump the durable signal through `ReentryDeliveryPort` with an accepted labelled transport; assert envelope identity, acknowledgement, and no duplicate gameplay effects.
3. Read shelter, missions, and history through the canonical page HTTP endpoint; issue one current-revision recall carrying the durable signal and causal event ids; replay it and verify the typed duplicate result.
4. Compare Player B's page read and final world/event state, then add focused verification and evidence/validation records.

## Cross-functional assertions

- The worker and persistence remain authoritative for world time, combat, reissue, mission state, cargo, and event order; the port and page reads cannot advance gameplay.
- The transport wall-time lease is separate from `world_time`; acknowledgement adds only the documented delivery event.
- Signal, causal event, binding, mission/attempt ids, and revisions are read from durable/page state rather than invented by the test.
- The recall is accepted only for the reissued field mission and current revisions; duplicate replay cannot create a second recall or combat effect.
- Player B remains scoped to its own shelter and receives no Player A continuation or private causal loss event.

## Verification and closure target

- Minimum verification: the named causal test, existing CP-13 page/recall and CP-14 port/signal suites, CP-16 local regression, typecheck, documentation self-tests and validator, and `git diff --check -- WebApp/Web-Game`.
- Closure target: `runtime_verified` for this local worker-to-port-to-page-to-recall composition only.
- Intentionally unrun: production build, browser/WebMCP adapter, external Receiver/Connector, Agent, hosted, independent-browser, and judge checks unless a source change unexpectedly requires a focused recheck.
- Rollback or remediation: revert only the task-owned test/script/evidence/docs if the trace shows duplicate settlement, stale acceptance, scope crossover, world-time mutation, or identity mismatch.
- Reopen trigger: production code becomes necessary, any boundary is claimed beyond the labelled local/page test seams, or the causal path loses event, reissue, delivery, readback, or action effects.

## Test and evidence note

This is a test-only composition increment. Existing boundaries are already verified independently, so
the appropriate probe is a fresh real-worker trace that exercises the successful reissue branch and
uses the canonical page HTTP surface; no new production abstraction or synthetic event is authorized.

## Execution result

- Added `tests/cp16-local-causal-page-recall.test.ts` and the named `test:cp16-page-recall` script.
- A fresh entrypoint-owned fixture reached world time `24`, produced one real `CargoLostToMonster` and
  one successful `MissionReissued` branch, and created one scoped pending signal/outbox pair.
- The existing port acknowledged one captured envelope through a labelled transport. Canonical page
  HTTP reads then returned the acknowledged continuation, current active mission revisions, and causal
  history; a provenance-bound recall committed `RETURNING`, and the identical body replayed with
  `duplicate = true`.
- The beta scope remained private, with no continuation or alpha loss history. Delivery and recall did
  not duplicate combat, cargo loss, acknowledgement, or world-time effects.

## Verification and closure

- `npm run test:cp16-page-recall`: **1/1 passed**.
- `npm run test:cp13-page-tools`: **9/9 passed**; `npm run test:cp13-recall`: **9/9 passed**.
- `npm run test:cp14-causal`: **1/1 passed**; CP-14 port suite **5/5**; signal policy suite
  **11/11**; `npm run test:cp16-local`: **3/3 passed**; `npm run typecheck`: **passed**.
- Documentation self-tests, the repository validator, and `git diff --check -- WebApp/Web-Game` passed
  in the closure commit.
- Closure: `verified` with `runtime_verified` for the named local worker-to-port-to-page-to-recall
  composition only. External delivery, Agent/WebMCP dynamic action, independent browser, hosted, and
  judge gates remain open.
