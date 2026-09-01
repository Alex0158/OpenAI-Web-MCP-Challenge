# ADR-RS-0004: RightSpot Thread Orchestration Pilot

**Status:** Accepted — experimental, RightSpot-scoped, opt-in
**Decision date:** 2026-08-31
**Clarification date:** 2026-09-01
**Decision owner:** Main RightSpot thread

## Context

RightSpot is being developed inside the WebMCP Challenge repository, while the main thread has
the richest product, architecture, scope, and evidence context. Codex can send a follow-up prompt
to an existing task or create a separate task that works on an isolated project state. This makes
it possible to separate implementation, verification, repair, integration, and documentation
responsibilities.

The capability is a host-level collaboration primitive. It is not a durable task queue, a project
workflow engine, a product feature, a WebMCP capability, a Cloud Receiver mechanism, or evidence of
successful Agent activation. RightSpot therefore needs a local operating procedure that makes the
human-owned authority, source of truth, file ownership, evidence, and stop boundaries explicit.

## Decision

### 1. Adopt a RightSpot-scoped pilot

RightSpot will use a controlled main-thread orchestration model for bounded development work:

```text
main thread decision
    -> bounded Work Order
    -> supporting implementation or review task
    -> explicit result and evidence
    -> main-thread classification
    -> verification, repair, integration, or safe-continuation gate
    -> canonical writeback and final closure
```

The detailed procedure is [RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK](../Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md).

This pilot applies only to:

- the RightSpot main thread;
- supporting tasks explicitly dispatched for RightSpot; and
- work whose mutable scope is inside the RightSpot child application unless a higher-level
  decision explicitly authorizes another surface.

It does not automatically apply to the outer Re-entry Core, Eddie's Cloud Receiver work, sibling
applications, other workspaces, or future repositories.

### 2. Preserve the authority hierarchy

The authority order is:

1. applicable platform and safety constraints;
2. repository `AGENTS.md` and repository Engineering controls;
3. RightSpot product and architecture decisions;
4. the active RightSpot parent Task;
5. the specific Work Order; and
6. a thread's local interpretation or historical context.

A supporting task cannot override a higher layer. If a Work Order conflicts with accepted product,
architecture, security, data, permission, or evidence authority, the worker stops and reports the
conflict. The main thread does not silently reinterpret the conflict as permission to expand scope.

### 3. Give the main thread final decision rights

The main thread owns:

- product and architecture interpretation;
- decomposition and dispatch of Work Orders;
- acceptance of assumptions and alternatives;
- classification of worker results and failures;
- final source and worktree reconciliation;
- promotion of stable changes into canonical RightSpot documents;
- final staging, commit, push, and remote claims when separately authorized; and
- the parent Task's closure claim.

Supporting tasks may implement, inspect, test, propose, and report within their assigned boundary.
They may not change accepted authority, touch the Git index, commit, push, deploy, publish, or
claim that the parent Task is closed.

The main thread also owns the parent execution posture: it reports checkpoint blockers to the human
owner, identifies safe continuation work, protects the blocked boundary, and decides whether the
parent remains `in_progress`, is awaiting a material decision, or is ready for closure.

### 4. Use one responsibility per Work Order

Each dispatched Work Order has one active responsibility and one falsifiable outcome. Typical roles
are:

- **Builder:** implements one bounded behavior and its directly necessary focused tests;
- **Verifier:** independently runs the specified checks and reports evidence without fixing code;
- **Repairer:** addresses one diagnosed defect without widening the feature;
- **Integrator:** couples already bounded outputs and checks their shared contracts; and
- **Reviewer:** performs a read-only adversarial review when risk warrants it;
- **Advisor:** produces bounded, evidence-backed product, architecture, process, or quality analysis
  without becoming a second decision authority;
- **UI/UX reviewer:** evaluates the human flow and demo clarity without silently changing product
  scope; and
- **QA/browser verifier:** verifies the actual user-facing route and reports evidence without
  repairing the implementation.

Documentation reconciliation and durable decisions remain main-thread responsibilities unless the
Work Order explicitly requests a non-authoritative draft or evidence record.

### 4.1 Keep the task ledger one-to-one, while allowing bounded parallel slices

One registered RightSpot Task has one canonical Task File and one parent lifecycle. A Work Order is
the dispatch brief recorded under that Task; it is not another registered Task, another Task File, or
a second lifecycle. Builder, Verifier, Repairer, and Integrator remain checkpoints for bounded
outcomes, not independent product lifecycles.

