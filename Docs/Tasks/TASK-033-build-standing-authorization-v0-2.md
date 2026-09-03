# TASK-033: Build Standing Authorization v0.2

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `implementation`
- Lifecycle: `verification_pending`
- Priority: `P0`
- Owner: Re-entry Core, Host SDK, Cloud Receiver v2, Local Connector, and Sleepless Kingdom
  integration owners.
- Current increment: The application-neutral chain and additive active Receiver kernel are locally
  verified; TASK-028 now owns the committed-source pin gate, while this task prepares the exact
  same-user Consent/inspection/revocation contract without exposing unaccepted routes.
- Next gate: Active v2's reviewed PostgreSQL migration and real Express routes pass Consent once ->
  signal 1 -> acknowledged effect -> signal 2 -> acknowledged effect -> restart -> revoke -> signal
  3 rejected, using the same pinned normative scenario and explicit same-user controls.
- Dependencies: ADR-0042 through ADR-0045; TASK-027 for effective lifetime and display policy;
  TASK-028 for active-v2 independent-Receiver conformance; TASK-029 for the real Host-effect
  acknowledgement composition; and the selected Host's own integration contract and tests.

## 1. Problem and objective

Protocol v0.1 deliberately equates one Consent decision with one private Grant, one accepted Event,
and one activation run. That contract is correct for a single future continuation, but it cannot
support a long-running Host such as Sleepless Kingdom, where authoritative business transitions can
repeatedly make new Agent work useful. Requiring a new human Consent decision after every soldier
returns would turn Re-entry into a repeated approval dialog rather than durable website-Agent
coordination.

The objective is to add an explicit protocol-v0.2 mode in which one informed Consent decision creates
one scoped, non-consumable standing authorization. The authorization survives individual Events,
Agent turns, browser closure, Connector restarts, and Receiver restarts until it is revoked, expires,
or its approved scope changes. Each accepted signal still creates only one short-lived activation
reservation and one Delivery; persistent authorization must not become persistent execution.

## 2. Verified current observations

### Re-entry Core v0.1

- ADR-0007 freezes `max_runs = 1` and one bounded Event.
- `reentry-core/src/protocol.mjs` accepts only protocol `0.1`, requires Manifest `max_runs` to equal
  one, and requires `event_sequence` to equal one.
- `ReceiverCore.acceptEvent()` consumes the Grant run in the same transaction that records the Event
  and creates a pending Delivery.
- The SQLite reference schema and store model one Event and one Delivery per Grant. This is a real
  persistence constraint, not only wording in the SDK.

### Active Cloud Receiver v2

- The retained v0.1 Receiver independently implements the one-run shape with
  `runsRemaining`, one Event per Grant, and one Delivery per Grant. The `Re-Entry` working tree
  adds separate standing tables and services without changing those v0.1 constraints.
- Exact-source preflight resolves active main to `6b4826f68bb3634d004c49259d9c5311c660d997`;
  `0d7bc3c` is its ancestor and the backend is unchanged between them. TASK-028 owns the verified
  additive-table, locking, migration, middleware, and release-gate plan.
- Its durable subject binding, Grant revocation, delivery lease, acknowledgement, and replay
  boundaries are useful foundations, but they do not make repeated activation possible.
- The active Receiver is exact-source external work. This task does not silently modify or deploy
  that repository; TASK-028 and a separately reviewed implementation increment control adoption.

### Local Connector and Agent Adapter

- The Local Connector already has a bounded long-running claim loop, so repeated Deliveries do not
  require a new inbound transport or a permanently open browser.
- The Core Connector client now selects exact v0.1 or v0.2 routes, validates standing receipts and
  positive sequences, rejects downgrade, and carries explicit retryability. The Agent Adapter
  preserves v0.2 identity for one credential-free activation.
- The current-checkout Codex exec result echoes the activation version, but pairing/saved credentials
  do not select v0.2 and the CLI default plus published package remain v0.1-shaped.
- The current Codex adapter starts a fresh local Agent session per activation. Standing
  authorization therefore proves repeated coordinated re-entry, not same-thread model memory.

### Host SDK

- The additive low-level `StandingReentryHostSdk` now signs v0.2 Manifests and repeatable Events. It
  requires caller-persisted Event ID, sequence, occurrence time, and workflow state; it does not hide
  a sequence counter in process memory.
- The simple facade still exposes `request -> confirm -> trigger`, optimized for one Event. A normal
  v0.2 facade still needs a persisted enrollment handle and repeatable signal operation without
  asking the browser to retain organization credentials, signing keys, or the private Grant.

