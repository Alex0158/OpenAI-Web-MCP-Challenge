# RightSpot — Current Status

**Role:** Canonical current status for the RightSpot child application  
**As of:** 2026-09-03, Europe/London  
**Physical workspace:** `git worktree list --porcelain` currently reports only the canonical Main Worktree at
`/Users/alex/OpenAI-WebMCP/WebMCP_Challenge` on `main`. The stopped `RS-WO-020-02` and
`RS-WO-020-03` candidate snapshots were adopted into Main and their short-lived physical Worktrees were
retired after exact-path review. Historical candidate snapshots are retained only in their owning Task Files
and, where applicable, the local-only archive refs
`refs/archive/rightspot/rs-wo-015-01-builder`, `refs/archive/rightspot/rs-wo-016-01-regate`, and
`refs/archive/rightspot/rs-wo-017-03-regate`; these refs are evidence/recovery records, not product
source or active execution surfaces. Worktree removal does not remove task records or branch refs.
**Stage:** Accepted ordinary local MVP implemented and closed; runnable foundation, workflow-core, the
`RS-WO-002-04` persistence/application boundary, the `RS-WO-002-05` tenant entry/listing discovery
API, and the `RS-WO-002-07` workflow HTTP/DTO boundary independently verified;
`RS-WO-002-06` Architecture Advisor reviewed and incorporated with revisions; ADR-RS-0008 accepted;
`RS-WO-002-08` shared shell is integrated at product commit `006d2fd` after process re-baseline commit
`8b77bdd`; `RS-WO-002-09` UI/UX review is integrated as bounded guidance; `RS-WO-002-10` Architecture
Advisor decomposition is accepted; `RS-WO-002-11` candidate `f1f83c7` passed independent verification
and is integrated at product commit `6a0b4b8`; `RS-WO-002-13` agent role-page candidate passed
independent verification and is integrated at product commit `3765747`; `RS-WO-002-12` tenant role-page
candidate `52cba87c` passed final independent verification and is integrated at product commit `9348aa5`;
`RS-WO-002-14` direct cross-role verification and the isolated `RS-WO-002-15` browser walkthrough passed
against the integrated source with full direct, built-server HTTP, and browser evidence. `RIGHTSPOT-002`
is closed for the accepted local MVP. Its verifier Worktrees also exposed an out-of-scope tracked
tooling mutation preserved as procedure evidence. The Field Desk shared CSS, tenant surfaces, and
agent surfaces have since passed their respective independent verification gates and are integrated
at product commits `89a50c7`, `5abdaf3`, and `a2f6a19`; integrated regression passed at frozen source
`4f8a1be`, so `RIGHTSPOT-007` is closed within its accepted behavior-preserving scope.
**Post-commit audit checkpoint (2026-09-02):** The canonical Main Worktree remains the only RightSpot
product source authority and is synchronized with `origin/main`; each audit checkpoint recaptures the
exact current Git identity. No additional RightSpot Worktree is present. The current local server still
reports healthy at `/api/health`. A fresh rendered route/role sweep covered the signed-out root, Tenant
catalogue, Favourites, Viewing Requests, listing detail, wrong-role Agent access, and the valid Agent
queue/listing-interest surface without workflow-fixture mutation or browser errors. No new
`VERIFIED_INCOMPLETE`, `VERIFIED_DEFECT`, `VERIFIED_POLISH`, or `DOCUMENTATION_DRIFT` finding was accepted.
**Last independently verified executable product-source baseline (2026-09-03):** ordinary Tenant Discovery Search and its
thin page-bound WebMCP adapter are integrated at product code commit
`ec7a67917c1df5a54b6187e6cf6ac80a7c2acbd7`. The exact five-path adapter checkpoint passed `171/171`,
typecheck, production build, repository validators, sensitive scan, local health, staged diff check,
and bounded browser smoke. RightSpot tracked source remains clean; the known untracked boundary
artifacts remain preserved and are not product source changes.

The latest visual-only revalidation used isolated session `rightspot-visual-20260902` against the
unchanged product source baseline represented by `898fea2` (current repository HEAD was the docs-only
`1d8e593`). Root, Tenant catalogue, and Agent queue rendered with the accepted visual system at desktop
and `375x812`; Tenant navigation exposed Browse rentals, Favourites, and My request, the three seeded
listing entries and Favourite controls were reachable, and Agent queue/history plus Listing interest
were reachable. The narrow render measured equal `375px` body/document widths and the browser log had
only normal React DevTools/HMR information. No fixture or product source changed, and no new finding or
Task was accepted.
**Latest route/action revalidation (2026-09-02):** An isolated Tenant/Agent session rechecked the
signed-in catalogue, empty Favourite and Viewing Request handoffs, listing-detail entry, filter no-result
and Clear recovery, sign-out recovery, and direct wrong-role Agent surfaces. The Agent empty queue and
listing-interest projection remained reachable and bounded. The page route matrix returned `200`, the
unauthenticated API matrix returned `401`, `/api/health` returned the healthy RightSpot payload, and the
browser reported no errors. Full tests remained `159/159` and typecheck passed; no new finding or Task
was accepted.
The follow-up semantic check confirmed that each request time is one native `datetime-local` field
labelled by its visible `Option 1`, `Option 2`, or `Option 3` wrapper. Chrome's accessibility tree may
expand that native field into `Day`, `Month`, and similar sub-controls; those are platform internals,
not duplicate authored labels or a new accessibility defect.
The follow-up keyboard pass also confirmed first-Tab skip-link entry on Tenant and Agent surfaces,
main-content continuation after activation, ordered Tenant editor controls, and a non-exposed disabled
submit action until the draft is eligible. The Agent queue remained free of a product focus trap; the
browser reported no errors.
The subsequent API/projection check confirmed Tenant responses expose only tenant-safe listing,
Favourite, and request fields, while Agent responses expose only queue counts and assigned-listing
aggregates. Missing Agent requests returned bounded `404` and cross-role reads returned bounded `403`;
no actor-private fields, internal notes, or workflow ledger fields were exposed.
The subsequent populated proposal/confirmation replay used disposable generation `86`: the
authoritative request advanced through draft, submission, review, preparation, sent proposal, and
tenant confirmation (`v1 → v7`). Tenant rendered the selected `4 Sept 2026, 15:00–15:30` slot and
retained it after reload without decision controls; Agent rendered the confirmed history and a
read-only detail without the Agent-only review note. The documented reset restored an empty request
and Favourite projection at generation `87`.
**Latest Search contract checkpoint (2026-09-02):** Main inspected the Tenant Discovery Search UI,
listing application/API boundary, seeded catalogue, business-flow contract, and live filter behavior
after the owner selected Tenant Discovery Search as the first WebMCP direction. The existing four
filters, tenant-only read boundary, published-only projection, no-results state, and stale-response
guard remain operational under their current semantics. A new P2 UX/contract gap `F-21` is registered
as `RIGHTSPOT-042`: the Area control presents an unseeded `Shoreditch` example while the authoritative
read applies undiscoverable exact Area equality, and the `Available by`/`availableFrom` date semantics
need explicit wording for a future tool. No source, fixture, dependency, route, WebMCP registration,
or implementation Worktree changed; the task is a pending Main-owned contract gate.
**Accepted Area direction (2026-09-03):** [ADR-RS-0014](Decisions/ADR-RS-0014-area-search-semantics.md)
now defines Area as a canonical structured facet. Partial input is limited to bounded deterministic
suggestion discovery; the applied filter uses a selected canonical `listing.area` value after shared
trim and case-insensitive normalization. Unknown or unselected values receive bounded validation,
selected values with no published matches remain explicit empty results, and no fuzzy, alias, or full-
catalogue fallback is allowed. The ordinary Search implementation now follows this direction at
product code commit `534f5c9`; the thin WebMCP adapter source is integrated at `ec7a679`, and the
bounded supported-browser registration/invocation gate is independently verified in `RIGHTSPOT-043`.
**Accepted Search contract (2026-09-03):** [ADR-RS-0015](Decisions/ADR-RS-0015-tenant-search-and-webmcp-contract.md)
freezes the first slice at the four optional criteria `area`, `maxRent`, `minSizeSqM`, and public
`availableBy` (mapped to the compatibility `availableFrom` field). Criteria are ANDed with inclusive
rent/size/date comparisons; published results retain deterministic source order; the bounded local
catalogue is returned in full without caller pagination or silent truncation. The logical result
includes the evaluated fixture generation, normalized filters, matched count, tenant-safe listings,
`/tenant` page identity, and `results`/`empty` state. Invalid, unknown-area, unavailable, malformed,
superseded, signed-out, and wrong-role outcomes are bounded; empty results never fall back to all
listings. This is a contract decision, not an implementation or WebMCP registration claim.
**Integrated implementation checkpoint (2026-09-03):** `RS-WO-043-01` ordinary Search is integrated
at `534f5c9`, and `RS-WO-043-02`'s amended five-path page-bound adapter handoff is integrated in the
canonical Main Worktree at product code commit
`ec7a67917c1df5a54b6187e6cf6ac80a7c2acbd7` with Node `24.20.0`. Main reviewed the exact path boundary,
the optional `AbortSignal` transport seam, bounded input/result/error handling, page/session lifecycle,
  and the ordinary manual fallback. The current in-app browser/Luna bridge still does not expose
  WebMCP site tools under this model and is not used as success evidence. The final supported-browser
  verifier observed registration, invocation, teardown, privacy/no-mutation, and browser evidence in
  Chrome `152.0.7977.65` with agent-browser `0.25.3` and `--enable-features=WebMCPTesting`. Five
  pre-existing untracked RightSpot boundary artifacts remain preserved.
