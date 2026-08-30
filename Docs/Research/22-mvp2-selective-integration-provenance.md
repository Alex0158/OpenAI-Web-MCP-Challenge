# MVP2 Selective Integration and Provenance Record

**Role:** SUPPORTING contributor-branch integration record  
**Status:** Current documentation disposition; no whole-branch source merge authorized  
**Recorded:** 2026-08-31, Europe/London  
**Integration branch:** `codex/integrate-mvp2-knowledge`  
**Contributor branch:** `origin/codex/mvp2-tenderrelay`  
**Contributor attribution:** Eddie; source commit Git author `Cherifi, mohamed iyad`

## 1. Integration decision

Eddie's branch remains intact as the contributor-owned implementation and research source.
The complete branch is not merged into `main` because it would simultaneously introduce an
unselected TenderRelay application, a wire-incompatible Receiver composition, weaker
authority and delivery semantics, branch-local claims, and parallel root documentation.

The shared mainline instead receives:

1. the reconciled candidate topology in
   [Research 21](21-cloud-receiver-local-connector-candidate-topology.md);
2. this exact provenance and selective-reuse record; and
3. updates to Core, Knowledge, and evidence rules where the branch review exposed reusable
   gaps or clearer decision boundaries.

No MVP2 runtime file, root README change, TenderRelay product selection, or live-evidence
claim is imported by this integration.

## 2. Named baselines

| Surface | Named commit or observation | Meaning |
|---|---|---|
| Main baseline at integration start | `6736abe9550f5b4b01e71e17b8b6449a4b9ac89e` | Current authority before this documentation integration |
| MVP2 runtime review baseline | `fab956e3a64c3bc127016266e45441c844e6906d` | Runtime, modularization, tests, and selective-reuse review owned by Research 17 |
| Contributor documentation tip | `3f746694069486d3d48d5c6a26c73942ff6eab42` | Adds the branch-local Cloud Receiver/Local Connector plan and pre-integration handoff; no runtime change after `fab956e` |
| Divergence at integration start | 9 main-only commits; 7 contributor-branch-only commits | A normal whole-branch merge would combine independently evolved authority and product surfaces |
| Full contributor delta | 36 files; 8,132 additions | Includes `mvp2/`, `mvp-shared/`, root README changes, and the two long branch-local reports |

The branch-local reports remain the complete contributor analysis. Research 21 is a shorter
mainline reconciliation, not a silent rewrite of their history.

> Derived from Eddie's contributor-branch plan at commit `3f74669`; reconciled to canonical
> app-first sequencing. The original branch files remain unchanged.

## 3. Bounded verification state

The runtime baseline reviewed in [Research 17](17-mvp1-mvp2-comparative-integration-review.md)
was revalidated during the 2026-08-31 integration preflight with the Codex primary-runtime
Node `v24.19.0` executable used for repository verification:
the full suite passed 18 of 18, the cross-domain conformance subset passed 8 of 8, and all 20
JavaScript or MJS files passed syntax checks. The exact mainline suite passed 118 of 118 in
the same primary-runtime preflight. This record does not claim identical warning behavior
across every Node executable packaged with the Desktop app. The contributor branch tip after
the reviewed runtime baseline changes only the two documentation reports.

Those tests do not prove dormant task wake, Browser acquisition, genuine page-bound WebMCP,
Receiver-owned consent, distributed durability, or Host-effect acknowledgement. The test
adapter mocks `codex queue`; enqueue is not runtime activation. The full branch diff also has
three pre-existing blank-line-at-EOF warnings in MVP2 public assets. These warnings are not
the reason for rejection, but they reinforce that a whole-branch merge is neither a clean nor
a decision-neutral documentation operation.

Contributor-reported live behavior remains useful provenance but is not promoted without a
frozen, redacted, correlated package under the mainline evidence rules.

## 4. Selective-reuse disposition

| Branch asset or insight | Current disposition | Gate before source import |
|---|---|---|
| Cloud Receiver plus outbound Local Connector topology | Integrated as supporting candidate analysis | Accepted app-selection requirements, then topology ADR |
| Strict schemas, validators, canonical serialization, and test vectors | Preserve as implementation reference | Versioned mechanism/protocol decision compatible with ADR-0004 |
| Host SDK and Host Adapter interface | Strong candidate | Selected app and shared authority contract |
| Agent Adapter interface | Strong candidate | Selected transport and per-Grant private context resolution |
| Second non-tender Host fixture | Conformance seed | Shared protocol decision and genuine boundary test |
| `AbortSignal` stage-tool lifecycle | Reusable implementation pattern | Server-side state guards and fresh-tool evidence retained |
| Two-actor UI, visible artifact, and demo choreography | Product/reference pattern | App-selection ADR; TenderRelay is not the default |
| Diagnostics cards | Presentation pattern only | Correlated event, delivery, Browser, Site Tool, effect, replay, and human-boundary evidence |
| External sender simulator | Distributed-test seed | Separate Host/Receiver stores, key custody, identity, and failure domains |
| Direct `codex queue` adapter | Experimental adapter candidate | Dormant wake, exact target, Browser/WebMCP, durable dispatch, and effect acknowledgement proof |

## 5. Explicitly excluded from this integration

- the current MVP2 `ReceiverCore` and `ContinuationApplication` composition;
- `JsonFileStateStore` as shared durability infrastructure;
- caller-asserted `humanApproved` consent;
- process-global raw Desktop task binding;
- free-form website-derived continuation instructions;
- synchronous accept-then-queue delivery semantics;
- optimistic or source-scan-only diagnostics as runtime proof;
- TenderRelay as the selected application or product name;
- the contributor branch's root README changes; and
- any complete-branch merge authorization.

These exclusions are about current authority and evidence, not a rejection of Eddie's work.
The remote branch remains the inspectable source for future selective import.

## 6. Integration rule for future assets

Before importing a branch asset:

1. name the applicable app, protocol, or adapter decision;
2. identify the exact source commit and preserve Eddie's authorship;
3. adapt the asset behind the current Host, Receiver, delivery, and Agent boundaries;
4. remove the P1 weakness relevant to that asset class;
5. run the current mainline suite plus its focused branch tests;
6. capture genuine runtime evidence for every live claim; and
7. update Core, the accepted ADR, evidence ledger, and public explanation together.

## 7. Claim boundary

This integration proves that the contributor branch was reviewed and its decision-grade
knowledge was reconciled into current mainline documentation. It does not prove that MVP2
is merged, selected, deployed, production-ready, or behaviorally reproduced on `main`.
