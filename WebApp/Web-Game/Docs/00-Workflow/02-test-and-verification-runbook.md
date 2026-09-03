# Sleepless Kingdom Test and Verification Runbook

**Role:** Active test design and execution procedure  
**Status:** Active  
**Last updated:** 2026-09-02

## 1. Purpose and authority

This runbook defines how Sleepless Kingdom tests are designed, selected, executed, interpreted, and
recorded. It complements the operating loop and verification ladder in
[`README.md`](README.md), and the session controls in [`01-session-runbook.md`](01-session-runbook.md).

The owning contract, mechanism, chain, capability, task, and current code still decide what the
game should do and what it currently does. This runbook decides how to obtain and bind test evidence;
it cannot turn a plan, stub, fallback, or green test into a stronger product or hosted claim.

## 2. Test design before test code

Every non-trivial test starts from one observable contract and one bounded question:

1. name the owning `SK-MVP-*` section, mechanism, chain, capability, task acceptance, or verified
   defect;
2. state the stimulus and starting fixture, including the world, actor identities, revisions,
   world time, and relevant permissions;
3. state the expected player-visible result, authoritative state, persistence result, Domain Event,
   cursor or revision effect, and idempotency outcome;
4. choose the smallest boundary that can disprove the behavior; and
5. state the claim the test may support and the higher claims it cannot support.

Use the causal path rather than the implementation shape as the test unit. A test may inspect an
internal seam when that seam is the accepted contract boundary, but it must not pass merely because
an internal helper was called.

For any change involving authority, identity, settlement, event ordering, persistence, visibility,
WebMCP, or Re-entry, cover the applicable cases below:

| Case | Question to disprove |
|---|---|
| Positive | Does the accepted valid command produce the intended state and visible result? |
| Negative | Are malformed, unauthorized, unsupported, or unavailable actions rejected visibly? |
| Boundary | What happens at zero, full capacity, exact due time, minimum level, or the shelter edge? |
| Duplicate | Does a repeated command, event, signal, or delivery have one effect only? |
| Stale | Is a stale entity revision rejected without overwriting newer state? |
| Ownership and visibility | Can one world, shelter, player, or hidden event affect another? |
| Order and race | Is same-time work resolved in the documented order, including competing actors? |
| Restart and replay | Does close, crash recovery, reconnect, or replay preserve the same result? |
| Degraded capability | Is a missing dependency or unsupported page capability explicit and usable? |

Add a performance case only when a measured budget or a changed hot path makes it relevant. Do not
add tests that only mirror private implementation details or repeat an already proven invariant
without a new failure mode.

### 2.1 Default implementation loop: Red, Green, Refactor

Behavior-bearing implementation is led by contract-first, risk-weighted TDD:

1. **Red:** before implementation or a defect fix, add the smallest executable test that expresses
   the observable failure. For an existing defect, preserve the reproducer as a regression test.
   High-risk changes add the relevant duplicate, stale-revision, ownership, ordering, replay, restart,
   race, and exactly-once assertions to the red phase.
2. **Green:** implement the smallest coherent change that makes the focused test pass while keeping
   the server authority, identity, settlement, and event contracts intact. Do not broaden the change
   to make unrelated tests green.
3. **Refactor:** after the focused tests pass, make only behavior-preserving structural improvements,
   then rerun the focused tests and the affected transitive checks. Refactoring is not permission to
   add a new feature, alter a contract, or combine unrelated cleanup.

This is a default for code and behavior changes, not a requirement to manufacture a failing unit test
for every activity. Documentation, visual asset preparation, exploratory capability probes, and
environment diagnosis may use a contract-first probe or manual observation instead. Define the
expected result first, capture the strongest available failure or unknown, execute the smallest
change, and record the limitation. A test added only after implementation can verify behavior, but it
does not prove that the increment followed TDD.

## 3. Fixture and time policy

- Give every test an isolated `world_id`, stable synthetic identities, and a fresh temporary
  directory. A fixture reset creates a new world; it never deletes or rewrites another world's
  history.
- Use the accepted `sleepless-mvp-01` seed and the documented fixture coordinates when a test is
  exercising the G2 world. Record the seed whenever a result depends on generated content.
- Inject a fake world clock for deterministic due-work tests. Do not let browser time, process
  start time, or an unrecorded sleep decide an authoritative result.
- Use a file-backed temporary SQLite database for persistence, restart, WAL, snapshot, and replay
  tests. `:memory:` is not valid evidence for a persistence or restart claim.
- Keep transport lease timing and gameplay `world_time` separate. Wall-time lease expiry may be
  simulated for delivery tests; it must never advance the world clock.
