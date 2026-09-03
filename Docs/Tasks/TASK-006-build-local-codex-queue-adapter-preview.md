# TASK-006: Build the Local Codex Queue Adapter Preview

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-01

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Eyad and project team
- Current increment: Local Connector and Codex adapter run in one process and pass focused tests.
- Next gate: Prove a supported real Codex-to-Browser-to-page-bound-WebMCP route before selecting a
  production Agent adapter.
- Dependencies: ADR-0011, ADR-0025, and TASK-003.

## Objective

Provide one terminal-testable local process that claims a Receiver delivery and can optionally
queue a bounded continuation message to an existing local Codex session through the internal Agent
Adapter seam.

## Required outcome

The Local Connector must:

1. remain the only local process;
2. keep the Cloud Receiver transport unchanged;
3. invoke Codex only when an explicit thread/session reference is supplied;
4. send one fixed continuation message without Receiver or lease credentials;
5. classify success, process failure, and timeout through the existing typed adapter result; and
6. expose terminal commands and tests that do not require a real Codex action.

## 4. Non-goals

- production Codex integration or account authentication;
- Browser acquisition, WebMCP discovery, or Host-effect proof;
- automatic acknowledgement, retry, or fallback;
- a second local Receiver service; or
- persistent multi-user Grant-to-context binding.

## Implemented surfaces

- `runtime/local-connector/src/codex-queue-adapter.mjs`;
- `runtime/local-connector/src/main.mjs` and package exports;
- `runtime/local-connector/test/codex-queue-adapter.test.mjs`; and
- Local Connector README and terminal test script.

## 5. Verification and closure

The following passed on Node `v22.14.0` in the current environment:

1. `npm run check:syntax`;
2. `npm run test:codex` (`3/3`); and
3. `npm test` (`5/5`).

The repository's Node 24 closure baseline was not available in this shell, and no real Codex
session was queued by the test run.

## 6. Reopen condition

Reopen if this historical adapter is presented as a supported production Codex, Browser, WebMCP,
or effect-acknowledgement path, or if its bounded one-call result contract changes.
