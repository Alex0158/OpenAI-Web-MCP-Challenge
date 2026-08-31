# TASK-003: Productionize and Deploy Cloud Receiver

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-08-31

## Task Control

- Type: `implementation`
- Lifecycle: `in_progress`
- Priority: `P1`
- Owner: Alex and project team
- Current increment: CLOUD-001 locally verified the loopback-only Stage 1 Cloud Receiver shell;
  prepare the bounded Stage 2 identity and consent decision without widening the shell first.
- Next gate: Accept one decision that freezes organization scope, Host-key enrollment, Receiver-owned
  consent sessions, Connector pairing, and credential custody before Stage 2 code begins.
- Dependencies: Host-integrated runtime verification depends on TASK-001; public hosting, secrets,
  credentials, paid infrastructure, and deployment require their own current authority.

## 1. Objective

Turn the locally verified Receiver Core, durable persistence, HTTP mapping, and delivery contracts
into one deployable, domain-neutral Cloud Receiver service, then deploy and verify that exact source
without weakening the existing authority, durability, privacy, or failure semantics.

The Cloud Receiver remains a service boundary around the single Receiver Core authority. A selected
Host backend adapts its committed business transitions to the Cloud Receiver protocol; the Cloud
Receiver does not absorb application business rules.

The current product direction is an application-neutral backbone that can later serve any compatible
Host website. TenderRelay is not part of this implementation scope. The first proof should use one
generic Host, one organization, one Connector, and a deterministic or fake Agent.

## 2. Current gap and evidence

- `reentry-core/` locally verifies Receiver authority, SQLite durability, bounded Host-event and
  Connector HTTP mapping, separate-process behavior, and deterministic conformance.
- The current source does not provide a production TLS listener, hosted service process, production
  enrollment or Grant-control surface, Browser SDK or consent UI, organization/API-key control
  plane, deployment configuration, supported Connector pairing, operational readiness contract, or
  public Cloud Receiver deployment.
- Test child processes and the conformance profile are evidence scaffolding, not shipping services.
- The final Host application and Host-specific event, canonical page, WebMCP tools, and end-to-end
  continuation route remain governed by TASK-001.

Current claim ceiling: `separate_process_verified` for the named bounded test surfaces. No current
evidence supports `runtime_verified` or `deployed` for a Cloud Receiver service.

### 2.1 Working planning direction

The following summarizes the direction agreed in the 2026-08-31 planning discussion. It is a
working implementation constraint, not a replacement for Core, Mechanism, or ADR authority; any
durable contract change still requires an accepted ADR and a bounded Development record.

- Start as one modular service with logical control-plane functions (accounts, organizations, and
  keys) and Receiver data-plane functions; do not begin with separate microservices.
- The Host backend sends signed Manifests and Events. Organization credentials and Host signing
  keys remain server-side. The Browser SDK receives only a short-lived, one-time consent token.
- The Host page's Browser SDK opens the consent experience in a top-layer UI. The Receiver owns the
  consent decision and returns only an opaque Host `binding_id`; private Grants and managed-context
  details remain in the Receiver boundary.
- The Local Connector reaches the Receiver through outbound polling and short leases. The Cloud
  Receiver does not assume it can push into a user's laptop or loopback port.
- The Host owns business truth and verifies the business effect. Receiver event acceptance, Agent
  activation, and acknowledgement remain separate facts.
- The first vertical slice proves `manifest -> consent -> Grant -> event -> Connector claim ->
  Agent activation -> Host effect -> acknowledgement`. Dashboard, billing, broad multi-tenancy,
  real Codex activation, and final Host selection remain later or separately governed work.

The short protocol note must freeze the credential boundaries, message states, consent handoff,
organization scoping, delivery retry semantics, and acknowledgement meaning before production
implementation begins.

## 3. Required implementation boundary

The task must preserve these constraints:

1. reuse the existing Receiver Core rather than implementing a second Cloud-specific authority;
2. keep Host business truth and domain policy in the Host application and Host backend;
3. expose only authenticated, bounded Host-event, Grant-control, Connector claim, and effect-
   acknowledgement operations required by the selected deployment contract;
