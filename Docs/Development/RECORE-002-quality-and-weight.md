# RECORE-002: Quality and Weight Baseline

**Role:** CLOSED IMPLEMENTATION RECORD  
**Risk profile:** Standard — developer-only measurement with no runtime behavior change  
**Status:** `locally_verified`  
**Opened:** 2026-08-31  
**Closed:** 2026-08-31  
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
- The Connector has no poller, daemon, periodic timer, keepalive, or idle loop. Its request timeout
  exists only during an explicit call, so this task will not invent an idle workload merely to
  produce a number.

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
  remove their exact temporary state after handled success or failure. External hard termination
  is not a cleanup claim.
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

**Closure:** `locally_verified` on 2026-08-31.

- Implementation commit `1503c77f45cb9e83d2c80ac1bcb8c466e2d0b181` was pushed and matched
  `origin/codex/re-entry-core-foundation` before this closure writeback.
- `benchmark:receiver` uses seven fresh file-backed samples with 16 completed lifecycles per
  sample. Setup is excluded from the timed event phase; the benchmark separately measures fresh
  store startup, signed-event durable acceptance, target-scoped claim, and Host-effect-backed
  acknowledgement. Every result is checked before it can be reported.
- On this machine, Node `v26.5.0` observed median store startup of 1.295 ms and median event, claim,
  and acknowledgement operations of 0.205 ms, 0.119 ms, and 0.111 ms. Node `v24.20.0` observed
  1.177 ms, 0.201 ms, 0.113 ms, and 0.097 ms. Each completed 16-lifecycle file set was 167,936
  bytes. These are sequential local samples, not a Node-version comparison or service claim.
- `benchmark:profile` cold-spawns the unchanged conformance runner seven times and requires its
  exact redacted result. Median wall-clock observations were 182.015 ms on Node `v26.5.0` and
  169.857 ms on Node `v24.20.0`; each public result was 419 bytes. No outer hard-kill timeout was
  added because that could orphan child roles or temporary state; the runner retains its bounded
  IPC timeout and cleanup behavior.
- The existing protocol and Agent Adapter benchmarks also ran successfully on both runtimes. Their
  outputs remain regression samples; this task sets no pass/fail timing threshold and makes no
  optimization or relative-runtime claim.
- The aggregate suite passes 56 of 56 tests and protocol conformance passes 11 of 11 on both
  runtimes. The direct source profile also passes on both runtimes.
- `npm ls --omit=dev --all --json` reports zero runtime dependencies. `npm pack --dry-run --json`
  selects the same 15 runtime, README, and vector files: 31,621 bytes compressed and 163,211 bytes
  unpacked. Benchmark, conformance, and test sources remain excluded.
- `reentry-core/src/`, the conformance runner, MVP1, MVP2, References, app-selection research,
  scenarios, production runtime, and user-owned dirty files are unchanged by the implementation.

This closes RECORE-002 at a local regression-evidence level. It does not prove service throughput,
capacity, HTTP or internet latency, Cloud Receiver operation, production Connector idle cost,
Browser or Agent latency, cross-machine portability, a selected-app budget, deployment, or an SLA.

**Next entry condition:** audit the Re-entry Core Program Definition of Done against current code
and evidence before opening another runtime-bearing increment. Keep production ownership,
credential custody, real Agent integration, and app specialization behind their named decisions.
