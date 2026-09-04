# SK-TASK-076: CP-14 Cloud Receiver v2 Game Adaptation

## Task Control

- Lifecycle state: `in_progress`
- Closure type: `integrated`
- Checkpoint: `CP-14`
- Owner: Project team for Game adaptation and outer cross-stack implementation under [`TASK-036`](../../../../Docs/Tasks/TASK-036-implement-standing-notification-handoff.md); Eyad owns final package publication and hosted deployment.
- Current increment: Local additive protocol-v0.2 standing transport, durable Game Event context, Receiver controls/handoff route, explicit Receiver `createApp({ standingRuntimeAdmissionAuthority })` composition seam, Host SDK standing export, Connector admission seam, and the worker-owned single-flight Game delivery runner are implemented with focused green checks; hosted composition and same-task runtime admission remain open.
- Next gate: Cross-stack conformance against the exact source-pinned artifacts, a server-only production binding/provider/publisher composition with an explicit remote wake policy, deployment composition that injects the real Receiver runtime authority, a legitimate same-task `admitNotification` adapter, and production wiring that can read the authenticated canonical Game page without transporting secrets.

## Identity

- Task ID: `SK-TASK-076`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: This increment crosses durable Game events and outbox state, signed external
  protocol fields, binding and Grant identity, two lease state machines, Agent activation, the
  human-effect boundary, and hosted/session assumptions. A false green could duplicate a wake,
  settle a stale lease, leak a credential, reuse revoked or wrong-scope authority, or claim a downstream effect
  from a `202` queue response.

## Objective

Adapt the Game's coalesced `CargoLostToMonster` Agent Signal to the accepted protocol-v0.2 standing
authorization so one informed Consent can govern repeated ordered signals without per-signal human
approval, while every signal still creates one bounded Cloud Delivery and Connector activation and
page action, Host effect, and acknowledgement remain separate authoritative steps.

## Success and non-goals

- Success: The exact Eddy implementation, package versions, endpoint, database, and test exchange are
  recorded and are not the retired v1 runtime or an undocumented alias.
- Success: A server-only continuation map resolves the Receiver `binding_id`, `correlation_id`,
  `workflow_id`, fixed `event_type`, `issuer_origin`, canonical URL, human boundary, standing Grant,
  last accepted sequence, and one-active limit for the Game player/shelter. No private binding,
  Connector token, organization key, or Host signing key reaches browser code, Agent context, logs,
  or committed fixtures.
- Success: Each Game signal maps to one canonical signed `webmcp.continuation_event`, with stable
  `event_id = signalId`, a durable positive contiguous `event_sequence`, an accepted `state_version`
  mapping, a durable occurrence timestamp, and the exact versioned accepted/duplicate/retryable/error
  behavior.
- Success: A valid `202` is recorded only as Receiver queue acceptance at the Game transport boundary.
  It does not claim Connector claim, Agent activation, page action, Host effect, or Cloud ACK.
- Success: Unknown transport results retry the same Event identity and meaning; duplicate and wrong
  scope cases are typed; Game publication leases never become Cloud delivery leases; no second queue,
  per-event Thread message, or hidden fallback is introduced.
- Success: A second distinct signal while the prior Receiver activation is non-terminal maps to
  retryable `activation_in_progress`; the Game retains/coalesces its durable slot and does not consume
  the next Event sequence or ask for another Consent decision.
- Success: One same-task trace reaches the strongest available boundary: Event queue acceptance at
  minimum, then qualified notification handoff and existing-task wake; page read, optional action,
  and ACK are separate claims and are recorded only when their owning authority provides evidence.
- Non-goals: Changing Game combat, cargo, coins, missions, current G2 signal eligibility, coalescing, cooldown,
  page tools, or command authority; publishing packages or deploying the Receiver; handling secret
  values or browser credentials; using the deprecated Cloud Receiver; implementing Connector claim/ACK
  in Game;
  automatically making `CargoDeposited` or an idle soldier eligible without a Game contract/ADR;
  or treating a local stub, historical test, or Codex process exit as live external evidence.

## Scope and authority

