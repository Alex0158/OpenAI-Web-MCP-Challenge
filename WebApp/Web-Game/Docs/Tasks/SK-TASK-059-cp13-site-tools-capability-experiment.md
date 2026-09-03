# SK-TASK-059: CP-13 Site Tools Capability Experiment

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-13`
- Owner: Game owner
- Current increment: The procedure was executed on GPT-5.6 Sol with site tools enabled and passed. The adapter discovered and read-only invoked the page-registered `cp02_inspect_probe` tool, recorded in [`SK-EVID-045`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md); [`SK-ISSUE-001`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md) is resolved.
- Next gate: None for this task. The page-tool contract package is accepted under [`SK-TASK-053`](SK-TASK-053-cp13-page-tool-contract-preparation.md); CP-13 page implementation is tracked under [`SK-TASK-061`](SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md), and this capability result remains a prerequisite rather than CP-13 game-page evidence.

## Identity

- Task ID: `SK-TASK-059`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: The result decides whether the page-bound WebMCP path the competition thesis
  depends on is reachable at all. A false positive would authorize CP-13 and CP-14 against a
  capability that does not exist, so the procedure forbids polyfills, substitute browsers, and any
  inference from page-side registration.

## Objective

Replace the open-ended search in `SK-ISSUE-001` with one executed runtime result: on an eligible
model with site tools enabled, can an Agent discover and read-only invoke a tool that a local page
has registered?

## Success and non-goals

- Success: The five preconditions are checked and recorded before anything is run.
- Success: Stage A runs against the disposable CP-02 probe page, so a failure isolates the adapter
  from the game build.
- Success: The exact tool inventory, or the exact verbatim error text and model name, is recorded.
- Success: A negative outcome is recorded with the same care as a positive one, because it eliminates
  the eligibility hypothesis and redirects the investigation.
- Non-goals: Implementing CP-13, registering tools on the game page, changing `SK-MVP-0.2`, closing
  the CP-13 owner decision, adding any polyfill or substitute transport, or committing anything.

## Scope and authority

- In scope: running the procedure, and writing one new `SK-EVID-*` plus the `SK-ISSUE-001` update the
  outcome justifies.
- Out of scope: `src/`, `tests/`, `package.json`, the game page's registration code, `reentry-core/`,
  `mvp/`, and RightSpot. The CP-02 probe harness is read and run, not modified.
- Allowed actions: read, run the probe server locally, use the Desktop built-in browser, write the
  evidence record. No commit, push, deploy, credential use, or external service contact.
- Revalidate when: the model, client version, site-tools setting, account type, or probe page changes.

## Owning authority

- Procedure: [`../Validation/70-cp13-site-tools-capability-experiment.md`](../Validation/70-cp13-site-tools-capability-experiment.md)
- Blocking issue: [`../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md)
- Eligibility research: [`../Evidence/SK-EVID-044-cp13-site-tools-eligibility-research.md`](../Evidence/SK-EVID-044-cp13-site-tools-eligibility-research.md)
- Differential diagnostic: [`../Validation/68-cp13-webmcp-capability-differential-diagnostic.md`](../Validation/68-cp13-webmcp-capability-differential-diagnostic.md)
- Prior negative probes: [`../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md`](../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md) and [`../Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md`](../Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md)

## Evidence status

- Verified: the probe server starts and serves the registering page. A local smoke run in this session
  returned `CP02_READY`, HTTP `200` on `/`, and `{"ok":true,"service":"cp02-probe"}` on `/health`.
- Verified: vendor documentation names the eligible models and the required client setting; both
  prior probes ran on the one model documented as having WebMCP disabled.
- Verified: all five preconditions held, the adapter's own discovery path returned `cp02_inspect_probe`
  with its exact declared schema and read-only annotation, and one read-only invocation returned the
  page-owned state object. Recorded in
  [`SK-EVID-045`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md) at ladder level 6,
  with the executed narrative in [`Validation/70`](../Validation/70-cp13-site-tools-capability-experiment.md)
  section 9.
- Verified: the canonical game page returned `No WebMCP tools are available in this document.`, which
  matches the unimplemented CP-13 boundary and is not a defect.
- Inferred: the earlier negative results were caused by model eligibility alone, since no source file
  changed between them and this run.
- Unknown: whether the canonical game page's future tool registrations behave the same way, whether a
  second independent browser context behaves the same way, and whether any hosted origin does. The
  runtime execution was performed by a supporting side session; the primary session cross-checked the
  record against the page source and the machine state but did not independently reproduce it.

## Verification and closure target

- Minimum verification: ladder level 6 for the capability binding.
- Closure target: `runtime_verified` for whichever outcome occurs. A negative result closes this task
  and reopens `SK-ISSUE-001` with the eligibility hypothesis eliminated.
- Reopen trigger: a change to the model, client, setting, account type, or probe page.

## Execution result

- Preconditions: all five passed — GPT-5.6 Sol, Codex Desktop `26.803.41515` (build `6321`), the
  Codex In-app Browser, `Enable site tools` on, and a personal account.
- Stage A discovery: the adapter's own tool-listing path returned exactly `cp02_inspect_probe` with
  title `Inspect CP-02 probe`, the closed empty input schema, and `readOnlyHint: true`, matching the
  registration call in `probe/cp02/public/index.html` field for field.
- Stage A invocation: calling the tool with `{}` returned the page-owned `probe` state object. No
  write-capable tool was exposed or invoked, and no game state, event, outbox row, cargo, coin, or
  mission was mutated.
- Stage B observation: the canonical game page returned `No WebMCP tools are available in this
  document.`, which is the correct result for an unimplemented CP-13.
- Diagnostic finding: a page-context `typeof document.modelContext` readback returned `undefined` in
  the same session in which discovery and invocation succeeded. That readback is not a reliable
  injection falsifier on this browser-control surface and must never overrule an actual adapter result.
- Residue: two `/tmp` experiment databases remained because the machine's global deletion guard
  rejected the cleanup; the guard was not bypassed and no database was written into the repository.
- Evidence: [`SK-EVID-045`](../Evidence/SK-EVID-045-cp13-site-tools-capability-experiment.md).

## Analysis and closure

- Exact conclusion: **This task is `runtime_verified` at ladder level 6 for the named positive
  capability outcome on one local disposable page, and `SK-ISSUE-001` is resolved with the
  model-eligibility hypothesis confirmed. CP-13 page implementation is now tracked under SK-TASK-061;
  no CP-13, Re-entry, hosted, or judge claim follows from this capability result.**
- Residual risk: the run was executed by a supporting side session and has not been independently
  reproduced; the result is bound to one model, one client version, one account type, and one local
  origin, and any change to those requires a fresh capability run.

## Explicit non-claim

Running this experiment proves capability on one static page in one client session. It proves nothing
about the game page, the CP-13 tool contract, Re-entry delivery, hosted continuity, or judge
reproduction.
