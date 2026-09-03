# CP-15 Contract, Race, and Failure Verification Fixtures

**Status:** Preparation fixture; runtime verification remains open  
**Checkpoint:** CP-15  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Audit:** [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md)  
**Task:** [SK-TASK-015](../Tasks/SK-TASK-015-cp15-contract-race-verification-preimplementation-pack.md)  
**Purpose:** Prepare the aggregate verification matrix that proves or explicitly gates every known G2 cross-boundary risk.

These vectors are preparation inputs and observable outcomes. They do not create a new rule, schema,
event, command, transport, host, or external service contract. A fake clock, network, browser, or
external stub is a test instrument only.

## Fixture and authority boundary

- Contract version: SK-MVP-0.2 unless the owning task explicitly records a later accepted version.
- Dependency: CP-05 through CP-14.
- Owning authority: 00-Workflow verification ladder, Validation/03-roadmap-gap-audit.md, Engineering/09-mvp-contract-sheet.md, and all owning mechanisms/chains.
- Cross-functional handoff: A failing check may reopen CP-05 through CP-14 or an ADR; CP-16 consumes only stable evidence; CP-17/18 cannot upgrade local evidence into hosted/judge proof.
- Scope: Positive, malformed, unauthorized, stale, duplicate, replay, timeout, crash, unsupported-capability, race, browser-absence, and boundary cases across the critical path.
- Non-goals: New gameplay behavior, balance tuning, production load testing, hosted proof, judge claims, external service implementation, or hiding a failing contract behind a test fixture.

## Evidence classification

- Verified inputs: Verification must record exact source, fixture, ladder level, pass/fail/gated status, claim limit, intentionally unrun checks, and reopen triggers.
- Preparation inference: A coverage matrix keyed by contract section, mechanism, identity, event, failure code, and checkpoint is the smallest reliable aggregate boundary.
- Open fields: aggregate command orchestration, network/lease/fake-clock harness implementation, browser evidence format, external test gating, and flaky-test/artifact retention policy. The preparation default is a row-complete matrix with explicit `pass`, `gated`, `expected-fail`, `flaky`, or `not-run` outcomes; no percentage coverage threshold is required.

## Vectors

### T15-01 — Positive causal path

**Given:** The fixture has valid world, command, event, revision, and permission inputs.  
**When:** The named module handles the transition.  
**Then:** The expected state, event, projection, and claim-level evidence are produced.

### T15-02 — Malformed and unauthorized

**Given:** A command omits fields or uses a wrong owner/world/role.  
**When:** The gateway validates it.  
**Then:** A typed failure occurs before state, event, cargo, coin, or signal mutation.

### T15-03 — Stale revision

**Given:** A command carries an old entity or mission revision.  
**When:** A newer transition has already committed.  
**Then:** The command is rejected and cannot affect the newer attempt.

### T15-04 — Duplicate command/event

**Given:** The same idempotency key or event identity is delivered twice.  
**When:** The worker and delivery path retry.  
**Then:** The original result is reused and no duplicate effect occurs.

### T15-05 — Replay and restart

**Given:** A snapshot cursor precedes committed events.  
**When:** The worker restarts and replays.  
**Then:** The same state and causal order are recovered once.

### T15-06 — Race at boundary

**Given:** Movement, deposit, contact, death, or recall share one due boundary.  
**When:** The worker applies the documented order.  
**Then:** The winner of the serialized order is deterministic and all other paths are typed.

### T15-07 — Timeout and connection loss

**Given:** Browser, WebSocket, Receiver, or host connection disappears.  
**When:** The world and delivery loops continue or enter visible recovery.  
**Then:** No browser or transport timeout changes world authority or creates a hidden retry.

### T15-08 — Unsupported capability

**Given:** WebSocket or WebMCP is unavailable.  
**When:** The capability probe or page initializes.  
**Then:** The unsupported state is visible and no false success is counted.

### T15-09 — Sensitive evidence scan

**Given:** Logs, traces, and artifacts are produced from the causal run.  
**When:** The evidence packet is assembled.  
**Then:** Secrets, credentials, raw Agent context, and private hidden state are absent.

### T15-10 — Contract drift

**Given:** An implementation or external handoff changes a shared field or event.  
**When:** The matrix compares source and contract.  
**Then:** The task stops/reopens rather than silently adapting across the authority boundary.

## Matrix execution order

Run the vectors in dependency order and record each result against the matrix row in
`SK-TASK-015`. A later pass never retroactively closes an earlier gate.

1. **Foundation:** T15-01 through T15-05 over persistence, clock, fixture, event, snapshot, and
   restart boundaries. Use file-backed temporary databases and an injected world clock.
2. **Cross-layer races:** T15-06 over movement, extraction, contact, combat, return, deposit, and
   signal boundaries that share one due marker. Assert the documented worker order and typed loser.
3. **Degraded transport:** T15-07 and T15-08 over browser, WebSocket, WebMCP, Receiver, and host
   loss. The world keeps its authority and the page remains readable.
4. **Evidence integrity:** T15-09 over the exact trace, logs, screenshots, and redaction output.
5. **Drift gate:** T15-10 compares source, task, ADR, contract, and external handoff versions before
   any claim is upgraded.

## Result record

Each vector result must include:

- source commit or working-tree identity and `SK-MVP-0.2` version;
- fixture world, seed, actor/session bindings, world time, wall-time lease values, and database path
  class (never a secret path or production database);
- exact command or replay steps;
- expected and actual state, event ids/cursors, revisions, idempotency outcome, and player-visible
  status;
- `pass`, `fail`, `gated`, `expected-fail`, `flaky`, or `not-run` plus the reason; and
- the highest verification-ladder level and the claim it cannot support.

The matrix is complete only when every applicable row has one of those explicit outcomes. An omitted
row is an evidence gap, not a pass.

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

- aggregate command orchestration;
- network/lease/fake-clock harness implementation;
- browser evidence format;
- external test gating;
- flaky-test and artifact retention policy;

The row-complete matrix and explicit gated-outcome rule above are the preparation default. These
remaining fields may be filled only inside the checkpoint authority, with rationale and verification.
A value that changes an accepted contract, human consequence, external handoff, or settlement boundary
requires an explicit decision before implementation.

## Non-goals

This fixture is a planning aid. It does not prove runtime, slice, hosted, or judge reproduction and
does not authorize code outside its checkpoint.
