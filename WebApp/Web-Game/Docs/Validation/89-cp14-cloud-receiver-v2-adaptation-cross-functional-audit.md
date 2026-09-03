# CP-14 Cloud Receiver v2 Game Adaptation Cross-Functional Audit

**Status:** PRE-IMPLEMENTATION AUDIT; EXTERNAL HANDOFF GATE OPEN  
**Date:** 2026-09-03  
**Task:** [`SK-TASK-076`](../Tasks/SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)  
**Game contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)  
**Game delivery policy:** [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)  
**Game seam:** [`S14-A/S14-B`](../Engineering/10-cp13-cp18-implementation-seam-map.md)  
**External source refs:** `origin/codex/reentry-main-candidate-preview@aa31159a2e6b17fd4702560dc624347bb3633591`, `origin/codex/eyad-reentry-core-foundation@77c9cbcd7d2dbb71ba62308c0b3a5e0e47805dac`

## Audit question

Can the current Sleepless Kingdom game-side signal and outbox safely bind to Eddy's Cloud Receiver
v2 and Local Connector protocol, and what must be true before the first adapter implementation or
live CP-14 trace is admitted?

## Evidence boundary

This is a ladder-level `1` static, cross-functional audit. It reads the current Game source and
documents, the two fetched Eddy refs, and their v2 handoff/Core source. It does not check out or
mutate an Eddy ref, run the external service, claim a Connector lease, start a Codex session, invoke
WebMCP, use credentials, deploy, or prove a hosted or judge path. The external refs are source
evidence only; the owner has not supplied an accepted clean v2 handoff packet for this Game.

## Source identity and current state

### Game

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`.
- Game root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`.
- Current local `main`: `ef4fafc`; current `origin/main`: `928debc`.
- The Game subtree is clean in the current worktree. Existing RightSpot and research changes are
  outside this audit and remain untouched.
- Current persistence contract is schema version `8`, migration `cp06-004`, event version `1`, and
  contract `SK-MVP-0.2`.
- The Game has no `runtime/cloud-receiver/`, `runtime/local-connector/`, Host SDK, or production
  identity module. Its external boundary is still a labelled local stub.

### Eddy refs

- `origin/codex/eyad-reentry-core-foundation@77c9cbc` is a Stage-1 loopback shell with a Host SDK
  preview. It has no complete Local Connector pairing/claim/effect handoff and is not a CP-14
  integration tip.
- `origin/codex/reentry-main-candidate-preview@aa31159` contains the v0.1 Core contracts,
  `runtime/local-connector/`, `runtime/host-sdk/`, deprecated `runtime/cloud-receiver/`, and the
  v2 handoff documents. Its documents describe `saas-boilerplate/` as the v2 implementation base,
  but that path is absent from this ref. The ref therefore cannot be treated as a runnable v2
  Receiver checkout.
- [`ADR-0032`](../../../../Docs/Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md) on the
  candidate ref retires `runtime/cloud-receiver/`; it must not be used as a compatibility fallback.
- The external test records are valuable contract evidence, but their local commits, databases,
  deployment identity, effect authority, and clean counterpart SHAs are not an accepted Game
  handoff.

## Component ownership and intended flow

The responsibilities are separate and must remain separate in the Game adapter:

```text
Game domain transition
  -> durable CargoLostToMonster event
  -> one coalesced Game Agent Signal and outbox row
  -> Game Host-side signed Event publisher
  -> Cloud Receiver POST /v0.1/events (verify + durable queue, HTTP 202)
  -> Local Connector outbound poll /v0.1/delivery-claims (lease)
  -> fresh Codex exec activation reads the canonical Game page
  -> independent Host effect authority verifies the bounded effect
  -> Local Connector POST /v0.1/delivery-acknowledgements
```

The Game owns the first two steps and the Host-side publisher. Eddy owns Receiver authorization,
Grant/target state, delivery leases, Connector polling, activation dispatch, and acknowledgement.
The Host effect authority is a separate trusted boundary. The Game must never become a Connector,
send Connector credentials to the browser, or infer a successful effect from a Codex process exit.

## Verified Eddy v2 protocol contract

The following is the contract read from the candidate's `reentry-core/`, `runtime/host-sdk/`,
`runtime/local-connector/`, and `Docs/Cloud-Receiver-Handoff/v2-build/` sources. It is a baseline to
review with Eddy, not an authorization to guess unresolved routes.

### Pairing, consent, and target

