# MVP2 Branch Pre-Integration Handoff

**Role:** SUPPORTING branch, thread, and implementation handoff  
**Status:** Prepared for branch closeout; does not authorize an indiscriminate merge into `main`  
**Prepared:** 2026-08-30, Europe/London  
**Branch:** `codex/mvp2-tenderrelay`  
**Baseline branch commit before this documentation goal:** `fab956e3a64c3bc127016266e45441c844e6906d`  
**Baseline remote main inspected:** `6736abe`  
**Companion plan:** [Cloud Receiver and Local Connector MVP Plan](21-cloud-receiver-local-connector-mvp-plan.md)  

## 0. Executive handoff

This branch contains a useful modular MVP2 reference implementation and extensive supporting
analysis, but current canonical mainline evidence does not support merging the entire branch into
`main` as one accepted product or mechanism replacement.

The immediate documentation goal is complete:

1. the improved real-world topology is specified as a hosted Cloud Receiver plus an outbound Local
   Connector; and
2. this report records the branch history, current proof boundary, thread decisions, merge risks,
   unresolved questions, and exact next sequence.

The recommended implementation direction is:

```text
Host website and WebMCP page
  -> signed Manifest and Receiver-owned human approval
  -> hosted Cloud Receiver and durable delivery ledger
  -> paired outbound Local Connector
  -> replaceable Codex/browser adapter
  -> canonical page and fresh WebMCP tools
  -> visible draft
  -> human-only final action
```

The next implementation must begin with a kill test for the Local Connector-to-Codex-to-Browser/
WebMCP join. Current evidence does not prove that a dormant local Codex task can be reliably
activated and regain genuine page-bound WebMCP through the available public or documented paths.

The safe branch disposition is:

- preserve and push this branch;
- integrate the two new reports into current `main` through a focused documentation change;
- accept a topology and protocol ADR before implementation;
- import MVP2 assets selectively after the applicable gate; and
- do not silently replace MVP1's Receiver authority, durability, or evidence foundation with
  MVP2's combined JSON runtime.

## 1. Sources reviewed for this handoff

### 1.1 Repository instructions

- root [`AGENTS.md`](../../AGENTS.md);
- the active global Codex collaboration rules; and
- the repository's validated-goal commit, explicit staging, fetch, divergence, and remote-SHA
  verification gates.

### 1.2 Canonical and supporting project documentation

The following current-main documents were inspected from `origin/main` because this branch is
behind current canonical work:

- `Docs/Core/00-current-status.md`;
- `Docs/Core/01-product-definition.md`;
- `Docs/Core/02-product-requirements.md`;
- `Docs/Core/03-system-design.md`;
- `Docs/Core/04-trust-security-reliability.md`;
- `Docs/Research/17-mvp1-mvp2-comparative-integration-review.md`;
- `Docs/Research/18-receiver-queue-and-wake-adapter-architecture-review.md`;
- `Docs/Research/19-app-server-desktop-browser-join-verdict.md`; and
- `Docs/Research/20-workspace-agents-trigger-and-webmcp-boundary.md`.

Relevant branch-local supporting sources were also reviewed:

- [`mvp-shared/README.md`](../../mvp-shared/README.md);
- [`mvp-shared/mvp-pre-modularization-review.md`](../../mvp-shared/mvp-pre-modularization-review.md);
- [`mvp/README.md`](../../mvp/README.md);
- [`mvp2/README.md`](../../mvp2/README.md); and
- current MVP1 and MVP2 source and tests.

### 1.3 Conversation and memory boundary

The active thread established the desired hosted-Receiver and Local-Connector topology, the need
for simple explanations, and the intention to stop treating TenderRelay as the product.

The Codex memory registry contained no consolidated project-specific rollout evidence. Therefore,
this handoff treats repository source, tests, Git history, canonical documents, and the current
thread's explicit decisions as its evidence. It does not invent missing prior-session facts from
memory.

## 2. Repository and branch baseline

At the start of this documentation goal:

| Item | Observed value |
|---|---|
| Repository root | Verified project root returned by `git rev-parse --show-toplevel` |
| Branch | `codex/mvp2-tenderrelay` |
| Branch HEAD | `fab956e3a64c3bc127016266e45441c844e6906d` |
| Branch upstream | `origin/codex/mvp2-tenderrelay` |
| Upstream status | Aligned before this documentation commit |
| `origin/main` | `6736abe` after fetch |
| Divergence from `origin/main` | 6 local-only commits, 9 main-only commits before this documentation commit |
| Merge base | `46b9549302160dc148bb9bcce95a9c76643e1002` |
| Existing dirty item | Untracked `mvp-shared/.README.md.swp` |

