# CLOUD-007: Local Codex queue adapter preview

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Risk profile:** Standard local process and Agent-transport preview  
**Status:** `locally_verified` on the available Node runtime  
**Opened:** 2026-09-01  
**Task:** [TASK-006](../Tasks/TASK-006-build-local-codex-queue-adapter-preview.md)  
**Decision:** [ADR-0025](../Decisions/ADR-0025-adopt-local-codex-queue-adapter-preview.md)

## Objective

Make the Local Connector a single terminal-testable process that can claim one delivery and, when
explicitly configured, queue one fixed continuation message to an existing local Codex session.

## Topology

```text
Cloud Receiver
  <- outbound HTTP claim
Local Connector process
  -> internal Codex queue adapter
  -> local Codex CLI session
```

The adapter is an internal module. There is no local Receiver listener and no new Receiver route.

## Implemented behavior

- `claim-once` keeps the unsupported preview adapter when no Codex thread is supplied;
- `claim-once --codex-thread <session>` uses the internal Codex queue adapter;
- the adapter invokes the bundled Codex CLI with one fixed message and the validated canonical URL;
- the thread/session reference remains local and is not returned to the Receiver or printed;
- non-zero exit, process error, or timeout becomes `outcome_unknown`; and
- no activation result acknowledges a delivery or proves a Host effect.

## Verification

```text
npm run check:syntax       passed
npm run test:codex         3/3 passed
npm test                   5/5 passed
```

The focused tests use an injected fake process, so they do not wake or message a real Codex
session. The current shell ran Node `v22.14.0`; Node 24 remains the project closure baseline.

## Claim boundary

This record proves only the local Connector-to-CLI dispatch seam. It does not prove Agent startup,
Browser attachment, canonical navigation, WebMCP discovery, Site Tool invocation, Host effect, or
production readiness.