**Latest Operations closure checkpoint (2026-09-03):** `RIGHTSPOT-044` is `CLOSED_VERIFIED` at the
declared local manual-surface claim level. `RS-WO-044-01` added the strict Agent-only
`GET /api/agent/operations` consumer over the existing Operations authority/projection; `RS-WO-044-02`
added `/agent/operations` and the Agent-only navigation entry; and independent `RS-WO-044-03` verified
both query families, role/privacy boundaries, exact filters/counts, London date semantics, valid empty
results, bounded failures/recovery, relay non-mutation, request drill-down, keyboard/skip-link access,
and `320px`/`768px`/desktop no-overflow against frozen source `f884879`. The code is integrated at
`9ed906b`; closure documentation is at `dd8ee4d`; the complete suite passes `184/184`, with typecheck,
build, repository validators, sensitive scan, and diff checks passing. The build's existing dynamic
SQLite filesystem-tracing warning remains a deployment residual. The verifier recorded the pre-existing
shell `favicon.ico` 404 and expected signed-out session 401 as raw network events; prior navigation
Tasks classify these as out-of-scope residuals, not Operations page exceptions. No WebMCP Operations
registration, external authentication, Cloud Receiver, deployment, WebRTC, Redis, or production claim
is made.
**Latest post-044 audit checkpoint (2026-09-03):** The read-only Main-thread audit confirmed that the
044 API, role/privacy, projection, London date boundary, empty/error/retry, route/navigation,
responsive, and accessibility evidence remains valid. It also classified `F-22` as a new P2
`VERIFIED_DEFECT`: the Operations page consumer has no latest-read sequence, query identity, or abort
guard, so an older success/error/`finally` callback can overwrite or finish a newer logical read after
report switching or overlapping requests. The audit did not reproduce the race in a controlled browser
run, so this is a high-confidence static finding, not a new browser claim. `RIGHTSPOT-045` is now
registered as the bounded consumer-only repair. `RS-WO-045-01` is now integrated and pushed at product
commit `3582ba4` after Main exact-path review, focused `8/8`, complete `186/186`, typecheck, build,
repository, sensitive-scan, and diff gates. Independent integrated verification is the next gate; no
browser-controlled race claim is made yet. The repair does not block `RIGHTSPOT-012`, reopen
`RIGHTSPOT-044`, or change any API/domain/projection/WebMCP contract. The existing shell `favicon.ico`
404 and expected signed-out session `401` remain documented residuals and are unrelated.
**`RIGHTSPOT-045` verifier re-gate (2026-09-03):** The first independent verifier attempt stopped
procedurally before testing because Main moved the Git ref from `adfa131` to docs-inclusive commit
`8c700be` for a docs-only `RIGHTSPOT-012` writeback after the T3 freeze had started. The product
repair source remained unchanged at `3582ba4`; no browser/API check or product-defect claim was made.
This is recorded as a process/ownership incident, not a repair failure. The same verification gate is
re-frozen at `8c700be`, with no further Git-ref movement permitted during T3.
**Latest `RIGHTSPOT-045` closure checkpoint (2026-09-03):** Main completed a controlled page-local
browser race check against product source `3582ba4`: a newer listing result remained authoritative
when an older upcoming response resolved later, and a newer listing success remained authoritative
when an older read rejected afterward. Both real Operations query families, signed-out/wrong-role
gates, `320px`/`768px`/desktop no-overflow, meaningful route content, and no browser error overlay or
page errors also passed. The pinned complete suite remains `186/186`, with typecheck, production
build, repository validators, sensitive scan, and diff checks passing. The independent verifier helper
was shutdown after a non-terminating browser retry, so its lack of response is recorded as an explicit
harness limitation rather than an independent pass. Existing independent `RIGHTSPOT-044` evidence
remains valid because 045 changed only the consumer async lifecycle. `RIGHTSPOT-045` is now
`CLOSED_VERIFIED` within this bounded manual Operations consumer boundary.
**Latest `RIGHTSPOT-012` chain-audit checkpoint (2026-09-03):** Read-only Advisor Helmholtz reviewed
the human `/` → Tenant catalogue/detail/request → Agent queue/detail/review/prepare/send → Tenant
response chain against Main `21bed15` (product source remains `3582ba4`). Route/role entry, authoritative
version use, DTO privacy, bounded failure/recovery, and wrong-role boundaries remained coherent. The
Advisor's focused UI/projection checks passed `36/36`, pure-domain workflow checks passed `18/18`, all
six page routes returned `200`, unauthenticated/wrong-role/missing-resource API probes returned bounded
`401`/`403`/`404`, health remained `200`, and the SQLite file hash/mtime did not change. No P0/P1/P2
defect or follow-on Task was reproduced or registered. Because this pass intentionally avoided fixture
mutation and populated browser actions, it adds no new rendered happy-path claim; that evidence gap is
explicitly retained. `RIGHTSPOT-012` remains the active pending audit lane.
**Latest Operations WebMCP contract checkpoint (2026-09-03):** The accepted Operations authority,
pure projection, Agent-only manual surface, and manual latest-read repair are complete through
`RIGHTSPOT-013`, `RIGHTSPOT-015`, `RIGHTSPOT-016`, `RIGHTSPOT-044`, and `RIGHTSPOT-045`. Independent
review of [`RIGHTSPOT-046`](Tasks/RIGHTSPOT-046-define-agent-operations-webmcp-listing-pipeline-contract.md)
identified and Main resolved gaps in static metadata/schema, privacy allowlisting, page parity,
stale/error outcomes, assignment semantics, and source identity. [ADR-RS-0017](Decisions/ADR-RS-0017-agent-operations-webmcp-listing-pipeline-contract.md)
now accepts one bounded Agent-only, page-bound, read-only `read_listing_pipeline` contract. No manual
Operations behavior changed; `RIGHTSPOT-047` recaptured browser capability, cleanup semantics, and
source identity, then dispatched its single Builder Work Order `RS-WO-047-01`. The five-path candidate
is implemented and frozen at local candidate commit `09d0628`; Main's docs-only gate commit is
`b8324f1`. Deterministic checks and Main-controlled browser smoke pass, but the independent browser
gate has one command-level harness block and two bounded partial retries, so `RIGHTSPOT-047` remains
open at `INDEPENDENT_BROWSER_INCOMPLETE` and is now paused pending the shared session-lifecycle repair
in `RIGHTSPOT-048`; the original candidate must be re-baselined after that repair.
`upcomingViewings` remains excluded because its `asOf`/fixture-clock behavior needs deterministic
reproducible non-empty evidence. The active `RIGHTSPOT-012` audit remains non-blocking.
**Latest Main-controlled Search/route revalidation (2026-09-03):** In supported Chrome session
`rs-main-audit-20260903`, a real pointer click on the rendered `Southwark` Area suggestion populated
the controlled field and Apply returned exactly the single matching `Riverside Studio` listing. The
suspected Area defect was an automation interaction artifact and no Search Task was registered. The
same session rendered Tenant catalogue/Favourites/Viewing Requests/listing detail, sign-out recovery,
Agent queue, and `/agent/operations` with expected role navigation and no application/page errors; it
did not mutate the fixture or add a populated workflow claim. RightSpot Main remains the single local
canonical Worktree, ahead of `origin/main` while the `RIGHTSPOT-047` independent browser gate remains
incomplete, so no push or WebMCP closure claim is made.
**Latest shared session-lifecycle checkpoint (2026-09-03):** The Contract Advisor and Main source
review confirmed the mount-only lifecycle gap described in ADR-RS-0018. `RIGHTSPOT-048` now has a
reviewed eight-path candidate integrated at product commit `218935c`: focus/visible-session
revalidation, actor-id keyed child teardown, and adapter-side authentication deactivation are covered
by the new tests. Main independently reran focused `35/35`, complete `215/215`, typecheck, production
build, repository validation, sensitive scan, and diff checks. No server/API/fixture behavior changed;
the supported-browser lifecycle gate remains open. `RIGHTSPOT-047` is paused and must be re-baselined
after the `048` gate.
**Working product:** RightSpot — rental workflow / Rental Marketplace Relay
**Current next product action:** `RS-WO-048-02` is in its one corrected bounded retry, not product-failed:
two earlier attempts produced no browser evidence, and Main has validated the installed CLI form
`--args "--enable-features=WebMCPTesting"`. Monitor fresh session
`rs-wo-048-02-verifier-3-20260903` against frozen candidate `218935c`; do not modify the frozen eight
source/test paths. If this retry cannot load and capture the bounded evidence matrix, record the
external harness limitation and stop blind retries. After a valid 048 evidence decision, re-baseline `RIGHTSPOT-047` and resume only the
missing independent Operations WebMCP evidence. Do not run the old 047 verifier target or push/claim
WebMCP closure before both gates are complete. In parallel, `RIGHTSPOT-012`
remains a non-blocking
read-only audit lane. `RIGHTSPOT-045` is `CLOSED_VERIFIED` within its manual Operations consumer
latest-read boundary at product source `3582ba4`; it does not reopen `RIGHTSPOT-044` or change the
Operations API, domain, projection, fixture, role/privacy, navigation, or WebMCP boundary.
`RIGHTSPOT-006` remains credential-gated. The existing Tenant Discovery/WebMCP slice remains
`RIGHTSPOT-043` `CLOSED_VERIFIED` in its declared local supported-browser capability. No production,
universal browser, judge, or probabilistic agent success claim is made.
`RIGHTSPOT-010` is closed as a reviewed staged Agent Operations decision through `ADR-RS-0016`.
The Operations authority and pure projection are already implemented through `RIGHTSPOT-013`,
`RIGHTSPOT-015`, and `RIGHTSPOT-016`; the manual `/agent/operations` page and
`GET /api/agent/operations` consumer are implemented and independently verified through
`RIGHTSPOT-044`. The Main-thread continuous cross-layer audit Goal is active
for the accepted ordinary local MVP; `RIGHTSPOT-039` /
`RS-WO-039-01`, the listing-detail partial-read error-boundary repair, is also closed. `RIGHTSPOT-033` /
`RS-WO-033-01`,
`RIGHTSPOT-034` / `RS-WO-034-01`, `RIGHTSPOT-035` / `RS-WO-035-01`, `RIGHTSPOT-036` /
`RS-WO-036-01`, `RIGHTSPOT-037` / `RS-WO-037-01`, and `RIGHTSPOT-038` / `RS-WO-038-01` are now closed within their
UI-only scopes.
The fresh isolated proposal reproduction showed that the agent selected `slot-primary-2` for
`4 September 2026, 15:00–15:30` Europe/London while the tenant page showed only the tenant's different
preferred time and an opaque slot reference. `RIGHTSPOT-032` now resolves and renders the authoritative
selected time and retains it in terminal history without reopening action/deadline controls. The earlier continuation found no new business-flow blocker and
completed fresh local browser evidence for both decline branches (`RS-FLOW-11` and `RS-FLOW-13`); a
subsequent isolated stale-submit replay reproduced and closed `F-09` through `RIGHTSPOT-031` on both
tenant request surfaces. The earlier audit had registered
`RIGHTSPOT-029` for the
verification-contract gap where the default `npm test` command executed only foundation tests `6/6`
while the complete authored suite passed `133/133` across 28 test files. That Task is now `CLOSED_VERIFIED`: `npm test` runs the
complete suite and `npm run test:foundation` names the fast foundation check. The current suite,
including the `RIGHTSPOT-030`, `RIGHTSPOT-031`, `RIGHTSPOT-032`, `RIGHTSPOT-033`, `RIGHTSPOT-034`,
`RIGHTSPOT-035`, `RIGHTSPOT-036`, `RIGHTSPOT-037`, `RIGHTSPOT-038`, `RIGHTSPOT-039`, and
`RIGHTSPOT-040` and `RIGHTSPOT-041` regressions, passes `159/159` across 39 test files. `RIGHTSPOT-040` is
`CLOSED_VERIFIED` within its Discovery consumer boundary.
`F-06` remains closed
through `RIGHTSPOT-028`: the documented `npm run db:reset` command now composes the authoritative
workflow reset, and `RS-WO-028-01` passed Main Red→Green checks, frozen-source independent
verification, and documentation reconciliation at product commit `b2c1682a`. No supporting
implementation Worktree is open. `RIGHTSPOT-023`, `RIGHTSPOT-024`, `RIGHTSPOT-025`, `RIGHTSPOT-026`,
`RIGHTSPOT-027`, `RIGHTSPOT-028`, `RIGHTSPOT-029`, `RIGHTSPOT-031`, `RIGHTSPOT-032`, `RIGHTSPOT-033`,
`RIGHTSPOT-034`, `RIGHTSPOT-035`, `RIGHTSPOT-036`, `RIGHTSPOT-037`, and `RIGHTSPOT-038` remain closed within their bounded outcomes
after applicable TDD, independent verification, browser/build evidence, and documentation
reconciliation. The dashboard portion of `F-08` is now `CLOSED_VERIFIED` through
`RIGHTSPOT-030`: latest-read sequencing, mutation-result invalidation, and the full Refresh overlap
gate passed focused/full tests, typecheck/build, independent source review, and both isolated browser
race reruns. The separate `tenant-listing-page.tsx` dynamic-route overlap remains an `EVIDENCE_GAP`
and is not included in that repair. The canonical business-flow and scenario
baseline is
[`07-business-flows-and-scenarios.md`](07-business-flows-and-scenarios.md). The only product source
authority remains the canonical Main Worktree. The fresh Main-thread route, role, and responsive audit
also reran `npm test` at `137/137`, foundation `6/6`, typecheck, health, signed-out/wrong-role guards,
and 320px overflow checks without reproducing a defect within that route/role/responsive scope. A
subsequent controlled proposal-response comparison reproduced `F-10` and registered `RIGHTSPOT-032`:
the tenant could not see the agent-selected viewing time when it differed from tenant preferences.
The separate listing-detail dynamic-route concern remains an evidence gap because the current anchor
navigation did not provide a valid same-document delayed-read reproduction. The fresh post-`032` audit
also reproduced `F-11`: the Agent dashboard mixed a confirmed terminal request into a section labelled
as human-response work while omitting several terminal state counts. `RIGHTSPOT-033` closed this as a
P2 UI-consumer repair: active and terminal requests/counts are now explicit, terminal links are
non-action-labelled, and no API, workflow, persistence, privacy, or dependency change was made.
The subsequent cross-listing audit reproduced a P2 tenant presentation defect: the listing-detail
notice called both a private `TENANT_DRAFT` and terminal request active. `RIGHTSPOT-034` closed the
copy-only state grouping with focused TDD, full checks, and fresh draft/terminal/same-listing browser
evidence; no workflow, API, persistence, privacy, or route behavior changed.
The next Main-thread audit reproduced `F-13`: repeated preferred-time removal controls had the same
accessible name. `RIGHTSPOT-035` closed this P2 tenant-editor accessibility defect with a component-only
option-numbered `aria-label`, focused TDD, full checks, and isolated browser evidence; no request
workflow, API, persistence, CSS, or navigation behavior changed.
The subsequent Main-thread audit reproduced `F-14`: after an invalid reverse-ordered time set was
corrected by removing the offending row, the editor retained stale validation feedback. `RIGHTSPOT-036`
closed this P2 local-feedback defect with a removal-handler-only repair, focused TDD, full checks, and
isolated browser evidence; validation rules, dirty tracking, and the server boundary remain unchanged.
The next populated Agent read audit reproduced `F-15`: after a successful queue or request-detail read,
a failed refresh left retained counts, facts, and (on detail) `Start review` visible alongside the error.
`RIGHTSPOT-037` closed this P2 latest-read truthfulness defect with two local render guards, focused
TDD, full checks, and isolated queue/detail failure-and-retry browser evidence; the Agent API, request
workflow, role/privacy boundary, and server state remain unchanged.
The subsequent Agent action-conflict audit reproduced `F-16`: after a competing review advanced the
request and the original action returned `409`, a successful recovery read was hidden behind the old
error/unavailable branch. `RIGHTSPOT-038` is now `CLOSED_VERIFIED`; its local consumer-only repair
renders the authoritative recovered detail beside neutral conflict feedback and remains fail-closed
when recovery fails. Focused Red→Green, full `153/153` tests across 37 files, typecheck, build,
validators, sensitive scan, docs validation, fresh isolated browser success/failure evidence, 320px,
keyboard, and no-page-error checks passed. No Agent API, workflow, persistence, role/privacy, or
shared-contract behavior changed.
The following listing-detail partial-read audit reproduced `F-17`: a failed tenant Viewing Request
context read was presented as listing details being unavailable even though the listing read
succeeded. `RIGHTSPOT-039` / `RS-WO-039-01` is now `CLOSED_VERIFIED` after a Main-owned serial repair
that preserves listing facts, withholds request-derived UI while request data is unavailable, and
offers a request-context-specific retry. Focused Red→Green, full `156/156` tests across 38 files,
foundation, typecheck, build, validators, docs validation, fresh isolated browser failure/recovery,
listing-only failure, 320px, keyboard, and no-page-error checks passed. No API, workflow, persistence,
role/privacy, dependency, CSS, or F-08 behavior changed.
The subsequent fresh Main-thread cross-layer replay completed the Favourite round-trip and then
reproduced `F-18`: a controlled catalogue read failure exposed raw server-controlled text in the tenant
Discovery page alongside the bounded error copy. `RIGHTSPOT-040` / `RS-WO-040-01` then closed as a
Main-owned serial consumer repair: local validation has explicit ownership, catalogue failure copy is
bounded and rendered once, and the adapter/server/filter contracts are unchanged. Focused Red→Green,
full checks, and fresh isolated browser failure/recovery evidence passed, including keyboard retry and
clear recovery, invalid-filter feedback without a catalogue request, and the `320px` no-overflow floor.
The Favourite round-trip saved `Canal Wharf Apartment`, showed one authoritative saved card, removed it,
and returned to the explicit no-saved-homes state. A subsequent clean post-`040` replay completed the
tenant-to-Agent submit → review → prepare → send → confirm chain and verified terminal/read-only and
wrong-role/signed-out boundaries without a new finding. The disposable fixture was reset to generation
`67` and `/api/health` remained healthy; `F-08` remains an evidence gap. The next focused audit then
reproduced `F-19`: a successful tenant draft save returned `200` and updated authoritative state, but
the version-keyed request editor lost its local completion message during rehydration. `RIGHTSPOT-041`
closed as one Main-owned serial UI Work Order covering parent-owned draft-save and explicit-submit
feedback in the request dashboard and listing detail; focused TDD, full checks, and isolated browser
save/submit/conflict evidence passed, with no extra Worktree opened. The fixture was reset to generation
`70` and health remained healthy. A subsequent fresh post-`041` replay used generation `72` and
completed tenant draft/save/submit, Agent review/prepare/send, tenant confirmation, Agent terminal
history, wrong-role, 320px, keyboard, and browser-error checks without a new finding. The fixture was
reset to generation `73` and `/api/health` remained healthy. `F-08` remains an evidence gap because
the supported catalogue links are full-document navigations and no valid ordinary same-document
delayed-read reproduction exists.
The subsequent `RS-FLOW-04` Favourite recheck at generation `73` saved, reloaded, removed, and
re-saved `Canal Wharf Apartment`; relation versions advanced `1 → 2 → 3`, the tenant request remained
null, and the assigned Agent received only listing-level `currentSaves`/`availableInterest` aggregates.
The Favourite route also passed the `320px` no-overflow and first-Tab skip-link checks. No new finding
was reproduced; the fixture was reset to generation `74` and `/api/health` remained healthy.
The follow-up populated `RS-FLOW-16` Agent projection audit used generation `74`: after a tenant save,
the Agent rendered all three assigned listings with `1/1` for the primary listing and `0/0` for the
other two, kept Listing interest separate from the empty request queue, and exposed no tenant/private
fields. The populated surface passed the `320px` no-overflow, first-Tab skip-link, and browser-error
checks. No new finding was reproduced; the fixture was reset to generation `75` and health remained
healthy.
The subsequent Tenant visual/entry review at generation `75` checked the rendered catalogue, listing
detail, and empty request dashboard at desktop, with the existing `320px` Favourite/Agent evidence as
the narrow-viewport cross-check. Navigation, CTAs, empty handoff, readability, and browser-error
boundaries remained truthful; no new finding was reproduced. The fixture was reset to generation `76`
and health remained healthy.
The following Agent Listing-interest failure/retry audit used generation `76`: a controlled `503`
produced one bounded error surface without raw server text or stale counts, while the Request queue
remained visible; restoring the read and using Retry returned the authoritative projection. The `320px`
no-overflow and browser-error checks passed. No new finding was reproduced; the fixture was reset to
generation `77` and health remained healthy.
The immediate F-08 boundary re-check then followed the real catalogue anchors through
`listing-primary`, back to the catalogue, and `listing-north`. Each transition was a full-document
`navigate` with the expected referrer, the final Northfield detail rendered the correct listing
identity, and no browser error or fixture mutation occurred. This strengthens the evidence for the
supported path but keeps the hypothetical future router-reuse concern as `F-08`/`EVIDENCE_GAP`; no
speculative repair Task was registered. Health remained `{"ok":true,"service":"rightspot"}`.
The fresh end-to-end replay at generation `78` then completed the rendered Tenant draft/save/submit,
Agent review/prepare/send, Tenant proposal/confirm, reload persistence, and Agent terminal-history
chain. Authoritative versions progressed `1 → 6`, selected time remained tenant-safe, terminal actions
were removed, and no browser error or fixture mutation occurred. No new defect or Task was registered;
the fixture was reset to generation `79` and health remained healthy.
The following role/session boundary re-check used isolated session `rightspot-audit-082`: signed-out
root entry, Tenant and Agent workspaces, direct wrong-role routes, sign-out recovery, unknown listing,
and Tenant access to Agent request detail all showed bounded, privacy-safe surfaces with no browser
errors or fixture mutation. Valid-session navigation remained limited to the actor's own workspace;
no new defect or Task was registered. Health remained healthy after the session closed.
The alternate Agent-decline replay at generation `80` then passed Tenant submit, Agent
review/prepare/decline/send, Tenant terminal/reload, and Agent history/read-only boundaries. The
authoritative state became `AGENT_DECLINED` at version `5`, with bounded tenant response and no
decision actions after terminal state. No browser error or fixture mutation occurred; the fixture was
reset to generation `81` and health remained healthy.
The subsequent rendered route-entry sweep used isolated session `rightspot-audit-085` at generation
`81`: Root role entry, Tenant navigation and listing anchors, all Tenant empty/detail routes, Agent
queue/interest controls, and Agent missing-request recovery were present and bounded. At `320px`, all
checked routes stayed within the viewport; Tenant and Agent first-Tab skip-link entry passed, listing
images loaded, browser errors were empty, and the fixture was not mutated. No new defect or Task was
registered; the session was closed and health remained healthy.
The next rendered proposal-to-tenant-decline replay used isolated session `rightspot-audit-086` at
generation `81`: Tenant submit, Agent review/prepare/send, Tenant proposal/decline, reload persistence,
and Agent terminal-history boundaries passed. Versions progressed `1 → 6`, the selected slot was
released after the decline, browser errors were empty, and the fixture was reset to generation `82`;
health remained healthy. No new defect or Task was registered.
The subsequent current-status reconciliation found stale adjacent Task/ADR wording that treated the
closed `RIGHTSPOT-020` Favourite implementation as absent or unresolved. Main corrected only those
current dependency/evidence statements, retained historical dispatch narrative, confirmed that
`RIGHTSPOT-009` Information Request remains deferred, and registered no new Task. No source or runtime
behavior changed.
The immediate post-`RIGHTSPOT-038` route/role/fallback recheck at generation `55` passed tenant
catalogue/filter/detail, tenant empty request/Favourite states, wrong-role and missing-resource
boundaries, Agent empty queue/listing-interest entry, exact reviewed media readiness, `320px` no-overflow,
keyboard entry, and an empty browser page-error log. No new defect or Task was registered; `F-08`
remains an evidence gap because no valid same-document delayed-read reproduction exists. The fixture was
reset to generation `56` and health remained OK. The next route is another fresh Main-thread audit.
The clean post-037 route/role/responsive checkpoint at reset generation `46` re-confirmed signed-out
role entry, tenant Browse rentals/Favourites/My request/listing detail, agent Request queue/listing
interest, truthful empty states, the `320px` width floor, keyboard entry, and an empty browser error
log. No new defect was reproduced and no new Task was registered; the separate listing-detail dynamic-
route `F-08` concern remains an evidence gap.
The controlled follow-up `F-08` read-order probe delayed `listing-primary` by `450ms` while immediately
navigating to `listing-north`; the final URL and rendered listing facts correctly resolved to Northfield
Garden Flat with no browser errors. This synthetic client-navigation probe did not close the evidence
gap or authorize a speculative repair; the fixture was reset to generation `47` and health remained OK.
The subsequent Favourite persistence and aggregate-boundary re-check at generation `48` completed the
supported save → Favourite-list reload → remove → reload → re-save path. The assigned Agent saw only
listing-level `Current saves: 1` and `Available interest: 1`; no tenant/private data crossed the
projection boundary, and the `320px` width and browser-error checks passed. The unpublished branch
remains direct/static-only because the bounded MVP exposes no user-facing admin action to produce an
unpublished listing; no hidden endpoint or fixture mutation was used. No new Task was registered; the
fixture was reset to generation `49` and health remained OK. The next route remains a fresh Main-thread
cross-layer audit.
The post-036 fresh Main-thread audit then re-ran the local tenant-to-agent loop at reset generations `38`
and `39`: listing discovery, Favourite save/remove/empty state, draft/save/submit, agent review/prepare/
send, tenant selected-time projection/confirmation, agent active/history movement, wrong-role and
signed-out boundaries, and the `320px` floor all passed with an empty browser error log. No new bounded
workflow, API, persistence, projection, privacy, navigation, responsive, or runtime defect was
reproduced; the separate listing-detail dynamic-route `F-08` concern remains an evidence gap. A focused
follow-up confirmed that the ordinary catalogue-to-detail entry uses full document navigation, so no
valid same-document delayed-read reproduction was available; no speculative repair Task was opened.
The subsequent read-only Agent-surface audit at reset generation `39` confirmed truthful empty active
and terminal states, read-only listing-interest presentation, keyboard focus through the primary
controls, a `320px` no-overflow floor, and no application browser errors; it produced no new finding.
The subsequent Tenant-surface route audit confirmed catalogue entries, no-result filter recovery,
Favourite and Viewing Request empty-state entries, listing-detail editor availability, missing-listing
truthful failure, `320px` no-overflow, and an empty browser error log; it produced no new finding.
The Agent direct-request unavailable path was also rechecked: a missing request stayed visibly
unavailable, retry did not claim success, and Back to queue returned to `/agent`; no new finding was
registered.
The subsequent populated request-detail walkthrough at reset generation `40` verified the rendered
Agent Start review → prepare → explicit send path, tenant selected-time confirmation, and truthful
Agent terminal history; the fixture was reset to generation `41` and no new finding was registered.
**Current closure state:** `RS-WO-016-01` passed its bounded repair and fresh independent verification;
Main integrated the repaired exact two-path projection at product commit `edd7575`. `RS-WO-017-03`
passed persistent re-gate and independent verification and is integrated at product commit `2a53917`;
the persistent integrated browser gate `RS-WO-017-04` then returned `VERIFIED` against that commit.
`RIGHTSPOT-016` and `RIGHTSPOT-017` are therefore closed within their bounded outcomes. The original
transient 016/017 overlays and the failed 016 candidate are retained as historical process evidence in
their owning Task Files and, where applicable, the named local-only archive refs recorded there. Their
physical Worktrees have been removed and were never promoted to current source. No active product writer
remains in these lanes; Main owns the canonical document writeback and any future separately registered
consumer.
`RIGHTSPOT-015` remains closed with its Operations authority integrated at `e7f30d5`; `RS-WO-017-02` is
independently verified and integrated at `b7369bd`; `RS-WO-019-01` is independently verified, integrated
at `6f52686`, and closed after its bounded browser/form regression; and `RS-WO-018-01` is independently
verified, integrated at `5eef037`, and closed. These lanes have disjoint write sets.
`RIGHTSPOT-013` accepted the Operations authority decision and is closed, and `RIGHTSPOT-014` accepted
its media proposal and is closed. The reviewed media asset baseline is committed at `760b88f`.
`RIGHTSPOT-016` and `RIGHTSPOT-017` are closed within their bounded outcomes: the repaired Operations
projection is integrated at `edd7575` after fresh independent verification, and the tenant media consumer
is integrated at `2a53917` after independent verification plus the integrated browser gate `RS-WO-017-04`.
Neither lane authorizes a downstream transport, external service, WebMCP, Cloud Receiver, or broader
product claim.
`RIGHTSPOT-018` records two independently reproduced relay-domain defects in one serialized
shared-workflow Work Order and is closed; `RIGHTSPOT-019` records the integrated London-time UI
boundary repair and completed browser/form regression, and is closed.
`RIGHTSPOT-020` is closed within its accepted bounded outcome: the server-side `RS-WO-020-01` foundation
and `RS-WO-020-01R` tenant Favourite relation-version continuity repair are independently verified; both
UI candidates from `RS-WO-020-02` and `RS-WO-020-03` are adopted in Main with shared navigation at
product commit `c29e80d`, and Main typecheck, full suite `121/121`, and production build pass.
`RS-WO-020-04` independently verified the frozen Main source at `c977ea4`, and the fresh-reset browser
Verifier `RS-WO-020-05` returned `VERIFIED` against Main `f49e1ca`. The browser run confirmed the tenant
save/remove/reload/re-save Happy Path and agent listing-level aggregate projection with no tenant identity
or contact-like value exposed; its unavailable-listing branch remains direct/static-only because the current
UI has no supported visible unpublish action. Checkpoint-scoped Worktree retirement is complete, and no
deployment, external authentication, WebMCP, Cloud Receiver, Redis, WebRTC, or production-readiness claim
is implied.
The bounded Operations seam `RS-WO-011-01` passed independent verification and is integrated at
product commit `7ff0fbd`; its verifier evidence remains recorded in the owning Task File, and its
physical Worktree was removed during the documented cleanup.
`RS-WO-007-06`, `RS-WO-007-07`, and
`RS-WO-007-08`
independently verified the frozen tenant/agent candidates and the main thread integrated them at
`5abdaf3` and `a2f6a19`; their evidence remains recorded in the owning Task Files, and their physical
Worktrees were removed during the documented cleanup.
The shared CSS
foundation `RS-WO-007-02` is already `VERIFIED` and integrated at product commit `89a50c7` after its
final same-identity browser rerun corrected the stale served-build block under `RIGHTSPOT-007`;
Builder `01a05d75-0116-75e3-807d-a19c6669e659` (`Turing`, local multi-agent) changed only
`app/globals.css`, whose post-Builder SHA-256 is `bb85c353b3943b1267f361b3a4e677bc3e4ce7db09250984085471c7409a957c`.
Independent Verifier `01a05d82-ba0f-7963-9975-200e1fabb962` (`Hooke`) verified the corrected frozen
T2 candidate at `HEAD=89a50c7119c366728c5e4a4cfc022788ddf39f00`. Static checks, typecheck, foundation
tests, build, source identity, served CSS token evidence, responsive browser checks, focus, and
contrast passed; its residual risk is limited to an unassigned agent request-detail fixture.
The tenant Builder task/thread is `01a05db4-6e9d-7e51-8ee1-9b7c62cc31d0` on branch
`rightspot/rs-wo-007-04-tenant`, and the agent Builder task/thread is
`01a05db4-7764-7931-b474-ddbd977762ae` on branch `rightspot/rs-wo-007-05-agent`. The preceding
tenant Verifier is task/thread `01a05dd1-4e8c-7571-9f3a-5ca13f24e00e` using
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-007-06-tenant-verifier`, and the agent Verifier is
task/thread `01a05dd1-4604-7c23-a477-43caadae0ea8` using
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-007-07-agent-verifier`. The preceding
`RS-WO-005-01` navigation candidate was independently `VERIFIED` by
Verifier task `01a05d5d-d796-72f0-baad-ca00d8e7ab4e` and integrated at local product commit `27f5391`.
Verifier attempt 01 was procedurally `BLOCKED` after browser tooling added the tracked repository
metadata line `+.gstack/` to `.gitignore`; the candidate source hash was unchanged and the main thread
preserves that diff. Corrected attempt 02 used browser cwd `/var/tmp/rightspot-browser.65cSwB` and
returned `VERIFIED`. A duplicate supporting
task `01a05d58-0b9e-7e40-8093-befbe4723318` detected the already-dirty shared candidate and returned
`NEEDS_REVIEW` without source changes; it is not a second candidate. `RS-WO-003-01` and
`RS-WO-004-01` completed their read-only decision proposals in supporting tasks
`01a05d47-7fa6-74f1-9f74-fdb88f78c9aa` and `01a05d47-7766-7d43-9e0b-7e59d0e9f9cf` on host
`local`. `RS-WO-002-14` completed its
read-only direct cross-role verification and `RS-WO-002-15` completed the isolated browser walkthrough
against the integrated tenant and agent role pages at product commit `9348aa50b63e3f4f46e77238ad370670383d9d6d`; the closure record is
[`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md).

The current Main-thread audit is recorded in
[`RIGHTSPOT-CROSS-LAYER-AUDIT-2026-09-02.md`](Development/RIGHTSPOT-CROSS-LAYER-AUDIT-2026-09-02.md).
It registered and then closed `RIGHTSPOT-029` for the default test-command under-coverage. This was a
verification gate, not a product-runtime gate: the complete suite and the explicit foundation check
now both pass under the named commands. Its subsequent controlled isolated browser reproduction
confirmed the tenant request-dashboard portion of `F-08`; `RIGHTSPOT-030` then closed that bounded
repair with its historical `136/136` evidence. Only the separate listing-detail dynamic-route concern remains
an `EVIDENCE_GAP`; `RIGHTSPOT-031` is closed with current conflict-recovery evidence on both tenant
request surfaces. `RIGHTSPOT-032` is closed with current projection, parser, terminal-retention, and
browser evidence. The fresh follow-up audit reproduced `F-11`: the Agent dashboard mixed terminal
history into human-response work and omitted terminal state counts. `RIGHTSPOT-033` / `RS-WO-033-01` is
now `CLOSED_VERIFIED`; the current Agent dashboard separates active work from recorded outcomes and
shows all seven non-draft counts. `RIGHTSPOT-034` / `RS-WO-034-01` is also `CLOSED_VERIFIED`; its
cross-listing tenant notice distinguishes saved draft, active, and recorded request states.
`RIGHTSPOT-035` / `RS-WO-035-01` is `CLOSED_VERIFIED`; its repeated preferred-time removal controls
expose distinct option-numbered accessible names. At that closure checkpoint, the suite was `147/147`
across 34 test files and no implementation Worktree was open.
`RIGHTSPOT-036` / `RS-WO-036-01` is `CLOSED_VERIFIED`; its preferred-time row removal clears stale
local editor feedback without changing validation or request behavior. `RIGHTSPOT-037` /
`RS-WO-037-01` is `CLOSED_VERIFIED`; its Agent queue and request-detail consumers withhold retained
projections and actions while the latest read is loading or failed, while successful retry recovery
remains intact. `RIGHTSPOT-038` / `RS-WO-038-01` is also `CLOSED_VERIFIED`; its request-detail
consumer renders authoritative detail after a stale action conflict when recovery succeeds, while
remaining unavailable/retry when recovery fails. The current suite is `153/153` across 37 test files
and no implementation Worktree is open.
`RIGHTSPOT-005` is closed and integrated at local commit `27f5391`; its Builder changed only the
declared shared-shell write set and corrected independent verification returned `VERIFIED`. The
preserved `.gitignore` incident is procedure evidence, not a product defect.
The read-only UI decomposition Work Order `RS-WO-007-01` is complete in supporting task
`01a05d5f-cb85-7cf3-96b4-edf0f5891b6d` on host `local` and accepted with revisions; its next
single-file CSS Work Order `RS-WO-007-02` is verified and integrated at product commit `89a50c7`
against candidate commit `89a50c7119c366728c5e4a4cfc022788ddf39f00`; attempt 01 was
procedurally blocked when main-thread process commits moved the Git ref during verification. The
candidate hash was unchanged, the block was recorded, and corrected attempt 02 passed all static/build
checks but was blocked because the existing server served pre-candidate CSS. The candidate was then
captured in `89a50c7`, rebuilt, restarted, observed serving the expected tokens, and independently
verified through the browser. The verification freeze is now closed.
Repaired tenant candidate `52cba87c` passed final independent verification and is integrated at product
commit `9348aa5`. Its predecessor candidate `eb1d62e1b33a045e683f64ba3d28930e9444cd25` had
two verifier runs checkpoint-locally blocked by a tracked `.gitignore` mutation adding `.gstack/` outside
the exact nine-path candidate; the prior verifier evidence remains recorded in the owning Task File,
and the physical verifier Worktrees were removed during the documented cleanup.
The `RS-WO-002-13` agent candidate was independently verified and integrated at product commit `3765747`.
The parent Task File retains the exact historical Worktree paths and supporting-task identities; no
listed historical Worktree is an active source.
**Implementation:** Foundation Builder returned `READY_FOR_VERIFICATION`; the first `RS-WO-002-02` verification attempt was procedurally blocked by an out-of-scope OS temp artifact, then the corrected bounded rerun returned `VERIFIED` against the unchanged source/runtime identity; `RS-WO-002-03` found and repaired a listing-version guard defect in commit `6e70c9f`, and fresh independent verification returned `VERIFIED` against that frozen source; `RS-WO-002-04` candidate adoption completed at T2 commit `68bbc69`; its first dedicated Verifier attempt stopped before source checks because the dispatch prompt described the Worktree root incorrectly, then one corrected follow-up returned `VERIFIED` against frozen source `28105e4d`; `RS-WO-002-05` Builder returned `READY_FOR_VERIFICATION` with the required runtime, focused `35/35` checks, production build, and local API smoke passing; the candidate was integrated at T2 code commit `de169ce`, and a dedicated Verifier independently returned `VERIFIED` against clean snapshot `bc3bc42`; the read-only `RS-WO-002-06` Architecture Advisor returned `READY_FOR_REVIEW`, and the main thread accepted its decomposition with revisions in ADR-RS-0008; `RS-WO-002-07` candidate `d71fe3e` passed dedicated independent verification with foundation `6/6`, focused `9/9`, full direct `50/50`, build, HTTP, role/privacy, conflict, and no-mutation evidence and was integrated at product commit `f700ba9`; `RS-WO-002-08` is integrated at product commit `006d2fd` after a localized generated-output boundary incident was re-baselined in process commit `8b77bdd`; both originate from reviewed baseline `c758634`; `RS-WO-002-09` is integrated as bounded UI guidance; `RS-WO-002-11` Builder returned `READY_FOR_VERIFICATION`, its exact four-path candidate passed dedicated independent verification, and the main thread integrated it at product commit `6a0b4b8`; `RS-WO-002-13` passed dedicated independent verification and is integrated at `3765747`; repaired `RS-WO-002-12` candidate `52cba87c` passed final independent verification and is integrated at `9348aa5`; `RS-WO-002-14` passed direct read-only combined cross-role verification and `RS-WO-002-15` passed the isolated browser walkthrough; closure evidence is reconciled in `RIGHTSPOT-MVP-CLOSURE-RECORD.md`

**Latest role-page disposition:** `RS-WO-002-13` passed independent verification and was integrated
at product commit `3765747`. Repaired `RS-WO-002-12` candidate `52cba87c` passed final independent
verification and is integrated at product commit `9348aa5`; `RS-WO-002-14` then verified the integrated
cross-role HTTP path, privacy boundaries, mutation ordering, and bounded failures; `RS-WO-002-15` then
verified the same primary path through the browser UI. The original tracked
`.gitignore` mutation adding `.gstack/` outside the declared nine-path scope remains preserved for
separate ownership handling.
The parent `RIGHTSPOT-002` is `closed` for the accepted local MVP. ADR-RS-0009 accepts the bounded
Field Desk UI/UX direction and ADR-RS-0010 accepts Clerk as a gated external-auth candidate; neither
decision reopens the MVP or authorizes external credential setup. The Field Desk regression gate is
closed; the current implementation wave is the independently verifiable Operations projection slice
and tenant media consumer slice. The London-time browser/form regression is closed. The current
016/017 transient execution path and failed 016 candidate are historical process evidence only. Their
accepted outcomes are already integrated and closed; evidence is retained in the owning Task Files and
named local-only archive refs, while the physical candidate Worktrees have been removed. No candidate
re-gating or persistent worker lane is currently pending for these closed tasks.
The reviewed property-media asset baseline and Operations authority are complete and remain read-only
inputs to those consumer slices.

**Current cross-role gate:** `RS-WO-005-01` passed corrected independent verification and is integrated
at local commit `27f5391`; the known tracked metadata incident remains preserved. `RS-WO-007-02` is
verified and integrated at `89a50c7`; the tenant and agent role candidates were independently verified
and integrated at `5abdaf3` and `a2f6a19`; `RS-WO-007-08` independently verified the integrated
Field Desk source. `RIGHTSPOT-007` is closed; the accepted MVP cross-role gate remains closed:
`RS-WO-002-14` passed direct read-only verification of the integrated
tenant-to-agent HTTP Happy Path, including role privacy, mutation ordering, and bounded failures.
`RS-WO-002-15` passed the isolated browser walkthrough with no browser error or warning logs. The
implementation, browser evidence, and parent closure record are complete for the accepted local MVP.

The preserved tooling incident is not a product source defect and must not be fixed by reverting or
deleting `.gitignore` without an explicit ownership/recoverability decision. It no longer pauses the
closed `RS-WO-005-01` checkpoint; it remains procedure evidence and is outside the `RS-WO-007-02`
write set.

**Completed refinement history:** `RIGHTSPOT-007`'s Architecture/UI Advisor proposal is accepted
with revisions and the Field Desk implementation is closed. `RS-WO-007-02` passed static/build and
final browser verification and is integrated at product commit `89a50c7`; its rebuilt served runtime
shows the candidate tokens. `RS-WO-007-04` and `RS-WO-007-05` were frozen as clean candidate commits
`63e4c3e` and `33a36f0`, independently verified by `RS-WO-007-06` and `RS-WO-007-07`, and integrated
at product commits `5abdaf3` and `a2f6a19`; `RS-WO-007-08` independently verified the integrated
source. A separate,
non-blocking `RS-WO-007-03` parallelism review returned `READY_FOR_REVIEW` from supporting worker
`01a05d76-dac9-7283-9c2a-4166935f5043`; main accepted its isolation revisions and used them to
register and dispatch the two role Builders.
The newly surfaced `RIGHTSPOT-008` proposal-only `RS-WO-008-01` returned `READY_FOR_REVIEW` from
supporting worker `01a05d79-ce45-7000-aa44-a3a1ecad95b0`. Main jointly reviewed it with `RS-WO-009-01`,
accepted the bounded Favourite direction in ADR-RS-0013, and closed the proposal task; its separate
implementation Task is `RIGHTSPOT-020`. `RS-WO-020-01` is independently verified and closed after
Main completed the bounded server contract/data slice. Its disjoint tenant and agent UI Work Orders
were subsequently dispatched, adopted into Main at product commit `c29e80d`, independently verified at
`c977ea4`, and browser-verified against fresh-reset Main `f49e1ca`; no UI slice is active.
`RIGHTSPOT-009` was reviewed with `RIGHTSPOT-008` after `RS-WO-009-01` returned `READY_FOR_REVIEW`
from `01a05d7c-21b4-72f3-bbe8-1c34d1aee291`. It is closed as `REVIEWED_DEFERRED`: the Information
Request boundary remains proposal evidence only because contact/PII authority, retention, and agent
access decisions are not accepted. It cannot authorize implementation or outbound communication.
`RIGHTSPOT-010` is closed as a reviewed staged Agent Operations decision; its read-only
`RS-WO-010-01` returned `READY_FOR_REVIEW` from `01a05d88-8907-7063-8c93-030e296c9df0`
(`Leibniz`) and its disposition is recorded in the Task File and `ADR-RS-0016`. The existing
authority/projection was delivered by `RIGHTSPOT-013`, `RIGHTSPOT-015`, and `RIGHTSPOT-016`; the
manual consumer was separately registered as `RIGHTSPOT-044` and is now `CLOSED_VERIFIED`, while no
Operations WebMCP registration is authorized by that task. `RS-WO-020-01` has now passed independent verification and is closed; the
disjoint tenant and agent UI Work Orders `RS-WO-020-02` and `RS-WO-020-03` were dispatched, adopted
into Main at product commit `c29e80d`, and later covered by independent source and fresh-reset browser
verification. They are historical checkpoints, not active Work Orders.

**WebMCP roadmap checkpoint (2026-09-02):** The staged
[`RIGHTSPOT-WEBMCP-ROADMAP`](Development/RIGHTSPOT-WEBMCP-ROADMAP.md) is now the engineering gate
for any later page-authored capability. It rejects an undefined “100% adaptation” target and requires
Main-thread selection of one user goal, one page, one role, one bounded tool, explicit manual fallback,
privacy/security rules, supported-browser registration evidence, and independent verification before
implementation. The default recommendation is a read-only Tenant Discovery search slice; the
Operations/WebMCP direction in `RIGHTSPOT-010` is now a reviewed staged decision. `RIGHTSPOT-044`
owns the ordinary manual Operations surface and its independent evidence is complete; `F-22` /
`RIGHTSPOT-045` is a separate consumer latest-read repair, and no Operations WebMCP capability is
admitted by either task. No source, dependency, route, schema, fixture, registration, or implementation
outside the explicitly registered Tasks was created by this roadmap.

`RIGHTSPOT-011` accepts ADR-RS-0011's bounded Agent Operations read-model seam. `RS-WO-011-01`
completed its exact two-path Builder handoff at `5b05c78`, `RS-WO-011-02` independently verified it,
and the main thread integrated it at product commit `7ff0fbd`. The seam remains a server-side contract
only; no Operations route, dashboard, WebMCP, or future 008/009 metric is authorized.
  Its pure projection module and focused tests are available against the existing workflow state without
  waiting for the deferred Information Request semantics. It does not authorize an
Operations route, dashboard UI, reporting history, WebMCP, or external service.

**Current post-MVP closure:** `RS-WO-016-01` is independently verified and integrated at `edd7575`;
`RS-WO-017-03` is independently verified and integrated at `2a53917`, and `RS-WO-017-04` passed the
integrated browser gate. `RIGHTSPOT-016` and `RIGHTSPOT-017` are closed within their bounded outcomes.
The transient execution-path incident and failed 016 candidate remain process evidence only in the
owning Task Files and named local-only archive refs; their physical Worktrees have been removed. They
do not authorize editing or silently absorbing candidate source. `RS-WO-019-01`
is integrated and closed at `6f52686` after its bounded browser/form regression passed.

**Authoritative closure update:** The earlier checkpoint chronology below intentionally preserves the
state at each historical handoff. It must not be read as reopening the current gate: `RS-WO-002-14`
direct verification and `RS-WO-002-15` browser verification are complete, and `RIGHTSPOT-002` is closed
for the accepted local MVP. See [`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md)
for the complete closure evidence and claim boundary.