The default is one active Work Order per dependency chain. The main thread may activate multiple
Work Orders under the same Task File when each is a bounded, independently executable slice of the
same parent outcome, has a disjoint mutable boundary, and has a declared dependency and integration
relationship. This is the mechanism that lets the parent goal continue when one checkpoint is
blocked; it is not permission to create a speculative queue. Only currently approved Work Orders
are active, and future candidates remain in the roadmap or main-thread analysis.

An independently actionable product outcome with its own acceptance claim, lifecycle, or ownership
should still be admitted as its own registered Task with its own Task File. A read-only preflight,
research activity, or implementation slice that only advances the current parent may remain a
bounded Work Order under that parent. A dependent stage remains serialized until its prerequisite
contract, source, or evidence is stable.

For this decision, “independently executable” means “able to make bounded progress against a stable
read contract with disjoint ownership,” not “having no logical relationship to other work.” A
contract or integration dependency may therefore be parallelized when the source baseline, mutable
paths, integration owner, and pending claim boundary are explicit. A hard dependency or overlapping
shared write remains serialized. A read-only Advisor may propose such a decomposition, but the main
thread retains the final decision and must accept the proposal before dispatching the resulting
Builders.

### 4.2 Use a persistent channel for formal checkpoints

A formal Builder, Verifier, Repairer, Integrator, or formal Advisor Work Order must run in a
persistent, visible supporting task/thread with a durable identity and an explicitly verified source
boundary, normally an isolated Worktree. A role label in a prompt does not create that identity.

A transient `SubAgent` or internal multi-agent invocation may perform only a bounded, read-only
auxiliary activity with no source ownership, handoff, or closure claim. If a transient execution
writes product source, the result is a process/isolation incident rather than a valid formal Builder
handoff; preserve the candidate, keep the formal checkpoint gated, and re-establish a frozen source
identity before persistent independent verification. The detailed recovery procedure remains in the
[Pilot Runbook](../Development/RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-RUNBOOK.md).

### 5. Separate completion states

A worker result must never be treated as complete product delivery merely because its task stopped.
The execution states are:

```text
ASSIGNED
  -> IN_PROGRESS
  -> READY_FOR_VERIFICATION
  -> VERIFIED or NEEDS_REPAIR or BLOCKED
  -> INTEGRATED
  -> CLOSED by the main thread
```

The RightSpot parent Task continues to use its canonical lifecycle:

```text
pending -> in_progress -> verification_pending -> closed
```

`READY_FOR_VERIFICATION` is not `VERIFIED`; `VERIFIED` is not `INTEGRATED`; and `INTEGRATED` is
not `CLOSED`.

### 5.1 Keep checkpoint blockers local to the parent goal

A `BLOCKED` Work Order means that the assigned checkpoint cannot proceed within its current
authority, source, environment, or dependency boundary. It does not mean that the parent goal has
failed or that the main thread should become idle. While a blocked Work Order is preserved, the main
thread must:

- record the exact blocker, impact, evidence, owner, and resume condition;
- report the blocker and its effect on the delivery claim to the human owner;
- keep the parent Task `in_progress` when the goal remains viable or safe continuation work exists;
- identify and, when justified, activate bounded independent analysis, research, review, testing,
  or implementation Work Orders that do not depend on or mutate the blocked boundary; and
- avoid changing the contract, acceptance criteria, source ownership, or evidence standard merely
  to make the blocked checkpoint appear unblocked.

Use an execution posture separate from the parent lifecycle when useful:

```text
PROGRESSING -> CONSTRAINED -> AWAITING_DECISION -> PROGRESSING
                                      \-> READY_FOR_CLOSURE
```

`CONSTRAINED` means one or more checkpoints are blocked but the parent can still advance.
`AWAITING_DECISION` means no safe action can change the blocker without a human or authority
decision; it is a transparent pause of current execution, not a false completion or a new Task
lifecycle. The main thread may continue read-only preparation and evidence gathering in either
posture.

### 6. Treat files and evidence as the source of truth

Thread messages, titles, summaries, and final prose are coordination inputs only. The authoritative
result is the combination of:

- the exact Work Order;
- the named source baseline;
- the actual changed files;
- the exact commands and runtime used;
- test and runtime output;
- the task or development record; and
- main-thread inspection after the worker stops.

Thread identifiers may be kept in local coordination state when necessary, but must not be copied
into tracked RightSpot artifacts unless a separate decision establishes a safe, durable need.

### 7. Require isolation for parallel writers

Only one writer may operate in a shared working tree at a time. Parallel code tasks must use
separate worktrees or another explicitly verified isolation boundary. Shared contracts, package
manifests, migrations, fixtures, shared components, and canonical documents are serialized unless
their ownership is explicitly partitioned.