The swap file existed before this task. Its ownership and recoverability are uncertain, so it was
not opened, staged, modified, or deleted.

No partial report file or staged change remained from the user-interrupted prior turn.

## 3. Branch commit history and contribution

The branch has six commits after its current common base with `origin/main`:

| Commit | Purpose | Handoff interpretation |
|---|---|---|
| `8f7117c` | Add TenderRelay MVP2 reference implementation | Product-shaped local continuation spike |
| `f3c243d` | Document MVP and MVP2 integration strategy | Initial comparative guidance |
| `ccbd242` | Move MVP integration report to shared layer | Establish supporting `mvp-shared/` handoff layer |
| `354cd76` | Modularize MVP2 continuation infrastructure | Add strict protocol, Host SDK, adapter seams, second Host fixture, and lifecycle tests |
| `a2e83f2` | Merge then-current `origin/main` into branch | Historical synchronization point only |
| `fab956e` | Document MVP modularization review | Preserve additive extraction guidance |

Relative to the merge base, the branch adds approximately 6,154 lines across 34 files, primarily
under `mvp2/` and `mvp-shared/`, plus two root README lines.

The branch adds no current-main D4 harness, App Server Browser-join probes, Workspace Agent audit,
or later canonical reconciliation work. Those nine main-only commits must not be ignored during
integration.

## 4. What MVP2 currently is

MVP2 is a modular local reference for a continuation mechanism with TenderRelay as one replaceable
Host Adapter. Its important reusable pieces are:

- strict Manifest and Event schemas;
- canonical JSON and HMAC signature helpers;
- a `ContinuationHostSdk` for Host-issued offers and events;
- a domain-neutral `ReceiverCore` boundary;
- a replaceable `AgentContinuationAdapter` interface;
- a `ContinuationApplication` composition root;
- an atomic-rename JSON state-store abstraction;
- a separate external-sender simulator;
- a second incident-response Host Adapter fixture;
- state-derived WebMCP Site Tool replacement through `AbortSignal`;
- a visible persistent artifact across stages;
- normal applicant and reviewer human interfaces;
- a diagnostics presentation; and
- a local `codex queue` demonstration adapter.

MVP2's latest branch-local deterministic coverage proves:

- strict event shape and tamper rejection;
- signed Manifest and Event vectors;
- Grant scope checks for origin, URL, workflow, state, event type, and expiry;
- exact replay reuse and conflicting replay rejection;
- one-run reservation;
- stale artifact revision rejection;
- a re-entry draft with no Agent submission operation;
- replaceable Agent adapter behavior;
- obsolete Site Tool abortion; and
- a non-tender Host Adapter using the same infrastructure.

MVP2 remains a local reference, not a production platform. It currently does not provide:

- Receiver-owned context capture per Grant;
- an authenticated Receiver-owned human consent challenge;
- a cloud-hosted Receiver deployment;
- a real paired Local Connector;
- durable relational event and delivery transactions;
- a Host business-transition outbox with production persistence;
- multi-process delivery leases or dead-letter behavior;
- effect-backed Agent completion acknowledgement;
- a supported dormant Codex wake contract;
- a proven Codex-to-Browser/WebMCP join through a public adapter;
- production Host user authentication;
- multi-issuer key lifecycle;
- production multi-tenant isolation; or
- a selected final application.

## 5. What MVP1 currently contributes

MVP1 remains the stronger mechanism and evidence foundation. The current branch-local fixture
contains:

- Receiver-owned context capture;
- one-time capture handles stored by digest;
- exact human consent signals and challenge state;
- private managed-context records and opaque Host bindings;
- strict detached event authentication before parsing;
- exact replay and payload-conflict handling;
- SQLite transactions and compare-and-swap state changes;
- event, run, delivery, Host effect, and receipt records;
- effect-backed idempotent acknowledgement;
- a durable heartbeat Inbox;
- an additive durable-enrollment outbox;
- lease, retry, activation-fence, and sealed-receipt behavior;
- real process-termination and concurrent-approval tests; and
- explicit redaction and claim boundaries.

