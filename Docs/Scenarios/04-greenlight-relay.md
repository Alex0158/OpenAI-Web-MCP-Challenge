# Candidate Scenario D — Greenlight Relay

**Role:** EXECUTION-SAFE RESERVE — NOT SELECTED  
**Selected as the challenge demo app:** No  
**Implementation status:** Concept only; not implemented or validated  
**Primary pattern:** Conditional rights decision resumes the same creative release artifact  
**Last updated:** 2026-08-31

**Comparative research disposition:** Retain as the strongest execution-safe reserve, subject to a
deterministic-baseline test and a genuine Agent-to-Browser/WebMCP re-entry test. The earlier
[three-candidate app-selection review](../Research/23-three-candidate-competition-app-selection-review.md)
still records Greenlight as lead; the latest scenario-level reassessment gives Opportunity the
lead after clarifying its custom-review and causal cross-site design. Neither document selects the
app without an accepted ADR.

## Comparative Research Update

Greenlight remains viable only after a material repositioning: from a rights-aware matrix to
**Conditional Creative Release**. It was not recommended merely because its scope was smaller.
Its real advantages are one persistent visual artifact, a naturally delayed consequential event,
a legible human release boundary, a plausible professional buyer, and a sparse-event transport
profile.

- **VERIFIED problem reality:** WIPO states that rights clearance affects planning and
  artistic choices, that music licensing can take much more than eight weeks, and that an
  outcome may require licensing, substitution, removal, or different use.
- **VERIFIED substitutes:** Rightsline already offers multidimensional rights availability,
  continuous recalculation, and configurable conflict logic. Adobe Workfront already supports
  creative approval states and approve/reject/approve-with-changes flows.
- **VERIFIED prior art:** multiple public WebMCP projects already cover creative review,
  video editing, structured creative artifacts, and human-approved changes.
- **INFERENCE:** neither a rights matrix nor human creative approval is the innovation. The
  defensible contribution is a later authoritative decision resuming the same project-bound
  Agent into current campaign state so it can stage a materially adapted release pack.
- **REQUIRED BOUNDARY:** the deterministic policy layer owns eligibility; the Agent preserves
  creative intent under those constraints; the human alone accepts, schedules, or publishes.
- **REVISED HEAD-TO-HEAD INFERENCE:** once Opportunity includes a reviewer-authored custom
  question and current-project reconciliation, Greenlight no longer owns the strongest
  non-deterministic Agent task. Opportunity also demonstrates cross-site composition and uses the
  existing project context more directly.
- **GREENLIGHT'S REMAINING EDGE:** one app can show a visually coherent before/after release pack
  with lower implementation and narration cost. Its buyer, operator, and consequence owner are
  also easier to name than in a general opportunity platform.
- **RECOMMENDATION:** preserve one synthetic trailer, one conditional music decision, one
  intervening campaign change, one replacement or narrowed release branch, five Site Tools, and
  one human publish boundary as the fallback build.

Greenlight should retake the lead if Opportunity's custom-question fixture collapses into template
work, its flight epilogue obscures the core proof, the independent-site authority boundary cannot be
shown honestly, or a three-minute stranger test finds the two-act story incoherent. Greenlight
should remain reserve if its own Agent output is functionally equivalent to the deterministic
rights matrix or if judges consistently interpret it as autonomous legal advice.

### Why Greenlight is more than a small-scope choice

1. **Single-artifact continuity:** the same creative objective, asset version, campaign revision,
   and release pack remain visible before and after the event.
2. **Intrinsic delay:** a conditional clearance decision naturally arrives after the original work
   session and can invalidate work completed during the wait.
3. **Visual consequence:** allowed, blocked, substituted, and newly staged variants are legible
   without exposing private data or performing a production publish.
4. **Natural human boundary:** the Agent may stage adaptation, but a producer owns legal risk and
   the final release decision.
5. **Commercial legibility:** agencies, production teams, creative-operations systems, and rights
   platforms provide plausible beneficiaries, operators, and buyers.

These strengths justify retaining Greenlight even when it is not the broadest or most ambitious
concept.

### Protocol and claim boundary

WebMCP exposes the current creative page's state-derived tools. It does not issue the clearance,
define this project's Re-entry Manifest or Grant, or wake a dormant Agent. The rights authority
owns the decision; the project-owned Receiver and continuation adapter own event acceptance and
activation; the page owns campaign state and valid actions; deterministic policy owns eligibility;
the Agent owns contextual creative synthesis; and the human owns release.

## 1. Executive Summary

Greenlight Relay is a rights-aware creative release workspace for filmmakers, creators,
agencies, and small production teams. A producer prepares a trailer, campaign, or branded
creative package that contains a third-party asset such as a music track. The workspace helps
the producer assemble a clearance packet, records the exact asset version and intended uses,
and presents a bounded future re-entry offer. The producer approves one bounded Receiver Grant
for a future decision about that exact asset and campaign.

The decision arrives after the original working session and may be conditional rather than
simply approved or denied. For example:

- use is approved only in the United Kingdom;
- YouTube and Instagram organic posts are allowed;
- paid advertising is prohibited;
- a specific attribution line is required;
- use expires on a stated date;
- the decision applies only to the submitted asset hash and edit version.

The Host backend commits the decision state and emits a signed event. Receiver Core validates the
event against the Grant and records an eligible delivery; the Local Connector and Continuation
Adapter then activate the Agent that already understands the creative brief and release plan. The
Agent must re-enter the live Greenlight Relay page,
read the authoritative current campaign state and structured clearance decision, discover the
new Site Tool surface, reconcile the conditions against any campaign changes made since the
request, and stage compliant release variants. It may insert required attribution, remove or
block prohibited channel variants, preserve allowed versions, propose a substitute track, and
explain the trade-offs. It cannot declare that a use is lawful, override a denial, publish the
campaign, schedule distribution, accept legal risk, or broaden the licence.

The central proposition is:

> A rights decision should not merely notify the producer that work can resume. It should
> safely resume the Agent that already understands the release, return that Agent to current
> web state, and prepare the compliant next version for a human decision.

This candidate is designed to make the full re-entry mechanism visible through a professional,
high-consequence, intrinsically asynchronous workflow. Its strongest advantage is the fit
between delayed external decisions and creative adaptation. Its strongest risk is legal
overreach: the Agent must operate on a structured decision supplied by an authorized rights
actor and must never present itself as a lawyer or as the authority that clears a right.

## 2. Product Thesis

Creative work does not stop when a draft is finished. A trailer, campaign, or branded video
often waits on an external review, licence, release, policy check, or rights decision. The
decision can arrive days or weeks later, after the team has changed the cut, channels, copy,
territories, or launch date. A conventional notification tells the producer that something
happened. It does not recover the full creative context, compare the decision with the current
release plan, or prepare the compliant next state.

Greenlight Relay converts that later decision into a governed continuation:

