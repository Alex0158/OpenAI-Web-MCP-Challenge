# SK-TASK-001: CP-02 Capability and Runtime Probe

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-02`
- Owner: Game owner
- Current increment: The disposable probe harness and its local capability result are recorded in `SK-EVID-001`.
- Next gate: CP-04 is locally runtime-verified and CP-05 is registered; re-run external WebMCP discovery before CP-13/CP-14.

## Identity

- Task ID: `SK-TASK-001`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The result decides the runtime, the transport, and whether the accepted
  Re-entry boundary is reachable at all. A wrong or optimistic answer here invalidates every
  checkpoint from CP-04 onward.

## Objective

Prove, before any durable game code exists, that the selected local runtimes and the real page
capability can carry the `SK-MVP-0.1` slice.

## Success and non-goals

Success is a recorded probe result that shows, on a named runtime and a named browser session:

- a Node.js 24 worker process starts, exposes health, stops cleanly, and restarts;
- a page renders one Canvas 2D frame;
- one typed command and one snapshot are exchanged over the realtime channel;
- one probe event persists to SQLite in WAL mode and survives the worker restart; and
- page-bound `document.modelContext` registration is either genuinely supported, with a readback, or
  visibly unsupported with a typed result.

Non-goals: game rules, authoritative world state, real missions, real combat, real settlement, the
production schema, visual assets, hosted deployment, and any Re-entry delivery. The harness is
disposable and must not become the durable state implementation.

## Scope and authority

- In scope: a throwaway probe directory inside this application, plus this task and its evidence
  record.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, the outer `Docs/`, and any durable game module.
- Allowed actions: read, edit, write, run locally.
- Revalidate when: the selected browser, Node line, or realtime transport changes.

## Owning authority

- Owning checkpoint: [`../Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md)
- Target stack under test: [`../Engineering/01-tech-stack.md`](../Engineering/01-tech-stack.md)
- Contract the probe must eventually carry: [`../Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md)
- Controlling decisions: [`ADR-GAME-0005`](../Decisions/ADR-GAME-0005-mvp-world-and-rendering-profile.md),
  [`ADR-GAME-0006`](../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md), and
  [`ADR-GAME-0008`](../Decisions/ADR-GAME-0008-development-governance-and-implementation-authority.md)

## Evidence status

- Verified: Node.js `v24.13.1` worker health/start/stop/restart, Canvas rendering, a typed WebSocket
  command and snapshot, duplicate idempotency, SQLite WAL persistence across restart, visible worker
  degradation, and page-side `document.modelContext.registerTool` registration in the named browser
  session. See [`SK-EVID-001`](../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md).
- Inferred: the selected Node/Canvas/WebSocket/SQLite shape is adequate for the next local foundation
  increment; the existing Next.js `16.3.4` dependency tree starts and serves HTTP locally.
- Unknown: whether the current Agent adapter can enumerate and invoke page tools, whether a hosted
  host can keep the worker alive, and whether the game page will bind the same capability. The
  current adapter result is tracked in [`SK-ISSUE-001`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md).

## Smallest reversible action

Build the smallest harness that exercises all five success conditions, record the result, and keep it
quarantined under `probe/cp02/` as a disposable replay artifact. A negative or unavailable capability
result remains a decision point; it is never permission to substitute a silent fallback.

## Verification and closure target

- Minimum verification: ladder level 4 for the process and persistence path, and ladder level 6 for
  page-side registration; external Agent discovery is separately gated.
- Closure result: `runtime-verified`, with the capability result and adapter limitation stated
  separately in [`SK-EVID-001`](../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md).
- Rollback or remediation: the harness is disposable; no durable game state is created.
- Reopen trigger: the selected host or browser cannot keep the worker alive, the page capability
  changes, the external adapter becomes available, or the runtime/browser version changes.

## Explicit non-claim

Passing this probe proves local capability and process boundaries, not gameplay. It does not advance
any `SK-MVP-0.1` rule, does not prove hosted continuity, and authorized preparation of CP-03 only
after the coherence audit is reconciled.
