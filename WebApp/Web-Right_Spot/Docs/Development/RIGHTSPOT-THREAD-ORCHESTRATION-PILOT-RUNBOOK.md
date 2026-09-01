# RightSpot Thread Orchestration Pilot Runbook

**Role:** Scoped operating procedure for delegated RightSpot work
**Status:** Experimental, opt-in, and RightSpot-scoped
**Owner:** Main RightSpot thread
**Governing decisions:** [ADR-RS-0004](../Decisions/ADR-RS-0004-thread-orchestration-pilot.md) and
[ADR-RS-0005](../Decisions/ADR-RS-0005-checkpoint-source-identity-and-path-ownership.md)

## 1. Purpose

This Runbook defines how the RightSpot main thread may use separate Codex tasks for bounded
implementation, verification, repair, review, and integration work. It is intended to preserve
the main thread's product and architecture context while allowing independent execution where
responsibility, file ownership, and evidence boundaries are clear.

This is a development operating procedure, not a RightSpot product feature. It does not describe
WebMCP tools, Cloud Receiver behavior, WebRTC runtime behavior, or a production distributed task
system.

Non-normative observations and proposed improvements from this pilot are recorded in
[`RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-LEARNINGS.md`](RIGHTSPOT-THREAD-ORCHESTRATION-PILOT-LEARNINGS.md).
That log is historical and advisory only; it does not override this Runbook or an accepted ADR.

## 2. Scope and non-scope

### 2.1 In scope

This Runbook applies to:

- the RightSpot main thread;
- explicitly dispatched supporting tasks for RightSpot;
- implementation, focused testing, adversarial review, repair, integration, and documentation
  evidence inside the RightSpot child application; and
- work whose source baseline, mutable paths, and next gate are written in a Work Order.

### 2.2 Out of scope

This Runbook does not automatically apply to:

- the outer Re-entry Core;
- Eddie's Cloud Receiver work;
- sibling applications or unrelated repository tasks;
- production deployment, public publication, credentials, payments, or external communication;
- WebMCP or Agent activation proof; or
- a general repository-wide collaboration policy.

The outer repository `AGENTS.md`, Engineering documents, safety controls, and Git closure rules
remain higher authority. A RightSpot Work Order cannot relax them.

## 3. Core operating model

The main thread is the product and integration authority. Supporting tasks are bounded workers.
The operating model is:

```text
current truth and decision
    -> one or more bounded Work Orders
    -> isolated or explicitly serialized worker
    -> worker result and evidence
    -> main-thread classification
       -> verification, repair, or integration gate
       -> blocker report and safe independent continuation
    -> canonical writeback
    -> final main-thread closure
```

The following distinctions are mandatory:

- a prompt is not a task record;
- a thread stopping is not a successful result;
- a worker result is not independent verification;
- a passing focused test is not complete integration;
- an integrated change is not a closed parent Task; and
- a local pass is not a commit, push, deployment, judge, or submission claim.

### 3.1 Registered Tasks, Work Orders, and checkpoints

These terms have different meanings and must not be used interchangeably:

- **Registered Task:** one bounded project outcome admitted to the RightSpot task ledger. It has
  one canonical Task File and one parent lifecycle.
- **Work Order:** one concrete dispatch brief for the current execution checkpoint under that
  parent Task. It is not a registered Task, does not create a second lifecycle, and does not need a
  separate file by default.
- **Supporting Codex task/thread:** the execution container used to run one Work Order checkpoint.
  It is a coordination surface, not automatically a RightSpot registered Task or a new Task File.
- **Checkpoint:** one staged role gate for the same Task outcome, such as Builder readiness,
  independent verification, diagnosed repair, integration, or canonical closure. A checkpoint is
  not automatically a new Task or Work Order.

One Task File normally exposes one current dispatchable Work Order per dependency chain. The main
thread may activate multiple Work Orders under the same Task File only when they are independently
executable slices of the same parent outcome, have disjoint mutable boundaries, and have an explicit
integration relationship. The main thread must not pre-create a queue of future Builder, Verifier,
Repairer, or Integrator assignments. After a checkpoint completes, it records the evidence and opens
only the next necessary checkpoint for that dependency chain.

If a parallel activity is an independently actionable product outcome with its own acceptance claim,
lifecycle, or ownership, register it as its own Task with its own Task File. A bounded read-only
preflight, research activity, or implementation slice that only advances the current parent may stay
under the existing Task File. A dependent stage remains serialized until its prerequisite contract,
source, or evidence is stable.

“Independently executable” does not mean “has no logical relationship to any other work.” The main
thread must classify the dependency before deciding serial or parallel execution:

- **Hard dependency:** the worker cannot make a meaningful bounded change until an upstream output,
  authority decision, schema, or contract exists. Keep it serial.
- **Contract dependency:** the upstream shape is documented and stable, while its implementation or
  verification is still in progress. A consumer may work in parallel against that explicit contract,
  with integration and any end-to-end claim remaining gated.
- **Integration dependency:** two outputs must later be coupled, but each can be built and tested in
  isolation. Run them in parallel and serialize only the integration boundary.
- **Evidence dependency:** a Verifier must use a frozen source snapshot, but may run in parallel with
  a disjoint Builder or read-only Advisor using another isolated snapshot.
- **Shared-write dependency:** workers touch the same mutable path or semantic contract. Partition
  ownership, serialize the writers, or use isolated Worktrees followed by explicit main-thread
  integration; never rely on simultaneous edits to a shared tree.

The parallelization decision must answer whether each worker can produce a useful result against a
stable read contract, not whether all later integration work has disappeared.

### 3.2 Dispatch channel and continuation rule

The default execution channel for a formal RightSpot Work Order is a persistent, visible supporting
Codex task/thread with a durable identity and an explicitly resolved execution source. A Builder,
Verifier, Repairer, Integrator, or formal Advisor that needs source ownership, independent evidence,
a later handoff, or a possible follow-up must run in that task/thread. Use `create_thread` for a
newly authorized execution task and `send_message_to_thread` only for an identity-matched existing
task. The task/thread is an execution container; the RightSpot Task File remains the project ledger
and canonical source of scope.

A transient `SubAgent` or internal multi-agent invocation is not a formal supporting task/thread.
It must not be used for a Builder, Verifier, Repairer, Integrator, formal Advisor, or any checkpoint
that owns source, verification, repair, integration, or a formal evidence gate. It may be used only
for a bounded auxiliary activity such as a short read-only preflight, one-off comparison, or
disposable analysis that has no source ownership and no handoff or closure claim. A role name in a
prompt does not upgrade a transient execution into a persistent worker. If a formal Work Order would
be routed through a transient mechanism, keep it `GATED`, report a process blocker, and use the
persistent task/thread route instead. Historical pilot workers that used another execution mechanism may
remain evidence for checkpoints already independently verified and integrated; they do not establish a
forward-looking formal channel or authorize the same mechanism for a new checkpoint.

Dispatch is asynchronous. After sending a prompt, the main thread continues non-overlapping PM work:
queue audit, proposal classification, architecture review, next Work Order design, safe read-only
checks, and preparation of later integration. It should use a bounded wait only when a result is a
hard dependency for the next action. A blocker in one worker pauses that lane, not the parent Goal;
the main thread records the blocker and continues every safe independent lane. Source freeze and
ownership rules still prohibit conflicting writes while a Verifier is active.

### 3.3 Decision gates are not blanket implementation gates

A pending feature decision does not automatically prohibit every preparatory or independently
bounded implementation slice. The main thread must split the feature into the narrowest useful
stages and gate each stage against the decision it actually needs:

1. **Authority and contract stage:** resolve product authority, ownership, authorization, lifecycle,
   privacy, failure semantics, and versioning. This stage may be read-only analysis, an ADR, or a
   contract-only Work Order. It must not silently invent unresolved policy.
2. **Neutral seam stage:** define the smallest typed contract, port, selector, event shape, or
   adapter boundary that is already supported by accepted authority. It may be implemented before
   the complete feature when its invariants are explicit and its exact write set is isolated.
3. **Bounded module stage:** implement one domain, application, persistence, or presentation slice
   against the frozen contract. The slice must have its own acceptance claim and must state which
   integration behavior remains deferred.
4. **Adapter and coupling stage:** connect independently completed slices through the named contract.
   Shared semantic files, routes, persistence stores, and end-to-end behavior are integrated by a
   serialized main-thread-owned Work Order or by explicitly isolated Worktrees.
5. **Verification stage:** verify the frozen coupled candidate and its affected contracts. A
   Builder may be complete while the parent feature remains `integration_pending` or
   `verification_pending`.

The main thread owns clarification. It should decide low-risk presentation and implementation
details from existing authority, record material assumptions, and ask the human only when the
choice changes product authority, user-visible policy, PII/retention, external side effects, or an
irreversible data decision. A worker must not guess those choices.

“Open for later coupling” means that the contract is stable and versionable while its producer or
consumer is not yet connected; it does not mean that the contract is semantically undefined. Every
such seam must state its fields, ownership, authorization, lifecycle, error/empty behavior,
versioning, and explicit non-goals. Unsupported future behavior must be visible as deferred or
unavailable rather than represented by guessed defaults or fake success.