| Boundary | Contract | Game implication |
|---|---|---|
| Account pairing | `POST /v0.1/account/pairing-sessions` creates a short-lived pairing code; `POST /v0.1/account/pairing-sessions/claim` exchanges it for one Connector credential and fixed delivery target. | Setup is a user/Connector concern. Game stores no Connector token and does not perform claim. |
| Host key | Host backend registers an Ed25519 public key through `POST /v0.1/host-keys` using an organization API key. | The Game server owns the private signing key; the browser and Event body never receive it. |
| Consent session | Host backend creates `POST /v0.1/consent-sessions` with signed Manifest and `host_subject_ref`; approved status returns a Receiver-owned binding to the authenticated Host server. | Game must persist only a server-side opaque mapping from player/shelter/workflow to the approved binding. |
| Account decision route | Handoff documents use account-first `POST /v0.1/account-consent-decisions`, while the Host SDK constant uses `POST /v0.1/consent-decisions` for an older control path. | This route is unresolved. No alias or fallback may be implemented. |
| Target rule | One v0.1 Host subject binds permanently to one Connector delivery target; another target is a conflict. | A Game player/shelter cannot silently move to another Connector. |

The public binding has exactly the application-neutral shape:

```text
type: webmcp.reentry_binding
protocol_version: 0.1
binding_id, correlation_id, workflow_id, event_type, expires_at,
runs_remaining (0 or 1), status
```

The Core rejects `max_runs` above one. The first accepted Event consumes the one Grant run. Grant
expiry, revocation, and exhaustion are derived authority facts, not local Game cooldowns.

### Signed Host Event ingress

The Host server posts one outer JSON object to `POST /v0.1/events`:

```json
{
  "body": "<canonical JSON continuation event>",
  "headers": {
    "WebMCP-Reentry-Key-Id": "<host key id>",
    "WebMCP-Reentry-Timestamp": "<epoch seconds>",
    "WebMCP-Reentry-Signature": "<base64url Ed25519 signature>"
  }
}
```

The signature covers the exact UTF-8 bytes `<timestamp>.<body>`. The canonical event body has
exactly the application-neutral fields:

```text
type: webmcp.continuation_event
protocol_version: 0.1
event_id, correlation_id, binding_id, issuer_origin,
workflow_id, event_type, event_sequence: 1, state_version,
occurred_at, canonical_url
```

Validation order is body and canonical JSON, key lookup, timestamp/signature, binding and Grant
state, sequence/state, event-id deduplication, then one atomic Event plus one pending Delivery. A
valid first request returns `202` with `accepted: true, duplicate: false`; an exact event replay
returns `202` with `duplicate: true`. Neither response means a Connector claim, Agent activation,
effect, or acknowledgement. Connector availability must not affect Event acceptance.

### Connector claim and lease

The Local Connector is outbound-only. It posts JSON to `POST /v0.1/delivery-claims`:

```json
{
  "connector_token": "<opaque connector token>",
  "claim_token": "<32-byte unpadded base64url token>"
}
```

The client uses HTTPS (or literal loopback HTTP for testing), `credentials: omit`, `redirect:
manual`, `Cache-Control: no-store`, no Authorization header, and no automatic retry. Work returns
`200` with one target-scoped lease; no work and exhausted work return an empty `204` with no
`Content-Type`. The current profile is maximum three attempts, a sixty-second lease, five-second
polling, and a five-second delivery request timeout. A live same-token replay returns the same lease
with `duplicate: true`.

### Activation and acknowledgement

`LocalConnector.runOnce()` claims at most one lease and dispatches a fresh `codex exec` session. The
adapter receives the validated continuation and receipt but no Connector, claim/lease, effect, or
private binding secret. The current adapter explicitly opens the canonical page, reads current
state, prepares a safe next step, and stops before the human boundary. It does not resume an
existing Codex Thread and it does not automatically ACK.

Only `POST /v0.1/delivery-acknowledgements` can close a delivery:

```json
{
  "connector_token": "<opaque connector token>",
  "delivery_id": "<delivery id>",
  "lease_token": "<current lease token>",
  "effect_token": "<opaque Host-effect token>"
}
```

The Receiver asks an independent effect authority to verify the exact delivery, Event, correlation,
workflow, canonical URL, human boundary, outcome, and bounded confirmation time. A valid authority
attestation atomically moves `LEASED -> ACKNOWLEDGED`; an exact replay is duplicate-safe. Missing
authority is a visible `501 host_effect_authority_unavailable`. Adapter success or process exit is
never an acknowledgement shortcut.

### Transport and operations

