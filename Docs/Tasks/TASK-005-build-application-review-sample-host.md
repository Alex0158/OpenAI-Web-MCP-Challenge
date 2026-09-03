# TASK-005: Build the Application Review Sample Host

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-01

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Eyad and project team
- Current increment: Completed; HOST-001 records the locally verified sample vertical slice.
- Next gate: TASK-001 decides whether this or another workflow becomes the selected Host product.
- Dependencies: ADR-0023; real Codex activation remains an explicitly unsupported later gate.

## 1. Objective

Provide one runnable sample Host website where a person submits a simple application, a reviewer
approves it later, and that durable Host transition triggers a Re-entry continuation that prepares
the application's next-stage plan.

## 2. Authority and evidence

- [ADR-0023](../Decisions/ADR-0023-adopt-application-review-sample-host.md) owns the sample-only
  product and source boundary.
- [Mechanism 05](../Mechanisms/05-host-reentry-webmcp-and-human-boundary.md) owns canonical page,
  state-derived Site Tool, same-artifact, concurrency, and human-boundary requirements.
- [TASK-003](TASK-003-productionize-and-deploy-cloud-receiver.md) owns production Receiver work;
  this task consumes only its local preview composition.
- CLOUD-006 supplies the complete local reference pattern and evidence-only Agent boundary.

## 3. Required outcome

The sample must provide:

1. one applicant page and one reviewer page over the same durable workflow record;
2. visible Host SDK consent before submission;
3. exact state and revision guards on all mutations;
4. reviewer approval committed before the signed event is sent, with stable retry identity;
5. actual Receiver delivery, outbound Connector claim, independent Host-effect verification, and
   acknowledgement;
6. stage-derived Site Tool registration and a fully functional no-WebMCP human UI; and
7. final acceptance as a human-only control absent from the Site Tool inventory.

## 4. Non-goals

This task does not select the final Host product, implement production identity or deployment,
claim real Codex/Desktop activation, publish a package, or modify frozen reference surfaces.

## 5. Verification and closure

Move to `verification_pending` after focused sample tests pass. Close only when Node 24 verification
proves the positive flow plus consent, stale-write, premature-review, blind-human-control, event-
retry, and Site Tool boundary cases; affected runtime and Core aggregate checks pass; canonical
status and evidence are reconciled; and Git state is reported without touching unrelated work.

## 6. Reopen condition

Reopen if a real Host cannot use the SDK without receiving secrets in the browser, approval can be
lost between Host commit and event ingress, duplicate delivery changes the artifact twice, or a
human-only action becomes Agent-callable.

## 7. Closure

Closed at `locally_verified` on Node `v24.20.0`. The sample crossed consent, submission, reviewer
approval, stable signed event ingress, delivery claim, deterministic continuation, independent
Host-effect acknowledgement, fresh page-bound WebMCP inventory and invocation, and the visible
human-only acceptance boundary. Real Connector-to-Codex-to-Browser acquisition remains outside
this task and unverified.