```text
Creative work
  -> exact rights request
  -> user-scoped future grant
  -> session ends
  -> rights decision occurs later
  -> Host backend commits state and emits a signed event
  -> Receiver accepts one eligible delivery
  -> Local Connector and Continuation Adapter activate the bound Agent
  -> canonical page re-entry
  -> current rights and campaign state are read
  -> compliant variants are staged
  -> human decides whether to release
```

The Agent handles contextual adaptation. The page and policy engine enforce structured rights
conditions. The rights desk owns the decision. The producer owns the final release decision.

## 3. Domain Evidence and Problem Reality

This candidate is grounded in a real class of workflow, but the product and demand remain
unvalidated.

The World Intellectual Property Organization's independent-filmmaker guide describes rights
clearance as a process that should begin early, can affect planning, financing, distribution,
and artistic choices, and may result in licensing, substitution, changed use, or removal of an
element. It also notes that clearance is continuous as production materials change and that
licensing can take weeks or longer. The guide emphasizes that the producer remains responsible
for the risk and that legal expertise is needed for legal conclusions.

United Kingdom government guidance similarly describes licences as potentially limited by
purpose, time, or place and advises obtaining professional legal advice when there is doubt.
That supports a structured conditions model and a strict boundary against autonomous legal
judgment.

YouTube's documented upload flow separates upload from publication and includes a copyright
Checks step intended to identify issues before publication, while warning that results are not
final. This reinforces two design choices: later external checks are a natural event, and
staging must remain distinct from final publication.

These sources establish that delayed, conditional, version-sensitive clearance is plausible.
They do not establish that creative teams will adopt this exact product, that every platform
exposes machine-readable decisions, or that an Agent may safely perform the proposed work.

## 4. The User Problem

### 4.1 Clearance decisions arrive after context has gone cold

The producer may request music, artwork, footage, talent, location, trademark, or distribution
rights during development or post-production. By the time a response arrives, the team may
have forgotten the exact intended use or changed the release plan.

### 4.2 A binary status hides the real work

“Approved” is rarely enough. A useful decision may include:

- territory;
- channel;
- media type;
- organic versus paid use;
- duration;
- start and expiry dates;
- attribution language;
- edit or asset version;
- audience or campaign restrictions;
- exclusivity;
- required notices;
- approved or excluded transformations.

The team must map these conditions to every planned variant.

### 4.3 Creative state keeps changing

While clearance is pending, a producer may:

- recut the trailer;
- change the music timing;
- add paid advertising;
- add a territory;
- change the launch date;
- create shorter social variants;
- update captions and attribution;
- replace a source asset;
- modify the target audience;
- add another distribution platform.

A decision that matched the original request may no longer match the current campaign.

### 4.4 Existing handoffs are manual and fragmented

Rights information may live in email, spreadsheets, legal documents, asset managers, review
tools, and release calendars. A producer must translate legal or operational conditions into
creative edits and channel decisions, then prove that the final package matches them.

### 4.5 The high-consequence boundary is easy to blur

An Agent can help assemble and adapt a package, but it should not make legal conclusions or
publish content merely because a status field says “approved.” The system needs a visible,
auditable division of responsibility.

## 5. Intended Users and Stakeholders

### 5.1 Primary user

An independent filmmaker, producer, creative lead, social-video team, agency producer, or
small brand team responsible for releasing media across several channels.

The reference persona is an independent producer preparing a short trailer that uses a licensed
music track and will be adapted for YouTube, Instagram, and paid promotion.

### 5.2 Other stakeholders

- music supervisor or rights coordinator;
- legal adviser or clearance specialist;
- rightsholder or licensing representative;
- editor and motion designer;
- brand or client approver;
- platform operations team;
- insurer, financier, or distributor concerned with chain-of-title;
- Host operator responsible for business state and the signed event outbox;
- Receiver operator responsible for Grants, event acceptance, replay control, and delivery;
- Local Connector and Continuation Adapter operator responsible for Agent activation.

### 5.3 Buyer and operator hypotheses

Possible buyers include creative agencies, independent production companies, brand studios,
rights-clearance providers, entertainment legal-operations teams, asset-management platforms,
and review-and-approval software vendors. The day-to-day operator could be a producer or rights
coordinator. The producer or production entity remains the final risk owner. These are market
hypotheses, not validated customer evidence.

## 6. Product Boundaries

Greenlight Relay is:

- a structured release and clearance coordination workspace;
- a demonstration of event-driven Agent re-entry;
- a place to bind clearance decisions to exact asset and campaign versions;
- a system for staging policy-compatible creative variants;
- a visible human decision surface;
- a source of provenance and continuation receipts.

Greenlight Relay is not:

- a law firm;
- a substitute for qualified legal advice;
- the authority that grants a licence;
- a system that infers rights from silence;
- a copyright-detection guarantee;
- a platform that publishes content automatically in the challenge MVP;
- an autonomous legal-risk acceptance system;
- a rights marketplace;
- a universal digital-asset-management replacement.

## 7. Core Scenario

### 7.1 Creative brief

The producer has a 45-second trailer called `Northstar Launch`. It uses music asset
`Track Aurora`, version `track-v3`, and has three planned release variants:

1. YouTube organic;
2. Instagram organic;
3. Instagram paid advertising.

The current launch plan targets the United Kingdom and United States for 60 days. The producer
has not yet received final music clearance.

### 7.2 Clearance request

The producer and Agent use Greenlight Relay to:

- identify the exact track and trailer version;
- list every intended channel, territory, campaign type, and date range;
- attach provenance and source documents;
- stage a clearance packet;
- create a re-entry offer for the later decision;
- grant one bounded continuation for this exact case and asset version.

The producer submits or sends the request through the normal authorized human or service
workflow. The Agent cannot invent a rightsholder or mark the request approved.

### 7.3 Work continues while the decision is pending

The producer changes the campaign after the request:

- the launch date moves forward;
- the YouTube caption changes;
- a paid-ad variant is added;
- the Instagram cut is shortened;
- the underlying music asset remains the same exact hash.

These changes create the need for contextual reconciliation later.

### 7.4 Conditional decision arrives

The authorized rights desk records:

```text
Decision: APPROVED_WITH_CONDITIONS
Asset: Track Aurora / exact submitted hash
Territory: United Kingdom only
Channels: YouTube organic, Instagram organic
Paid advertising: prohibited
Term: 60 days from 2026-09-10
Attribution: "Music: Track Aurora — Licensed from North Sound"
Edits: submitted timing and approved short-form cut only
```

The rights system emits `RIGHTS_CLEARANCE_DECIDED` with minimal routing and version data.

### 7.5 Agent re-entry

1. The Host backend commits the current decision state and emits a signed event.
2. Receiver Core validates the event against the exact Grant and case, then reserves one eligible
   delivery.
3. The Local Connector and Continuation Adapter activate the bound Agent in the original creative
   project context.