## 1. Executive status

RightSpot is the first working application target for this main thread. The existing outer
candidate material is sufficient to establish a product hypothesis, a primary workflow, initial
role boundaries, and a draft Backbone. It is not sufficient to claim that the final application
has been formally selected, validated, implemented, or integrated with the outer Re-entry Core.

The current task is to turn the candidate into a coherent ordinary web application while keeping
its product truth and architecture inside this folder. The first product slice is the one-sided
tenant-to-agent relay. The reciprocal agent-to-tenant leg remains optional.

The latest brainstorm establishes the intended application baseline: a stable but deliberately
bounded rental Web app that can later host the Hackathon integration. It is not intended to be a
complete commercial marketplace. The first build should prioritize a working human flow over
production-grade breadth or exhaustive edge-case coverage.

The accepted implementation baseline is Next.js App Router with React and TypeScript, running on
Node.js 24 with SQLite as the initial durable store. WebRTC is a future Remote Viewing seam, not a
first-phase media implementation; Redis is explicitly deferred.

The current MVP baseline is rental-only with two synthetic roles, a small seeded listing catalogue,
one primary demonstration listing, one Viewing Request, and a complete ordinary UI loop: tenant
discovery and submission, agent queue review and response, then tenant confirmation or decline. Only
the primary tenant-to-agent handoff needs a later automatic continuation demonstration; the tenant's
final response can remain a normal application action.