The main thread should therefore dispatch useful contract, seam, module, test, or read-only
projection work whenever the relevant boundary is stable, even if the parent feature is not yet
complete. It must serialize only the unresolved authority or shared-write boundary, not the entire
feature by default.

## 4. Authority and source of truth

### 4.1 Authority hierarchy

Workers must resolve instructions in this order:

1. platform, safety, and explicit human constraints;
2. applicable global and workspace instructions;
3. the actual repository `AGENTS.md` and repository Engineering controls;
4. RightSpot product truth, domain contracts, and accepted ADRs;
5. the active RightSpot parent Task;
6. the specific Work Order; and
7. the worker's local interpretation, memory, or historical thread context.

The lower layers cannot silently override the higher layers. If two layers conflict, the worker
must stop at the conflict boundary and report the current rule, proposed change, affected
surfaces, and evidence needed for a decision.

### 4.2 Operational source of truth

The main thread determines the current status from the following evidence, in order of reliability:

1. actual repository and worktree state;
2. current code, tests, package manifests, and generated state owned by the task;
3. exact command output and runtime information;
4. the Work Order and Development Record; and
5. thread messages, summaries, or worker prose.

A worker's completion message is useful navigation, not proof. The main thread must inspect the
actual files and rerun decisive checks before making a closure claim.

### 4.3 Canonical versus non-canonical writeback

Workers normally return implementation facts and verification evidence in their supporting thread.
They may update a non-canonical evidence record only when the Work Order explicitly grants that
write. They may propose a documentation change when the Work Order allows it, but they must not
silently edit the canonical Task File or other RightSpot authority.

Only the main thread promotes a stable conclusion into RightSpot's canonical current status,
requirements, domain model, system design, accepted ADR, or parent Task status. A worker must not
silently rewrite accepted product or architecture authority.

## 5. Roles and decision rights

### 5.1 Main thread

The main thread:

- owns product intent, scope, architecture, and decision interpretation;
- identifies the smallest coherent increment;
- writes or approves the Work Order;
- chooses whether work is direct, serial, or parallel;
- resolves conflicts and classifies failures;
- decides the next gate;
- inspects returned files, evidence, and source state;
- owns canonical documentation writeback;
- performs or supervises final integration;
- owns final staging, commit, push, remote, deployment, and submission claims when authorized; and
- closes or reopens the parent Task.

### 5.2 Builder

The Builder implements one bounded behavior in the assigned mutable paths. The Builder may add or
modify focused tests that are directly necessary to define the implemented behavior. The Builder
must self-check code quality, scope, error behavior, and relevant focused tests, then stop at
`READY_FOR_VERIFICATION`.

The Builder must not:

- begin the next feature without a new Work Order;
- silently change accepted requirements or contracts;
- modify forbidden or shared files outside the assigned scope;
- add a dependency without the required decision review;
- use a hidden fallback to make a check pass; or
- claim independent verification or parent-task closure.

### 5.3 Verifier

The Verifier independently runs the registered checks against the named source baseline. The
Verifier may inspect code, tests, runtime output, and browser behavior as required, but must not
repair the implementation or modify tests to remove a failure. The Verifier reports exact results,
failure classification, and claim limits, then stops.

### 5.4 Repairer

The Repairer addresses one diagnosed defect in the original ownership boundary. A repair is not
permission to redesign the feature. If the diagnosis changes the data model, authority, public
contract, persistence, security, or scope, the Repairer stops and returns the issue to the main
thread's decision gate.

The original Builder thread may receive a repair prompt when its context remains relevant. A fresh
Repairer task is preferred when the defect crosses ownership, the original context is stale, or
independence would otherwise be compromised.

### 5.5 Integrator

The Integrator couples already bounded outputs. The Integrator checks shared contracts, routes,
types, schema, fixtures, permissions, and failure behavior. It must not invent a new product
feature to make incompatible outputs appear complete. The main thread still owns final source
reconciliation and Git closure.

### 5.6 Reviewer

The Reviewer performs a read-only adversarial review when the increment crosses authentication,
authorization, persistence, concurrency, privacy, external I/O, or another material boundary. A
Reviewer identifies risks and required changes but does not silently modify the implementation.

### 5.7 Specialist roles

The factory may use specialist variants when their output has a clear decision or evidence boundary:

- **Advisor:** produces bounded, evidence-backed product, architecture, process, or code-quality
  analysis. An Advisor returns facts, inferences, alternatives, a recommendation, dependency
  classification, and a proposed next gate; it does not become a second decision authority or edit
  product source by default.
- **Architecture Advisor:** is an Advisor specialization that maps module, route, page, contract,
  ownership, and integration boundaries. It may propose parallel Work Orders, but the main thread
  must review and accept the proposal before those Work Orders are dispatched.
- **UI/UX reviewer:** evaluates the tenant/agent human flow, information hierarchy, accessibility
  baseline, and demo clarity. It may recommend changes, but does not silently expand product scope.
- **QA/browser verifier:** exercises the actual user-facing route and reports reproducible browser
  evidence. It is a Verifier specialization and must not repair the implementation in the same
  checkpoint.

These are role assignments, not additional lifecycle states or permanent worker identities. A
specialist may run in parallel with a Builder only when its read set is stable, its output is
read-only or separately owned, and it cannot be mistaken for independent verification of moving
source.

## 6. When to delegate

Delegation is justified when the work has an independent responsibility, consumer, failure
boundary, test surface, authority, or update cadence. It is not justified merely because a feature
has multiple files or because more threads are available.

### 6.1 Keep work in the main thread when

- the action is read-only and smaller than a useful handoff;
- the change is a trivial mechanical correction;
- the work needs an immediate product or architecture decision;
- the source baseline is unstable or ownership is unclear; or
- delegation overhead would exceed the implementation risk.

### 6.2 Use a full worker pipeline when

- the increment crosses UI, application, domain, data, or permission boundaries;
- an independent browser or integration check is material;
- a defect needs a separate diagnosis and repair cycle;
- multiple contributors need isolated file ownership; or
- the result will support a meaningful closure claim.

### 6.3 Do not parallelize dependent work

Do not dispatch a consumer before its contract, schema, fixture, or authority is stable. Do not run
verification while a writer is still changing the same source snapshot. Do not dispatch two writers
to the same shared contract without explicit ownership and mechanical isolation.

Do not treat a later integration dependency as a hard implementation dependency. A Builder may
implement a bounded consumer against a stable documented contract while the producer is being
verified, provided that:

1. the consumer's read contract is explicit and versionable;
2. its exact mutable paths are disjoint from the producer and verifier source snapshots;
3. the Work Order states that integration and end-to-end claims remain pending;
4. a contract change has a defined impact and rework path; and
5. the main thread owns the eventual coupling and source reconciliation.

Separate tenant and agent pages are therefore candidates for parallel work, not automatic proof of
parallel safety. The decision depends on the route/view contract, shared-shell ownership, test
surface, and integration boundary.

### 6.4 Continue the parent goal when a checkpoint is blocked

`BLOCKED` is a state of the affected Work Order, not an automatic state of the parent Task. When a
worker cannot continue within its authority, source, environment, or dependency boundary, the main
thread must preserve the checkpoint and immediately produce a concise blocker report for the human
owner. The report must identify:

- the blocked Work Order and role;
- the exact evidence, source identity, and first failing boundary;
- the claim or dependency that is blocked and the impact on the parent goal;
- the failure classification (`CODE_DEFECT`, `TEST_DEFECT`, `ENVIRONMENT_FAILURE`,
  `AUTHORITY_CONFLICT`, `UNKNOWN`, or process/ownership defect);
- the current owner and the condition required to resume;
- safe work that remains available and work that must not start; and
- the main thread's recommended next decision or bounded recovery action.

The main thread must report the blocker in the conversation and record the durable task-specific
fact in the owning Task File. A separate report file is unnecessary for an isolated checkpoint; use
one only when the incident spans multiple tasks or produces a reusable process decision.

After reporting, set the parent execution posture to `CONSTRAINED` when the goal remains viable and
safe work exists. Continue only when the candidate work passes all of these gates:

1. it advances the same parent goal through a real dependency, risk reduction, evidence, or
   preparation outcome;
2. it does not depend on the blocked output and does not mutate the blocked Work Order's source,
   semantic read set, contract, or ownership;
3. it has a bounded objective, owner, mutable boundary, and falsifiable result;
4. its required source baseline and integration order are understood; and
5. it does not weaken acceptance criteria, add a hidden workaround, or create a speculative queue.

Suitable continuation work includes read-only architecture, UI/UX, security, or code-quality
review; bounded research with a stated falsifier; focused test-matrix preparation; process
retrospective; and an independent implementation slice whose contracts are already stable. A
downstream consumer that requires the blocked contract remains gated.

If no safe work can change the situation without a human, authority, credential, or material design
decision, set the posture to `AWAITING_DECISION` and report the decision request. Do not mark the
parent `BLOCKED` merely because one Work Order is blocked, and do not keep an unproductive retry loop
alive to avoid telling the owner that progress is constrained.

### 6.5 Bound parallel capacity

