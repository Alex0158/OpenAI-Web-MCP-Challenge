# TASK-025: Build the Simple Developer-to-Connector Flow

**Status:** `closed`  
**Owner:** Coordinating project manager with SDK, Cloud Receiver v2, and Local Connector teams  
**Profile:** Assured  
**Scope:** Developer self-service control plane, additive simple SDK facade, consented instruction
propagation, and full-chain verification  
**Authority:** ADR-0041, Core/09, Mechanisms/01 through 05

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P0`
- Owner: Coordinating project manager; bounded source ownership is delegated by subsystem.
- Current increment: Closed at separate-process verification; the simple facade, v2 developer portal,
  consented instruction, and Local Connector safety frame passed their bounded local gates.
- Next gate: TASK-031 must release the simple SDK from exact source; TASK-024 and the selected-app
  work retain deployed-flow and concrete Agent/Browser verification.
- Dependencies: Existing v2 pairing, consent, Event, claim, acknowledgement, and connector
  disconnection increments.

## Problem and user impact

The protocol path is locally composable, but the active developer portal does not let a normal
developer create an organization or API key, inspect redacted Event traffic, or navigate a simple
workspace. The Host SDK also exposes protocol construction details that should remain internal for
the common one-run continuation case.

As a result, a new developer cannot self-serve the integration even though the lower-level
protocol components exist.

## Falsifiable outcome

A new developer can create an organization and key, integrate one Host action using only a subject,
prompt, and URL, obtain user consent, fire the later business trigger, and observe a redacted Event
advance through delivery to acknowledgement while a separately running Local Connector launches
the exact canonical page with the consented instruction inside a fixed safety frame.

## Affected surfaces and owners

- Host SDK team: `runtime/host-sdk/` facade, tests, and package documentation.
- Cloud Receiver v2 team: `saas-boilerplate/` developer control APIs, portal UI, Event read model,
  and instruction delivery projection.
- Local Connector team: bounded instruction consumption in the Codex adapter and focused tests.
- Coordinating thread: `reentry-core/` activation validation, cross-layer authority documents,
  integration, persona tests, and final claim boundary.

## 4. Non-goals

- No removal or weakening of the advanced SDK or signed protocol.
- No hidden retries, polling, alternate transports, generic browser automation, or resumed-session
  search.
- No SDK-owned application database or business-state model.
- No browser exposure of organization keys, signing keys, bindings, or Connector credentials.
- No claim that arbitrary business logic is safe without Host authentication, an authoritative
  trigger, current page state, valid WebMCP tools, and a human boundary.
- No deployment, npm publication, or remote push without a separate exact release gate.

## TDD and verification gates

1. **Red:** focused tests fail for the absent simple SDK facade, developer control APIs, redacted
   Event list, instruction projection, Core validation, and Connector prompt framing.
2. **Green:** implement the minimum compatible behavior under ADR-0041.
3. **Refactor:** remove duplicate mapping and UI state while retaining exact external behavior.
4. Run SDK, Core, Connector, Receiver backend, frontend type/lint/build, repository validation, and
   sensitive-data scans.
5. Run a full-chain composition with distinct Host, Receiver, and Connector process boundaries
   where available; record database state through durable acknowledgement and exact replay.
6. Spawn separate developer and end-user persona tasks. Each must execute the flow from its own
   perspective, report blockers, and be rerun after every blocking correction.

## 5. Verification and closure

See [SDK-006](../Development/SDK-006-simple-consented-continuation-flow.md). Node 24 aggregate and
focused suites passed, the separately spawned Connector composition reached effect-backed
acknowledgement and exact restart replay, and both independent personas passed after their findings
were corrected and rerun. No commit, deployment, or publication is included in this task closure.

## 6. Reopen condition

Reopen for any secret exposure, cross-organization read, mutable post-consent instruction, prompt
treated as authority, canonical-URL mismatch, browser-supplied binding, hidden retry, Event `202`
mislabelled as completion, failed acknowledgement, or persona-blocking onboarding step.
