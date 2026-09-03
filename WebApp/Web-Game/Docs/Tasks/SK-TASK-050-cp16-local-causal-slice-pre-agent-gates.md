# SK-TASK-050: CP-16 Local Causal Slice Before Agent Gates

## Task Control

- Lifecycle state: `verified`
- Closure type: `slice_verified`
- Checkpoint: `CP-16`
- Owner: Game owner
- Current increment: Close the game-side causal seam from terminal monster cargo loss to one coalesced eligible signal, then verify the two-scope local slice without claiming WebMCP, external delivery, or independent browser support
- Next gate: Full CP-16/G2 continuation only after positive WebMCP capability, external Receiver/Connector handoff, fresh page reread/recall, and independent-browser boundaries become actionable

## Identity

- Task ID: `SK-TASK-050`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The increment crosses combat persistence, worker policy, signal coalescing,
  identity binding, projection visibility, and evidence claims. It is bounded and reversible, but a
  false green result would misstate the event-to-Re-entry chain.

## Objective

Make the accepted local causal path observable and atomic: when a server-owned explicit grant is
present, a terminal gatherer `CargoLostToMonster` transition creates or merges one eligible signal
and outbox row in the same transaction as the combat state/events; without a grant, gameplay remains
history-only and silent.

## Success and non-goals

- Success: `commitMonsterCombatRound` can receive an optional server-owned eligibility input without
  changing the event vocabulary, schema version, clock, or external transport.
- Success: The real worker combat path supplies the grant only for a terminal gatherer loss, and the
  persistence transaction writes the signal after the validated events. State, event, signal, and
  outbox either commit together or roll back together.
- Success: Repeating the same combat idempotency key returns the stored result and does not create a
  second signal/outbox row; later eligible events coalesce through the existing slot rules.
- Success: A clean local fixture slice with two server-recognized scopes records A's dispatch,
  browser-absent worker progression, cargo loss, death, same-identity respawn, bounded reissue/review,
  one pending signal, and scoped B readback without private crossover.
- Success: The evidence packet records exact source/runtime/fixture identity and labels this as a
  pre-Agent local slice. CP-13 positive WebMCP, CP-14 external delivery, force recall, independent
  two-browser behavior, hosted continuity, and judge reproduction remain gated or not-run.
- Non-goals: New gameplay balance, a signal consumer, Thread messaging, WebMCP polyfills or tool
  invocation, Receiver/Connector changes, browser automation, force-recall implementation,
  migration/breach/PvP, new schema/events, deployment, or full CP-16/G2 closure.

## Scope and authority

- In scope: `src/server/persistence/types.ts`, `src/server/persistence/store.ts`,
  `src/server/monster-combat-service.ts`, `src/server/world-worker.ts`, focused tests under
  `tests/`, this task's evidence/validation records, and the task/index/runbook/roadmap status
  links required to keep the source of truth current.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, external services, positive WebMCP capability,
  browser profile/session setup, hosted infrastructure, and unrelated dirty files.
- Allowed actions: Read and edit the named game files, add task-owned tests and English records, run
  Node 24/Python verification, and use temporary file-backed SQLite fixtures. Do not stage, commit,
  push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: `SK-MVP-0.2`, signal eligibility/coalescing, event ordering, identity binding,
  persistence schema, or the WebMCP/Receiver capability result changes.

## Owning authority

