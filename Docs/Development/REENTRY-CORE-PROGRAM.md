# Re-entry Core Program Contract

**Role:** CANONICAL PROGRAM EXECUTION CONTRACT  
**Status:** Accepted; application-neutral Program complete at `locally_verified`  
**Owner:** Alex and project team  
**Effective date:** 2026-08-31  
**Completion date:** 2026-08-31  
**Terminal audit:** [RECORE-003](RECORE-003-program-completion-audit.md)  
**Program:** Re-entry Core  
**Final Host application at Program closure:** Unselected; ADR-0042 later selects Sleepless Kingdom
without reopening this application-neutral Program

## 1. Purpose

This contract distills the Product Owner's standing mandate for building Re-entry Core. It
binds the persistent development goal, active implementation records, and future bounded
increments without duplicating the detailed product, architecture, trust, validation, or
runtime truth owned elsewhere.

Re-entry Core is the authoritative, domain-neutral competition foundation for governed WebMCP
re-entry across time. It must be reusable by the final Host application without embedding one
candidate domain, one unsupported Agent wake path, or one experimental fixture topology.

This document owns program outcome, non-negotiable execution boundaries, operating cadence,
anti-bloat rules, and completion criteria. It does not own exact protocol fields, datastore
schema, current test results, deployment state, or final application selection.

## 2. Authority and conflict routing

Use the following ownership model:

| Question | Authority |
|---|---|
| Product and mechanism intent | `Docs/Core/01-product-definition.md` and `02-product-requirements.md` |
| System boundaries and logical contracts | `Docs/Core/03-system-design.md` |
| Trust, security, consent, and reliability | `Docs/Core/04-trust-security-reliability.md` |
| Current evidence and claim limits | `Docs/Core/00-current-status.md` and `05-validation-and-evidence.md` |
| Accepted durable choices | `Docs/Decisions/` |
| Program outcome, execution rules, and completion | This contract |
| Current bounded implementation scope | `Docs/Development/RECORE-*.md` |
| Supporting investigation | `Docs/Research/` |
| Implemented behavior | Current code and tests |
| Runtime, deployment, and submission truth | Current runtime and external readback |

When sources conflict, identify the question and update the owning source. Do not resolve a
conflict by selecting the easiest implementation or by allowing a summary, plan, test count,
or historical document to override current authority.

Current explicit Product Owner instructions supersede this contract. A material change must
then be written back to this contract and the affected owning ADR or Core document.

## 3. Program outcome

Build, iteratively harden, and document one lightweight, modular, application-neutral Re-entry
Core that:

1. preserves the strongest verified authority, durability, delivery, and evidence semantics
   from MVP1;
2. selectively adapts MVP2's useful protocol, Host, Receiver, Agent-adapter, and product-facing
   seams without importing its weaker authority or evidence assumptions;
3. separates Host application state, Receiver authority, cloud delivery, device execution, and
   Agent runtime through explicit contracts and independently runnable boundaries;
4. provides a stable specialization surface for whichever final web application is later
   selected through its own ADR; and
5. remains small, inspectable, measurable, and honest about unsupported capabilities.

The program advances through coherent increments. It does not end merely because a package
skeleton exists, unit tests pass, or one in-process demonstration works.

## 4. Accepted program decisions

The following are binding until changed through an accepted decision:

- **Name:** the core mechanism and authoritative implementation baseline are named **Re-entry
  Core**.
- **Source:** new authoritative core implementation belongs under `reentry-core/`.
- **Reference freeze:** `mvp/` and the MVP2 contributor branch remain unchanged reference
  implementations. New production behavior is not added there.
- **Reuse direction:** MVP1 is the semantic and evidence baseline; MVP2 is a selective source of
  module seams and presentation patterns; neither is copied wholesale.
- **One authority:** there is one Receiver Core authority model, not separate Local and Cloud
  business-rule implementations.
- **Cloud target:** Cloud Receiver is the target hosted control and durable-delivery shell.
- **Local boundary:** a Local Receiver profile may wrap the same Receiver Core for deterministic
  development and testing. It is not a second production authority or automatic fallback.
- **Device boundary:** Local Connector is an outbound, paired, separately runnable delivery and
  adapter bridge. It cannot issue Grants, reinterpret Host truth, widen authority, or expose a
  general inbound remote-control port.