### Sleepless Kingdom

- A soldier completing collection, depositing cargo, and becoming idle is an authoritative domain
  transition that may make new dispatch work useful, but it is an illustrative future signal rather
  than the Game's currently accepted first integration event.
- The game already has a durable business-event/outbox direction and strict command-side ownership,
  revision, and idempotency checks.
- Raw high-frequency domain events should not each force an Agent activation. The Host should
  project them into one coalesced, durable Agent signal such as `idle_soldier_available`, and the
  canonical page must remain authoritative for how many soldiers are idle now.
- The first Game proof remains the already governed `CargoLostToMonster` signal under
  `SK-TASK-076`. Adopting `idle_soldier_available` requires a separate Game contract/ADR and is not
  implied by this protocol decision.
- The current page integration and signal slot are still one-shot-shaped and require a selected-Host
  contract change before Game implementation.

## 3. Accepted target contract

ADR-0043 owns the durable choice. This task implements and verifies these consequences:

1. **Consent is not an Event budget.** One Receiver-owned human decision creates one standing
   authorization for one visible scope. Event acceptance does not consume that authorization.
2. **The authorization is persistent, not literally unconstrained.** It remains valid until explicit
   revocation, effective expiry, issuer/security invalidation, or a material scope change. Normal
   Host state and artifact revisions do not require re-consent. The Grant pins the exact consented
   Host key; another trusted key for the same origin cannot exercise it without a new Consent or an
   accepted audited rotation path.
3. **One signal creates one bounded activation.** At most one non-terminal activation may exist for
   an authorization in the first profile.
4. **Backpressure is explicit.** A new signal arriving while an activation is non-terminal receives a
   retryable `activation_in_progress` outcome. It is not recorded and does not consume its sequence.
5. **Sequence and replay are separate.** `event_id` owns exact idempotent replay. A per-authorization
   positive, contiguous `event_sequence` orders newly accepted signals. Exact accepted replay returns
   prior truth; conflicting identity or sequence reuse fails.
6. **Queue acceptance is not completion.** Event accepted, Delivery pending, lease claimed, adapter
   dispatched, Host effect observed, and Delivery acknowledged remain separate facts.
7. **Revocation fences future authority.** It blocks new Events and new or reclaimed leases after the
   revocation commit. It preserves audit history and cannot retract an activation already delivered
   to an external Agent. The UI must state this in-flight limitation.
8. **The Event remains data-minimal.** It carries identifiers, sequence, state version, time, and
   canonical URL, not a prompt, arbitrary payload, tool plan, resource list, or credentials. The
   Host-visible approval contains only the public binding; the private receipt remains in the
   Receiver-owned Delivery path.
9. **The page remains current truth.** Every activation opens the canonical page, revalidates Host
   identity and state, and discovers the tools valid now. Agent memory is optional and never the
   authority source.
10. **v0.1 stays frozen.** v0.2 is additive. Existing v0.1 vectors, one-shot consumers, and rejection
    behavior must remain unchanged.

## 3.1 Adaptation plan by surface

| Surface | Required v0.2 adaptation | First proof | Deferred boundary |
|---|---|---|---|
| Manifest/protocol | Add explicit standing mode, bounded signal type, one-active limit, durable lifetime, and sequence greater than one | strict parser/signature vectors plus v0.1 regression | multiple signal types or concurrent activations |
| Receiver Core | Keep authorization live; atomically reserve one activation and next sequence; separate active-work state from Grant lifetime | two sequential accepted signals and one blocked concurrent signal | distributed serialization and production scale |
| SQLite reference | Remove one-Event/one-Delivery-per-Grant assumption for v0.2; add ordered uniqueness and one-open-activation constraint | close/reopen and rollback tests | active-v2 PostgreSQL migration |
| Low-level Host signer | Issue v0.2 Manifest and repeatable signed Events from caller-persisted identity, sequence, time, and workflow snapshots | strict signer tests plus exact canonical retry | enrollment, control routes, and Host persistence |
| Normal Host facade and Receiver control | Enroll once, persist an opaque standing handle, poll status, and expose same-user inspect/revoke without holding authority in the browser | active-Receiver contract test with one Consent and no second decision | selected-Host storage and renewal UX |
| Cloud Receiver v2 | Add versioned routes/model migration and account control without weakening v0.1 | external conformance suite against exact reviewed source | deployment and data migration authorization |
| Local Connector | Accept repeated v0.2 Deliveries using the existing outbound loop and preserve activation identity | two claim/dispatch/ack cycles | same-thread Agent continuation |
| Agent Adapter | Treat every Delivery as one bounded activation; never infer standing authority | credential-free activation validation | supported external Browser/Agent runtime |
| Sleepless Kingdom | Map the governed Game outbox into one approved coalesced Agent signal and expose current authoritative state/tools on the canonical page | two real `CargoLostToMonster` signals use one Consent and produce two sequential bounded activations | `idle_soldier_available`, additional signal types, or automatic consequential commands without a Game contract and selected human boundary |