## 2. State matrix

| Surface | Current state | Boundary |
|---|---|---|
| Product name | **Working name: RightSpot** | Confirmed by the main-thread owner; brand details remain open |
| Candidate source | **Rental Marketplace Relay** | Extracted from outer scenario material |
| Preferred candidate set | **RightSpot and Sleepless Kingdom** | RightSpot is the current development target; outer formal selection remains pending |
| Product thesis | **Provisional** | MVP scope accepted; user/problem and workflow value still need validation |
| Primary slice | **MVP BUSINESS-RULES BASELINE** | Tenant request → agent review → slot proposal/decline → tenant response |
| Human application shell | **TENANT AND AGENT ROLE PAGES INTEGRATED; LOCAL HAPPY PATH CLOSED** | Workflow HTTP/DTO transport is integrated at `f700ba9`; shared demo-session shell is integrated at `006d2fd`; shared authenticated role-page frame is integrated at `6a0b4b8`; agent queue/response UI is integrated at `3765747`; repaired tenant discovery/request candidate `52cba87c` is integrated at `9348aa5`; `RS-WO-002-14` verified the integrated cross-role HTTP path and `RS-WO-002-15` verified the browser walkthrough |
| Domain model | **MVP BUSINESS-RULES BASELINE** | Viewing Request, Listing, Availability, roles, transitions, and audit boundaries |
| Backbone | **LOGICAL BASELINE** | Modular-monolith responsibility is defined and remains the application authority |
| Implementation stack | **FOUNDATION VERIFIED** | Next.js App Router, React, TypeScript, Node.js 24, and SQLite; the runnable foundation passed the corrected independent verification contract, without claiming product-flow or deployment readiness |
| Foundation runtime readiness | **PREPARED / VERIFIED** | Exact arm64 Node.js `v24.20.0` is prepared outside the repository and passed version, npm, archive-checksum, and `node:sqlite` smoke checks; the default shell remains `v26.5.0`, and the Builder used the exact target runtime |
| Realtime / WebRTC | **DEFERRED FEATURE SEAM** | Future Remote Viewing is possible without making WebRTC or signaling an MVP dependency |
| Delegated development | **EXPERIMENTAL PILOT — TASK-OWNED** | `RS-WO-002-01` returned `READY_FOR_VERIFICATION`; corrected `RS-WO-002-02` rerun returned `VERIFIED`; `RS-WO-002-03` bounded repair commit `6e70c9f` passed fresh independent verification; `RS-WO-002-04` candidate `68bbc69` passed dedicated verification against frozen source `28105e4d`; `RS-WO-002-05` candidate is frozen at T2 code commit `de169ce` and passed dedicated independent verification against snapshot `bc3bc42`; `RS-WO-002-06` returned `READY_FOR_REVIEW` and its accepted/revised decomposition is recorded in ADR-RS-0008; `RS-WO-002-07` candidate `d71fe3e` passed dedicated independent verification and is integrated at `f700ba9`; `RS-WO-002-08` is integrated at `006d2fd` after process re-baseline `8b77bdd`; `RS-WO-002-09` is integrated as bounded UI guidance; `RS-WO-002-11` candidate `f1f83c7` passed dedicated independent verification and is integrated at `6a0b4b8`; `RS-WO-002-13` candidate `169cb95d` passed dedicated independent verification and is integrated at `3765747`; repaired `RS-WO-002-12` candidate `52cba87c` passed final independent verification and is integrated at `9348aa5`; `RS-WO-002-14` passed direct read-only cross-role verification; `RS-WO-002-15` passed the isolated browser walkthrough and closure evidence is reconciled in `RIGHTSPOT-MVP-CLOSURE-RECORD.md` |
| Cloud Receiver | **Not a first-phase dependency** | Future integration boundary only |
| Agent Operations manual read surface | **CLOSED_VERIFIED; `RIGHTSPOT-044`** | Existing Operations authority/projection is consumed by the strict Agent-only `/agent/operations` page and HTTP route; independent local browser/API verification passed, while later Operations WebMCP remains separately gated |
| Active product repair | **`RIGHTSPOT-048` VERIFICATION_PENDING; `RIGHTSPOT-045` CLOSED_VERIFIED** | The shared role-page session lifecycle candidate is integrated at `218935c` and awaits independent supported-browser verification; the earlier Operations latest-read repair remains closed within its manual page boundary |
| WebMCP | **TENANT DISCOVERY SLICE VERIFIED; `RIGHTSPOT-046` ACCEPTED; `RIGHTSPOT-047` PAUSED; `RIGHTSPOT-048` BROWSER GATE PENDING** | Page-bound `search_listings` is verified only in the declared local supported-browser capability; the Agent `read_listing_pipeline` candidate is frozen but must be re-baselined after the shared lifecycle gate |
| Runtime / deployment | **Not started** | No service, hosting, credentials, or public URL |
| Evidence | **LOCAL MVP + `RIGHTSPOT-043`, `RIGHTSPOT-044`, AND `RIGHTSPOT-045` CLOSED_VERIFIED; `RIGHTSPOT-046` ACCEPTED; `RIGHTSPOT-048` STATIC_GATES_PASSED / CORRECTED BROWSER RETRY ACTIVE; `RIGHTSPOT-047` INDEPENDENT_BROWSER_INCOMPLETE** | The 048 candidate is integrated at `218935c` and passes focused `35/35`, complete `215/215`, typecheck, build, validators, sensitive scan, and diff checks; two earlier browser attempts produced no usable evidence, and the single corrected retry is active with the validated CLI launch form. The 047 gate remains paused. No push, WebMCP closure, or production/deployment claim is made |