The factory may run at most eight concurrently active RightSpot supporting task/thread executions
dispatched by the main thread. The main control thread is not counted as a worker slot. Every
persistent supporting task/thread assigned RightSpot work, including a Side Chat used as an analysis
or process lane, consumes one slot; unrelated user-owned tasks are not repurposed or managed by this
Runbook. A permitted transient `SubAgent` is auxiliary rather than a formal worker, but it must still
be counted against the same safety budget while active and must never be used to bypass the cap.

Before dispatching, the main thread takes a current task snapshot, counts active RightSpot workers,
checks each worker's role and mutable boundary, and records the expected slot use in its live control
view. Eight is a ceiling, not a target. Keep capacity for a likely Verifier or Repairer when the
current risk warrants it. A task that is idle, silent, or awaiting output does not automatically
release its slot; classify its thread and source state before reuse. A transient execution that can
edit source is not an exception: stop it before mutation and re-dispatch the formal Work Order
through a persistent task/thread with verified isolation.

## 7. Work Order contract

Every dispatched checkpoint must have a Work Order. The default location is a bounded section in
the owning parent Task File, alongside its increment, dependency, and next gate. The Work Order is
an execution brief, not another registered Task: do not create a second Task File or a second
lifecycle for it. Keep only currently approved Work Orders active, normally one per dependency chain;
retain completed checkpoint evidence in the same Task File when it is needed for traceability.

Use a separate Development record only when a material implementation, verification, or closure
increment needs durable evidence/history beyond the Task File; link it from the parent Task and
never use it as a second live task queue. Do not create a large task hierarchy or pre-written future
Work Orders without a real current dispatch need.

### 7.1 Required fields

Each Work Order must state:

- Work Order identifier and title;
- parent RightSpot Task;
- worker role and owner;
- pre-dispatch status, execution state, and next gate;
- objective as one falsifiable outcome;
- acceptance criteria;
- checkpoint source identity and dirty-state limitation;
- required documents to read;
- dependencies and prerequisite outputs;
- package/runtime permissions and any approved dependency set;
- runtime executable resolution, including the exact Node.js and npm binary paths and expected
  versions, when the shell selector is not guaranteed to honor the version file;
- declared read, worker-write, main-thread-writeback, auxiliary process-only, forbidden, and
  generated sets;
- parallelization classification (`SERIAL`, `CONTRACT_PARALLEL`, `READ_ONLY_PARALLEL`, or
  `INTEGRATION_SERIAL`) and the named integration owner/order;
- execution mode/worktree and supporting-task identity;
- affected roles, modules, state, data, and claims;
- explicit non-goals;
- assumptions and evidence that could falsify them;
- failure modes and stop conditions;
- blocker impact, reporting owner, and resume condition;
- exact verification commands or browser checks;
- completion report channel and canonical writeback owner; and
- the condition for returning control to the main thread.

### 7.2 Recommended Work Order template

Project-authored Work Orders must be written in English. Use this structure:

```markdown
# RS-WO-<number>: <bounded outcome>

**Parent task:** <RightSpot task>
**Role:** Builder | Verifier | Repairer | Integrator | Reviewer | Advisor | UI/UX reviewer | QA/browser verifier
**Pre-dispatch status:** DRAFT | GATED
**Execution state:** NOT_STARTED | ASSIGNED | IN_PROGRESS | READY_FOR_REVIEW | READY_FOR_VERIFICATION | NEEDS_REPAIR | BLOCKED | VERIFIED | INTEGRATED
**Owner:** <main thread or supporting task>
**Dispatch state:** <not dispatched | dispatched at <source identity>>
**Next gate:** <condition that returns control to the main thread>
**Parent execution posture if blocked:** PROGRESSING | CONSTRAINED | AWAITING_DECISION
**Blocker report:** <impact, evidence, owner, safe continuation, and resume condition>

## Objective
<One falsifiable outcome.>

## Acceptance criteria
- <Observable result>

## Baseline
- Git root:
- Branch and HEAD:
- Execution source identity and dirty/untracked limitation:
- Governance revision:
- Runtime baseline:
- Execution mode/worktree: shared tree | isolated worktree <path and source ref>
- Supporting-task identity: <new/final thread ID and matching Work Order>

## Read before action
- <Global/workspace/repository instructions>
- <RightSpot Runbook>
- <Current status>
- <Task and governing ADR>
- <Relevant product/domain/system/API documents>

## Mutable scope
- Read set:
- Worker write set:
- Main-thread orchestration writeback set:
- Auxiliary process-only set:
- Forbidden set and actions:
- Generated set:

## Dependencies and assumptions
- <Named prerequisite>
- <Falsifier>

## Non-goals
- <Explicitly excluded work>

## Verification
- <Exact command or browser check>

## Completion report
- files changed;
- behavior implemented or checked;
- exact commands, runtime, and results;
- skipped checks and why;
- residual risks;
- final status; and
- next gate.

## Writeback
- worker report channel:
- canonical Task File writeback owner:
- allowed evidence-record changes:
```

### 7.3 Scope granularity

One Work Order may contain directly necessary implementation tests and self-checks. It must not
also ask the same worker to perform independent verification, unrelated documentation
reconciliation, deployment, or the next feature. Those are separate checkpoints opened only when
their own source, ownership, and evidence boundary is clear. The parent Task File remains the source
for active Work Orders, checkpoint history, and next gates; Development remains the source for the
Big Roadmap and durable implementation, verification, and closure records.

Do not collapse several independently actionable product outcomes into one Task merely to avoid
registering Tasks. Conversely, do not register a new Task for every role transition or parallel
implementation slice in one bounded parent outcome. The test is whether the work has its own durable
acceptance claim, lifecycle, and ownership boundary, not how many files or threads the implementation
happens to use.

## 8. Activation and context protocol

### 8.1 Main-thread pre-dispatch checklist

Before dispatching, the main thread must:

1. confirm the actual Git root;
2. inspect branch, `HEAD`, upstream, dirty state, ownership, and relevant ignored state;
3. identify whether the source includes uncommitted or untracked RightSpot work;
4. read the parent Task, current status, governing ADR, Runbook, and affected authority documents;
5. write the Work Order and read, worker-write, main-thread-writeback, forbidden, and generated
   boundaries;
6. decide whether a shared tree is safe or an isolated worktree is required;
7. identify the minimum verification and the falsifier;
8. classify the increment as `Fast`, `Standard`, or `Assured`, and complete the additional persistence,
   data-lifecycle, dependency, or cross-layer review required by that profile;
9. verify the target runtime or explicitly label any alternate runtime as limited evidence;
10. take a current supporting-task snapshot, confirm the worker-pool count is below the eight-task
    cap, and decide whether this Work Order is serial or passes the independent parallelization gate;
11. confirm the execution mode/worktree and, when using an existing supporting task, verify that its
    persisted title/history/current Work Order identity matches this dispatch;
12. confirm that no credential, spend, deployment, publication, or external action is hidden in the
    assignment;
13. record the expected next gate, canonical writeback owner, and source-freeze point before sending
    the prompt;
14. classify the dispatch channel as a persistent supporting task/thread or a permitted transient
    auxiliary. A formal Builder, Verifier, Repairer, Integrator, or Advisor Work Order requires the
    persistent channel; if the selected mechanism cannot provide that identity, keep the Work Order
    `GATED` and report the process blocker;
15. resolve the declared main checkout root, execution Worktree root, package root, and runtime-pin
    path to actual filesystem paths, then run the read-only root checks before the thread-tool call;
    a prompt must not leave any of these identities implicit or inferred from another root; and
16. if the Work Order relies on persisted fixtures or business snapshots, inspect the reset boundary
    and state whether setup uses a fresh isolated database or the existing application-level reset;
    do not dispatch a verifier with an unclassified reset procedure.

### 8.1.1 Dispatch transaction order

The dispatch call and the lifecycle writeback form a two-phase handoff:

1. Prepare the Work Order, exact runtime/dependency profile, checkpoint source identity, read/write/
   writeback/auxiliary/forbidden/generated sets, acceptance criteria, stop conditions, and
   completion-report contract before any thread-tool call. Add a content manifest only where Git
   cannot identify the intended source.
2. Validate the activation prompt once. It must include `RIGHTSPOT-DISPATCH-BEGIN`, the Work Order
   identifier, role, objective, read-before-action route, exact scope, verification, stop
   conditions, completion report, and `RIGHTSPOT-DISPATCH-END`.
3. For an existing supporting task, verify the persisted thread identity before sending. If its
   title, history, or current Work Order does not match, do not append a new assignment to it.
4. Keep the canonical parent at `pending` and the Work Order at `GATED` while the tool call is
   pending. Do not pre-announce `in_progress` or `ASSIGNED` in canonical files.
5. Confirm that the selected channel is a persistent supporting task/thread. Do not route a formal
   Work Order through a transient `SubAgent` or internal multi-agent invocation; if that is the only
   available route, stop before source mutation and keep the Work Order `GATED`.
6. Call `create_thread` or `send_message_to_thread` once with the validated prompt.
7. Only after a usable final `threadId` or confirmed existing-task identity is returned, perform one
   status writeback: the dispatched Work Order moves `GATED -> ASSIGNED`, with its source identity
   recorded. If the parent is still `pending`, move it to `in_progress` in the same writeback; if
   another active Work Order already moved the parent to `in_progress`, leave the parent lifecycle
   unchanged and record the additional active slice.