The current branch-local MVP1 test suite passed 88 tests in this task under the bundled Node
`v24.19.0` runtime.

Current `origin/main` has moved beyond this branch. Its canonical documents report 118 passing
tests after adding D4 lifecycle controls, automation-history scanning, App Server Browser-join
evidence controls, and concurrent-test stabilization. That 118-test mainline suite was not run in
this branch worktree during this documentation goal because current main has not been integrated
here.

MVP1 is still a fixture rather than a production service. Its historical private Desktop adapter
and bounded Scheduled pull evidence do not prove a supported universal production transport.

## 6. Fresh verification performed for this handoff

### 6.1 MVP2

From `mvp2/`:

```text
npm test
```

Result:

```text
18 tests
18 passed
0 failed
```

From `mvp2/`:

```text
npm run test:conformance
```

Result:

```text
8 tests
8 passed
0 failed
```

### 6.2 MVP1

The system-default Node runtime was `v22.14.0`, below MVP1's declared Node 24 requirement. An
initial run under Node 22 emitted partial passing output but did not terminate, so that run was
stopped and was not counted as evidence.

The suite was then run once using the bundled Node `v24.19.0` runtime:

```text
env PATH=<bundled-node-24-bin>:... npm test
```

Result:

```text
88 tests
88 passed
0 failed
```

Two older pre-existing `npm test` process trees in `mvp/` were observed before the successful
Node 24 run. They were not started by this documentation goal and were not terminated because
their ownership was uncertain. A future machine-cleanup task may inspect them explicitly.

### 6.3 Existing branch-wide diff warning

The complete historical branch delta from its merge base reports three pre-existing blank-line-at-
EOF warnings:

```text
mvp2/public/diagnostics.html
mvp2/public/reviewer.html
mvp2/public/styles.css
```

This task does not modify those files merely to make branch-wide status look clean. The two new
reports must pass their own whitespace and Markdown validation.

## 7. Decisions reached in this thread

These are active planning decisions or recommendations from the thread. Unless already controlled
by Core or an ADR, they remain proposed until recorded through repository governance.

### 7.1 Product and mechanism direction

- TenderRelay is not the product and should not control the protocol.
- The target is a reusable continuation backbone for Host websites that expose WebMCP.
- A Host website keeps its own business model, users, workflow, state, and human UI.
- The continuation platform should accept compatible signed events from different Host backends.

### 7.2 Client and Agent direction

- The human and Agent interact with the Host through a client browser.
- Humans use normal UI; Agents use page-bound WebMCP Site Tools.
- The page's current Host state determines the current Site Tool surface.
- Codex must return to the authoritative page and read fresh state before mutation.
- If the actual browser is remote rather than local, the selected adapter needs an explicit remote
  browser-session join; the Connector cannot infer or control a remote tab automatically.

### 7.3 Manifest and approval direction

- A WebMCP action may lead the Host backend to offer later continuation.
- The Host, not the Agent, creates and signs the Manifest.
- The Manifest is an offer, not permission.
- The human approves through a Receiver-owned authenticated surface reached from the browser.
- The Cloud Receiver creates the Grant only after verifying exact scope and user action.
- The approval binds one event, workflow, URL, expiry, run budget, Connector, and human boundary.

### 7.4 Cloud Receiver direction

- A hosted Cloud Receiver is the preferred real-world topology because it can accept events while
  the user's machine is offline.
- It authenticates Host issuers, verifies Manifests and Events, owns Grants, maps opaque bindings to
  owners and Connectors, and stores durable pending deliveries.
- It stores minimal continuation metadata, not a second complete copy of Host business state.
- It does not infer ownership from a URL or trust an event-supplied raw owner/device identity.

### 7.5 Local Connector direction

- A small process runs on the user's machine.
- It makes an outbound authenticated connection to the Cloud Receiver.
- It should use long polling first; WebSocket or SSE is deferred unless latency requires it.
- It opens no public inbound port.
- It stores raw Agent context identity locally only.
- It receives typed bounded deliveries, not arbitrary Host prompts.
- It invokes a replaceable Codex adapter and returns distinct progress and completion evidence.

### 7.6 Human authority direction

- The same narrow Grant does not require repeated approval for every matching non-consequential
  continuation.
- Expired, revoked, exhausted, changed-scope, or different-workflow authority requires a new Grant.
- Login recovery and MFA remain user-mediated.
- The Agent may read and prepare drafts.
- Final submission or another selected consequence remains human-only and server-enforced.