- **Application boundary:** the final Host application, user, domain, event, artifact, Site Tool
  schemas, and product name remain unselected until an accepted app-selection ADR.
- **Agent boundary:** a concrete Codex or Agent wake path remains unselected until it passes the
  required runtime, Browser, and genuine WebMCP evidence gate.

## 5. Required process and trust boundaries

The target reference architecture distinguishes:

```text
external actor or system
-> Host backend and transactional outbox
-> Cloud Receiver
-> outbound Local Connector
-> Agent Continuation Adapter
-> Agent runtime and WebMCP-capable Browser
-> canonical Host page
```

The Host web page and Host backend may be separate deployment surfaces. The external actor or
system causes a business transition, but the Host backend remains authoritative for Host state
and normally emits the signed Continuation Event after committing that transition.

Each material boundary must define:

- identity and credential owner;
- authoritative state and persistence owner;
- accepted input and bounded output;
- authentication and authorization rule;
- idempotency, lease, retry, acknowledgement, and terminal-state semantics where applicable;
- observable success and failure evidence; and
- prohibited authority inheritance.

Module names alone do not prove separation. Any separate-process claim requires separate
process, store, credential, failure, and correlation evidence appropriate to that claim.

## 6. Re-entry Core invariants

Every implementation and Host specialization must preserve these invariants:

1. A live Host page exposes a project-defined Re-entry Manifest through genuine WebMCP.
2. Viewing or invoking the offer creates no continuation authority.
3. The Receiver validates the offer and owns authenticated user consent, Grant scope, expiry,
   revocation, run limits, and the authority relationship to one private managed-context binding.
   The selected adapter authority owns raw platform-locator custody; the Host, Cloud Receiver,
   event, activation, and Local Connector caller never select or receive that locator.
4. The Host stores only an opaque workflow-scoped binding, never raw Agent credentials or a raw
   platform task identifier.
5. The Host backend owns business truth and emits only typed, bounded event data after the
   authoritative transition.
6. A Continuation Event is not an Agent prompt, current application truth, or proof that an
   Agent ran.
7. Event acceptance and durable pending delivery are committed before successful acceptance is
   acknowledged.
8. Agent activation is delegated to a replaceable adapter and remains separate from event
   acceptance.
9. Re-entry returns to an allowlisted canonical page and revalidates current identity,
   authorization, workflow state, state version, and artifact revision.
10. Current page state determines the genuine Site Tools available at that stage.
11. Duplicate or retried delivery cannot create duplicate accepted runs or Host effects.
12. The Agent stops at the declared human consequence boundary.
13. Event, delivery, activation, tool use, Host effect, artifact revision, and human decision
    remain distinct correlated facts.
14. Normal human use of the Host application remains possible without the Agent.

## 7. Implementation posture

The initial implementation should be one Node 24 ESM package with zero runtime dependencies
unless current evidence shows that a dependency is safer or materially lighter than a custom
implementation.

Use narrow module exports and independent process entrypoints before creating a multi-package
workspace or microservice framework. The expected module families are:

- canonical protocol and strict validation;
- Host SDK and issuer contract;
- Receiver Core and persistence port;
- Cloud Receiver service shell;
- Local Receiver development profile;
- Local Connector and delivery-client port;
- Agent Continuation Adapter contract; and
- deterministic testkit, frozen vectors, and conformance harnesses.

Components may compose in deterministic tests. That convenience must not be presented as
separate-process, distributed, hosted, or production evidence.

## 8. Continuous operating loop

Each cycle follows:

```text
current-state audit
-> authority and boundary check
-> challenge and falsifiers
-> smallest coherent increment
-> implementation
-> targeted verification
-> aggregate or separate-process verification when warranted
-> current-truth and evidence writeback
-> exact Git closure
-> next highest-leverage increment
```

Rules:

- Work from current files, code, tests, runtime, and external state rather than conversation
  memory alone.
- Advance one independently verifiable outcome at a time without shrinking the full program.
- Design tests before or alongside contract-bearing code.
- Challenge assumptions that affect authority, architecture, performance, portability, or
  competition value.