4. The Agent re-enters the live Greenlight Relay case page.
5. Pending-request tools disappear; decision and staging tools appear.
6. The Agent reads the structured current decision from the page.
7. It reads the current campaign, which differs from the original request.
8. The deterministic policy layer marks United States and paid-ad variants ineligible.
9. The Agent prepares a coherent release pack:
   - keeps the eligible UK YouTube variant;
   - keeps the eligible UK Instagram organic variant;
   - inserts the required attribution;
   - blocks the paid-ad variant;
   - excludes the United States variants;
   - explains whether the shortened cut matches the approved edit condition;
   - proposes a substitute-track path for excluded variants.
10. The page shows a staged pack and a rights-to-variant matrix.
11. The producer chooses whether to approve and schedule, replace the asset, seek broader
    clearance, or abandon the affected variants.

## 8. State Model

```text
DRAFT
  -> CLEARANCE_PACKET_STAGED
  -> AWAITING_CLEARANCE
  -> DECISION_RECEIVED
  -> RECONCILING
  -> RELEASE_PACK_STAGED
  -> HUMAN_APPROVED_RELEASE | NEEDS_NEW_CLEARANCE | ABANDONED
  -> SCHEDULED | PUBLISHED
```

The challenge Agent tool surface ends at `RELEASE_PACK_STAGED`. `HUMAN_APPROVED_RELEASE`,
`SCHEDULED`, and `PUBLISHED` are visible product states but not Agent-executable challenge
actions.

### 8.1 Decision subtypes

- `APPROVED`
- `APPROVED_WITH_CONDITIONS`
- `DENIED`
- `MORE_INFORMATION_REQUIRED`
- `EXPIRED`
- `REVOKED`

Each subtype can produce a different Site Tool frontier. A denial should not expose a tool that
stages the denied asset for release. It may expose a substitute or re-request preparation tool
instead.

## 9. Persistent Domain Objects

### 9.1 Creative project

```text
CreativeProject
- project_id
- owner_id
- title
- brief_revision
- launch_date
- target_territories[]
- target_channels[]
- campaign_types[]
- current_status
- created_at
- updated_at
```

### 9.2 Asset version

```text
AssetVersion
- asset_version_id
- project_id
- asset_kind
- display_name
- content_hash
- duration?
- source_provenance
- embedded_in_versions[]
- created_at
```

### 9.3 Release variant

```text
ReleaseVariant
- variant_id
- project_id
- creative_version_id
- channel
- territory
- campaign_type
- planned_publish_at?
- copy
- attribution
- status
- revision
```

### 9.4 Clearance case

```text
ClearanceCase
- case_id
- project_id
- asset_version_id
- request_revision
- requested_uses[]
- authority_id
- status
- submitted_at?
- current_decision_id?
- grant_id?
- continuation_binding_id?
```

### 9.5 Clearance decision

```text
ClearanceDecision
- decision_id
- case_id
- decision_revision
- status
- asset_content_hash
- allowed_territories[]
- allowed_channels[]
- allowed_campaign_types[]
- prohibited_uses[]
- starts_at
- expires_at
- required_attribution?
- approved_transformations[]
- excluded_transformations[]
- authority_signature
- decided_at
```

### 9.6 Release pack

```text
ReleasePack
- release_pack_id
- project_id
- campaign_revision
- decision_id
- decision_revision
- eligible_variant_ids[]
- blocked_variant_ids[]
- staged_changes[]
- unresolved_questions[]
- status
- created_by
- reviewed_by?
- created_at
```

## 10. Re-entry Offer and Grant

The page-authored offer should declare:

- exact clearance case;
- exact asset hash or version;
- eligible decision event types;
- continuation purpose;
- maximum runs;
- expiry;
- permitted reversible actions;
- actions that remain human-only;
- canonical re-entry URL;
- evidence and receipt expectations.

Representative conceptual offer:

```json
{
  "offer_id": "offer_clearance_case_88_v3",
  "subject": {
    "type": "clearance_case",
    "id": "case_88",
    "request_revision": 3,
    "asset_content_hash": "sha256:ab12..."
  },
  "event_types": [
    "RIGHTS_CLEARANCE_DECIDED",
    "RIGHTS_CLEARANCE_REVOKED"
  ],
  "maximum_runs": 1,
  "expires_at": "2026-10-01T00:00:00Z",
  "allowed_actions": [
    "READ_CURRENT_DECISION",
    "STAGE_COMPLIANT_RELEASE_PACK"
  ],
  "human_only_actions": [
    "ACCEPT_LEGAL_RISK",
    "DISPUTE_DECISION",
    "PUBLISH_RELEASE",
    "SCHEDULE_RELEASE",
    "BROADEN_REQUESTED_RIGHTS"
  ],
  "canonical_reentry_url": "https://greenlight.example/cases/case_88",
  "continuation_purpose": "Reconcile the decision against the current campaign and stage a compliant pack"
}
```

The grant stores the producer's accepted subset. An event with a different case, asset hash,
decision class, or origin must not resume the Agent.

## 11. Typed Event Contract

```json
{
  "event_id": "evt_clearance_190",
  "event_type": "RIGHTS_CLEARANCE_DECIDED",
  "occurred_at": "2026-09-08T15:30:00Z",
  "site_origin": "https://greenlight.example",
  "subject": {
    "case_id": "case_88",
    "request_revision": 3,
    "decision_id": "decision_44",
    "decision_revision": 1,
    "asset_content_hash": "sha256:ab12..."
  },
  "decision_status": "APPROVED_WITH_CONDITIONS"
}
```

The event contains no arbitrary instruction, legal analysis, attachment text, or publication
command. It tells Receiver Core that the Host backend committed an eligible state transition. The
Agent must re-enter the page to obtain the current authenticated decision and current campaign.

## 12. Site Tool Surface

### 12.1 Five-tool challenge inventory

| Tool | Availability | Purpose | Consequence |
|---|---|---|---|
| `get_release_case` | Before and after decision | Read current creative project, variants, asset versions, and case status | Read-only |
| `draft_clearance_packet` | Before submission | Stage exact intended uses and evidence for human review | Reversible write |
| `get_clearance_reentry_offer` | While awaiting clearance | Return the page-authored future event offer | Read-only |
| `get_clearance_decision` | After a decision | Read the structured signed decision and condition matrix | Read-only |
| `stage_compliant_release_pack` | After an eligible decision | Stage bounded copy, attribution, variant eligibility, block decisions, and one owned-asset or narrowed-campaign alternative | Reversible write |

The tool inventory must change with state. `draft_clearance_packet` should disappear after the
request is locked unless a formal revision workflow opens. `stage_compliant_release_pack`
should not exist before a current decision is available.

### 12.2 Optional future tools

- `stage_substitute_asset_plan`
- `request_clearance_revision_draft`
- `compare_campaign_to_decision`
- `export_chain_of_title_index`
- `prepare_expiry_migration_plan`

These are outside the recommended challenge surface because too many tools would dilute the
state transition.

## 13. Tool Input Constraints

`stage_compliant_release_pack` should accept only explicit structured changes, for example:

```json
{
  "expected_campaign_revision": 12,
  "expected_decision_revision": 1,
  "variant_updates": [
    {
      "variant_id": "variant_youtube_uk",
      "status": "ELIGIBLE_STAGED",
      "attribution": "Music: Track Aurora — Licensed from North Sound"
    },
    {
      "variant_id": "variant_instagram_paid_uk",
      "status": "BLOCKED_BY_CLEARANCE",
      "reason_code": "PAID_USE_PROHIBITED"
    }
  ],
  "idempotency_key": "grant_66:event_190:release_pack_1"
}
```

It should not accept arbitrary database patches, a free-form rights interpretation, hidden
publication instructions, or an unbounded list of external URLs.

## 14. Authority Matrix

| Decision or action | Rights authority | Page/policy engine | Agent | Producer |
|---|---:|---:|---:|---:|
| Determine whether rights are granted | Owns | Stores and verifies | No | No |
| Interpret structured allowed/prohibited fields | Supplies | Enforces | Uses for adaptation | Reviews |
| Decide legal sufficiency in ambiguous law | With qualified counsel | No | No | Owns with counsel |
| Read current campaign state | No | Owns | Yes | Yes |
| Identify campaign-condition conflicts | No | Computes hard conflicts | Explains and reconciles | Reviews |
| Stage attribution and eligible variants | No | Validates | Yes, within grant | Yes |
| Replace the creative asset | No | Supports workflow | May propose or stage | Decides |
| Broaden territories or channels | Must issue new rights | Enforces new request | Cannot grant | Requests |
| Publish or schedule | No | Human UI only in challenge | No | Owns |
| Accept residual legal risk | No | Records decision | No | Owns with counsel |
| Change the Agent grant | No | Offers scope | Cannot | Owns |

This matrix is the core trust story. The Agent accelerates the work without becoming the legal
or publication authority.

## 15. Human-Only Boundaries

The challenge Agent must not be able to:

- approve or deny rights;
- infer approval from silence or elapsed time;
- treat a platform copyright check as a final legal determination;
- accept a licence or changed legal terms;
- assert that an exception or fair-use doctrine applies;
- dispute a claim;
- assume legal risk;
- publish or schedule any creative;
- expand territory, term, channel, or campaign type;
- substitute an asset without showing the creative impact;
- alter attribution contrary to the signed decision;
- remove provenance or a blocking reason;
- change the grant, expiry, or run budget;
- expose confidential licence documents beyond the permitted audience.

The producer can use the Agent's staged work as decision support. The UI must state that the
workflow is not legal advice.

## 16. Why WebMCP Is Essential

### 16.1 The page owns the state transition

The useful action is not a generic response to an email. It depends on current authenticated
case status, asset hash, decision revision, campaign revision, and the tools exposed after the
decision.

### 16.2 Tools change materially

Before the event, the Agent can prepare a request and grant re-entry. After the event, those
tools disappear and decision-reconciliation tools appear. The visible transformation is a
direct expression of page state.

### 16.3 Canonical re-entry prevents stale action

The campaign may change while clearance is pending. Reading only the event or Agent memory
would miss those changes. Re-entry forces a fresh comparison.

### 16.4 First-party semantics are safer than scraping

The page exposes closed, rights-aware schemas and deterministic reason codes. A browser macro
could misread labels or click publish. A private API would make the demo application-specific
and hide the web-native action surface.

### 16.5 The pattern can generalize across creative services

A review tool, asset manager, licensing service, or publishing platform can describe its own
future event and current tools without receiving the producer's complete Agent workspace.

Removing WebMCP would reduce the idea to an internal workflow integration. Removing canonical
re-entry would make stale memory or the event payload an unsafe shadow source of truth.

## 17. Why Agent Judgment Is Essential

Hard rights constraints should be deterministic. The Agent earns its place by reconciling
those constraints with an evolving creative plan:

- determine which current variants map to the approved uses;
- apply required attribution consistently without damaging the creative brief;
- explain why one channel or territory is blocked;
- identify whether a new edit falls outside the approved version;
- choose between removing a track, replacing it, narrowing the campaign, or seeking broader
  rights;
- adapt copy and release notes for eligible channels;
- preserve the campaign's intent while changing its execution;
- surface missing evidence and uncertainty;
- prepare a concise human decision with trade-offs.

The Agent must not decide what the law means. It reasons over the structured decision and the
creative context.

### Agent-necessity kill test

If every decision can be applied through a fixed channel-by-territory matrix and attribution
template, a deterministic rules engine is sufficient. The demo must therefore include a real
creative or campaign change that creates several compliant options with different trade-offs.
The deterministic policy engine should identify what is forbidden; the Agent should decide how
to preserve the campaign's objective within what remains allowed.

## 18. Separation of Policy and Agent Reasoning

```text
Signed clearance decision
        |
        v
Deterministic rights policy engine
  - exact asset hash
  - decision revision
  - territory
  - channel
  - campaign type
  - term
  - attribution
  - transformation restrictions
        |
        +---- hard eligible / blocked / unresolved matrix
        |
        v
Agent reconciliation
  - current creative brief
  - changed campaign
  - variant selection
  - substitute options
  - copy and attribution placement
  - explanation and staged package
        |
        v
Human release decision
```

The Agent cannot override a hard `BLOCKED` cell. An `UNRESOLVED` cell routes to a human or
qualified rights reviewer, not to autonomous interpretation.

## 19. User Experience

### 19.1 Release case page

The primary page should show:

- trailer or campaign preview;
- exact asset and creative version hashes;
- planned channels, territories, campaign types, and dates;
- clearance status and decision authority;
- current request and decision revisions;
- visible Site Tool capability summary;
- re-entry grant, run count, expiry, and revoke control;
- condition-to-variant matrix;
- staged changes and blocked variants;
- pending human decision;
- complete continuation receipt.

### 19.2 Condition matrix

An immediately legible matrix is central to the demo:

| Variant | Territory | Channel | Use | Result | Reason |
|---|---|---|---|---|---|
| Trailer A | UK | YouTube | Organic | Eligible | Allowed; attribution inserted |
| Trailer B | UK | Instagram | Organic | Eligible | Allowed short-form cut |
| Trailer C | UK | Instagram | Paid | Blocked | Paid use prohibited |
| Trailer D | US | YouTube | Organic | Blocked | Territory not granted |

This makes the consequence of the external decision visible before the Agent explanation.

### 19.3 Re-entry grant card

The card should state in plain language:

> If the authorized rights desk decides this exact case before 1 October, resume this Agent
> once. It may read the decision and current campaign and stage a compliant release pack. It
> cannot publish, schedule, dispute, accept legal risk, or change the grant.

### 19.4 Human release panel

The final panel should offer human actions such as:

- Approve staged pack;
- Keep as draft;
- Replace the music;
- Request broader rights;
- Ask legal counsel;
- Abandon blocked variants;
- Revoke future continuation.

No “Agent publish” tool should exist in the challenge build.

## 20. Three-Minute Challenge Demo

### 0:00–0:35 — Establish the release problem

- Show the trailer and four planned variants.
- Show that the music asset is awaiting clearance.
- Ask the Agent to inspect the case and draft a precise request.