Before dispatch, the main thread records the source baseline and exact mutable paths. After return,
the main thread inspects the worker's actual state and changed paths rather than trusting a claimed
scope.

### 7.1 Use a two-phase dispatch transaction

Dispatch preparation and dispatch acknowledgement are separate steps:

1. Build an immutable dispatch bundle containing the Work Order, exact runtime and dependency
   profile, source identity, content manifest, mutable paths, acceptance criteria, and completion
   protocol. Validate the bundle once before sending it.
2. Keep the canonical parent and Work Order states at `pending` and `GATED` until the thread tool
   returns a usable final `threadId` (or an equivalent confirmed existing-task identity).
3. Send the already-validated prompt exactly once.
4. After successful acknowledgement, immediately perform one canonical writeback changing the
   parent to `in_progress` and the Work Order to `ASSIGNED`, and record the dispatch source identity.
5. If the tool fails, returns an ambiguous result, or returns only a non-usable queued identifier,
   do not mark the Work Order `ASSIGNED` and do not send a duplicate prompt until the outcome is
   resolved.
6. If the status writeback fails after the thread is created, retry the writeback only; do not
   resend the implementation prompt.

The short interval between successful tool acknowledgement and canonical writeback is a known
handoff window. During that window the worker may establish context but must not edit. The
activation prompt must state that editing begins only after the Work Order is visibly `ASSIGNED` or
the main thread confirms the writeback.

This ordering keeps `in_progress` and `ASSIGNED` truthful without adding a second task lifecycle or
making a status patch a prerequisite for the thread tool call.

### 7.2 Separate execution baseline from governance revision

The dispatch record has two different identities:

- the **execution baseline**, which covers the exact product, implementation, configuration, test,
  fixture, and runtime inputs that the supporting worker is allowed to execute or inspect; and
- the **governance revision**, which identifies the current main-thread Dispatch/Runbook procedure.

The governance revision is read-only process context. A change to it does not invalidate an active
product implementation baseline when it does not alter that Work Order's objective, allowed paths,
acceptance criteria, runtime, dependencies, or source authority. If a governance change would affect
execution, the main thread must issue an explicit clarification or re-gate the Work Order before the
worker relies on it.

This separation prevents a main-thread improvement to Dispatch procedure from being misclassified as
product source drift, while preserving an audit trail for the protocol change. The execution baseline
still freezes all inputs that can change the worker's implementation or verification result.

### 7.3 Keep verification output inside the declared boundary

Read-only verification may generate runtime output only inside the explicitly permitted ignored paths
of the assigned application. A shell assertion is not exempt merely because it does not edit authored
source: response bodies, logs, screenshots, temporary databases, and other generated artifacts must
remain inside the declared application boundary. Prefer shell variables for short assertions; when a
file is necessary, use a unique path under the assigned application's ignored test-output directory.

An OS temp path such as `/tmp` is outside the default Work Order boundary. Creating one is a
procedural `BLOCKED` result, even if every product check passes. The Verifier must not delete an
external or pre-existing artifact to conceal the deviation. The main thread records the incident,
applies the deletion safety gate separately, and re-gates the same checkpoint without turning a
procedure defect into a code repair.

### 7.4 Bound the supporting-worker pool

The pilot uses a hard cap of eight concurrently active RightSpot supporting tasks dispatched by the
main thread. The main control thread is excluded from that worker count. A Side Chat or other task
that the main thread has assigned RightSpot work counts as a supporting task; unrelated user-owned
tasks are not managed or repurposed by this pilot.

Eight is a ceiling, not a utilization target. Before dispatch, the main thread must confirm the
current active count, reserve capacity for verification or repair when the risk warrants it, and
decline delegation when the coordination cost exceeds the value. A slot is not freed merely because
a worker has stopped responding; the main thread must classify that task's state and source before
reusing the slot.

### 7.5 Salvage candidate output after a process defect

A coordination or provenance defect, such as a wrong supporting-task destination, invalidates the
dispatch record but does not by itself prove that the resulting code is defective. The main thread
may adopt an uncommitted candidate for a new T2 handoff only after it confirms that the original
writer has stopped, the exact Work Order write set contains every authored change, the diff and
focused checks are reviewable, and no source, authority, or external-output ambiguity remains. The
main thread must establish a new source identity and require independent verification; adoption is
not a Builder completion claim and must not silently include unrelated work.

If the candidate's ownership, inputs, changed paths, or behavior cannot be reconstructed confidently,
preserve it as evidence and keep the checkpoint blocked until a fresh Builder can work from a clean,
explicitly identified baseline.

