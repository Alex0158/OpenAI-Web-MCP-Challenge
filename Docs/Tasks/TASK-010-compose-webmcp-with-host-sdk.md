# TASK-010: Compose WebMCP with the Host SDK

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-01

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Eyad and project team
- Current increment: One browser JavaScript action now serves ordinary Host UI and a top-level
  WebMCP Site Tool while Re-entry approval and binding authority remain server-side.
- Next gate: TASK-001 selects the Host and its real tool schema; TASK-003 owns production Receiver,
  persistence, deployment, and supported Agent-return evidence.
- Dependencies: ADR-0028, Mechanism 05, and the existing account-first Host SDK routes.

## Objective

Give a Host developer one small integration seam:

```text
normal page button ----\
                       -> one JavaScript action -> Host SDK -> Re-entry approval
WebMCP Site Tool ------/
```

The same action must create a signed consent session through the Host server, show the SDK handoff,
wait for the authenticated Re-entry decision, and ask the Host server to confirm and retain the
opaque continuation. A later Host business event remains the trigger that returns work to Codex.

## Current gap and falsifiable outcome

The account-first SDK can create a consent session and render the Re-entry popup, but its sample does
not register a genuine top-level Site Tool or package the complete shared action. The increment fails
if the Site Tool and normal UI use different authority paths, if a popup completion message alone is
treated as a Grant, if browser code receives an organization key, Host private key, opaque binding,
or Connector identity, or if the normal page action stops working when WebMCP is unavailable.

## Required outcome

1. Export one browser action that accepts Host callbacks for creating and confirming a consent
   session and uses the existing Re-entry prompt.
2. Make that function directly usable as a WebMCP `execute` handler and from ordinary page UI.
3. Register one narrow Site Tool with JavaScript on the top-level sample page and preserve the
   normal button as the no-WebMCP path.
4. Require the Host server to re-read approved status and retain the opaque binding before the
   browser receives a safe continuation reference.
5. Document the exact first action, later Event, credential boundaries, setup, and coding-agent
   integration instructions.

## 4. Non-goals

- changing Receiver consent authority, WebMCP safety review, or the Connector delivery protocol;
- exposing the later consequential Host action as a Site Tool;
- selecting a final Host application or its business event;
- public deployment, npm publication, or production authentication; or
- claiming genuine Codex discovery or cross-machine return from unit tests and a local build.

## 5. Verification and closure

Close at `locally_verified` only when focused tests prove that both entry paths call the same action,
approval requires server confirmation, decline and unsupported-WebMCP behavior remain visible, the
Next.js sample builds, and the owning Mechanism, Development record, SDK README, and current status
state the same bounded claim.

## Verification evidence

- Host SDK v0.3 passes 18 tests on Node 24.20.0 and Node 26.8.1.
- The Next.js sample builds with consent, confirmation, and separate Event routes.
- Package inspection contains only the README, package manifest, and three source entrypoints.
- A live Codex in-app Browser discovered and invoked `request_codex_reentry`; the unconfigured test
  server returned a bounded setup error and the page displayed the same state.
- HOST-002 records the exact proof boundary and residual configured-flow and production gaps.

## 6. Reopen condition

Reopen if current WebMCP registration changes, a supported browser cannot invoke the shared action,
Host or Re-entry credentials cross into page JavaScript, or the sample can report an approved
continuation without an approved Receiver status.