### 7.7 Scope direction

The first implementation should prove only:

- one Host;
- one Receiver deployment;
- one user;
- one Connector;
- one Codex context;
- one browser topology;
- one event type;
- one Grant with one run;
- one resumed draft effect; and
- one human final action.

## 8. Improved mechanism now documented

The companion [implementation plan](21-cloud-receiver-local-connector-mvp-plan.md) defines:

- corrected component names and authority boundaries;
- hosted deployment topology;
- one-time Connector pairing;
- Manifest, approval challenge, Grant, Event, delivery lease, and acknowledgement objects;
- full enrollment, waiting, event, routing, Connector, re-entry, WebMCP, draft, human-boundary, and
  replay happy paths;
- minimal Cloud Receiver and Connector APIs;
- minimal Cloud, Host, and local persistence;
- issuer, user, and Connector authentication;
- data minimization and local attack-surface rules;
- durable at-least-once delivery with idempotent Host effects;
- an Agent/browser adapter kill gate;
- MVP1 and MVP2 selective-reuse maps;
- seven implementation gates, numbered Gate 0 through Gate 6;
- minimum tests;
- operational proof steps;
- explicit scope cuts; and
- definition of done.

The plan is supporting pre-ADR input. It intentionally does not rewrite current Core authority or
claim that the topology is implemented.

## 9. Current platform evidence that constrains the upgrade

### 9.1 Direct queue

MVP2 isolates `codex queue --thread` behind a named adapter. Current evidence proves that the
command exists and can accept at least one queued message in a bounded probe. It does not prove
that an unloaded or dormant task wakes, produces an Agent token, regains an eligible browser,
discovers WebMCP, or produces a Host effect.

`queued` must never be reported as `completed`.

### 9.2 Standalone App Server

Current mainline Research 19 records two failed tested joins:

- an App-Server-owned cold thread resumed exactly, but the required built-in Browser was
  unavailable before page access; and
- a supplied warm Desktop task returned an active-writer rejection before a later turn.

Standalone App Server is therefore not the selected current Desktop Browser/WebMCP adapter.

### 9.3 Scheduled pull

MVP1 H1 proves one bounded scheduled-pull continuation with durable pending work, fresh Inbox and
Host WebMCP calls, acknowledgement-loss recovery, and one effect. It remains a current-build
compatibility experiment. Permanent Agent Heartbeats are economically and operationally weak as a
general product transport.

The proposed Local Connector polls the Cloud Receiver using cheap outbound HTTP. It does not start
an Agent turn for an empty poll.

### 9.4 Workspace Agents

Officially documented external trigger, durable queue, idempotency, and stable conversation-key
semantics make Workspace Agents a possible hosted topology. Current evidence does not prove that
an API-triggered Workspace Agent receives an eligible browser or genuine page-bound WebMCP.

It is a separate hosted-Agent product claim, not a way to resume an arbitrary local Codex Desktop
task.

## 10. Merge-readiness finding

### 10.1 Whole-branch merge is not currently approved

Current canonical `origin/main` Research 17 explicitly concludes:

> Do not merge the complete MVP2 branch into `main` now.

The reason is not that MVP2 is valueless. The reason is that a whole merge would place a parallel
wire contract, weaker Receiver authority/durability path, unselected Tender-shaped application,
and supporting contributor reports beside the canonical mechanism before the relevant product,
protocol, and adapter gates are accepted.

The thread's new hosted-Receiver plan strengthens the future direction, but it is documentation,
not an implementation or accepted reversal of that integration decision.

### 10.2 Branch and main have diverged materially

Before this documentation commit, the branch was six commits ahead and nine commits behind
`origin/main`.

Main-only work includes:

- current status and architecture reconciliation;
- D4 full-restart harness and an inconclusive preserved attempt;
- delivery-ledger-first architecture guidance;
- failed cold and warm standalone App Server Browser-join evidence;
- Workspace Agent trigger/WebMCP boundary research;
- competition thesis and positioning;
- concurrent enrollment test stabilization; and
- updated 118-test evidence claims.

A blind pull, rebase, or merge would be inappropriate.

### 10.3 A merge preview has a root README conflict

A merge preview between the current branch and `origin/main` reports a content conflict in
`README.md`.

