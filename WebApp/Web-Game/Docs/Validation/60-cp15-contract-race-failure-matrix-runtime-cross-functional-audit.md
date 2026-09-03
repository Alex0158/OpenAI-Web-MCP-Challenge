# CP-15 Contract, Race, and Failure Matrix Runtime Cross-Functional Audit

**Status:** ACCEPTED FOR THE NAMED LOCAL AGGREGATE; capability, external delivery, slice, and hosted gates remain open  
**Date:** 2026-09-02  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Task:** [`SK-TASK-049`](../Tasks/SK-TASK-049-cp15-contract-race-failure-matrix-aggregate.md)  
**Evidence:** [`SK-EVID-038`](../Evidence/SK-EVID-038-cp15-contract-race-failure-matrix-runtime-verification.md)

## Audit question

Does the owned CP-15 aggregate cover the verified predecessor boundaries without silently upgrading
unsupported WebMCP, Re-entry, browser, external, hosted, or judge claims, while preserving one game
authority and a terminable process lifecycle?

## Evidence boundary

- `npm run test:cp15` runs the fixed-order V05–V12 local commands, the V15 support/type/document
  checks, and explicit V13/V14/V16 status output.
- The direct Node 24 entrypoint smoke uses a temporary file-backed database, reads `/api/health`,
  reads the world row, sends `SIGTERM`, and observes a status-0 process exit after `runtime_stopped`.
- The positive page-bound WebMCP result remains blocked by [`SK-ISSUE-001`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md).
- The external Receiver/Connector handoff and CP-16 browser/session slice are not available in this
  game tree and are not simulated by the runner.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| Persistence and world identity | V05 and V07 execute file-backed migration, ownership, idempotency, event/outbox, fixture, reset, and restart checks. | Accepted for their named local scopes; no new schema or world authority is introduced. |
| World time and due-work order | V06 executes integer boundaries, whole-boundary replay, bounded trusted recovery, autonomous scheduler overlap/fault/drain, and anchored partial replay. | Accepted; the runner calls existing worker/clock seams and does not add a second clock. |
| Movement, gateway, and realtime | V08 executes authoritative movement, stale/foreign rejection, FIFO command/read order, full replacement, reconnect, websocket admission, and drain behavior. | Accepted; browser projection remains a read surface and transport loss cannot advance world time. |
| Missions, extraction, settlement, and combat | V09–V11 execute role locks, deterministic route/arrival, cadence/return, contested extraction, home crossing, deposit, cargo loss, Hunter victory, reissue, and restart cases. | Accepted for existing local fixtures; production tuning and PvP/siege remain out of scope. |
| Client and human command boundary | V12 executes projection/privacy, visual semantics, fixture session, reconnect, keyboard, and ordinary GATHERER dispatch/reconciliation. | Accepted at one-context/local scope; independent two-session behavior remains open. |
| Capability | V13 retains the unavailable WebMCP result as a separate gate. | Accepted; no fake registration, polyfill, or simulated Agent invocation is counted. |
| Re-entry/external delivery | V14 remains gated because no versioned Receiver/Connector handoff exists in the game tree. | Accepted; game state does not wait for delivery and no local stub is promoted to external evidence. |
| Matrix and evidence integrity | V15 runs the isolated trace helper, typecheck, both documentation validators, and a secret-shaped assignment scan. | Accepted; scan scope is explicit and is not a general security audit. |
| Process lifecycle | The CP-04 regression exposed and then closed the missing Next internal-server close. The existing listener-first barrier now includes `NextApplication.close()`, and the signal handler exits after the result is logged. | Accepted; `SK-ISSUE-005` is resolved. Hosted supervisor behavior remains a later gate. |
| Downstream slice | V16 is explicitly `not-run` because CP-16 owns the clean two-player causal story and timestamped trace. | Accepted; no slice or judge claim follows from this aggregate. |

## Race, failure, and boundary review

| Risk | Observed control | Result |
|---|---|---|
| Duplicate command/event/effect | Predecessor suites and the trace helper assert idempotency, event identity, effect identity, and stable replay. | Pass in the executed local rows. |
| Stale revision or foreign ownership | Movement, dispatch, projection, wire, extraction, combat, and client dispatch suites exercise typed stale/foreign rejection. | Pass in the executed local rows. |
| Partial boundary or restart | CP-06/CP-10/CP-11/CP-06 autonomous suites exercise durable markers, replay, anchored recovery, return, deposit, death, and reissue. | Pass in the executed local rows; hosted restart remains open. |
| Same-time ordering | Coordinator, route, extraction, contest, home crossing, and combat tests use the accepted worker order. | Pass in the executed local rows. |
| Browser or transport loss | Reconnect, realtime wire, keyboard, and dispatch tests keep the authoritative path server-owned and expose stale/closed states. | Pass at the named local scope; independent browser contexts remain open. |
| Capability or external timeout | V13/V14 are explicit gated outcomes. | No false pass; later capability/handoff evidence required. |
| Framework handle after shutdown | Direct smoke requires `runtime_stopped`, no timeout, and process exit status `0`; CP-04 test covers the close hook. | Pass after `SK-ISSUE-005` fix. |
| Sensitive evidence | Runner scans evidence markdown for secret-shaped assignments and reports findings without printing values. | Pass for the named scan scope. |

## Audit decision

1. The aggregate is a valid local CP-15 closure packet for V05–V12 and V15. It is not a replacement
   for a browser slice, genuine WebMCP invocation, external Receiver/Connector delivery, hosted
   continuity, or judge reproduction.
2. The runner's `--only` path is diagnostic only; a closure claim must use the full `npm run test:cp15`
   result and the direct process smoke, not a narrow row alone.
3. Any predecessor contract, schema, phase order, authority seam, capability result, external handoff,
   or runtime change reopens the affected row and invalidates this audit.
4. CP-16 may now own the next local slice task, but it must consume the explicit V13/V14 gates and
   cannot reinterpret this aggregate as positive Agent or hosted evidence.

## Exact conclusion

**The CP-15 local contract/race/failure matrix is accepted at the named runtime level. Required local
rows pass, unsupported and downstream rows remain visibly gated, and the actual entrypoint terminates
after coordinated shutdown. CP-16, positive WebMCP, live Re-entry delivery, hosted continuity, and
judge reproduction remain open.**
