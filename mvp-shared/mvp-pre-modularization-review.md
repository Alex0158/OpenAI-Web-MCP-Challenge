# MVP Pre-Modularization Architecture Review

**Role:** SHARED SUPPORTING review between [`mvp/`](../mvp/) and
[`mvp2/`](../mvp2/)  
**Status:** Advisory only; no MVP source, runtime, test, evidence, Core document, or ADR is
changed by this report  
**Reviewed:** 2026-08-30, Europe/London  
**Review baseline:** `codex/mvp2-tenderrelay` at
`a2e83f226b3142b70864e90def9daefb986e63b2`  
**MVP tree:** `2b73fb4e4e0aa2158fab3d1177a1d22e3cf6c680`, identical on the review baseline and
`origin/main`  
**Audience:** Alex, the project team, and the Codex session that may later modularize MVP

## 0. Scope and reading rule

This is a pre-implementation review. It records what MVP already does well, where its
current modules remain coupled, which MVP2 patterns are worth reusing, and a safe extraction
sequence. It deliberately does not modify or reorganize `mvp/`.

The accepted architecture and evidence boundaries remain controlled by:

1. [`Core/03-system-design.md`](../Docs/Core/03-system-design.md)
2. [`Core/04-trust-security-reliability.md`](../Docs/Core/04-trust-security-reliability.md)
3. [`ADR-0002`](../Docs/Decisions/ADR-0002-separate-mechanism-from-demo-app.md)
4. [`ADR-0003`](../Docs/Decisions/ADR-0003-freeze-p0-technical-validation-mvp.md)
5. [`ADR-0004`](../Docs/Decisions/ADR-0004-separate-event-protocol-from-agent-transport.md)
6. [`ADR-0005`](../Docs/Decisions/ADR-0005-run-additive-durable-enrollment-spike.md)

This report does not silently promote a new architecture decision. Any change to wire
contracts, authority, deployment topology, or the frozen P0 proof should first be accepted
through the repository's ADR process.

Evidence labels used below:

| Label | Meaning |
|---|---|
| **OBSERVED** | Directly present in reviewed source, tests, or tracked evidence |
| **STRENGTH** | Existing behavior that should be preserved through extraction |
| **RISK** | Coupling or gap that can create incorrect reuse, drift, or a false claim |
| **RECOMMENDATION** | Proposed future work; not implemented by this report |

## 1. Executive judgment

MVP should be modularized, but it should not be rewritten in place as one large change.

The safest strategy is:

> Keep the current `mvp/` fixture as the behavioral and evidence oracle, extract reusable
> modules additively behind compatibility wrappers, and prove parity after every seam is
> moved.

MVP is the strongest source for correctness, durability experiments, private context
binding, optimistic concurrency, effect idempotency, crash testing, and evidence discipline.
MVP2 is the stronger source for explicit Host Adapter composition, strict protocol artifacts,
test vectors, a second-domain portability proof, and an external HTTP sender demonstration.

The future infrastructure should combine those strengths:

```text
MVP authority and durability
  + MVP2 modular contracts and portability proof
  + one selected Host application
  + one explicitly classified Agent transport
  = strongest hackathon architecture
```

The important boundary is not “MVP versus MVP2.” It is:

```text
Host business authority
    -> versioned signed event protocol
    -> Receiver grant and delivery authority
    -> replaceable Agent runtime adapter
    -> fresh canonical page and current Site Tools
```

The current MVP already contains most of these concepts. Its main problem is that they are
still joined by fixture constants, a shared database, one composition server, and mode
branches that make the conceptual boundaries weaker than the code's correctness controls.

## 2. What must be preserved from MVP

Modularization is successful only if it preserves the properties below. These are more
valuable than achieving a visually clean folder tree.

### 2.1 Receiver-owned context and Grant authority

- **STRENGTH:** [`GrantService`](../mvp/src/receiver/grants.mjs) asks the selected adapter to
  capture the current managed context; enrollment rejects caller-supplied raw context IDs.
- **STRENGTH:** The Receiver stores the managed context privately and returns an opaque
  workflow binding.
- **STRENGTH:** A short-lived capture handle is stored only as a digest and is consumed once.
- **STRENGTH:** The manifest, capture, challenge, Grant, and later event share a bounded flow
  correlation without treating the correlation ID as a credential.

The future core must not regress to a Host-provided task ID or let a Website Backend select
the managed Agent context.

### 2.2 Fail-closed event handling

- **STRENGTH:** [`EventReceiver`](../mvp/src/receiver/events.mjs) verifies the detached HMAC
  before parsing the event.