## 3.2 First falsifiable implementation increment

The first increment is deliberately smaller than full product adaptation:

1. create one valid v0.2 Manifest and one Consent challenge;
2. approve it once and persist one standing authorization;
3. accept signal sequence 1 and create exactly one pending Delivery;
4. reject a distinct signal sequence 2 while the first activation is still non-terminal, without
   persisting or consuming it;
5. claim, verify one correlated Host effect, and acknowledge the first Delivery;
6. accept the same sequence-2 signal without another Consent decision and create exactly one second
   Delivery;
7. acknowledge the second Delivery;
8. revoke the authorization;
9. reject sequence 3 and create no Delivery;
10. after close/reopen, preserve both accepted Events, both acknowledgements, the last accepted
    sequence, and revocation;
11. preserve exact replay of previously accepted Events without creating another Delivery; and
12. run the full v0.1 Core suite unchanged.

This proves the authority model. It does not yet prove the active external Receiver, a real Agent,
WebMCP acquisition, Game behavior, or production operation.

## 3.3 Current implementation evidence

The first increment is complete at `locally_verified` reference scope:

- strict additive protocol-v0.2 values are implemented in
  `reentry-core/src/standing-protocol.mjs`;
- Consent, standing Grant, ordered signal, one-active reservation, lease, effect acknowledgement,
  inspection, replay, and revocation are implemented in
  `reentry-core/src/standing-authorization-core.mjs`;
- SQLite schema version 6 retains separate `receiver_standing_*` tables and pins each new standing
  Grant to the consented Host key ID and SHA-256 SPKI public-key fingerprint. Additive migration
  preserves older preview rows but security-disables legacy Grants without material evidence and
  requires fresh Consent; frozen v0.1 tables and their one-Grant/one-Event constraints are unchanged;
- `reentry-core/test/standing-authorization.test.mjs` proves all twelve steps above against a
  file-backed store, including close/reopen, one approved Consent decision across both signals, and
  duplicate/conflicting decision fencing; and
- `standing-host-sdk.mjs`, explicit `/v0.2` HTTP routes, the version-selected Connector client, and
  the dual-version Agent Adapter now form an additive application-neutral transport slice;
- `conformance/standing-v0.2/scenario.mjs` fixes the expected implementation-neutral trace, and
  `standing-cross-layer.test.mjs` passes it through a real loopback HTTP server, SQLite reopen, two
  Connector claims, two Agent dispatches, two deterministic effect acknowledgements, inspection,
  revocation, historical replay, exact public approval shape, same-origin wrong-Host-key rejection,
  and same-ID material rebinding rejection. Consent and control remain direct injected reference
  authorities rather than production shell routes, so this is not TASK-028 active-v2 black-box
  closure; and
- on Node `v24.20.0`, the complete Core `npm run verify` passed syntax, `112/112` tests, unchanged v0.1
  conformance, and package verification with zero runtime dependencies. The current-checkout Local
  Connector verification passed `49` executed tests with `12` external active-v2 tests explicitly
  skipped because their exact external source/database were not supplied.

Repository validators and task-scope secret scanning passed. The full repository secret scanner
still reports 21 existing Game evidence/Task artifact filenames as OpenAI-key patterns; read-only
classification confirmed `.sqlite` or `.png` basenames in seven unchanged files. No scanner
weakening, Game-document edit, or whole-repository security-scan pass is claimed.

[`RECORE-007`](../Development/RECORE-007-standing-authorization-v0.2-reference.md) owns exact
reference implementation evidence and its non-claims. The active Receiver now has a locally verified
`Re-Entry` working-tree kernel, additive PostgreSQL migration, and real Event/claim/ACK transport.
Its 154-test backend aggregate and shared scenario pass are recorded in the
[Receiver verification record](../../saas-boilerplate/backend/conformance/standing-v0.2/README.md).
This is not pinned release conformance: Consent/control remain internal seams, effect authority is
deterministic, and the shared source is uncommitted. TASK-028 owns exact-source integration.
The normal Host facade, product Connector version selection, published Connector, Sleepless Kingdom,
supported Agent/Browser, and deployment remain open.