The v2 handoff requires hosted HTTPS, bounded JSON/no-store responses, no redirects, request limit
`16 KiB`, response limit `32 KiB`, stable `{error:{code}}` failures, and `/healthz` plus `/readyz`
with durable database readiness. Logs may contain route/status/event/delivery/attempt/code but not
tokens, cookies, private bindings, API keys, or connection strings.

## Current Game contract

The Game's current `ReentryDeliveryPort` and persistence authority are already coherent for a local
transport-neutral boundary:

| Game surface | Current behavior |
|---|---|
| Signal eligibility | Only `CargoLostToMonster` creates a G2 signal; local fixture supplies `opaqueBinding`, a fixture `grantId`, and `force_recall_soldier`. |
| Coalescing | One pending or in-flight slot per shelter/binding; later eligible events merge or defer; 60 world-second cooldown is Game policy. |
| Signal envelope | `contractVersion`, world/shelter, opaque binding, signal/grant/action, cursor range/count/types/severity, and latest event/time. |
| Outbox lease | Game-owned wall-time lease in `outbox_delivery`; candidate selection is deterministic and durable. |
| Transport outcome | `accepted`, `retryable(code)`, or `terminal(code)`; accepted settles the Game outbox and appends one `ContinuationDelivered`. |
| Gameplay | Transport outcomes never alter world time, soldier, mission, cargo, coin, or page state. |
| Page command | `force_recall_soldier` is server-authoritative, signal/revision/idempotency checked, and requires a fresh canonical-page read before action. |
| Session | Current fixture uses `sk_local_fixture` cookie and bootstrap handles; it is not a production identity or Agent session handoff. |

## Cross-functional contract matrix

| Concern | Game today | Eddy v2 | Safe adaptation rule |
|---|---|---|---|
| Trigger | `CargoLostToMonster` Domain Event and one coalesced signal | Signed `webmcp.continuation_event` | Preserve Game event history and emit at most one Event for the active slot. |
| Stable identity | `signalId` is reused for local retry | `event_id` is deduplicated | Use `event_id = signalId`; persist the mapped body/context so an unknown timeout retries the same Event identity and meaning. |
| Signal payload | Rich bounded summary including cursors and latest event | Event body has no payload field | Do not stuff Game summary into an undocumented field. The Agent reads page history; summary remains Game-side evidence/dashboard state. |
| Binding | `opaqueBinding` is a Game/session binding | Receiver `binding_id` is a consent/Grant binding | Resolve the Receiver binding server-side; never serialize the Game opaque value as `binding_id` without an accepted mapping. |
| Grant | Fixture-like ID can be reused after Game cooldown | v0.1 Grant is one-run and becomes exhausted after accepted Event | First integration is one approved Grant/one signal. A later signal requires re-consent/rearm; never reuse an exhausted binding. |
| Event type/action | `latestEventType = CargoLostToMonster`; action is `force_recall_soldier` | Event type fixed by approved binding; instruction is later in lease | Proposed default is Grant/Event type `CargoLostToMonster` with `force_recall_soldier` in Host-approved instruction; Eddy must accept before code. |
| Workflow | No workflow ID in Game signal | Required `workflow_id`, canonical URL, human boundary | Store a server-side approved continuation map; do not derive a public workflow or URL from a browser request. |
| State version | Monotonic `cursorEnd` is available | Nonnegative `state_version` required | Proposed mapping is `state_version = cursorEnd`, after contract acceptance; document that it is a causal page-read version, not a mission revision. |
| Occurrence time | Game stores authoritative `worldTime`; signal record has no ISO occurrence time | `occurred_at` is canonical ISO timestamp and must be stable | Capture one server-side ISO timestamp at first signal publication and persist it with the mapping, or add an explicitly approved minimal field. Never convert world seconds by guess. |
| Queue acceptance | Local `accepted` means transport accepted and settles Game outbox | `202` means Event accepted and queued only | The adapter may map `202` to the Game transport `accepted` only if `ContinuationDelivered` is documented as Receiver queue acceptance. It must never be reported as claim, activation, effect, or ACK. If that meaning is rejected, create a new ADR/state before code. |
| Leases | Game publication lease uses wall time and `leaseId` | Receiver delivery lease uses claim token and 60 seconds | Game owns only its publication lease. Connector owns the Cloud lease. Do not claim or settle Cloud leases from Game. |
| Retry | Local port retries transport exceptions with same signal | SDK/Connector clients do not hide retries; Event dedup is by ID | Retry only the same Event ID/body after an unknown result; surface stable errors; never create a second queue or silently switch route. |
| Acknowledgement | Game local port appends `ContinuationDelivered` | Cloud ACK requires independent effect token | Do not issue Cloud ACK from Game or from Codex exit. A separate effect-authority task is required for full-chain closure. |
| Identity/session | Fixture cookie resolves player/shelter | Fresh Connector Codex process has no automatic Game cookie | Hosted canonical URL, Agent session acquisition, and scope handoff must be explicitly designed and tested before activation proof. |
| Source/deployment | Game local process is runnable | Candidate v2 target path is absent; old runtime is deprecated | Require owner-declared exact Receiver SHA/package/endpoint/database/test command. Do not use deprecated v1 or an undocumented alias. |

