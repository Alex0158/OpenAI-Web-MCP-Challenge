# CLOUD-008: Local Fresh Codex Session Preview

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Risk profile:** Standard local process and Agent-transport preview  
**Status:** `locally_verified` on the available Node runtime  
**Opened:** 2026-09-01  
**Task:** [TASK-007](../Tasks/TASK-007-start-fresh-local-codex-session-preview.md)  
**Decision:** [ADR-0026](../Decisions/ADR-0026-start-fresh-local-codex-session-preview.md)

## Objective

Make the Local Connector start a new local Codex session with the validated continuation context
and a fixed instruction to continue safely.

## Topology

```text
Cloud Receiver
  <- outbound HTTP claim
Local Connector process
  -> internal Codex exec adapter
  -> new local Codex session
```

The adapter is an internal module. There is no local Receiver listener and no new Receiver route.

## Implemented behavior

- `claim-once` keeps the unsupported preview adapter when no Codex directory is supplied;
- `claim-once --codex-cd <absolute host-project-directory>` uses the internal fresh-session Codex
  adapter;
- the adapter invokes `codex exec --cd <directory> <fixed prompt>`;
- the prompt includes the canonical page, workflow, event, state version, and human boundary, and
  instructs Codex to stop before the consequential action;
- no existing Codex session is looked up or mapped;
- non-zero exit, process error, or timeout becomes `outcome_unknown`; and
- no activation result acknowledges a delivery or proves a Host effect.

## Verification

```text
npm run check:syntax       passed
npm run test:codex         fresh-session adapter tests passed
npm test                   includes fresh-session and prior Local Connector tests
```

The focused tests use an injected fake process, so they do not start or message a real Codex
session. The current shell's Node 24 closure baseline and real Browser/WebMCP execution remain
unverified.

## Claim boundary

This record proves only the local Connector-to-new-Codex-process dispatch seam. It does not prove
Agent startup, Browser attachment, canonical navigation, WebMCP discovery, Site Tool invocation,
Host effect, acknowledgement, or production readiness.
