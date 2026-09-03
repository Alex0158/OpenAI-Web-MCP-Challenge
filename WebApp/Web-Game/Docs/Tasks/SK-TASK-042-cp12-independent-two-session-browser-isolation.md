# SK-TASK-042: CP-12 Independent Two-Session Browser Isolation Probe

## Task Control

- Lifecycle state: `verified`
- Closure type: `runtime_verified`
- Checkpoint: `CP-12`
- Owner: Game owner
- Current increment: Two tabs under the selected In-app Browser reached the server-derived alpha projection and one-tab close lifecycle state; the used surface did not provide a proven independent context, so the level-5 isolation claim remains open.
- Next gate: Use a browser surface that can create genuinely independent contexts for alpha/beta scope and privacy proof; proceed with the separately registered keyboard/reconnect task while this context limitation remains recorded.

## Identity

- Task ID: `SK-TASK-042`
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: The slice crosses cookie/session ownership, realtime first-frame binding, visibility, browser lifecycle, and the level-5 two-player claim. Shared browser state or a client-selected handle could make a false isolation result look like a working multiplayer page.

## Objective

Close the remaining CP-12 browser isolation gate with evidence that two independent browser
contexts can join the same accepted `sleepless-mvp-01` fixture while receiving only their own
server-derived player/shelter projection. The probe must also distinguish a true two-session result
from a browser surface that only offers tabs sharing one profile. A browser limitation is recorded as
an explicit negative result and never converted into a two-player claim.

## Success and non-goals

- Success: Two independent contexts load the canonical page without client-supplied identity, receive distinct alpha/beta bootstrap scopes, and accept first frames whose world/player/shelter scope matches the server response.
- Success: Each context exposes only its own missions, cargo summaries, resource read model, event history, and visible landmarks; the other shelter's private state is absent.
- Success: Closing one context leaves the other readable and does not create a duplicate command, event, or session binding; a supported reconnect path replaces stale projection with a full current frame.
- Success: If the selected browser cannot create independent contexts, the exact capability limitation, shared-cookie observation, and missing evidence are recorded without claiming level-5 delivery.
- Non-goals: WebMCP discovery or invocation, Re-entry delivery, state-changing browser controls, new identity schemas, production authentication, default scheduler, hosted continuity, performance/FPS, or final visual polish.

## Scope and authority

- In scope: The canonical `app/page.tsx`, CP-12 fixture bootstrap and realtime first-frame path, two browser contexts, scope/visibility readback, and task-owned runtime evidence.
- Out of scope: `reentry-core/`, `mvp/`, RightSpot, WebMCP tools, production identity, persistence/snapshot schema, gameplay rules, external services, and any new worker/store or transport protocol.
- Allowed actions: Start an isolated local fixture process, create or select independent browser contexts through the available browser surface, perform read-only page/bootstrap/WebSocket observation, add task-owned evidence, and run the focused CP-12 checks. Do not stage, commit, push, deploy, use credentials, spend, or contact external parties.
- Revalidate when: The fixture cookie/session policy, first-frame validator, projection visibility contract, browser runtime, or canonical page changes.

## Owning authority

- Projection and visibility: [`../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md`](../Decisions/ADR-GAME-0028-cp12-client-projection-read-model.md)
- Fixture/session and first-frame binding: [`../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md`](../Decisions/ADR-GAME-0029-cp12-local-fixture-session-boundary.md)
- Browser acceptance vectors: [`../Scenarios/12-cp12-canvas-dashboard-fixtures.md`](../Scenarios/12-cp12-canvas-dashboard-fixtures.md)
- Prior challenge and one-context evidence: [`../Validation/46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md`](../Validation/46-cp12-browser-hydration-and-two-session-preimplementation-challenge.md), [`../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md`](../Evidence/SK-EVID-029-cp12-browser-hydration-runtime-verification.md), and [`../Validation/47-cp12-browser-hydration-runtime-cross-functional-audit.md`](../Validation/47-cp12-browser-hydration-runtime-cross-functional-audit.md)

## Evidence status

