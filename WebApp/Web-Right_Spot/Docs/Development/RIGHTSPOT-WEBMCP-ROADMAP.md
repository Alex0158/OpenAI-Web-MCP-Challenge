# RightSpot WebMCP Integration Roadmap

**Role:** Engineering roadmap and gate definition for the later RightSpot WebMCP capability  
**Status:** `ROADMAP_ESTABLISHED` — Tenant Discovery Search selected as the first goal; contract work is pending and implementation/tool registration are not yet authorized  
**Owner:** Main RightSpot thread  
**As of:** 2026-09-02, Europe/London  
**Applies to:** `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`

## 1. Purpose and outcome

This document defines how RightSpot may add a page-bound WebMCP capability without weakening the
accepted ordinary local MVP. It is an engineering roadmap, not an implementation Task, a second task
register, or permission to change source.

The target outcome is one evidence-backed user journey in which an authenticated browser agent can
use a small, page-authored tool surface to help a tenant or agent reach a clearly defined result while:

- the normal human UI remains complete and usable without WebMCP;
- the existing RightSpot application/domain/persistence authority remains the only business authority;
- role, assignment, privacy, version, failure, and terminal-state rules remain server-enforced;
- the page visibly reflects the same authoritative result that the tool returns; and
- the integration can be disabled or removed without changing the ordinary rental workflow.

“100% WebMCP adaptation” is intentionally not a roadmap outcome. Coverage is selected by user goal,
material value, risk, and evidence, not by the number of routes or buttons that can be wrapped.

## 2. Authority and current baseline

The following sources remain authoritative in their respective areas:

- [RightSpot current status](../00-current-status.md) for current integrated source, runtime, closure,
  and residual claims;
- [RightSpot requirements](../02-requirements.md) for the accepted ordinary product boundary;
- [RightSpot business flows](../07-business-flows-and-scenarios.md) for user-facing scenarios and
  state transitions;
- [RightSpot API and integration contracts](../05-api-and-integration-contracts.md) for the future
  integration boundary;
- [ADR-RS-0006](../Decisions/ADR-RS-0006-durable-workflow-and-application-boundary.md) and
  [ADR-RS-0008](../Decisions/ADR-RS-0008-ordinary-workflow-http-and-interface-contract.md) for
  application authority and ordinary workflow transport;
- [ADR-RS-0011](../Decisions/ADR-RS-0011-bounded-agent-operations-read-model-seam.md) for the
  bounded relay-side Operations projection seam;
- [ADR-RS-0012](../Decisions/ADR-RS-0012-operations-profile-authority-and-manual-query-boundary.md)
  for the separate Operations profile and its manual-query boundary; and
- [`RIGHTSPOT-010`](../Tasks/RIGHTSPOT-010-define-agent-operations-insights-dashboard-boundary.md)
  for the pending read-only Agent Operations/WebMCP proposal.
- [`RIGHTSPOT-042`](../Tasks/RIGHTSPOT-042-define-tenant-search-and-webmcp-search-contract.md)
  for the selected Tenant Discovery/WebMCP Search contract decision and the current Area gap.

The current RightSpot source has no WebMCP registration, no page-authored tool adapter, and no
WebMCP dependency. The accepted ordinary MVP is a normal Next.js application with an authoritative
server-side workflow and role-scoped human UI. WebMCP, Cloud Receiver, WebRTC, Redis, external
authentication, deployment, and production readiness remain separate boundaries.

The external specification and browser implementation must be rechecked at every implementation gate:

- [WebMCP draft Community Group Report](https://webmachinelearning.github.io/webmcp/) — the current
  specification is a draft and is not a W3C Standard or on the W3C Standards Track;
- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp) — current browser setup,
  Imperative API, Declarative API, feature availability, and limitations; and
