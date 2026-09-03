# CP-13 Page Tool Contract and Schema Pre-Implementation Challenge

**Status:** ACCEPTED PREPARATION; SERVER RECALL VERIFIED; PAGE RUNTIME OPEN
**Checkpoint:** CP-13
**Task:** [`SK-TASK-053`](../Tasks/SK-TASK-053-cp13-page-tool-contract-preparation.md)
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)
**Scenario:** [`CP-13 WebMCP fixtures`](../Scenarios/13-cp13-webmcp-fixtures.md)
**Decision:** Owner accepted the amended four-read preparation on 2026-09-03; the server recall seam is
runtime-verified under [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md)
and the side-chat Soldier dispatch suggestion remains deferred
**Date:** 2026-09-03

## Decision question

Can the game expose a minimum page-bound WebMCP surface for the G2 demonstration using only the
existing server-owned gateway and projection/history authorities, while preserving identity scope,
revision and idempotency checks, visible unsupported behavior, and the human consequence boundary?
The accepted answer is a four-tool bounded read surface plus a page-gated recall action backed by the
runtime-verified server transition. Page exposure still requires the session grant, live reread, and
full-snapshot reconciliation. The supported-adapter prerequisite is evidenced for one disposable page
by SK-EVID-045; that result does not prove the canonical game page's future registrations.

## Objective and binding constraints

- Give an Agent a fresh, reviewable read of the current shelter, projection, missions, and causal history.
- Permit one bounded `force_recall_soldier` action only after the page/session grant and live revisions are validated.
- Derive world, player, shelter, binding, and visibility from the server session. Tool arguments must never select authority.
- Use the existing `WorkerCommandGateway`, mission/revision/idempotency rules, and full-snapshot
  reconciliation for the eventual page tools. The server-authoritative recall transition is verified
  under SK-TASK-060; this proposal must not imply that page registration or Agent invocation already
  exists. A page bundle or route must not construct a worker, store, identity resolver, or second queue.
- Keep the human page usable when WebMCP is absent. An unavailable adapter is a visible capability state, not a simulated success.
- Preserve `SK-MVP-0.2`, the current event vocabulary, settlement boundary, Signal policy, and Re-entry Core separation.
- Preserve the combat boundary in M09-08: a recall submitted while an encounter is in `CONTACT`,
  `LOCKED`, or `RESOLVING` returns typed `IN_COMBAT` with no phase change; deferred return intent is
  post-G2 and is not part of this package.
- Keep migration, siege, destructive upgrades, production authentication, and external Receiver/Connector work outside this proposal.

## Current evidence and gaps

### Verified facts

1. `Engineering/05-api-and-webmcp.md` names the candidate reads and mutations and requires JSON Schema, current shelter ownership, entity revisions, role lock, target visibility, idempotency, typed failures, and a post-entry reread.
2. The current page/session path is server-bound through the CP-12 fixture bootstrap, realtime wire, projection client, and shared worker gateway. It is local fixture evidence only.
3. `SK-MVP-0.2` requires the Re-entry path to read current mission history and the delivered event digest before attempting `force_recall_soldier` under the accepted grant.
4. SK-TASK-041 and SK-EVID-030 preserve the Luna negative capability outcome: the named page context
   had no usable document.modelContext, and the adapter rejected webmcp_list_tools.
5. SK-TASK-059, SK-EVID-045, and Validation/70 now record a positive Sol discovery and read-only
   invocation on the disposable CP-02 page; this closes adapter eligibility but not game-page behavior.
6. Scenario W13-01 through W13-08 and `SK-TASK-013` leave the final schemas, registration timing,
   grant/binding scope, pagination, unsupported UX, and page transport open; the server recall-validation
   seam is runtime-verified under SK-TASK-060.

### External API reference (non-authoritative for the game)

