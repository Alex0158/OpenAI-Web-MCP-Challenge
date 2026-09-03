# CP-13 WebMCP Capability Differential Diagnostic

**Role:** Historical investigation record for the resolved capability issue
**Status:** VERIFIED analysis; superseded by the closure update below; no new capability probe was executed in this record
**Date:** 2026-09-03  
**Scope:** `SK-ISSUE-001` resolution trace only
**Audience:** The primary session and the owner; current gates are tracked by the task and evidence records linked below

## 1. Why this record exists

At the time this diagnostic was written, [`SK-ISSUE-001`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md)
was the only open issue in this application and it gated CP-13 and CP-14. Its recorded state was
`blocked`, with a next gate to run a bounded probe using a supported WebMCP Agent adapter. The issue is
now resolved by SK-TASK-059 and SK-EVID-045; the original framing is retained below as historical traceability.

Two capability probes had already run and both failed. This record did not run a third. It compared
the recorded observations against each other to convert an open-ended search into a small set of
decidable questions.

## 1a. Resolution, 2026-09-03

D1 and D2 are answered. [`SK-EVID-044`](../Evidence/SK-EVID-044-cp13-site-tools-eligibility-research.md)
records the vendor and standards documentation:

- ChatGPT "Site Tools" is that vendor's implementation of WebMCP, and it names
  `document.modelContext.registerTool()` as the registration API. The two surfaces this record
  worried might be unrelated are the same mechanism. Section 4 below is superseded on that point.
- Site tools require **GPT-5.6 Sol or GPT-5.6 Terra**. **GPT-5.6 Luna currently has WebMCP disabled.**
  Both recorded game probes ran on `gpt-5.6-luna`, so the adapter error was literal and correct.

`SK-ISSUE-001` was therefore not a capability absence. At that point the remaining work was D3, D5,
and the decisive D6 on an eligible model. Section 1b records that D6 is now complete; the rest of this
record is retained because its differential method and check ordering explain the investigation path.

## 1b. Closure update — 2026-09-03

The supported-model experiment in Validation/70 and SK-EVID-045 answered the decisive D6 question:
GPT-5.6 Sol with site tools enabled discovered and read-only invoked the disposable page tool. The
model-eligibility hypothesis is confirmed, SK-ISSUE-001 is resolved, and the remaining CP-13 gate is
owner acceptance plus canonical game-page implementation. The earlier blocked-state language below is
historical and retained for traceability.

## 2. The three recorded observations

| Dimension | Frozen MVP1 P0, 2026-08-30 | CP-02 probe, `SK-EVID-001` | CP-13 probe, `SK-EVID-030` |
|---|---|---|---|
| Client | ChatGPT Desktop `26.825.41651` build `7345` | Codex In-app Browser, browser `6`, tab `2` | Codex In-app Browser, browser `8`, tab `6` |
| Page under test | `http://127.0.0.1:4317/workflows/WF-001` | Static probe page `http://127.0.0.1:8787/` | Canonical game page `http://127.0.0.1:3187/` |
| Named mechanism | "Site Tools", genuine page-bound inventory | `document.modelContext.registerTool` | `document.modelContext` lookup |
| Model | "a task and model eligible for Site Tools" | not recorded | `gpt-5.6-luna` |
| Page-side API present | not applicable to the recorded mechanism | **yes** | **no; `typeof document.modelContext` is `undefined`** |
| Tool discovery | **passed**; inventory contained exactly two tools | failed: `gpt-5.6-luna does not support command "webmcp_list_tools"` | same failure |
| Tool invocation | **passed**; `continue_artifact` was invoked | not attempted | not attempted |

Source lines: `mvp/evidence/p0-correlated-clean-run-2026-08-30-verdict.md` header and Q4;
`Docs/Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md`;
`Docs/Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md`.

## 3. Finding 1 — the page-side API result is not stable across sessions

CP-02 observed `document.modelContext` present, with `registerTool` callable and a successful
registration readback. The CP-13 probe observed `typeof document.modelContext` as `undefined`. Both
used the Codex In-app Browser; the recorded browser and tab identities differ.

`document.modelContext` is injected by the host browser. A page cannot create it. The CP-02 probe page
was inspected for this record and contains no polyfill: `probe/cp02/public/index.html` reads
`document.modelContext` directly and reports `unsupported` when it is absent. The canonical game page
contains no registration code at all, which is expected because CP-13 is unimplemented, but that
absence cannot explain a missing host-injected object either.

**Therefore the host injection varied between two sessions of the same browser on the same machine on
the same day.** That is an environment or session condition, not a property of either page.

This materially strengthens the assumption already recorded in `SK-ISSUE-001` that the limitation is
adapter- or context-specific rather than a defect in page registration. It also means a third probe
run without first controlling that condition would produce another uninformative result.

## 4. Finding 2 — the frozen P0 success may not be the same mechanism

An earlier evidence record, [`SK-EVID-004`](../Evidence/SK-EVID-004-cp02-independent-reproduction-and-claim-review.md),
stated that a proven configuration for genuine page-bound WebMCP discovery and invocation already
exists in this repository, and recommended reproducing it. That recommendation needs one correction
before it is acted on.

The P0 run proved **Site Tools** in **ChatGPT Desktop**, using the Desktop built-in Browser. It did
not record `document.modelContext`. The game is targeting `document.modelContext`, the WebMCP page
API, in the Codex In-app Browser. Whether "Site Tools" and `document.modelContext` are the same
underlying mechanism under two product names, or two different surfaces, is **not established by any
record in this repository**.