- [Chrome WebMCP tool-building guidance](https://developer.chrome.com/docs/ai/webmcp/build-tools) —
  user-goal selection, state/boundary design, graceful failure, and probabilistic evaluation guidance.

The roadmap records decisions and gates from the current sources; it does not freeze an external API
whose shape may change.

## 3. Strategy: staged page capability, not total application conversion

RightSpot will use WebMCP as a progressive enhancement at a page capability boundary. It will not
replace the domain model, ordinary HTTP API, human UI, session authority, or future Cloud Receiver.

### 3.1 Non-negotiable principles

1. **Goal before route.** Select a user goal where an agent materially reduces navigation or
   composition friction. Do not expose every route merely because it exists.
2. **One authority.** A WebMCP tool may call an existing typed page/application boundary or a newly
   accepted adapter over that boundary. It must not query SQLite directly, recreate domain rules, or
   create a second state machine.
3. **Progressive enhancement.** Feature-detect WebMCP. If the browser does not provide it, the page
   must continue to work through the normal UI with no fake success, silent no-op, crash, or arbitrary
   fallback.
4. **Read before write.** The first integrated slice is read-only. State-changing tools require a
   separate decision, explicit user intent, current version/generation checks, idempotency, and a
   visible human confirmation boundary.
5. **Server authority survives the agent.** Tool input is untrusted input. Session, role,
   assignment, listing ownership, request state, privacy, availability, and concurrency are checked
   by the existing authoritative boundary on every operation.
6. **Visible state agreement.** A successful tool invocation must leave the page in a state that a
   human can inspect and that is consistent with the authoritative response. Tool output alone is not
   proof of a page transition.
7. **Bounded failure.** Invalid, ambiguous, stale, unavailable, unsupported, or malformed input must
   return actionable bounded feedback. Never trust arbitrary server text, swallow an exception, or
   report a mutation as successful when it was not.
8. **Least privilege.** A tool exposes only the role-safe fields needed for its stated goal. It does
   not expose tenant identity, contact data, internal notes, processed-command metadata, raw SQL,
   unrelated portfolio data, or hidden workflow internals.
9. **Ephemeral lifecycle.** Registration belongs to the current page and authenticated session. Route,
   role, listing, or relevant capability changes must not leave stale tools registered for the wrong
   context.
10. **Evidence before expansion.** A route existing, a passing ordinary test, or a tool wrapper
    compiling does not prove WebMCP registration, discovery, invocation, browser behavior, or agent
    success. Each claim needs matching evidence.

### 3.2 What “done” means for a WebMCP slice

A slice is complete only when all of the following are true for its declared user goal:

- the ordinary manual journey is already coherent or is delivered in the same accepted bounded
  increment;
- the tool name, description, schema, role, scope, lifecycle, result, and error contract are frozen;
- the adapter consumes an accepted application/API boundary and does not duplicate authority;
- unsupported WebMCP leaves the manual UI truthful and usable;
- actual supported-browser registration and invocation are observed, not inferred;
- malformed, ambiguous, unauthorized, stale, unavailable, empty, and terminal cases are tested;
- page state, tool result, and server state agree after success and after failure;
- privacy and prompt-injection boundaries have been reviewed;
- focused tests, complete RightSpot tests, typecheck, build, runtime, browser, and relevant agent
  evaluations pass; and
- exact source, browser capability, fixture, evidence, residuals, and non-claims are recorded in the
  owning Task File and canonical documents.

## 4. Candidate user goals and prioritization

The product goal, not the number of exposed controls, determines the first slice.

| Candidate goal | Current authority | Risk | Recommendation | Reason |
|---|---|---:|---|---|
| Find published rentals by bounded area/filter and show the result on Tenant Discovery | Existing listing application/API and page | Low | **Selected first slice** | Directly supports the core tenant journey, requires no new reporting model, and is read-only; contract work is registered in `RIGHTSPOT-042` |
| Inspect one published listing and return to a human-readable detail surface | Existing listing detail route/API | Low | Follow-on read slice | Useful after discovery, but not necessary for the first registration proof |
| Query upcoming Operations viewings or listing pipeline | Separate Operations authority/projection; `RIGHTSPOT-010` proposal | Medium | Decision-gated alternative | Potentially strong Hackathon value, but requires an accepted Operations page/query boundary |
| Save a Favourite or Viewing Request draft | Existing mutation authority | Medium | Later mutation slice | State-changing and must preserve idempotency, version, role, and user-intent rules |
| Submit a Viewing Request, send a proposal, confirm/decline a viewing | Existing workflow authority | High | Defer until read slice is verified | Human-consequential transitions need explicit confirmation and stronger browser evidence |
| Login, expose internal notes, contact a tenant, send notifications, or operate Cloud Receiver | Separate or deferred authority | High | Exclude | Not part of the current WebMCP slice and would expand security/integration scope |

Main has selected the lower-risk read-only Tenant Discovery Search goal as the first WebMCP direction.
The current candidate is one `search_listings`-type capability on the existing Tenant Discovery page,
with bounded structured filters and a visible update of the ordinary listing results. The exact name,
schema, Area semantics, and result boundary remain pending in `RIGHTSPOT-042`; selection of the goal
does not authorize implementation or registration. `RIGHTSPOT-010` remains a separate pending
Operations Insights alternative and is not silently replaced by this selection.

This choice prevents the first WebMCP increment from silently becoming a new reporting product, a
generic chatbot, or a full rewrite of the already-closed tenant-to-agent workflow.

## 5. Roadmap phases and gates

The phases describe dependency order. They are not a live task queue. A new registered Task is created
only for the next approved product outcome after its gate is passed.

### W0 — Main-thread decision and capability baseline

**State:** `GOAL_SELECTED — CONTRACT_PENDING`  
**Owner:** Main RightSpot thread  
**No code or registration is authorized.**

The Main Thread has selected the Tenant Discovery read-only Search goal and recorded the following
bounded W0 disposition:

- first role: authenticated Tenant;
- first page: `/tenant`;
- first outcome: a visible, tenant-safe published-listing result;
- first capability mode: read-only;
- first authority: the existing listing application/API projection; and
- current next gate: `RIGHTSPOT-042` freezes the Search contract before any implementation or tool
  registration.

W0 must recapture the current Main source identity, package/runtime, browser capability, route/session
state, existing authority, dirty/untracked paths, and the external WebMCP API status. Its output is a
main-thread decision disposition and, if accepted, an implementation-ready product outcome—not a
placeholder backlog.

**Exit gate:** The first goal, page, role, read-only outcome, existing authority, and named Main owner
are accepted. The exact tool boundary, Area semantics, result schema, browser capability, and remaining
non-goals are intentionally W1 work; they must not be hidden inside an implementation Task.

### W1 — Capability and contract design

**State:** `IN_PROGRESS — RIGHTSPOT-042`  
**Likely role:** WebMCP/API/UX/Security boundary Advisor  
**Output:** one implementation-ready contract and one bounded Work Order.

Freeze, for the selected goal:

- tool name, purpose, description, input schema, required fields, limits, and ambiguity behavior;
- role/session preconditions and page starting state;
- authorized data and result envelope, including empty, unavailable, freshness, and result-cap
  semantics;
- page-state postcondition and how the human UI presents the result;
- unsupported-browser behavior and manual recovery path;
- invalid, unauthorized, stale, duplicate, persistence, and malformed-response behavior;
- registration/unregistration lifecycle and relevant route/session dependency;
- privacy, untrusted-content, cross-origin, prompt-injection, and output-size boundaries;
- exact read/write/forbidden/generated paths and shared-file ownership; and
- focused, browser, and agent-evaluation evidence required for the next gate.

The contract must consume existing listing or Operations authority. It must not add a new database,
new workflow state, arbitrary natural-language-to-SQL parser, generic chat layer, or unreviewed public
API.

**Exit gate:** Main Thread accepts the contract and registers a single outcome Task. If the contract
changes product scope, authority, data ownership, or security, record an ADR before implementation.

### W2 — First read-only WebMCP vertical slice

**State:** `GATED_ON_W1`  
**Outcome:** one page-authored read-only tool that performs one bounded goal through existing authority.

The implementation must:

1. feature-detect the current WebMCP API without making it a required page dependency;
2. register only the selected tool for the current authorized page/session context;
3. validate and bound input before calling the existing typed application/API boundary;
4. reuse the server-owned listing or Operations projection and role-safe DTOs;
5. render the authoritative result through the normal page state, including empty and error states;
6. keep manual filters, links, and recovery actions available;
7. avoid direct database access, private-field exposure, arbitrary queries, and mutation side effects;
8. clean up or replace stale registration when the page/session capability changes; and
9. add no speculative tools, generic registry, Cloud Receiver adapter, or WebMCP-only business logic.

**Exit gate:** focused contract/component tests and ordinary suite pass; exact diff is within the
approved paths; no ordinary UI/API behavior changes outside the selected outcome; and a frozen source
is ready for independent verification.

### W3 — Independent browser and agent verification

**State:** `GATED_ON_W2`  
**Outcome:** an independent verifier proves the tool exists and behaves correctly in a supported
browser capability environment.

The verifier must use the exact frozen source, declared runtime, and a disposable deterministic
fixture. It must independently observe:

- signed-out and wrong-role registration absence or bounded denial;
- authorized registration and the exact tool metadata/schema;
- valid invocation and the corresponding visible page result;
- empty result and recoverable filter changes;
- missing, malformed, oversized, ambiguous, and unsupported input;
- read failure, authority failure, stale read, and browser capability absence;
- no cross-role or private-field leakage;
- no mutation of the Viewing Request/Favourite workflow for a read-only tool;
- route/session teardown and absence of stale tool exposure;
- keyboard/manual UI continuity and responsive/error-state usability; and
- browser console/page-error state and a clean-room reproduction where the claim requires it.

The WebMCP DevTools surface or equivalent supported browser inspection may prove registration and
invocation, but ordinary HTTP tests, static source inspection, or a tool directory listing cannot
substitute for page runtime evidence. Agent behavior is probabilistic; add goal/parameter/result evals
for the selected journey and report failures separately from deterministic application tests.

**Exit gate:** Main Thread accepts the verifier result as `VERIFIED`, reconciles the evidence and
residuals, and updates the flow/status/roadmap documents before any expansion.

### W4 — One explicitly confirmed mutation (optional)

**State:** `GATED_ON_W3`  
**Outcome:** one state-changing capability only if the read-only slice demonstrates value and the
mutation boundary is accepted separately.

The first mutation candidate should be the least consequential useful step, such as saving a tenant
draft, not submitting a request or confirming a viewing. It must:

- require an explicit user goal and visible confirmation where the action has a meaningful consequence;
- send only client input allowed by the existing mutation contract;
- preserve server-derived role, listing, request, version, fixture-generation, and state authority;
- use a fresh command/idempotency identity and preserve duplicate-command semantics;
- surface `409`, `400`, `401`, `403`, `404`, `503`, and terminal-state responses truthfully;
- never automatically retry, substitute another listing/slot, or claim success after failure;
- return the authoritative postcondition and keep the page/tool result aligned; and
- pass dedicated stale, duplicate, failure, confirmation, terminal, and reload evidence.

W4 is not implied by W2 or W3. It requires a new bounded Work Order and may require a new ADR if the
human decision boundary or public contract changes.

### W5 — Selective expansion and Hackathon evidence

**State:** `GATED_ON_VERIFIED_VALUE`  
**Outcome:** add only the next tool that materially advances an accepted user goal.

Expansion is admitted only when the existing tool has evidence of value, a clear failure/recovery
record, and no unresolved authority or privacy issue. Each added capability receives its own schema,
risk tier, tests, browser evidence, and rollback boundary. Tool count is not a success metric.

The final demo claim must distinguish:

- ordinary human UI behavior;
- WebMCP registration/discovery/invocation in the supported browser environment;
- deterministic server/domain correctness;
- agent-evaluation results and limitations; and
- unimplemented Cloud Receiver, external authentication, deployment, WebRTC, Redis, and production
  claims.

### W6 — Separate external integration (future)

**State:** `DEFERRED`  
Cloud Receiver delivery, Re-entry/continuation, remote viewing, external identity, notifications,
and deployment are not implicit follow-ons to W2–W5. If required, each receives an independent
authority, transport, security, persistence, and verification decision. WebMCP must remain useful
without those integrations.

## 6. Contract rules for every future tool

### 6.1 Identity, role, and session

- Tool availability must be derived from the current page and server-resolved session, not from a
  client-supplied role or hidden UI flag.
- Signed-out pages expose no authenticated tool. A wrong-role or unassigned actor receives a bounded
  denial and no private projection.
- Session, route, listing, and capability changes must not leave a prior role's or listing's tool
  callable.
- Tool registration never grants authentication, assignment, or data access.

### 6.2 Input and ambiguity

- Inputs use explicit, allowlisted structured fields with bounded length, cardinality, and range.
- The authority does not guess missing dates, areas, listing identity, or consequential intent.
- An ambiguous request must ask for the missing value through the supported user-interaction boundary
  or return actionable clarification; it must not silently choose a default.
- Natural-language interpretation, if later added, is an adapter concern and may map only to an
  already accepted structured contract.

### 6.3 Result and page state

- Results identify the evaluated source/context needed to understand freshness and scope.
- Empty is a successful empty result only when the authority and filters are valid; it is not a
  substitute for an unavailable or malformed authority.
- Server-controlled diagnostic text is not rendered as trusted user-facing copy.
- The page must show loading, success, empty, unavailable, and retry states that agree with the latest
  authoritative read; retained stale content must not be labelled current.
- A tool response must not claim a route change, mutation, or terminal state that the page and server
  did not actually establish.

### 6.4 Mutation and human boundary

- Read-only tools are explicitly marked and must not mutate workflow state.
- A mutation tool is a command adapter, not a second command implementation.
- Consequential human decisions remain visible in the normal UI. Tool invocation may prepare or
  request confirmation, but it must not bypass the accepted confirmation boundary.
- Every successful mutation returns an authoritative version/state postcondition. Every failed
  mutation remains a failed attempt, even if a recovery read succeeds.

### 6.5 Privacy and untrusted content

- Expose only fields necessary for the selected role and goal. Do not expose tenant identity/contact
  data, private notes, internal review notes, raw ledger data, or unrelated actor/portfolio data.
- Listing descriptions, media metadata, and other externally sourced or user-authored content must be
  treated as untrusted content when the applicable WebMCP API supports that annotation.
- Cross-origin exposure is forbidden by default. Any future `exposedTo`-style capability requires an
  explicit trusted-origin decision and security review.
- Tool names, descriptions, parameters, and outputs must not contain hidden instructions or arbitrary
  model-directed content.

### 6.6 Lifecycle and compatibility

- Registration is page-scoped and cleaned up when the page or capability context ends.
- A browser without WebMCP must never receive an invented registration result or an app-wide error.
- The ordinary UI/API path remains the recovery path and the regression baseline.
- Recheck the browser API, permissions policy, origin-trial/flag behavior, TypeScript types, and
  supported DevTools evidence before each implementation or verifier dispatch.

## 7. Verification and evidence matrix

| Claim | Minimum evidence | Must not be substituted by |
|---|---|---|
| Tool is registered | Supported browser runtime inspection on the exact page/source | Static `registerTool` text, ordinary route `200`, or package install |
| Schema is usable | Runtime discovery plus valid/invalid invocation checks | TypeScript compile alone |
| Tool reaches application authority | Focused adapter/API/application tests and source boundary review | Direct SQLite access or mocked success |
| Page reflects the result | Rendered browser postcondition with browser log/page-error capture | Tool response text alone |
| Role/privacy is safe | Tenant/agent/signed-out/wrong-assignment runtime and contract checks | UI hiding or a single happy-path session |
| Failure is truthful | Malformed, unavailable, stale, duplicate, and terminal checks | Generic catch-all or automatic retry |
| Manual fallback works | WebMCP unavailable/disabled browser walkthrough | Assuming all judges have the same browser capability |
| Agent journey is reliable | Goal/parameter/result evals plus deterministic application tests | One successful prompt |
| Integration is reproducible | Frozen source, runtime, fixture, registration/invocation record, exact commands | Builder prose or a directory listing |

Required deterministic checks remain the current RightSpot commands (`npm test`, foundation check where
needed, typecheck, build, repository/documentation validation, sensitive scan, diff check). A WebMCP
Task must add the exact supported-browser command and evidence format; it must not relabel ordinary
tests as WebMCP proof.

## 8. Ownership, dispatch, and Worktree rules

- Main Thread owns the goal selection, architecture, tool contract acceptance, canonical writeback,
  source integration, and closure.
- One independent WebMCP product outcome receives one registered Task/File. WebMCP phases are not
  separate Tasks unless they produce independently valuable outcomes with separate ownership.
- A decision/proposal Task such as `RIGHTSPOT-010` cannot silently become an implementation Task. Its
  review disposition must precede a new implementation registration.
- Read-only Advisor, UX, security, and browser-capability analysis may run in parallel only when their
  read sets are stable. Shared contracts, navigation, global CSS, role/privacy boundaries, and
  integration are serialized.
- A Builder changes only its declared write set. A Verifier uses a frozen post-Builder source. Main
  documents may be updated only through the Main-thread reconciliation checkpoint.
- At most eight supporting tasks may be active. Transient SubAgents can provide disposable read-only
  analysis but cannot own implementation, integration, or canonical closure.
- A WebMCP adapter must not modify the outer Core, sibling applications, Cloud Receiver source, or
  deferred integration boundaries.

## 9. Stop, rollback, and reopen conditions

Stop the affected slice and return it for Main-thread review if any of the following occurs:

- the browser API, permissions, or origin-trial/flag behavior differs from the accepted contract;
- a tool requires a new authority, schema, workflow state, or data source not named in W1;
- a tool can be called outside its role, assignment, route, or authenticated session;
- private/internal/untrusted content crosses the declared result boundary;
- the page and tool disagree about the authoritative result or current state;
- a malformed, stale, unavailable, duplicate, or terminal case is silently accepted or retried;
- a read-only tool mutates state, or a mutation tool bypasses explicit user confirmation;
- registration remains stale after route/session/capability change;
- a worker changes forbidden/shared paths or source identity cannot be re-established; or
- the implementation needs a generic fallback, arbitrary SQL, external service, Cloud Receiver,
  deployment, or production-only assumption to appear complete.

The safe rollback is to remove or disable the page adapter and preserve the ordinary UI/API behavior.
Do not weaken tests, add a hidden compatibility branch, delete evidence, or broaden the task to make a
failed WebMCP claim pass.

Reopen the roadmap decision if WebMCP becomes a formal standard with materially different APIs, the
target browser/runtime changes, the selected user goal changes, the ordinary source authority changes,
or a new cross-origin/external integration is proposed.

## 10. Current next action

The current action is to complete [`RIGHTSPOT-042`](../Tasks/RIGHTSPOT-042-define-tenant-search-and-webmcp-search-contract.md)
as the W1 Main-thread contract gate for the selected Tenant Discovery Search goal. It must resolve the
Area discoverability/matching gap, freeze the supported criteria and result/error/page-state contract,
and reconcile the ordinary UI/API authority with the future read-only WebMCP adapter before any
implementation Task, dependency installation, WebMCP registration, route, schema, fixture, or Worktree
is created.

Until that review is accepted:

- `RIGHTSPOT-010` remains `pending` and `RS-WO-010-01` remains `READY_FOR_REVIEW`;
- `RIGHTSPOT-042` remains `pending` and `RS-WO-042-01` remains `PENDING_REVIEW`;
- no WebMCP implementation Work Order is active;
- ordinary RightSpot MVP behavior remains the only runnable product claim; and
- Cloud Receiver, WebRTC, Redis, external authentication, deployment, and production-readiness remain
  deferred or gated.

This roadmap is complete as a planning artifact only. It does not claim WebMCP readiness.