## 3. Confirmed working inputs

- Two roles are central: tenant and property agent.
- The shared business object is a Viewing Request.
- The candidate has a natural later transition: a tenant submits a request and the agent must
  review it.
- The agent needs a management-console view of the current request and synthetic availability.
- The consequential agent response must remain a visible human decision.
- The first slice should use a small synthetic listing catalogue, one primary listing, one tenant,
  one property agent, one request, and deterministic reset.
- The normal app should support tenant login, listing search/filter, listing detail, Viewing Request
  submission, tenant dashboard, agent queue, request review, availability review, a visible
  proposal/decline decision, and a tenant response to a proposed slot.
- The initial fixture should contain enough seeded listing variety for the discovery UI, while the
  judged flow uses the primary listing, one tenant, one agent, and one request.
- Rental-only is the current MVP decision; buying is deferred rather than implemented as a second
  workflow.
- Favourites, bounded proposal notes, and small listing-status controls are supporting features,
  not blockers for the primary relay.
- The tenant's final confirmation or decline is an ordinary application action; it is not a second
  automatic continuation requirement.
- The first judged consequence boundary is the agent's explicit proposal or decline send action;
  tenant confirmation or decline completes the normal application loop.
- The accepted implementation stack is Next.js App Router, React, TypeScript, Node.js 24, and
  SQLite. Vite is not added as a second frontend framework.
