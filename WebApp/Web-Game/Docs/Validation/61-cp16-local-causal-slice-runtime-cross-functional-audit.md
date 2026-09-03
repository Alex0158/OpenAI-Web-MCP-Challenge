# CP-16 Local Causal Slice Runtime Cross-Functional Audit

**Status:** ACCEPTED FOR THE NAMED PRE-AGENT LOCAL SLICE; full G2, capability, external delivery, and browser gates remain open  
**Date:** 2026-09-02  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Task:** [`SK-TASK-050`](../Tasks/SK-TASK-050-cp16-local-causal-slice-pre-agent-gates.md)  
**Issue:** [`SK-ISSUE-006`](../Issues/resolved/SK-ISSUE-006-cp11-cargo-loss-signal-eligibility-gap.md)  
**Evidence:** [`SK-EVID-039`](../Evidence/SK-EVID-039-cp16-local-causal-slice-pre-agent-gates-runtime-verification.md)

## Audit question

Does the first CP-16 implementation increment close the real game-side causal boundary from terminal
monster cargo loss to one eligible coalesced signal without creating a second authority, an
unauthorized wake path, a new event/schema, or an unsupported Agent/external/browser claim?

## Evidence boundary

- `npm run test:cp16-local` drives a fresh file-backed G2 fixture through the real worker phase graph
  with explicit world-time advances. It includes a server-owned grant branch, signal-boundary rollback,
  duplicate replay, a no-grant branch, and a Player B scoped snapshot.
- Existing CP-11 combat, Hunter, and reissue suites run as affected predecessor checks.
- The signal provider is an optional worker policy seam. Without it, the default combat path remains
  history-only; with it, the existing `PersistenceStore.upsertSignal` logic is called after validated
  combat events inside the same transaction.
- No Agent, Thread, WebMCP, Receiver, Local Connector, browser automation, hosted process, or public
  identity is invoked by this slice.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Combat and settlement | Terminal gatherer loss still deletes exposed cargo, records death/respawn/reissue, and leaves shelter coins unchanged. | Accepted; CP-11 behavior and event vocabulary are preserved. |
| Event and signal atomicity | `commitMonsterCombatRound` now persists the validated event list, then uses the existing `upsertSignal` seam before the transaction commits. `after_signal` failure rolls back world time, state, cargo, events, slot, and delivery together. | Accepted for the named local boundary; no second queue or signal authority. |
| Grant and identity | The provider is server-owned, side-effect-free, and called only for terminal gatherer loss. The store still validates shelter/binding ownership; a mismatched shelter is rejected. | Accepted; browser cannot mint or select the opaque binding, and a failed combat transaction cannot leave an externally consumed grant behind. |
| Coalescing and replay | One slot/outbox row is created for the eligible event; replay returns the stored combat result and preserves the signal identity; later worker advance adds no duplicate effect. | Accepted for this local replay scope; delivery lease/ack/retry remains CP-14. |
| No-grant behavior | The same event chain produces no signal when no explicit grant is configured. | Accepted; no unauthorized Agent wake is introduced. |
| Projection and privacy | Player B's scoped full snapshot does not expose Player A's cargo-loss or death events, and B has no signal slot. | Accepted at direct local projection level; independent browsers remain open. |
| Clock and worker | The world continues through explicit worker advances while no page command is issued after dispatch. | Accepted as a local browser-absent simulation; actual page close and two-context proof remain open. |
| Capability and Re-entry | The bounded action string is carried as data in the local signal slot, but no page tool is discovered or invoked. | Explicitly gated by `SK-ISSUE-001` and CP-13/14; no positive claim. |
| Evidence and documentation | The task/evidence/validation records bind source, runtime, fixture, commands, claims, and residual gates. | Accepted after validators and typecheck. |

## Race, failure, and boundary review

| Risk | Observed control | Result |
|---|---|---|
| Partial combat/signal commit | Explicit `after_signal` injection is observed at world time 16; all writes are absent after rollback, and the same boundary succeeds on retry. | Pass |
| Duplicate combat replay | The terminal idempotency key returns the stored result and does not insert a second signal/outbox row. | Pass |
| No-grant wake | Provider is omitted; `CargoLostToMonster` remains durable history only and both signal slots remain null. | Pass |
| Cross-shelter leakage | Binding ownership is checked by the store; Player B's projection excludes A's private events. | Pass |
| Event ordering | The existing CP-11 order remains `BattleRoundResolved` through `MissionReissued`; the signal is derived only after the validated event list. | Pass |
| External backpressure | No external delivery is attempted or simulated. | Gated, not-run |
| Positive WebMCP | No adapter discovery or invocation is attempted in this task. | Gated, not-run |
| Browser independence | The test issues no post-dispatch browser input but uses direct worker/projection calls. | Gated, not-run |

## Audit decision

1. The game-side omission identified by `SK-ISSUE-006` is resolved within the existing persistence
   and worker authority. The optional provider is deliberately inert by default.
2. The named pre-Agent local slice is accepted as `slice_verified` under `SK-EVID-039`. It proves an
   atomic event-to-signal boundary and no-grant silence, not a live Agent re-entry.
3. CP-13 positive capability, CP-14 external delivery, force recall, fresh page reread, independent
   browser contexts, hosted continuity, and judge reproduction remain separate gates.
4. Any contract, schema, phase-order, binding, coalescing, or external-handoff change reopens this
   audit and invalidates the evidence.

## Exact conclusion

**The CP-16 pre-Agent local causal slice is accepted at the named local runtime level. Terminal cargo
loss, same-identity death/respawn/review, one granted coalesced signal/outbox, rollback, replay, no-grant
silence, and B-scope privacy are verified through the real game worker and store. Full CP-16/G2 and
all positive WebMCP, external, browser, hosted, and judge claims remain open.**
