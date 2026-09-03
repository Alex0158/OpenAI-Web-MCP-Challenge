# CP-12 Server-Owned Continuous Movement Intent Runtime Cross-Functional Audit

**Status:** RUNTIME-VERIFIED FOR THE NAMED LOCAL SERVER-TO-PAGE SCOPE; hosted continuity, independent browser identity, WebMCP, Re-entry, and public-load gates remain open  
**Date:** 2026-09-03  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Task:** [`SK-TASK-057`](../Tasks/SK-TASK-057-cp12-server-owned-continuous-intent.md)  
**Decision:** [`ADR-GAME-0036`](../Decisions/ADR-GAME-0036-cp12-server-owned-continuous-intent.md)  
**Challenge:** [`Validation/67`](67-cp12-server-owned-continuous-intent-preimplementation-challenge.md)  
**Evidence:** [`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md)

## Audit question

Does the accepted Option B increment expose a continuous-feeling human movement path while keeping the
worker as the only movement authority, binding intent to the authenticated realtime owner, preserving
full-snapshot projection, and stopping safely across races, lifecycle loss, and competing mutations?

## Evidence boundary

- `SK-EVID-043` records the exact uncommitted source identity, pinned Node 24 toolchain, file-backed
  `sleepless-mvp-01` fixtures, focused Red → Green result, affected regressions, typecheck/build, and
  documentation checks.
- The 13-case CP-12 intent suite covers strict frame shape, owner supersession, old-owner stop safety,
  same-owner stale fail-stop, stale explicit stop, move safety-stop, owner revoke, worker fault cleanup,
  blocked terminal failure, client lifecycle, authenticated wire delegation, established-connection
  runtime-admission rejection, and a real worker cadence with close-boundary stop.
- Existing CP-08 cadence/gateway/realtime/wire and CP-12 publication, keyboard, fixture, reconnect, and
  projection suites remain green. The worker uses its existing 100 ms cadence and the existing complete
  `client_snapshot` publication path; no second clock, queue, schema, event, or position ingress was added.
- No browser automation, WebMCP adapter, Agent, Receiver, Local Connector, Codex Thread, hosted service,
  public-load test, or production identity was invoked. Browser-level physical hold duration and hosted
  continuity therefore remain explicit gates.

## Cross-functional findings

| Surface | Finding | Disposition |
|---|---|---|
| World authority and clock | `WorldWorker.advance()` and its existing `WorldClock`/cadence handler remain the only movement driver. A start/stop frame has no immediate position effect. | **Pass**; no browser clock, prediction, or second movement ledger. |
| Frame and identity | The exact shared envelope carries command identity, idempotency key, contract version, expected player revision, and typed direction only. World/player/shelter/binding/connection fields are absent and rejected if injected. | **Pass**; realtime context supplies scope. |
| Session ownership | Each active intent stores the server-issued connection owner. A newer valid owner supersedes the old one; old stop/close revocation checks its token. | **Pass**; no cross-session clear in the tested owner race. |
| Revision and idempotency | Replacement uses the latest accepted revision; same-owner stale replacement clears the old intent before returning typed stale. Explicit stop resolves the current revision. Command and crossing identities remain separate. | **Pass**; duplicate replay does not reactivate or clear a later intent. |
| Gateway and competing mutations | `WorkerCommandGateway` serializes intent, direct move, mission dispatch, advance, and reads. Direct move/dispatch safety-stop the active intent before their existing mutation. | **Pass**; no mutation overlap in the focused FIFO case. |
| Realtime transport | The adapter accepts one-shot movement control frames alongside resync, checks runtime admission for every movement command, delegates through the gateway, returns metadata-only results, and keeps complete snapshots as the renderable ingress. | **Pass**; no periodic stream, browser interval, or heartbeat. |
| Worker lifecycle | Adapter drain/close, socket close, worker fault, and worker stop clear process-local intents before asynchronous cleanup. | **Pass** for local close/fault/stop tests; hosted replacement remains open. |
| Cadence failure | A blocked boundary or stale crossing clears the intent and emits one typed terminal failure to the owning connection when present. | **Pass**; no rejection retry loop. |
| Client lifecycle and UX | The page controller emits one start/replacement/stop frame, waits for its typed result, clears on release/blur/hidden/close, and marks invalid outcomes for recovery. It never renders a command response as position. | **Pass** at controller/wiring level; physical browser hold and device feel are not claimed. |
| Snapshot publication | Automatic worker progress uses the existing detached, bounded full-snapshot publisher. Intent result frames do not create a second projection path. | **Pass** with the predecessor publication suite and local worker composition. |
| Missions, cargo, combat, economy, and events | The increment adds no mission, cargo, combat, coin, world-event, or settlement behavior. Competing mission dispatch stops movement before the existing mission transaction. | **Pass**; downstream authorities remain unchanged. |
| Privacy and scope | The session resolver is the sole source of world/player/binding scope, and the wire test resolves Player A without accepting client scope fields. | **Pass** for the named local session; independent browser identity remains open. |

## Race, failure, and boundary review

| Risk | Control exercised | Result |
|---|---|---|
| Old owner closes after a new owner starts | Owner token comparison on revoke/stop | **Pass**; newer intent remains active. |
| Same-owner direction replacement is stale | Fail-stop before typed `STALE_REVISION` | **Pass**; old direction is not left running. |
| Stop carries stale page revision | Current server revision is used for safety release | **Pass**; owning intent clears without a position mutation. |
| Direct move or dispatch overlaps active intent | Shared gateway safety-stop runs before the mutation | **Pass**; no active intent remains when the competing command executes. |
| Worker fault or stop races future ticks | Cadence clears all process-local intents | **Pass**; subsequent local advances do not move the player. |
| WebSocket closes after a start | Synchronous owner revoke occurs in the close boundary | **Pass**; three later worker advances produce no crossing. |
| Established connection after runtime degradation | Per-message admission check rejects a new movement command before gateway mutation | **Pass**; typed `REALTIME_NOT_READY` result and the existing intent is not replaced. |
| Map edge or stale cadence crossing | Intent is deleted and one terminal failure is exposed | **Pass**; no retry storm. |
| Unknown or invalid client result | Controller clears active state and requires recovery/reset | **Pass** in client controller tests. |
| Command response becomes a position source | Result frame has metadata only; projection accepts snapshots only | **Pass** by parser, wire, and client assertions. |
| Browser-hidden connection remains open | No lease/heartbeat under accepted MVP; blur/hidden sends one best-effort stop | **Accepted residual risk**; reopen only with a new timing decision. |
| Slow/failed snapshot sink | Existing detached publication and per-connection bounded pump | **Pass** via CP-12 publication evidence; no hosted-capacity claim. |

## Audit decision

1. Option B is accepted at the named local runtime level. The page sends one-shot WebSocket intent
   commands; the existing worker cadence owns all movement crossings; complete snapshots remain the only
   renderable position path.
2. The owner token, stale fail-stop, current-revision stop, competing mutation safety-stop, worker
   fault/stop cleanup, and synchronous connection-close revoke close the cross-module races identified
   in `Validation/67`.
3. The client controller composes with the existing page gate and preserves visible recovery and
   accessibility behavior. The older snapshot-gated controller remains a tested presentation utility;
   the live hold path does not silently create a second timer or authority.
4. The result is **not** a hosted continuity, public-load, independent-browser, WebMCP, Re-entry,
   Receiver/Connector/Thread, production-authentication, or judge-reproduction claim. Those gates remain
   separate and visible in the roadmap.

## Reopen triggers

Reopen this audit if an old owner can clear a newer intent, a closed/drained/faulted worker can cross,
stale replacement leaves the old direction active, the page introduces a periodic control clock, a
command result becomes a position source, direct move/dispatch overlaps an intent, hidden-page behavior
requires a lease without a new decision, or any hosted/public/browser capability is claimed without its
own evidence.

## Exact conclusion

**`SK-TASK-057` is runtime-verified for the named local server-owned continuous-intent worker-to-page
scope. The implementation preserves world authority, revision/idempotency, session privacy, full
snapshot projection, gateway ordering, and lifecycle safety. Hosted continuity, independent browser
identity, WebMCP, Re-entry, production identity, public capacity, and judge claims remain open.**
