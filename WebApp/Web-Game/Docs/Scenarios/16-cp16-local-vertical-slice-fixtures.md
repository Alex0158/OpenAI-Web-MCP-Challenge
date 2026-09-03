# CP-16 Local Vertical Slice Fixtures

**Status:** Bounded pre-Agent local causal slice and IAB two-tab limitation runtime-verified; full G2 remains open  
**Checkpoint:** CP-16  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Audit:** [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md)  
**Task:** [SK-TASK-016](../Tasks/SK-TASK-016-cp16-local-vertical-slice-preimplementation-pack.md)  
**Bounded implementation:** [SK-TASK-050](../Tasks/SK-TASK-050-cp16-local-causal-slice-pre-agent-gates.md) and [SK-TASK-069](../Tasks/SK-TASK-069-cp16-local-causal-page-recall-composition.md)  
**Browser probe:** [SK-TASK-063](../Tasks/SK-TASK-063-cp16-independent-browser-context-capability-probe.md)  
**Evidence:** [SK-EVID-039](../Evidence/SK-EVID-039-cp16-local-causal-slice-pre-agent-gates-runtime-verification.md), [Validation/61](../Validation/61-cp16-local-causal-slice-runtime-cross-functional-audit.md), [SK-EVID-056](../Evidence/SK-EVID-056-cp16-local-causal-page-recall-composition-runtime-verification.md), [Validation/82](../Validation/82-cp16-local-causal-page-recall-composition-runtime-cross-functional-audit.md), and [SK-EVID-051](../Evidence/SK-EVID-051-cp16-independent-browser-context-capability-probe.md)  
**Purpose:** Prepare the clean-reset local G2 demonstration and evidence trace from two players through event, Re-entry, page reread, and bounded recall.

These vectors are preparation inputs and observable outcomes. The named pre-Agent implementation slice
verifies the game-side loss-to-signal boundary, the local causal composition verifies delivery through a
page HTTP reread and bounded recall, and the current IAB probe verifies a two-tab limitation and close-one
lifecycle; the complete independent-browser/Agent story remains a later gate.
They do not create a new rule, schema,
event, command, transport, host, or external service contract. A fake clock, network, browser, or
external stub is a test instrument only.

## Fixture and authority boundary

- Contract version: SK-MVP-0.2 unless the owning task explicitly records a later accepted version.
- Dependency: CP-15.
- Owning authority: Engineering/08-development-roadmap-and-checkpoints.md, Engineering/09-mvp-contract-sheet.md, Design/05-hackathon-demo.md, and the complete G2 task packet.
- Cross-functional handoff: CP-16 is where CP-05 through CP-14 conflicts become visible; CP-17 must not treat local evidence as hosted; CP-18 must not rely on developer context.
- Scope: Clean reset, two-player join, gatherer mission, browser close, world progression, monster cargo loss, same-identity respawn, one coalesced signal, fresh page read, recall, restart, reconnect, and redacted trace.
- Non-goals: Manual database edits, hidden demo flags, hosted claims, final visual polish, PvP/siege/migration/breach, external service implementation, or declaring a local trace judge-reproducible.

## Evidence classification

- Verified inputs: The intended story, causal events, identity rules, signal coalescing, full reconnect snapshot, and typed late-action result are already specified by the G2 contract.
- Preparation inference: One scripted causal trace plus contrast and failure branches gives judges more evidence than multiple shallow demos.
- Open fields: exact recording tool/container and timing tolerance, external signal readiness and versioned handoff, reset UX beyond the fresh-path and fixture-identity rule, and evidence storage/retention/redaction policy. The preparation default is a timestamped causal trace with event ids, world cursors, scoped readbacks, and a redaction check.

## Vectors

### S16-01 — Clean start

**Given:** A new fixture world is reset with two players and the accepted seed.  
**When:** Both sessions join.  
**Then:** Each sees its scoped full projection and stable roster without manual state edits.

### S16-02 — Human dispatch

**Given:** Player A assigns a gatherer to the Rock route.  
**When:** The mission travels and extracts.  
**Then:** The dashboard shows role lock, route, cargo, and world time while Player B remains in the same world.

### S16-03 — Browser absence

**Given:** Player A closes the page while the worker remains healthy.  
**When:** The world advances through contact and death.  
**Then:** The causal event and same-identity respawn occur without browser input.

### S16-04 — Re-entry path

**Given:** CargoLostToMonster commits and creates one eligible signal.  
**When:** The Agent returns and reads the canonical page.  
**Then:** Current history/revisions are read before a bounded recall succeeds or returns a typed late result.

### S16-05 — Restart and reconnect

**Given:** The worker restarts after committed events and Player A reconnects.  
**When:** Recovery and full snapshot run.  
**Then:** World identity, event cursor, mission history, and projection recover without duplicate effects.

