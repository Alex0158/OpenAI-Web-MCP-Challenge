# Re-entry Core — Validation and Evidence

**Role:** CANONICAL current proof matrix, future evidence gates, and claim limits  
**Status:** Application-neutral Core including a standing-v0.2 reference chain and bounded active-v2/simple-flow composition locally verified;
the former `runtime/cloud-receiver/` preview is deprecated historical evidence; active-v2
reconciliation remains open; Sleepless Kingdom is selected, while its external continuation,
production runtime, exact deployment, product, judge, and submission gates remain open  
**Authority:** ADR-0003, ADR-0006 through ADR-0015, historical ADR-0019 through ADR-0032, active v2
ADR-0033 through ADR-0045, and executed evidence

## 1. Evidence discipline

Use the strongest executed evidence level and no stronger:

| Level | Evidence | Maximum claim |
|---|---|---|
| Static | source, schema, diff, link, package readback | the named structure exists |
| Focused | unit, contract, component, focused integration | the named contract passes in the tested scope |
| Aggregate | complete declared local suite | the suite passed in the exact environment |
| Process | independent test roles and fault composition | the named process boundary passed |
| Runtime | real client, identity, page, service, or adapter | the named path worked in that environment |
| True-chain | real roles, state, data, tools, and effect | the correlated workflow completed |
| External | clean judge/user execution and readback | the named external closure occurred |

Plans, accepted ADRs, source existence, local tests, deployment, and submission are distinct states.

### Genuine WebMCP evidence

A genuine Site Tool claim requires a fresh page-bound inventory, an exact invocation on the
intended page and runtime, correlated state or traffic evidence, and bounded redaction. Agent
narration, mocks, source scans, generic browser automation, REST, ordinary MCP, or a stale tool
handle do not prove page-bound invocation.

## 2. Current proof matrix