### 0:35–0:55 — Grant and leave

- Show the one-run, exact-asset re-entry offer.
- Grant `RIGHTS_CLEARANCE_DECIDED` with no publish authority.
- End or leave the active session.

### 0:55–1:15 — Change campaign state

- Use the human UI to add a paid-ad variant or change a launch detail while clearance is still
  pending.
- This proves that the Agent's old context alone will be stale.

### 1:15–1:35 — External decision

- In a judge-visible rights-desk simulator, issue a conditional approval.
- Show the typed event and accepted-delivery receipt.

### 1:35–2:30 — Agent resumes and re-enters

- The bound Agent resumes.
- It returns to the canonical case page.
- Request tools are gone; decision tools are present.
- It reads the signed condition matrix and current changed campaign.
- It stages eligible UK organic variants, inserts attribution, blocks paid and US variants,
  and stages one reviewable alternative release branch using an owned synthetic substitute
  track or a deliberately narrowed campaign.

### 2:30–2:50 — Human boundary

- Show the staged release pack and explanation.
- `Publish` and `Schedule` remain ordinary human controls and are not Site Tools.
- The producer chooses one visible next step or leaves the pack staged.

### 2:50–3:00 — Receipt and reset

- Show the event, grant, re-entry, tool delta, asset hash, changes, and boundary in one receipt.
- Reset the fixture.

## 21. Why It Should Win

### 21.1 The later event is intrinsic and consequential

Clearance decisions naturally occur after the creative session and materially change what can
be released. The asynchronous event is not invented merely to demonstrate background Agent
execution.

### 21.2 The old context is valuable but insufficient

The Agent benefits from knowing the creative brief, variants, and prior choices. Yet the
campaign and rights decision may have changed. This cleanly demonstrates why both persistent
Agent context and mandatory live page re-entry are necessary.

### 21.3 State-derived tools are visually obvious

Before the decision, the page exposes request and grant tools. After the decision, it exposes
decision and release-staging tools. The condition matrix makes the state transformation visible
to judges immediately.

### 21.4 It has a credible human-Agent division of labor

- the rights authority decides the rights;
- the server enforces hard conditions;
- the Agent adapts the creative plan;
- the producer approves release.

This is a stronger trust story than simply adding confirmation to an otherwise broad mutation
tool.

### 21.5 It demonstrates value beyond notification

A normal product can email “approved with conditions.” Greenlight Relay converts the decision
into useful, reviewable work: eligible variants, required attribution, blocked channels,
substitute options, and a coherent release pack.

### 21.6 It is professionally meaningful and emotionally legible

Creative teams understand the frustration of waiting on approval and then reworking a launch.
Judges can see the trailer, channel variants, green and red matrix cells, and final human gate.

### 21.7 It occupies useful competitive white space

Public WebMCP projects already demonstrate creative review, video editing, evidence capture,
privacy approvals, and shared-state tools. Greenlight Relay's distinct claim is a later,
authority-issued, version-bound rights decision that initiates bounded activation of the original
Agent context and transforms a current release plan. The competitive comparison remains
provisional and should be refreshed before any submission claim.

### 21.8 It is feasible to demonstrate safely

The challenge can use an owned synthetic trailer, an owned or synthetic track, a fictional
licence, a deterministic rights-desk simulator, and no production publishing. The whole golden
path can exist in one application with one primary page and one event.

### 21.9 It exposes the standard's broader potential

The same pattern can support brand approval, talent release, legal review, platform checks,
localization approval, accessibility review, insurance clearance, and distribution delivery.
The app is specific enough to demonstrate, while the mechanism remains domain-neutral.

## 22. Distinctive Capabilities

- exact asset-hash and creative-version binding;
- structured intended-use requests;
- delayed rights-decision events;
- one-run, revocable continuation grants;
- mandatory current-page re-entry;
- state-derived tool transformation;
- campaign-versus-clearance reconciliation;
- deterministic rights condition matrix;
- Agent-authored compliant release staging;
- required attribution insertion;
- territory and channel blocking;
- paid-versus-organic distinction;
- expiry-aware release planning;
- substitute-asset planning;
- version-conflict detection;
- human-only legal and publication boundary;
- private and human-readable receipts;
- deterministic judge reset.

## 23. Value Proposition

### 23.1 Producer value

- less time recovering the original creative and rights context;
- faster conversion of a decision into a usable release plan;
- fewer accidental channel, territory, or term violations;
- clearer visibility into what is eligible, blocked, or unresolved;
- easier preparation of substitute or re-clearance options;
- provenance connecting every variant to the decision used;
- reduced interruption without surrendering the release decision.

### 23.2 Rights-team value

- more precise intended-use requests;
- exact asset and version references;
- fewer ambiguous follow-up questions;
- structured decisions that downstream systems can enforce;
- evidence that conditions were reflected in the release pack;
- no need for direct access to the producer's full creative workspace.

### 23.3 Agency and client value

- auditable campaign readiness;
- less late-stage rework;
- faster client decision packages;
- clear separation between creative recommendation and legal authority;
- reusable workflows across projects and channels.

### 23.4 Continuation-platform value

- a high-value professional continuation workload;
- one clear event and one clear human consequence boundary;
- a demonstration of version binding, revocation, and receipts;
- a path to many other review-and-approval domains.

## 24. Business and Ecosystem Model

Potential models include:

- per-seat subscription for production teams;
- per-active-project or per-clearance-case pricing;
- enterprise workspace with policy templates and audit retention;
- rights-provider portal integration;
- white-label integration into review, asset, or campaign platforms;
- Receiver, Connector, and continuation conformance infrastructure;
- premium provenance and chain-of-title reporting.

The product should not monetize by recommending a particular licensing source without clear
disclosure. It should not charge based on approving more uses or encourage the Agent to weaken
rights constraints.

## 25. Adoption Incentives

### For creative teams

- the tool operates on existing release artifacts;
- the Agent does preparation work but leaves final release control visible;
- grants are exact, inspectable, and revocable;
- the workflow can begin with one high-friction asset class such as music.

### For rights desks

- requests become structured and version-specific;
- decisions can remain inside the authority's own system;
- only a minimal signed event leaves the decision system;
- the rights desk does not need the producer's Agent memory.

### For publishing platforms

- release packs arrive with clearer eligibility and attribution data;
- publication remains governed by the platform's current state and policies;
- platform checks can create their own future re-entry events without becoming legal
  determinations.

### For continuation providers

- one bounded run can create material value;
- low event frequency is more economically plausible than continuous monitoring;
- trust controls are easy to demonstrate and test.

## 26. Competitive Landscape

The following is a narrow public-repository comparison, checked on 2026-08-31. It is not an
official challenge gallery, exhaustive market study, or judgment of submission eligibility.