- **STRENGTH:** The event body has an exact field allowlist and no prompt field.
- **STRENGTH:** The Receiver checks Grant status, expiry, run budget, workflow, event type,
  canonical URL, state version, and opaque binding.
- **STRENGTH:** An exact replay returns the recorded logical run; the same event ID with a
  different raw payload conflicts.
- **STRENGTH:** Run reservation and Grant-budget consumption occur in one SQLite transaction.

These controls belong in domain-neutral Receiver code, not in a demo application.

### 2.3 Host state and effect correctness

- **STRENGTH:** [`WorkflowDomain`](../mvp/src/domain.mjs) uses conditional SQL updates for
  state transitions, artifact revisions, and the human commit race.
- **STRENGTH:** [`H1ContinuationService`](../mvp/src/h1-continuation.mjs) binds one accepted
  delivery ticket to one semantic Host effect.
- **STRENGTH:** The same event plus the same request returns the original effect; the same
  event plus a different request conflicts.
- **STRENGTH:** The Host mutation and effect ledger row commit in one transaction.

The extracted infrastructure should retain state-version checks, artifact revisions,
idempotency identities, request hashes, and result receipts as separate concepts.

### 2.4 Durable enrollment learning from H2

- **STRENGTH:** [`DurableEnrollmentService`](../mvp/src/receiver/durable-enrollment.mjs)
  atomically persists the decided challenge, non-active Grant, non-active Inbox, and sealed
  receipt outbox.
- **STRENGTH:** A stable dispatch ID, lease token, authority fence, and idempotent destination
  survive acknowledgement loss and process termination.
- **STRENGTH:** The Grant is not active until the receipt is durably delivered and the exact
  Host binding is acknowledged.
- **STRENGTH:** Ciphertext is authenticated, bound to enrollment identity, and purged after
  acknowledgement.
- **STRENGTH:** Real `SIGKILL` and concurrent-process tests exercise commit boundaries rather
  than only throwing exceptions inside one process.

H2 is currently an additive opt-in spike, but its lifecycle is the best starting point for
the future default enrollment core. The legacy P0/H1 activation path should remain only as a
compatibility profile while extraction is underway.

### 2.5 Genuine WebMCP and evidence discipline

- **STRENGTH:** [`public/app.js`](../mvp/public/app.js) derives the Site Tool inventory from
  authoritative state and uses `AbortSignal` to retire stale stage tools.
- **STRENGTH:** The commit action is visibly available to the human but absent from the Site
  Tool inventory.
- **STRENGTH:** The adapter results distinguish synthetic, Q3-only, and current-build Desktop
  evidence rather than treating every dispatch as proof of re-entry.
- **STRENGTH:** Correlated evidence and explicit nonclaims prevent a local fixture result from
  being presented as a public production contract.

The evidence classification is part of the architecture and must survive modularization.

## 3. Current architecture map

The existing code has useful file-level modules, but the runtime is one close-coupled
composition:

```text
Browser page and Site Tools
  mvp/public/app.js
           |
           v
One HTTP server and composition root
  mvp/src/server.mjs
           |
           +--> Host workflow domain
           |      mvp/src/domain.mjs
           |      mvp/src/h1-continuation.mjs
           |
           +--> Receiver authority
           |      grants.mjs
           |      events.mjs
           |      heartbeat-inbox.mjs
           |      durable-enrollment.mjs
           |
           +--> Agent runtime adapters
           |      fixture
           |      App Server
           |      Desktop task/private relay
           |
           +--> trace and protocol helpers
           |
           v
One primary SQLite database
  Host tables + Receiver tables + adapter-context tables

H2 additionally uses one separate synthetic destination SQLite database.
```

Approximate reviewed implementation size:

| Area | Tracked files/lines observed |
|---|---:|
| `mvp/src/` | 26 modules, 5,636 lines |
| `mvp/test/` | 14 files including fixtures, 3,426 lines |
| `mvp/scripts/` | 837 lines |
| `mvp/public/` | 615 HTML/CSS/JavaScript lines |
| `mvp/evidence/` | 42 tracked evidence files |

This is large enough that a single “clean architecture” rewrite would carry unnecessary
regression and provenance risk.

## 4. What is already modular

The following seams should be retained and clarified, not discarded:

