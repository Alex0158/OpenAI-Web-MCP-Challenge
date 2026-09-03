# SK-EVID-038: CP-15 Contract, Race, and Failure Matrix Runtime Verification

## Identity

- Evidence ID: `SK-EVID-038`
- Related task: [`SK-TASK-049`](../Tasks/SK-TASK-049-cp15-contract-race-failure-matrix-aggregate.md)
- Related issue: [`SK-ISSUE-005`](../Issues/resolved/SK-ISSUE-005-next-internal-server-shutdown.md)
- Evidence class: `aggregate`
- Ladder level: `4` — owned local aggregate plus direct process health, autonomous progression,
  persistence, and shutdown readback
- Executor and date: Codex, 2026-09-02, Europe/London

## Exact identity under test

- Source state: working tree on `main`, `HEAD 8b1cc8a` (uncommitted game changes; no commit, push,
  deploy, or hosted claim)
- Source and test root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Contract version: `SK-MVP-0.2`
- Persistence schema: version `8`; migration `cp06-004`
- Runtime: Node.js `v24.13.1`; npm `11.8.0`; TypeScript `7.0.2`; Next.js `16.3.4`; React `19.2.8`;
  `tsx` `4.23.13`; `ws` `8.21.3`
- Runtime databases: task-local temporary file-backed SQLite databases; no repository database was
  used

## Objective and claim boundary

- Behavior under test: one fixed-order CP-15 runner executes the required local contract/race/failure
  rows, stops on required regressions, keeps unavailable/downstream rows explicit, scans evidence for
  secret-shaped assignments, and the real entrypoint starts, advances, persists, and shuts down.
- Claim this evidence may support: the named local aggregate over V05–V12, the isolated V15 trace/type/
  documentation checks, the resolved Next shutdown lifecycle, and the direct local process boundary.
- Claims this evidence cannot support: positive WebMCP, live Re-entry, external Receiver/Connector
  delivery, independent two-session browser behavior, hosted continuity, public identity, CP-16 slice
  closure, or judge reproduction.

## Verification Budget

| Surface | Selected verification | Reused or intentionally omitted |
|---|---|---|
| Persistence, identity, event/outbox, clock, recovery, scheduler, fixture, movement, gateway, realtime wire, missions, extraction, settlement, combat, reissue, projection, reconnect, keyboard, and ordinary dispatch | `npm run test:cp15` runs the fixed-order V05–V12 command set under Node 24 | Existing named predecessor evidence remains reusable; no duplicate aggregate was run after the final green run |
| Trace contract, TypeScript, documentation structure, and evidence scan | V15 inside `npm run test:cp15` | The scan checks only secret-shaped assignments in `Docs/Evidence/*.md`; it does not claim a general security audit |
| Actual process lifecycle | Direct Node 24 entrypoint smoke with a temporary file-backed DB, `/api/health` poll, SQLite readback, and process-group `SIGTERM` | No hosted supervisor, production build, deployment, or external service was used |
| Capability and external delivery | V13/V14 explicitly reported `gated` | Positive WebMCP remains gated by `SK-ISSUE-001`; Receiver/Connector handoff remains external and unavailable |
| Downstream causal slice | V16 explicitly reported `not-run` | CP-16 owns the clean two-player browser/session trace |

## Executed verification

| Replayable command or procedure | Result | Claim this supports |
|---|---|---|
| `npm run test:cp15` under Node 24 | **Passed**; V05–V12 required local rows passed, V13 and V14 remained `gated`, V15 passed, and V16 remained `not-run` | The row-complete local aggregate did not hide gated or downstream boundaries |
| `npm run test:cp15 -- --only V15` | **Passed**; trace helper 5/5, typecheck, documentation self-tests 22/22, documentation validation, and sensitive-evidence scan | The narrow V15 reproducer and the final evidence-integrity row |
| CP-04 Red/Green regression for `NextApplication.close()` | **Red 1/6 before implementation; Green 6/6 after implementation** | The framework lifecycle gap was reproduced and closed without changing worker authority |
| Direct process smoke: `NODE_ENV=test LOCAL_FIXTURE_MODE=1 AUTONOMOUS_WORLD_MODE=1 PORT=<free-port> GAME_DB_PATH=<temporary-file> node node_modules/tsx/dist/cli.mjs src/server/entrypoint.ts`; poll `GET /api/health`, wait for progression, send process-group `SIGTERM`, read the world row | **Passed**; health `ready`, `world_time = 1`, `in_progress_world_time = null`, non-null `server_time_anchor_ms`, `runtime_stopped`, exit status `0`, `timed_out = false` | Actual entrypoint composition, autonomous progression, durable anchor, and framework-handle shutdown |
| `npm run typecheck` under Node 24 | **Passed** | TypeScript contract consistency after the runner and lifecycle fix |

## Matrix assertions

- **V05–V12:** Actual child commands pass the predecessor persistence, authority, identity, revision,
  idempotency, race, restart, projection, and shutdown checks. A child command failure stops the
  runner and leaves the row failed rather than continuing to a false aggregate pass.
- **V13:** The negative unavailable capability result remains separate from the unproven positive
  WebMCP path; `SK-ISSUE-001` remains the owning gate.
- **V14:** No external Receiver/Connector handoff, lease, acknowledgement, or active-Thread delivery
  is fabricated; the row remains gated.
- **V15:** The helper preserves observed order, the type/doc validators pass, and the evidence scan
  finds no secret-shaped assignment in the evidence records.
- **V16:** The local two-player causal slice is not counted; CP-16 owns its browser/session evidence.
- **Entrypoint lifecycle:** Next's optional `close()` runs after listener closure within the existing
  shutdown barrier; the signal handler exits only after the coordinated result is logged and preserves
  status `0`/`1` for success/failure.

## Residual risk and conclusion

- Remaining risks are the positive WebMCP capability, external Re-entry delivery, independent browser
  contexts, CP-16 causal trace, hosted storage/supervision, production identity, and scale/performance.
  Each has a named later task or issue and remains visible in the matrix.
- A source, contract, schema, phase-order, test-harness, runtime, capability, or external-handoff
  change invalidates this evidence and requires rerunning the affected row or reopening CP-15.
- **Conclusion:** `SK-TASK-049` is runtime-verified for the named local CP-15 aggregate and direct
  entrypoint boundary. The aggregate proves its required local rows and preserves explicit gates; it
  does not close CP-13 positive capability, CP-14 live delivery, CP-16, CP-17, CP-18, or hosted claims.
