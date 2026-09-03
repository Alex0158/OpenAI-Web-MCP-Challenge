# ADR-GAME-0030: CP-12 Discrete Keyboard Command and Reconciliation

**Status:** ACCEPTED; NAMED LOCAL CP-12 RUNTIME VERIFIED  
**Date:** 2026-09-02  
**Decision owner:** Active `SK-TASK-044` engineering authority under the owner-accepted G2 contract  
**Contract:** `SK-MVP-0.2`  
**Challenge:** [`../Validation/52-cp12-keyboard-movement-preimplementation-challenge.md`](../Validation/52-cp12-keyboard-movement-preimplementation-challenge.md)

## Context

The game has an authoritative adjacent `move_player` transaction, a separately verified continuous
movement-intent cadence, a FIFO worker gateway, and a projection-only WebSocket with explicit full
resync. The local browser fixture has no host scheduler. Wiring key hold to client time would create a
second clock; starting a partial server scheduler would make player movement progress while other
implemented world phases remain uncomposed.

CP-12 still needs one genuine state-changing browser path. The bounded objective is therefore a
desktop command and reconciliation proof, not the final continuous movement feel or the always-on
world scheduler.

## Decision

### 1. One physical key press submits one adjacent command

W-A-S-D and arrow keys map to `up`, `left`, `down`, and `right` only on one explicitly focusable map
movement surface. The page ignores `KeyboardEvent.repeat`, composition, already-handled events, and
Ctrl/Meta/Alt shortcuts, and admits at most one command until the resulting authoritative projection
is reconciled. It also ignores movement while the document is hidden/unfocused, focus is outside that
surface, the connection is not `READY`, no full snapshot exists, or a command is already pending.

This discrete page path coexists with `PlayerMovementCadenceService`; it does not replace or weaken
the accepted 4-tiles-per-world-second worker cadence. Continuous held intent remains deferred until a
single accepted host scheduler composes every required world phase.

### 2. Use a typed local HTTP command and keep `/realtime` projection-only

The non-production entrypoint owns one bounded `POST /api/local-fixture/commands/move-player` adapter.
Its exact JSON envelope contains `command_id`, `command_type = move_player`, `contract_version`,
`expected_entity_revisions.player`, `idempotency_key`, and `typed_arguments.direction`. The fixture's
HttpOnly cookie carries the opaque session binding; JSON cannot select a world, player, shelter,
binding, coordinate, or explored cell.

The adapter validates the route/method and runtime gate, then resolves strict existing-session
ownership before inspecting media type or reading/decoding/parsing the body. An unauthenticated
malformed or oversized request therefore remains `401` instead of becoming a parser oracle. After
authentication, the adapter bounds media type, payload size, exact keys, values, contract version,
and per-player admission before calling the worker gateway. Production and fixture-disabled modes
remain visibly unsupported.

### 3. Separate bootstrap issuance from command authentication

`resolveBootstrap()` may continue issuing the default Player A handle only for an absent-cookie
bootstrap request. Realtime and mutation admission use a strict existing-session resolver. An absent,
malformed, duplicate, or unknown cookie never authenticates Player A. This brings the local resolver
back into line with the existing realtime-auth decision and does not create a production identity
scheme.

### 4. Preserve command and idempotency identity

`MovePlayerInput` carries both `commandId` and `idempotencyKey`. They are non-empty, bounded, and
distinct. The request fingerprint includes `commandId`; `PlayerMoved.causationId` uses `commandId`,
while the event/idempotency record uses `idempotencyKey`. Replaying the same command/key returns the
original result without another move or event. Reusing the key with another command id or request is
`DUPLICATE_COMMAND`.

After an existing-key replay miss, the movement transaction compares the current player revision
before evaluating collision. `STALE_REVISION` and `MOVEMENT_BLOCKED` are both durably recorded as
rejected idempotency outcomes, so a retry remains exact after restart or later movement. This order
prevents a stale command aimed beyond the boundary from being misclassified as blocked.

Internal movement-cadence crossings receive deterministic but separate command and idempotency ids,
so the existing continuous worker proof remains exactly-once.

### 5. Acknowledgement is not projection

