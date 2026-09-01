# ADR-RS-0005: Checkpoint Source Identity and Path Ownership

**Status:** Accepted — RightSpot-scoped; effective for future dispatches and the `RS-WO-002-03` T2 handoff
**Decision date:** 2026-09-01
**Decision owner:** Main RightSpot thread

## Context

The first RightSpot delegated-work checkpoints used content hashes for a broad set of documents
because the child application initially included untracked source. That evidence was useful for
identifying a starting snapshot, but treating every recorded hash as a permanent lock creates false
failures. A Builder is expected to change its owned implementation paths, the main thread may update
status and evidence, and generated output may change during a normal run.

The pilot therefore needs to distinguish source identity, path ownership, and process writeback. A
manifest must identify what a worker saw at one checkpoint; it must not become a substitute for Git,
a merge protocol, or a global lock on the whole child application.

## Decision

### 1. Use checkpoint-scoped source identity

Source identity is established separately for each execution checkpoint. Its preferred evidence is:

1. a clean, reviewed local Git commit;
2. a Git commit plus an explicit record of dirty paths and content hashes when the checkpoint
   intentionally includes uncommitted source; and
3. path/content records for untracked source that Git cannot identify.

A full content manifest is supplementary evidence for untracked or dirty source. It is not a
permanent replacement for a reviewed Git baseline and must not be compared as a global, immutable
lock throughout a checkpoint.

The dispatch record also names the repository root, branch, runtime, package/dependency identity,
and the governance revision used for the handoff. Governance revision and execution baseline are
separate identities: a process-only revision does not change the product execution baseline.

### 2. Declare ownership by path, and by section when a shared file mixes concerns

Each Work Order declares:

- **Read set:** inputs the worker may inspect but may not author. A change is source drift only when
  it changes a semantic input to the Work Order.
- **Worker write set:** exact authored paths the worker may create or modify. Changes are expected,
  but the main thread must inspect the actual diff against the Work Order.
- **Forbidden set:** paths and actions outside the assignment. An unexpected authored change here is
  an ownership or scope violation and stops the checkpoint.
- **Generated set:** explicitly allowed ignored runtime/output paths. Their contents do not establish
  product source identity and they are not staged as authored source.
- **Main-thread orchestration writeback set:** explicitly named status/evidence paths or sections
  that only the main thread may update while a worker runs. These writes may record lifecycle and
  process evidence, but must not change the Work Order objective, acceptance criteria, runtime,
  dependencies, allowed paths, source authority, or product/domain contract.

If one document contains both immutable contract text and process-only status/evidence, the Work
Order must treat those sections as separate ownership surfaces. A change to the contract portion is
source drift and requires a stop and re-baseline; a change limited to the declared process-only
portion does not invalidate the implementation baseline.

### 3. Validate changes according to their ownership class

At each checkpoint, validation asks whether a changed path is expected under its declared class:

- read-only semantic input changed → stop for source-drift classification and re-baseline if
  intentional;
- worker-owned write path changed → inspect scope, diff, and acceptance behavior;
- forbidden path changed → stop and report; do not hide it with reset or cleanup;
- generated path changed → apply the declared ignore/output policy; and
- main-thread process-only writeback changed → preserve the execution identity unless the semantic
  contract also changed.

The main thread must not infer ownership from a filename after the fact. Ambiguous ownership,
unexpected overlap, or merge ambiguity stops the checkpoint until the main thread resolves it.

### 4. Freeze the source at Builder handoff

The checkpoint sequence is:

```text
T0 dispatch baseline
  -> T1 Builder execution within the worker write set
  -> T2 main-thread handoff: inspect diff and freeze source
  -> T3 independent verification against the frozen T2 source
```

At T2, the main thread records actual changed paths, generated output, the post-Builder source
identity, and the Builder report. Once T3 starts, no worker or main-thread product writer may modify
the frozen verification source. A reviewed local commit is preferred for the T2 snapshot; if dirty
source remains, the Verifier receives the exact commit plus dirty-path/content record.

### 5. Resolve shared ownership explicitly

The main thread owns shared architecture, domain authority, API/security contracts, and canonical
documents. Supporting workers read those surfaces and do not edit them. Non-overlapping worker write
sets may run in parallel only when their read, forbidden, runtime, and generated surfaces do not
conflict. The same shared file is serialized; parallel work requiring it uses separate
branch/worktree state and is integrated by the main thread.

This rule solves ownership and merge ambiguity. The source manifest only records identity; it does
not solve concurrency or integrate changes.

### 6. Re-baseline intentional authority changes

If the main thread intentionally changes a semantic input, shared contract, runtime, dependency, or
other source authority that a worker relies on, the worker stops. The main thread records the change,
revises the Work Order if needed, captures a new baseline, and sends an explicit clarification or
re-dispatch. No worker guesses whether the change is safe.

This decision does not retroactively change an active Work Order's product objective or acceptance
criteria. A process-only clarification may classify an already-recorded main-thread writeback and
allow the same checkpoint to continue, as was done for `RS-WO-002-03`.

## Alternatives considered

### Permanent full-manifest lock

Rejected because expected worker output, status writeback, and generated state would be reported as
false drift. It also cannot solve merge ownership.

### Git commit only

Insufficient when a checkpoint deliberately includes untracked or dirty source. The commit remains
the preferred identity, with path/content records supplementing what Git cannot represent.

### Allow all main-thread document edits during execution

Rejected because a status edit can silently become a contract or authority edit. Process-only
writeback must be explicit and semantically bounded.

## Consequences

- Builder output is validated by the paths it owns rather than rejected for changing itself.
- Main-thread status and evidence can remain current without invalidating an implementation
  checkpoint, provided the writeback is process-only.
- T2 commits make independent verification reproducible and reduce reliance on broad manifests.
- Shared-file and semantic-contract changes remain serialized, so the main thread still carries an
  integration bottleneck.
- Untracked or intentionally dirty source requires more explicit evidence until it is reviewed and
  committed.

## Validation and reopen triggers

Revisit this decision if path ownership repeatedly fails to identify the true source boundary,
process-only writeback changes product behavior without detection, a verifier cannot reproduce the
T2 source, or parallel work creates unresolved shared-file conflicts.