- When one problem remains unresolved, record its evidence, dependent surfaces, impact, and
  reopen condition. Continue independent safe work instead of stalling the entire program.
- Repeated failure with no new evidence is a signal to revisit the assumption or design, not
  permission to add fallbacks.
- Rewrite owning current truth; do not append conversation chronology to Core documents.
- End an increment only at the evidence level actually reached.

## 9. Lightweight and performance contract

Lightweight means lower operational and cognitive weight without weakening authority,
durability, observability, or failure truth.

Every material increment must consider:

- runtime dependency count and necessity;
- process startup and idle behavior;
- bounded protocol and log payloads;
- database transactions, indexes, and unbounded scans;
- network round trips and duplicate work;
- Connector idle traffic and Agent no-op usage;
- retry amplification and acknowledgement loss;
- memory, file, and evidence growth; and
- clean-room setup burden.

Initial targets are:

- zero runtime dependencies unless a measured safety or weight advantage is documented;
- no unbounded event, delivery, audit, or retry loop;
- no Agent invocation merely to discover that no accepted delivery exists;
- no full artifact, arbitrary prompt, secret, or raw managed-context identifier in event or
  public diagnostic payloads;
- one bounded happy-path event and delivery before adding event taxonomies or concurrency
  generalization; and
- an explicit benchmark or resource budget before claiming a performance improvement.

Do not optimize by removing safety checks, durable state, correlation, negative evidence, or
human control.

## 10. Anti-bloat and no-fallback contract

The program must not accumulate speculative functionality merely because it may be useful
later.

Do not add without a current accepted requirement and consumer:

- multiple Host applications in the competition happy path;
- multiple Agent platforms;
- broad event-policy languages;
- production multi-tenancy or organization administration;
- installer, auto-update, fleet management, or cross-platform packaging;
- generalized workflow orchestration;
- compatibility layers for unsupported experimental transports; or
- duplicate documentation authorities.

When the selected adapter cannot activate the intended bounded context and obtain the required
Browser/WebMCP surface, report a typed visible failure. Do not silently substitute polling,
DOM automation, generic MCP, direct Host REST, manual reconstruction, a fresh Agent context, or
a different task. Any user-visible fallback requires its own product requirement, authority
analysis, decision, and verification.

## 11. Documentation and knowledge discipline

Core documentation contains only high-value current truth, durable mechanism and data
contracts, and bounded evidence claims. It does not become a research archive or operational
timeline.

- Update an owning document instead of creating a parallel explanation.
- Keep supporting research and candidate scenarios outside current product authority.
- Convert recurring operational knowledge into the smallest useful runbook, test, script, or
  gate.
- Preserve historical and contributor material unless an exact, authorized, recoverable
  deletion passes repository safeguards.
- Prefer demotion, supersession labels, and index repair over destructive cleanup.
- Do not stage, commit, or overwrite unrelated dirty work.
- All project code, tests, comments, prompts, configuration text, documentation, diagrams,
  evidence reports, and submission artifacts remain English.

## 12. Verification and claim ladder

Use only the highest state supported by current evidence:

```text
decided
specified
implemented
locally_verified
separate_process_verified
runtime_verified
deployed
judge_reproducible
submitted
```

Verification should cover positive, negative, boundary, replay, stale-state, crash,
acknowledgement-loss, and failure behavior in proportion to the increment's risk.

Unit and in-process integration tests cannot prove process separation. A queue or adapter
acceptance response cannot prove Agent activation. Agent activation cannot prove Browser
acquisition. Browser acquisition cannot prove genuine page-bound WebMCP. Site Tool invocation
cannot prove a Host effect or human decision. Preserve each boundary as a separate claim.

## 13. Git, collaboration, and destructive operations

Follow the repository `AGENTS.md` validated-goal gate for every bounded increment:

- establish current branch, dirty state, commit, and remote baseline;
- preserve existing and unrelated work;
- stage exact owned paths only;
- run meaningful checks and inspect the complete staged diff;
- use one coherent commit per validated outcome;
- fetch and resolve remote movement deliberately before any push; and
- report local validation, local commit, remote delivery, runtime proof, and release separately.