- Verified predecessor: One real browser context hydrates the server-scoped projection and exposes a readable closed-channel fallback under `SK-EVID-029`.
- Verified limitation: The previous second named tab reused `fixture-v1-alpha` and `shelter-a`; it did not provide independent two-session evidence.
- Verified limitation: A fresh two-tab run under browser id `8` again showed `shelter-a`/`soldier-a-*` in both tabs; closing tab `7` left tab `8` READY. The exact runtime observation and limitation are [`SK-EVID-031`](../Evidence/SK-EVID-031-cp12-two-session-browser-isolation-probe.md), audited in [`Validation/48`](../Validation/48-cp12-two-session-browser-isolation-runtime-cross-functional-audit.md).
- Unknown: Whether another supported browser surface can create two independent contexts, whether alpha/beta private projection filtering remains correct across them, and whether reconnect can be exercised without changing authority.

## Cross-functional checks

1. **Identity:** Bootstrap and first-frame scope must be server-derived. A URL, query, form field, cookie value copied by the client, or browser script cannot select the player.
2. **Privacy:** Alpha may not receive beta's private missions, cargo, event history, or exact hidden state; beta may not receive alpha's. Shared public landmarks must remain distinguishable from private shelter state.
3. **Lifecycle:** Closing one context must not stop the worker or mutate the other context. Any reconnect must accept a fresh full snapshot before a command is considered.
4. **Authority and effects:** This probe sends no state-changing command. No second worker, store, resolver, identity map, or client-side state authority may be introduced to make the contexts appear independent.
5. **Capability boundary:** A browser tab with a shared profile is an evidence limitation, not an independent session. WebMCP and Re-entry remain separate gates.

## Smallest reversible action

Start one isolated `LOCAL_FIXTURE_MODE=1` process, open two independent contexts at the canonical
page, read each bootstrap and first-frame scope, compare only player-visible data, close one context,
and capture the remaining context's state. If the browser surface provides tabs only, record the
shared-cookie result and stop without adding a workaround.

## Verification and closure target

- Minimum verification: exact source/contract/runtime/browser identity, alpha/beta bootstrap and first-frame readback or a typed browser-context limitation, private-state comparison, lifecycle observation, focused CP-12 checks, and documentation/evidence validation.
- Closure target: `runtime_verified` for the exact two-context result or the exact browser limitation. A positive level-5 claim requires genuinely independent contexts; a limitation closes only this probe attempt and leaves the two-session gate open.
- Rollback or remediation: Stop the local fixture process, remove no files, and change no authority. If scope or visibility is ambiguous, preserve the evidence as a failure and return to the one-context CP-12 boundary.
- Reopen trigger: shared mutable session state is mistaken for isolation, a first frame binds client-selected identity, private state crosses contexts, closing one context affects the other, reconnect accepts stale state, or the browser/model/runtime changes.

## Execution result

- Local process and hydration: passed at `http://127.0.0.1:3187/` with `SK-MVP-0.2`, world time `0`, `Connection: READY`, and readable five-soldier projections in tabs `7` and `8`.
- Scope comparison: both tabs showed server-derived `shelter-a`, Wood/Rock `1/1`, five `soldier-a-*` rows, and `CAUSAL HISTORY 0 events`; no beta scope was available.
- Lifecycle: closing tab `7` left tab `8` READY with `shelter-a` and `0 events`.
- Independent context: not proven; tabs shared browser id `8` and the used API supplied no context-isolation operation. No cookie or local-storage inspection was performed.
- Evidence: [`SK-EVID-031`](../Evidence/SK-EVID-031-cp12-two-session-browser-isolation-probe.md) and [`Validation/48`](../Validation/48-cp12-two-session-browser-isolation-runtime-cross-functional-audit.md).

## Analysis and closure

- Exact conclusion: **This task is `runtime_verified` for the named two-tab local observation and browser-context limitation only. It does not close the independent two-session gate or support a level-5 claim.**
- Residual risk: A supported browser/context surface is still required to prove alpha/beta privacy and independent lifecycle behavior.
