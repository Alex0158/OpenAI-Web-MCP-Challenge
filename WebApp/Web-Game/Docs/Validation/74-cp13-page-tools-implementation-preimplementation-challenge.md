# CP-13 Page Tools Implementation Pre-Implementation Challenge

**Status:** ACCEPTED IMPLEMENTATION BOUNDARY; READ SLICE ADMITTED; RECALL GRANT GATE EXPLICIT  
**Checkpoint:** CP-13  
**Task:** [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Predecessor:** [`Validation/64`](64-cp13-page-tool-contract-preimplementation-challenge.md)  
**Date:** 2026-09-03

## Decision

The first implementation slice is the four accepted page-bound reads. They execute through one
entrypoint-owned HTTP endpoint and the existing FIFO `WorkerCommandGateway`; the page never creates a
worker, store, resolver, queue, or renderable projection. The page registers the four read tools only
after the existing server-bound bootstrap and first full realtime snapshot are ready.

`force_recall_soldier` remains an implementation seam in the same page registry, but it is registered
only after a read result exposes a current server-owned continuation grant (`signal_id` whose durable
slot is scoped to the current binding and whose bounded action is `force_recall_soldier`). The page
must not manufacture a grant, infer one from a `CargoLostToMonster` history row, or register a tool
that can only return `WEBMCP_UNAVAILABLE`. The server recall service validates the signal slot and
optional causal event before the already verified live revision and combat checks. Human server calls
may continue to omit signal provenance; an Agent-shaped page call must carry the signal identity.

This keeps the useful read demonstration moving while making the missing external Receiver/Connector
delivery an explicit evidence boundary. A local fixture can prove the gate with an injected
server-owned eligibility provider; it cannot be described as external Re-entry evidence.

## Frozen implementation choices

### One transport and one authority

- Page callbacks use `POST /api/local-fixture/page-tools/execute` with an exact JSON body
  `{ "tool": <accepted name>, "input": <tool input> }`.
- The entrypoint resolves the existing HttpOnly fixture cookie and passes only its server-derived
  `{ worldId, playerId, binding, shelterId }` to the gateway.
- The gateway serializes reads and recall with the same process-local FIFO ordering as movement and
  dispatch. No route handler imports or constructs mutable worker state.
- The endpoint is local-fixture-only, has a bounded body, `no-store` caching, `Vary: Cookie`, and
  rejects query identity or unknown fields. Transport failures never report a domain effect.

### Exact read result shapes

All tool results use the external snake-case envelope:

```text
contract_version
status: "ok" | "rejected"
tool
request_id
scope: { world_id, player_id, shelter_id }
world_time
```

`inspect_shelter_state` returns a fixed shelter summary, server-derived entity revisions, resident and
active mission counts, sensed Wood/Rock counts, and an optional `continuation` summary. The
continuation exposes signal identity and bounded event metadata, never the opaque binding or a grant
that is not present in the durable signal slot.

`inspect_client_snapshot` returns only fixed-size `agent_snapshot_v1` fields: snapshot id, scope,
world time, player position/revision, shelter revision/coins, world event cursor, and bounded counts.
It omits explored-cell arrays, blocked-cell arrays, actor/resource/mission arrays, and internal rows.

`inspect_missions` returns at most the server roster limit (five fixture soldiers) with mission,
attempt, role/tool/phase, target, return policy, bounded position/cargo/encounter summaries, next
action, and current revisions. It does not return route waypoint arrays.

`inspect_mission_history` accepts only `{}` or `{ cursor?: string, limit?: integer }`, with a default
limit of 20 and a hard maximum of 50. Events are filtered by the same player/shelter visibility
predicate as the full snapshot and contain only event id/type, world cursor/time, and aggregate
identity. The next cursor is opaque to callers and is scope-bound; a foreign, malformed, or regressed
cursor is rejected before any rows are returned.

### Recall grant and reconciliation

- The WebMCP recall schema requires `signal_id` plus the stable soldier/mission/attempt identities and
  expected revisions. `causal_event_id` is optional provenance when the delivered signal includes it.
- The server resolves the signal slot by the current world, shelter, and binding. It accepts only a
  pending, in-flight, or acknowledged slot whose `bounded_action` is `force_recall_soldier` and whose
  `signal_id` matches. If a causal event is supplied it must be a visible `CargoLostToMonster` inside
  the slot cursor range. Mismatch is the typed `STALE_REENTRY_CONTEXT` result and cannot mutate state.
- The existing `MissionService` and `commitMissionRecall` remain the sole transition authority. The
  page receives metadata only and immediately requests the existing full realtime resync; it never
  applies an optimistic phase, route, cargo, or coin update.
- A duplicate idempotency key replays the durable result. A live revision mismatch, combat lock,
  already-at-shelter state, or recovery error remains typed and side-effect safe.

### Registration lifecycle and unsupported behavior

1. Bootstrap resolves the page session and the first full realtime snapshot reaches `READY`.
2. The page feature-detects `document.modelContext`, registers exactly the four read tools with the
   frozen JSON Schemas and `readOnlyHint: true`, and reads them back from the same page context.
3. A read result containing a valid continuation registers `force_recall_soldier` exactly once for the
   current registration generation, even when concurrent shelter reads return the same grant. A
   per-generation registration promise serializes that first registration, and the tool is marked ready
   only after semantic schema readback succeeds. Registration uses an `AbortController`; reconnect,
   scope change, unmount, or failed readback aborts the generation and removes its tools.
4. Missing API, registration failure, schema/readback mismatch, or unavailable grant is visible as an
   unsupported/stale WebMCP status. Human movement and dispatch remain usable.
5. Page-side `getTools()` validates the page API only. A supported GPT-5.6 Sol adapter must still
   discover and read-only invoke the canonical page for positive Agent evidence.

## Cross-module checks before code admission

| Risk | Required invariant | Focused falsifier |
|---|---|---|
| Scope leak | Body/query cannot select player, shelter, world, or binding | Player A request never contains Player B rows; foreign signal is rejected |
| Second authority | All reads and recall cross the existing gateway | Composition test rejects page-created worker/store/queue |
| Unbounded Agent output | Fixed snapshot, five mission rows, history limit 50 | Oversized limit/cursor and raw-array fields are rejected |
| Grant bypass | Recall cannot execute without a matching durable signal slot | Missing, foreign, expired/terminal, or wrong-action signal returns typed stale context |
| Combat bypass | Recall during `LOCKED`/`RESOLVING` remains `IN_COMBAT` | Mission and event rows remain byte-for-byte unchanged |
| Optimistic render | Only full snapshot replaces visible state | Committed metadata without a snapshot leaves page projection unchanged |
| Reconnect race | Old callbacks are aborted and scoped | Callback from old generation cannot mutate/read new scope |
| Stale in-flight page response | Recheck the registration generation after transport and JSON awaits | A response resolving after reconnect is rejected before continuation registration, reconciliation, or stale data return |
| Concurrent continuation registration | One per-generation registration promise owns the first valid grant | Concurrent shelter reads produce one `force_recall_soldier` registration |
| Unsupported browser | No polyfill or simulated capability | Absent `modelContext` leaves ordinary UI enabled and status visible |

## Admission and closure

The Red tests admitted by this challenge cover exact schemas, registration/readback, session-derived
scope, bounded history, fixed snapshot output, unsupported behavior, dynamic grant gating, recall
provenance, full-snapshot reconciliation, concurrent continuation-registration safety, and fail-closed
cleanup for partial registration and both initial and continuation readback failures. The read slice may
be runtime-verified independently.
The recall page gate cannot close until a server-owned continuation grant is available in the canonical
fixture path and the page proves registration, invocation, and resync. External Signal delivery,
Receiver/Connector, Re-entry thread continuation, hosted continuity, and independent browser claims
remain outside this task.
