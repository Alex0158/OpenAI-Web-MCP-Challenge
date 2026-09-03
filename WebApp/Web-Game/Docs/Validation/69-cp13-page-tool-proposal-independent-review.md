# CP-13 Page Tool Proposal — Independent Review

**Role:** Independent review supporting one owner accept/reject decision  
**Status:** VERIFIED review of documents and current source; one measurement executed  
**Date:** 2026-09-03  
**Reviews:** [`64-cp13-page-tool-contract-preimplementation-challenge.md`](64-cp13-page-tool-contract-preimplementation-challenge.md)  
**Audience:** The owner and the CP-13 implementation record

## 1. Recommendation

**At review time, accept the design direction but return the document for amendment.** The five
contract amendments and the independent WebMCP finding were subsequently returned in Validation/64 and
Validation/68. The owner accepted the amended four-read preparation on 2026-09-03; the recall
transition remains a separate runtime prerequisite, and the side-chat Soldier dispatch suggestion is
deferred beyond CP-13.

The core design choices are correct and should be preserved unchanged: server-derived scope with no
caller-selectable authority, argument-light reads, a deferred state-changing tool routed through the
gateway after its transition proof, full-snapshot reconciliation as the only renderable ingress, and an
explicit refusal to treat page-side registration as adapter evidence. Those are the choices that make the surface safe, and this
review found no fault in them.

The problems are one scope-honesty issue, two unresolved external dependencies, and one undelivered
part of the document's own verification plan.

## 2. Method

The proposal was read in full and each of its load-bearing claims was checked against current source
and the accepted contract rather than accepted on its own terms. One measurement was executed against
the live fixture to quantify a bound the proposal leaves open. No proposal text was edited.

Source state observed: outer `HEAD 2771a7d` with the uncommitted game tree;
`Docs/Validation/64` last written 2026-09-03 00:03.

## 3. Findings

### R-01 — "Reuse the existing gateway" understates the work by a large margin

The proposal repeatedly frames the mutation as reuse: "Reuse the existing `WorkerCommandGateway`",
"one gateway transaction", "keeps all state changes in the already verified gateway", and "smallest
implementation blast radius".