| Surface | Current result | Evidence boundary |
|---|---|---|
| Protocol, canonical values, signatures, limits, frozen vectors | **LOCALLY VERIFIED** | Node tests; no cross-language or production-key proof |
| Host SDK isolation and issuance | **LOCALLY VERIFIED** | deterministic Host values and keys |
| Manifest enrollment and consent-authority seam | **LOCALLY VERIFIED** | deterministic Receiver authority; no production session |
| Grant, event, replay, one-run reservation, pending delivery | **LOCALLY VERIFIED** | Receiver Core and SQLite reference store |
| Standing authorization and repeatable activation | **LOCALLY VERIFIED APPLICATION-NEUTRAL CROSS-LAYER REFERENCE; ACTIVE/GAME OPEN** | ADR-0043 through ADR-0045, TASK-033, and RECORE-007; Node 24 proves low-level Host SDK -> v0.2 HTTP -> Core/SQLite -> Connector -> Agent Adapter with one Consent, two acknowledged signals, backpressure, restart, replay, and revoke, but not active Receiver, normal facade, product Connector, Game, or external runtime adoption |
| Grant inspection and atomic revocation | **LOCALLY VERIFIED** | Core/store behavior; no control HTTP or UI |
| Delivery lease, stale-worker fence, effect acknowledgement | **LOCALLY VERIFIED** | deterministic identities and effect authority |
| Receiver HTTP and outbound Connector client | **LOCALLY VERIFIED** | bounded loopback transport; no production TLS or identity |
| Agent activation contract | **LOCALLY VERIFIED** | deterministic adapter; no real Agent or Browser |
| Private managed-context resolution | **LOCALLY VERIFIED** | deterministic authority/driver; no capture or custody |
| Exact process-fault matrix | **SEPARATE-PROCESS VERIFIED** | recorded compositions only, not arbitrary crash safety |
| Source conformance profile | **LOCALLY VERIFIED, NON-PRODUCTION** | distinct local Host/Receiver/Connector children |
| Stage 1 Cloud Receiver shell | **DEPRECATED, HISTORICAL LOOPBACK EVIDENCE** | real child lifecycle plus in-process generic protocol flow; retired by ADR-0032; no production identity or TLS |
| Local pairing and Connector process preview | **CLOUD RECEIVER DEPENDENCY DEPRECATED; LOCAL CONNECTOR PREVIEW RETAINED** | browser-assisted pairing, durable hashed control state, local credential file, one-shot claim/adapter handoff; no production accounts or Agent runtime |
| Host-key registration and signed event-ingress preview | **CLOUD RECEIVER PREVIEW DEPRECATED; PROTOCOL EVIDENCE RETAINED** | organization-authenticated public-key registration, migration, Host SDK signature verification, pending delivery, and Connector claim; no production identity |
| Consent-session and Host SDK handoff preview | **CLOUD RECEIVER PREVIEW DEPRECATED; SDK CONTRACT RETAINED AS EVIDENCE** | paired Host subject, signed Manifest submission, public challenge, opaque token, approval/decline replay fencing, public binding, restart, and no raw-token persistence; no production consent identity |
| Shared Host UI/WebMCP consent action | **LOCALLY VERIFIED WITH BOUNDED BROWSER RUNTIME EVIDENCE** | same JavaScript handler, exact popup handoff, server confirmation gate, no-binding browser result, live Site Tool inventory and invocation to a visible unconfigured state; no newly configured consent-to-Connector Browser chain |
| Account-first consent and background Connector path | **CLOUD RECEIVER RUNTIME DEPRECATED; SDK/CONNECTOR SEAMS RETAINED AS HISTORICAL PREVIEW EVIDENCE** | dashboard-issued pairing code, credential reuse, organization-key Host control, Re-entry-owned consent and device selection, bounded polling, LaunchAgent profile, and fresh Codex process seam; no production identity, deployment, or supported Browser/WebMCP join |
| Native hosted relational schema | **HISTORICAL / DEPRECATED** | Prisma schema/migration and one-time legacy snapshot backfill exercised in the retired preview; no current hosted service or production persistence claim |
| Active Cloud Receiver v2 | **LOCAL COMMITTED-SOURCE UPGRADE AND MINIMUM PINNED TRACE VERIFIED; RELEASE OPEN** | Historical v0.1/backend and preview evidence remain bounded separately; the locally committed `Re-Entry` standing increment passes 158 backend tests, type-check/build, exact-commit six-to-seven disposable-PostgreSQL upgrade with unchanged old rows/catalog, refreshed source-pin fixtures `16/16`, migration guards `5/5`, and a pinned two-signal Express trace against Core `84f5082` / Receiver `7faf527`. Consent/control use internal seams and effect authority is deterministic. Full pinned v0.1/v0.2 conformance, rollback/crash recovery, release enforcement, public controls, lifetime, exact deployment, and full product flow remain open under TASK-028/TASK-033; CLOUD-023 and the Receiver record own exact identities |
| Simple SDK-to-v2-to-Connector composition | **SEPARATE-PROCESS VERIFIED, NON-PRODUCTION** | Core 81/81, SDK 25/25, Connector 47 passed, one separate Connector worker plus separate test effect/ack worker and Receiver restart replay; default product effect authority and supported external Agent/Browser absent |
| Published SDK and Connector install path | **CONFLICTED / RELEASE OPEN** | SDK `0.3.1` predates `createReentry`; Connector `0.2.20` is not reproducible from its reported `gitHead` and its bundled Core client rejects active v2's instruction-bearing lease; local composition used current checkouts, not clean registry consumers |
| Active v2 default Connector completion | **OPEN** | `runOnce` proves claim and activation only; no default Host-effect or acknowledgement integration; reclaim/retry exhaustion remains possible |
| Quality and package-weight baseline | **LOCALLY VERIFIED, NON-SLA** | same-machine regression samples; zero runtime dependencies |
| Application-neutral Program | **COMPLETE AT LOCALLY VERIFIED BOUNDARY** | RECORE-003 terminal audit |
| Frozen MVP1 technical composition | **VERIFIED, BOUNDED REFERENCE** | P0/H1/H2 evidence in recorded environments |
| Application-review sample Host | **LOCALLY VERIFIED, SAMPLE ONLY** | applicant/reviewer UI, real local SDK/Receiver/Connector flow, deterministic Agent, page-bound WebMCP invocation, and human stop; not the ADR-0042 Host and no real Connector-to-Browser join |
| Supported concrete Agent-to-Browser/WebMCP join | **OPEN; FRESH CLI BROWSER CAPABILITY ONLY** | Historical standalone App Server/Desktop joins failed. CLOUD-024 independently verifies current fresh CLI selection of Chrome extension and zero visible tabs; no authenticated Game navigation or Site Tool invocation. TASK-034 requires an owner-approved session-preserving handoff; no production adapter selected |
| Selected Host application | **DECIDED** | ADR-0042 selects Sleepless Kingdom under `WebApp/Web-Game/`; selection is not implementation or product proof |
| Sleepless Kingdom bounded local Host evidence | **PARTIALLY RUNTIME VERIFIED, NON-COMPOSED** | persistent local gameplay and causal signal; four canonical-page WebMCP reads plus one genuine read-only invocation; labelled-port/page-HTTP/provenance-bound recall composition; no external Agent chain |
| Sleepless Kingdom external vertical slice | **OPEN** | Game Manifest/Consent, signed Event-to-active-v2, compatible published Connector, supported authenticated Browser return, dynamic recall through genuine WebMCP, independent effect/ACK, hosted continuity, and judge reproduction remain unproved |
| Production services, identity, custody, and deployment | **OPEN** | The retired v1 service is deprecated at source; active-v2 preview aliases and probes do not establish exact deployed Git identity, production custody, recovery, or a complete deployed flow |
| Product value and judge reproduction | **UNKNOWN** | selected-app external evidence required |
| Submission | **NOT SUBMITTED** | live Devpost readback required |