That question is the first thing to settle, because the answer changes what "a supported adapter"
means:

- if they are the same mechanism, the P0 preconditions are directly reusable and the gap is likely
  configuration; and
- if they are different surfaces, then no configuration in this repository has ever proven
  `document.modelContext` discovery, and CP-13 needs a different route or an explicitly narrowed
  claim.

## 4a. Historical partial answer to D1, preserved here on the owner's instruction

The CP-13 page-tool proposal in
[`64-cp13-page-tool-contract-preimplementation-challenge.md`](64-cp13-page-tool-contract-preimplementation-challenge.md)
contains the strongest evidence in this repository bearing on D1. It is recorded here so that it
survives whatever the owner decides about that proposal.

At that earlier stage, the proposal cited the WebMCP draft Community Group Report and recorded that the draft "explicitly
says that it does not prescribe the format used to expose tools to a browser Agent, and `getTools()`
is intended for in-page agents", concluding that page-side registration or `getTools()` readback "can
validate the page API only; it cannot close `SK-ISSUE-001` or substitute for a supported
browser/model adapter's genuine discovery and invocation".

**Historical consequence for D1.** The page API and browser-Agent discovery are specified as separate concerns.
A positive `document.modelContext` result was therefore never going to be sufficient on its own, and
the CP-02 result that reported "supported" was measuring only the page half. This does not fully
answer D1, because it does not establish whether ChatGPT Desktop "Site Tools" is the browser-Agent
half of the same specification or an unrelated surface. It does narrow D1 to that single question.

**Consequence for the check order.** D4, the page-injection check, drops in value. It can confirm that
the page half is available, but it cannot produce positive capability evidence on its own. D1, D2, and
D3 remain the checks that can actually change the outcome.

This paragraph is a citation of another document plus its consequence. It executed no probe and adds
no capability claim.

## 5. The recorded P0 preconditions

From `mvp/RUNBOOK.md`, the conditions that accompanied the only successful run:

1. ChatGPT Desktop `26.825.41651` build `7345` or a later compatible build.
2. **A task and model eligible for Site Tools**, verified against the official Site Tools page.
3. **`Settings > Browser > Permissions > Enable site tools`** enabled where that setting exists.
4. Node.js 24 or newer.
5. The Desktop task environment supplies `CODEX_SESSION_ID`, `CODEX_APP_TOOLS_PIPE_PATH`, and an
   executable `CODEX_MCP_NODE_PATH`.

Condition 2 is the one that most closely matches the observed failure text. The adapter did not report
that the page had no tools; it reported that **the model** does not support the discovery command.

## 6. Decidable checks

These are ordered so that the cheapest check that can end the investigation runs first. None of them
requires game code, and none should be run from a session that cannot satisfy condition 5 above.

| # | Question | How to decide | What each outcome means |
|---|---|---|---|
| D1 | Are "Site Tools" and `document.modelContext` the same mechanism? | Consult the official Site Tools documentation named in `mvp/RUNBOOK.md` condition 2 | Same: proceed to D2. Different: `SK-ISSUE-001` is not a configuration gap and CP-13 needs a route decision |
| D2 | Is the current session's model eligible for Site Tools? | Compare the active model against the official eligibility list | Ineligible: the recorded failure is explained; switch to an eligible model and rerun D4 |
| D3 | Is `Enable site tools` on for this client? | `Settings > Browser > Permissions` | Off: turn it on and rerun D4 before any other analysis |
| D4 | Does the host inject the page API in this exact session? | Open any local page and read `typeof document.modelContext` | `undefined`: the host is not injecting; D2 and D3 are the candidate causes. `object`: the injection works and the gap is discovery only |
| D5 | Do the Desktop task variables exist in the session that will run the probe? | The non-printing probe in `mvp/RUNBOOK.md` | Absent: the current-build bridge is unavailable in that task; do not search for another task's pipe |
| D6 | Can a supported adapter list the tools of a page that registers one? | Serve `probe/cp02/public/index.html` and call the adapter's tool listing | Lists the tool: `SK-ISSUE-001` closes and CP-13 unblocks. Fails: record the exact error and the exact model |

D6 deliberately reuses the existing CP-02 probe page rather than the game page. It is the smallest
surface that is already known to have registered a tool successfully, so a failure there isolates the
adapter from the game build.

## 7. What this record does not claim

No probe was executed for this record. It contains no new capability result, and it does not close or
downgrade `SK-ISSUE-001`. It does not establish that any adapter is available, that Site Tools and
`document.modelContext` are related, or that CP-13 can proceed. It does not authorize a page polyfill,
a substitute browser, DOM automation, or any silent fallback, all of which remain prohibited by
`SK-ISSUE-001` and the roadmap.

## 8. Historical suggested disposition (superseded by section 1b)

1. Answer D1 first. It is a documentation question and it determines whether the rest of the sequence
   is relevant at all.
2. If D1 says the mechanisms are the same, run D2 and D3 before any further probe. Both are settings
   inspections that cost minutes and either explains the recorded failure text.
3. Correct the recommendation in `SK-EVID-004` so that it no longer implies the P0 configuration is
   known to prove `document.modelContext`.
4. Record whichever of D1 through D6 is executed as a fresh `SK-EVID-*`, whether the outcome is
   positive or negative, and update `SK-ISSUE-001`'s next gate to name the exact remaining unknown.
5. Consider whether `SK-ISSUE-001` should remain `blocked`. D1 through D3 are actionable now, which
   is the definition of `ready` in [`../Issues/README.md`](../Issues/README.md).
