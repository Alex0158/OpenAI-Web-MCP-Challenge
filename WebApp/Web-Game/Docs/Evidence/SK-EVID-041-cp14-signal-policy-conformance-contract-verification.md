# SK-EVID-041: CP-14 Agent Signal Policy Conformance Contract Verification

## Identity

- Evidence ID: `SK-EVID-041`
- Related task and issue: [`SK-TASK-052`](../Tasks/SK-TASK-052-cp14-signal-policy-conformance-tests.md) and [`SK-ISSUE-007`](../Issues/resolved/SK-ISSUE-007-cooldown-period-events-absent-from-next-signal.md)
- Evidence class: `contract`
- Ladder level: `2` — focused persistence contract checks under the Node 24 test runtime
- Executor and date: Codex, 2026-09-02, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD b4c5a8a` (uncommitted game changes; no commit, push,
  deploy, or hosted claim)
- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Runtime: Node.js `v24.13.1`, local `tsx` runner, TypeScript `7.0.2`, file-backed SQLite fixture
- Fixture world and seed: `cp14-signal-policy-world`, world seed `sleepless-mvp-01`
- Environment: fresh temporary database per test; one Player A, one shelter, one opaque binding;
  no Receiver, Local Connector, Codex Thread, browser, WebMCP surface, or external service

## Objective and claim boundary

- Behavior under test: the worker-owned persistence seam for CP-14 vectors R14-02 through R14-05,
  covering routine suppression, ownership denial, burst coalescing, deferred cursor after handoff,
  cooldown gating, same-identity retry, acknowledgement idempotency, and stale-lease rejection.
- Claim this evidence may support: the focused assertions in `tests/cp14-signal-policy.test.ts`
  against the current local persistence seam.
- Claims this evidence cannot support: CP-14 implementation, Receiver or Connector delivery, Agent
  wake, Codex Thread scheduling, page-bound WebMCP, fresh reread/recall, independent browsers,
  hosted continuity, or judge reproduction.

## Preconditions and fixture

- Starting state: a newly created world at `world_time = 0`, Player A and shelter A at revision 0,
  with no signal slot or outbox delivery.
- Synthetic identities: `player-a`, `shelter-a`, opaque binding `player-binding-a`, and fresh
  per-test event, signal, and lease identities.
- Real, fake, and stubbed boundaries: the persistence store and transaction logic are real local
  code; the database path and clock inputs are temporary test fixtures; all external delivery
  boundaries are absent by design.

## Execution

| Replayable command or procedure | Result | Claim this supports |
|---|---|---|
| `npx tsx --test tests/cp14-signal-policy.test.ts` | **Passed 11/11** | R14-02 through R14-05 focused policy assertions, including negative ownership, burst/deferred handling, cooldown history retention, retry identity, acknowledgement idempotency, and stale lease rejection |
| `npm run typecheck` | **Passed** | TypeScript consistency for the current game tree and the added contract suite |
| `python3 scripts/test_validate_game_docs.py` | **Passed 22/22** | Documentation validator self-tests |
| `python3 scripts/validate_game_docs.py --root . --report` | **Passed**; no non-terminal task remains | Record shape, links, language, task lifecycle, and issue directory consistency |

## Assertions

- Player-visible state: none; this is a persistence-only contract test and does not render a page.
- Command and failure contract: routine or ineligible events create no wake; a grant bound to a
  different owner raises typed `OWNERSHIP_DENIED`; a stale lease cannot settle a newer attempt.
- Persistence, event, and outbox state: Domain Events remain durable; one pending/in-flight signal
  identity coalesces eligible bursts; post-handoff events use the deferred cursor; cooldown-period
  events create no wake; acknowledgement appends one `ContinuationDelivered`.
- Exactly-once settlement after duplicate delivery and replay: repeated acknowledgement returns the
  stored acknowledged outcome without a second delivery event; retry reuses the same signal identity.
- Ownership denial, stale revision, restart, and reconnect: ownership denial and stale lease are
  covered; restart, reconnect, external transport, and page capability are outside this evidence.

## Analysis and closure

- Failure classification: `none` — the focused suite is green and the selected B policy is a
  behavior-preserving contract clarification.
- Limitations and residual risk: the R14-04 assertion confirms that an event during an acknowledged
  cooldown remains in the durable event log but is deliberately absent from the next signal summary;
  the Agent must reread canonical history for the complete sequence. This record does not support an
  external Re-entry claim.
- Invalidation triggers: a change to `SK-MVP-0.2` section 7, `ADR-GAME-0009`, the signal-slot
  schema, delivery API, cooldown rule, or persistence transaction behavior.
- Exact conclusion: `SK-TASK-052` is `contract_verified` at ladder level 2 for the named worker-owned
  persistence seam. The task and issue are closed without a runtime or schema change; CP-14 external
  delivery remains gated separately.