### S16-06 — Event burst

**Given:** Routine movements and combat rounds occur around the eligible event.  
**When:** The signal and dashboard update.  
**Then:** Routine events remain in history but the Thread receives one coalesced context.

### S16-07 — Unsupported branch

**Given:** WebMCP or realtime capability is unavailable.  
**When:** The same story is attempted through human UI/read paths.  
**Then:** The limitation is visible and the claim packet records the unsupported boundary.

## Operational rehearsal runbook

Run this procedure only after the predecessor task records are stable. It is a local G2 rehearsal;
the external Receiver/Connector and hosted worker remain separate gates.

### Preflight

1. Record source identity, contract version, Node.js 24.x, browser/runtime versions, and the exact
   temporary database path class.
2. Start one entrypoint-owned worker with `LOCAL_FIXTURE_MODE=1` and a fresh file-backed database.
3. Verify health and fixture readiness before opening a page. Do not issue a gameplay command during
   startup or recovery.
4. Create two independent browser contexts. If the available browser offers only shared-profile tabs,
   record the limitation and stop the level-5 portion of the rehearsal.

### Causal trace

| Order | Action | Acceptance readback |
|---:|---|---|
| 1 | Join alpha and beta | Distinct server-derived scopes, same world id, no private-state crossover |
| 2 | Dispatch Player A's GATHERER to Rock | Role/tool lock, mission attempt, route and revision |
| 3 | Close Player A's page | Worker remains ready; world time and mission due work continue |
| 4 | Advance to seeded monster contact and loss | `EncounterLocked`, combat result, `SoldierDied`, `CargoLostToMonster`, `SoldierRespawned`, and bounded reissue/review order |
| 5 | Inspect the delivery slot | One `signal_id`, cursor/count digest, opaque binding, no routine-event wake |
| 6 | Deliver through CP-14 | Live versioned handoff, or explicitly labelled local stub with retry/ack/reject result |
| 7 | Reopen Player A's page | Full current snapshot, mission history, event digest, and capability status are fresh |
| 8 | Attempt bounded recall | Committed `MissionRecalled` or typed live-state failure; no silent no-op |
| 9 | Restart worker and reconnect | Same world, cursor, soldier/mission identity, delivery outcome, and no duplicate effects |
| 10 | Add an event burst | Routine events remain in history; one pending/in-flight signal remains coalesced |
| 11 | Save trace and close | Redacted, reproducible evidence with explicit skipped/gated checks |

### Branch outcomes

- **Positive capability:** Only a genuine page-bound tool discovery followed by a read-only inspection
  may release the bounded recall step. The command still uses current server revisions.
- **Unavailable capability:** Keep the page readable, record the exact adapter error, and classify the
  rehearsal as a human/unsupported branch. Do not add a page polyfill.
- **Late or duplicate action:** Preserve the original command result or return the typed stale/duplicate
  result; never create a second mission transition.
- **Restart failure:** Preserve the first failure and stop the G2 claim until the smallest recovery
  reproducer is understood.
- **External mismatch:** Stop live delivery and record the version/field mismatch for a cross-boundary
  decision; do not rewrite the game event contract silently.

### Closure checklist

- every step has a timestamped world-time and event/cursor readback;
- browser, worker, store, projection, delivery, and command identities are bound to the same fixture;
- no manual database edits, hidden demo flags, credentials, prompts, or private Agent context appear;
- local stub, local runtime, genuine capability, external delivery, hosted, and judge claims are kept
  separate; and
- current status, task state, evidence, and residual risks are updated before any closure label.

## Shared assertions

- The owning server/worker authority remains the only state-changing authority.
- Revisions, idempotency, world identity, and causal event identity prevent duplicate effects.
- A projection, test stub, screenshot, or delivery envelope cannot replace durable game state.
- Cross-module handoffs use the owning mechanism's state and event boundary; no consumer invents a
  second role, mission, ledger, clock, route, or external delivery path.
- Positive, negative, boundary, retry, restart, browser-absent, and unsupported-capability outcomes
  remain distinguishable in evidence.
- A run repeated with the same fixture, seed, event order, and command versions produces the same
  authoritative result, unless an explicitly open production policy is being measured.

## Open implementation fields

- exact recording tool/container and timing tolerance;
- external signal readiness and versioned handoff;
- reset UX beyond the fresh-path and fixture-identity rule;
- evidence storage and retention/redaction policy;

The preparation default is a timestamped causal trace with event ids, world cursors, scoped readbacks,
and a redaction check. These remaining fields may be filled only inside the checkpoint authority, with
rationale and verification.
A value that changes an accepted contract, human consequence, external handoff, or settlement boundary
requires an explicit decision before implementation.

## Non-goals

This fixture is a planning aid. It does not prove runtime, slice, hosted, or judge reproduction and
does not authorize code outside its checkpoint.