8. If the tool fails, is ambiguous, or returns only a queued `clientThreadId`, keep the canonical
   states unchanged and resolve the outcome before retrying. Never resend blindly.
9. If the status writeback fails after successful creation, retry only the writeback. Do not resend
   the prompt.
10. Immediately take one bounded `wait_threads` snapshot. Do not repeatedly poll unchanged state.

The worker may receive the prompt during the short writeback window. Its prompt must say that it
may read and establish context, but it must not edit until the Task File shows `ASSIGNED` or the
main thread confirms the writeback. A process-protocol amendment made by the main thread does not
retroactively change the active Work Order's product scope or acceptance criteria.

The status patch is therefore a post-acknowledgement truth update, not a precondition for sending.
The main thread should prepare the patch in advance and apply it immediately after acknowledgement;
the patch itself must not become a multi-minute manual phase.

Every dispatch that uses a detached Worktree must name the main checkout root and the execution
Worktree root as two different fields. Relative source paths, `git status`, runtime commands, and
source identity checks belong to the execution Worktree root. Before any other command, the worker
must run `git rev-parse --show-toplevel` there and compare the result with the declared execution
root. If they differ, or if the prompt gives only the main checkout root, the worker stops before
source mutation and reports a path-identity blocker. The main thread must correct the same task
identity; it must not silently retry against a different Worktree or create a replacement task.

When the repository contains a nested application, the dispatch must also name the application or
package root separately. A Git root is not automatically an npm root: commands that read
`package.json`, `.node-version`, or the package lockfile must run from the declared package root.
The worker must verify both roots before running package commands. A root mismatch that already
caused an external diagnostic file is still a process incident even when the repository stayed
unchanged; preserve the external artifact and report it without unapproved cleanup.

The runtime pin is a separate location contract: if `.node-version` is at the Git or execution
Worktree root while `package.json` is in a nested application, the dispatch must name that exact
runtime-pin path and the exact package root independently. The worker reads `.node-version` from the
declared runtime-pin path and runs npm/package commands from the declared package root; neither
location may be inferred from the other.

The runtime version file is declarative; it does not prove that the shell selected the requested
runtime. When the environment has more than one Node.js installation, the dispatch must also name
the exact executable paths (at minimum the Node.js and npm binaries) and the expected versions. The
main thread must validate those binaries before dispatch. The worker must run package commands with
the named binaries, or with an explicitly prepared PATH that resolves to those same binaries, and
must report `BLOCKED` if the exact runtime cannot be selected. It must not silently substitute a
different Node.js version merely because `node` or `npm` is available on PATH.

A projectless Codex task may start with a `cwd` or output directory outside the repository. That
directory is only the task's conversation/output surface, never the execution Worktree or Git root.
The prompt must state this distinction explicitly, and every source, Git, runtime, package, test,
and browser command must use the declared execution Worktree as its `workdir` (with the declared
package root used only for package commands). A successful `pwd` in the projectless output
directory is not source identity evidence. If a worker starts in that directory, it must change to
or explicitly target the declared Worktree before any source inspection; otherwise it stops with a
procedural `BLOCKED` result. The main thread corrects the same task identity and does not create a
replacement task solely for this routing error.

The main-thread preflight must resolve and execute the equivalent of
`git -C <execution-worktree> rev-parse --show-toplevel`, `test -f <package-root>/package.json`,
`test -f <package-root>/package-lock.json`, and `test -f <runtime-pin-path>`. When an executable
path is declared, it must also run the equivalent of `test -x <node-binary>`, `test -x <npm-binary>`,
`<node-binary> --version`, and `<npm-binary> --version`. A failed check is a dispatch preparation
failure, not a reason to let the worker infer a path. The resolved values must be copied into the
prompt and the Task File before the single dispatch call.

### 8.1.2 Execution baseline versus governance revision

Every dispatch records two identities and must not merge them into one undifferentiated manifest:

1. **Execution baseline:** exact product and implementation inputs that can affect the worker's
   result, including the Work Order, relevant product/domain/API contracts, implementation paths,
   package and lockfile, fixtures, tests, runtime pin, and required verification commands.
2. **Governance revision:** the revision of this Runbook and ADR-RS-0004/ADR-RS-0005 used to govern
   the handoff.

The governance revision is read-only process context. A later process-only amendment does not
invalidate the active implementation baseline or require a Builder re-dispatch when it does not
change the Work Order objective, allowed paths, acceptance criteria, runtime, dependencies, source
authority, or required execution behavior. The main thread records the amendment separately.

If a process amendment does affect execution, the main thread must send an explicit clarification or
re-gate the Work Order before the worker relies on the changed rule. It must never silently change the
worker's contract or classify an unconnected process edit as a product defect.

### 8.1.3 Checkpoint source identity and path-scoped validation

The execution baseline is a checkpoint identity, not a permanent lock on every RightSpot file. When
the reviewed source is suitable for persistence, establish a local Git commit before dispatch and use
that commit as the primary identity. If the checkpoint intentionally includes dirty or untracked
source, record the commit plus the exact dirty/untracked paths and content hashes. A content manifest
is supplementary evidence for source that Git cannot identify; it is not a substitute for ownership
or a merge protocol.

Every Work Order must classify source surfaces as follows:

- **Read set:** worker-readable, worker-immutable inputs. A change is source drift when it changes a
  semantic input to the Work Order.
- **Worker write set:** exact authored paths the worker owns. Changes are expected and must be checked
  against the Work Order diff and acceptance criteria.
- **Main-thread orchestration writeback set:** explicitly named status/evidence paths or sections
  that only the main thread may update while the worker runs. These writes may record lifecycle and
  process evidence, but must not change the active Work Order's objective, acceptance criteria,
  runtime, dependencies, allowed paths, source authority, or product/domain contract.
- **Forbidden set:** paths and actions that stop the checkpoint if changed or attempted.
- **Generated set:** explicitly allowed ignored runtime/output paths that are not authored source
  identity.

If a file mixes contract text with status or evidence, the Work Order must identify the immutable
contract section and the process-only section separately. A process-only writeback does not invalidate
the execution baseline; a semantic contract or authority change does and requires a stop and
re-baseline. The main thread must not guess when the boundary is ambiguous.

Tooling may create untracked instruction or metadata files outside the usual build-output paths. For
example, the pinned Next.js toolchain may create `WebApp/Web-Right_Spot/AGENTS.md` and
`WebApp/Web-Right_Spot/CLAUDE.md` when `next dev` runs. A worker must not delete, restore, or commit
such files merely to make the tree match an assumed generated set. The main thread must verify their
provenance and exact content, then either declare those exact paths as ephemeral generated output
that is preserved but excluded from T2 source adoption, or stop and re-gate the Work Order. They do
not become source identity, canonical instructions, or product scope unless explicitly reviewed and
adopted.

The same rule applies to command-created runtime state: ignored `var/test/*.sqlite` files may be
created by the existing test suite and must be preserved without cleanup, while tracked
`next-env.d.ts` may be touched by Next as tool-maintained metadata. A worker must not manually edit,
restore, or commit `next-env.d.ts`; if a final diff remains, the worker stops and reports it for
main-thread adjudication. When a production build is already available, prefer `next start` over
`next dev` for runtime smoke so development-only file generation does not widen the checkpoint.

Fixture setup is part of source and evidence identity. A foundation-only reset and an
application/business reset are not interchangeable: the foundation reset may advance foundation
generation without resetting an existing workflow snapshot, which can intentionally produce a
persistence-generation mismatch and a `503` rather than the product's ordinary empty or missing
state. A business-workflow verifier must use a fresh isolated database or the established
application-level reset boundary, perform setup according to that boundary, and record the resulting
fixture generation. It must not repeatedly apply a foundation-only reset to a database that already
contains a business snapshot and then classify the resulting mismatch as a product defect. If the
reset semantics are unclear, stop before product diagnosis and return a process/environment blocker.

At T2, after the Builder stops, the main thread must:

1. confirm there is no remaining writer;
2. capture actual changed paths and the diff, including newly created files;
3. classify every change against the declared sets;
4. record generated output separately from authored source;
5. capture the post-Builder source identity, preferring a reviewed local commit; and
6. freeze that source before dispatching the independent Verifier.

At T3, the Verifier runs only against the frozen T2 source. No product writer, including the main
thread, may modify that source during verification. The main thread may update an explicitly declared
process-only record outside the frozen implementation snapshot, but any change to the verified source
requires a fresh handoff or re-verification.

The T3 freeze is also a Git-ref freeze for the checkpoint. After the Verifier is dispatched, the main
thread must not create a commit, amend a commit, rebase, switch the verified branch, or otherwise move
the source reference used by the handoff, even when the intended change is process-only documentation.
Declared process-only writeback may remain uncommitted and outside the verified source paths while the
Verifier runs. If an intentional process or source change requires a commit or changes the declared
identity, stop the verification, record a procedural `BLOCKED` result, capture the new identity, and
assign a fresh verification run; do not ask the Verifier to infer whether the ref movement was harmless.

### 8.1.4 Candidate adoption after a coordination or provenance defect

A wrong destination, mismatched thread identity, incomplete delivery receipt, or similar process
defect invalidates the dispatch provenance; it does not automatically prove that the candidate code
is defective. To avoid an unnecessary rebuild, the main thread may adopt an uncommitted candidate for
T2 only after all of the following are true:

