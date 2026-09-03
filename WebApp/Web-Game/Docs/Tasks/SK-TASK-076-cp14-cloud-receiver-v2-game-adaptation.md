# SK-TASK-076: CP-14 Cloud Receiver v2 Game Adaptation

## Task Control

- Lifecycle state: `pending`
- Closure type: `integrated`
- Checkpoint: `CP-14`
- Owner: Game owner, with Eddy as external Receiver/Connector handoff owner
- Current increment: The read-only cross-stack audit now records the observed active Receiver mainline, local and published SDK/Connector provenance, protocol and lifecycle mismatches, feasible adaptation choices, and the separate CP-17 deployment handoff. No Game or external runtime implementation is authorized by this record.
- Next gate: The Game owner accepts the decision packet in this task, the external Receiver/Connector owner confirms one exact installable handoff, and the CP-17 owner supplies the canonical URL and Agent-session contract required for any activation claim beyond queue acceptance.

## Identity

- Task ID: `SK-TASK-076`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: This increment crosses durable Game events and outbox state, signed external
  protocol fields, binding and Grant identity, two lease state machines, Agent activation, the
  human-effect boundary, and hosted/session assumptions. A false green could duplicate a wake,
  settle a stale lease, leak a credential, reuse an exhausted Grant, or claim a downstream effect
  from a `202` queue response.

## Objective

Adapt the Game's coalesced `CargoLostToMonster` Agent Signal to Eddy's exact Cloud Receiver v2 Host
Event ingress so one approved signal can be accepted and queued durably, while Cloud delivery,
Connector activation, page action, and effect acknowledgement remain separate authoritative steps.

## Success and non-goals

- Success: The exact Eddy implementation, package versions, endpoint, database, and test exchange are
  recorded and are not the retired v1 runtime or an undocumented alias.
- Success: A server-only continuation map resolves the Receiver `binding_id`, `correlation_id`,
  `workflow_id`, fixed `event_type`, `issuer_origin`, canonical URL, human boundary, and one-shot
  Grant for the Game player/shelter. No private binding, Connector token, organization key, or Host
  signing key reaches browser code, Agent context, logs, or committed fixtures.
- Success: One Game signal maps to one canonical signed `webmcp.continuation_event`, with stable
  `event_id = signalId`, `event_sequence = 1`, an accepted `state_version` mapping, a durable
  occurrence timestamp, and the exact `/v0.1/events` `202`/duplicate/error behavior.
- Success: A valid `202` is recorded only as Receiver queue acceptance at the Game transport boundary.
  It does not claim Connector claim, Agent activation, page action, Host effect, or Cloud ACK.
- Success: Unknown transport results retry the same Event identity and meaning; duplicate and wrong
  scope cases are typed; Game publication leases never become Cloud delivery leases; no second queue,
  per-event Thread message, or hidden fallback is introduced.
- Success: One fresh trace reaches the strongest available boundary: Event queue acceptance at
  minimum, then Connector claim and fresh activation, and finally ACK only when an independent Host
  effect authority verifies the bounded Game action.
- Non-goals: Changing Game combat, cargo, coins, missions, signal eligibility, coalescing, cooldown,
  page tools, or command authority; modifying Eddy's `runtime/`, `reentry-core/`, deployment, or
  credentials; using the deprecated Cloud Receiver; implementing Connector claim/ACK in Game;
  redesigning recurring Grants; or treating a local stub, historical test, or Codex process exit as
  live external evidence.

## Scope and authority

- In scope: the Game-side server transport/mapping behind
  [`src/server/reentry-delivery-port.ts`](../../src/server/reentry-delivery-port.ts), the smallest
  durable mapping metadata required for stable Event retries, focused Game-to-Receiver contract tests,
  and task/evidence/validation/status/runbook updates.
- Out of scope: Eddy-owned Cloud Receiver, Local Connector, Host SDK, `reentry-core/`, `mvp/`,
  RightSpot, external Vercel/Supabase/PostgreSQL state, browser-held credentials, gameplay modules,
  and unrelated dirty files.
- Allowed actions: read the exact handoff, edit named Game source/tests/docs after the handoff gate,
  run focused Node 24 and cross-team contract tests, and commit only owned Game paths. Push, deploy,
  external writes, and branch integration require a separate explicit owner decision.
