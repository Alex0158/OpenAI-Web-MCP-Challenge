# TASK-007: Start a Fresh Local Codex Session from the Connector

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-01

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Eyad and project team
- Current increment: Replace private Codex thread mapping with one fresh Codex CLI session per
  claimed delivery.
- Next gate: Prove a supported real Codex-to-Browser-to-page-bound-WebMCP route before selecting a
  production Agent adapter.
- Dependencies: ADR-0011, ADR-0026, and TASK-003.

## Objective

Make the one-process Local Connector preview start a new Codex session with enough validated page
context and fixed instructions to demonstrate the Connector-to-agent handoff without mapping an
existing session.

## Required outcome

The Local Connector must:

1. remain the only local process;
2. keep the Cloud Receiver transport unchanged;
3. require an explicit host-project working directory for the Codex preview;
4. invoke `codex exec` once with a fixed continuation prompt;
5. include no lease token, Connector credential, or private process configuration in the prompt;
6. classify process success, process failure, and timeout through the existing typed result; and
7. expose terminal commands and tests that do not require a real Codex action.

## 4. Non-goals

- existing-session lookup or thread mapping;
- production Codex integration or account authentication;
- Browser acquisition, WebMCP discovery, or Host-effect proof;
- automatic acknowledgement, retry, or fallback; or
- a second local Receiver service.

## Implemented surfaces

- `runtime/local-connector/src/codex-exec-adapter.mjs`;
- `runtime/local-connector/src/main.mjs` and package exports;
- `runtime/local-connector/test/codex-exec-adapter.test.mjs`; and
- Local Connector README and the local decision/development records.

## 5. Verification and closure

The focused and full test results are recorded in CLOUD-008. The current shell's Node 24 closure
baseline and a real Codex action remain separate verification boundaries.

## 6. Reopen condition

Reopen if the fresh-session preview is treated as managed-context resume, Browser/WebMCP return,
Host-effect proof, or a production Agent adapter, or if its credential-free input boundary changes.