4. use durable storage with explicit migration, restart, backup or remediation, and no silent
   in-memory fallback;
5. validate configuration and secrets at startup and keep bearer values, raw managed-context
   locators, private task identifiers, and sensitive payloads out of logs and public errors;
6. define health, readiness, graceful shutdown, request limits, correlation, and observable failure
   behavior without treating them as product success evidence; and
7. keep the Local Connector outbound-only and unable to issue Grants, reinterpret Host truth, or
   widen continuation authority.

### 3.1 Coherent increments

Implementation should proceed through bounded records rather than one undifferentiated deployment
patch:

1. deployment topology, identity, storage, ingress, and source-placement decision;
2. production service process and startup or shutdown contract;
3. authenticated enrollment, Receiver-owned consent and Grant control, Host ingress, Browser SDK
   handoff, and Connector delivery surface;
4. durable storage, migration, restart, and failure recovery;
5. configuration, secret handling, health, readiness, logging, and operational limits;
6. local production-profile verification and independent Connector exercise;
7. exact-source deployment, external readback, and controlled synthetic flow; and
8. selected-Host integration after TASK-001 supplies the application contract.

Each increment must name the affected authority, negative and failure cases, verification level,
claim limit, stop condition, and reopen trigger. A later increment does not retroactively prove an
earlier gate.

### 3.2 Parallel implementation registration

TASK-003 remains the single Cloud Receiver task while the work is being planned. A parallel
implementation stream for the user or Alex must be registered as a new bounded Task before work
starts when it has its own owner, affected paths, dependency, and completion gate. The new Task must
link back to TASK-003; TASK-003 must retain only the cross-stream dependency and next-gate summary.

No new parallel implementation Task is registered by this update because the owner and exact
bounded increments have not yet been accepted.

## 4. Non-goals

This task does not:

- select or implement the Host application;
- put application-specific users, events, artifacts, state machines, prompts, or WebMCP tools into
  Receiver Core or the Cloud Receiver shell;
- create a second Local Receiver production authority or a hidden local fallback;
- deliver a full multi-tenant control plane, dashboard, billing, fleet management, or broad
  administration platform in the first vertical slice; eventual organization and API-key support
  remains a product direction, not a first-slice completion requirement;
- claim real Codex activation, Browser acquisition, genuine page-bound WebMCP re-entry, product
  value, judge reproducibility, or submission completion from Receiver deployment alone; or
- authorize public hosting, credentials, paid infrastructure, production data, or external mutation
  merely because this task is registered.

## 5. Verification and closure

Move to `verification_pending` only when the exact deployment candidate and its local production
profile have passed the registered focused, aggregate, restart, failure, and package checks.

Close at `deployed` only when current evidence proves:

- the deployed runtime is bound to one exact source commit and reviewed configuration;
- HTTPS ingress, health, readiness, startup validation, and graceful shutdown work in the named
  environment;
- durable Receiver state survives a controlled restart and required migration or remediation paths
  are exercised;
- authenticated synthetic Host events can be accepted and independently claimed by an authorized
  Local Connector;
- effect acknowledgement, duplicate event, revocation, stale lease, invalid credential, storage
  failure, and acknowledgement-loss behavior remain bounded and fail closed;
- tracked artifacts and public diagnostics contain no secret, bearer token, raw managed-context
  locator, mutable production database, or unredacted sensitive trace;
- code, tests, Core status, validation evidence, Development records, and deployment readback agree
  on the exact claim boundary; and
- selected-Host integration, real Agent activation, Browser/WebMCP acquisition, judge reproduction,
  and submission remain explicitly unverified unless separately proven.

## 6. Reopen condition

Reopen if deployed behavior diverges from Receiver Core semantics, durable state or authentication
fails under restart or delivery loss, the selected Host requires Cloud Receiver domain policy, the
deployment cannot preserve the no-fallback boundary, or new evidence invalidates the recorded
identity, storage, ingress, or failure model.
