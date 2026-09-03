# SK-TASK-063: CP-16 Independent Browser-Context Capability Probe

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-16`
- Owner: Game owner
- Current increment: The Codex In-app Browser two-tab probe and close-one lifecycle observation are runtime-verified at ladder level 4; both tabs rendered server-derived alpha scope and the surface exposed no independent-context operation.
- Next gate: Use a genuinely context-capable browser surface to obtain distinct server-derived alpha/beta scopes and privacy readback; keep the level-5 claim open and do not promote shared-profile tabs.

## Identity

- Task ID: `SK-TASK-063`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: The probe crosses browser context/session ownership, server-derived scope, realtime first-frame binding, privacy projection, and the CP-16 evidence ladder. A shared profile or client-selected handle could create a false two-player result.

## Objective

Determine whether an available supported browser surface can create two genuinely independent
contexts for the canonical Sleepless Kingdom page, then prove server-derived alpha/beta scope,
private projection isolation, and close-one lifecycle if the capability exists. If the surface only
offers shared-profile tabs, record the exact limitation and preserve the lower-level local evidence.

## Success and non-goals

- Success: Two fresh browser contexts load the canonical page against one explicit local fixture and receive distinct server-derived player/shelter scopes without client-supplied identity.
- Success: Each context's bootstrap, first snapshot, mission/history projection, and visible private state are scoped to its own player; closing one context leaves the other readable and does not create a duplicate effect.
- Success: If no supported context-isolation operation exists, the exact browser/runtime capability result, shared-cookie or shared-scope observation, and missing evidence are recorded as a typed limitation.
- Non-goals: WebMCP discovery or invocation, Re-entry delivery, gameplay commands, new identity/session schemas, browser polyfills, production authentication, hosted continuity, deployment, or final visual polish.

## Scope and authority

- In scope: the canonical local fixture process, one supported browser surface, two browser contexts or tabs, read-only bootstrap/first-frame inspection, private-state comparison, close-one observation, this task's evidence and validation records, and current-status/task-index links.
- Out of scope: `src/` behavior changes, `reentry-core/`, `mvp/`, RightSpot, external Receiver/Connector, WebMCP tool calls, persistence/snapshot schema, gameplay rules, credentials, deployment, and unrelated dirty files.
- Allowed actions: Start and stop a task-local fixture, use the supported browser-control surface, collect read-only page/runtime observations, add English evidence records, and run focused CP-12/CP-16 tests and documentation validators. Do not stage, commit, push, deploy, or contact external parties.
- Revalidate when: the fixture cookie/session policy, first-frame validator, projection visibility contract, browser runtime, or canonical page changes.

## Owning authority

- Projection and visibility: [`ADR-GAME-0028`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Fixture/session and first-frame binding: [`ADR-GAME-0029`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Browser limitation predecessor: [`SK-TASK-042`](SK-TASK-042-cp12-independent-two-session-browser-isolation.md) and [`Validation/48`](../Validation/48-cp12-two-session-browser-isolation-runtime-cross-functional-audit.md)
- CP-16 acceptance: [`SK-TASK-016`](SK-TASK-016-cp16-local-vertical-slice-preimplementation-pack.md) and [`CP-16 fixtures`](../Scenarios/16-cp16-local-vertical-slice-fixtures.md)
- Cross-boundary route: [`CP-13–CP-18 seam map`](../Engineering/10-cp13-cp18-implementation-seam-map.md)

## Evidence status

- Verified predecessor: one local browser context hydrates the server-scoped projection; the prior two-tab attempt reused alpha scope and did not prove independent contexts.
- Unknown: whether the selected browser surface exposes a genuine context-isolation operation and whether alpha/beta privacy and lifecycle can be observed through it.
- Claim boundary: a positive result may support only the observed local two-context scope; a shared-profile result remains a limitation and cannot support level-5, hosted, WebMCP, Agent, or judge claims.

## Probe plan

1. Record source, contract, Node 24 runtime, browser identity/version, fixture port, and fresh temporary database class without secrets.
2. Start one entrypoint-owned `LOCAL_FIXTURE_MODE=1` process and verify readiness before opening pages.
3. Use the supported browser API to create two contexts when available; otherwise create the minimum tabs needed to demonstrate the limitation and stop the positive branch.
4. Read each server bootstrap and first full snapshot, compare only player-visible scope/privacy fields, and close one context while observing the other.
5. Stop the fixture, preserve the exact capability result, and classify the outcome as positive two-context evidence or an explicit limitation.

## Cross-functional assertions

- The browser cannot choose `player_id`, `shelter_id`, world, binding, position, clock, mission, or hidden state.
- The worker, persistence store, fixture resolver, and projection remain one entrypoint-owned authority; the probe cannot add a second worker, store, resolver, or client state authority.
- Alpha/beta privacy covers missions, cargo summaries, causal history, private shelter data, and exact hidden state; public map landmarks remain distinguishable from private state.
- Closing one context cannot stop the worker or mutate the other context; no state-changing command is sent by this task.
- WebMCP, Agent grants, Re-entry, hosted continuity, and judge reproduction remain separate gates.

## Verification and closure target

- Minimum verification: exact source/contract/runtime/browser identity, fixture health, two-context or typed limitation readback, privacy comparison, close-one lifecycle observation, focused CP-12 checks, evidence/validation records, and both documentation validators.
- Closure target: `runtime_verified` for the exact positive two-context observation or the exact supported-browser limitation; the independent two-session gate remains open unless positive evidence meets every acceptance row.
- Rollback or remediation: Stop the local fixture process and remove no files. If scope or privacy is ambiguous, preserve the failure and return to the one-context boundary.
- Reopen trigger: shared mutable session state is mistaken for isolation, a first frame accepts client-selected identity, private state crosses contexts, closing one context affects the other, or the browser/runtime changes.

## Probe exception and claim limits

This is a read-only capability/runtime probe, so the documented TDD exception applies; no Red/Green
behavior implementation is authorized. Browser screenshots, tabs, or a local stub are evidence only
for the exact observed surface and cannot substitute for independent contexts, external delivery,
hosted continuity, or judge reproduction.

## Execution result

- The fresh Node 24 fixture reached `runtime_ready` on `127.0.0.1:3194`. Two newly created IAB tabs
  (`6` and `7`, browser id `2`) loaded the canonical page and both rendered `shelter-a`, Wood/Rock
  `1/1`, five `soldier-a-*` rows, position `16,64`, and `0 events`.
- The browser API exposed tabs plus `visibility`, `viewport`, `pageAssets`, and `webmcp`; no documented
  context creation or isolation operation was available. Closing tab `6` left tab `7` READY.
- The fixture was stopped cleanly; no command, WebMCP invocation, external delivery, cookie/storage
  inspection, or repository behavior change occurred. Exact evidence and cross-functional disposition
  are recorded in [`SK-EVID-051`](../Evidence/SK-EVID-051-cp16-independent-browser-context-capability-probe.md)
  and [`Validation/77`](../Validation/77-cp16-independent-browser-context-capability-runtime-cross-functional-audit.md).

## Closure

This task is `runtime_verified` for the named IAB two-tab limitation and close-one lifecycle only. The
independent two-session, CP-16 level-5, hosted, WebMCP, Agent, Re-entry, and judge gates remain open.