| Current seam | What is good | What still needs extraction |
|---|---|---|
| `src/receiver/` | Grant, event, Inbox, and durable-enrollment concerns are named separately | They still import fixture constants and access Host tables directly |
| `src/adapters/` | Multiple Agent runtime routes sit behind a common class | The contract includes test-only methods and transport-specific proof fields |
| `src/domain.mjs` | Host state and SQL CAS are centralized | It is a hard-coded single Host implementation rather than a Host Adapter |
| `src/reentry-ticket.mjs` | Strict compact ticket/receipt claims and constant-time signature checks | It is H1-specific and not packaged as a versioned protocol artifact |
| `src/database.mjs` | Durable SQLite schema and explicit transactions | Host, Receiver, delivery, and adapter persistence share one migration module |
| `src/trace.mjs` | Correlated structured records | Redaction is optional and storage is a synchronous fixture JSONL sink |
| `public/app.js` | Genuine stage-derived tools and stale-tool abortion | Lifecycle code and P0 tool definitions are mixed in one browser file |
| `src/server.mjs` | One explicit composition root makes the fixture runnable | Composition, HTTP routing, trust zones, and experimental profiles are mixed |

The correct goal is to make these seams enforceable through dependency direction and
contracts, not merely to move each current file into a new directory.

## 5. Coupling and design observations

### 5.1 Fixture constants flow through every layer

**OBSERVED:** [`config.mjs`](../mvp/src/config.mjs) defines `WF-001`, `INITIAL`, `READY`,
`WORKFLOW_READY`, and `COMMIT_ARTIFACT`. Those constants are imported by the Host domain,
manifest code, Grant service, Event Receiver, heartbeat Inbox, H1 Host effect, H2 enrollment,
Agent adapters, and HTTP server.

**RISK:** A second business domain cannot plug in without changing Receiver and adapter
code. A folder split alone would preserve this coupling.

**RECOMMENDATION:** Replace deep fixture imports with injected data contracts:

- a Host Adapter owns workflow states, artifacts, event semantics, canonical URLs, and human
  boundaries;
- Receiver policy owns permitted protocol versions, origins, issuers, limits, and Grant
  lifecycle;
- Agent adapters receive a validated Grant/event delivery object and know nothing about
  `WF-001`.

### 5.2 Host and Receiver authority share one database

**OBSERVED:** [`database.mjs`](../mvp/src/database.mjs) creates `workflows`, manifests,
challenges, captures, Grants, Host bindings, adapter contexts, events, runs, heartbeat
deliveries, Host effects, and the H2 enrollment outbox in one primary store.

**RISK:** The code preserves privacy by response shaping and convention, but the physical
store does not demonstrate least-privilege separation between Host and Receiver. A future
Host plugin could accidentally query Receiver-private managed context data.

**RECOMMENDATION:** Define separate Host and Receiver repository contracts first. They may
still use one SQLite process in a bounded demo, but they should use separate schemas or
connections and must not share repository objects. A split-process conformance test should
later prove that neither side requires direct access to the other's tables.

### 5.3 The Receiver directly validates Host fixture state

**OBSERVED:** `EventReceiver.validateGrantAndState()` queries the `workflows` table and
requires the literal `READY` state and matching state version.

**RISK:** This is correct for the single-process fixture but prevents an independently
deployed Receiver from remaining domain-neutral. A third-party Receiver should not need the
Host's private database or know every domain state name.

**RECOMMENDATION:** Make field authority explicit:

1. the Host validates an external business fact;
2. the Host commits its state transition and event intent atomically;
3. the Receiver authenticates the Host-issued event and checks it against the Grant;
4. the freshly opened Host page revalidates current business state before any effect.

If a deployment requires Receiver-side Host introspection, use an authenticated Host
introspection port. Do not use shared SQL access as the contract.

### 5.4 Host transition and business-event delivery are not durable together

**OBSERVED:** `WorkflowDomain.transitionToReady()` conditionally updates the workflow and
returns an event object in memory. Trigger scripts then sign and POST that object. There is
no Host business-event outbox table in the P0 or H1 path.

**RISK:** A crash after the Host state transition and before event submission loses the
continuation event. H2's outbox protects enrollment-receipt delivery, not Host business-event
delivery.

**RECOMMENDATION:** The selected Host Adapter must commit the domain transition and a stable
event-intent/outbox row in one Host transaction. A separate relay signs and delivers that
intent at least once. This is a higher-priority reliability seam than reorganizing folders.

### 5.5 Delivery is selected inside Receiver event logic

**OBSERVED:** `EventReceiver` branches on `deliveryMode`. Adapter mode calls
`adapter.resumeContext()` synchronously; heartbeat mode inserts an Inbox delivery and returns.

**RISK:** Push, pull, queue, and future connector transports cannot be replaced without
changing Receiver event orchestration. The direct path also consumes the one-run budget
before an external adapter call and has no retry lease or acknowledgement recovery.

**RECOMMENDATION:** Introduce a `RunDeliveryStrategy` or equivalent port after durable run
reservation. Every strategy should receive the same immutable delivery job and produce the
same lifecycle states. Suggested strategies are:

- fixture immediate delivery;
- durable Inbox/pull delivery;
- private current-build Desktop demo delivery;
- future paired connector or supported public platform adapter.

The Receiver must not know whether the Agent is reached by push, pull, schedule, queue, or a
hosted runtime.

### 5.6 Enrollment has two competing lifecycle implementations

**OBSERVED:** `GrantService.approveChallenge()` performs an external receipt write between
`ACTIVATING` and `ACTIVE`. H2 implements a stronger transactional outbox and
`AWAITING_RECEIPT -> AWAITING_HOST_BINDING -> ACTIVE` sequence.

**RISK:** Continuing both as peer implementations will duplicate policy and let fixes land
in only one path. The default path can remain stuck after acknowledgement loss while H2 is
recoverable.

**RECOMMENDATION:** Treat the H2 lifecycle as the future core contract. Preserve P0/H1
behavior through a compatibility adapter until parity is proven, then classify the direct
activation path as legacy fixture behavior rather than a second architecture.

### 5.7 The Agent adapter contract mixes production and fixture concerns

**OBSERVED:** [`AgentContinuationAdapter`](../mvp/src/adapters/adapter-contract.mjs) includes
`ensureTestContext()`, and `assertAdapterResult()` requires a private
`managed_context_id` in the adapter result. The Receiver later redacts selected fields.

**RISK:** Test setup becomes part of the reusable runtime interface, and private identity is
required to travel farther than necessary.

**RECOMMENDATION:** Split the contracts:

- `ManagedContextCapture` for trusted context discovery;
- `EnrollmentReceiptDestination` for stable receipt delivery and acknowledgement;
- `ContinuationDeliveryAdapter` for one reserved event/run;
- optional test-fixture controls outside all production interfaces;
- a public delivery result that never contains raw managed context identity.

Proof classification should remain explicit metadata on each concrete adapter.

### 5.8 Protocol correctness is strong but not yet an open wire standard

**OBSERVED:** Events and H1 tickets use strict fields and signatures. Manifests are signed and
checked against a locally stored issued object, but the standalone verifier does not enforce
an exact top-level field list or carry a manifest protocol version. Event ingress uses
fixture `X-Event-*` headers, one global HMAC key, fixed sequence `1`, and fixed domain values.

**RISK:** The current same-instance issuance check hides interoperability questions. Another
language or third-party Host lacks schemas, version negotiation, independent key resolution,
and frozen canonicalization examples.

**RECOMMENDATION:** Before calling the mechanism a standard, publish:

- exact JSON Schemas with `additionalProperties: false`;
- manifest and event protocol versions;
- canonical signature inputs and frozen positive/negative vectors;
- stable authentication header names;
- issuer/key lookup, rotation, overlap, revocation, and algorithm rules;
- duplicate-identity conflict semantics;
- timestamp, URL, identifier, size, and number constraints;
- a compatibility policy for additive versus breaking fields.

Use MVP2's [`protocol/`](../mvp2/protocol/) artifacts as the starting pattern, but reconcile
them through an ADR before replacing MVP's current wire shape. For cross-language signing,
either adopt a defined JSON canonicalization standard or freeze the project's algorithm and
test vectors; the current small `canonicalJson()` helper is not by itself a portable
specification.

### 5.9 Correlation IDs are intentionally not authorization

**OBSERVED:** A fresh canonical page may register the opaque binding with a new page
correlation and then adopt the Grant correlation. This behavior is explicitly tested.

**RISK:** A refactor may incorrectly reject fresh-page registration, or the opposite error
may occur: a developer may treat `X-Correlation-Id` as user identity or proof of consent.

**RECOMMENDATION:** Keep correlation IDs as non-secret observability metadata. Introduce a
short-lived one-time registration capability bound to authenticated subject, workflow,
origin, Grant, expiry, and nonce when production-style binding is implemented.

### 5.10 Human-only controls are behavioral in the fixture

**OBSERVED:** Commit and consent are absent from Agent-callable Site Tools, but HTTP handlers
accept synthetic headers such as `X-Human-Action` and `X-Receiver-Human-Action`.

**RISK:** The current result proves Site Tool absence and observed Agent stopping, not that an
Agent or unauthenticated caller is technically unable to invoke the underlying endpoint.

**RECOMMENDATION:** Keep the current proof wording. The selected Host must add authenticated
human identity, normal authorization, CSRF/Origin protection, and a reviewed artifact
revision. The Receiver consent surface requires its own authenticated human session or
platform approval boundary.

### 5.11 Site Tool lifecycle should become a reusable browser helper

