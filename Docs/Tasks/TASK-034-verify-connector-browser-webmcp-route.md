# TASK-034: Verify the Connector-to-Browser WebMCP Route

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `verification`
- Lifecycle: `blocked`
- Priority: `P1`
- Owner: Connector integration owner, with the Game CP-14 and CP-17 owners.
- Current increment: Retarget verification to ADR-0046's bound existing task. Preserve the earlier
  fresh-child result as preview evidence; it no longer determines the selected product route.
- Next gate: TASK-035 supplies a reviewed private binding/driver contract and the Game owner an
  approved read-only player/page context; then prove actual same-task notification/wake and one
  genuine Site Tool without a manual wake message or new player identity.
- Dependencies: ADR-0046, TASK-035, TASK-029, TASK-033, ADR-0042, and Game SK-TASK-076.

## 1. Objective and falsifier

Prove notification and wake of the exact enrolled task, then its authenticated canonical-page
access and genuine read-only WebMCP invocation. Prior desktop success is not proof of a new
Connector delivery; fresh-child failure is not proof the bound-task route fails. Missing binding,
unsupported runtime, missing tools, unknown player identity, or unsafe navigation stops the
corresponding probe. No fallback task or browser route may substitute for the selected contract.

## 2. Authority and evidence

TASK-007 remains closed at its process-preview scope. This task does not reopen or relabel it.
Mechanisms 04 and 05 own the activation, current-page, and human-boundary contracts.

Historical CLOUD-024 observation: the Game owner confirmed existing desktop player contexts but no
verified method for the fresh child to reach them. Their existence is not child access proof. No
URL navigation, player bootstrap, cookie inspection, credential transport, or Site Tool call was
attempted. That was the preview blocker, not the new task's dependency or a claim that all routes fail.

## 3. Bounded execution

This is an `Assured` same-task capability investigation, not permission to select an unsupported
platform API or implement new authority. First resolve TASK-035's trusted binding/driver and
TASK-029's delivery identity contract. Record exact runtime capabilities and separate trusted
notification handoff from the actual ensuing task turn. The previous fresh-process smoke is
preserved in CLOUD-024 and is not the prescribed next step.

Only after bound-task capability succeeds may an owner-approved disposable Game context be
navigated and a freshly discovered read-only Site Tool called. Verify navigation side effects and non-secret
player identity before claiming authenticated access. Do not create or bootstrap a player merely
to make the probe pass. Access must occur in the actual notified task, not a different control task.

## 4. Non-goals

- No Game mutations, synthetic business Event, Receiver claim/ACK, or production traffic.
- No cookie copying, credential extraction, prompt-held secrets, login bypass, or new admission.
- No alternate browser, REST/DOM tool emulation, fresh task, or scheduled automation substituted for a
  failed route. A newly considered route needs its own explicit decision and evidence.
- No SDK/Connector publication, deployment, protocol/lifetime change, or new Git branch.

## 5. Verification and closure

The [CLOUD-024 record](../Development/CLOUD-024-connector-browser-capability-preflight.md) owns
the earlier fresh-process source/runtime identity, results, and limitations. A new bounded record
must prove same-task targeting, actual wake, authenticated page, and genuine WebMCP separately.
Delivery handoff is not a Browser, Game effect, or completion assertion. Record unmet Game-owner
prerequisites; product route acceptance and TASK-029 remain separate gates.

## 6. Reopen condition

Reopen when the actual Connector executable, process environment, supported Browser binding,
Agent admission mechanism, canonical URL, or player/session contract changes enough to invalidate
the recorded route verdict.