1. the original worker is no longer writing and no other writer overlaps the candidate paths;
2. the actual changed paths are exactly within the Work Order's worker write set;
3. the main thread has inspected the diff and confirmed no forbidden path, semantic read drift,
   hidden fallback, speculative dependency, or external artifact;
4. the Work Order objective, acceptance criteria, runtime, and source limitations can be
   reconstructed from current files and preserved evidence;
5. the candidate's focused checks have been rerun or directly confirmed under the named runtime; and
6. the adoption is recorded as an unverified candidate, with a new T2 source identity established
   before independent verification.

Candidate adoption is not a Builder completion claim, independent verification, or permission to
silently commit unrelated work. If ownership, changed paths, source inputs, or behavior cannot be
reconstructed confidently, discard neither the candidate nor its evidence; instead keep the
checkpoint blocked and use a fresh Builder from a clean, explicitly identified baseline.

### 8.1.5 Parallelization gate

Before activating more than one Work Order in a dependency set, the main thread records:

1. the dependency class for each pair of Work Orders: hard, contract, integration, evidence, or
   shared-write;
2. the stable read contract or frozen source each worker will use;
3. each worker's exact mutable paths and the proof that those paths do not overlap;
4. the shared files, semantic inputs, generated outputs, and canonical sections that remain owned by
   one writer;
5. the integration owner, order, conflict rule, and condition for accepting each output;
6. the claim that may be made while one output is still unverified; and
7. the local blocker and repair path if the producer contract changes.

The gate passes when every active worker can make bounded progress without mutating another worker's
source or semantic inputs, and when the main thread can integrate or re-baseline the outputs without
guessing. A read-only Architecture Advisor and a Verifier may pass this gate together. A tenant UI
Builder and an agent UI Builder may pass it when their route/component/test ownership is explicit,
even if their eventual API integration remains sequential.

### 8.1.6 Execution-channel and isolation preflight

The dispatch mechanism is part of the Work Order boundary. A formal role assignment is valid only
when the selected host mechanism provides both:

1. a persistent supporting task/thread identity that can be read, continued, and matched to the
   Work Order; and
2. the declared source boundary, normally an isolated Worktree for a code writer or a deliberately
   serialized shared-tree execution explicitly named in the Work Order.

The main thread must not infer either property from a role label, a successful tool call, a task-card
preview, or a worker's prose. If a transient `SubAgent` or internal multi-agent execution is observed
writing the main checkout, the event is a process/isolation defect:

1. stop the affected writer before any further source mutation;
2. preserve the working tree; do not reset, restore, clean, overwrite, stage, or commit the candidate;
3. capture the exact status, changed paths, diff, source inputs, and content hashes needed to classify
   the candidate against the Work Order;
4. do not dispatch verification against the moving overlay or promote the Work Order to `ASSIGNED`,
   `IN_PROGRESS`, `READY_FOR_VERIFICATION`, `VERIFIED`, or `INTEGRATED` merely because the transient
   execution reported success;
5. record the incident in the owning Task File and the learning log when it is reusable; and
6. either adopt the candidate under section 8.1.4 with a new frozen T2 identity and a persistent,
   independent Verifier, or preserve it as evidence and re-dispatch a fresh Builder from a clean,
   explicitly identified source.

This recovery rule protects potentially useful output without treating a mechanism failure as a
product defect. It does not authorize the main thread to edit the candidate paths while their
ownership or source identity is unresolved.

### 8.2 New supporting Codex task/thread activation

This activation shape applies only to a persistent supporting Codex task/thread, not to a transient
`SubAgent` or internal multi-agent invocation. A new supporting Codex task/thread does not inherit
the main thread's complete conversation. It is an execution container for the current Work Order,
not automatically a new RightSpot registered Task. Its first prompt must tell it to establish its own
context before editing. The minimum reading route is:

1. the available global instructions, including `/Users/alex/.codex/AGENTS.md` when present;
2. the workspace `AGENTS.md` when the task runs inside this workspace;
3. the actual repository `AGENTS.md`;
4. repository `Docs/README.md`, current outer status, and applicable Engineering controls;
5. `WebApp/Web-Right_Spot/RUNBOOK.md`;
6. `WebApp/Web-Right_Spot/Docs/00-current-status.md`;
7. the active RightSpot parent Task;
8. the governing RightSpot ADRs; and
9. only the relevant product, requirements, system, domain, API, validation, and Development
   documents.

The worker should consult relevant memory only when it helps locate context or a prior failure.
Memory is non-authoritative and must not replace current files, tests, or instructions.

Use the following activation shape:

```text
RIGHTSPOT-DISPATCH-BEGIN

You are the supporting <ROLE> worker for RightSpot Work Order <ID>.

Before editing:
1. Confirm the actual Git root, branch, HEAD, and working-tree state.
2. Read the global, workspace, repository, and RightSpot instructions listed in the Work Order.
3. Read the active Task, current status, governing ADR, Runbook, and relevant owning documents.
4. Restate the objective, acceptance criteria, affected surfaces, non-goals, baseline, and stop conditions.
5. Report any contradiction or missing authority before taking action.

Scope:
- Objective: <one bounded outcome>
- Allowed paths: <exact paths>
- Forbidden paths: <exact paths>
- Dependencies: <exact prerequisite and source baseline>

Execution rules:
- Keep all authored artifacts in English.
- Implement only the assigned outcome.
- Install dependencies only when this Work Order explicitly permits the named package manager and
  dependency set; installation permission does not authorize an external runtime service.
- Do not add speculative dependencies, fallback paths, or unrelated cleanup.
- Do not modify the Git index, commit, push, deploy, publish, or perform external actions.
- Do not change canonical product or architecture authority.
- Stop and report if the source, instruction, or scope conflicts with the Work Order.

Verification:
- Run the listed checks and directly necessary focused checks only.
- Report exact commands, runtime, source identity, results, skipped checks, and residual risks.

Completion:
- Return the completion report in the supporting thread unless the Work Order explicitly grants a
  non-canonical evidence record update.
- Do not edit the canonical Task File, current status, ADR, roadmap, or Runbook; the main thread owns
  that writeback.
- Mark READY_FOR_VERIFICATION, NEEDS_REPAIR, or BLOCKED.
- Stop after reporting; do not start the next phase.

RIGHTSPOT-DISPATCH-END
```

The main thread must verify the begin/end sentinels and required-section markers before sending.
After sending, it must inspect the persisted task input where the thread surface exposes it. A
collapsed task-card preview such as `Show more` is only a presentation state and must not be used
as proof of truncation or proof of complete delivery.

### 8.3 Existing task follow-up

An existing task may receive a new prompt for a repair or clarification, but the main thread must
still provide the current Work Order, source baseline, exact failure, and new acceptance criteria.
Do not assume that an older task remembers later main-thread decisions or file changes.

### 8.4 Thread-tool handling

The Codex thread tools are coordination mechanisms, not the RightSpot task ledger:

- use `create_thread` only when a supporting execution task is explicitly authorized for the
  current Work Order and the target project and source state have been resolved;
- a queued `clientThreadId` is not a usable final `threadId` until the task is ready;
- use `send_message_to_thread` for an existing task only after confirming its identity and role;
- do not put raw thread identifiers, credentials, bearer values, or private context in tracked
  RightSpot artifacts;
- do not infer completion from a sent message or a thread title; and
- do not make a task responsible for sending a callback message as its only completion mechanism.

The worker's report, actual files, and exact evidence are the handoff. The main thread uses
`wait_threads` for bounded completion or attention waits and `read_thread` when detail is needed.
An up-to-date wait cursor should be reused. Repeated one-minute polling is not required and can
create noise without improving evidence.

When a process or orchestration document is revised while an implementation task is active, the
main thread must distinguish that non-functional protocol change from a change to the active Work
Order. It may update the future operating procedure directly, but it must not silently change the
Builder's product scope, mutable paths, acceptance criteria, or source authority. If the active
worker's source manifest includes the revised process document, record the revision as a
main-thread-only protocol change and send a concise clarification only if the worker's execution
could otherwise be affected.

If a task needs user input, approval, credentials, or a material decision, the main thread treats
it as `BLOCKED` or attention-required rather than automatically guessing or continuing.

## 9. Worktree and file-ownership protocol

### 9.1 Shared working tree

The shared working tree is allowed only for one product/code writer at a time or for explicitly
declared, low-conflict process-only work. It is not the default execution target for a supporting
code worker, and a tool's default current checkout is not evidence that shared-tree execution was
authorized. Before a worker edits there, the main thread must state the baseline and confirm that no
other writer is active on overlapping product or semantic-input paths.
During execution, the main thread must not edit the worker write set or semantic read set. It may
update only the explicitly declared main-thread orchestration-writeback set, and a Side Chat may write
only an explicitly declared auxiliary process-only set. Neither may change product source, contract,
authority, or the worker's semantic inputs while the worker is active or after handoff has been
frozen for verification.

### 9.2 Isolated worktree

Once a reviewed Git baseline exists, an isolated worktree is the default for a code Builder and is
required for parallel code writers or high-conflict changes. The Work Order must state how the
worktree was created and what source it includes. A worktree created from a branch does not
automatically include uncommitted or untracked changes from the main checkout; verify the actual
files before relying on it. The main thread may continue live observation and process-document
writeback in its checkout without changing the Builder's source snapshot.