**OBSERVED:** `public/app.js` combines P0-specific tool definitions with a generally useful
`AbortController` lifecycle and reconciliation queue.

**RISK:** Every Host application may copy and subtly change stale-tool handling.

**RECOMMENDATION:** Extract only the lifecycle helper. Host Adapters should still define
their own tools, schemas, state guards, and human boundary. The helper should support:

- authoritative surface keys or versions;
- atomic retirement and registration where the browser contract permits;
- registration failure cleanup;
- server-side stale-state rejection;
- consistent `readOnlyHint`, `idempotentHint`, and untrusted-content annotations.

Artifact content, reviewer text, and external business data should be marked untrusted when
returned to the Agent.

### 5.12 Persistence and observability are fixture implementations, not ports

**OBSERVED:** SQLite access is embedded in services through raw SQL. Migrations have no
explicit schema-version ledger. `TraceRecorder` appends synchronously to JSONL and redaction
is optional outside H2.

**RISK:** Reusing service classes with another database requires rewriting core logic.
Public error responses can also inherit detailed adapter or local-runtime messages.

**RECOMMENDATION:** Define repository/unit-of-work and audit-sink contracts while keeping
SQLite as the reference adapter. Redact Receiver-private data by default, project a separate
bounded public status view, and return stable external error codes while retaining detailed
internal evidence.

### 5.13 P0, H1, and H2 are profiles rather than one coherent runtime lifecycle

**OBSERVED:** Environment flags and conditional migrations select immediate adapter delivery,
heartbeat delivery, and durable H2 enrollment. H1 has a separate Host continuation service;
H2 has a separate receipt sink and worker. Some serializers and Grant-summary projections
are duplicated.

**RISK:** Adding another transport or Host can multiply conditional branches and duplicate
security fixes.

**RECOMMENDATION:** Model capabilities explicitly:

```text
Enrollment strategy
  legacy immediate | durable outbox

Run delivery strategy
  immediate fixture | Inbox pull | private demo | future connector

Host effect strategy
  direct CAS | event-bound idempotent effect

Persistence adapter
  memory test | SQLite reference | future production store
```

The production-oriented composition should select the durable choices. Legacy profiles may
remain only to preserve frozen evidence.

### 5.14 Test depth is excellent, but aggregate orchestration can hang

**OBSERVED:** All 88 tests passed during this review when executed file-by-file: 82 tests in
the ordinary files and 6 tests in `h2-process-evidence.test.mjs`. The aggregate `npm test`
run reached 45 passing tests and then remained alive in the process-evidence child; it was
interrupted and the same process-evidence file passed 6/6 independently.

**RISK:** CI may report a timeout even when individual behavior is correct, making later
modularization failures harder to distinguish from test-runner process contention.

**RECOMMENDATION:** Before a large refactor, define one deterministic CI command that
preserves all 88 assertions while isolating process-kill evidence from parallel test files.
Do not reduce the test set to make the runner green.

## 6. Recommended target module boundaries

The names below are illustrative. Alex should review the authority boundaries before any
directory decision.

```text
packages/
  continuation-protocol/
    manifest/event schemas
    canonical encoding and signatures
    key resolver contract
    frozen conformance vectors

  host-sdk/
    protocol issuance helpers
    event-intent/outbox envelope
    Host Adapter contract

  receiver-core/
    consent challenges
    Grant lifecycle and policy
    opaque binding resolution
    event authentication/scope/deduplication
    run reservation
    no Host domain imports

  receiver-delivery/
    delivery job lifecycle
    leases, retry, acknowledgement, dead letter
    delivery strategy port

  receiver-sqlite/
    Receiver repositories and migrations
    transactional unit of work

  agent-adapter/
    managed context capture
    enrollment receipt destination
    continuation delivery
    proof classification

  webmcp-stage-tools/
    reusable stale-tool lifecycle helper
    no business tool definitions

  observability/
    structured audit contract
    redaction and public projection

apps/
  p0-fixture/
    WF-001 state machine
    continuation_note artifact
    P0 page and tool definitions
    synthetic transition and reset

adapters/
  fixture-agent/
  app-server-q3/
  desktop-private-demo/
  heartbeat-inbox/

conformance/
  protocol vectors
  Receiver contract suite
  Host Adapter suite
  Agent Adapter suite
  split-process external-sender suite
```

Physical deployment may combine these packages in one process for the hackathon. Package
boundaries define authority and replaceability; they do not force microservices.

## 7. Current-to-target extraction crosswalk

