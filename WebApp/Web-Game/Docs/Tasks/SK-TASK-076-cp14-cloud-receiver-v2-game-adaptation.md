# SK-TASK-076: CP-14 Cloud Receiver v2 Game Adaptation

## Task Control

- Lifecycle state: `pending`
- Closure type: `integrated`
- Checkpoint: `CP-14`
- Owner: Game owner, with Eddy as external Receiver/Connector handoff owner
- Current increment: A static cross-functional audit has mapped the current Game outbox and local port to Eddy's v0.1 Cloud Receiver/Local Connector contracts; the exact v2 implementation, endpoint, identity/session map, and effect authority are still handoff gates under [`Validation/89`](../Validation/89-cp14-cloud-receiver-v2-adaptation-cross-functional-audit.md).
- Next gate: Eddy supplies one exact owner-declared v2 handoff packet (Receiver SHA/package, Host SDK/Core/Connector versions, endpoint/TLS, database/test command, consent route, binding/Grant, claim/ACK, activation, and effect-authority details) and the Game owner accepts the mapping.

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
- Verified: Eddy's candidate Core defines protocol `0.1`, signed Event ingress at
  `POST /v0.1/events`, target-scoped Connector claim at `POST /v0.1/delivery-claims`, explicit ACK at
  `POST /v0.1/delivery-acknowledgements`, a 60-second Cloud lease, three attempts, five-second poll/
  delivery defaults, and a fresh Codex activation that does not auto-ACK.
- Verified: Eddy's v0.1 Event body and the Game signal envelope are different contracts; Cloud `202`
  means accepted and queued only; v0.1 Grant runs are limited to one; and the candidate's old Cloud
  runtime is deprecated.
- Inferred: The smallest compatible shape is a server-only Host Event transport behind the existing
  Game port, with `event_id = signalId`, a Receiver-owned binding map, and explicit queue-acceptance
  claim wording. The first external slice should be one approved Grant and one
  `CargoLostToMonster` event.
- Unknown: Eddy's owner-selected v2 implementation SHA/package/endpoint, the public consent-decision
  route, the production binding and session map, the accepted Game `state_version`/`occurred_at`
  mapping, the fresh Codex page-authentication path, and a production/test effect authority.

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