## Findings and disposition

| Severity | Finding | Consequence | Required disposition |
|---|---|---|---|
| P0 | No owner-declared exact v2 Receiver checkout, package path, endpoint, database, or clean counterpart SHA is available; candidate points to an absent `saas-boilerplate` path. | A local test could target the wrong implementation or deprecated runtime and falsely close CP-14. | Keep the task pending until Eddy supplies the handoff packet and exact test environment. |
| P0 | Cloud `202` is queue acceptance, while downstream claim/activation/effect/ACK are separate state machines. | Treating `202` as final Agent delivery would make the demo claim false and could settle the wrong authority. | Name the Game result `receiver queue accepted` in the adapter/evidence and retain the Cloud lifecycle separately. |
| P0 | Cloud ACK requires a trusted effect authority; the default Connector adapter has none. | Codex process success cannot close the delivery. | Keep full ACK/hosted closure open; require a separately owned effect authority or stop the trace at activation with an explicit claim limit. |
| P1 | Game envelope and Cloud Event schemas differ substantially. | Direct JSON serialization omits signature, binding, workflow, event type, sequence, state version, time, and canonical URL. | Add a server-only typed mapping layer with no undocumented payload fields. |
| P1 | Game publication lease and Cloud delivery lease are different leases. | A double claim/ACK path can produce duplicate work or stale settlement. | Keep `ReentryDeliveryPort` as the Game publication boundary; never call Cloud claim/ACK from it. |
| P1 | Game local cooldown allows later signals, while Cloud v0.1 Grant is one-run. | A second local signal would be rejected or incorrectly reuse an exhausted Grant. | Scope the first external slice to one approved signal; require re-consent/rearm for recurrence. |
| P1 | `opaqueBinding` and fixture cookie are not Receiver binding or production identity. | Serializing them as public binding data would leak scope or route an event to the wrong target. | Resolve and persist a server-only binding map; keep browser and logs opaque. |
| P1 | Game has no persisted ISO `occurred_at`, workflow, canonical URL, or Agent session handoff. | Retries could change signed event meaning, or a fresh Codex process could open an unauthenticated page. | Define durable mapping metadata and the hosted/session boundary before runtime proof. |
| P1 | Consent route differs between handoff documents and the Host SDK constant. | Guessing an alias would create a protocol fork and invalidate interoperability. | Ask Eddy to declare one accepted public route; do not add fallback. |
| P1 | Candidate source includes a deprecated Cloud runtime and no v2 deployment proof. | Passing historical tests can be mistaken for production availability. | Use only the owner-declared v2 implementation and record source/runtime/database identity in evidence. |

## Recommended adapter shape

The smallest safe shape is a server-side `CloudReceiverEventTransport` behind the existing Game
`ReentryDeliveryPort`:

1. Keep the Game Domain Event, signal coalescing, local outbox lease, and page action unchanged.
2. Resolve one approved Receiver continuation record on the server. It contains the public
   `binding_id`, `correlation_id`, `workflow_id`, `event_type`, `issuer_origin`, canonical URL,
   human boundary, and a one-shot Grant reference. It never enters browser code or logs.
3. Map one Game envelope to the exact Host SDK event. The proposed first-slice mapping is:

   ```text
   event_id       = signalId
   correlation_id = approved Receiver Grant correlation_id
   binding_id     = approved Receiver binding_id
   issuer_origin  = exact hosted Game origin
   workflow_id    = approved workflow identifier
   event_type     = approved Grant type, proposed CargoLostToMonster
   event_sequence = 1
   state_version  = cursorEnd, only after explicit acceptance
   occurred_at    = one persisted server ISO timestamp for this signal
   canonical_url  = exact hosted canonical Game page URL
   ```

4. Use the Host SDK/server signer to create the canonical Event and post `/v0.1/events`. Map only a
   valid `202` acceptance to the Game transport's `accepted` outcome, and record that this is
   Receiver queue acceptance. An exact duplicate `202` is idempotent and must not create another
   signal or Grant run.