| Current source | Future ownership | Advice |
|---|---|---|
| `src/webmcp-manifest.mjs` | continuation protocol | Reconcile with MVP2 schemas/vectors; add version and exact fields |
| `src/reentry-ticket.mjs` | Receiver delivery protocol | Preserve strict claims; version ticket and receipt kinds |
| `src/receipt-sealer.mjs` | durable receipt storage adapter | Keep authenticated encryption separate from Grant policy |
| `src/receiver/grants.mjs` | Receiver core plus legacy enrollment profile | Extract policy; move direct adapter side effect behind a profile |
| `src/receiver/durable-enrollment.mjs` | Receiver enrollment core plus outbox worker | Split state machine, envelope validation, worker, and status projector |
| `src/receiver/events.mjs` | Receiver core plus delivery coordinator | Remove literal Host state and delivery-mode branching |
| `src/receiver/heartbeat-inbox.mjs` | Inbox delivery adapter | Keep bearer digest, ticket issuance, and acknowledgement semantics |
| `src/h1-continuation.mjs` | P0 Host Adapter/effect service | Preserve idempotent effect ledger as Host responsibility |
| `src/domain.mjs` | `apps/p0-fixture` Host Adapter | Keep all WF-001 states and artifact rules outside Receiver core |
| `src/database.mjs` | Host SQLite plus Receiver SQLite adapters | Separate migrations/repositories while preserving transaction semantics |
| `src/adapters/adapter-contract.mjs` | Agent adapter contracts | Remove `ensureTestContext`; split capture, receipt, and delivery ports |
| `src/adapters/fixture-adapter.mjs` | test adapter | Keep synthetic proof classification explicit |
| `src/adapters/app-server-*` | Q3 adapter | Keep Browser absence and Q3-only claim explicit |
| `src/adapters/desktop-*` and `src/relay/` | private demo adapter | Never present as protocol or public Codex support |
| `public/app.js` | P0 Host tools plus shared browser helper | Extract lifecycle only; retain domain tools in the Host app |
| `src/trace.mjs` | audit adapter | Make redaction default and public projection separate |
| `src/server.mjs` | composition root and thin routers | Split Host, Receiver, consent, Inbox, and test-only routers |
| `scripts/` | examples and operator tooling | Stop using scripts as an implicit protocol specification |

## 8. Selective reuse from MVP2

MVP2 should inform the extraction, but it should not replace MVP's stronger controls.

### Reuse or adapt

- [`protocol/`](../mvp2/protocol/) JSON Schemas and frozen vectors as the shape of an open
  conformance package.
- [`ContinuationHostSdk`](../mvp2/lib/infrastructure/host-sdk.mjs) as the pattern for
  keeping event issuance out of Receiver internals.
- [`ContinuationApplication`](../mvp2/lib/infrastructure/continuation-application.mjs) as a
  composition example, not as proof that distributed Host and Receiver writes can share one
  transaction.
- the replaceable Host Adapter boundary and the
  [`incident-response-host`](../mvp2/examples/incident-response-host.mjs) portability test.
- the separate-process
  [`external-backend-simulator`](../mvp2/examples/external-backend-simulator.mjs) as a
  minimum network-ingress conformance pattern.
- the reusable [`webmcp-stage-tools.js`](../mvp2/public/webmcp-stage-tools.js) lifecycle
  helper.
- strict conflict handling for identity reuse, exact fields, URL/origin, timestamps, state,
  and artifact revisions.

### Replace with MVP strengths

- Replace MVP2's JSON persistence with MVP's SQLite repositories, CAS, effect ledger, and
  durable outbox mechanics.
- Replace MVP2's simplified Grant attachment with MVP's Receiver-owned context capture,
  consent challenge, opaque binding, and H2 activation fence.
- Replace “queued” as completion with explicit delivery and effect acknowledgement states.
- Add MVP's evidence classifications, redaction rules, and crash-boundary tests.
- Keep Host business transition and event outbox authority in the Host Adapter rather than a
  shared aggregate store.

### Keep isolated

- `codex queue`, the private Desktop relay, App Server probes, and Scheduled pull are Agent
  delivery adapters or experiments. None is the Website Backend-to-Receiver standard.
- TenderRelay and WF-001 are Host Adapter examples. Neither belongs in Receiver core.

## 9. Safe modularization sequence

Each phase should be one bounded, reviewable goal. Do not combine protocol redesign,
database migration, folder movement, and runtime behavior in one commit.

### Phase 0 — Freeze the oracle

1. Tag or record the exact current `mvp/` tree and evidence baseline.
2. Establish a deterministic 88-test command, including the separate process-evidence run.
3. Record hashes for frozen evidence files that must not be regenerated by refactoring.
4. Add no new product or production claim.

**Exit gate:** Current source, evidence, and tests are reproducible without edits.

### Phase 1 — Extract protocol artifacts without changing behavior