- Owning module document: [`Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)
  and [`Mechanics/detail-19-reentry-event-hook.md`](../Mechanics/detail-19-reentry-event-hook.md)
- Owning contract section: Signal eligibility, event-to-signal atomicity, server authority, and
  scoped projection in `SK-MVP-0.2`
- Controlling decision: [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
  and [`ADR-GAME-0025`](../Decisions/ADR-GAME-0025-cp11-gatherer-combat-and-cargo-loss.md)
- Constraining chain or scenario: [`CP-16 local vertical slice fixtures`](../Scenarios/16-cp16-local-vertical-slice-fixtures.md),
  [`CP-13–CP-18 seam map`](../Engineering/10-cp13-cp18-implementation-seam-map.md), and
  [`SK-TASK-049`](SK-TASK-049-cp15-contract-race-failure-matrix-aggregate.md)
- Related defect: [`SK-ISSUE-006`](../Issues/resolved/SK-ISSUE-006-cp11-cargo-loss-signal-eligibility-gap.md)

## Evidence status

- Verified: CP-15's named local aggregate is closed; the existing `commitTransition` path already
  implements event-filtered signal coalescing; the real combat path records the eligible event but
  currently produces no signal; fixture combat, cargo loss, death, respawn, and bounded review/reissue
  are locally deterministic.
- Inferred: An optional, side-effect-free provider is the narrowest cross-module seam because it keeps
  grant issuance server-owned, preserves no-grant silence, and lets the existing persistence coalescer
  remain the sole signal authority. The provider must only derive policy input; it must not reserve or
  consume a grant outside the combat transaction.
- Unknown: Positive page-bound WebMCP discovery/invocation, external delivery/ack/retry, actual
  browser absence across two independent contexts, force recall, hosted continuity, and judge-level
  reproduction.

## Smallest reversible action

Write the focused signal expectation first and run it against the current real combat path to retain
the Red proof. Then add only the typed provider/input seam and atomic `upsertSignal` call, run the
focused Green tests, and inspect the resulting event/signal/binding trace. Stop if any test needs a
fake signal, a browser-authored grant, a second state authority, a new event/schema, or a hidden
retry.

## Verification and closure target

- Minimum verification: `npm run test:cp16-local` under Node.js `v24.13.1`; targeted existing CP-11
  combat tests; `npm run typecheck`; both documentation validators; the task-owned sensitive scan;
  and a timestamped two-scope local trace using a fresh file-backed fixture. The trace may simulate
  page absence by issuing no further browser command after dispatch, but it must not claim two
  independent browser contexts.
- Closure target: `slice_verified` for the named pre-Agent local causal slice. The full CP-16/G2
  acceptance remains open until positive WebMCP, external delivery, fresh page reread/recall,
  independent browser, restart/reconnect/burst, hosted, and judge gates are separately verified.
- Rollback or remediation: Revert only the task-owned provider seam, focused tests, and records if
  the contract review rejects it; preserve the existing combat/event behavior and predecessor
  evidence. Do not remove unrelated files or alter accepted schema/events.
- Reopen trigger: A granted terminal loss lacks one atomic signal, a duplicate replay duplicates
  delivery, an ungranted event emits a signal, Player B can read A's slot/history, or the evidence
  packet overclaims an Agent/external/browser/hosted result.

## Execution notes

- Red baseline: The direct real-worker probe reached the seeded terminal loss and confirmed
  `signalSlot = null`; the focused task test is intentionally added before the seam implementation.
- Green target: The provider returns a fixed server-owned grant only for Player A's shelter binding;
  the store validates the event list and writes one pending slot/outbox row after event persistence.
- Trace boundary: No Agent, Thread, WebMCP tool, Receiver, Connector, browser automation, or external
  message is invoked by this task.

## Closure result

- The optional server-owned eligibility provider is wired through the real worker combat path and
  reaches the existing persistence coalescer only for terminal gatherer loss. No event vocabulary,
  schema version, clock, external transport, or default no-grant behavior changed.
- `npm run test:cp16-local` passed 3/3 under Node.js `v24.13.1`. The positive branch verified one
  pending scoped signal/outbox, terminal cargo loss, same-identity respawn/review, duplicate replay,
  and B privacy; the injected `after_signal` failure rolled the complete boundary back; the no-grant
  branch remained history-only.
- Affected CP-11 combat, Hunter, and reissue suites passed 21/21; `npm run typecheck`, both game
  documentation validators, and the task-owned sensitive scan passed. Evidence is
  [`SK-EVID-039`](../Evidence/SK-EVID-039-cp16-local-causal-slice-pre-agent-gates-runtime-verification.md)
  with cross-functional disposition in [`Validation/61`](../Validation/61-cp16-local-causal-slice-runtime-cross-functional-audit.md).
- Closure is limited to the named pre-Agent local slice. Positive WebMCP, external Receiver/Connector
  delivery, fresh page reread, force recall, independent browser contexts, hosted continuity, and
  judge reproduction remain separate CP-13 through CP-18 gates.