- For the named level-4 autonomous proof, inject the trusted server wall observation and process
  monotonic source. Verify that startup replay preserves the pre-replay anchor, catch-up remains
  within the 300-second budget, and the one-shot driver drains before the file-backed store closes.
  This proves the local explicit-autonomous boundary only; it does not prove hosted supervision or
  a default production scheduler.
- Inject transaction and transport failures at explicit boundaries when testing rollback, retry,
  or degraded behavior. A test-only fallback must remain visible and must not hide data loss,
  duplicate effects, or an authorization failure.
- Do not use production databases, credentials, external Receiver or Codex services, or browser
  capability calls in a lower-level test. Include those boundaries only at the ladder level that
  requires them and record the exact external environment.
- Runtime databases and logs belong in ignored temporary paths. Do not commit mutable traces,
  secrets, or generated test output.

## 4. Test levels and where they belong

Select the lowest level that can answer the question, then add the transitive levels required by
the intended closure claim. The numeric levels are the authoritative
[verification ladder](README.md#11-stage-8-verification-ladder).

| Level | Typical test or readback | What it can establish |
|---|---|---|
| 1 | Documentation, schema, type, and static cross-reference checks | The intended structure is present |
| 2 | Unit and contract tests for one module or boundary | The named contract passes in the tested scope |
| 3 | All available local suites together | The executed local suite passes; runtime remains separate |
| 4 | Start, health, close, restart, durable replay, and deterministic recovery | The named process path works locally |
| 5 | Two browser sessions through page, command, worker, store, and event history | The local slice works together |
| 6 | Genuine page-bound capability registration and invocation | The exact capability is proven in the named session |
| 7 | Hosted clean-identity journey and infrastructure readback | The named hosted or judge journey is reproducible |

The checkpoint task owns its acceptance cases. CP-05, for example, must test persistence and
outbox invariants without claiming gameplay, browser, external Receiver, or hosted behavior.
CP-15 later owns the cross-module contract, race, and failure matrix. This runbook supplies the
method they use; it does not pre-close those checkpoints.

## 5. Standard local commands

Run commands from `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game` with Node.js 24.x.
Record the actual versions when producing evidence.

| Purpose | Command | Current status and claim boundary |
|---|---|---|
| Documentation self-tests | `python3 scripts/test_validate_game_docs.py` | Validator behavior only |
| Documentation validation | `python3 scripts/validate_game_docs.py --root . --report` | Document structure, links, language, and record shape only |
| Type contract check | `npm run typecheck` | TypeScript type correctness for the current tree |
| CP-04 focused suite | `npm run test:cp04` | Current process-skeleton test boundary |
| CP-05 focused suite | `npm run test:cp05` | Use after the CP-05 script and suite exist; not currently available |
| CP-06 focused suite | `npm run test:cp06` | Worker-owned integer clock, deterministic phase order, bounded recovery, and restart seam |
| CP-06 autonomous contract suite | `npm run test:cp06-autonomous` | Schema-v8 anchor migration, trusted target derivation, one-shot overlap/fault/drain, explicit opt-in, and startup admission |
| CP-06 autonomous process suite | `npm run test:cp06-autonomous-runtime` | Level-4 file-backed no-browser progression, bounded restart recovery, anchored partial-boundary replay, and clean drain |
| CP-07 focused suite | `npm run test:cp07` | Deterministic fixture, fingerprint, identity, reset, and restart seam |
| CP-08 focused suite | `npm run test:cp08` | Adjacent-tile authoritative movement, player exploration persistence, idempotency, and full scoped snapshot |
| CP-08 cadence suite | `npm run test:cp08-cadence` | Worker-owned 100 ms movement intent, process-local accumulator, boundary, retry, and restart seam |
| CP-08 gateway suite | `npm run test:cp08-gateway` | Worker FIFO command/read/clock ordering and close boundary |
| CP-08 realtime suite | `npm run test:cp08-realtime` | Transport-neutral full snapshot, scope, sequence, and lifecycle seam |
| CP-08 wire suite | `npm run test:cp08-wire` | Local `ws` upgrade, server-resolved scope, protocol/payload rejection, and drain lifecycle |
| CP-11 combat suite | `npm run test:cp11` | Gatherer loss, cargo deletion, same-identity respawn, event order, and restart predecessor boundary |
| CP-11 Hunter suite | `npm run test:cp11-hunter` | Seeded Hunter victory, monster removal, return navigation, and deposit handoff |
| CP-11 reissue suite | `./node_modules/.bin/tsx --test tests/cp11-reissue.test.ts` | Schema-v6 migration, bounded danger-cell detour/review, anti-loop, reset, rollback, and restart boundary |
| CP-12 projection suite | `npm run test:cp12-projection` | Server-scoped resource/mission projection, privacy, route-derived positions, deterministic draw commands, semantic rows, and explicit null/stale/invalid states |
| CP-12 server-owned intent suite | `npm run test:cp12-intent` | Exact one-shot WebSocket intent frames, session ownership/supersession, stale fail-stop, gateway safety stop, close revocation, and client lifecycle controller |
| CP-13 page-tools suite | `npm run test:cp13-page-tools` | Closed page read schemas, server-derived scope, bounded history, strict query/media/body gates, continuation-gated recall, semantic registration/readback, race protection, unsupported UX, and fail-closed capability cleanup; local fake context only |
| CP-13 recall transition suite | `npm run test:cp13-recall` | Server-authoritative recall transition, signal provenance, stale/combat/duplicate outcomes, route-preserving return, and full-snapshot reconciliation seam |
| CP-15 owned local matrix | `npm run test:cp15` | Fixed-order CP-04 through CP-12 transitive checks, trace-support contract, documentation validators, sensitive-evidence scan, and explicit gated/not-run CP-13/CP-14/CP-16 rows |
| CP-16 bounded local causal slice | `npm run test:cp16-local` | Server-owned terminal cargo-loss eligibility, atomic signal/outbox handoff, rollback, duplicate safety, no-grant silence, and scoped two-player local readback; no positive WebMCP, external delivery, or independent-browser claim |
| Production build | `npm run build` | Build output for the current source; not runtime proof |
| Process runtime | `PORT=<free-port> npm start`, then read `GET /api/health` and send `SIGTERM` | CP-04 process evidence when the exact environment and readback are recorded |

There is currently no aggregate `npm test` script. Do not invent one in a report or treat running a
single focused suite as a complete application suite. Add a named script only when a task owns the
aggregate boundary and its scope is explicit.

On a fresh checkout or after a dependency or lockfile change, run `npm ci --ignore-scripts` before
the affected checks. Do not reinstall on every diagnostic rerun. Never use a dependency install or
build cache as proof that a gameplay or hosted path works.

## 6. Execution order

Use this closed loop for each implementation increment:

1. Read the active task, contract, affected chains, and current Git state. Confirm the fixture and
   expected evidence level before running anything.
2. Run the narrowest focused test that can fail for the change, including its negative and boundary
   cases.
3. If it passes, run affected transitive checks: typecheck, the neighboring focused suites, and
   documentation validation when docs or records changed.
4. Run the build or process/runtime check only when the changed surface or closure target requires
   it. For a runtime check, read back health, state, event, persistence, and shutdown results from
   the actual process rather than relying on exit code alone.
5. For a complete local aggregate, write the session's **Verification Budget** from
   [`01-session-runbook.md`](01-session-runbook.md) first. Rerun an aggregate only when a recorded
   reopen trigger makes earlier evidence stale.
6. Record exact commands, source identity, runtime, fixture seed, outcome, skipped checks, claim
   limit, and residual risk in an `SK-EVID-*` or the task's verification record.
7. Reconcile current status, task state, and owning documents before applying a closure label.

## 7. Failure triage

When a test fails, preserve the first failure and classify it before editing:

| Classification | First action |
|---|---|
| Product or contract | Stop if authority, settlement, event order, identity, or the G2 contract may be wrong; reopen the owning decision or issue |
| Test defect | Prove the test's expected result from the contract, then correct only the test setup or assertion |
| Fixture defect | Rebuild the smallest isolated fixture and record the changed precondition |
| Environment or dependency | Capture versions, configuration, and the smallest reproducible command; do not silently switch drivers |
| Race or timing | Replace sleeps with an injected clock or explicit readiness/acknowledgement, then reproduce the ordering case |
| Performance | Capture a measured budget and representative load before changing architecture |
| Evidence gap | Narrow the claim or run the missing ladder level; a plan, stub, skip, or flaky result is not a pass |

After a failure, rerun the narrow reproducer rather than the full aggregate after every edit. Stop
when repeated runs produce no new evidence and revisit the assumption, fixture, or owning design.

## 8. Evidence and closure rules

Every test result used outside the local session must bind:

- exact source state and contract version;
- Node, Python, browser, database, and host versions actually used;
- fixture world, seed, clock mode, and configuration;
- exact command or replayable procedure;
- pass, fail, skip, gated, expected-fail, or flaky status;
- what was not run and the resulting unknown; and
- the highest verification-ladder level and claim it supports.

A passing test does not prove an untested layer. A local process test does not prove a hosted
always-on worker; a synthetic page capability does not prove genuine WebMCP; and a fixture reducer
does not prove the world simulation. Keep these boundaries visible in the evidence record and
checkpoint closure packet.

## 9. Maintenance

Update this runbook when execution evidence shows that a test-design, fixture, command, triage, or
claim control is missing or routinely ambiguous. Put game rules in their owning module, checkpoint
acceptance in the task or roadmap, and fresh results in `Docs/Evidence/`. Keep this file reusable;
do not append a checkpoint's test output or round-by-round history here.