- Revalidate when: Eddy pushes or rebases the selected ref, package/API versions change, the Game
  signal or outbox contract changes, a Grant becomes multi-run, the canonical page/session boundary
  changes, or an effect authority becomes available.

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

## Evidence status

- Verified: The Game has a durable schema-v8 signal slot/outbox, one pending or in-flight signal per
  shelter/binding, a 60-world-second cooldown, a local wall-time publication lease, and a
  transport-neutral `ReentryDeliveryPort` with typed accepted/retryable/terminal outcomes.
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
- Verified: The active Receiver currently implements its consent, Grant, Event, delivery, and ACK
  state machines independently rather than consuming `reentry-core` as a runtime dependency. This
  can be interoperable only through exact-version conformance evidence; matching names and protocol
  version strings are insufficient.
- Inferred: The smallest compatible shape is a server-only Host Event transport behind the existing
  Game port, with `event_id = signalId`, a Receiver-owned binding map, and explicit queue-acceptance
  claim wording. The first external slice should be one approved Grant and one
  `CargoLostToMonster` event.
- Inferred: The CP-17 deployment stream is useful but does not automatically solve Re-entry. It can
  supply a stable HTTPS origin, canonical page, durable Game identity, and ordinary player session;
  CP-14 must still prove how the exact Connector-started Agent acquires an authorized page context
  without receiving a cookie, bearer token, Connector credential, or lease secret in its prompt.
- Unknown: Whether the external owner designates the observed Receiver commit as the Game handoff;
  the exact installable SDK/Core/Connector artifacts and hashes; the production binding/session map;
  the accepted Game `state_version`/`occurred_at` mapping; the effective consent/Grant expiry policy;
  a supported fresh-Codex Browser/session path; a structured adapter result channel; and a
  production/test Host-effect authority.

## Cross-stack observation and adaptation register

This section records the current observations, their decision consequence, and a feasible adaptation.
It does not itself accept a contract change. Any row that changes Game identity, outbox semantics,
page-tool authority, hosted admission, or the human boundary requires the named decision gate before
code.