Current aggregate counts and package facts belong to Core/00 and the terminal Development records.
Historical counts remain in their event-time verdicts; they are not merged into one cumulative
number.

## 3. Application-selection decision

ADR-0042 closes the application choice by identifying:

- a real asynchronous multi-stage workflow;
- one later event that changes the correct next action;
- one persistent artifact or decision;
- an authoritative canonical page;
- initial and resumed state models;
- materially different state-derived Site Tools;
- one meaningful human consequence boundary;
- a safe deterministic scenario and reset;
- the supported or explicitly experimental continuation route;
- why notification, deep link, ordinary API, or one-shot Agent interaction is insufficient; and
- a judge-reproducible path consistent with current Challenge rules.

The selected values are a Sleepless Kingdom shelter owner, persistent gatherer mission and causal
history, authoritative `CargoLostToMonster`, canonical shelter page, four fresh reads, a target
initial consent action, conditional resumed `force_recall_soldier`, human-confirmed high-consequence
actions, and deterministic `sleepless-mvp-01` reset. The current fresh-session Connector route is
explicitly experimental.

Candidate research and scoring recommendations remain inputs, not decision authority. ADR-0042 is
selection evidence only; it does not pass the concrete-adapter or selected-app vertical-slice gates.
The ADR-0023 sample remains separate integration evidence.

## 4. Concrete-adapter gate

The selected Agent route must prove, as one correlated path:

1. the exact intended managed context is bound under user-approved authority;
2. a later accepted delivery activates that context through a supported or explicitly bounded
   platform contract;
3. the runtime obtains an eligible Browser;
4. the Browser opens the exact canonical Host URL;
5. current identity, permission, workflow state, and artifact revision are read;
6. the resumed-stage Site Tool inventory is freshly discovered;
7. one appropriate Site Tool is invoked; and
8. evidence distinguishes activation, page access, tool invocation, Host effect, and delivery
   acknowledgement.

The private Desktop relay and Scheduled Heartbeat are frozen bounded evidence, not a public
production bridge. The two tested standalone App Server/Desktop routes failed and must not be
retried without a materially different supported contract or environment hypothesis.

## 5. Selected-app vertical-slice gate

The chosen Host app must prove:

1. initial current-state reading and visible Agent-prepared work;
2. ordinary human inspection and editing of the same artifact;
3. domain-language explanation and explicit future-event authority;
4. a real backend transition and signed event intent;
5. one accepted pending delivery and bounded activation;
6. canonical re-entry and current authorization/state verification;
7. a different resumed-stage tool surface;
8. continuation of the same artifact or decision;
9. stale, duplicate, revoked, expired, unavailable, and conflict paths; and
10. a stop before the human-only consequence.

