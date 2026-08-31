# RECORE-002: Quality and Weight Baseline

**Role:** ACTIVE IMPLEMENTATION RECORD  
**Risk profile:** Standard — developer-only measurement with no runtime behavior change  
**Status:** `specified`  
**Opened:** 2026-08-31  
**Branch:** `codex/re-entry-core-foundation`  
**Baseline:** `cd3c3402b6df6d6faddbde36e830044c26f652c3`

## Objective

Establish reproducible local regression evidence for the material Re-entry Core persistence,
delivery, startup, and package-weight surfaces that RECORE-001 did not measure directly.

Target closure is `locally_verified`. This task measures current behavior before considering any
optimization. It does not create a service SLA, production capacity claim, selected-app budget, or
permission to weaken authority, durability, validation, or failure semantics.

## Authority and current evidence

- `REENTRY-CORE-PROGRAM.md` owns the lightweight, performance, anti-bloat, and completion rules.
- `REENTRY-CORE-RUNBOOK.md` owns benchmark claim limits and exact verification closure.
- Core/03 through Core/05 own architecture, trust, current evidence, and claim boundaries.
- RECORE-001 is the closed foundation record and supplies the current code and test baseline.
- `benchmark:protocol` already measures bounded signing and verification overhead.
- `benchmark:agent-adapter` already measures deterministic adapter derivation, dispatch-wrapper
  overhead, and cold Agent-subpath import.
- The Connector has no poller, daemon, timer, or idle loop. Its current idle work is structurally
  zero, so this task will not invent an idle workload merely to produce a number.

No ADR is required because this task changes no product, protocol, authority, data lifecycle,
runtime topology, or production behavior. Any such change discovered during measurement must be
split into its own decision or bounded implementation record.

## Challenge

### Hypothesis

Two developer-only benchmarks can cover the remaining material local surfaces without adding a
dependency, instrumenting runtime code, duplicating the conformance implementation, or expanding
the package surface:

1. a file-backed Receiver benchmark measures schema startup and the existing signed-event,
   durable-acceptance, target-scoped claim, Host-effect, and acknowledgement path; and
2. a cold source-profile benchmark measures the wall-clock cost of the existing distinct Host,
   Receiver, and Connector composition.

### Falsifiers and stop conditions

- A benchmark requires a production code path, contract, or persistence setting to change.
- The measurement bypasses the current Receiver Core or conformance runner and therefore measures
  a synthetic substitute.
- Timing output contains credentials, identifiers, temporary paths, child stderr, or payloads.
- A run leaves its exact temporary database or sidecar files behind.
- Benchmark source enters the runtime package allowlist or adds a runtime dependency.
- The entrypoint cannot run on Node 24 and the current Node runtime.
- Timing is presented as an SLA, hosted throughput, Agent latency, or cross-machine comparison.

If a measured path exposes a correctness defect, stop performance work, record the defect and its
evidence, and fix it as a separate coherent increment. Do not optimize around incorrect behavior.

## Bounded implementation

### A. Durable Receiver lifecycle benchmark

- Use the current `ReceiverCore`, `SqliteReceiverStore`, protocol, and authority ports unchanged.
- Use a file-backed database so WAL and `synchronous=FULL` durability remain in the measured path.
- Create bounded, valid one-run Grants outside the timed event phase.
- Measure event acceptance, delivery claim, and effect-backed acknowledgement separately across
  multiple bounded samples.
- Record store startup and final database-file bytes without exposing a path or row content.
- Use exact temporary-file cleanup and fail visibly on malformed or incomplete results.

### B. Source-profile cold-run benchmark

- Spawn the existing `conformance/run.mjs` entrypoint in fresh Node processes.
- Require its exact redacted passing result on every sample.
- Record bounded minimum, median, and maximum wall-clock duration across sequential cold runs.
- Do not add benchmark switches or timing branches to the conformance runner.

### C. Package and compatibility verification

- Add explicit package scripts for both developer-only benchmarks.
- Keep `bench/`, `conformance/`, and `test/` outside runtime package files and exports.
- Re-run the aggregate suite, protocol conformance, direct profile, dependency tree, package
  manifest, and both new benchmarks on Node 24 and the current runtime where material.

## Non-goals

- service load, concurrent ownership, queue depth, multi-replica behavior, or capacity planning;
- HTTP, internet, Cloud Receiver, Browser, WebMCP, Agent, or selected-app latency;
- a pass/fail timing threshold before repeat-run variance and a real consumer budget exist;
- continuous benchmark infrastructure, dashboards, historical databases, or CI matrices;
- runtime metrics, tracing, logging, profiling hooks, or telemetry;
- retention, compaction, archival, or audit-product policy;
- polling, keepalive, retry, fallback, background Agent, or idle Connector behavior;
- dependency, framework, workspace, installer, or deployment changes.

## Acceptance and claim boundary

- Both entrypoints emit bounded machine-readable JSON with runtime, sample configuration, explicit
  local-only claim text, and summary measurements.
- Receiver measurements exercise file-backed durable acceptance, claim, and acknowledgement and
  leave no temporary state after success or failure.
- Profile measurements call the unchanged redacted conformance entrypoint and reject any failed or
  malformed sample.
- Aggregate and protocol tests pass on Node 24 and the current runtime.
- Dependency count remains zero; package file selection excludes benchmark, conformance, and test
  sources; the exact package count and byte sizes are recorded at closure.
- MVP1, MVP2, References, app-selection research, scenarios, production runtime, and user-owned
  dirty files remain unchanged.
- Closure states only a local regression baseline. Faster or slower numbers alone do not justify a
  runtime change or a competition performance claim.

## Verification record

No implementation or measurement evidence exists yet.

**Next entry condition:** implement the two bounded benchmark entrypoints without changing
`reentry-core/src/` or the existing conformance runner, then validate correctness, cleanup,
compatibility, package exclusion, and claim limits before recording any timing result.