The current RightSpot documentation baseline is local and may be untracked. Until a stable source
snapshot is explicitly established, do not assume that a new worktree contains the current RightSpot
documents. Prefer one serialized foundational increment or a verified working-tree source state.

For an untracked source, the dispatch record must state whether the worker uses the current shared
tree or a verified snapshot. A branch name or `HEAD` alone does not identify untracked content.

### 9.3 Shared files and contracts

Serialize changes to:

- `package.json` and lockfiles;
- framework and build configuration;
- database schema and migrations;
- seed fixtures and reset logic;
- shared domain types and API contracts;
- shared UI tokens and components;
- authentication and role policy; and
- canonical product or architecture documents.

Parallel feature work is valid only when these shared surfaces are already stable or explicitly
partitioned. If a shared document contains both contract and process fields, ownership must be
partitioned by named sections; a path alone is not enough to authorize a semantic contract edit.

### 9.4 Ownership violation

If a worker changes a forbidden path, discovers another writer, or finds an unexpected semantic
baseline change, it must stop its affected write or handoff. The main thread records the actual
change and classifies it as an expected worker write, declared process-only writeback, generated
output, source drift, or ownership violation. An unclassified change pauses only the affected
checkpoint; it does not block unrelated read-only analysis or an isolated writer. A user-authorized
process-only change outside the worker's semantic inputs may be recorded as a governance revision
without invalidating the product execution baseline. A semantic, overlapping, or forbidden change
requires re-baselining or serialization. The main thread must not guess and must not use destructive
reset or cleanup to hide the violation.

A tooling-generated change to a tracked path is still an ownership violation unless that path was
explicitly declared in the Work Order. This includes repository metadata such as `.gitignore`. A
Verifier must report `BLOCKED` when its final readback finds such a mutation, even if the candidate
source and all product checks are clean. The worker must preserve the exact diff and must not restore,
delete, or commit it. The main thread resolves ownership and recoverability separately, then re-runs
the same checkpoint from a clean, exact-scope source identity; it must not turn the metadata incident
into a product repair.

### 9.5 Live analysis and auxiliary process lane

The main thread is the live control plane: it owns current-state adjudication, Work Order design,
canonical status, and dispatch decisions. It must re-read the live thread state and working-tree
state before making a material decision; a prior snapshot or Side Chat report is evidence, not
current truth.

When a supporting task reports `BLOCKED`, the main thread remains active. It reports the blocker,
sets the parent execution posture, reviews the dependency graph, and either opens a safe independent
Work Order or records why the parent must await a decision. It must not use the worker's blocked
state as a reason to stop unrelated read-only analysis, process improvement, or already-isolated
work that passes the continuation gate in section 6.4.

A Side Chat may inspect the current checkout, supporting-task status, tests, diffs, and relevant
documents, then return analysis, alternatives, and proposed process changes. Its report must state
the observation time, source identity or dirty-state limitation, relevant thread/cursor, and the
distinction between verified fact, inference, and recommendation. It must not silently substitute
for the main thread's decision.

If the main thread explicitly declares an auxiliary process-only write set, a Side Chat may create
or update only those named learning, observation, or process sections. Such a write must not alter
product code, contract, authority, acceptance criteria, runtime, dependencies, or the worker's
semantic read set. The main thread classifies the change and incorporates it into the next
governance revision or evidence record. If no auxiliary write set is declared, the Side Chat returns
the proposed text without editing the shared tree.

### 9.5.1 Worktree closure and archive rule

A physical Worktree is an execution surface, not an evidence register and not a Codex task record.
Worktree retirement is checkpoint-scoped, not parent-Task-scoped: once a bounded output has passed
its required gate and has been safely integrated into Main, its physical checkout must not remain
open merely because sibling Work Orders or the parent Task are still active.
When a Work Order closes, the main thread must classify its checkout before any cleanup:

- `integrated/clean`: the intended output is in the canonical source and the checkout has no
  independent material that must be retained;
- `dirty/untracked`: the checkout contains candidate material or evidence whose exact paths and
  recoverability still need to be assessed;
- `rejected candidate`: the output is not product source, but its evidence may be needed for incident
  review or recovery; or
- `active dependency`: another task or verification lane still relies on the checkout.

Only an `integrated/clean` Worktree, or a non-product checkout whose exact evidence has first been
archived or otherwise proven recoverable, may be removed. Before removal, the main thread must resolve
the exact target path, ownership, tracked/untracked/modified state, active-task dependency, and recovery
source. It must not use Worktree removal to hide an ownership violation, discard an unresolved candidate,
or imply that the Work Order or its evidence has been deleted.

When candidate evidence is retained, prefer a named local-only archive ref and a durable record in the
owning Task File. An archive ref is evidence/recovery only: it is not product source, does not reopen a
closed Task, and must not be silently merged or committed as implementation. Worktree removal does not
delete the Task File, Codex task/thread record, or unrelated branch refs unless a separate explicit
decision authorizes that operation.

After cleanup, verify `git worktree list --porcelain`, confirm the exact removed paths are absent, and
update current-status, roadmap, and owning Task File references so historical paths are clearly marked
as historical. Historical chronology may retain the old path and identity as evidence, but current-truth
sections must not describe a removed Worktree as an active source or execution surface.

### 9.5.2 Prompt integration and checkout retirement

The main thread integrates each bounded output at the first safe point after its required acceptance
gate; it must not batch completed outputs until an unrelated sibling or the parent Task finishes:

- a Work Order without an independent-verification requirement may proceed after the Builder's
  self-check, main-thread scope inspection, and required focused checks pass;
- a Work Order with an independent Verifier remains isolated until the Verifier returns `VERIFIED`
  against the frozen T2 source; and
- a repaired candidate requires fresh verification before it is accepted into Main.

For disjoint parallel lanes, each output may be integrated and retired independently. Shared contracts,
shared files, and semantic conflicts remain serialized at the integration boundary. Timely integration
does not bypass a required verification gate, ownership review, or post-integration check.

The normal per-checkpoint close sequence is:

```text
required gate passes
    -> main inspects exact output and ownership
    -> integrate into Main
    -> rerun invalidated checks
    -> record evidence and checkpoint state
    -> remove the exact integrated/clean Worktree
```

If integration, post-integration validation, ownership classification, or recovery assessment is
blocked, retain the Worktree and report the affected checkpoint. Do not delete it to reduce workspace
noise. Preserve a commit, Task File record, or named local-only archive ref when historical recovery
requires it; preserve the evidence, not the physical checkout.

### 9.6 Work Order and supporting-task identity

One supporting Codex task/thread represents one Work Order checkpoint. A thread's title, persisted
history, and current Work Order identity must agree with the dispatch being sent. Before using
`send_message_to_thread`, the main thread checks that identity; an idle or available thread is not
automatically reusable for a different Work Order. If the identity does not match, do not append a
new assignment to the old thread. Establish a dedicated supporting task/thread and record its
identity before dispatch.

### 9.6.1 Duplicate-dispatch preflight

Before creating a supporting task or sending a first prompt, the main thread must resolve the exact
Work Order identity from the canonical Task File and inspect the current supporting-task registry or
thread list for that same identity. This is a dispatch idempotency check, not a source-manifest check.

- If one supporting task is already `ASSIGNED`, `IN_PROGRESS`, `READY_FOR_VERIFICATION`, `NEEDS_REPAIR`,
  `BLOCKED`, `VERIFIED`, or `INTEGRATED`, do not create another worker for the same checkpoint.
  Follow the recorded identity and inspect its current status first.
- If the existing thread is still running, do not append a second implementation prompt. Wait for its
  checkpoint result or use the approved same-identity continuation only when the Work Order explicitly
  calls for it.
- If a create/send result is ambiguous, retain the Work Order's pre-dispatch state until the original
  outcome is resolved; never treat uncertainty as permission to resend.
- If a duplicate is created accidentally, the main thread records both thread identities, designates
  one canonical execution identity, and stops the duplicate before it writes or verifies source. The
  duplicate's report is procedural evidence only; it does not create a second candidate, checkpoint,
  or verification claim.
- A duplicate-dispatch incident must be reviewed separately from product source drift. Do not solve it
by overwriting, reverting, merging, or deleting the candidate source.

### 9.6.2 Browser-tooling isolation preflight

Browser verification in a shared Git checkout has a distinct metadata risk from product source
verification. Before invoking a browser helper, the main thread or Verifier must choose one of these
boundaries:

- a clean isolated verification worktree containing the frozen candidate; or
- a non-repository working directory that can reach the already-running local app and cannot resolve
  the submission repository as its metadata target.

Capture repository status before and after the browser run. A helper-generated `.gstack/`, cache,
lockfile, ignore-rule, or other tracked metadata change is an immediate procedural `BLOCKED` result.
Do not restore, delete, or overwrite the path in the Verifier. Preserve the exact diff, classify it as
tooling/procedure evidence, and rerun only after the browser boundary is isolated or the main thread
has separately resolved the ownership and recoverability decision. Passing product/browser assertions
before that hard stop remains evidence, not a `VERIFIED` checkpoint.

