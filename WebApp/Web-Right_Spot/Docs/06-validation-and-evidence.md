# RightSpot — Validation and Evidence

**Role:** Product validation, test strategy, and claim boundary  
**Status:** Validation plan; the runnable foundation, workflow domain core, durable application
boundary, tenant discovery API, workflow HTTP/DTO transport, shared shell, shared role-page frame,
accepted ordinary role-page product workflow, and post-MVP shared CSS foundation are independently
verified or integrated.

## 1. Current evidence level

The current RightSpot evidence includes a local foundation implementation, an independently verified
workflow domain core, durable application boundary, tenant discovery API, workflow HTTP/DTO transport,
shared shell, shared role-page frame, and the accepted ordinary tenant-to-agent role-page workflow,
plus main-thread reproduction and corrected independent Verifier reruns. The first
foundation attempt is retained as procedurally `BLOCKED` because one assertion wrote outside the
declared RightSpot output boundary; the corrected rerun returned `VERIFIED` with the same source
manifest and no external output. The outer Re-entry Core's tests and frozen MVP evidence do not prove
that RightSpot works. They must not be copied into RightSpot's evidence as product proof.

The first validation target is a stable Happy Path, not commercial completeness. Edge cases still
matter where they could break the demo or violate role/privacy boundaries, but exhaustive
marketplace, account, payment, messaging, and distributed-system coverage is intentionally
deferred.

The canonical scenario inventory, transition matrix, role-entry map, current implementation
disposition, and open findings are maintained in
[`07-business-flows-and-scenarios.md`](07-business-flows-and-scenarios.md). A scenario may be
implemented without being evidence-closed; the catalogue records that distinction explicitly.

## 2. Validation ladder

### Level 0 — Documentation coherence

Confirm that the product thesis, primary slice, state model, role projections, Backbone boundary,
non-goals, and open decisions agree with one another.

### Level 1 — Domain and Backbone tests

Test the documented state transitions, role authorization, version conflicts, expiry, reset,
preparation versus human consequence, repeated actions, slot release, and role-private data
isolation without a browser or external service.

### Level 2 — Ordinary application integration

Run the tenant and agent surfaces against one local composition. Prove that one Viewing Request
can move through the primary slice and that a fresh page read sees the authoritative current state.

The minimum walkthrough is: tenant login → listing discovery → listing detail → Viewing Request
draft → explicit submission → tenant status → agent login → queue refresh → request/review →
availability review → prepared proposal or decline → visible agent send decision → tenant status
refresh → tenant confirmation or decline when a slot was proposed → final tenant status.

### Level 3 — Product usability rehearsal

Ask a fresh evaluator to understand the problem, create one request, review the agent workflow,
and identify the human decision. Record confusion, unnecessary setup, and time-to-completion.

### Level 4 — Optional Hackathon integration

Only after the ordinary product loop works, separately prove genuine WebMCP usage, any selected
continuation adapter, Cloud Receiver integration if required, live deployment, and judge
reproducibility. Each claim needs its own evidence.

## 3. Primary slice acceptance criteria

The first RightSpot implementation should not be considered complete until it can demonstrate:

- deterministic reset to the seeded listing catalogue, one tenant, one agent, no request, and a new
  fixture generation;
- tenant draft validation and visible submission;
- authoritative `REQUEST_SUBMITTED` transition;
- agent queue and role-authorized request projection;
- current synthetic availability read;
- bounded slot proposal or decline preparation;
- visible human agent decision;
- tenant-visible proposal or decline response;
- tenant confirmation or decline of an unexpired proposal, including the terminal result;
- one shared request record with monotonic version continuity;
- no duplicate consequence or audit entry after a repeated completed action;
- slot hold, confirmation, release, and expiry behavior;
- no tenant access to agent-only notes;
- no agent access to tenant private context; and
- clear failure for stale or unauthorized writes.

The first implementation does not need exhaustive failure testing. It does need enough basic
guardrails to prevent a broken walkthrough: invalid role access, missing request, invalid draft,
stale write, invalid state transition, unavailable slot, expired proposal, failed reset, duplicate
submission, and accidental cross-role data exposure.

The current cross-layer audit reproduced three guardrail failures. `F-01` was repaired by enforcing
the pre-submission privacy rule at both authoritative agent read paths: a tenant `TENANT_DRAFT` is
visible to the tenant but absent from the agent queue and direct detail until explicit submission.
`F-02` was repaired by handling the expected session `401` before optional body parsing, and `F-03`
was repaired by allowing the documented `127.0.0.1` development origin through the exact Next.js
config boundary. All three repairs have focused Red/Green evidence, independent verification, and
the applicable browser/build evidence recorded in their Task Files. `F-01` additionally has the
formal persistent Verifier result recorded in `RIGHTSPOT-025`; the current audit has no reproduced
open guardrail finding. The next audit must still re-check the full chain rather than turning these
local checks into a production-readiness claim.