The HTTP success contains the command id, contract, effect, event id, committed player revision, and
duplicate marker when applicable. It deliberately omits a renderable position or snapshot. After a
success, the client sends the existing `resync_request`; the hub reads through the gateway FIFO and
returns the next sequenced full frame. Only `RealtimeProjectionClient.accept()` may replace Canvas and
semantic state.

An authenticated, structurally valid command that is definitively rejected with
`STALE_REVISION`, `MOVEMENT_BLOCKED`, or `DUPLICATE_COMMAND` receives the same bounded command result
shape: command/type/contract identity, `effect = rejected`, the typed error, and current player
revision. Authentication, framing, readiness, in-flight admission, unknown transport, and internal
failures remain transport-level typed errors and are never invented as domain results.

Movement remains disabled until that frame carries at least the acknowledged player revision. A
network-unknown or stale-revision result requests one resync without retrying the mutation. If a hub
read already in flight returns below the acknowledged revision, the page may request exactly one
follow-up full resync; a second low-revision frame remains visibly stale and cannot loop. A blocked
move is a typed no-effect result whose rejected idempotency outcome remains stable after later state
changes.

### 6. Keep the UI causal and accessible

The focusable map surface explains the W-A-S-D/arrow mapping and provides four labelled directional
buttons. Submitting, blocked, reconciling, accepted, and unavailable states are textually visible.
Reconnect never steals map focus. The pending gate, scope, revision, and socket attempt own late
callbacks: a late success after same-scope reconnect triggers a new read on the current socket, while
a changed-scope callback cannot change or resync the newer session.

## Alternatives considered

- **Browser key-repeat or animation timer:** rejected because client timing would decide mutation
  cadence.
- **Request-owned clock advance:** rejected because an input request cannot advance the world to make
  its own command succeed.
- **Movement command on WebSocket:** rejected because the accepted wire is projection/resync-only.
- **HTTP response snapshot:** rejected because it would add an unsequenced second projection ingress.
- **Default all-phase scheduler in CP-12:** deferred as a separate cross-game runtime increment.
- **Local prediction now:** deferred; a prediction ledger is unnecessary for one low-latency discrete
  command and would enlarge reconciliation risk.

## Consequences and limits

The first browser command proves server-owned position/fog mutation, strict local session ownership,
typed revision/idempotency handling, and authoritative Canvas reconciliation with no scheduler. It is
responsive for discrete local input but does not claim continuous Starve.io-style movement, 4-tile/s
browser feel, periodic snapshots, production identity, two independent sessions, hosted continuity,
WebMCP, or Re-entry.

The extra HTTP-to-resync round trip is accepted because it preserves one projection ingress and is
negligible in the local MVP proof. Latency or usability evidence may later justify the already-defined
continuous intent path together with the all-phase scheduler and measured publisher cadence.

The current local persistence boundary indexes retry outcomes by idempotency key and does not
globally reserve one `command_id` across a different key. The page creates fresh UUID identities, so
this does not invalidate the named single-client proof. A shared human/WebMCP mutation surface must
reopen the decision and either add a command ledger or define and test the exact reuse rule. The
inherited realtime connection/read queue also remains a local-fixture admission limit rather than a
public-load guarantee.

## Verification and reopen triggers

Verify strict no-cookie denial, scope isolation, exact envelope/bounds, distinct command and
idempotency identities, duplicate and blocked-rejection replay, stale outcomes, gateway ordering,
fog/event persistence, focusable-map repeat/modifier/IME/single-flight admission,
acknowledgement-to-resync ordering, one bounded causal follow-up read, same-scope late completion,
changed-scope rejection, authoritative revision reconciliation, and a real local browser readback.

Reopen this decision if the page needs held-key cadence, prediction, more than one command in flight,
a changed realtime message, a second projection source, a new identity issuer, a periodic publisher,
or any scheduler/world-clock change.

The completed local runtime result is [`SK-EVID-033`](../Evidence/SK-EVID-033-cp12-keyboard-movement-runtime-verification.md),
with the cross-functional disposition in [`Validation/53`](../Validation/53-cp12-keyboard-movement-runtime-cross-functional-audit.md).

Held-key and pointer presentation is separately accepted under
[`ADR-GAME-0035`](ADR-GAME-0035-cp12-snapshot-gated-held-movement.md); this ADR remains the authority
for each underlying discrete command and authoritative reconciliation.