The subsequent CLOUD-023 source-owner review reran Core verification at `153/153` tests,
with 20 new deterministic post-writer-lock time/authority regressions and 21 shared-oracle
response-contract tests. This supplements, rather than rewrites, the historical `112/112`
RECORE-007 result. The standing shared corpus is still a minimum sequential trace: complete
concurrent race, forced multi-row rollback/no-mutation, and fresh-process crash vectors remain
open. Active-Receiver-specific suites and synthetic oracle tests do not close those shared gates.

The [control-plane proposal](../../saas-boilerplate/backend/src/modules/standing/CONTROL-PLANE-PROPOSAL.md)
records candidate shell routes, same-user/session/CSRF boundaries, durable decision replay,
page-token lifetime, and acceptance tests. It is a proposal, not an accepted API. TASK-027 must
resolve effective lifetime and renewal before public enrollment is enabled; no new routes, automatic
renewal, target transfer, or existing-Grant extension is authorized by the proposal.

## 3.4 Safety, reliability, and abuse controls

- The initial profile allows one active activation per authorization. There is no unlimited Agent
  fan-out merely because the Grant is standing.
- Receiver-side rate and quota policy remains required in addition to Host-side signal coalescing.
- A Host outbox retries explicit retryable outcomes and preserves the same `event_id` and sequence;
  it must not mint new identities to bypass backpressure.
- A terminal Delivery releases the active slot but remains an observable failure; it is not rewritten
  as success. The next signal may recover by reading current page state.
- Scope changes requiring a new Consent decision include issuer origin, Host key ID/material, canonical workflow/URL,
  signal type, consented instruction/reason, human boundary, subject, or delivery target. Ordinary
  game-state changes do not.
- Credential rotation that preserves the same authenticated authority may use an audited rebind;
  authority transfer to a different subject or target is a scope change.
- Expiry and renewal UX remains owned by TASK-027. Standing means non-consumable across Events, not
  invisible or irrevocable forever.
- Revocation must be prominent and idempotent. A stronger guarantee that cancels an already-running
  Agent before Host mutation would require a live pre-effect authorization check and is outside this
  increment.

## 4. Non-goals

- changing, weakening, or silently reinterpreting protocol v0.1;
- using a very large `max_runs` value as a substitute for standing authorization;
- keeping a browser tab, HTTP request, WebSocket, or Agent process permanently open;
- treating Connector polling, adapter return, or Agent narration as Host-effect proof;
- sending raw Game domain payloads, prompts, resources, or tool plans through Events;
- activating once for every high-frequency Game event without coalescing;
- selecting automatic combat, purchases, irreversible resource spending, or another human boundary;
- proving same-Agent-session memory or a supported external Agent runtime;
- changing or deploying the active external Cloud Receiver without its own exact-source gate; or
- committing, pushing, publishing, or deploying merely because this task is registered.

## 5. Verification and closure

Move to `verification_pending` only when the first durable reference slice and all v0.1 regressions
pass on Node 24 and the canonical mechanism documents name the implemented and still-open surfaces
accurately.

Close only when:

- the versioned protocol and migration strategy are accepted and mechanically validated;
- Core and durable-store tests prove repeated sequential activation, backpressure, replay,
  revocation ordering, rollback, and restart;
- Host SDK, active Cloud Receiver v2, and Local Connector pass one exact-source two-signal chain;
- Sleepless Kingdom passes one real domain-event -> coalesced signal -> canonical-page re-entry ->
  authorized command/effect -> acknowledgement -> next-signal cycle;
- the user can inspect and revoke the standing authorization;
- the selected human boundary and in-flight revocation limitation are visible; and
- current-status and evidence records distinguish local, separate-process, deployed, and supported
  runtime truth.

## 6. Reopen condition

Stop the current increment if preserving v0.1 requires destructive migration, if the active-v2
verification evidence forces ADR-0044 to reopen or changes the implementation owner, if a second
in-flight signal cannot be fenced atomically, or if Game integration would bypass current Host
authorization.

Reopen after closure if the selected application requires multiple signal types in one
authorization, parallel activations, stronger in-flight cancellation, target migration without
re-consent, offline backlog semantics beyond coalescing, or measured capacity requires a different
reservation model.