| Observation | Failure if ignored | Feasible adaptation | Recommended disposition |
|---|---|---|---|
| The Game `ReentrySignalEnvelope` is a rich internal publication envelope; protocol v0.1 accepts a strict signed Event with no arbitrary Game payload. | Direct serialization will fail validation or create an undocumented protocol fork. | Add a server-only mapper that persists the exact canonical Event body and signature inputs. Keep rich causal data in the Game; the Agent rereads it from the canonical page. | Required. Never POST the Game envelope directly. |
| `opaqueBinding` is a Game/session routing value, while Receiver `binding_id` identifies an approved consent/Grant binding. | Copying the value can route the wrong player, leak internal scope, or reuse an exhausted Grant. | Persist a server-only map keyed by stable Game player/shelter/workflow identity to the Receiver-issued binding and Grant metadata. | Required. No binding value is accepted from browser or Agent input. |
| The Game has no Re-entry Manifest enrollment path. | A later signed Event would have no Receiver-owned consent, target, or valid Grant. | Use the advanced Host SDK on the Game server to register the Host key, create the exact signed Manifest, open a Receiver consent session, poll status, and persist only the approved public binding map. | Required before live Event ingress. Do not use the generic simple facade. |
| Cloud `202` means Event accepted and queued; the current Game transport `accepted` settles publication and appends `ContinuationDelivered`. | Queue acceptance may be misreported as Connector claim, Agent activation, Game effect, or Cloud ACK. | Let `202` settle only the Game publication attempt, but persist and present the receipt as `receiver_queue_accepted`. If `ContinuationDelivered` cannot truthfully carry that narrow meaning, record an ADR and add a distinct acceptance state/event before code. | Prefer an explicit Receiver-acceptance receipt; never use `ContinuationDelivered` as downstream proof. |
| Game cooldown allows a later signal; v0.1 Grant has `max_runs = 1` and is exhausted by the first accepted Event. | A second signal can be published under an exhausted Grant or silently disappear. | Limit the first slice to one approved Grant and one signal. Define re-consent/rearm as a visible later workflow; recurring or multi-run Grants require an outer protocol decision. | One-shot first. No local Grant reuse. |
| The Game publication lease and Receiver delivery lease are different state machines and clocks. | A stale Game worker or Game-side Cloud claim could duplicate activation or settle the wrong owner. | Keep `ReentryDeliveryPort` responsible only for Game publication. Receiver and Connector exclusively own claim, lease token, attempt count, expiry, and ACK. | Preserve strict separation; never pass a Cloud lease token through Game code or page tools. |
| The local SDK and npm SDK share `0.3.1` but expose different practical integration surfaces. | An install from npm can compile without the assumed facade or behave differently from the audited checkout. | Integrate against an owner-declared artifact with package name, semantic version, Git SHA, tarball integrity, exports, Node floor, and contract-test command. Publish a new version for changed behavior rather than reusing `0.3.1`. | Use the advanced API and exact provenance. Do not accept version-only handoff. |
| The local and published Connector share `0.2.20`, but the published provenance predates the active v2 `continuation.instruction` lease. | A nominally correct install can reject a valid active-v2 lease as `connector_response_invalid`. | Require a corrected uniquely versioned Connector release or an explicitly pinned audited Git artifact before Game-to-Connector evidence. | Treat current npm `0.2.20` as incompatible with the observed active-v2 lease until proven otherwise. |
| The active Receiver uses account-first consent while the SDK exposes a legacy decision helper. | Guessing an alias creates two consent authorities and breaks interoperability. | The user decides through the Receiver account consent page; the Host creates and polls the consent session. Remove the legacy helper from the Game path and contract-test the selected route. | Recommended normal flow; external owner confirmation remains mandatory. |
| Receiver expiry is the earliest applicable session, offer, or requested Grant expiry; the simple SDK facade requests a thirty-minute Grant under a five-minute offer. | The apparent thirty-minute Grant may effectively expire after about five minutes, causing nondeterministic demo failures. | Choose one explicit effective first-slice expiry, expose it in consent/status, and assert it in cross-repo tests. Do not infer validity from the requested Grant timestamp alone. | Align and test effective expiry before the live trace. |
| Game documents historically describe a bound existing Thread; the actual Connector adapter starts a fresh `codex exec`. | The implementation can lose managed context, Browser attachment, authentication, and the promised continuation experience. | Choose one architecture explicitly: accept a fresh session for v0.1 and update the Game contract/claims, or require a separate managed-context adapter that can target an existing task and prove safe-boundary activation. | Recommend fresh-session v0.1 for the smallest current-compatible slice; same-task activation is a separate capability task. |
| A Connector prompt tells Codex to open the canonical page, but the fresh process has no proven Browser or production Game session. | The run can stop unauthenticated, use the wrong player, or tempt an unsafe credential-in-prompt workaround. | First test whether the supported adapter can use an already authenticated local Browser profile without transporting secrets. If not, stop and design a dedicated short-lived, audience-bound Agent admission mechanism with the CP-17 owner; never put session credentials in the Event, lease instruction, URL, or prompt. | Treat this as an early kill test and CP-17/CP-14 join gate. |
| Default Connector dispatch does not automatically return a structured effect receipt or ACK. | Codex process exit or natural-language success can falsely close the delivery; unacknowledged work may be reclaimed up to the attempt limit. | Either stop first-slice evidence at activation/page action, or add a separately owned structured adapter-result contract plus a Game-issued, Receiver-verifiable effect receipt bound to the Event, action, and resulting revision. | Stop at the strongest honest boundary until effect authority and structured return are proven. |
| Active Receiver state machines are implemented separately from Core. | Route, expiry, signature, duplicate, and error behavior can drift even when both sides say protocol `0.1`. | Pin exact source and run shared positive/negative conformance vectors against Core and the deployed Receiver. A later upstream task may consolidate implementation, but Game adaptation must not modify external source. | Conformance is a handoff gate; upstream refactor is not a Game task. |

## Recommended first compatibility profile

The recommended v0.1 compatibility profile is deliberately narrow:

1. one Game player, one shelter, one stable workflow, one paired Connector target, one consent, one
   one-run Grant, and one `CargoLostToMonster` Event;
2. advanced Host SDK usage on the Game server with an exact pinned artifact and server-only Host key;
3. `event_id = signalId`, `event_sequence = 1`, fixed approved `event_type`, durable ISO
   `occurred_at`, owner-approved causal `state_version`, and no extra Event payload;