The [WebMCP draft Community Group Report](https://webmachinelearning.github.io/webmcp/) defines the
current page API names `document.modelContext.registerTool()`, `getTools()`, and `executeTool()`. It
also defines registration validation, origin exposure, and abort-based unregister behavior. The draft
explicitly says that it does not prescribe the format used to expose tools to a browser Agent, and
`getTools()` is intended for in-page agents. Therefore page-side registration or `getTools()` readback
can validate the page API only; it cannot substitute for a supported browser/model adapter's genuine
discovery and invocation. The draft is reference material, not a
new game contract or runtime evidence.

### Inferences used only for this proposal

- Four reads provide the smallest useful first page-tool surface. `force_recall_soldier` is a page-gated
  action seam backed by the separately verified server transition.
- Read tools should be argument-light and derive scope from the server context. History is the only read
  that needs an opaque, bounded cursor.
- The Agent-facing `inspect_client_snapshot` should be a fixed-field summary, not the raw page
  reconciliation payload: `player.exploredCells`, `map.blockedCells`, visible arrays, and recent-event
  arrays are omitted so response size cannot grow with exploration.
- The eventual recall mutation should return metadata and let the existing full snapshot settle the
  visible page, so WebMCP does not become a second renderable projection ingress.
- A versioned result envelope and typed failures are safer than exposing internal service rows or
  allowing arbitrary argument passthrough.

### Unknown and falsifiable points

| Unknown | Why it matters | Falsifier or next gate |
|---|---|---|
| Supported registration/readback API | A page-side registration object is not proof of Agent discovery | A supported adapter lists the exact tools and schemas from the same page |
| Grant and binding propagation | A caller-selected binding could cross shelters | Server readback shows the binding is derived from the session and rejects a foreign scope |
| History transport and page size | Unbounded history could block the Agent or leak unrelated events | A bounded opaque cursor/limit is accepted by the owning contract and exercised by W13-02/W13-05 |
| Recall validation seam | A route-level shortcut could bypass mission policy | A gateway invocation proves live role, attempt, revision, ownership, and idempotency checks |
| Result envelope/version | Different consumers could interpret stale fields as current | Owner accepts one exact envelope and a schema-negative test rejects unknown/invalid shapes |

## Accepted read package and deferred action seam

The read package is the accepted CP-13 preparation surface. `force_recall_soldier` is retained as a
contract seam for the G2 story and is backed by the runtime-verified server transition in
[`SK-TASK-060`](../Tasks/SK-TASK-060-cp13-recall-transition-implementation.md). It remains deferred at
the page layer until the grant, canonical transport, live reread, and full-snapshot reconciliation are
implemented. The decision changes no runtime schema, does not authorize page registration by itself,
and does not change `SK-MVP-0.2`.

### Side-chat Soldier dispatch amendment review

The side-chat suggestion to add `assign_soldier_mission` was reviewed against the current gateway,
projection, grant, and scenario authorities. It is a reasonable future page command, but it is not
part of the accepted CP-13 increment for four reasons:

1. The implemented local route is an exact tier-one GATHERER command with a server-visible
   `target_id`; it does not accept a generic `target_selector` or a broader mission-kind union.
2. The Agent-facing `agent_snapshot_v1` intentionally omits resource-node IDs. Adding a command
   without a bounded target-discovery read would leave the Agent with no actionable target and would
   make a fixed-fixture shortcut look like a product surface.
3. The accepted G2 continuation grant authorizes one bounded recall after `CargoLostToMonster`; it
   does not implicitly grant Agent-initiated dispatch. A dispatch tool needs an explicit page/session
   grant and human-boundary rule.
4. Dispatch needs its own W13 cases for valid assignment, stale/role-lock/active mission,
   ownership, target/tool compatibility, duplicate replay, and full-snapshot reconciliation.

If reopened, the smallest safe follow-up is one single-soldier GATHERER command that reuses the
existing envelope and gateway, accepts only a server-visible Wood or Rock `target_id`, returns the
existing bounded acknowledgement, and remains paired with a bounded target-discovery read. HUNTER,
selectors, siege parties, and automatic Re-entry dispatch stay outside that follow-up.

| Tool | Admission | Proposed input | Proposed output boundary | Required server checks |
|---|---|---|---|---|
| `inspect_shelter_state` | CP-13 read surface | `{}` | Current server-scoped shelter summary, world time, contract version, and relevant shelter revision | Session readiness, shelter ownership, visibility, no client-selected identity |
| `inspect_client_snapshot` | CP-13 read surface | `{}` | Bounded `agent_snapshot_v1`: snapshot id, contract version, world time, server-derived player/shelter scope, player position/revision, shelter revision/coins, world event cursor, and bounded counts for missions, visible actors, and resource nodes. It omits `player.exploredCells`, `map.blockedCells`, and raw projection arrays | Same session resolver and privacy path as realtime; fixed response shape and size; no second snapshot authority and no caller-selected scope |
| `inspect_missions` | CP-13 read surface | `{}` | Current permitted mission summaries for the bound shelter, bounded by the server roster limit, including role, phase, attempt identity, cargo/return status, encounter state, and next action | Current scope, visibility, mission revision, role lock; no hidden foreign rows |
| `inspect_mission_history` | CP-13 read surface | `{cursor?: string, limit?: integer 1..50}` | Scope-bound causal event digest/page with an opaque server cursor; default limit is bounded and server-controlled | Cursor binding, event visibility, monotonic range, bounded response; no raw prompt, credential, or Agent context |
| `force_recall_soldier` | Page implementation seam backed by SK-TASK-060 | `command_id`, `idempotency_key`, `soldier_id`, `mission_id`, `mission_attempt_id`, expected soldier/mission/attempt revisions, and optional `signal_id`/`causal_event_id` provenance from the accepted continuation | Typed committed or rejected result with contract version, effect, duplicate flag, stable identities, event identity when committed, and committed revision minima; the existing full snapshot is the only renderable reconciliation | Accepted grant and optional signal provenance, current scope/ownership, active role/mission, live revisions, migration/recovery state, idempotency, `IN_COMBAT` rejection with no phase change, and one gateway transaction through the verified server transition |

### Proposed envelope rules

These are accepted preparation conventions, pending implementation and final schema alignment:

- Every result carries `contract_version`, a typed `status`, and a bounded `request_id` or command identity. Internal rows and arbitrary error strings are not exposed.
- Read results identify the server-bound world/shelter scope only to the degree already permitted by the
  page contract; they never accept scope fields from the caller.
- `inspect_client_snapshot` returns only the fixed `agent_snapshot_v1` summary above. It does not
  paginate or truncate raw arrays because those arrays are not in the Agent surface at all; the page's
  realtime `client_snapshot` remains the sole renderable reconciliation artifact.
- The tool-level ownership code is normative `NOT_OWNER`. The persistence-layer `OWNERSHIP_DENIED`
  result maps to that external code without changing the underlying store vocabulary.
- A recall success returns committed metadata, not a renderable mission row or an optimistic position.
  The page requests the existing full resync and waits for `RealtimeProjectionClient.accept()`.
- A recall retry with the same idempotency key returns the stored result. A changed payload under the
  same key returns a typed duplicate/conflict result. No second event, cargo movement, coin settlement,
  or mission attempt is created.
- Optional `signal_id` and `causal_event_id` are provenance only: the server checks them against the
  accepted continuation grant and durable history, and a caller cannot use them to select a different
  binding or bypass the live revision check.
- A stale or foreign request returns a typed failure and leaves newer state unchanged. A recovery
  failure is visible and is never queued for implicit replay. An active encounter returns typed
  `IN_COMBAT` with no phase change; deferred return intent is outside G2.

### Proposed registration/readback lifecycle

1. The canonical page reaches READY through the existing server-derived fixture session and current full snapshot.
2. The canonical page invokes the supported WebMCP registration API for exactly the owner-accepted
   **read tools** in that same page context. The server/session binding is established by the entrypoint
   boundary; the caller supplies no player, shelter, world, or grant identity. Optional signal provenance
   is checked against that server-bound grant rather than trusted as authority. Page-side getTools readback
   is a page validation step only, not browser-Agent capability evidence. `force_recall_soldier` may be
   registered only after the page grant, canonical transport, and reconciliation checks are implemented
   over the verified server transition.
3. The page reads back the registered names and schemas and exposes a visible unsupported state if the capability or
   registration is absent. A page-side object without adapter readback is not positive evidence.
4. A reconnect or session change invalidates old registrations and rebinds a fresh context. A stale callback receives a
   typed scope or revision failure.
5. The supported-adapter capability prerequisite is satisfied for the disposable page by SK-EVID-045.
   Positive CP-13 implementation evidence still requires the canonical game page to register the accepted
   read tools and a supported adapter to discover and invoke them. The recall action additionally requires
   its page grant, canonical transport, live reread, and full-snapshot reconciliation over the verified
   server transition. The next admitted task is [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md), the bounded page-read implementation task.

## Cross-module failure and race matrix

| Failure or race | Preventive rule | Observable result |
|---|---|---|
| Caller submits another player or shelter | Ignore client authority fields; derive one session scope | Typed `NOT_OWNER`/scope failure with no hidden state; persistence `OWNERSHIP_DENIED` is mapped at the tool boundary |
| Mission changes after the Agent read | Require current attempt and entity revisions at the gateway | Typed `STALE_REENTRY_CONTEXT` or `STALE_REVISION`; no mutation |
| Recall arrives while the soldier is in `CONTACT`, `LOCKED`, or `RESOLVING` | Preserve the encounter lock and do not queue a hidden escape | Typed `IN_COMBAT`; no phase change, cargo movement, or event |
| Same recall is delivered twice | Persist command/idempotency identity in the existing transaction | Stored result and one durable effect only |
| Read cursor is reused for another shelter | Bind opaque cursor to world, shelter, and visibility scope | Typed cursor rejection; no cross-scope history |
| History grows without bound | Enforce server limit and opaque cursor; return a bounded page | Explicit continuation cursor or bounded truncation, never an unbounded response |
| Agent snapshot grows with exploration | Project a fixed-field `agent_snapshot_v1`; omit raw explored/blocked/visible arrays | Fixed-shape bounded response; page realtime snapshot remains unchanged |
| Worker is starting, degraded, or draining | Recheck admission at invocation | Typed `RECOVERY_REQUIRED`; no in-memory deferred command |
| Page or route constructs another authority | Keep construction and resolution entrypoint-owned | Composition test fails; no second worker/store/queue is accepted |
| Adapter is absent or cannot enumerate tools | Do not polyfill or infer from page registration | Human UI remains usable with visible unsupported capability |
| High-consequence request is routed through the tool | Keep migration, siege, and destructive actions at human review | Typed human-boundary result; no silent approval |
| Automatic realtime publication races with a read or recall | Reads are current server reads; mutation uses live revisions; frame reconciliation remains full replacement | The newest accepted snapshot wins; no optimistic or stale render |

## Options and recommendation

| Option | Surface | Trade-off | Disposition |
|---|---|---|---|
| Minimal exact | Four bounded reads above, with one page-gated recall seam backed by the verified server transition, server-derived scope, and a bounded history cursor | Smallest proof while page registration and Agent delivery are implemented separately | **Accepted preparation** |
| Conservative envelope | Minimal exact surface plus an explicit schema registry/version wrapper and stricter cursor metadata | More readback clarity and migration safety, but adds contract surface before capability is proven | Keep as schema hygiene only if the owner wants it; do not add more tools |
| Expanded candidate set | Adds nearby resources, threats, assignment, migration, siege, posture, and event-review tools | Richer product surface but multiplies authority, privacy, human-boundary, and verification cases | Defer beyond CP-13 |

The accepted preparation is the Minimal exact **read** surface with only the envelope and cursor bounds
needed to make errors, retries, and scope visible, plus a page-gated recall seam. It gives CP-13 a useful
fresh-state Agent demonstration while keeping the verified server transition and page registration as
separate evidence boundaries. All future state changes stay in the verified gateway.
The supported adapter must still prove the canonical page capability before any page registration claim.

## Verification plan and claim boundary

### Preparation verification now

- Documentation validation must pass with no CJK or broken links and one bounded page implementation task
  in the queue.
- A manual review must map W13-01 through W13-08 to the proposal, with W13-01/W13-07 explicitly gated on genuine adapter behavior.

| Vector | Package coverage and gate |
|---|---|
| W13-01 registration readback | Canonical page registers the four accepted reads first; a supported adapter must enumerate exact names and schemas. Recall registration uses the verified server seam only after page grant and transport checks. |
| W13-02 inspection read | `inspect_shelter_state`, bounded `agent_snapshot_v1`, `inspect_missions`, and bounded history use server-derived scope and current revisions. |
| W13-03 valid recall action | Page implementation uses the server-verified M09-06/M09-07 transition plus accepted grant, live revisions, idempotency, and normal `RETURNING` transition. |
| W13-04 stale recall | Page implementation must surface typed stale attempt/revision failure and leave the newer attempt unchanged. |
| W13-05 cross-shelter denial | The tool boundary returns normative `NOT_OWNER`; persistence `OWNERSHIP_DENIED` is an internal mapping detail. |
| W13-06 duplicate recall | Page implementation must return the stored result for the same idempotency key and write one effect. |
| W13-07 capability unavailable | Page shows visible unsupported state and ordinary human UI remains usable; no polyfill or inferred success. |
| W13-08 human boundary | Migration, siege, and destructive upgrades remain explicit human-review outcomes, never Agent approval. |

- A cross-check must confirm that no proposal field changes the accepted contract, schema version, event vocabulary, settlement order, Signal policy, or human boundary.

The amendment review passed `python3 scripts/test_validate_game_docs.py` (22/22),
`python3 scripts/validate_game_docs.py --root . --report` (PASS with the registered page task), and
`git diff --check`. These are documentation checks only; no runtime, browser, WebMCP, Agent, Re-entry,
or contract-version behavior is established here.

### Later implementation verification (not run here)

- Registration/readback: exact names and schemas from the same page context.
- Read scope/privacy: Player A reads only its own shelter, snapshot, missions, and history; a foreign cursor or id is rejected.
- Recall: the verified server transition accepts one valid current attempt; the page implementation must
  preserve typed stale, duplicate, foreign, recovery, malformed, and in-combat outcomes and remain
  side-effect safe.
- Reconciliation: a full server snapshot settles the page; no optimistic tool response becomes a second projection.
- Unsupported UX: absent capability leaves ordinary human movement/dispatch usable and visibly marks WebMCP unsupported.
- Human boundary: migration, siege, and destructive upgrades stop at review rather than silently executing.

No result in this document is runtime WebMCP, Agent, Re-entry, external, hosted, or judge evidence.

## Decision and reopen boundary

**Accepted path:** Minimal exact four-tool read surface plus a page-gated recall seam backed by the
runtime-verified server transition, with server-derived scope, bounded history cursor, fixed Agent
snapshot projection, versioned typed results, gateway-only mutation, full-snapshot reconciliation, and
visible unsupported state.

**Decision status:** The owner accepted the amended preparation on 2026-09-03. No ADR is promoted and no
SK-MVP-0.2 rule changes. The recall-transition task is runtime-verified under SK-EVID-046; the four
   read tools and page recall seam entered the bounded CP-13 implementation task [`SK-TASK-061`](../Tasks/SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md), whose local implementation is now recorded separately; canonical page evidence remains open.
SK-EVID-045 is the adapter prerequisite receipt, while implementation evidence must capture genuine
discovery and one read-only invocation on the canonical game page. Preserve the ordinary human path if
the recall transition or page capability gate fails.

Reopen this Challenge when the adapter, page/session binding, grant scope, history contract, tool
schema, command authority, human boundary, or external handoff changes.