Documentation reduction is not blanket deletion authority. Before deleting or replacing
existing material, resolve exact targets, consumers, ownership, Git state, blast radius, and a
precise recovery source. If any of those are uncertain, preserve the material and continue
through a non-destructive path.

## 14. Explicit non-goals

This program does not by itself:

- select the final web application or product name;
- prove product demand, user value, or commercial viability;
- standardize Re-entry Core as a public WebMCP protocol;
- guarantee exact-thread superiority over a bounded continuation capsule;
- provide a supported Codex wake contract;
- authorize production credentials, paid services, live users, deployment, publication, or
  submission;
- require every future Host app to use a Local Connector; or
- permit claims beyond current evidence.

App selection, selected-app implementation, public deployment, judge reproduction, and
submission remain separately governed work. They may consume Re-entry Core after their
respective decisions without weakening this contract.

## 15. Program Definition of Done

The Re-entry Core program is complete only when current authoritative evidence proves every
item below:

### Authority and source

- `reentry-core/` is the sole authoritative source for new core behavior.
- MVP1 and MVP2 remain unchanged, attributable references.
- Core documents, ADRs, active work, code, tests, and evidence have no unresolved material
  contradiction about current Re-entry Core behavior or status.

### Contracts and implementation

- Manifest, Grant, private binding, typed event, durable delivery, lease, acknowledgement,
  Host-effect correlation, and human-boundary semantics are implemented behind narrow contracts.
- Host SDK, Receiver Core, Cloud Receiver, Local Connector, persistence, and Agent Adapter
  boundaries are implemented and independently exercisable.
- A domain-neutral conformance Host fixture specializes the core without importing final-app
  rules into Re-entry Core.

### Process and authority proof

- Cloud Receiver and Local Connector complete their bounded delivery protocol as separate
  processes with separate state and credentials.
- Separate-process failure, restart, lease recovery, replay, acknowledgement loss, revocation,
  stale state, and duplicate-effect behavior are verified at the claimed boundaries.
- Local Connector cannot issue or widen continuation authority.

### Agent boundary truth

- A deterministic adapter proves the complete adapter contract and failure classifications.
- Any unavailable real Codex/Browser/WebMCP join remains an explicit typed unresolved adapter
  capability, with no hidden fallback or inflated runtime claim.
- Real Agent wake is not required to close the application-neutral core if it remains outside
  the supported platform surface; it remains a named gate for the selected-app program.

### Quality and weight

- Focused and aggregate verification pass for the final core source.
- Material protocol, persistence, delivery, Connector idle, and startup paths have measured
  budgets or benchmarks with explicit claim limits.
- Dependencies, process count, payloads, retries, logs, and generated state remain bounded and
  justified.
- No speculative feature or fallback is required to explain the happy path.

### Documentation and delivery

- The documentation authority map, current status, architecture, trust model, validation plan,
  active issue state, development runbook, and evidence are concise and mutually consistent.
- No private credential, raw managed-context identifier, mutable runtime database, or
  unredacted sensitive trace is included in tracked or public artifacts.
- The final core increment has exact local verification, commit, remote, and residual-risk
  state recorded without overstating deployment, judge reproducibility, or submission.

If any item is missing, contradicted, indirectly evidenced, or merely planned, the program
remains active. A selected Host application and competition submission may begin before this
program closes when their bounded dependencies are ready, but they do not substitute for these
core completion requirements.

**Current completion result:** the terminal RECORE-003 audit marks every requirement above `MET`
against the exact final source and closes this application-neutral Program at `locally_verified`.
Production topology, real Agent/Browser/WebMCP activation, selected-app specialization, deployment,
judge reproduction, and submission remain separate decision- and evidence-gated work. This
contract remains authoritative for any later Core reuse or reopen.

## 16. Change control

Changes to Re-entry Core authority, reference-code freeze, Receiver ownership, process
topology, no-fallback policy, final-app separation, or this Definition of Done require:

1. current evidence and affected-surface analysis;
2. a written Challenge and alternatives;
3. an accepted ADR or explicit Product Owner decision;
4. updates to this contract and every affected owning Core document; and
5. verification that the change does not silently weaken prior trust or evidence guarantees.

Ordinary implementation details may evolve through active RECORE tasks without rewriting this
contract when they remain inside its accepted boundaries.