The branch adds links to `mvp-shared/` and `mvp2/`. Current main updates test counts, platform
join failures, competition documentation, and the canonical start order. The mainline current-
status language must not be replaced by the branch's older 88-test description.

### 10.4 Recommended integration path

The lowest-risk path is:

1. push this documentation commit to `codex/mvp2-tenderrelay`;
2. preserve the complete branch as the contributor reference;
3. create a focused integration branch from current `origin/main`;
4. cherry-pick or reproduce only the two new documentation reports first;
5. review and accept the hosted-Receiver/local-Connector topology ADR and protocol ADR;
6. select the first Host application and Codex/browser adapter hypothesis;
7. run the Local Connector last-mile kill test;
8. import only the MVP2 protocol, Host SDK, stage-lifecycle, conformance, UI, or diagnostics assets
   authorized by those gates; and
9. preserve MVP1's Receiver authority, transactional durability, delivery/effect, and evidence
   contracts.

### 10.5 If the team intentionally chooses a whole-branch merge

That choice should be explicit and should first replace the current Research 17 decision through
an accepted integration ADR. Then:

1. fetch current main;
2. use a normal merge, not a force push or history rewrite;
3. resolve `README.md` by preserving current main's status, 118-test claim, and platform
   nonclaims;
4. label `mvp2/` as a preserved reference rather than the new production core;
5. keep `mvp-shared/` supporting rather than canonical;
6. run current-main MVP1 tests and MVP2 tests after integration;
7. inspect all staged files explicitly;
8. verify no runtime state, swap file, secret, task ID, or mutable evidence is staged; and
9. update Core only through accepted decisions.

This handoff does not recommend that path under the current evidence.

## 11. What should be kept, changed, and deferred

### 11.1 Keep

From MVP1:

- Receiver-owned context and Grant authority;
- opaque Host binding;
- exact consent challenge;
- SQLite transactions and compare-and-swap;
- event and replay validation;
- delivery tickets and effect receipts;
- heartbeat Inbox concept;
- durable enrollment outbox and activation fence;
- crash and acknowledgement-loss tests; and
- evidence/redaction discipline.

From MVP2:

- strict schemas and vectors after protocol reconciliation;
- Host SDK and adapter seam;
- second Host conformance fixture;
- stage-derived WebMCP lifecycle helper;
- visible shared artifact;
- understandable human workflow; and
- diagnostics presentation backed by real receipts.

### 11.2 Change

- Replace caller-asserted approval with Receiver-owned authenticated approval.
- Replace process-global task binding with per-Grant Connector and local Agent binding.
- Replace JSON aggregate durability with relational Receiver transactions.
- Add Host state-transition outbox persistence.
- Separate event acceptance, delivery lease, Agent start, Host effect, and final acknowledgement.
- Replace direct cloud-to-local assumptions with outbound Connector polling.
- Treat all Host text and event data as untrusted typed input.
- Add exact owner/Connector pairing and revocation.
- Prove the Codex/browser/WebMCP join before cloud platform expansion.

### 11.3 Defer

- broad multi-tenancy;
- universal issuer onboarding;
- multiple polished Host apps;
- multiple Agent platforms;
- general key-management UI;
- WebSocket infrastructure unless needed;
- message brokers and distributed workers;
- installer and auto-update;
- cross-device migration;
- exact-once claims;
- billing and business-model enforcement; and
- protocol standardization claims.

## 12. Next-session starting sequence

The next implementation session should not reconstruct the project from conversation history.
Use this reading and action order.

### 12.1 Read first

1. root `AGENTS.md` and active global instructions;
2. current `origin/main` `Docs/Core/00-current-status.md`;
3. current `origin/main` `Docs/Core/03-system-design.md`;
4. current `origin/main` `Docs/Core/04-trust-security-reliability.md`;
5. current `origin/main` Research 17 through Research 20;
6. [Cloud Receiver and Local Connector MVP Plan](21-cloud-receiver-local-connector-mvp-plan.md);
7. this handoff;
8. `mvp/README.md` and relevant Receiver modules; and
9. `mvp2/README.md` and the Host SDK, protocol, Receiver, Connector-candidate adapter, and tests.

### 12.2 Establish Git baseline

Run the repository-required baseline before editing:

```sh
git rev-parse --show-toplevel
git branch --show-current
git status --short --branch
git log -1 --oneline --decorate
git fetch origin --prune
git rev-list --left-right --count HEAD...origin/main
```