- Redis is not required for the MVP and is deferred until a concrete multi-instance, queue,
  presence, or realtime fan-out requirement exists.
- WebRTC is positioned as a possible future Remote Viewing capability. The MVP preserves ownership
  and module boundaries for it but does not implement camera, microphone, signaling, STUN, TURN, or
  media-session behavior.
- Payment, lease signing, real identity documents, live property data, external calendars, and
  broad marketplace features are outside the first slice.

## 4. Open decisions

- What exact user pain and audience will RightSpot validate?
- What deployment profile should host the accepted local contracts, and what later integration
  transport is actually necessary?
- Whether the local MVP snapshot should later be replaced by a normalized production schema and
  migration strategy.
- Whether and how to expose a development-only audit inspection surface; the current product UI does
  not expose audit records.
- Whether provider-backed authentication should be enabled beyond the bounded demo session, subject to
  the external credential gate in `RIGHTSPOT-006`.
- Which future Hackathon integration is necessary after the ordinary product loop works?

The current `320px` responsive floor, keyboard/focus, reduced-motion, and related presentation baseline
are accepted by ADR-RS-0009 and covered by the recorded validation evidence; they are not open
implementation decisions for the local MVP.

## 5. Current gate and closure

There is no active Green implementation Worktree for the accepted local MVP, the closed F-08 dashboard repair,
the closed `RIGHTSPOT-039` / `RS-WO-039-01` F-17 repair, or the closed `RIGHTSPOT-040` /
`RS-WO-040-01` F-18 Discovery error-copy repair. The
closed F-09 conflict-feedback repair, the closed F-10 selected-time projection repair, the
closed F-11 Agent-dashboard presentation repair, the closed F-12 cross-listing notice repair, or the
closed F-13 preferred-time removal accessibility repair, the closed F-14 editor-feedback repair, or the
closed F-15 Agent latest-read truthfulness repair and F-16 Agent stale-action recovery presentation
repair. `RIGHTSPOT-038` is closed within its exact request-detail consumer boundary.
`RIGHTSPOT-033` / `RS-WO-033-01`, `RIGHTSPOT-034` / `RS-WO-034-01`, `RIGHTSPOT-035` /
`RS-WO-035-01`, `RIGHTSPOT-036` / `RS-WO-036-01`, `RIGHTSPOT-037` / `RS-WO-037-01`,
`RIGHTSPOT-038` / `RS-WO-038-01`, `RIGHTSPOT-040` / `RS-WO-040-01`, and `RIGHTSPOT-041` /
`RS-WO-041-01` are `CLOSED_VERIFIED` in the canonical Main Worktree; no extra code Worktree is open.
`RIGHTSPOT-043` / `RS-WO-043-03` are also `CLOSED_VERIFIED` for the bounded local Tenant
Discovery Search/WebMCP slice; its supported-browser evidence and non-claims are recorded in the
owning Task File and WebMCP roadmap.
`RIGHTSPOT-010` is closed as a reviewed staged decision through `ADR-RS-0016`; its existing
Operations authority and pure projection are complete, and `RIGHTSPOT-044` is now
`CLOSED_VERIFIED` for its ordinary Agent-only page, strict HTTP consumer, navigation entry, and
independent browser/API evidence. No supporting code Worktree is open.
The
read-only `RS-WO-002-14`
combined cross-role verification passed against integrated source
`9348aa50b63e3f4f46e77238ad370670383d9d6`, and the main-thread `RS-WO-002-15` isolated browser
walkthrough then passed against the same source from a fresh database. The agent candidate `169cb95d`
is integrated at product commit `3765747`, the repaired tenant candidate `52cba87c` is integrated at
`9348aa5`, and both slices use the verified shared frame at `6a0b4b8` and stable transport, listing,
and DTO boundaries. The durable evidence is recorded in
[`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md).

The latest Main-thread primary-chain replay used fixture generation `57` and passed tenant listing
detail, draft save, explicit submission, Agent queue/review/preparation/send, tenant proposal
confirmation, terminal tenant projection, and Agent confirmed history. It also confirmed separate
tenant-facing versus Agent-only notes, the selected-time projection, six truthful timeline entries,
the `320px` width floor, first-Tab skip-link focus, and empty browser page-error logs. The fixture was
reset to generation `58` with healthy `/api/health`; no new implementation finding was reproduced or
registered. `F-08` remains an evidence gap, not an authorization for speculative route repair.

The latest alternate terminal replay used fixture generation `59` and passed tenant draft/save/submit,
Agent review, bounded decline preparation/send, tenant `Agent Declined` terminal read, and Agent
read-only history. It confirmed `AGENT_DECLINED`/version `5`, release of all three held/available
slot candidates, separate tenant-facing versus Agent-only notes, no terminal action controls, the
`320px` width floor, first-Tab skip-link focus, and empty browser page-error logs. The fixture was reset
to generation `60` with healthy `/api/health`; no new finding or Task was registered.

The latest generation-`60` direct route/role re-check confirmed signed-out role entry, tenant catalogue,
listing detail, Favourites, Viewing Requests, tenant-to-Agent wrong-role handling, Agent queue, and
embedded Listing interest entry with truthful empty states. It also passed direct URL route checks,
`320px` body/document width equality, first-Tab skip-link focus, and an empty browser page-error log.
One cross-document accessibility-tree reference returned a CLI `Done` acknowledgement without changing
the expected URL; this was a browser-operation false success and was not classified as a product defect.
Direct URL navigation after reacquiring the target produced the expected rendered surfaces. A follow-up
at generation `61` used the actual DOM catalogue anchor and confirmed navigation type `navigate`, referrer
`/tenant`, final listing-detail URL, and rendered `Canal Wharf Apartment`. The fixture was reset to
generation `62` with healthy `/api/health`; no new Task was registered. `F-08` remains an evidence gap
and the browser postcondition caution is now recorded in the delegated-work Runbook.

The follow-up reverse synthetic same-document probe in isolated `rightspot-audit-063` held both old
primary-listing reads while the App Router moved back to `/tenant/listings/listing-north`; releasing
the old responses left `Northfield Garden Flat` and its matching image identity rendered. This
strengthens but does not close `F-08`, because it remains page-local timing evidence and the supported
catalogue links are full document navigations. No Task or Work Order was registered, and the fixture
remained at generation `62`.

The remaining paragraphs record the earlier checkpoint sequence for audit context; they do not reopen the
closed parent or override the current closure statement above.

## 5.1 Current post-MVP route

The current post-MVP route is the non-blocking `RIGHTSPOT-012` cross-layer audit against the latest
canonical Main source. The bounded `RIGHTSPOT-045` consumer repair for `F-22` is now
`CLOSED_VERIFIED` within its manual Operations consumer boundary. The already
accepted Operations authority and pure projection were consumed by the ordinary Agent-only
`/agent/operations` page and strict `GET /api/agent/operations` consumer in `RIGHTSPOT-044`; all three
044 Work Orders are `CLOSED_VERIFIED`. Any Operations WebMCP capability remains separately gated and
is not implied by the manual surface closure or the 045 repair.

The accepted local MVP and the bounded `RIGHTSPOT-020` Favourite/listing-interest increment are complete.
The cross-layer page-entry audit then verified the narrow `RIGHTSPOT-021` defect: the existing
`/tenant/requests` dashboard has no persistent tenant-navigation entry. `RIGHTSPOT-021` then completed
its bounded route repair: `RS-WO-021-01` returned `READY_FOR_VERIFICATION`, and independent Verifier
task `01a05ff5-ccf1-75c3-b873-5b39f0e3e28f` returned `VERIFIED` against the frozen serialized Main
Worktree snapshot. The bounded implementation gate remains closed for its declared acceptance
matrix. A subsequent Main-thread audit found the documented `320–342px` narrow-viewport clipping
residual; Main selected the existing `320px` floor and registered `RIGHTSPOT-022` as a separate
responsive repair. Its `RS-WO-022-01` Builder returned `READY_FOR_VERIFICATION` in the persistent
supporting task `01a0602e-e947-7231-bf6f-37ed685681e2`; Main froze the exact CSS candidate at local
product commit `f0dbd99`, and independent `RS-WO-022-02` verification in persistent supporting task
`01a06039-6eea-7033-aaf8-ae34c69aebe7` returned `VERIFIED`. The bounded gate is closed and it does not
change the `RIGHTSPOT-021` source.
`RS-WO-020-05` returned `VERIFIED` against the frozen Main baseline `f49e1ca` after rebuilding and serving
the exact source on a separate local port, and its evidence is recorded in the owning Task File. The
`RS-WO-021-01` implementation and `RS-WO-021-02` independent verification gates are closed:

1. kept the reviewed documentation/procedure baseline and unrelated collaborator work separate;
2. implemented only the accepted bounded Favourite direction through `RIGHTSPOT-020`; the
   `RS-WO-020-01R` relation-version continuity repair is independently verified and consumed by UI;
3. dispatched `RS-WO-020-02` and `RS-WO-020-03` in parallel with disjoint paths; both candidates were
   adopted in Main after exact-path review;
4. serialized shared navigation, listing-card/detail integration, global CSS, source freeze, Main
   integration, independent verification, and Worktree retirement; the product source was frozen at
   `c29e80d`, statically verified at Main `c977ea4`, and browser-verified at Main `f49e1ca`.
5. keep the reviewed `RIGHTSPOT-009` Information Request proposal deferred until its contact/PII
   authority decisions are accepted; it must not be absorbed into `RIGHTSPOT-020`;
6. keep `RIGHTSPOT-006` gated on explicit external credentials and local-origin authorization;
7. treat `RIGHTSPOT-010` as a closed reviewed staged Operations decision, implement its ordinary
   manual surface through `RIGHTSPOT-044`, and keep `RIGHTSPOT-012` as a non-blocking read-only audit
   lane;
8. register and close `RIGHTSPOT-023` for the independently reproduced signed-out root session-read
   defect (`F-02`) after its serial TDD repair and independent evidence;
9. register and close `RIGHTSPOT-024` for the independently reproduced `127.0.0.1:3100` Next.js
   development-origin gap, keeping its config-only Work Order separate from the session repair;
10. register and close `RIGHTSPOT-025` for the independently reproduced `F-01` agent-draft privacy
    defect, keeping queue empty-state and direct-detail non-visibility at the authoritative read
    boundary; Main focused `2/2`, full `127/127`, typecheck, build, live smoke, and formal persistent
    verification passed.
11. register and close `RIGHTSPOT-026` for the reproduced listing-detail request-status notice copy
    defect; keep it presentation-only and separate from the closed workflow/privacy repairs.
12. register, verify, and close `RIGHTSPOT-027` for the reproduced tenant request-dashboard terminal
    response presentation defect; keep it presentation-only and separate from workflow/API changes.
13. register, repair, independently verify, and close `RIGHTSPOT-028` for the reproduced deterministic
    workflow-fixture reset defect; keep the repair in the CLI/test composition boundary and do not
    broaden foundation-only reset semantics or add automatic database recovery.
14. review, implement, independently verify, and close `RIGHTSPOT-032` for the reproduced tenant
    selected-slot projection defect; keep it tenant-safe and separate from workflow transitions,
    persistence, agent/private projections, and deferred integrations. This gate is now closed with
    focused/full and fresh browser evidence.
15. execute and close `RIGHTSPOT-033` for the reproduced Agent queue active/history presentation defect;
    this bounded UI-consumer-only gate is now closed and did not alter the authoritative queue contract.
16. execute and close `RIGHTSPOT-034` for the reproduced cross-listing tenant notice defect; this
    bounded UI-consumer-only gate is now closed and did not alter the request state or read boundary.
17. execute and close `RIGHTSPOT-035` for the reproduced preferred-time removal accessibility defect;
    this bounded tenant-editor-only gate is now closed and did not alter the request workflow.
18. execute and close `RIGHTSPOT-036` for the reproduced stale editor-feedback defect after structural
    removal; this bounded local-feedback gate is now closed and did not alter validation or request behavior.
19. execute and close `RIGHTSPOT-037` for the reproduced stale Agent projection/action after a failed
    latest read; this bounded two-consumer UI gate is now closed and did not alter the Agent API,
    workflow, or server state.
20. continue the Main-thread cross-layer audit from the canonical Main Worktree; reproduce any new
    gap before registering another bounded Task, and keep deferred credentials, external integrations,
    and the separate listing-detail `F-08` evidence gap outside the current route.

Only an explicitly selected, implementation-ready Task may open a code Work Order or temporary
Worktree. `RIGHTSPOT-023`, `RIGHTSPOT-024`, and `RIGHTSPOT-025` are closed after their exact-path
verification and documentation writeback; `RIGHTSPOT-026` and `RIGHTSPOT-027` are also closed after
their exact-path verification and documentation writeback, with no active implementation Worktree.
`RIGHTSPOT-028` is closed after exact-path independent verification and documentation writeback; it
never opened a supporting implementation Worktree. The accepted Worktree lifecycle is prompt integration into Main followed by
checkpoint-scoped retirement. `RIGHTSPOT-021` is closed for its bounded navigation repair and
independent verification; its post-closure `320–342px` residual was resolved by closed
`RIGHTSPOT-022`, whose Builder handoff and independent verification are complete at product commit
`f0dbd99`. `RIGHTSPOT-006` and `RIGHTSPOT-012` remain separate credential and read-only audit gates;
`RIGHTSPOT-010` is closed as the reviewed staged decision, `RIGHTSPOT-044` is `CLOSED_VERIFIED`, and
`RIGHTSPOT-045` is `CLOSED_VERIFIED` within its bounded Operations consumer repair boundary.
`RIGHTSPOT-032` is closed within its tenant projection boundary
and does not reopen `RIGHTSPOT-020`. `RIGHTSPOT-033` is closed within its Agent presentation boundary.
`RIGHTSPOT-034` is closed within its tenant listing-detail presentation boundary, and `RIGHTSPOT-035`
is closed within its tenant request-editor accessibility boundary. `RIGHTSPOT-036` is closed within
its tenant editor-feedback boundary. `RIGHTSPOT-037` is closed within its Agent latest-read
truthfulness boundary. `RIGHTSPOT-038` is closed within its Agent stale-action recovery
presentation boundary.
The next route is the continuous Main-thread `RIGHTSPOT-012` audit as a read-only lane; `RIGHTSPOT-045`
is already closed within its bounded Operations consumer boundary. No server, workflow, persistence,
privacy, or dependency change outside a registered Task is authorized.

## 5.2 Accepted MVP Work Order boundary (historical closure)

The first `RS-WO-002-02` result is recorded as a procedural `BLOCKED`, and the corrected rerun is
now `VERIFIED` against the unchanged source/runtime identity. The bounded `RS-WO-002-03` domain-core
implementation and projection-isolation repair were independently checked against frozen commit
`a60001e`; the bounded Repairer completed the exact two-path repair in `6e70c9f`; fresh independent verification returned `VERIFIED`. `RS-WO-002-04` was initially held because its prompt was appended to the persisted `RS-WO-002-01` supporting thread. The main thread reconstructed the exact three-path candidate and adopted it at T2 commit `68bbc69`. The first dedicated Verifier dispatch then stopped before source checks because the prompt incorrectly expected a nested `WebMCP_Challenge` directory inside the detached Worktree; one corrected follow-up to the same identity-matching Verifier returned `VERIFIED` against frozen source `28105e4d`. The parent execution posture is now `PROGRESSING`, not globally blocked: `RS-WO-002-05` Builder returned `READY_FOR_VERIFICATION`, its exact 14-path candidate was integrated at T2 code commit `de169ce`, and its dedicated independent Verifier returned `VERIFIED` against canonical snapshot `bc3bc42`. The read-only `RS-WO-002-06` Architecture Advisor returned `READY_FOR_REVIEW`; the main thread accepted its decomposition with revisions and froze the ordinary workflow HTTP/DTO contract in ADR-RS-0008. `RS-WO-002-07` candidate `d71fe3e` passed dedicated independent verification, including foundation `6/6`, focused `9/9`, full direct `50/50`, build, built-server HTTP, role/privacy/conflict, and no-mutation evidence, and is integrated at product commit `f700ba9`; `RS-WO-002-08` passed dedicated independent verification after a generated-output boundary re-baseline in process commit `8b77bdd` and is integrated at product commit `006d2fd`; `RS-WO-002-09` is integrated as bounded guidance; `RS-WO-002-11` candidate `f1f83c7` passed dedicated independent verification and is integrated at product commit `6a0b4b8`. The next gate is to complete the assigned disjoint tenant and agent role-page Work Orders `RS-WO-002-12` and `RS-WO-002-13`, then independently verify and integrate each before the cross-role browser walkthrough. The user-authorized Side Chat learning file and process-only Runbook writeback are classified separately and are not product source drift. Do not claim complete product-flow or parent closure from this checkpoint alone.
The historical role-page disposition was integrated tenant and agent role pages: repaired tenant
candidate `52cba87c` for `RS-WO-002-12` is integrated at `9348aa5`, after `RS-WO-002-13` passed
independent verification and was integrated at `3765747`; `RS-WO-002-14` passed direct combined
cross-role verification. At that historical checkpoint, the browser walkthrough and closure evidence
remained required; both are complete as stated in the current closure section above. The eventual
implementation remained without Cloud Receiver, WebMCP, Redis, or WebRTC media dependencies.

Current checkpoint: `RS-WO-002-14` passed direct combined cross-role verification against the integrated
source, and `RS-WO-002-15` passed the isolated browser walkthrough from
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-15-browser-primary` against the exact integrated
product commit `9348aa50b63e3f4f46e77238ad370670383d9d6`. Browser evidence and parent closure are
reconciled in [`RIGHTSPOT-MVP-CLOSURE-RECORD.md`](Development/RIGHTSPOT-MVP-CLOSURE-RECORD.md).

`RS-WO-002-10` returned `READY_FOR_REVIEW` with no source mutation, and the main thread accepted its
decomposition. `RS-WO-002-11` Builder returned `READY_FOR_VERIFICATION`; T2 review froze the exact
four-path candidate at `f1f83c7`, dedicated verification returned `VERIFIED`, and the main thread
integrated it at `6a0b4b8`. `RS-WO-002-12` and `RS-WO-002-13` were the two disjoint role-page
implementation slices; their exact dispatch identities and Worktrees are recorded in the parent
Task File; tenant task `01a05ba2-34d4-7613-892d-c0776203073c` uses
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-tenant-ui`, and agent task
`01a05ba2-3d53-7bd3-934c-6238237576fd` uses
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-13-agent-ui`; the tenant candidate
`eb1d62e1b33a045e683f64ba3d28930e9444cd25` was superseded by repaired candidate
`52cba87c00c3461793b22aa26974da5276d01b48`, which verifier task
`01a05bb1-c38b-7a91-95aa-49475a057e43` independently verified from historical final Worktree
`/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-12-verifier-final` with exact nine-path scope, Node
`24.20.0`/npm `11.19.0`, foundation `6/6`, tenant focused `4/4`, full direct `54/54`, build, HTTP,
and static evidence. Browser E2E was not run because available browser tooling could mutate tracked
`.gitignore`; no browser claim is made. The owning Task File retains the earlier verifier evidence and the
out-of-scope `.gitignore` mutation adding `.gstack/`; those physical verifier Worktrees were removed
during the documented cleanup. The agent candidate `169cb95d60d4d91c8cd89ef4b722f6fc379db97f`
passed verifier task `01a05bae-de91-7252-b5ce-4a6a729441dd` and is integrated at product commit
`3765747`; its historical verifier path was `/Users/alex/OpenAI-WebMCP/.rightspot-rs-wo-002-13-verifier`,
and that physical Worktree was removed during the documented cleanup.

The parent `RIGHTSPOT-002` is `closed` for the accepted local MVP; the foundation Builder stopped after returning
`READY_FOR_VERIFICATION`, the first `RS-WO-002-02` attempt was `BLOCKED` on a procedure boundary,
and its corrected rerun is `VERIFIED` against the unchanged exact target Node.js runtime and
execution manifest. `RS-WO-002-03` Builder and bounded Repairer returned `READY_FOR_VERIFICATION`,
and T2 source is frozen at `a60001e`; the Verifier found a listing-version guard defect and the
bounded Repairer completed it in post-repair commit `6e70c9f`; fresh independent verification returned `VERIFIED`. `RS-WO-002-04` candidate adoption is complete for the three-path persistence/application boundary at T2 commit `68bbc69`; its first dedicated Verifier attempt was procedurally blocked before source checks by an incorrect nested-root path in the dispatch prompt, and one corrected follow-up returned `VERIFIED` against frozen source `28105e4d`. `RS-WO-002-05` discovery is independently verified against T2 code commit `de169ce` from snapshot `bc3bc42`. The `RS-WO-002-06` Advisor's read-only proposal is integrated into ADR-RS-0008 and the admitted Work Orders. `RS-WO-002-07` workflow transport is independently verified at `d71fe3e` and integrated at `f700ba9`; `RS-WO-002-08` passed dedicated independent verification after a generated-output boundary re-baseline in process commit `8b77bdd` and is integrated at product commit `006d2fd`; `RS-WO-002-09` is integrated as bounded UI guidance; `RS-WO-002-11` is integrated at `6a0b4b8`; `RS-WO-002-12` and `RS-WO-002-13` are assigned in parallel from the reviewed baseline, with exact task identities and Worktrees recorded in the parent Task File. Builder, Verifier, Repairer, and Integrator remain sequential checkpoints within each Work Order; the Side Chat process lane remains separate from product-source writes. The main thread owns evidence writeback, Git closure, and dispatch.

## 6. Non-claims

RightSpot currently does not claim a validated rental business, production-ready marketplace,
selected Agent runtime, Cloud Receiver compatibility, WebMCP proof, WebRTC Remote Viewing,
Redis-backed distributed operation, live deployment, or Hackathon submission readiness.

The latest Main-thread audit also ran a reverse synthetic same-document listing read-order probe:
both old primary-listing reads were held while the App Router moved back to the Northfield listing,
and releasing the old responses left the final route and `Northfield Garden Flat` identity correct.
This strengthens but does not close the separate `F-08` evidence gap; ordinary catalogue links remain
full document navigations, and no Task or Work Order was registered. The fixture remained at generation
`62`.

The latest Main-thread code-quality and Agent preparation review used isolated session
`rightspot-audit-087` at fixture generation `83`. The rendered required slot control blocked an empty
preparation before the application handler, no new defect or task was reproduced, and the fixture was
reset to generation `84` with empty browser errors and healthy `/api/health`. The complete pinned suite
remains `159/159`; typecheck, build, repository validators, sensitive scans, documentation validation,
and RightSpot diff checks passed. `RIGHTSPOT-012` remains the active read-only audit lane and `F-08`
remains an evidence gap.

The same audit recorded low-severity `F-20 VERIFIED_POLISH`: at `320px`, the terminal Agent request
detail heading splits `workspace` inside the word, while there is no horizontal overflow and the same
heading wraps intact at `375px`. This is non-gating responsive typography polish; no implementation
Task was opened and no ordinary flow, role boundary, or runtime claim changed. The disposable fixture
was reset afterward to generation `85` with healthy `/api/health`.

The follow-up read-only code-quality audit reviewed current UI, workflow HTTP, projections, persistence,
and Operations error/fallback boundaries on Main HEAD `4224f3ae53f6d4be87a7be17e74532f5785357b0`.
No unbounded retry, false-success mutation, diagnostic leakage, or business-state fallback was found
in the inspected scope. Pinned typecheck, build, full tests (`159/159`), repository/docs validation,
sensitive scan, diff check, and health passed. No new Task was registered; `RIGHTSPOT-012` remains the
active non-blocking audit lane, `F-08` remains an evidence gap, and `F-20` remains non-gating polish.

The latest current-source regression revalidation kept the canonical repository on `main` at HEAD
`4224f3ae53f6d4be87a7be17e74532f5785357b0`, with only the Main Worktree present and the existing dirty
collaborator/owner changes preserved. Pinned Node `24.20.0`/npm `11.19.0` passed the complete package
suite `159/159`, `typecheck`, production `build`, repository validation, documentation validation,
sensitive-pattern scan, `git diff --check`, and `/api/health`. No new finding or follow-on Task was
accepted. This revalidation adds no fresh browser claim; `F-08` remains an evidence gap, `F-20` remains
non-gating polish, and the unpublished Favourite branch remains direct/static-only within the current
bounded UI.

The current populated browser replay found an evidence limitation in the in-app browser harness for the
native Tenant `datetime-local` control: `fill` displayed a valid value, but Save draft retained the
controlled empty state and showed the existing client validation message. A normal textarea on the same
form synchronized correctly, and no API mutation occurred. This is not accepted as a product defect
because the page source is unchanged and `RIGHTSPOT-019` contains prior native-control browser/form
success evidence in a separate runtime. No Task was opened; a trusted native-picker or independent
browser rerun is required before treating this as a product finding. `F-08`, `F-20`, and the Favourite
unpublish evidence limitation remain unchanged.

The latest current-source browser revalidation used the local server without mutating workflow data.
Signed-out role selection, Tenant catalogue/navigation, empty Viewing Request and Favourite states,
listing detail draft-entry boundaries, sign-out recovery, and the Agent queue plus read-only
listing-interest projection all rendered through reachable user-facing entries. The effective narrow
viewport floor was `355px` by `888px` with no horizontal overflow; first Tab reached the skip link and
the browser error/warning log was empty. No populated request-detail replay was claimed in this check;
the prior populated-chain evidence remains the authority for that claim. No new finding or Task was
accepted, and `F-08`, `F-20`, and the direct/static-only unpublished Favourite evidence limitation remain
unchanged.

The current audit also repeated the Tenant native `datetime-local` input check in the available Chrome
extension runtime. Automation could display a valid value but could not commit the native control's
change to the controlled React state; Save draft therefore showed the existing bounded empty-time
validation, while the ordinary textarea worked and no workflow data changed. This reproduces the
in-app-browser harness limitation across both available automation surfaces, not a verified product
defect. The prior successful `RIGHTSPOT-019` native-control browser/form evidence remains the product
claim boundary; no speculative repair or workaround Task is registered. A real native picker or a
known-capable browser harness is still required to close this evidence gap.

A separate read-only probe used native `history.pushState` to imitate a same-document transition from
one listing detail to another. The URL changed without a new listing read and the old listing remained
rendered. This is outside the current supported navigation contract, whose Discovery anchors perform full
document navigation; it confirms only the future-router evidence boundary and does not establish a product
defect or authorize a workaround. `F-08` remains an evidence gap.

The latest read-only fallback/code audit reviewed Tenant and Agent loading, retry, conflict, malformed
payload, empty, stale-content, and role-boundary handling. No new product finding was accepted. A
suspected duplicate request-card label was disproved in the rendered DOM and traced to overlapping shell
output ranges; the temporary local draft was reset, leaving request and Favourite state empty at generation
`86`. Full tests (`159/159`), typecheck, production build, and `/api/health` remain green.
