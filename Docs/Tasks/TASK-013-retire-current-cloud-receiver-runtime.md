# TASK-013: Retire the Current Cloud Receiver Runtime

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-02

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Project team
- Current increment: Completed source and documentation retirement for the current
  `runtime/cloud-receiver` package, Vercel entry point, and Cloud Receiver-specific guidance
  without deleting historical evidence.
- Next gate: None for this task. External Vercel archival or database-retention handling remains a
  separate authorized operations action.
- Dependencies: [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md),
  [TASK-003](TASK-003-productionize-and-deploy-cloud-receiver.md), and the Primary Development
  Runbook.

## 1. Objective

Retire the current Cloud Receiver implementation as a product and deployment path while keeping
the Re-entry Core, protocol contracts, and historical evidence available for a future replacement.

## 2. Scope

- `runtime/cloud-receiver/` package metadata, entry points, Vercel handler, and README;
- current Cloud Receiver status, task, decision, development, and handoff routing; and
- cross-runtime instructions that currently tell a developer or user to run or use this receiver.

## 4. Non-goals

- deleting source, tests, migration history, local state, Supabase data, or Vercel projects;
- changing `reentry-core/` authority or protocol semantics;
- choosing or implementing the replacement Cloud Receiver; or
- claiming that an already deployed Vercel alias has been archived without an external readback.

## 5. Verification and closure

The source retirement increment is complete because:

1. the default Vercel entry returns `410 receiver_deprecated`;
2. active guides no longer present this package as a setup or production path;
3. historical records and compatibility tests are explicitly labeled;
4. the Cloud Receiver verification suite and repository governance checks pass; and
5. the remaining external archival or redeploy action is visible as a separate operational gate.

Executed evidence:

- Cloud Receiver verification: 38 syntax-checked modules and 37/37 tests passed on Node 26.8.1;
- the default Vercel handler returns `410` with `receiver_deprecated` without initializing
  persistence;
- Local Connector verification: 31/31 tests passed on Node 26.8.1, including the explicit
  Receiver-origin requirement for new connections;
- repository validators, sensitive scans, repository validation, and `git diff --check` passed; and
- the Vercel alias, project, Supabase data, migration history, secrets, and local state were not
  deleted or mutated.

## 6. Reopen condition

Reopen if a new guide, package default, deployment configuration, or integration begins treating
`runtime/cloud-receiver/` as supported, or if a replacement requires a decision that conflicts with
ADR-0032.