1. Publish strict manifest, event, ticket, and receipt schemas.
2. Freeze canonical signing vectors and negative cases.
3. Wrap the current MVP functions around the extracted protocol package.
4. Preserve the existing local wire contract until an ADR accepts a version change.

**Exit gate:** All current tests pass, plus cross-package protocol vectors; the runtime emits
the same fixture behavior.

### Phase 2 — Introduce a P0 Host Adapter

1. Move WF-001 constants, state machine, artifact, human boundary, and Site Tool definitions
behind a Host Adapter contract.
2. Inject Host descriptors into manifest/event issuance.
3. Add a second tiny non-P0 Host Adapter conformance fixture.
4. Change no Receiver branch for the second domain.

**Exit gate:** Both Host fixtures pass the same Receiver contract, and no P0 identifier is
imported by Receiver core or Agent adapters.

### Phase 3 — Separate composition and HTTP trust zones

1. Keep one runnable process if useful, but split Host, Receiver, consent, Inbox, and
test/operator routers.
2. Move environment parsing to the outer composition root.
3. Return bounded external error codes and keep internal detail in audit records.
4. Ensure test-only routes cannot be enabled in a public profile.

**Exit gate:** Route tests prove each public/private surface and the existing P0 page still
uses genuine Site Tools.

### Phase 4 — Extract persistence ports

1. Define separate Host and Receiver repositories and units of work.
2. Implement them with SQLite first.
3. Preserve every current unique constraint, compare-and-swap predicate, and transaction.
4. Add schema-versioned migrations.
5. Prove that Host code cannot read raw managed context data through its repository.

**Exit gate:** Existing concurrency and crash tests pass; a split-store test proves no shared
SQL dependency.

### Phase 5 — Promote durable enrollment semantics

1. Extract H2's Grant/Inbox/outbox lifecycle as the future Receiver enrollment core.
2. Keep sealing, storage, dispatch, and acknowledgement behind separate ports.
3. Retain the legacy activation path only for frozen P0 compatibility.
4. Add a real selected destination only after it can satisfy stable dispatch and idempotent
acknowledgement.

**Exit gate:** All H2 crash and concurrency tests pass unchanged, and early events remain
fenced until exact activation.

### Phase 6 — Add durable Host and Receiver delivery jobs

1. Persist the Host transition and event intent atomically.
2. Deliver signed events through an at-least-once Host outbox relay.
3. Reserve the Receiver run and delivery job atomically.
4. Lease delivery to the chosen Agent strategy.
5. Require effect acknowledgement or an explicit terminal/dead-letter state.

**Exit gate:** Failure injection after every commit and acknowledgement boundary produces one
event identity, one logical run, and one Host-visible effect.

### Phase 7 — Extract WebMCP lifecycle and audit projection

1. Reuse the generic stage-tool registry while leaving tools in each Host app.
2. Add tool-surface version/hash checks if accepted by the architecture.
3. Mark external and user-authored tool results as untrusted content.
4. Make Receiver-private redaction the default and build a separate judge-facing status
projection from evidence.

**Exit gate:** Stale handles fail, current tools rediscover after navigation, and public
status cannot reveal task IDs, managed contexts, raw bindings, bearers, signatures, or local
paths.

### Phase 8 — Prove modularity across processes

1. Run a Host Backend process with its own store and key.
2. Run the Receiver with its own store and key resolver.
3. Send the event from a separate issuer/relay process through the documented HTTP ingress.
4. Swap between at least two Agent delivery strategies without changing Host or Receiver
protocol code.
5. Run a second Host domain without Receiver changes.

**Exit gate:** The demo proves a real network boundary and replaceable adapters while keeping
all platform-specific wake claims correctly classified.

## 10. Definition of a modular MVP

Do not declare MVP modular merely because files have moved. A credible result should satisfy
all of these:

- Receiver core imports no P0, TenderRelay, or selected-app state names.
- Protocol code imports no Host, persistence, Browser, or Codex modules.
- Host code imports no concrete Agent adapter or Receiver-private repository.
- Agent adapters import no Host domain implementation.
- A second Host Adapter works without a Receiver conditional branch.
- A second Agent adapter works without a Host change.
- A separate process can send a signed event through the public Receiver ingress.
- Host and Receiver can use separate stores and credentials.
- Exact replay returns the same logical result; conflicting identity reuse fails.
- Host transition plus event intent is atomic.
- Receiver run reservation plus delivery intent is atomic.
- Repeated delivery can produce at most one Host-visible effect.
- Context identity remains Receiver-private.
- Site Tools are re-derived from fresh authoritative state.
- Consequential action remains human-authorized and revision-bound.
- All 88 MVP tests and the reusable MVP2 conformance tests pass.
- Frozen evidence remains unchanged unless a new, separately named evidence run is captured.