## 10. Lifecycle and handoff states

### 10.1 Supporting-task states

Use these states for execution records:

| State | Meaning | Required action |
|---|---|---|
| `DRAFT` | Work Order text exists but has not been approved for dispatch | Main thread completes the contract; no worker action |
| `GATED` | Work Order is bounded but a named pre-dispatch prerequisite remains open | Main thread resolves the gate or records a blocker; do not dispatch |
| `ASSIGNED` | Work Order is approved and dispatched | Worker establishes context |
| `IN_PROGRESS` | Worker is executing within scope | No parallel overlap on owned paths |
| `READY_FOR_VERIFICATION` | Worker believes acceptance criteria and self-check pass | Stop; wait for independent verification |
| `READY_FOR_REVIEW` | Read-only Advisor or Reviewer completed its bounded proposal or review | Stop; main thread reviews the evidence and recommendation |
| `NEEDS_REPAIR` | A confirmed defect blocks acceptance | Main diagnoses and sends one repair scope |
| `BLOCKED` | Authority, dependency, environment, or external input prevents progress | Stop and report the blocker |
| `VERIFIED` | Independent verifier reproduced the required result | Main decides integration gate |
| `INTEGRATED` | Output is coupled into the intended source and affected checks pass | Main reconciles docs and closure |

Only the main thread may mark the parent Task `closed`.

### 10.2 Parent-task mapping and execution posture

The parent RightSpot Task retains:

```text
pending -> in_progress -> verification_pending -> closed
```

The main thread moves the parent to `verification_pending` only when the complete applicable
increment is ready for review, not merely because one worker finished. A parent Task may remain
`in_progress` while one Work Order is `BLOCKED`, another independent Work Order is active, or the
main thread is pursuing a bounded recovery or research path.

When the first Work Order is dispatched, the main thread changes the parent Task from `pending` to
`in_progress` and changes the Work Order from `GATED` to `ASSIGNED`. The parent remains `in_progress`
through internal Builder, Verifier, Repairer, and Integrator checkpoints. Later parallel Work Orders
only change their own assignment state when the parent is already `in_progress`. The main thread
may record a separate execution posture:

- `PROGRESSING` — active work is advancing the parent goal;
- `CONSTRAINED` — at least one checkpoint is blocked, but safe parent-goal work remains;
- `AWAITING_DECISION` — progress that can change the blocker requires a human or authority decision; or
- `READY_FOR_CLOSURE` — all required Work Orders and evidence are complete and closure review may begin.

The posture is not a replacement lifecycle and must not be used to claim completion. It moves back to
`PROGRESSING` when the blocker is resolved or a new safe path becomes available.

### 10.3 Completion report minimum

Every worker handoff must include:

- final state;
- exact files created or changed;
- actual source baseline and dirty-state limitation;
- behavior implemented, inspected, or tested;
- exact commands and runtime;
- passed, failed, skipped, and not-run checks;
- deviations from the Work Order;
- unresolved risks or unknowns;
- evidence claim limit; and
- recommended next gate.

## 11. Builder procedure

The Builder follows this loop:

1. establish repository and instruction context;
2. restate the Work Order and identify a falsifier;
3. inspect the owning code, tests, and consumers;
4. identify affected state, roles, data, contracts, failure modes, and non-goals;
5. implement the smallest coherent change;
6. add only directly necessary focused tests;
7. inspect the diff and scan for scope drift, hidden fallbacks, sensitive data, and accidental
   shared-file changes;
8. run the registered focused checks under the named runtime;
9. return the completion report through the approved handoff channel; and
10. stop at `READY_FOR_VERIFICATION`, `NEEDS_REPAIR`, or `BLOCKED`.

The Builder must not treat a green local check as proof of browser, integration, deployment, or
judge behavior unless that exact surface was tested. The Builder must not edit the canonical Task
File, current status, ADR, roadmap, or Runbook unless the Work Order explicitly grants a separate
non-canonical evidence record; the main thread owns canonical writeback.

## 12. Verification procedure

### 12.1 Independence

Verification must occur after the Builder has stopped changing the candidate source and the main
thread has completed T2 handoff. The Verifier must receive the exact source identity, expected files,
read/write/forbidden/generated sets, commands, runtime, fixtures, and claim boundary. A Verifier may
use a clean isolated worktree or a clearly identified stable source state.

A clean reviewed commit is the preferred source identity. When dirty or untracked source is part of
the checkpoint, record the commit plus exact dirty/untracked paths and content hashes. The Verifier
must validate the worker write set and unexpected semantic drift path-by-path; it must not treat
expected owned writes or declared process-only writeback as a global manifest failure. The Verifier
must run against the same frozen T2 source and no moving product writer.

### 12.1.1 Verification output boundary

The Verifier may create only the ignored runtime output explicitly permitted by the Work Order and
only inside the assigned application directory. Short response-body and header assertions should
use shell variables. If a file is necessary, place it under the application's declared ignored
test-output directory with a unique name. Do not write to `/tmp`, the user's home directory, or any
other path outside the application boundary unless the Work Order explicitly grants that path.

An out-of-bound artifact is a procedural `BLOCKED` result, not a product defect and not a reason to
delete or repair source. The Verifier records the exact path and stops the affected claim. The main
thread applies the deletion gate separately, tightens the procedure if needed, and re-gates the same
checkpoint; it does not silently promote otherwise green checks to `VERIFIED`.

Browser automation has an additional source-boundary risk: a browser tool or its helper may create
tooling metadata or edit tracked repository metadata in the current working directory. Before browser
actions, capture the exact Git status; if the tool changes any undeclared tracked path, stop browser
actions in that source Worktree, preserve the diff, and report `BLOCKED` for the affected checkpoint.
Do not restore or delete the metadata from the worker. A later rerun must either execute the browser
tool from an explicitly isolated, permitted output boundary while the application server remains tied
to the frozen source, or omit browser interaction and state that browser evidence is unavailable. Static
UI, direct HTTP, and source-scope evidence must not be presented as browser E2E evidence.

The served-runtime identity is part of browser evidence. A healthy endpoint or an unchanged Git ref is
not sufficient if the running server was built before the frozen candidate. Before a browser claim, the
Verifier must rebuild or otherwise prove that the served bundle includes the candidate's source identity
(for example, a candidate CSS token or build fingerprint). If the served output reflects an older
candidate, stop as procedural `BLOCKED`, preserve the static/direct evidence separately, and rerun only
after restarting the server from the frozen source. Do not classify stale served output as a product
defect or as browser pass evidence.

### 12.1.2 Prompt closure and commit timing

Once a Verifier returns a final result, the main thread should promptly reconcile the evidence in the
owning Task File and any affected current-status, validation, or roadmap record. If the result is
`VERIFIED`, stage only the known owner-controlled product and process paths, create the smallest
appropriate local commit, and immediately verify the new `HEAD`, working-tree boundary, and relevant
runtime health. Do not leave a completed candidate and its closure record indefinitely dirty while
starting unrelated analysis. This timing rule does not override the Git-ref freeze: no commit,
amend, rebase, branch switch, or process-document write is allowed while the Verifier checkpoint is
still active. A `NEEDS_REPAIR` or `BLOCKED` result is recorded and triaged instead of being committed
as verified.

### 12.2 Verification selection

Choose the narrowest checks that can prove the Work Order, then expand for affected contracts:

- domain or state change → focused domain and transition tests;
- API or persistence change → contract, repository, reset, and role/privacy tests;
- UI route or form change → build, route, and browser smoke checks;
- shared contract or schema change → affected integration and transitive checks;
- authentication or permission change → positive and negative role tests; and
- parent closure → complete applicable local baseline and documentation/scope checks.

Do not create empty browser, database, deployment, or release lanes before a real surface requires
them. Do not substitute a weaker test merely because the registered check is inconvenient.

### 12.3 Verifier result

The Verifier must classify the result as:

- `PASS`: acceptance criteria reproduced under the named source and runtime;
- `CODE_DEFECT`: implementation behavior contradicts the contract;
- `TEST_DEFECT`: the check is wrong, stale, or insufficient and needs a separate decision;
- `ENVIRONMENT_FAILURE`: runtime, dependency, service, browser, or machine state prevented the
  check;
- `AUTHORITY_CONFLICT`: the expected behavior conflicts with an accepted rule; or
- `UNKNOWN`: the evidence is incomplete or the outcome cannot be trusted.

The Verifier must not turn `ENVIRONMENT_FAILURE` or `UNKNOWN` into a code fix by guesswork.

## 13. Failure, repair, and retry protocol

### 13.1 Main-thread triage

When verification fails, the main thread records:

- exact command or browser action;
- source identity and working-tree state;
- runtime and environment;
- expected result;
- actual result and error text;
- first failing boundary;
- whether the result is reproducible;
- likely failure class; and
- the smallest next check that can disprove the diagnosis.

The main thread does not send a vague “please fix it” prompt.

### 13.2 Repair prompt

A repair prompt must state:

```text
Repair the single diagnosed defect in Work Order <ID>.

Evidence:
- Source baseline:
- Failing command or browser action:
- Expected result:
- Actual result:
- First failing file, boundary, or contract:
- Reproduction status:

Allowed scope:
- <exact files and behavior>

Do not:
- add a feature;
- change accepted authority or contract;
- weaken the test;
- add a fallback or speculative dependency; or
- modify unrelated files.

Acceptance:
- <specific corrected behavior>
- <focused checks to rerun>

Stop and report if the diagnosis requires a scope, architecture, data, security, or authority change.
```

### 13.3 Retry rules

- A local deterministic check may be rerun once to distinguish an invocation error from a real
  failure, with both outcomes recorded.
- A flaky or environment-dependent result needs classification and a bounded reproducer, not blind
  repetition.
- An unknown external or remote outcome must not be blindly retried.
- After repeated failure without new evidence, stop the loop and revisit the baseline, assumption,
  contract, or architecture.
- A repair is not verified by the person who made the repair alone; run a fresh independent check
  when the defect is material.

### 13.4 Blocker report template

Use this compact format in the main-thread conversation and the owning Task File when a blocker is
material:

```markdown
## Blocker report — <Work Order>

- **Status:** BLOCKED | CONSTRAINED | AWAITING_DECISION
- **Affected role and owner:**
- **Source identity and observation time:**
- **Evidence:** <exact command, thread readback, file/diff, or runtime result>
- **First failing boundary:**
- **Failure class:** CODE_DEFECT | TEST_DEFECT | ENVIRONMENT_FAILURE | AUTHORITY_CONFLICT | UNKNOWN | PROCESS_DEFECT
- **Blocked claim/dependency:**
- **Impact on parent goal:**
- **Safe continuation:** <bounded work that may continue, or none>
- **Forbidden continuation:** <work that would depend on or mutate the blocked boundary>
- **Recommended decision/recovery:**
- **Resume condition:**
```

The report is a decision aid, not a substitute for diagnosis. It must distinguish verified facts,
inference, and recommendation, and must not silently convert a blocker into a scope reduction or a
weaker acceptance claim.

## 14. Integration and coupling procedure

An integration Work Order starts only after its input outputs are independently verified or their
known limitations are explicitly accepted by the main thread.

### 14.1 Integration checklist

The Integrator or main thread checks:

1. every input has a known source and owner;
2. changed paths do not overlap unreviewed work;
3. shared types and API semantics agree;
4. only one domain state machine remains authoritative;
5. role and privacy projections remain separate;
6. schema, seed data, reset, and migration behavior agree;
7. idempotency, version, error, and stale-state behavior agree;
8. routes and forms consume the intended application services;
9. no integration workaround creates a hidden fallback;
10. the combined Happy Path works; and
11. the affected focused, integration, and aggregate checks are rerun.

### 14.2 Contract conflict

If two worker outputs require incompatible contracts, do not choose the more convenient one in the
integration task. Return the conflict to the main thread with:

- current contract and owners;
- competing proposals;
- affected files, roles, data, and tests;
- failure and migration implications;
- minimal alternatives; and
- the evidence required for a decision.

If the decision changes accepted behavior or authority, update the governing ADR and affected
RightSpot documents before closing the integration increment.

## 15. Documentation and evidence writeback

### 15.1 Work Order and Development Record

The Work Order or Development Record stores execution-specific facts. A supporting worker normally
returns these facts in its thread report; the main thread writes them into the canonical Task File
or an explicitly selected Development record after inspecting the source:

- what was assigned;
- what actually changed;
- what was tested;
- exact runtime and commands;
- failed or skipped checks;
- source and dirty-state limitations;
- residual risks; and
- next gate.

Do not copy raw command transcripts or chronology into product or architecture documents.

### 15.2 Canonical RightSpot documents

The main thread updates canonical documents when the increment changes:

- product intent or scope → product definition, requirements, current status, or ADR;
- domain states or authority → domain model, system design, API contract, or ADR;
- implementation stack or dependency policy → implementation ADR and affected Runbook;
- implementation status or claim boundary → current status and Development index; or
- verification/evidence claims → validation and Development records.

If no canonical document needs changing, record why in the Development Record. Never close code
against stale authority.

## 16. Git and source closure

Supporting tasks must not touch the Git index, commit, push, deploy, or publish. They may edit
assigned working files only. Package installation is allowed only when the active Work Order names
the package manager and approved dependency set; installation must not modify the outer repository
or create an external runtime dependency.

The main thread follows the repository Git gate:

1. inspect actual root, branch, upstream, ownership, dirty state, and divergence;
2. preserve unrelated and collaborator-owned work;
3. inspect exact worker changes and forbidden-path violations;
4. integrate deliberately, never with destructive reset or blind pull;
5. rerun invalidated checks after integration;
6. stage exact task-owned paths or hunks;
7. review the complete staged diff and sensitive/scope scans;
8. commit one coherent verified increment when authorized;
9. fetch and inspect remote movement before pushing;
10. push only the intended branch when authorized; and
11. report local, committed, pushed, CI, runtime, deployment, judge, and submission states
    separately.

An uncommitted local result may be useful evidence, but it is not remote delivery.

## 17. Security, privacy, and external-action boundaries

Work Orders and thread prompts must not contain:

- passwords, API keys, bearer values, signing material, or private cookies;
- raw browser session state or private context locators;
- unnecessary personal information or real tenant identity documents;
- mutable production databases or private runtime dumps; or
- opaque delivery receipts that are not needed for the assigned local task.

Workers must not send external messages, publish artifacts, deploy services, spend money, alter
accounts, or access production systems unless a separate explicit authority and Work Order permits
that exact action. A request to “finish” a task does not broaden these permissions.

## 18. Anti-patterns and stop conditions

Stop and return to the main thread when any of the following occurs:

- the source baseline differs materially from the Work Order;
- another writer owns an overlapping path;
- the task requires a new dependency, migration, public protocol, credential, or external effect;
- accepted product, architecture, security, privacy, or data authority would change;
- a test is being weakened or a fallback is being added to hide a failure;
- a result is unknown, partial, or not reproducible;
- the worker has completed its assigned outcome and is tempted to begin another one;
- the same root cause fails repeatedly without new evidence;
- the task would modify an outer or sibling project; or
- the requested closure claim exceeds the evidence level.

Do not:

- dispatch multiple workers to the same shared file without isolation;
- run a verifier against a moving source;
- let a Builder verify its own repair as independent evidence;
- use a thread title, summary, or final prose as the only status source;
- create a new Task for every phase of one bounded increment;
- store raw thread IDs or private context in product or general canonical artifacts; a minimal provider
  identifier may appear only in a Task File incident record when needed for reconciliation, never as
  proof of source identity, ownership, isolation, or completion;
- create an automation merely to poll an internal worker; or
- keep a failing loop alive to avoid reporting a blocker.

## 19. RightSpot first-pilot sequence

The first use of this Runbook should be deliberately small:

### Phase 0 — Baseline lock

The main thread confirms the RightSpot source state, parent Task, accepted stack ADR, exact mutable
scope, package/runtime permission, SQLite/reset semantics, health-route contract, verification
commands, canonical writeback owner, and whether the current untracked documentation baseline is
available to the chosen worker state. If the target Node baseline is unavailable, label the actual
runtime as limited evidence and do not claim final closure from it.

### Phase 1 — Foundational Builder

Dispatch one Builder for the first coherent application-shell increment. The increment may include
the project scaffold, scripts, child-level generated-state ignore rules, local persistence foundation,
health route, and directly necessary test harness, but it must not silently expand into business
tables, authentication, or all product features.

### Phase 2 — Independent verification

Dispatch one Verifier for local startup, source/runtime compatibility, and the registered focused
checks. The Verifier reports pass/fail without repairing the shell.

### Phase 3 — Repair if required

If a code defect is confirmed, send one bounded repair prompt to the responsible Builder. If the
issue is architectural, environmental, or unknown, stop for main-thread triage instead.

### Phase 4 — Contract stabilization and bounded parallel delivery

After the foundation and relevant contracts are documented or frozen, the main thread actively maps
the ordinary user journeys by persona, page, route, component, and application boundary. Separate
screens alone do not prove parallel safety, but tenant and agent interfaces are valid parallel
candidates when their route/component/test ownership is disjoint, shared-shell ownership is named,
and the integration contract is explicit.

A bounded Architecture Advisor may run read-only in parallel with a Verifier to propose the next
parallel set. The main thread reviews that proposal before dispatching the corresponding Builders.
Builders may work against a stable API or view contract while its producer is being verified; the
result remains unintegrated until the producer evidence and the main-thread coupling checks pass.

### Phase 5 — Coupling and closure

Integrate only verified outputs, run the affected combined Happy Path, update canonical documents,
and close the parent Task only after the complete applicable evidence is available.

## 20. Pilot review

After two or three bounded increments, the main thread records a short retrospective covering:

- number of dispatched Work Orders;
- number of source or ownership conflicts;
- verification reproducibility;
- repair cycles and whether they produced new evidence;
- blocker-report latency and whether safe parent-goal work continued during each blocker;
- documentation drift or authority violations;
- integration overhead;
- work that would have been faster directly; and
- whether the pilot should continue, be narrowed, be revised, or be proposed for wider adoption.

The pilot is not promoted to a repository-wide rule from thread count or subjective enthusiasm.
Promotion requires a separate explicit decision and evidence that the process improves controlled
delivery without creating disproportionate coordination cost.