4. a durable Game receipt named and evidenced as Receiver queue acceptance, separate from Connector
   claim, Agent activation, page action, Host effect, and ACK;
5. Connector delivery to a fresh session only if the supported Browser and authenticated page-context
   kill test passes without moving credentials into prompts or URLs;
6. one fresh `inspect_shelter_state` read before any conditional `force_recall_soldier` invocation;
7. activation-only or page-action evidence unless a structured adapter result and independent
   Host-effect authority are actually available; and
8. no compatibility alias, second queue, hidden retry, direct Thread message, local reuse of an
   exhausted Grant, or fallback to fixture identity.

This profile is recommended because it matches the strict Core wire contract, the actual Connector
behavior, the Game's verified local seams, and the smallest reversible proof. It intentionally gives
up recurring wake and same-task continuity in the first slice rather than pretending those capabilities
already exist.

## Owner decision packet for the next discussion

The following decisions must be explicit. The recommendation is recorded so discussion can focus on
trade-offs rather than rediscovering the problem.

1. **Queue receipt semantics.** Recommended: a distinct durable `receiver_queue_accepted` meaning that
   may settle Game publication but cannot satisfy Agent delivery or effect claims. Alternative: retain
   `ContinuationDelivered` only after an ADR narrows its meaning and every UI/evidence consumer is
   audited for misleading language.
2. **Grant lifecycle.** Recommended: one consent, one Grant, one Event for v0.1. Alternative recurring
   behavior requires a visible rearm flow or a new Core/Receiver protocol decision; cooldown alone is
   not authorization.
3. **Activation target.** Recommended: accept a fresh Codex session as the first implementation truth
   and update any existing-Thread language before evidence. Alternative: block CP-14 activation and
   commission a managed-context adapter that can prove exact-task selection and safe-turn activation.
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

- owner decisions on queue semantics, one-shot Grant, fresh-session scope, SDK surface, and ACK claim;
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

| Game value or boundary | v0.1 Receiver value | Required decision |
|---|---|---|
| `signalId` | `event_id` | Use the same stable identifier across retries and duplicate `202` responses. |
| `opaqueBinding` | `binding_id` | Do not copy the Game value; resolve a server-side Receiver binding/Grant map. |
| `latestEventType` / `CargoLostToMonster` | Grant-fixed `event_type` | Proposed first value is `CargoLostToMonster`; Eddy and the Game owner must accept it. |
| `boundedAction = force_recall_soldier` | Lease `instruction` and page action | Put only approved instruction in the Grant; the Event carries no undocumented payload. |
| `cursorEnd` | `state_version` | Proposed mapping is `cursorEnd` as the page-read causal version; record it as distinct from mission revision. |
| Game `worldTime` | `occurred_at` | Do not convert units by guess. Capture one server ISO timestamp durably for the signal or approve a minimal mapping field. |
| Game canonical page/session | `canonical_url` and Agent activation context | Use the exact hosted origin/path and an explicit session acquisition boundary; fixture cookies are not production identity. |
| Game local accepted outcome | Cloud `202` acceptance | It may settle only Game publication if `ContinuationDelivered` is explicitly queue acceptance; it never means claim, activation, effect, or ACK. |
| Game publication lease | Cloud claim lease | Keep them separate. Game never calls claim/ACK or handles Connector tokens. |
| Game cooldown/reissue | Grant `runs_remaining` | First slice is one-shot. Re-consent/rearm is required for a later external signal. |

## Required handoff gate

No implementation Red run is valid until the external handoff supplies:

1. exact v2 Receiver commit, package path, clean status, endpoint/origin, TLS profile, and database
   migration/test command;
2. exact Host SDK, Core, and Local Connector package versions and Node requirement;
3. one accepted consent decision route, status/effective-status/revocation rules, binding shape,
   Grant expiry/exhaustion, target binding, and one-run/rearm policy;
4. Event signature bytes, canonical fields, timestamp limits, status/error envelopes, duplicate
   rules, and proof that ingress does not contact the Connector;
5. claim/lease/attempt/expiry/target-scope rules, exact 204 response, and the Connector polling/
   activation behavior;
6. the canonical Game URL and an authorized fresh Codex session path that contains no Connector or
   lease secret;
7. independent effect-authority ownership, context contract, ACK status/error behavior, or an
   explicit activation-only evidence boundary; and