## 11. Priorities for the hackathon

### Must preserve before integration

1. MVP's private context binding and opaque Host binding.
2. MVP's event identity conflict handling and one-run reservation.
3. MVP's SQL CAS and H1 Host-effect idempotency.
4. H2's durable enrollment and activation fence.
5. MVP2's strict protocol schemas/vectors and Host Adapter separation.
6. Honest classification of every Codex/Desktop delivery path.

### Highest-value modular additions

1. A strict shared protocol package.
2. A domain-neutral Receiver core with injected policy.
3. A Host Adapter SDK and second-domain conformance test.
4. A replaceable delivery strategy boundary.
5. A durable Host event outbox and Receiver delivery job.
6. Reusable WebMCP lifecycle and public evidence projection.

### Defer until the selected app or deployment requires it

- a generic plugin marketplace;
- many business domains;
- multiple databases beyond what the selected topology needs;
- broad workflow scripting or free-form event payloads;
- production multi-region infrastructure;
- a claim that any local Codex task can be publicly awakened;
- abstraction layers that have only one use and no testable authority boundary.

The hackathon needs one strong reusable mechanism and one excellent Host application, not a
large framework with no independently proven contracts.

## 12. Decisions Alex should review before implementation

1. **Preservation strategy:** accept keeping `mvp/` unchanged as the oracle while creating an
   additive modular implementation, or explicitly accept the higher risk of in-place
   extraction.
2. **Protocol authority:** decide whether MVP2 v0.1 wire artifacts become the seed of the
   shared protocol or whether a reconciled v0.2 is required.
3. **Enrollment default:** accept H2's durable lifecycle as the future core and classify the
   current direct activation path as legacy.
4. **Host/Receiver state boundary:** prohibit Receiver core from querying Host tables and
   define whether any authenticated Host introspection is needed.
5. **Delivery contract:** define common reservation, lease, attempt, acknowledgement, and
   dead-letter states before adding another Agent adapter.
6. **Demo transport:** select one current-build adapter for the hackathon demonstration while
   keeping it outside the public protocol claim.
7. **Human authority:** define what the selected app's consequential action requires beyond a
   synthetic header and absent Site Tool.
8. **Evidence gate:** accept a deterministic sequential/process-isolated test command before
   large file movement.

## 13. What not to do

- Do not replace MVP's SQLite/CAS/effect controls with MVP2's JSON store.
- Do not copy TenderRelay state names into Receiver core.
- Do not turn `codex queue`, Scheduled Tasks, App Server, or the private relay into the event
  protocol.
- Do not expose a managed context ID to make Host integration easier.
- Do not use a correlation ID as authorization.
- Do not activate a future Grant merely because a message was queued.
- Do not treat exact event deduplication as distributed exactly-once Agent execution.
- Do not move or regenerate frozen evidence as a side effect of refactoring.
- Do not delete legacy P0/H1 paths until parity is independently demonstrated and accepted.
- Do not combine the modularization with hero-app selection in one review.

## 14. Verification performed for this report

- Confirmed the review branch was clean and synchronized with its remote before review.
- Confirmed the `mvp/` tree is byte-identical to the current `origin/main` MVP tree.
- Read the MVP runtime, Receiver, Host domain, adapter, browser, script, test, evidence, Core,
  Research, and ADR boundaries relevant to modularization.
- Ran all 88 MVP tests successfully file-by-file:
  - 82 tests across the ordinary test files;
  - 6/6 process-level H2 crash and concurrency tests.
- Observed the aggregate parallel `npm test` runner remain alive after 45 passing tests in the
  H2 process-evidence child; no assertion failed, and the isolated process suite passed.
- Made no change to `mvp/`, `mvp2/`, tests, evidence, Core, ADRs, runtime state, or product
  selection.

## 15. Bottom line

MVP does not need to be replaced. It needs to be treated as the verified mechanism core and
carefully separated along the authority boundaries it already documents.

The best next implementation is an additive extraction that:

1. adopts MVP2's explicit protocol and Host Adapter shape;
2. carries forward MVP's Receiver-owned context, SQLite transactions, CAS, effect receipts,
   durable enrollment, and crash evidence;
3. adds the missing durable Host event outbox and generic Receiver delivery state machine;
4. leaves every Agent wake mechanism replaceable and honestly classified; and
5. proves reuse with a second Host and a separate external sender before calling the result
   infrastructure.

That approach gives Alex a reviewable path from a successful technical fixture to a reusable
standard proposal without sacrificing the evidence that makes the project credible.
