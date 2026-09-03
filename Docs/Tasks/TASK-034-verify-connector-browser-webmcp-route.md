# TASK-034: Verify the Connector-to-Browser WebMCP Route

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `verification`
- Lifecycle: `blocked`
- Priority: `P1`
- Owner: Connector integration owner, with the Game CP-14 and CP-17 owners.
- Current increment: Fresh CLI capability is verified: the supported runtime selected Chrome
  extension and exposed zero tabs. Authenticated Game navigation remains unattempted.
- Next gate: Game/Agent owners provide an approved session-preserving Browser handoff reachable
  by the actual child; then verify one genuine read-only Site Tool without creating player identity.
- Dependencies: ADR-0026, ADR-0042 through ADR-0045, TASK-007, TASK-029, TASK-033, and Game SK-TASK-076.

## 1. Objective and falsifier

The desktop task can have Browser tools that a Connector-started CLI process does not inherit.
Prove the capability in the actual child, not by substituting the parent's successful Browser
session. A missing Browser runtime, missing page-bound tools, unknown player identity, or unsafe
navigation precondition falsifies the corresponding claim and stops that part of the probe.

## 2. Authority and evidence

TASK-007 remains closed at its process-preview scope. This task does not reopen or relabel it.
Mechanisms 04 and 05 own the activation, current-page, and human-boundary contracts.

The Game owner confirms existing desktop player contexts but no verified method for this fresh
child to reach them. Their existence is not child access proof. No URL navigation, player bootstrap,
cookie inspection, credential transport, or Site Tool call was attempted. This is the named blocker,
not a claim that all Browser or Agent routes are impossible.

## 3. Bounded execution

This is an `Assured` capability investigation, not a new authority implementation. First use the
existing `runCodexPrompt` manual-smoke seam with a capability-only prompt. Preserve its executable,
working-directory and invocation shape; record any observation-only differences. No Receiver
Grant, lease, account credential, or Game command is needed for that first stage.

Only after capability succeeds may an owner-approved disposable Game context be navigated and a
freshly discovered read-only Site Tool called. Verify navigation side effects and non-secret
player identity before claiming authenticated access. Do not create or bootstrap a player merely
to make the probe pass. Treat desktop success and child success as separate facts.

## 4. Non-goals

- No Game mutations, synthetic business Event, Receiver claim/ACK, or production traffic.
- No cookie copying, credential extraction, prompt-held secrets, login bypass, or new admission.
- No alternate browser, REST/DOM tool emulation, queue message, or automation substituted for a
  failed route. A newly considered route needs its own explicit decision and evidence.
- No SDK/Connector publication, deployment, protocol/lifetime change, or new Git branch.

## 5. Verification and closure

The [CLOUD-024 record](../Development/CLOUD-024-connector-browser-capability-preflight.md) owns
exact source/runtime identity, the probe prompt, results, and limitations. A process exit is never
a Browser, Game effect, or ACK assertion. Complete this bounded investigation only after the
measured result and any unmet Game-owner prerequisite are documented; product route acceptance
and TASK-029 remain separate gates.

## 6. Reopen condition

Reopen when the actual Connector executable, process environment, supported Browser binding,
Agent admission mechanism, canonical URL, or player/session contract changes enough to invalidate
the recorded route verdict.