Do not delete or stage `mvp-shared/.README.md.swp` without resolving ownership.

### 12.3 Make the minimum governance decisions

Create or accept:

1. a small topology ADR selecting the candidate hosted Cloud Receiver plus paired Local Connector;
2. a protocol ADR selecting or adapting one wire contract; and
3. a first-slice decision naming one Host, user, event, artifact, browser topology, Agent adapter,
   and human boundary.

### 12.4 Run the first technical gate

Before a cloud deployment, prove:

```text
one local typed delivery fixture
  -> Local Connector
  -> selected Codex adapter
  -> intended context
  -> eligible browser
  -> canonical page
  -> genuine page-bound WebMCP read
```

If this fails, change the adapter or narrow the product mode. Do not hide the failure by using
REST, DOM automation, generic MCP, Chrome, manual reconstruction, or a second Agent.

### 12.5 Build only after the gate passes

Follow the seven gates in the companion plan:

1. decision boundary;
2. last-mile proof;
3. smallest protocol;
4. one-process Cloud Receiver;
5. Local Connector happy path;
6. one Host Adapter; and
7. one correlated end-to-end proof.

## 13. Open decisions carried forward

The next session must resolve these rather than infer them:

1. Which Host workflow is the first reference slice?
2. Which adapter can legally and practically activate Codex and reach genuine WebMCP?
3. Is the intended client browser local, Desktop in-app, or separately hosted?
4. Does the first demo require an existing exact task or permit a fresh bound context plus receipt?
5. Which MVP1/MVP2 protocol becomes v1?
6. Which cloud hosting and durable database are available within the challenge timeline?
7. How is one Receiver user authenticated for the MVP?
8. Which exact human action is consequential?
9. Which evidence marks `awaiting_human` versus `completed`?
10. Is the first integration a focused documentation/asset import or an explicitly approved full
    branch merge?

## 14. Explicit nonclaims

This handoff does not claim that:

- the Cloud Receiver or Local Connector is implemented;
- `codex queue` wakes a dormant task;
- App Server currently joins a local Desktop Browser;
- Workspace Agents expose genuine page-bound WebMCP for API-triggered runs;
- a browser session survives logout, MFA, machine restart, or cross-device movement;
- TenderRelay is selected as the product;
- the MVP2 wire protocol replaces MVP1;
- the complete branch is merge-ready;
- 118 current-main tests were run in this branch worktree;
- delivery is distributed exactly once; or
- the project is production-secure or multi-tenant ready.

## 15. Cleanup and preservation record

During this documentation task:

- no MVP1 or MVP2 source file was changed;
- no runtime database, evidence file, secret, or generated state was staged;
- no existing file was deleted;
- no branch history was rewritten;
- no merge into `main` was performed;
- the untracked editor swap file was preserved;
- only the exact Node 22 test process started by this task was terminated after it failed to
  complete;
- older process trees of uncertain ownership were preserved; and
- the two Markdown reports are the only intended commit targets.

## 16. Handoff acceptance checklist

Before closing this thread, verify:

- [ ] both report files exist and render as readable Markdown;
- [ ] internal repository links resolve;
- [ ] no private task ID, credential, bearer, or secret appears in either report;
- [ ] `git diff --check` passes for the two report files;
- [ ] MVP2 tests pass 18/18;
- [ ] MVP2 conformance tests pass 8/8;
- [ ] MVP1 tests pass 88/88 under Node 24;
- [ ] only the two report paths are staged;
- [ ] the untracked swap file remains unstaged;
- [ ] the documentation commit is created on `codex/mvp2-tenderrelay`;
- [ ] `origin` is fetched immediately before push;
- [ ] divergence from `origin/main` is reported rather than hidden;
- [ ] the branch push is fast-forward and does not force-update;
- [ ] local and remote branch SHAs match after push; and
- [ ] the final user report distinguishes local validation, commit, push, and remaining merge work.

## 17. Final recommendation

Preserve this branch and its authorship, but do not treat branch preservation as approval to merge
every asset into canonical `main`.

Use the new plan to create one narrow real-world vertical slice. Prove the Local Connector last
mile first. Then combine MVP1's authority and durability with MVP2's Host modularity and WebMCP
experience behind an accepted protocol. This gives the project the shortest honest path from a
local reference mechanism to a reusable cloud-to-local continuation platform without spending the
remaining time on infrastructure breadth that the first happy path does not need.
