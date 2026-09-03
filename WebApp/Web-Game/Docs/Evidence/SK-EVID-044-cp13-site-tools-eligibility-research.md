# SK-EVID-044: CP-13 Site Tools Eligibility Research

## Identity

- Evidence ID: `SK-EVID-044`
- Related task, issue, or decision: [`SK-TASK-056`](../Tasks/SK-TASK-056-cp13-capability-differential-diagnostic.md); [`SK-ISSUE-001`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md); [`Validation/68`](../Validation/68-cp13-webmcp-capability-differential-diagnostic.md)
- Evidence class: `static`, external documentation research
- Ladder level: `1`. This record contains no capability probe and no runtime result.
- Executor and date: Independent reviewer session, 2026-09-03, Europe/London

## Objective and claim boundary

- Question under test: check D1 of `Validation/68` — are ChatGPT "Site Tools" and the WebMCP page
  API `document.modelContext` the same mechanism or two different surfaces?
- Claim this evidence may support: what the current public vendor and standards documentation states
  about the mechanism, the eligible models, and the required client configuration.
- Claims this evidence cannot support: that the game page works, that any adapter is present on this
  machine, that a supported model is available to this account, or that CP-13 can proceed. Vendor
  documentation is not runtime evidence and does not close a capability gate.

## Sources consulted

| Source | Retrieved | Relevance |
|---|---|---|
| WebMCP draft Community Group Report, `https://webmachinelearning.github.io/webmcp/` | 2026-09-03 | Defines the page API and its browser-agent boundary |
| ChatGPT Site Tools documentation, `https://learn.chatgpt.com/docs/webmcp` | 2026-09-03 | Vendor implementation, model eligibility, and client requirements |

## Findings

### F-1 — D1 is answered: they are the same mechanism

The vendor documentation states that site tools are ChatGPT's implementation of the WebMCP standard,
and it names `document.modelContext.registerTool()` as the API a website uses to register tools.

This closes the D1 branch. The two surfaces are not unrelated. The earlier concern recorded in
`Validation/68` section 4 — that the frozen MVP1 P0 run may have proven a different mechanism — is
resolved: P0's "Site Tools" and the game's `document.modelContext` target are the same path under two
names.

The draft's own boundary still holds and is consistent with this: the specification says it "does not
prescribe the format in which tools are exposed to the browser agent", and that `getTools()` is
designed for "in-page" agents. Site tools is one vendor's implementation-defined answer to that
deliberately unspecified half.

### F-2 — The recorded failures are explained by model eligibility

The vendor documentation states that site tools require **GPT-5.6 Sol or GPT-5.6 Terra**, and that
**GPT-5.6 Luna currently has WebMCP disabled**.

Both recorded game probes ran on `gpt-5.6-luna`:

- [`SK-EVID-001`](SK-EVID-001-cp02-capability-and-runtime-probe.md) recorded the adapter error
  `gpt-5.6-luna does not support command "webmcp_list_tools"`.
- [`SK-EVID-030`](SK-EVID-030-cp13-webmcp-capability-probe.md) recorded `model gpt-5.6-luna` and the
  same error, plus `typeof document.modelContext` as `undefined` on the canonical page.

The adapter error was therefore literal and correct. `SK-ISSUE-001` has been open against the one
model the vendor documents as having the feature disabled.

### F-3 — The remaining client requirements are named

The documentation names three further conditions: update to the latest ChatGPT desktop app, use its
built-in browser, and enable site tools under `Settings > Browser > Permissions`. It also records that
site tools are unavailable in Enterprise and Edu workspaces, and that availability depends on rollout.

These match the preconditions already recorded in `mvp/RUNBOOK.md` for the frozen P0 run, which
strengthens F-1 by independent agreement.

### F-4 — The page-side `undefined` observation is now explicable

`SK-EVID-030` observed `typeof document.modelContext` as `undefined` on the canonical page, while
`SK-EVID-001` observed the object present on the CP-02 probe page. Under F-2 and F-3 this is
consistent with host injection being conditional on model eligibility, the client setting, and
rollout, rather than with any property of either page. It remains an observation, not a proven
mechanism.

## Effect on the `Validation/68` checks

| Check | Prior state | New state |
|---|---|---|
| D1 same mechanism | unknown, gating | **Answered: same mechanism** |
| D2 model eligible | unknown | **Answered for the tested sessions: `gpt-5.6-luna` is ineligible; Sol or Terra required** |
| D3 client setting enabled | unknown | Still to check on the machine that will run the probe |
| D4 host injects the page API | unknown | Lower value; expected to follow from D2 and D3 |
| D5 Desktop task variables present | unknown | Still to check in the session that will run the probe |
| D6 supported adapter lists a registered tool | unknown | **Now the decisive remaining check**, to be run on Sol or Terra |

## Analysis and closure

- Failure classification for the prior probes: `environment`. The selected model had the feature
  disabled by the vendor.
- Limitations and residual risk: this is documentation, retrieved once, from a vendor surface that can
  change. It does not establish that an eligible model is available to this account, that the rollout
  covers it, that the workspace type qualifies, or that the game page registers correctly. A positive
  capability claim still requires D6 to be executed and recorded separately.
- Invalidation triggers: a change to the vendor documentation, the model eligibility list, the client
  requirements, the account or workspace type, or the rollout state.
- Exact conclusion: **`SK-ISSUE-001` is not a capability absence. It is a model-eligibility condition
  that the vendor documents explicitly. The issue should move from `blocked` to `ready`, and its next
  gate should name running the existing probe on GPT-5.6 Sol or Terra with site tools enabled.** No
  CP-13 implementation claim follows from this record.
