# Development Standard

**Role:** CANONICAL project-wide code and engineering quality standard  
**Status:** Active  
**Last updated:** 2026-08-31

## 1. Objective

Produce the smallest maintainable implementation that satisfies an accepted requirement without
weakening authority, failure truth, testability, performance, or user control. Quality is measured by
clear ownership, correct behavior, useful failure handling, verification strength, and change cost,
not by abstraction count, file count, or framework adoption.

## 2. Requirement and ownership gate

Before code changes:

- name the active Task and owning Core, Mechanism, Application, Decision, or runtime contract;
- state the current behavior, intended behavior, affected surfaces, and non-goals;
- identify authority, trust, data-lifecycle, compatibility, and failure implications;
- define the smallest observable consumer and falsifier; and
- register or update an ADR before a durable product, authority, security, topology, data, external
  contract, or application-boundary change.

Do not implement a Research recommendation, scenario, conversation, test fixture, or historical
reference as product truth without its owning accepted decision.

## 3. Module and boundary quality

- Give each module one primary responsibility and one explicit public contract.
- Keep Host application state, Receiver authority, Connector execution, Agent activation, and human
  consequence boundaries distinct.
- Prefer narrow exports and injected authority ports over global state, hidden I/O, or general
  frameworks.
- Keep internal helpers private unless a real independent consumer and contract exist.
- Do not import application concepts into Re-entry Core or Core authority into an application
  presentation layer.
- Avoid circular dependencies and cross-layer imports that bypass the owning adapter or contract.

File length is a review signal only. Split when content has an independently maintainable authority,
state model, consumer, failure boundary, test surface, or update cadence. Do not split stable code
into forwarding files merely to reduce a number.

## 4. Data and contract quality

- Accept exact bounded shapes at every trust boundary; reject unknown fields where ambiguity changes
  authority or interoperability.
- Validate before persistence, dispatch, external effect, or state transition.
- Keep timestamps, limits, identifiers, versions, and terminal states explicit.
- Preserve idempotency, replay, lease, revocation, acknowledgement, and stale-worker semantics where
  the owning contract requires them.
- Keep private capabilities, raw managed-context locators, credentials, and secret-bearing values out
  of public payloads, logs, errors, fixtures, and tracked evidence.
- Use migrations and compatibility behavior only when an accepted current consumer requires them.

## 5. Failure and fallback quality

- Fail with a stable typed code at the narrowest owning boundary.
- Expose enough information to classify and remediate the failure without leaking sensitive state.
- Preserve `unknown` when an outcome cannot be reconciled; do not convert uncertainty into success or
  a blind retry.
- Retry only under an explicit bounded contract with attempt, time, authority, and duplicate-effect
  semantics.
- A fallback must be a named, observable, testable product or operational state. It must not hide
  invalid authorization, lost state, unsupported capability, or false completion.
- Repeated failure without new evidence requires reassessment, not another compatibility layer.

## 6. Dependency and platform quality

- Re-entry Core retains zero runtime dependencies until a measured safety, correctness, or weight
  advantage justifies one.
- A new dependency requires a current consumer, maintenance and security assessment, package impact,
  license compatibility, and a smaller-alternative comparison.
- Dev tooling is allowed only when it catches a named defect class or enforces a current documented
  contract at proportionate cost.
- Generated, vendor, lock, and build artifacts are changed only by their owning tool and reviewed as
  part of the same coherent increment.
- Node 24 is the reproducible closure baseline; name every additional version actually verified.

## 7. Performance and weight

Consider material changes for:

- startup, idle CPU, memory, process count, and package size;
- payload, log, evidence, and database growth;
- bounded queries, indexes, transactions, and scans;
- network round trips, polling, retry amplification, and duplicate work; and
- clean-checkout and developer setup cost.

Do not claim an improvement without a repeatable budget or benchmark and an explicit environment.
Do not optimize by removing validation, durable state, negative evidence, correlation, or human
control.

## 8. Maintainability and documentation

- Prefer clear names and direct control flow over comments that restate code.
- Comment non-obvious authority, protocol, failure, or compatibility rationale.
- Keep public exports and package documentation synchronized.
- Rewrite the owning current truth when behavior or intent changes; do not append implementation
  chronology to flagship documents.
- Add no abstraction, configuration option, feature flag, or extension point without a current
  consumer and removal or stability boundary.
- Leave unrelated dirty work unchanged and keep one coherent outcome per reviewed change.

## 9. Review triggers

Perform an explicit design review when a change:

- crosses Host, Receiver, Connector, Agent, Browser, data, permission, or deployment boundaries;
- adds persistence, concurrency, retry, external I/O, credentials, or a public protocol;
- gives one module a second independent reason to change;
- requires duplicated validation or policy in more than one owner;
- introduces a dependency or broad compatibility layer; or
- cannot be verified without a larger consumer, runtime, or migration surface.

The review may conclude that no refactor is warranted. Record the deciding evidence and reopen
trigger rather than expanding scope defensively.