### 8. Use staged gates rather than an automatic loop

The main thread classifies a result before dispatching the next task:

- code defect → bounded repair to the responsible Builder;
- test defect → separate test-maintenance decision or task;
- environment failure → environment investigation;
- authority or contract conflict → main-thread decision gate;
- unknown outcome → preserve evidence and stop the affected claim until the uncertainty is resolved;
- checkpoint-local blocker → report it, protect its boundary, and continue only with independent
  safe work; and
- verified output → integration or the next explicitly dependent Work Order.

No failure is retried indefinitely. Repeated failure without new evidence is a signal to revisit
the assumption, source baseline, or architecture. A repair task must not become an untracked second
implementation of the feature.

### 8.1 Validate prompt integrity and persisted delivery

Every new-task activation prompt must contain explicit begin and end sentinels, the Work Order
identifier, the role, the objective, the required reading route, the exact mutable boundary, the
verification contract, the stop conditions, and the completion-report rule. The main thread checks
these markers and the prompt length before calling the thread tool.

After a successful send, the main thread verifies the persisted task input through the thread
surface when available. A collapsed UI preview showing only the first lines is not evidence that
the message was truncated; conversely, a preview alone is not evidence that the full prompt was
persisted. If the persisted content is truncated or ambiguous, resolve the existing task identity
before sending any follow-up and never duplicate a full implementation prompt blindly.

The full contract remains in the canonical Task File. The activation prompt carries the minimum
context needed to make a new task establish context safely, plus the critical scope and handoff
rules; it should not be manually expanded with redundant prose that increases failure surface.

### 9. Keep the pilot opt-in and non-invasive

This ADR and its Runbook supplement RightSpot's local process. They do not modify global
`AGENTS.md`, the outer repository Engineering rules, the outer Re-entry Core, or another
application's development process. Promotion to a wider scope requires a new explicit decision
based on pilot evidence.

## Alternatives considered

### One main thread does every action

Rejected as the default for larger bounded increments because it mixes implementation, independent
verification, failure diagnosis, and integration judgment in one context. It remains appropriate
for small changes and for final authority work.

### Multiple workers share the same working tree

Rejected for parallel writes because concurrent changes can contaminate tests, overwrite files,
blur ownership, and make the source baseline unknowable.

### Every checkpoint becomes a new repository Task

Rejected because it would flood the canonical task queue. A parent RightSpot Task owns the product
increment; Work Orders and Development records describe bounded execution checkpoints underneath
it. A new Task is reserved for an independently actionable outcome with its own ownership and
boundary.

### Make the model a repository-wide mandatory rule immediately

Rejected because this is the first RightSpot use of the method. The cost, failure modes, and value
have not yet been established for other contributors or sibling applications.

### Treat thread messaging as a durable event or Agent continuation

Rejected because a dispatched prompt does not prove durable delivery, fresh context, canonical
page re-entry, WebMCP execution, or a human-controlled product consequence.

## Consequences

### Benefits

- The main thread retains product and architecture coherence.
- Independent verification can challenge implementation claims.
- Parallelism becomes possible where responsibility and file ownership are genuinely independent.
- Repair and integration remain observable rather than being hidden inside a long-running context.
- Other applications are unaffected while RightSpot experiments.

### Costs and risks

- The main thread becomes a decision and integration bottleneck.
- Worktree isolation creates integration overhead.
- Poor Work Orders can create context loss or false confidence even when the mechanics work.
- Excessive delegation can be slower than direct execution for small changes.
- A worker may report a plausible result while the actual source, runtime, or scope differs.

The Runbook therefore requires bounded parallelism, exact source evidence, independent verification,
and a final main-thread reconciliation.

## Pilot success and promotion criteria

The pilot may be considered for wider reuse only after at least two or three bounded RightSpot
increments demonstrate all of the following:

- each Work Order had one clear outcome and a named mutable scope;
- no concurrent writer collision or unowned file change occurred;
- a separate verifier reproduced the required result;
- at least one failure-to-repair-to-fresh-verification cycle was handled without blind looping;
- canonical documents remained consistent with code and evidence;
- no child task claimed authority or Git closure outside its role; and
- a material blocker was reported without unnecessarily stopping independent parent-goal progress;
- the orchestration overhead was proportionate to the risk and saved meaningful main-thread effort.

## Reopen conditions

Reopen or suspend the pilot if it causes repeated context loss, source contamination, duplicate
work, false completion, unbounded repair loops, authority drift, unexplained test variance, or more
coordination overhead than the bounded work justifies. A wider adoption proposal must be reviewed
as a new project-level process decision rather than inferred from successful RightSpot work.
