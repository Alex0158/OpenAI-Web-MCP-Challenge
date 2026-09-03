# SK-ISSUE-006: Monster Cargo Loss Does Not Reach the Eligible Signal Outbox

## Issue Control

- Issue ID: `SK-ISSUE-006`
- State: `resolved`
- Priority: `P1`
- Type: `cross-module-transaction`
- Owner and registered date: Game owner, 2026-09-02
- Next gate: None for the game-side atomic eligibility seam; reopen only if a terminal granted loss
  commits without one coalesced signal/outbox or an ungranted loss wakes an Agent.

## Problem and impact

- Observed behavior: The terminal gatherer combat path persists `CargoLostToMonster`, death,
  respawn, and the bounded reissue result, but `commitMonsterCombatRound` has no signal eligibility
  input and never calls the existing `upsertSignal` seam. A direct Node 24 fixture advance therefore
  leaves `signalSlot(worldId, shelterId, binding)` as `null` after cargo loss.
- Expected behavior: Under the `SK-MVP-0.2` signal contract, a terminal eligible event creates or
  merges exactly one coalesced Agent Signal only when a valid server-owned grant and opaque binding
  are supplied. The event, state transition, signal slot, and outbox row must commit atomically.
- Affected players, actors, missions, and environments: A gatherer carrying exposed Wood/Rock
  cargo when a monster wins; the local worker/SQLite runtime and the later CP-16 causal slice. Hunter
  victory, ordinary no-grant gameplay, and external Receiver/Connector behavior are outside this
  defect.
- Settlement, identity, event-ordering, authority, or reviewer impact: The local game can claim the
  causal event but cannot demonstrate the event-to-Re-entry boundary. Treating the current path as
  complete would hide a cross-module omission and could encourage an unauthorized wake path.

## Evidence

- Verified: A fresh `sleepless-mvp-01` fixture with Player A dispatched to `node-rock-a`, advanced
  through world time 24 under the real worker phase graph, recorded the expected combat/death/cargo
  events and zero cargo, but produced no signal slot. The existing `commitTransition` path already
  calls `upsertSignal`; the combat-specific commit path does not.
- Inferred: The smallest safe repair is an optional provider owned by the server/worker. It preserves
  the existing default behavior when no grant is configured, while allowing CP-16 to prove the
  accepted local causal seam without fabricating an external delivery.
- Unknown: Positive page-bound WebMCP discovery, external Receiver/Connector delivery, independent
  browser contexts, hosted continuity, and judge reproduction remain separate gates.
- First known source baseline: Git `main`, source identity `HEAD 8b1cc8a`, contract `SK-MVP-0.2`,
  Node.js `v24.13.1`, fixture world `sleepless-mvp-01`.

## Ownership and dependencies

- Owning document and implementation: `src/server/persistence/store.ts` and
  `src/server/monster-combat-service.ts`; worker wiring in `src/server/world-worker.ts`.
- Related mechanisms, chains, capabilities, tasks, decisions, and evidence: `SK-MVP-0.2`,
  `ADR-GAME-0009`, `ADR-GAME-0025`, `SK-TASK-049`, `SK-TASK-050`, `SK-EVID-038`, and
  `SK-ISSUE-001`.
- Blocking authority or dependency: The external handoff and positive WebMCP adapter remain
  unavailable; this issue is a game-side atomic eligibility seam and does not authorize changes to
  `reentry-core/`, `mvp/`, or external services.

## Plan and gates

- Next smallest action: Add an optional `SignalEligibilityInput` to the combat commit, obtain it
  only from a server-owned worker provider for the terminal gatherer loss, and call `upsertSignal`
  after event persistence inside the existing transaction.
- Challenge or decision required: No; the accepted contract already defines event eligibility,
  opaque binding, grant, bounded action, coalescing, and no-grant silence.
- Stop or escalation condition: Stop if the repair requires a new schema/event, a browser-selected
  binding, a second queue/clock, an external service change, a hidden default grant, or a silent
  fallback that turns an ineligible event into a wake.
- Verification required for closure: Focused Red/Green persistence and worker tests, duplicate and
  rollback assertions, a two-scope local causal slice, Node 24 typecheck, documentation validators,
  and a redacted evidence/validation record. No external or positive WebMCP claim may be attached.

## Resolution

- Change and remediation: `SK-TASK-050` added the optional server-owned provider, forwarded the
  grant through `commitMonsterCombatRound`, and called the existing `upsertSignal` after validated
  event persistence inside the same transaction. The default path remains no-grant/history-only.
- Evidence: [`SK-EVID-039`](../../Evidence/SK-EVID-039-cp16-local-causal-slice-pre-agent-gates-runtime-verification.md)
  and [`Validation/61`](../../Validation/61-cp16-local-causal-slice-runtime-cross-functional-audit.md).
- Exact closure label: `runtime_verified` for the atomic game-side eligibility seam only.
- Residual risk and owner: External delivery, page capability, browser independence, and hosted
  continuity remain open under the Game owner and `SK-ISSUE-001`.
- Reopen trigger: Any terminal eligible event again commits without its granted signal/outbox, a
  duplicate replay creates a second logical slot, a no-grant path wakes an Agent, or the provider can
  mint/override another player's binding.
