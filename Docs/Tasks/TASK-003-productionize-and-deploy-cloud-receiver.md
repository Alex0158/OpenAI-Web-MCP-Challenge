# TASK-003: Productionize and Deploy Cloud Receiver

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-08-31

## Task Control

- Type: `implementation`
- Lifecycle: `pending`
- Priority: `P1`
- Owner: Alex and project team
- Current increment: Define the deployable Cloud Receiver shell contract and close its first
  application-neutral local production-readiness increment.
- Next gate: An accepted deployment-boundary decision and bounded Development record authorize a
  locally verified service shell without duplicating Receiver Core authority.
- Dependencies: Host-integrated runtime verification depends on TASK-001; public hosting, secrets,
  credentials, paid infrastructure, and deployment require their own current authority.

## 1. Objective

Turn the locally verified Receiver Core, durable persistence, HTTP mapping, and delivery contracts
into one deployable, domain-neutral Cloud Receiver service, then deploy and verify that exact source
without weakening the existing authority, durability, privacy, or failure semantics.

The Cloud Receiver remains a service boundary around the single Receiver Core authority. A selected
Host backend adapts its committed business transitions to the Cloud Receiver protocol; the Cloud
Receiver does not absorb application business rules.

## 2. Current gap and evidence

- `reentry-core/` locally verifies Receiver authority, SQLite durability, bounded Host-event and
  Connector HTTP mapping, separate-process behavior, and deterministic conformance.
- The current source does not provide a production TLS listener, hosted service process, production
  enrollment or Grant-control surface, deployment configuration, supported Connector pairing,
  operational readiness contract, or public Cloud Receiver deployment.
- Test child processes and the conformance profile are evidence scaffolding, not shipping services.
- The final Host application and Host-specific event, canonical page, WebMCP tools, and end-to-end
  continuation route remain governed by TASK-001.

Current claim ceiling: `separate_process_verified` for the named bounded test surfaces. No current
evidence supports `runtime_verified` or `deployed` for a Cloud Receiver service.

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
3. authenticated enrollment, Grant control, Host ingress, and Connector delivery surface;
4. durable storage, migration, restart, and failure recovery;
5. configuration, secret handling, health, readiness, logging, and operational limits;
6. local production-profile verification and independent Connector exercise;
7. exact-source deployment, external readback, and controlled synthetic flow; and
8. selected-Host integration after TASK-001 supplies the application contract.

Each increment must name the affected authority, negative and failure cases, verification level,
claim limit, stop condition, and reopen trigger. A later increment does not retroactively prove an
earlier gate.

## 4. Non-goals

This task does not:

- select or implement the Host application;
- put application-specific users, events, artifacts, state machines, prompts, or WebMCP tools into
  Receiver Core or the Cloud Receiver shell;
- create a second Local Receiver production authority or a hidden local fallback;
- add generalized workflow orchestration, speculative multi-tenancy, fleet management, or a broad
  administration platform;
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