- In scope: the Game-side server transport/mapping behind
  [`src/server/reentry-delivery-port.ts`](../../src/server/reentry-delivery-port.ts), the smallest
  durable mapping metadata required for stable Event retries, focused Game-to-Receiver contract tests,
  and task/evidence/validation/status/runbook updates.
- Out of scope for this Game child: package publication, hosted deployment, secret values, `mvp/`,
  RightSpot, browser-held credentials, gameplay modules, and unrelated dirty files. The outer
  [`TASK-036`](../../../../Docs/Tasks/TASK-036-implement-standing-notification-handoff.md) owns the
  shared Core/SDK/Connector/Receiver implementation surfaces authorized by [`ADR-0049`](../../../../Docs/Decisions/ADR-0049-game-team-standing-integration-and-eyad-release.md).
- Allowed actions: edit the named Game source/tests/docs, consume the exact outer artifacts through
  their public contract, run focused Node 24 and cross-team tests, and commit only owned Game paths.
  Eyad's publication/deployment remains a separate release gate.
- Revalidate when: Eddy pushes or rebases the selected ref, package/API versions change, the Game
  signal or outbox contract changes, protocol-v0.2 standing scope/sequence/backpressure changes, the
  canonical page/session boundary changes, or an effect authority becomes available.

## Owning authority

- Game delivery policy: [`ADR-GAME-0009`](../Decisions/ADR-GAME-0009-reentry-delivery-and-thread-backpressure.md)
- Game contract: [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md), especially the Domain Event,
  Agent Signal, outbox, and `ContinuationDelivered` rules
- Game ordering: [`Chain C08`](../Mechanics/Chains/08-event-to-reentry-action.md)
- Existing local seam: [`SK-TASK-062`](SK-TASK-062-cp14-game-side-local-stub-delivery-port.md) and
  [`S14-A/S14-B`](../Engineering/10-cp13-cp18-implementation-seam-map.md)
- External protocol evidence: Eddy candidate `reentry-core/`, Host SDK/Local Connector sources, and
  `Docs/Cloud-Receiver-Handoff/v2-build/` at the exact handoff SHA supplied by Eddy
- Cross-functional preparation: [`Validation/89`](../Validation/89-cp14-cloud-receiver-v2-adaptation-cross-functional-audit.md)
- Outer standing-authority decision and evidence:
  [`ADR-0043`](../../../../Docs/Decisions/ADR-0043-adopt-standing-authorization-v0.2.md),
  [`TASK-033`](../../../../Docs/Tasks/TASK-033-build-standing-authorization-v0-2.md), and
  [`RECORE-007`](../../../../Docs/Development/RECORE-007-standing-authorization-v0.2-reference.md)

## Evidence status

- Verified: The Game has a durable schema-v9 signal slot/outbox plus additive `reentry_binding_sequence`
  and `reentry_event_context` tables, one pending or in-flight signal per shelter/binding, a
  60-world-second cooldown, a local wall-time publication lease, and a transport-neutral
  `ReentryDeliveryPort` with typed accepted/retryable/terminal outcomes.
- Verified: The candidate Core defines protocol `0.1`, signed Event ingress at
  `POST /v0.1/events`, target-scoped Connector claim at `POST /v0.1/delivery-claims`, explicit ACK at
  `POST /v0.1/delivery-acknowledgements`, a 60-second Cloud lease, three attempts, five-second poll/
  delivery defaults, and a fresh Codex activation that does not auto-ACK.