Current source does not support that framing. `WorkerCommandGateway` exposes `movePlayer`,
`setMovementIntent`, `stopMovementIntent`, `fullSnapshot`, `advance`, and `assignSoldierMission`.
At the time of this review there was no recall method. A search of `src/` found `ON_RECALL` only as a
return-policy enum value in `mission-service.ts`; the server recall transition was subsequently
implemented and verified under [`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md).

Accepting `force_recall_soldier` therefore authorizes, in one step:

- a new gateway command method and its typed envelope;
- the recall state transition itself, including phase change to `RETURNING`, route recomputation to
  the current home anchor, cargo preservation, and interaction with an active encounter; and
- the tool exposure on top of both.

Only the third was "reuse" at review time. The proposal did not state the implementation dependency
plainly; the later server transition now has its own task and evidence, while page exposure remains a
separate gate.

**Amendment:** state plainly that `force_recall_soldier` requires the recall transition to be built
first, and separate that work from the tool-surface work so the owner is accepting two things
knowingly rather than one.

### R-02 — The one mutation depends on an explicitly open contract decision that the proposal never mentions

`Docs/Scenarios/09-cp09-mission-role-return-fixtures.md`, vector M09-08, says of a recall during an
encounter: "The recommended minimal outcome is a typed `IN_COMBAT` rejection with no phase change; a
deferred return intent is an alternative that **requires an explicit contract decision and additional
race fields**."

The proposal contains no reference to M09-08, to `IN_COMBAT`, or to recall-during-encounter in any
form. Its failure and race matrix covers stale reads, duplicates, cursors, admission, and composition,
but not the combat boundary.

This matters because `IN_COMBAT` appears in the contract's minimum failure list in section 8 and in
**zero** source files, and because the seeded G2 demonstration puts the recalled soldier in an
encounter by design. The single most likely moment for an Agent to attempt a recall is exactly the
moment the contract has not decided.

**Amendment:** either resolve M09-08 before accepting, or record it in the proposal as a named blocking
dependency with its own decision gate.

### R-03 — One read is bounded and the larger one is not

The proposal bounds `inspect_mission_history` with `limit 1..50` and an opaque cursor, and its failure
matrix contains the row "History grows without bound → Enforce server limit and opaque cursor". The
same reasoning is not applied to `inspect_client_snapshot`, whose proposed input is `{}` with no
bound.

Measured against the live fixture in this session:

| Quantity | Value |
|---|---:|
| Initial full `client_snapshot`, serialized | 6,693 bytes |
| `player.exploredCells` at fixture start | 49 |
| `map.blockedCells` at fixture start | 0 |
| Bytes per coordinate pair | 18 |
| Upper bound with the 128 × 128 map fully explored | ~300,000 bytes |

The dominant term is `player.exploredCells`, which grows monotonically with exploration toward 16,384
entries, plus `map.blockedCells`, which is unbounded by type. Most of that payload is fog bookkeeping
that an Agent cannot act on, and it would be returned in full on every `inspect_client_snapshot` call.

The snapshot is the correct reconciliation artifact for the page, which consumes it incrementally over
a realtime channel. It is not obviously the correct payload for a tool result delivered to an Agent.

**Amendment:** either bound or project `inspect_client_snapshot` for the Agent surface, or state
explicitly why an unbounded payload is acceptable there when it was rejected for history.

### R-04 — Two ownership-denial codes are in use and the proposal picks the one the contract does not name

The contract's section 8 minimum failure list names `NOT_OWNER`. The proposal's failure matrix
specifies "Typed `OWNERSHIP_DENIED`/scope failure".

In current source, `OWNERSHIP_DENIED` appears in seven files and `NOT_OWNER` in three. The contract
never mentions `OWNERSHIP_DENIED`.

This is small, but the tool surface is exactly where an external consumer will branch on the code, so
which one is normative should not be left implicit.

**Amendment:** name one code for the tool surface and reconcile the contract, or state the mapping
between the persistence-layer code and the contract-level code.

### R-05 — The document does not deliver the coverage mapping it requires of itself

The proposal's verification plan states: "A manual review must map W13-01 through W13-08 to the
proposal, with W13-01/W13-07 explicitly gated on genuine adapter behavior."

The document references W13-01, W13-02, W13-05, W13-07, and W13-08. It never references **W13-03
(valid recall action), W13-04 (stale recall), or W13-06 (duplicate recall)** — the three vectors that
cover the only state-changing tool.

The substance of W13-04 and W13-06 is partly addressed in the failure matrix under different names.
W13-03, the positive recall path, has no counterpart anywhere in the document.

**Amendment:** include the explicit eight-row mapping the plan calls for, so the owner can verify
coverage rather than infer it.

## 4. One section should be promoted regardless of the decision

The proposal's "External API reference" section contains the strongest evidence in this repository
about the question that gated CP-13. At the time of this review it recorded that the WebMCP draft
"explicitly says that it does not prescribe the format used to expose tools to a browser Agent, and
`getTools()` is intended for in-page agents", and correctly separated page-side registration from a
supported browser/model adapter's genuine discovery and invocation. The adapter gate is now closed for
the disposable page by SK-EVID-045.

That is a partial answer to check D1 in
[`68-cp13-webmcp-capability-differential-diagnostic.md`](68-cp13-webmcp-capability-differential-diagnostic.md):
it indicates that the page API and browser-Agent discovery are **specified as separate concerns**, so
a positive `document.modelContext` result was never going to be sufficient on its own.

It was subsequently preserved in section 4a of
[`68-cp13-webmcp-capability-differential-diagnostic.md`](68-cp13-webmcp-capability-differential-diagnostic.md),
independently of the proposal's accept/reject outcome.

## 5. Assessed as sound

The following were checked and should be preserved through any amendment.

1. **Server-derived scope.** "Tool arguments must never select authority" and the four reads taking
   `{}` are the right shape. `nextAction` was verified to exist already as
   `ClientMissionNextAction` in `world-projection.ts`, so `inspect_missions` is grounded in a real
   field rather than a hoped-for one.
2. **Mutation returns metadata, not a renderable row.** Requiring the page to reconcile through the
   existing full snapshot prevents WebMCP from becoming a second projection ingress. This is the
   single most important safety choice in the document.
3. **Registration is not evidence.** Steps 3 and 5 of the lifecycle, and the refusal to polyfill,
   correctly encode the lesson from `SK-EVID-001` and `SK-EVID-030`.
4. **Signal provenance is provenance only.** Treating `signal_id` and `causal_event_id` as checkable
   context rather than authority closes the obvious escalation path.
5. **The five-tool scope.** The rejected "expanded candidate set" would have multiplied the authority
   and privacy surface before any capability is proven. Deferring it is correct.

## 6. Questions for the owner

1. R-01. Do you accept building the recall transition and the tool surface together, or should recall
   land as its own checkpoint increment first?
2. R-02. What is the recall-during-encounter outcome: typed `IN_COMBAT` rejection, or deferred return
   intent with the additional race fields M09-08 mentions?
3. R-03. Should `inspect_client_snapshot` be bounded or projected for the Agent, or is an unbounded
   payload accepted with a stated reason?
4. R-04. Which ownership-denial code is normative for the tool surface?
5. R-05. Should the proposal be returned for the eight-row W13 mapping before acceptance?
6. Should the WebMCP draft finding be promoted into `SK-ISSUE-001` now, independently of the decision?

## 6a. Owner disposition, 2026-09-03

The owner reviewed this record and accepted its analysis and recommendations. All six questions are
decided. No question remains open.

### Decided

| Question | Decision | Consequence |
|---|---|---|
| R-01 | **Separate the two.** The recall transition lands as its own checkpoint increment before the tool surface exposes it | `Validation/64` must stop describing the mutation as reuse. The server transition is now runtime-verified under SK-TASK-060/SK-EVID-046; `force_recall_soldier` still needs the page grant, canonical transport, and reconciliation gate |
| R-03 | **Bound or project `inspect_client_snapshot` for the Agent surface** | The Agent read must not be the raw page reconciliation payload. The dominant term, `player.exploredCells`, should not be sent to an Agent at all unless a named consumer needs it |
| Promotion | **Preserve the WebMCP draft finding now, independently of the proposal's fate** | Applied. It is recorded in section 4a of [`68-cp13-webmcp-capability-differential-diagnostic.md`](68-cp13-webmcp-capability-differential-diagnostic.md) |

### Decided on confirmation

| Question | Decision | Reason |
|---|---|---|
| R-02 | **Adopt the typed `IN_COMBAT` rejection** as the G2 behavior, and record deferred return intent as a post-G2 option | It is the outcome the owning scenario already recommends; the alternative needs additional race fields and more contract surface before any capability is proven. A visible, typed refusal is also an honest demonstration of server authority and the human boundary, which is closer to the product thesis than a silent rescue. **Residual risk:** if the Agent arrives while the soldier is in combat, its one bounded action fails. That is a demo-choreography problem for CP-16, not a reason to complicate the contract |
| R-04 | **`NOT_OWNER` is normative** for the tool surface and map the persistence-layer `OWNERSHIP_DENIED` onto it | `NOT_OWNER` is the code the accepted contract already names in section 8. The tool surface is the external boundary and should speak the contract's vocabulary |
| R-05 | **Return the proposal** for the complete eight-row W13 mapping before acceptance | Three of the eight missing vectors are the ones covering the only mutation. With R-01 decided, that mapping also has to change, so it is cheaper to redo once |

### Not in scope of this disposition

The capability gate is resolved for the disposable page by SK-TASK-059 and SK-EVID-045. No decision here
authorizes a page registration or a game-page adapter claim. The amended four-read preparation is
accepted in SK-TASK-053; the server recall transition is now runtime-verified under SK-TASK-060 and
SK-EVID-046, while `force_recall_soldier` still needs the page grant, canonical transport, and full-
snapshot reconciliation before admission. The side-chat Soldier dispatch candidate remains deferred
until target discovery, grant semantics, and its own W13 coverage are closed.

## 7. Claim boundary

This is a document and source review plus one payload measurement. It executed no capability probe, no
browser session, and no WebMCP call. It records the amendment basis for the accepted preparation and
changes no contract. It is not capability, Agent, Re-entry, hosted, or judge evidence.