8. executable cross-team tests against the exact handler and disposable durable database, with
   redacted output and restart/concurrency coverage.

If the packet names `runtime/cloud-receiver/`, an absent path, a guessed route, a compatibility alias,
or a historical local-only result, return it to the handoff owner and leave this task pending.

## Smallest reversible action

Record the exact handoff packet, rerun [`Validation/89`](../Validation/89-cp14-cloud-receiver-v2-adaptation-cross-functional-audit.md),
and accept the mapping table before touching Game code. If a mapping changes the meaning of
`ContinuationDelivered`, adds a new status/schema, or requires recurring Grants or a new effect
authority, create or update an `ADR-GAME-*` first. Until then, preserve the verified local port and
stub exactly as they are.

## Implementation route

1. **Handoff intake:** compare exact refs, package exports, routes, and test environment. Stop on any
   source or contract contradiction.
2. **Server-only mapping:** persist the approved Receiver continuation map and stable Event context;
   keep it out of browser snapshots, page tools, Agent prompts except the approved instruction, and
   logs.
3. **Red:** add a focused HTTP contract test against the exact Receiver that fails only because the
   Game Cloud Event transport is absent. Include first acceptance, duplicate, timeout/unknown,
   wrong binding/Grant, exhausted Grant, and no-gameplay-mutation cases.
4. **Green:** implement the smallest typed Event publisher behind the existing Game port. Use the
   Host SDK signer or an exact equivalent; never hand-build a divergent signature or route.
5. **Refactor:** preserve stable Event identity, durable timestamp/context, no hidden retry, exact
   error mapping, secret redaction, and the separation between Game publication and Cloud claim/ACK.
6. **Trace:** run one real `CargoLostToMonster` path. Prove `202` queue acceptance first; add claim,
   fresh activation, page read, bounded recall, and ACK only when each owner-controlled boundary is
   actually available.
7. **Closure:** record exact commits, runtime/database, event/signal IDs, durable transitions,
   expected/actual response shapes, skipped gates, and the highest supported claim. Update status,
   seam map, evidence, and validation without rewriting prior local-stub evidence.

## TDD and verification budget

- Red–Green–Refactor is mandatory for the new adapter. A Red caused by a missing endpoint, missing
  credential, or guessed route is a harness failure, not a valid contract Red.
- Minimum focused verification: Game adapter unit/contract tests, existing CP-14 signal policy and
  local port suites, typecheck, exact Eddy Event contract tests, and documentation validators.
- Add claim/lease/ACK and independent-browser tests only when their exact counterpart and authority
  are present; do not run unrelated full aggregates to manufacture confidence.
- Minimum evidence is ladder level 2 for the adapter contract. A real Event-to-Connector trace is
  level 4/5 depending on page and session coverage; hosted closure is level 7 and remains separate.

## Stop and recovery

Stop before code or trace if any path requires a deprecated runtime, absent package, guessed consent
route, second queue, per-event Thread message, hidden retry, local reuse of an exhausted Grant,
non-durable signed Event context, browser-held credential, Game-issued effect token, or a
Codex-process-success-to-ACK shortcut. A transport timeout remains unknown/retryable; it is never
converted to success.

If the handoff changes, preserve this task as pending, update the validation audit, and create the
smallest new decision/task needed. Do not alter Eddy-owned source or external state to make the
adapter fit.

## Verification and closure target

- Minimum verification: exact handoff/source readback, focused Red–Green–Refactor adapter tests,
  affected Game CP-14/CP-16 regressions, exact external Event contract tests, Node 24 typecheck,
  documentation self-tests, repository validator, and `git diff --check`.
- Closure target: `integrated` only after one exact-version Event-to-Receiver trace and all claimed
  downstream boundaries have their own evidence. If only queue acceptance is available, retain the
  task as pending or use a narrower follow-on task; do not close as live Re-entry.
- Rollback or remediation: revert only Task076-owned Game source/tests/records if the mapping is
  falsified; preserve domain events, local signal history, and Eddy refs. If a schema/semantic change
  is required, use an ADR and migration plan before implementation.
- Reopen trigger: any duplicate signal, wrong binding/target, stale lease settlement, Event-body
  drift, secret exposure, Grant exhaustion misuse, changed route/package/endpoint, missing page
  session, effect-authority mismatch, or evidence claim above the actual boundary.