5. Let the Receiver and Local Connector own the downstream claim lease, fresh Codex activation,
   retry bound, and effect ACK. The Game does not poll `/v0.1/delivery-claims` and never submits an
   effect token.
6. If the existing `ContinuationDelivered` name cannot legally mean queue acceptance, stop before
   implementation and create an ADR plus a minimal explicit `receiver_event_accepted` state/event.
   Do not silently reinterpret the existing event or create a second pending queue.

This shape is intentionally one-shot for the first G2 external trace. It preserves the real-time
world and the accepted signal backpressure policy while avoiding a new queue, a Thread message per
event, or a direct Game-to-Connector shortcut.

## Required Eddy handoff packet

Before any Green implementation, the external owner must provide all of the following in one
versioned handoff:

- exact Receiver implementation SHA, clean package path, and whether the tested service is a new v2
  implementation rather than deprecated `runtime/cloud-receiver`;
- exact Host SDK and Local Connector package versions/paths, Node requirement, and compatible Core
  version;
- canonical local/hosted Receiver origin, TLS profile, `/healthz` and `/readyz` behavior, database
  engine/migration command, and disposable test database setup;
- exact public consent decision route and status/revocation behavior;
- Host key, Manifest, binding/Grant, event type, one-run/rearm, signature, and canonical URL rules;
- exact Event `202`/duplicate/error envelopes and the no-Connector-contact guarantee;
- claim/lease/retry/expiry/target-scope behavior and the 204 empty response requirements;
- active Connector polling and fresh Codex activation behavior, including the Game page session path;
- independent effect-authority contract and ACK evidence, or an explicit activation-only claim limit;
- the executable cross-team contract tests and their exact source/database/runtime identity; and
- secret custody, redacted logging, restart behavior, and rollback/stop conditions.

## Implementation and verification route

1. **Handoff intake:** record the packet and re-run this audit against the exact tip. If any route,
   schema, authority, or source identity differs, stop and record the decision.
2. **Mapping decision:** accept the one-shot `CargoLostToMonster` mapping, `cursorEnd` state version,
   persisted occurrence time, canonical URL, session boundary, and queue-acceptance meaning. Create
   an ADR first if the existing Game event/status semantics change.
3. **Red:** run a focused contract test against the exact Receiver HTTP handler or hosted test
   environment. It must fail because the Game adapter is absent, not because the endpoint or
   credentials are guessed.
4. **Green:** implement only the server-side typed Event transport and durable mapping needed for
   one signal. Preserve the existing local port tests and no-gameplay-mutation behavior.
5. **Refactor:** keep canonical signing, stable Event identity, no hidden retry, secret-free logs,
   explicit queue acceptance, and separate Cloud lease/ACK ownership while the focused matrix stays
   green.
6. **Trace:** prove one fresh `CargoLostToMonster` signal through Event `202`, Connector claim,
   activation, page read, and (only if the independent authority exists) ACK. Record every boundary
   and stop at the strongest actually proven point.
7. **Closure:** update task, status, seam map, evidence, and validation records. Do not call a local
   stub, historical candidate, or adapter process exit live Receiver/Connector/Agent evidence.

## Stop conditions

Stop before code or trace if any path requires a deprecated runtime, an absent package, a guessed
route, browser-held credentials, Connector claim from Game, a second queue, one Event per raw
simulation event, a hidden retry, an exhausted Grant reuse, a non-durable occurrence timestamp, an
effect token derived from Codex exit, or a fresh Codex page without an explicit authorized session.

## Audit decision

1. The overall topology is compatible in direction: Game can act as a Host and send signed Events;
   Eddy's Connector can poll and activate independently.
2. The current Game port is not wire-compatible by direct serialization. A typed server-only mapping
   and an exact external handoff are required.
3. The first external slice should be one approved Grant and one `CargoLostToMonster` Event. It may
   use the existing Game `accepted` outcome only with an explicit queue-acceptance claim boundary;
   downstream ACK remains separate.
4. `SK-TASK-076` is registered as pending. No Game code, dependency, branch, deployment, or external
   service was changed by this audit.

## Reopen triggers

Reopen this audit and the task when Eddy pushes or rebases a ref, the Receiver package/endpoint or
consent route changes, the Game signal/outbox/contract changes, a Grant is made multi-run, a session
handoff is added, an effect authority becomes available, or any runtime result contradicts the
queue/lease/activation/ACK separation above.
