# SK-TASK-041: CP-13 Fresh WebMCP Capability Probe

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-13`
- Owner: Game owner
- Current increment: The canonical CP-12 page was probed in a real local browser context; page-side `document.modelContext` was `undefined` and the selected adapter's `fetchTools()` returned the exact unavailable error, so no WebMCP invocation was attempted.
- Next gate: This negative probe is superseded on the capability question by the positive canonical-page Sol plus medium result in [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md); dynamic recall, Agent grant delivery, and downstream Re-entry remain separately gated.

## Identity

- Task ID: `SK-TASK-041`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The probe crosses the canonical page, browser capability surface, session ownership, and the CP-13/CP-14 handoff. A false positive would make a page registration or fallback look like genuine Agent capability and could authorize implementation against an unavailable adapter.

## Objective

Obtain a fresh, exact capability result for the canonical Sleepless Kingdom page: either a genuine
supported-adapter discovery and read-only invocation, or a typed unsupported/unavailable result bound
to the named browser, model, session, and source state. Do not manufacture a tool list, invoke a
synthetic callback, or treat `document.modelContext` presence alone as external Agent evidence.

## Success and non-goals

- Success: The canonical CP-12 page loads in the named local fixture boundary and the selected adapter
  result is recorded with browser/session/model identity, page URL, registered tool names/schemas when
  available, invocation output when genuinely executed, and visible unsupported behavior otherwise.
- Success: A genuine read-only call is server-scoped to the current fixture session and cannot accept a
  client-selected player, shelter, world, revision, or hidden state as authority.
- Success: The result leaves the CP-13 implementation scope unchanged until the capability boundary is
  real; a failed or unavailable adapter remains an explicit `SK-ISSUE-001` gate.
- Non-goals: Registering the production tool set, force recall, state-changing commands, Re-entry or
  Receiver delivery, scheduler work, production authentication, hosted deployment, new protocols,
  identity redesign, or a silent WebMCP polyfill.

## Scope and authority

- In scope: the canonical `app/page.tsx` page, current CP-12 local fixture bootstrap/realtime path,
  the browser capability adapter, read-only page registration/readback, and task-owned evidence.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, production identity, persistence or snapshot schema,
  mission/settlement rules, external Receiver/Connector code, and state-changing WebMCP tools.
- Allowed actions: run local fixture processes, use the selected browser and adapter read-only, inspect
  page capability state, add evidence or a narrowly scoped probe assertion, and run affected checks. Do
  not stage, commit, push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: the browser/model adapter changes, the page registration contract changes, the
  fixture session boundary changes, `SK-MVP-0.2` changes, or a genuine invocation would mutate state.

## Owning authority

- WebMCP and command boundary: [`../Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md)
- Page projection and local session: [`../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md) and [`../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- CP-13 preparation and vectors: [`SK-TASK-013`](SK-TASK-013-cp13-webmcp-preimplementation-pack.md) and [`../Scenarios/13-cp13-webmcp-fixtures.md`](../Scenarios/13-cp13-webmcp-fixtures.md)
- Capability issue: [`../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md`](../Issues/resolved/SK-ISSUE-001-webmcp-agent-adapter-unavailable.md)
- CP-12 predecessor: [`SK-TASK-040`](SK-TASK-040-cp12-browser-hydration-and-two-session-smoke.md), [`../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md`](../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md), and [`../Validation/47-cp12-browser-hydration-runtime-cross-functional-audit.md`](../Validation/47-cp12-browser-hydration-runtime-cross-functional-audit.md)

## Evidence status

- Verified: CP-02 recorded page-side `document.modelContext.registerTool` registration readback, while
  the current Codex Agent adapter could not enumerate or invoke the page tool. CP-12 now provides the
  canonical hydrated page and server-derived local fixture scope.
- Verified: The fresh CP-13 probe on `http://127.0.0.1:3187/` found `typeof document.modelContext ===
  "undefined"` and `fetchTools()` failed with `gpt-5.6-luna does not support command
  "webmcp_list_tools"`; the human projection remained usable. The exact result is
  [`SK-EVID-030`](../Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md).
- Inferred: A fresh adapter-specific probe is the smallest safe gate before CP-13 code because it
  separates page registration from genuine external discovery and invocation.
- Unknown: whether a different supported browser/model adapter can discover the page, the eventual
  tool-list schema, grant/binding propagation, invocation result shape, and whether a real read-only
  tool can execute without changing the accepted page/session authority.

## Probe boundary and assertions

1. Start one explicit local fixture process from the CP-12 entrypoint and load the canonical page at the
   exact URL recorded in the evidence.
2. Inspect the selected adapter's capability result and page tool list. Record `supported`, `unsupported`,
   `unavailable`, or a typed failure; do not reinterpret a browser API object as an Agent result.
3. If and only if the adapter returns a genuine page-bound tool list, invoke one read-only inspection
   tool from the accepted CP-13 proposal and record its server-derived scope, contract version, current
   revisions, and output.
4. Verify a browser without the adapter remains usable and visibly unsupported. If discovery is blocked,
   leave `SK-ISSUE-001` open and do not add a fake adapter, test-only success path, or state-changing tool.
5. Stop and reopen the challenge if the probe requires a new hello/ticket protocol, a client-selected
   identity, a second worker/store, a hidden grant, or a change to the human consequence boundary.

## Smallest reversible action

Run the capability discovery on the already verified canonical page, capture the exact adapter response,
and perform at most one read-only invocation when the response proves genuine page binding. Shut down the
local fixture process and preserve the result without changing game state.

## Verification and closure target

- Minimum verification: exact browser/session/model identity, page URL and source state, capability
  discovery output, read-only invocation output or typed unsupported result, visible human fallback,
  and documentation/evidence validation. No CP-13 implementation claim follows from page-side registration
  alone.
- Closure target: `runtime_verified` for the exact capability outcome. Genuine discovery/invocation may
  release the CP-13 implementation gate; an unavailable result closes only this probe attempt and keeps
  `SK-ISSUE-001` and CP-13 implementation open.
- Rollback or remediation: remove no files and change no authority. Return to the CP-12 page with the
  visible unsupported state if the adapter or invocation result is ambiguous.
- Reopen trigger: a capability result is inferred from a fallback, a synthetic tool list is reported as
  genuine, a tool bypasses session/ownership/revision checks, a read-only probe mutates state, or the
  browser/model/session/source identity changes.

## Execution result

- Page and server: passed against the entrypoint-owned `SK-MVP-0.2` fixture at
  `http://127.0.0.1:3187/`; the page reached `Connection: READY` with the server-derived
  `player-a`/`shelter-a` projection and five resident mission rows.
- Capability result: `unavailable`; `document.modelContext` was `undefined`, and the browser adapter
  returned `gpt-5.6-luna does not support command "webmcp_list_tools"`.
- Invocation result: intentionally not run because no genuine tool list was available. No game state,
  event, outbox row, cargo, coin, or mission was mutated.
- Human fallback: remained readable and usable; `Realtime capability` continues to describe transport
  status only and is not WebMCP evidence.
- Evidence: [`SK-EVID-030`](../Evidence/SK-EVID-030-cp13-webmcp-capability-probe.md).

## Analysis and closure

- Exact conclusion: **This task is `runtime_verified` for the named negative capability outcome only.
  CP-13 implementation remains gated by `SK-ISSUE-001`; no positive WebMCP or Agent claim follows.**
- Residual risk: A different supported adapter may expose a different result and requires a fresh probe
  before implementation. No page polyfill, fake tool, or silent fallback is permitted.