The subsequent rendered-page audit reproduced one P2 presentation finding, `F-04`: the same-listing
request notice composed its state label into ungrammatical and, for later states, inaccurate copy. The
bounded presentation-only `RIGHTSPOT-026` repair passed Red→Green, full direct suite `129/129`,
typecheck, production build, live browser evidence, and independent persistent verification. It did not
alter or block the authoritative tenant-to-agent workflow.

The next tenant request-surface audit reproduced one separate P2 presentation finding, `F-05`: the
response card renders a retained `SLOT_PROPOSAL` as `Action needed` with `Respond by` after the
authoritative request has already become `VIEWING_CONFIRMED`, `TENANT_DECLINED`, or `EXPIRED`. The
bounded presentation-only `RIGHTSPOT-027` Task is now `CLOSED_VERIFIED`: its single UI Work Order
was implemented by persistent task `01a060bf-17c7-7c32-96ad-2ea1aa028ebf` and independently verified by
`01a060a8-6f2d-7141-98d0-385483a9104f`. Focused `3/3`, relevant `48/48`, full `132/132`, typecheck,
production build, exact scope/hash checks, and safe browser smoke passed. The finding did not indicate a
workflow, projection, privacy, or slot-transition defect; the existing response presentation now
consumes authoritative request state and removes actionable deadline language from terminal outcomes.

The subsequent reset-boundary audit reproduced `F-06`: the documented `npm run db:reset` command
previously bypassed the full workflow reset. `RIGHTSPOT-028` repaired only that CLI composition and
its isolated child-process regression. Main Red→Green checks and persistent frozen-source independent
verification passed at integrated commit `b2c1682a34a395ff9471f4338b213a0ede938134`: focused `1/1`,
full direct suite `133/133`, pinned typecheck, production build, whitespace, exact scope, and
repeated reset/reopen evidence all passed. The reset remains a disposable local development/test
boundary; arbitrary corrupt-database salvage, production data management, deployment, WebMCP, and
external authentication remain non-claims.

## 4.1 Post-MVP shared CSS evidence

`RS-WO-007-02` is independently `VERIFIED` and integrated at product commit `89a50c7`. The
same-identity verifier observed the committed CSS candidate and unchanged source boundary before and
after the run. Typecheck, foundation tests `6/6`, build, and `git diff --check` passed; the fresh
served bundle exposed the candidate Field Desk tokens. Signed-out and role redirects, seeded tenant
listing discovery, mobile listing detail, `390x844`/`768x1024`/`1440x900` layout checks, no horizontal
overflow, keyboard focus, control sizing, reduced-motion rule presence, and rendered contrast
samples passed. Browser execution used an isolated non-repository directory and produced no source,
documentation, test, database, or Git metadata mutation.

The agent request-detail consequence path was not exercised because the current fixture queue has no
assigned request. This is a residual evidence boundary, not a CSS defect; deployment, WebMCP, and
external authentication remain non-claims.

## 4. Candidate kill tests

RightSpot should be reconsidered if any of these remain true after a focused prototype:

1. A fresh evaluator cannot understand the tenant-to-agent relay quickly.
2. The flow requires a full marketplace, calendar, payment, or CRM to feel meaningful.
3. Agent preparation is no better than a deterministic queue plus a human notification.
4. Role isolation cannot be demonstrated with negative tests.
5. The shared Viewing Request becomes a copied message rather than a durable artifact.
6. Human decisions are hidden behind preparation or automation.
7. The future Hackathon integration would dominate the product architecture.

## 5. Privacy and safety checks

- synthetic listings, identities, and availability only;
- no payment, deposit, lease, or legal action;
- no sensitive tenant ranking or eligibility inference;
- no credentials or private Agent context in domain records;
- no unrestricted chat or arbitrary instruction transport; and
- all development traces redacted before any public evidence is created.

## 6. Current non-claims

RightSpot currently has no validated product-market fit, production security, deployment result,
WebMCP result, Agent continuation result, Cloud Receiver result, or Hackathon judge result.

## 7. Pre-dispatch runtime evidence

The main thread prepared the exact repository target from the repository-root `.node-version`
(`24.20.0`) in a machine-local directory outside the repository. The official arm64 archive passed
its SHA-256 check. The installed runtime reported Node `v24.20.0`, npm `11.19.0`, and successfully
opened and queried a disposable `node:sqlite` smoke database. The existing default shell remains
Node `v26.5.0`; it was not replaced or relinked.

This proves local runtime readiness and foundation contract behavior only. The foundation Builder
returned `READY_FOR_VERIFICATION`; the first independent Verifier attempt was procedurally `BLOCKED`,
and the corrected `RS-WO-002-02` rerun returned `VERIFIED` against the unchanged source/runtime
identity with all assertion output kept inside the permitted boundary. This does not prove the
tenant/agent product flow, browser usability, deployment, WebMCP, or Cloud Receiver integration.