- Verified: The observed active Cloud Receiver v2 mainline is the separate public
  [`4xeoz/saas-boilerplate` commit `6b4826f68bb3634d004c49259d9c5311c660d997`](https://github.com/4xeoz/saas-boilerplate/tree/6b4826f68bb3634d004c49259d9c5311c660d997),
  dated 2026-09-03. Its commit metadata reports backend `56/56` and one Node 24 full-chain check, but
  those checks were not rerun from this Game checkout and production/publication gates remain open.
- Verified: The current active Receiver exposes account-first consent at
  `POST /v0.1/account-consent-decisions`; the local Host SDK still contains the older
  `/v0.1/consent-decisions` helper. The normal account-first flow can avoid that legacy helper by
  letting the Receiver consent page decide and the Host poll consent status, but the external owner
  must still declare the accepted public route in the handoff.
- Verified: The local Core package is `0.1.0`, the local Host SDK is `0.3.1`, and the local Connector
  is `0.2.20`, all on Node `>=24`. Live npm metadata also reports SDK `0.3.1` and Connector `0.2.20`,
  but equal version strings do not identify equal source behavior: the published SDK predates the
  local simple `createReentry()` facade, while the published Connector source predates the local
  instruction-bearing lease shape required by active Receiver v2.
- Verified: The local simple Host SDK facade hard-codes a generic workflow, `workflow.ready`, state
  version `0`, a random workflow identity, a five-minute offer, and a nominal thirty-minute Grant.
  It is not a safe Game integration surface. The advanced SDK surface can express the Game's stable
  workflow, approved event type, causal version, canonical URL, and human boundary.
- Verified: The current Connector is outbound-only and claims at most one delivery per run. Its
  default adapter starts a new `codex exec` session, explicitly does not resume another session,
  instructs that process to open the canonical page, and does not automatically obtain Host-effect
  proof or ACK the lease. The instruction is not proof that a Browser, authenticated Game session,
  or page-bound WebMCP runtime was actually acquired.
- Verified: The v0.1 Event body and the Game signal envelope are different contracts; Cloud `202`
  means accepted and queued only; v0.1 Grant runs are limited to one; and the candidate's old Cloud
  runtime is deprecated.
- Verified: ADR-0043 accepts additive protocol v0.2 standing authorization. RECORE-007 passes the
  Node 24 Core proof with one Consent, two sequential effect-acknowledged signals, retryable
  one-active backpressure, exact replay, SQLite restart, and revocation rejecting a third signal.
  That local reference does not prove the active external Receiver, SDK, Connector, Game, or Agent.
- Verified: The active Receiver currently implements its consent, Grant, Event, delivery, and ACK
  state machines independently rather than consuming `reentry-core` as a runtime dependency. This
  can be interoperable only through exact-version conformance evidence; matching names and protocol
  version strings are insufficient.
- Inferred: The smallest compatible target is a server-only protocol-v0.2 Host Event transport behind
  the existing Game port, with `event_id = signalId`, a durable per-binding sequence, a
  Receiver-owned standing binding map, explicit queue-acceptance wording, and one active Delivery.
  The first external trace may begin with one `CargoLostToMonster` signal but must then prove a second
  signal under the same Consent before claiming standing integration.
- Inferred: The CP-17 deployment stream is useful but does not automatically solve Re-entry. It can
  supply a stable HTTPS origin, canonical page, durable Game identity, and ordinary player session;
  CP-14 must still prove how the exact Connector-started Agent acquires an authorized page context
  without receiving a cookie, bearer token, Connector credential, or lease secret in its prompt.
- Unknown: Whether Eyad will publish/deploy the exact reviewed Receiver and package artifacts; the
  production binding/session map; the effective consent/Grant expiry policy; a supported same-task
  Browser/session path; a structured adapter result channel; and a production/test Host-effect
  authority.

### Local implementation increment (2026-09-04)

The Game-side standing transport is now implemented locally under the outer ownership decision in
[`ADR-0049`](../../../../Docs/Decisions/ADR-0049-game-team-standing-integration-and-eyad-release.md):

- `src/server/standing-reentry-transport.ts` validates the public binding, resolves only a
  server-side Grant map, checks the selected eligible Event cursor, persists a stable per-binding
  sequence and canonical timestamp, and publishes the exact standing Event input through an injected
  Host SDK boundary.
- `src/server/persistence/schema.ts`, `types.ts`, and `store.ts` add schema `9` / `cp14-001` for
  replay-safe Event context. `ReentryDeliveryPort` records `receiver_queue_accepted` without
  claiming Connector lease, notification handoff, Agent wake, WebMCP, effect, or ACK.
- `src/server/reentry-delivery-runner.ts` and `src/server/entrypoint.ts` add the one process-owned
  delivery driver: startup and completed world boundaries request a coalesced wake, 100 ms
  interpolation ticks are ignored, only one `pumpOnce` is in flight, errors remain observable, and
  shutdown drains the runner before worker/store close. The runner does not create a queue/timer or
  settle any downstream boundary.
- `saas-boilerplate/backend/src/app.ts` now exposes the Receiver's runtime admission authority as an
  explicit server-side composition option. The default app keeps the authority absent and therefore
  fails closed; the option validates the required `verifyAdmission` method before attaching it to
  `app.locals` for the handoff controller.
- `tests/cp14-standing-reentry-transport.test.ts` covers two ordered signals under one binding,
  response-loss retry with unchanged sequence, binding/scope/occurrence rejection, and migration
  readback. The named focused Game checks are green on Node 24.

This is local source evidence with an intentionally strict claim ceiling. The runner is not yet
constructed with a live Receiver origin, production binding/provider/publisher, Connector process,
same-task runtime, Browser, WebMCP, or Host-effect authority until the outer conformance and hosted
gates pass. The Receiver option is only a wiring seam; no runtime authority is fabricated locally.
A remote HTTP poll on every 100 ms world tick is explicitly out of scope until a bounded wake policy
is selected.

## Cross-stack observation and adaptation register

This section records the current observations, their decision consequence, and a feasible adaptation.
It does not itself accept a contract change. Any row that changes Game identity, outbox semantics,
page-tool authority, hosted admission, or the human boundary requires the named decision gate before
code.

| Observation | Failure if ignored | Feasible adaptation | Recommended disposition |
|---|---|---|---|
| The Game `ReentrySignalEnvelope` is a rich internal publication envelope; both protocol v0.1 and v0.2 accept a strict signed Event with no arbitrary Game payload. | Direct serialization will fail validation or create an undocumented protocol fork. | Add a server-only mapper that persists the exact canonical Event body and signature inputs. Keep rich causal data in the Game; the Agent rereads it from the canonical page. | Required. Never POST the Game envelope directly. |
| `opaqueBinding` is a Game/session routing value, while Receiver `binding_id` identifies an approved Consent/Grant binding. | Copying the value can route the wrong player, leak internal scope, or reuse revoked, expired, or wrong-scope authority. | Persist a server-only map keyed by stable Game player/shelter/workflow identity to the Receiver-issued binding and Grant metadata. | Required. No binding value is accepted from browser or Agent input. |
| The Game has no Re-entry Manifest enrollment path. | A later signed Event would have no Receiver-owned consent, target, or valid Grant. | Use the advanced Host SDK on the Game server to register the Host key, create the exact signed Manifest, open a Receiver consent session, poll status, and persist only the approved public binding map. | Required before live Event ingress. Do not use the generic simple facade. |
| Cloud `202` means Event accepted and queued; the current Game transport `accepted` settles publication and appends `ContinuationDelivered`. | Queue acceptance may be misreported as Connector claim, Agent activation, Game effect, or Cloud ACK. | Let `202` settle only the Game publication attempt, but persist and present the receipt as `receiver_queue_accepted`. If `ContinuationDelivered` cannot truthfully carry that narrow meaning, record an ADR and add a distinct acceptance state/event before code. | Prefer an explicit Receiver-acceptance receipt; never use `ContinuationDelivered` as downstream proof. |
| Game cooldown allows later signals; v0.1 exhausts the Grant after one Event, while ADR-0043 accepts a non-consumable v0.2 standing Grant. | Keeping the old recommendation would either require consent fatigue or publish later signals under exhausted authority. | Target protocol v0.2, persist one standing binding plus last accepted sequence, allow one non-terminal activation, and retain/coalesce a signal on retryable `activation_in_progress`. | Standing target accepted. Keep v0.1 only as a clearly labelled one-shot compatibility probe, never the recurring product path. |
| The Game publication lease and Receiver delivery lease are different state machines and clocks. | A stale Game worker or Game-side Cloud claim could duplicate activation or settle the wrong owner. | Keep `ReentryDeliveryPort` responsible only for Game publication. Receiver and Connector exclusively own claim, lease token, attempt count, expiry, and ACK. | Preserve strict separation; never pass a Cloud lease token through Game code or page tools. |
| The local SDK and npm SDK share `0.3.1` but expose different practical integration surfaces. | An install from npm can compile without the assumed facade or behave differently from the audited checkout. | Integrate against an owner-declared artifact with package name, semantic version, Git SHA, tarball integrity, exports, Node floor, and contract-test command. Publish a new version for changed behavior rather than reusing `0.3.1`. | Use the advanced API and exact provenance. Do not accept version-only handoff. |
| The local and published Connector share `0.2.20`, but the published provenance predates the active v2 `continuation.instruction` lease. | A nominally correct install can reject a valid active-v2 lease as `connector_response_invalid`. | Require a corrected uniquely versioned Connector release or an explicitly pinned audited Git artifact before Game-to-Connector evidence. | Treat current npm `0.2.20` as incompatible with the observed active-v2 lease until proven otherwise. |
| The active Receiver uses account-first consent while the SDK exposes a legacy decision helper. | Guessing an alias creates two consent authorities and breaks interoperability. | The user decides through the Receiver account consent page; the Host creates and polls the consent session. Remove the legacy helper from the Game path and contract-test the selected route. | Recommended normal flow; external owner confirmation remains mandatory. |
| Receiver expiry is the earliest applicable session, offer, or requested Grant expiry; the simple SDK facade requests a thirty-minute Grant under a five-minute offer. | The apparent thirty-minute Grant may effectively expire after about five minutes, causing nondeterministic demo failures. | Choose one explicit effective first-slice expiry, expose it in consent/status, and assert it in cross-repo tests. Do not infer validity from the requested Grant timestamp alone. | Align and test effective expiry before the live trace. |
| Game documents historically describe a bound existing Thread; the current compatibility adapter starts a fresh `codex exec`. | The implementation can lose managed context, Browser attachment, authentication, and the promised continuation experience. | Require a private Adapter that admits the notification to the already bound task and returns the strict runtime attestation. | Same-task activation is selected and mandatory; fresh-session execution remains compatibility preview only and cannot close CP-14. |
| A Connector prompt tells Codex to open the canonical page, but the fresh process has no proven Browser or production Game session. | The run can stop unauthenticated, use the wrong player, or tempt an unsafe credential-in-prompt workaround. | First test whether the supported adapter can use an already authenticated local Browser profile without transporting secrets. If not, stop and design a dedicated short-lived, audience-bound Agent admission mechanism with the CP-17 owner; never put session credentials in the Event, lease instruction, URL, or prompt. | Treat this as an early kill test and CP-17/CP-14 join gate. |
| Default Connector dispatch does not automatically return a structured effect receipt or ACK. | Codex process exit or natural-language success can falsely close the delivery; unacknowledged work may be reclaimed up to the attempt limit. | Either stop first-slice evidence at activation/page action, or add a separately owned structured adapter-result contract plus a Game-issued, Receiver-verifiable effect receipt bound to the Event, action, and resulting revision. | Stop at the strongest honest boundary until effect authority and structured return are proven. |
| Active Receiver state machines are implemented separately from Core. | Route, expiry, signature, duplicate, and error behavior can drift even when both sides say protocol `0.1`. | Pin exact source and run shared positive/negative conformance vectors against Core and the deployed Receiver. A later upstream task may consolidate implementation, but Game adaptation must not modify external source. | Conformance is a handoff gate; upstream refactor is not a Game task. |

## Recommended first compatibility profile

The recommended protocol-v0.2 compatibility profile is deliberately bounded:

1. one Game player, one shelter, one stable workflow, one paired Connector target, one informed
   Consent, one standing Grant, and one fixed `CargoLostToMonster` Agent-signal type;
2. advanced Host SDK usage on the Game server with an exact pinned artifact and server-only Host key;
3. `event_id = signalId`, a persisted contiguous `event_sequence`, fixed approved `event_type`,
   durable ISO `occurred_at`, owner-approved causal `state_version`, and no extra Event payload;
4. at most one non-terminal Receiver activation for the standing Grant; a second signal receives
   retryable backpressure and remains in the Game's existing coalescing/outbox boundary;
5. one durable Game receipt named and evidenced as Receiver queue acceptance per accepted signal,
   separate from Connector claim, Agent activation, page action, Host effect, and ACK;
6. Connector delivery to the already bound task through the qualified Adapter only if the supported
   Browser and authenticated page-context kill test passes without moving credentials into prompts
   or URLs; a fresh session is not a fallback;
7. one fresh `inspect_shelter_state` read before any conditional `force_recall_soldier` invocation;
8. activation-only or page-action evidence unless a structured adapter result and independent
   Host-effect authority are actually available; and
9. no compatibility alias, second queue, hidden retry, direct Thread message, per-signal Consent,
   parallel activation, or fallback to fixture identity.

This profile is recommended because RECORE-007 falsifies the Core authority risk while keeping each
activation bounded. It does not pretend that the active external Receiver, SDK, Connector, Game, or
Agent already implements v0.2. A v0.1 one-shot trace may still test today's endpoint, but it cannot
satisfy the recurring product requirement or close this task.

## Owner decision packet for the next discussion

The following decisions must be explicit. The recommendation is recorded so discussion can focus on
trade-offs rather than rediscovering the problem.

1. **Queue receipt semantics.** Recommended: a distinct durable `receiver_queue_accepted` meaning that
   may settle Game publication but cannot satisfy Agent delivery or effect claims. Alternative: retain
   `ContinuationDelivered` only after an ADR narrows its meaning and every UI/evidence consumer is
   audited for misleading language.
2. **Grant lifecycle.** Decided by outer ADR-0043: one Consent creates one standing Grant; ordered
   signals do not consume it, one-active backpressure bounds execution, and revoke/expiry/scope
   change ends future authority. A v0.1 one-shot trace is compatibility evidence only.
3. **Activation target.** Selected: a qualified Adapter admits the notification to the already bound
   existing task and proves safe-turn activation. A fresh Codex session remains a compatibility
   preview and cannot satisfy the selected product claim.
4. **Host SDK surface.** Recommended: advanced SDK only, with Game-owned stable workflow and causal
   fields. Do not adopt the generic `createReentry()` facade unless a later version makes every
   hard-coded value explicit and passes the Game contract tests.
5. **Agent authentication.** Recommended: first attempt supported reuse of an already authenticated
   local Browser profile, with no credential transport. If unavailable, stop for a jointly reviewed
   Agent-admission design; do not place Clerk, Game, Connector, or lease secrets in signed Event data,
   canonical URLs, prompts, page-tool inputs, or committed fixtures.
6. **ACK boundary.** Recommended: keep Cloud ACK outside the first integration claim unless the
   Connector obtains a structured result and the Game/Host effect authority verifies the exact Event,
   action, idempotency identity, and resulting revision. A successful Codex process is never enough.
7. **Artifact policy.** Recommended: exact Git SHA plus immutable package integrity for development,
   followed by uniquely versioned SDK/Connector releases before hosted closure. Same semantic version
   with different behavior is a stop condition.
8. **Receiver/Core relationship.** Recommended: require conformance tests now; consider upstream code
   consolidation separately. Game code must adapt only to the accepted public contract, not reach into
   Receiver internals.

## Parallel CP-17 deployment workstream handoff

The independent deployment workstream is useful and should continue in parallel. This task does not
take ownership of [`SK-TASK-077`](SK-TASK-077-cp17-host-decision-and-deployment-preflight.md), its
hosting decisions, or the current collaborator-owned
[`SK-TASK-078`](SK-TASK-078-cp17-production-identity-and-hosted-admission.md) draft. Until that draft is
integrated by its owner, it is bounded working context rather than canonical completion evidence.

Work that can proceed before hosted deployment:

- owner decisions on queue semantics, same-task session/admission scope, SDK surface, and ACK claim; standing Grant
  lifecycle is already decided by ADR-0043;
- exact artifact/source handoff and Core/Receiver conformance checks;
- server-only Event mapping design and focused contract tests against a disposable Receiver database;
- local proof that no secret or Cloud lease crosses into browser, Agent prompt, or Game page tools.

CP-17 must eventually supply to CP-14:

- one stable HTTPS origin and exact canonical Game page path;
- production player/shelter/world identity resolution and ordinary authenticated page behavior;
- world readiness, durable store, restart, and canonical URL evidence at the level actually claimed;
- an explicit answer on whether the supported Agent can reuse an authenticated local Browser context;
  and
- a reviewed secret-configuration boundary for Host signing material and Receiver endpoint settings,
  without committing or exposing those values.

CP-14 must supply back to CP-17:

- the accepted Receiver origin and consent opener requirements;
- the server-only binding/Grant map and Event publisher configuration contract;
- the exact page route and identity scope required by the continuation;
- the supported activation and claim limit; and
- any later Host-effect verification endpoint or receipt contract, without transferring Connector
  credentials or delivery lease tokens into the Game.

The streams join only when the exact hosted URL, ordinary player identity, Agent session acquisition,
Receiver binding, and claim wording refer to the same player/shelter/workflow. A hosted Game does not
prove Re-entry, and a queued Event does not prove hosted page access.

## Contract mapping to settle before code

| Game value or boundary | Protocol-v0.2 Receiver value | Required decision |
|---|---|---|
| `signalId` | `event_id` | Use the same stable identifier across retries and duplicate `202` responses. |
| persisted per-binding signal order | `event_sequence` | Allocate one positive contiguous sequence durably; retryable backpressure does not consume it. |
| `opaqueBinding` | `binding_id` | Do not copy the Game value; resolve a server-side Receiver binding/Grant map. |
| `latestEventType` / `CargoLostToMonster` | Grant-fixed `event_type` | Proposed first value is `CargoLostToMonster`; Eddy and the Game owner must accept it. |
| `boundedAction = force_recall_soldier` | Lease `instruction` and page action | Put only approved instruction in the Grant; the Event carries no undocumented payload. |
| `cursorEnd` | `state_version` | Proposed mapping is `cursorEnd` as the page-read causal version; record it as distinct from mission revision. |
| Game `worldTime` | `occurred_at` | Do not convert units by guess. Capture one server ISO timestamp durably for the signal or approve a minimal mapping field. |
| Game canonical page/session | `canonical_url` and Agent activation context | Use the exact hosted origin/path and an explicit session acquisition boundary; fixture cookies are not production identity. |
| Game local accepted outcome | Cloud `202` acceptance | It may settle only Game publication if `ContinuationDelivered` is explicitly queue acceptance; it never means claim, activation, effect, or ACK. |
| Game publication lease | Cloud claim lease | Keep them separate. Game never calls claim/ACK or handles Connector tokens. |
| Game cooldown/reissue | standing Grant plus one-active reservation | Do not re-consent per signal. Retain/coalesce while activation is open; accept the next sequence only after ACK or explicit terminal release. |

## Required handoff gate

No live or hosted integration Red run is valid until the release handoff supplies:

1. exact v2 Receiver commit, package path, clean status, endpoint/origin, TLS profile, and database
   migration/test command;
2. exact Host SDK, Core, and Local Connector package versions and Node requirement;
3. one accepted Consent decision route, status/effective-status/revocation rules, standing binding
   shape, effective expiry/renewal, target binding, sequence, and one-active release policy;
4. Event signature bytes, canonical fields, timestamp limits, status/error envelopes, duplicate
   rules, and proof that ingress does not contact the Connector;
5. claim/lease/attempt/expiry/target-scope rules, exact 204 response, and the Connector polling/
   activation behavior;
6. the canonical Game URL and an authorized same-task session/admission path that contains no
   Connector or lease secret;
7. independent effect-authority ownership, context contract, ACK status/error behavior, or an
   explicit activation-only evidence boundary; and
8. executable cross-team tests against the exact handler and disposable durable database, with
   redacted output and restart/concurrency coverage.

If the packet names `runtime/cloud-receiver/`, an absent path, a guessed route, a compatibility alias,
or a historical local-only result, return it to the release owner and leave this task in progress.

## Smallest reversible action

Record the exact handoff packet, rerun [`Validation/89`](../Validation/89-cp14-cloud-receiver-v2-adaptation-cross-functional-audit.md),
and accept the mapping table before widening the local adapter. The first local mapping is now
implemented under `TASK-036`; if a mapping changes the meaning of
`ContinuationDelivered`, adds a new Game status/schema, expands signal eligibility beyond current
G2 `CargoLostToMonster`, or adds a new effect authority, create or update an `ADR-GAME-*` first.
Outer ADR-0043 already owns the standing Grant model. Preserve the local port as the Game publication
boundary while the exact cross-layer handoff and same-task adapter remain open.

## Implementation route

1. **Handoff intake:** compare exact refs, package exports, routes, and test environment. Stop on any
   source or contract contradiction.
2. **Server-only mapping:** persist the approved Receiver continuation map and stable Event context;
   keep it out of browser snapshots, page tools, Agent prompts except the approved instruction, and
   logs.
3. **Red/Green:** the local standing transport and durable context tests now cover first acceptance,
   duplicate identity, timeout/unknown, wrong binding/Grant, revoked/expired binding, cursor and
   occurrence rejection, and no-gameplay-mutation cases. The next Red must target the exact
   source-pinned Receiver HTTP exchange, not a guessed endpoint.
4. **Publisher boundary:** keep the typed Event publisher behind the existing Game port and use the
   Host SDK signer or exact equivalent; never hand-build a divergent signature or route.
5. **Refactor:** preserve stable Event identity, durable timestamp/context, no hidden retry, exact
   error mapping, secret redaction, and the separation between Game publication and Cloud claim/ACK.
6. **Trace:** run two real `CargoLostToMonster` signal cycles under one Consent and the same bound
   task. Prove queue acceptance first; add one-active backpressure, Connector claim, qualified
   notification handoff, existing-task wake, page read, bounded recall, and (only when independently
   authorized) effect ACK. A fresh activation cannot substitute for same-task evidence.
7. **Closure:** record exact commits, runtime/database, event/signal IDs, durable transitions,
   expected/actual response shapes, skipped gates, and the highest supported claim. Update status,
   seam map, evidence, and validation without rewriting prior local-stub evidence.

## TDD and verification budget

- Red–Green–Refactor is mandatory for the new adapter. A Red caused by a missing endpoint, missing
  credential, or guessed route is a harness failure, not a valid contract Red.
- Minimum focused verification: Game adapter unit/contract tests, delivery-runner lifecycle tests,
  existing CP-14 signal policy and local port suites, typecheck, exact Eddy Event contract tests, and
  documentation validators.
- Add claim/lease/ACK and independent-browser tests only when their exact counterpart and authority
  are present; do not run unrelated full aggregates to manufacture confidence.
- Minimum evidence is ladder level 2 for the adapter contract. A real Event-to-Connector trace is
  level 4/5 depending on page and session coverage; hosted closure is level 7 and remains separate.

## Stop and recovery

Stop before code or trace if any path requires a deprecated runtime, absent package, guessed Consent
route, second queue, per-event Thread message, hidden retry, v0.1 reuse for recurring behavior,
non-durable Event sequence/signature context, browser-held credential, Game-issued effect token, or a
Codex-process-success-to-ACK shortcut. A transport timeout remains unknown/retryable; it is never
converted to success.

If the handoff changes, preserve this task as in progress, update the validation audit, and create the
smallest new decision/task needed. Do not alter Eddy-owned source or external state to make the
adapter fit.

## Verification and closure target

- Minimum verification: exact handoff/source readback, focused Red–Green–Refactor adapter tests,
  affected Game CP-14/CP-16 regressions, exact external Event contract tests, Node 24 typecheck,
  documentation self-tests, repository validator, and `git diff --check`.
- Closure target: `integrated` only after one exact-version Event-to-Receiver trace and all claimed
  downstream boundaries have their own evidence. If only local composition or queue acceptance is
  available, retain the task in progress; do not close as live Re-entry.
- Rollback or remediation: revert only Task076-owned Game source/tests/records if the mapping is
  falsified; preserve domain events, local signal history, and Eddy refs. If a schema/semantic change
  is required, use an ADR and migration plan before implementation.
- Reopen trigger: any duplicate signal, wrong binding/target, stale lease settlement, Event-body or
  sequence drift, secret exposure, standing-scope expansion, parallel activation, changed
  route/package/endpoint, missing page session, effect-authority mismatch, or evidence claim above
  the actual boundary.