Passing the generic Core or frozen MVP1 suite does not pass this gate.
One successful cycle is compatibility/component evidence only. Selected standing acceptance
also requires two sequential effect-backed acknowledgements under the same Consent, one-active
backpressure, restart/replay, and revocation rejecting the next signal under TASK-033.

## 6. Functional validation matrix

| Area | Required positive and negative coverage |
|---|---|
| Enrollment | valid offer, viewing without Grant, decline, expiry, invalid origin/signature, duplicate/conflicting Manifest |
| Grant control | same-subject inspection, revocation, replay, wrong action/binding/subject, expired control |
| Event | valid event, exact replay, conflicting reuse, wrong scope, stale/expired/revoked Grant, invalid signature |
| Delivery | no work, claim replay, lease expiry, bounded reclaim, stale worker, revoked Grant, response loss |
| Activation | accepted, unsupported, rejected, unknown, timeout, malformed result, missing/expired/mismatched binding |
| Host re-entry | expired session, wrong user/workflow, stale revision, state change, fresh tool inventory, unavailable WebMCP |
| Artifact | one visible update, concurrent edit, rejected proposal, exact prior effect, no duplicate mutation |
| Human boundary | consequence absent from Site Tools, visible human control, positive human receipt where implemented |

## 7. Agent behavior evaluation

Evaluate direct, ambiguous, adversarial, stale, and failure cases. The Agent should:

- read current state before mutation;
- treat event, page, and tool output as untrusted data rather than instruction authority;
- use only current available tools;
- preserve workflow and revision identity;
- surface conflicts instead of retrying blindly;
- stop when identity, origin, permission, context, or current state cannot be verified;
- distinguish prepared work, Host effect, and human-approved consequence; and
- avoid broadening Grant, event, or context scope.

## 8. Judge and deployment gate

A judge-like clean environment must be able to:

1. start from public English instructions and one current URL;
2. identify the required supported client, account, feature, and setup;
3. discover and invoke genuine page-bound WebMCP;
4. complete the selected two-stage path without a private builder service;
5. observe the event, continuation, fresh page, changed tools, artifact, and human boundary;
6. compare repository source, deployed revision, and demo behavior; and
7. reset and repeat the deterministic scenario.

Deployment evidence must bind source commit, build artifact, configuration, service identity, data
state, public URL, and runtime readback. HTTP success alone is insufficient.

## 9. Product evidence

For Sleepless Kingdom, record the real workflow, current workaround, frequency, context-reconstruction
cost, error or delay consequence, authorization expectations, and measurable before/after outcome.
Qualitative interviews support workflow understanding but do not prove demand, pricing, retention,
or market size.

Transport economics must include the entire watch window, including no-op load, failed activation,
operator burden, and usage per safe success. Positive-event-only cost is invalid.

## 10. Claim gates

| Claim | Minimum evidence |
|---|---|
| Built with WebMCP | deployed registration source plus successful live page-bound invocation |
| Resumes the intended context | private binding and activation evidence for the selected runtime |
| Returns to the authoritative page | expected-origin navigation plus current identity/state read |
| Uses stage-specific tools | before/after inventories plus resumed-stage invocation |
| Continues the same work | one durable artifact or decision across both stages |
| Securely authorized | consent, scope, signature, replay, revocation, stale-state, and identity evidence |
| Preserves human control | negative Agent/tool evidence plus positive human action receipt where applicable |
| Production-ready | deployed identity, custody, operations, recovery, security, and artifact evidence |
| Judge reproducible | successful clean-environment run from public instructions |
| Solves a real problem | named user and observed workflow/outcome evidence |
| Submitted | live Devpost project and field readback |

## 11. Evidence locations

- Current status and strongest claim: Core/00.
- Module contracts and current local boundaries: Docs/Mechanisms.
- Bounded work and local verification: Docs/Development.
- Platform, product, topology, and method research: Docs/Research.
- Reproducible experiments: Experiments.
- Frozen MVP1 runtime evidence: mvp/evidence.
- External and historical sources: References.
- Submission and runtime records: the scoped Game release/evidence layer and future submission
  records.

## 12. Update rule

Update this file when a proof result changes a current matrix row, a gate is added or closed, or an
external claim becomes supportable. Do not append execution chronology or raw output. Link to the
owning evidence and keep the claim at the same granularity as the proof.