| Public project | Relevant overlap | Greenlight Relay distinction |
|---|---|---|
| [Creative Review Room](https://github.com/Genviral/webmcp-creative-review-room) | Human-in-the-loop creative research, copy staging, and review gate; deliberately no publish tool | Greenlight Relay begins with an external later rights decision and resumes a bound Agent after the original session |
| [Film the Gap](https://github.com/mkwatson/film-the-gap) | Evidence provenance, external contributor workflow, reviewed video, and rights-conscious publication | Greenlight Relay is about version-bound licence conditions transforming a current release plan, not acquiring missing product evidence |
| [Rough Cut](https://github.com/awesamarth/rough-cut) | Human-first WebMCP-native video editing and reviewable change sets | Greenlight Relay focuses on delayed rights authority, event-driven re-entry, and release eligibility |
| [Screen Blueprint Studio](https://github.com/Morita-Atsuya/screen-blueprint-studio) | Structured creative artifacts and reviewable Agent collaboration | Greenlight Relay adds an intrinsic external decision, dynamic post-event tools, and rights-condition enforcement |
| [ClearRights WebMCP](https://github.com/Vitali115/clearrights-webmcp) | Agent-prepared, human-approved, host-verified privacy changes | Despite the similar name, Greenlight Relay addresses creative IP clearance and release adaptation rather than privacy-rights requests |

### Competitive thesis

The candidate should not claim uniqueness based on “creative work plus human approval.” That
space already has strong examples. Its defensible challenge thesis is the complete temporal
mechanism:

```text
exact creative asset
  + external authorized decision
  + scoped future grant
  + bound Agent continuation
  + mandatory live re-entry
  + changed campaign state
  + deterministic condition enforcement
  + Agent adaptation
  + human release boundary
```

## 27. Technical Architecture

```text
Creative Case Page and Host Backend
  |  WebMCP Site Tools + Re-entry Offer + signed decision event
  v
Cloud Receiver / Receiver Core ---- opaque Host binding
  |
  |  bounded delivery lease
  v
Local Connector -> Continuation Adapter -> Creative Agent Workspace
  |
  v
Canonical Creative Case Page Re-entry
  |
  +-> Rights Policy Engine -> eligibility matrix
  |
  +-> Agent -> staged release pack
  |
  +-> Human release decision
```

### 27.1 Creative application

- project and campaign store;
- asset-version registry;
- clearance-case state machine;
- signed-decision store;
- deterministic rights policy engine;
- release-pack drafts;
- WebMCP registration derived from current state;
- rights-desk simulator for the challenge;
- deterministic reset fixture.

### 27.2 Receiver and continuation layer

- Receiver-owned Grant and revocation store;
- Receiver-owned event signature, replay, subject, asset, request, and decision-version checks;
- Receiver-owned run budget, delivery lease, and delivery receipt;
- Host-owned business state, signed event outbox, and opaque binding only;
- Local Connector delivery claim and acknowledgement;
- Continuation Adapter activation of the bound Agent context.

### 27.3 Agent workspace

- current creative brief and campaign rationale;
- approved copy and brand rules;
- source asset provenance;
- history of campaign changes;
- reasoned reconciliation;
- no ability to create or modify a rights decision.

### 27.4 Rights authority surface

- separate authenticated reviewer role or deterministic demo control;
- fixed synthetic decisions in the challenge;
- signed status transitions;
- no exposure of infrastructure secrets or Agent context;
- event outbox.

## 28. Security, Privacy, and Trust Model

### 28.1 Exact subject binding

The event, grant, request, and decision must refer to the same case and asset hash. A decision
for an earlier music edit cannot unlock a new edit silently.

### 28.2 Decision authenticity

Only an authenticated authority can create a decision. Events require signature or equivalent
origin integrity, timestamp validation, and replay protection.

### 28.3 Least authority

The grant covers one case, one decision event class, one run, a short expiry, and reversible
staging actions. It excludes publication, legal-risk acceptance, disputes, and grant changes.

### 28.4 Confidentiality

Licence documents may contain confidential rates or terms. The event carries minimal routing
data. The page returns only information appropriate to the authenticated producer. Receipts
must not make confidential terms public.

### 28.5 Untrusted content

Creative copy, filenames, reviewer notes, uploaded documents, and external metadata are data.
They cannot add tools, broaden rights, or alter the grant.

### 28.6 Version freshness

Every staged release pack includes the expected campaign and decision revisions. A concurrent
human edit causes a stale-state failure and fresh reconciliation.

### 28.7 No legal inference

Unknown, missing, contradictory, or ambiguous rights fields resolve to `UNRESOLVED`, not
`ALLOWED`. The Agent cannot convert uncertainty into permission.

### 28.8 Publication separation

The challenge has no Agent publish tool. A page status, platform check, or staged pack is not
proof that publication occurred.

## 29. Reliability and Failure Handling

| Failure | Required behavior |
|---|---|
| Duplicate decision event | Deduplicate; consume at most one run |
| Event for wrong case | Reject subject mismatch |
| Asset hash mismatch | Reject and require a new request or decision |
| Revoked grant | Reject before Agent resumption |
| Expired grant | Reject and show the event as unhandled |
| Decision revoked after staging | Mark the pack blocked and require human review |
| Campaign changed during Agent run | Reject stale revision and re-read once if policy allows |
| Decision fields incomplete | Mark affected variants unresolved |
| Conflicting licence conditions | Apply the stricter deterministic result and escalate |
| Required attribution too long for a channel | Block or stage an alternative placement for human review |
| Tool registration unavailable | Preserve ordinary human UI and stop Agent work safely |
| Continuation adapter unavailable | Record bounded retry state; do not claim a staged pack |
| Rights authority unavailable | Keep the case pending; never infer approval |
| Publish integration unavailable | Keep the pack staged; never claim release |
| Content replaced after decision | Invalidate asset binding and require new clearance |

## 30. Idempotency and Concurrency

`stage_compliant_release_pack` must be idempotent for the combination of grant, event,
campaign revision, and decision revision. Re-delivery returns the original result rather than
creating another pack.

If an editor changes a caption while the Agent is running, compare-and-set validation rejects
the stale pack. The Agent may refresh and re-stage only if the grant remains active and the run
policy permits it. Human edits should never be overwritten silently.

If a decision is revoked while a pack is awaiting human review, the application should mark
the affected variants blocked immediately. The human cannot approve an obsolete pack without a
fresh decision state.

## 31. Receipts and Provenance

Each continuation receipt should include:

- event ID and authenticated origin;
- grant ID and version;
- continuation binding;
- case, request, asset, campaign, and decision revisions;
- exact asset content hash;
- Site Tools available after re-entry;
- condition matrix observed;
- campaign state observed;
- Agent-staged changes;
- deterministic eligible, blocked, and unresolved reasons;
- artifacts and source versions used;
- human action required;
- run outcome and failure reason;
- timestamps and retry count.

Each release variant should retain a provenance link to the decision and pack that authorized
its staging. A later export can support, but not independently establish, chain-of-title.

## 32. Challenge MVP

### 32.1 Recommended scope if selected

- one synthetic trailer;
- one synthetic or owned music asset;
- one creative project;
- four visible channel/territory variants;
- one clearance case;
- one one-run grant;
- one conditional decision event;
- one changed campaign detail after the original session;
- five Site Tools;
- one deterministic policy matrix;
- one staged release pack with a material creative alternative beyond the matrix;
- one human-only release decision;
- one receipt and reset.

### 32.2 Explicit non-goals

- production legal advice;
- real music-rights marketplace integration;
- actual licence negotiation;
- real artist or label data;
- external platform publishing;
- autonomous scheduling;
- payment or royalty settlement;
- comprehensive rights ontology;
- production chain-of-title certification;
- public deployment claims without evidence;
- guaranteed production Agent wake-up;
- use of copyrighted challenge assets without permission.

## 33. Verification and Evidence Plan

### 33.1 Mechanism tests

- offer serialization and human-readable scope;
- grant creation, narrowing, expiry, and revocation;
- exact case and asset binding;
- event signature and replay protection;
- one-run consumption;
- bound continuation resolution;
- mandatory canonical re-entry;
- pre-event versus post-event tool inventory;
- human-only action absence;
- complete receipt creation.

### 33.2 Rights policy tests

- territory allow and deny;
- channel allow and deny;
- organic versus paid use;
- term start and expiry;
- required attribution;
- exact asset hash;
- approved transformation set;
- missing or contradictory fields become unresolved;
- denial exposes no release-staging path;
- revocation invalidates a staged pack.

### 33.3 Campaign tests

- campaign changes while pending;
- stale campaign revision rejection;
- eligible and blocked variants generated correctly;
- attribution inserted exactly;
- blocked variants cannot be marked eligible by Agent text;
- replacement asset requires new clearance;
- idempotent pack staging;
- deterministic reset.

### 33.4 Agent-value tests

- compare against a matrix-only deterministic baseline;
- present several compliant creative paths;
- measure preservation of campaign objective;
- verify that the Agent explains trade-offs without legal conclusions;
- verify that uncertainty routes to human review;
- verify that creative or reviewer text cannot expand rights.

### 33.5 Judge-visible evidence

- original session visibly ends;
- campaign visibly changes while pending;
- rights actor visibly issues the decision;
- event receipt links to the grant;
- bound Agent visibly resumes;
- canonical page re-entry is visible;
- tool inventory visibly changes;
- condition matrix and staged variant changes are visible;
- publish remains a human-only control;
- reset recreates the complete loop.

## 34. Success Metrics

Potential metrics include:

- time from clearance decision to review-ready release pack;
- percentage of variants classified correctly against structured conditions;
- attribution accuracy;
- stale asset or campaign detection rate;
- number of prevented out-of-scope releases;
- number of unnecessary manual context-recovery steps removed;
- Agent-versus-baseline quality on creative adaptation;
- unresolved-case escalation accuracy;
- duplicate side-effect rate;
- grant-revocation effectiveness;
- user understanding of authority boundaries;
- percentage of staged packs approved without correction;
- cost per meaningful continuation.

No metric is currently validated.

## 35. Principal Risks and Trade-offs

### 35.1 Legal-advice perception

Users or judges may interpret “rights-aware” as a claim that the Agent decides legality. The UI,
tools, data model, submission language, and demo must consistently show that an authorized
decision is an input and that ambiguous cases go to humans or counsel.

### 35.2 Structured-decision availability

Real rights decisions may arrive as documents or email rather than a clean schema. The
challenge can simulate a structured authority, but production adoption depends on integration
or review workflows that create reliable structured decisions.

### 35.3 Agent necessity

If the product only applies a licence matrix, deterministic software is preferable. The
creative adaptation must be material without allowing the Agent to reinterpret rights.

### 35.4 Domain explanation cost

Territory, channels, paid use, transformations, attribution, and asset versions can overwhelm
a short demo. The golden path must use only a few obvious conditions.

### 35.5 Version complexity

Creative projects contain many related source files and exports. Exact asset and edit binding
is necessary but can make the product feel operationally heavy.

### 35.6 External-event trust

A false approval event would be dangerous. Origin authentication, exact case binding, and
revocation behavior are central, not optional hardening.

### 35.7 Publication temptation

Automatic release would make the demo dramatic but would weaken the trust thesis and introduce
platform credentials, policy, and irreversible side effects. Staging is strategically stronger
for the challenge.

### 35.8 Production continuation uncertainty

The current project has not selected or proven the final production adapter for unattended
Agent resumption. The demo must report the bounded adapter honestly.

### 35.9 Customer workflow variation

Independent filmmakers, agencies, brands, and studios have different authority structures and
rights policies. The MVP should not claim a universal workflow.

## 36. Kill Conditions

Reject or materially redesign this candidate if:

1. users interpret the Agent as the authority that grants or interprets legal rights;
2. the product cannot obtain reliable structured decisions without expensive manual work that
   exceeds the value saved;
3. a deterministic matrix and template produce the same useful release pack;
4. the Agent does not need the original creative context;
5. the later event is not intrinsic to the actual workflow;
6. the asset and decision cannot be bound to exact versions;
7. the three-minute demo cannot communicate the condition matrix and human boundary clearly;
8. the scenario requires real copyrighted assets, confidential agreements, or production
   publishing to feel convincing;
9. revocation cannot invalidate a staged pack reliably;
10. no plausible buyer, operator, and final risk owner can be identified;
11. enrollment and clearance-structuring work exceeds the reactivation work saved;
12. the continuation adapter cannot produce a repeatable, honest event-to-re-entry proof.

## 37. Calibrated Candidate Scorecard

This is a research estimate, not a selection decision or validated product score. The
calibration distinguishes a deterministic rights-matrix product from Conditional Creative
Release. It predates the clarified Opportunity custom-question and bounded cross-site framing,
so it must not be treated as a current portfolio rank.

| Criterion | Weight | Matrix-only interpretation | Conditional creative release | Calibration rationale |
|---|---:|---:|---:|---|
| Real user pain | 15% | 2.3/3 | 2.4/3 | Delayed clearance and adaptation are verified; target-user demand is not |
| Intrinsic asynchronous event | 15% | 3.0/3 | 3.0/3 | External rights decisions naturally arrive later |
| WebMCP materiality | 15% | 2.5/3 | 2.9/3 | A matrix can come from an API; the current creative canvas and revisioned diff need the page |
| Continuity and state reuse | 10% | 3.0/3 | 3.0/3 | The original brief and intervening campaign changes both matter |
| Tool-surface transformation | 10% | 3.0/3 | 3.0/3 | Request tools become decision and staging tools |
| Human-Agent complementarity | 10% | 2.2/3 | 2.7/3 | Policy owns eligibility; Agent adapts creative intent; human owns release |
| Three-minute clarity | 10% | 2.8/3 | 2.8/3 | A matrix is legible, but the adapted release pack must carry the story |
| Build feasibility | 10% | 2.5/3 | 2.6/3 | One app and synthetic assets fit; re-entry remains the shared blocker |
| Judge reproducibility | 5% | 2.8/3 | 2.8/3 | Deterministic fixtures help, but the continuation adapter is unresolved |
| **Weighted total** | **100%** | **2.66/3** | **2.80/3** | Strong execution-safe candidate after the creative-continuation refinement |

The candidate's strength is conditional. User demand, Agent-versus-baseline value, and the genuine
continuation-to-WebMCP join remain unvalidated. Its reserve status follows a portfolio-level
judgment about Opportunity's greater WebMCP leverage and ambition, not a downgrade of Greenlight's
internal product coherence.

## 38. Evidence Required Before Selection

- interviews with independent producers, agencies, or rights coordinators;
- examples of real delayed conditional decisions and downstream rework;
- evidence that one target segment uses sufficiently structured conditions;
- a deterministic baseline comparison;
- a prototype showing that Agent creative adaptation adds material value;
- a usability test of the grant and legal boundary;
- a security review of decision authenticity and version binding;
- a timed three-minute storyboard rehearsal;
- validation that synthetic assets communicate the real problem credibly;
- a repeatable continuation adapter and receipt;
- an explicit choice of the initial buyer and operator;
- review of naming to avoid confusion with privacy-rights products.

## 39. Expansion Paths

If the core case succeeds, the mechanism can extend to:

- talent and appearance releases;
- location permissions;
- brand and trademark approval;
- client creative approval;
- broadcaster standards checks;
- accessibility review;
- localization and territory approval;
- platform copyright or policy checks;
- insurance clearance;
- music replacement before expiry;
- renewal events;
- licence revocation and takedown preparation;
- distributor delivery requirements;
- archive re-release review.

Each expansion should introduce its own typed event, authority model, tools, and human boundary.
The original grant must never silently cover a new class.

## 40. Open Product Questions

1. Is music clearance the clearest initial asset class, or would client brand approval be
   easier and safer to demonstrate?
2. Which target segment has the most frequent delayed conditional decisions?
3. Who creates the structured decision in production: rights desk, legal-operations tool,
   producer, or platform?
4. What minimum decision schema is both useful and realistic?
5. Which creative adaptation requires Agent judgment beyond a deterministic policy matrix?
6. How should the product distinguish legal uncertainty from a simple missing field?
7. What evidence should be retained, for how long, and for whom?
8. How does a revoked or expired right invalidate staged or already scheduled variants?
9. Should substitution be part of the primary flow or a human-selected branch?
10. Is final scheduling always human-only, or can a later product support a narrow pre-approved
    release window?
11. How should the UI communicate that a platform check is not a final legal determination?
12. Can the product integrate into existing asset and review systems without becoming a bespoke
    services project?
13. What is the clearest product name that does not imply the Agent grants rights?
14. Who owns the continuation cost while a case is pending?
15. What production adapter can resume the Agent reliably without continuous polling?

## 41. Naming and Narrative Options

### Primary working name

**Greenlight Relay**

### Alternative names

- Rights Re-entry
- Release Relay
- Cleared to Continue
- Rights-Aware Release Desk
- Signal to Release
- Conditional Greenlight
- Creative Clearance Relay

### Possible taglines

- “When clearance arrives, the right Agent resumes the release.”
- “A rights decision becomes a compliant creative next step.”
- “The greenlight brings the right Agent back to the campaign.”
- “Clearance changes. Campaigns change. Re-enter before release.”

The word “greenlight” must be explained carefully: the rights authority issues the decision;
the Agent does not.

## 42. Reference Sources

The following sources support the domain framing, not the implementation or product-demand
claims:

- [The WebMCP Challenge — Official Rules](https://webmcp.devpost.com/rules)
- [OpenAI — Site tools](https://learn.chatgpt.com/docs/webmcp)
- [WIPO — Rights clearance: A guide for independent filmmakers](https://www.wipo.int/web-publications/rights-clearance-a-guide-for-independent-filmmakers/en/index.html)
- [WIPO — Rights Clearance: from idea to distribution](https://www.wipo.int/web-publications/rights-clearance-a-guide-for-independent-filmmakers/en/2-rights-clearance-from-idea-to-distribution.html)
- [GOV.UK — Using somebody else's intellectual property: Copyright](https://www.gov.uk/using-somebody-elses-intellectual-property/copyright)
- [YouTube Help — Upload YouTube videos](https://support.google.com/youtube/answer/57407?hl=en)
- [YouTube Help — License types on YouTube](https://support.google.com/youtube/answer/2797468?hl=en-EN)
- [Adobe Workfront — Approval process overview](https://experienceleague.adobe.com/en/docs/workfront/using/review-and-approve-work/work-approvals/approval-process-in-workfront)
- [Rightsline — Avails and Conflict Engine](https://www.rightsline.com/features/avails-and-conflict-engine/)
- [Rightsline — Availability Feed](https://api-docs.rightsline.com/starter-packs/availability-feed)
- [Rightsline — Availability API dimensions](https://api-docs.rightsline.com/avails/avails-get-availability/availability-request-vs-rights-explorer)
- [Creative Review Room](https://github.com/Genviral/webmcp-creative-review-room)
- [Film the Gap](https://github.com/mkwatson/film-the-gap)
- [Rough Cut](https://github.com/awesamarth/rough-cut)
- [Screen Blueprint Studio](https://github.com/Morita-Atsuya/screen-blueprint-studio)
- [ClearRights WebMCP](https://github.com/Vitali115/clearrights-webmcp)

External pages were checked on 2026-08-31. Their inclusion does not imply endorsement of this
candidate or confirm any product integration.

## 43. Final Assessment

Greenlight Relay — Conditional Creative Release is the strongest execution-safe reserve among the
three current candidate ideas. A rights decision is an intrinsic later event. The same creative
intent still matters, the live campaign may have changed, and the tool surface can transform
visibly. The golden path can use one application, one page, one event, five tools, synthetic assets,
and no production side effect.

Its strongest “Why It Should Win” argument is not that AI understands copyright or that the
product computes a new rights matrix. Both claims are unsafe or competitively weak. The
winning argument is that WebMCP can turn an authorized external decision into a governed,
context-aware continuation: the bound Agent returns to current web state, reconciles a changed
campaign, stages a materially adapted release pack, and stops at the human release boundary.

Opportunity now has the stronger lead thesis because its clarified custom-review fixture makes
project context indispensable and its bounded arrival epilogue can prove cross-site composition.
Greenlight retains four comparative advantages: the most coherent single-app experience, the most
visual same-artifact diff, the clearest professional buyer, and the lowest narration and reset cost.
Those are substantive advantages, not merely “smaller scope.”

Selection should still depend on four hard validations: users must value the workflow, Agent
judgment must outperform a deterministic matrix on the adaptation task, judges must not read the
product as autonomous legal advice, and the continuation adapter must produce honest
judge-reproducible evidence. Greenlight should immediately replace Opportunity if the latter's
custom question is template-equivalent, its flight epilogue requires a bespoke integration, or its
two-act story cannot pass a timed stranger-comprehension test. This document preserves the
candidate in full detail. It does not select, implement, deploy, or validate the product.
