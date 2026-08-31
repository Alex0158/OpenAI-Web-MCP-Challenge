# Three-Candidate Competition App Selection Review

**Role:** SUPPORTING comparative baseline and post-review app-selection recommendation  
**Status:** Updated after candidate clarification; recommendation only, not an accepted app-selection decision  
**Candidates:** Opportunity-to-Arrival Relay, Sleepless Kingdom, Greenlight Relay  
**Evidence cutoff:** 2026-08-31  
**Last updated:** 2026-08-31

## Current post-review disposition

**Opportunity-to-Arrival Relay is the current provisional scenario-level lead, subject to an
accepted app-selection ADR and five immediate kill tests.** Greenlight Relay is the strongest
execution-safe reserve. Sleepless Kingdom remains the creative wild card, not the primary
challenge recommendation.

This update follows two design clarifications recorded in the Opportunity and Greenlight scenario
files: the application core now requires a reviewer-authored custom question that cannot be known
at enrollment, and the compact arrival epilogue is a causally connected cross-site interoperability
proof rather than a second equal product. Those clarifications invalidate the original assumption
that Opportunity was only a fixed staged form plus an unrelated flight feature.

Opportunity keeps the lead only if all five gates pass:

1. the custom-question fixture is materially open-ended rather than template-equivalent;
2. the project-aware Agent produces a better answer than a deterministic application baseline;
3. the application act remains complete and understandable before the arrival epilogue begins;
4. the cross-site handoff uses independent genuine Site Tools without transferring authority; and
5. the continuation path is honest, repeatable, and visible to a clean evaluator.

If any of the first three gates fails, Greenlight becomes the safer lead. No application is
selected in canonical project truth until TASK-001 closes through an accepted ADR.

## Original pre-clarification decision baseline and analysis

**Recommend Greenlight Relay — Conditional Creative Release as the lead challenge app, subject
to an accepted app-selection ADR and two immediate kill tests.** Keep a narrowed,
application-only Opportunity Relay as the reserve. Do not use Sleepless Kingdom as the primary
entry for this challenge.

Sections 4 through 13 preserve the pre-clarification Greenlight-led analysis, scorecards, demo
blueprint, and implementation order. They remain useful as dated comparative evidence but do not
control the current portfolio ranking. The current disposition above and the current recommendation
statement at the end of this record control this research document.

This recommendation does not select an application in canonical project truth. The current
selected demo app remains `None` until an ADR is accepted.

The winning version of Greenlight Relay is not an AI rights-management system and not a rights
matrix with a chat interface. It is a governed continuation product:

> A signed, conditional creative-rights decision arrives after the original work session. A
> previously authorized, project-bound Agent resumes, re-enters the current release workspace,
> discovers the tools valid for the new state, reconciles the decision with a campaign that has
> changed, stages a compliant alternative release pack, and stops before the human publish
> decision.

Why this candidate leads:

1. **It expresses the fixed re-entry mechanism with the smallest complete product.** One app,
   one page, one external event, one persistent creative artifact, approximately five Site
   Tools, one visible human boundary, and one deterministic reset are enough.
2. **The event is delayed, external, and consequential.** Rights clearance can take weeks and
   can force substitution or creative adaptation, so the later event is not invented for the
   demo.
3. **The live page matters.** A decision payload alone cannot establish the current campaign,
   asset revisions, staged variants, signed-in permissions, or currently valid actions.
4. **The Agent has a defensible synthesis task.** It must preserve the campaign objective while
   reconciling structured rights conditions, current asset state, and human creative intent.
   The deterministic policy engine still owns eligibility.
5. **The consequence is visual and safe.** Judges can see allowed, blocked, and newly staged
   variants without publishing real media or relying on private copyrighted assets.
6. **Its transport profile fits the candidate Cloud Receiver plus Local Connector topology
   better than the game.** Events are sparse and tolerate minutes rather than seconds, although
   the Connector-to-Agent-to-Browser/WebMCP join remains unproven and must be tested first.

The recommendation is conditional. Greenlight loses its lead if its resumed work is only a
deterministic eligibility matrix, if a clean evaluator cannot observe genuine page-bound
WebMCP re-entry, or if the product cannot demonstrate a changed creative decision that uses
the original project context.

## 1. Decision question and boundary

The question is not which idea sounds most ambitious. It is:

> Which web application makes the domain-neutral re-entry mechanism most necessary, valuable,
> original, understandable, and reproducible within the official challenge constraints and
> the remaining delivery window?

The mechanism is already separated from the application by
[ADR-0002](../Decisions/ADR-0002-separate-mechanism-from-demo-app.md). This review therefore
does not reopen the mechanism or choose a generic web-app stack. It compares the three
application mappings on top of the same fixed loop:

~~~text
user grants one bounded future continuation
    -> a real business event occurs after the session
    -> the Receiver accepts one eligible delivery
    -> the bound Agent context resumes
    -> the Agent re-enters the canonical live page
    -> fresh state exposes a changed WebMCP tool surface
    -> the Agent continues the same artifact or decision process
    -> a visible consequential action remains human-controlled
~~~

The [current selection framework](../Core/06-mvp-and-demo.md) remains controlling. A high
score cannot rescue a failed hard gate.

## 2. Official challenge lens

### 2.1 Verified current constraints

The following facts were refreshed from the official Devpost challenge surface on
2026-08-31:

- submissions close on **2026-09-03 at 1:00 PM Pacific / 20:00 UTC**;
- judges require a working live URL in ChatGPT's in-app browser or an eligible Chrome build;
- the public repository needs the runnable source, an open-source licence, and visible
  `document.modelContext.registerTool` implementation;
- the public YouTube demo must be under three minutes and include audio;
- existing work is eligible only when the post-August-25 WebMCP extension is meaningfully new
  and clearly documented; judges assess the new work;
- the four criteria are equally weighted: **WebMCP Leverage, Execution, Potential Impact, and
  Creativity & Ambition**;
- ties are resolved starting with the WebMCP Leverage score, then the remaining criteria in
  their published order; and
- the official resources emphasize a working hosted project, a clear live URL and testing path,
  and a sub-three-minute demo that clearly shows the functioning project and WebMCP use.

Sources: [challenge home](https://webmcp.devpost.com/),
[official rules](https://webmcp.devpost.com/rules), and
[official resources and announcements](https://webmcp.devpost.com/resources).

This review separately adopts an **internal demo heuristic**: make meaningful product behavior
visible in the opening 10–15 seconds and cut scope before cutting proof quality. That timing is a
team presentation choice, not a published organizer requirement.

At the 2026-08-31 01:26 UTC research checkpoint, fewer than 91 hours remained. That turns
execution risk into a first-order selection criterion rather than a secondary preference.

### 2.1.1 Challenge-period provenance

**HISTORICAL repository checkpoint:** at the 2026-08-31 research checkpoint, the inspected
visible Git history began at commit `e16dd44` on 2026-08-30 and the inspected `HEAD` was
`25634e0` on 2026-08-31. This is a dated provenance snapshot, not the current repository
identity. Both inspected timestamps fell inside the published submission period.

**CLAIM LIMIT:** commit timestamps do not prove that every imported idea or line of code was
first created during the submission period. The final public repository and submission must
identify the pre-challenge baseline, any imported or pre-existing work, and the meaningful
post-August-25 WebMCP application extension. Do not rely on repository creation time as a
substitute for honest provenance.

### 2.2 What official WebMCP guidance rewards

OpenAI describes Site Tools as actions offered alongside the interface people already use,
where the person and Agent work with the same live page and signed-in session. It distinguishes
WebMCP from an MCP/API integration that can operate independently of an open page and says the
page-bound approach is useful when both parties need the same canvas or dashboard.
[OpenAI Site Tools guide](https://learn.chatgpt.com/docs/webmcp)

Chrome's official design guidance starts with the user's goal, required context, boundaries,
initial state, and a role-played end-to-end journey. It also uses flight booking as its worked
example, which materially reduces the novelty of Opportunity Relay's flight epilogue.
[Chrome workflow guide](https://developer.chrome.com/docs/ai/webmcp/build-tools)

The security guidance treats externally sourced text as a prompt-injection surface, recommends
explicit tool annotations, and warns that probabilistic model safeguards cannot guarantee
safety. This favors narrow typed events, page-owned authority, and a human release boundary.
[Chrome security guide](https://developer.chrome.com/docs/ai/webmcp/secure-tools)

### 2.3 Competition implication

Registering several tools is necessary but not sufficient. The entry needs to make four facts
visible without an architecture lecture:

1. the human and Agent share a meaningful live product surface;
2. the later state changes what the Agent can and should do;
3. the Agent contributes judgment or synthesis that deterministic workflow does not replace;
4. the human remains visibly responsible for the consequential decision.

## 3. Research method and evidence discipline

The review used five independent lenses:

1. official challenge rules and current WebMCP product guidance;
2. the eleven hard gates and weighted scorecard in Core/06;
3. real-world workflow evidence and incumbent products;
4. direct WebMCP prior art and the current OpenAI showcase; and
5. current Re-entry Core evidence, its MVP1 and MVP2 provenance, continuation-adapter evidence,
   and the Cloud Receiver plus Local Connector reference topology.

Evidence labels in this document mean:

- **VERIFIED:** directly supported by current official sources, current repository evidence,
  or an inspected public implementation;
- **INFERENCE:** a reasoned conclusion from verified inputs;
- **WORKING ASSUMPTION:** required for planning but not validated;
- **UNKNOWN:** an unanswered fact that needs a named test.

No candidate has current user interviews, willingness-to-pay evidence, a selected production
adapter, or an implemented challenge vertical slice. The scores are decision estimates, not
validated product metrics.

## Mechanism Inheritance and Topology Implications

The application decision sits on top of the current mechanism work; it should not restart or
silently replace it.

### What the selected application inherits from Re-entry Core

`reentry-core/` is the authoritative application-neutral implementation baseline under
[ADR-0006](../Decisions/ADR-0006-establish-reentry-core-development-baseline.md). The selected
application should reuse or specialize its:

- separation of page-authored offer from Receiver-owned consent;
- exact Grant, subject, transition, expiry, revocation, and run-budget binding;
- typed event validation and prohibition on arbitrary event instructions;
- durable delivery ledger, replay control, idempotency, and acknowledgement semantics;
- mandatory canonical re-entry and fresh page authority;
- state-derived WebMCP tool exposure;
- visible human consequence boundary; and
- correlated evidence and negative-control discipline.

The app must not trade these properties for a faster-looking demo that treats a boolean, queue
enqueue, or caller-supplied task identifier as authority.

### What MVP1 and MVP2 still contribute

MVP1 remains the strongest experiment and evidence provenance for the authority semantics later
implemented in Re-entry Core. MVP2 contributes useful modularity and implementation seams even
though its runtime is not the authority model:

- a small Host SDK shape;
- explicit module boundaries around Receiver, adapter, and UI concerns;
- a replaceable Agent-adapter interface;
- observable diagnostics and demo controls; and
- reusable page/UI composition patterns.

MVP1 and MVP2 are references, not source roots for selected-app implementation. Selective reuse
must enter through current Re-entry Core contracts, preserve named provenance, and must not import
direct queue assumptions, shared raw task identity, JSON aggregate durability, or evidence claims
that the current branch did not prove. See the
[MVP1/MVP2 comparative review](17-mvp1-mvp2-comparative-integration-review.md) and
[selective integration provenance](22-mvp2-selective-integration-provenance.md).

### Application requirements choose the transport

ADR-0006 selects Cloud Receiver plus outbound Local Connector as the application-neutral reference
topology. It does not prove deployment, product fit, or a working Connector-to-Agent-to-Browser
join. The app-selection ADR must validate or reopen that reference topology using these planning
hypotheses:

| Candidate | Expected useful events per Grant | Natural wait | Maximum useful latency | Value of local project/session | Cloud Receiver + Local Connector fit |
|---|---:|---|---|---|---|
| Greenlight conditional release | Usually one | Days to weeks | Minutes likely acceptable | High for creative source, brief, and signed-in review canvas | **Strongest, conditional on the last-mile join and install cost** |
| Opportunity application-only | One to a few stage events | Days to months | Minutes to hours likely acceptable | Very high for source, evidence, and decisions | **Credible, but Connector adoption may exceed applicant value** |
| Sleepless Kingdom | Potentially many per day | Seconds to hours | Original fantasy implies seconds | Low to medium; doctrine matters more than a full project workspace | **Poor under current scope and evidence** |

These are not measured values. If a hosted Agent can safely access everything the selected app
needs, or if a notification, API, or deterministic job produces an equivalent result, the app ADR
should reopen the reference topology. If local project and signed-in Browser state are essential,
the Connector-to-Agent-to-Browser/WebMCP join is the first topology kill test.

## 4. Original head-to-head result before candidate clarification

| Candidate | Strongest real value | Defensible novelty | Main fatal risk | Recommended disposition |
|---|---|---|---|---|
| Greenlight Relay — Conditional Creative Release | Prevent post-clearance campaign reconstruction and avoid staging ineligible variants | A later authoritative decision resumes the same project-bound Agent into current creative state, where it adapts the release plan and stops at human publish | If the Agent only renders a deterministic rights matrix, WebMCP and Agent value collapse | **Lead recommendation; proceed to two kill tests and an app-selection ADR** |
| Opportunity Relay — Application Continuation | Reduce repeated context recovery across application rounds | The portal resumes the Agent that already understands the evolving underlying project | Existing portals already manage rounds and tasks; the two-app flight story dilutes execution and novelty | **Reserve; retain only the application-stage flow** |
| Sleepless Kingdom | Let players delegate bounded decisions in a persistent world | Governed temporal re-entry as a first-party game mechanic | Deterministic bot equivalence, direct game prior art, seconds-level latency, fairness, and multi-user demo fragility | **Defer; do not use as the primary entry** |

### Core strategic finding

The category labels are not the innovation:

- staged application portals already exist;
- first-party games and WebMCP-playable multiplayer games already exist; and
- rights, availability, conflict, and creative approval systems already exist.

The defensible contribution shared by all three candidates is the same:

> **Governed temporal re-entry:** an external event activates a bounded continuation of the
> same work, but the Agent must reacquire authority and current state from the live page before
> acting.

The application should be selected by how clearly it makes that mechanism indispensable. It
should not claim novelty for the incumbent domain workflow itself.

## 5. Opportunity-to-Arrival Relay

### 5.1 What is genuinely good

- **VERIFIED problem reality:** NIH estimates approximately 22 hours to complete a regular
  research project grant application, excluding the scientific plan.
  [NIH paperwork burden](https://www.grants.nih.gov/grants/paperwork-burden.htm)
- **VERIFIED bounded reconstruction problem:** in its review of four federal programs that help
  fund nondiesel school buses, GAO found duplicative application information across three EPA
  programs and reported that past applications could not simply be resubmitted because program
  requirements and applicant information can change between funding cycles.
  [GAO-25-106887](https://www.gao.gov/assets/gao-25-106887.pdf)
- The same underlying project evidence can remain valuable across stages while the project
  itself changes.
- Stage advancement is a natural, low-frequency, delayed event.
- State-specific tools are easy to explain: initial application tools disappear and
  review-stage evidence tools appear.
- The project-bound Agent context is more valuable here than in the game because source,
  tests, decisions, and artifacts can be reconciled against new requirements.

### 5.2 What the original framing overclaims

Existing application platforms already implement multi-round intake, task routing, review,
notifications, and stage progression:

- Good Grants supports arbitrary action stages, internal and external reviewers, and decisions
  that determine whether an application advances.
  [Good Grants action flow](https://help.goodgrants.com/hc/en-gb/articles/360001955915-Understanding-action-flow)
- Good Grants also supports multiple program rounds.
  [Good Grants rounds](https://help.goodgrants.com/hc/en-gb/articles/9233235247887-Ultimate-guide-to-rounds)
- Submittable Next models separate intake rounds and forms, including saved sections and
  third-party requests.
  [Submittable intake forms](https://next.support.submittable.com/hc/en-us/articles/30264162866583-Intake-Forms)

Therefore, stage orchestration is not the novelty. The claim must be narrower: the portal can
resume the Agent that already understands the work outside the portal and require it to
reconcile new portal state with current project truth.

The flight epilogue is strategically negative in the judged path:

1. flight booking is already the official Chrome WebMCP tutorial example;
2. it adds a second application, identity boundary, travel preference model, and purchase
   boundary;
3. it weakens the one-user/one-problem narrative; and
4. it consumes demo time without proving the temporal re-entry mechanism more deeply.

### 5.3 Best viable version

Rename the build-level concept **Application Continuation Relay** and implement only:

- one synthetic grant or competition application;
- one initial project brief and evidence pack;
- one later `FOUNDER_REVIEW_OPENED` or equivalent event;
- one requirement that changed after the first session;
- one Agent reconciliation against a changed project fact;
- one staged response package; and
- one human-only submission button.

The flight workflow may remain in the long-form scenario as a future interoperability
extension. It should not appear in the core three-minute submission unless the application
slice is already fully proven and the epilogue costs almost no additional failure surface.

### 5.4 WebMCP and Agent necessity test

WebMCP is material only when the live portal owns information that the project workspace does
not: the current round, deadline, exact questions, current permissions, prior submitted
revision, and currently valid submission actions.

The Agent is material only when at least one fixture requires cross-context synthesis, such as:

- a review question asks for technical evidence;
- the original answer cites an obsolete architecture;
- the repository now contains a safer design and new test evidence; and
- the Agent must explain the change without contradicting the original application.

If the response can be generated from a form template and a single stored profile, the
candidate fails its Agent-necessity test.

### 5.5 Product and commercial posture

The plausible buyer is the application or grant-platform operator, program owner, or an
enterprise application-operations team. The applicant is the beneficiary but is unlikely to
pay for a separate Connector solely for infrequent applications. This makes distribution and
integration heavier than the initial document implied.

The commercial wedge is not another general application portal. It is a continuation layer
that a portal can offer to applicants who already use an Agent-enabled project workspace.

### 5.6 Topology fit

The low event frequency and days-to-weeks waiting window are compatible with a Cloud Receiver
that stores an accepted event while the device is offline and a Local Connector that activates
the local workspace later. Useful latency is likely minutes, not seconds.

**UNKNOWN:** whether applicants will install and maintain a Connector for this value. A hosted
Agent or authenticated notification/deep-link may be a simpler substitute.

### 5.7 Original calibrated verdict

The broad two-app version is over-scoped. The application-only version remains a strong
reserve because it gives the original project context its clearest role. It should become the
lead only if Greenlight's creative adaptation proves deterministic or legally confusing.

## 6. Sleepless Kingdom

### 6.1 What is genuinely good

- The state transition is immediate and visually obvious.
- Persistent-world events naturally occur after the player leaves.
- Peace, threat, battle, and recovery can expose visibly different Site Tools.
- A first-party game can make Agent authority, action windows, budgets, and receipts explicit
  game rules rather than hidden automation.
- The concept is emotionally memorable and can demonstrate multi-user effects.

### 6.2 What the original framing underweights

#### Deterministic substitute

The game's hard rules already calculate legal actions, resources, cooldowns, and outcomes. A
transparent finite-state strategy can often respond faster, more cheaply, and more fairly than
an Agent. The Agent is justified only if bounded multi-factor strategy fixtures show material
quality gains over that baseline.

#### Category and fairness expectations

Major live-game operators explicitly classify bots and gameplay automation as prohibited
third-party software. Sleepless Kingdom avoids that policy violation only by being designed as
a first-party Agent-native game, but it still inherits the player's cheating intuition and
must explain fairness immediately.
[Supercell Safe and Fair Play Policy](https://supercell.com/en/safe-and-fair-play/)

#### Direct WebMCP prior art

[Open Mercy](https://github.com/alii13/open-mercy) is already a real-time multiplayer game
playable by humans and AI agents through WebMCP. It exposes live state, server-derived legal
moves, a `wait_for_turn` tool, and move tools over the same game logic used by humans. The
OpenAI WebMCP showcase also contains multiple games and creative experiences.
[OpenAI showcase](https://developers.openai.com/showcase?view=webmcp-apps)

Sleepless Kingdom's novelty therefore cannot be “an Agent plays a multiplayer web game.” It
would need to prove asynchronous, grant-bound, exact-context re-entry after the human leaves.

#### Transport and economics

The fantasy implies second-level reaction, frequent events, many concurrent players, and
adversarial event fan-out. The current project has not proved a supported adapter that wakes a
dormant Agent, acquires the Browser, and joins genuine page-bound WebMCP at that latency. A
Cloud Receiver plus Local Connector is a poor match if the device may be asleep or the action
window is short.

### 6.3 Best viable version

If preserved as future work, narrow it to a turn-based or five-minute decision-window game:

- one attacker fixture;
- one defender;
- one bounded doctrine;
- one event;
- one Agent decision among three legal defensive plans;
- no allied Agent cascade;
- no paid resources; and
- one server-authoritative receipt.

That version is safer and reproducible, but it also makes deterministic automation more
competitive and reduces the spectacular real-time claim.

### 6.4 Product and commercial posture

The buyer and operator are the game studio. The player may pay through normal game economics,
but charging specifically for better or more frequent Agent runs creates pay-to-win and
engagement-ethics risks. A reusable Agent-native game framework is a possible longer-term
developer product, but it expands the challenge beyond one coherent app.

### 6.5 Original calibrated verdict

Sleepless Kingdom should not be the primary challenge entry. It combines the hardest
transport profile, the weakest proof that Agent judgment is necessary, the largest build, and
the most direct category prior art. Its visual strength is real but cannot compensate for
those four independent risks under the current deadline.

## 7. Greenlight Relay — Conditional Creative Release

### 7.1 What is genuinely good

WIPO describes rights clearance as a continuous production concern that affects planning,
financing, and artistic choices. It notes that licensing a song can take much more than eight
weeks and that the outcome may be to license, substitute, remove, or use content differently.
[WIPO rights-clearance guide](https://www.wipo.int/web-publications/rights-clearance-a-guide-for-independent-filmmakers/en/2-rights-clearance-from-idea-to-distribution.html)

This supports four important product facts:

1. the later event is real and intrinsically delayed;
2. the original creative intent still matters after the decision;
3. the project may change while the decision is pending; and
4. the decision can require creative adaptation rather than only status display.

The human boundary is also natural. WIPO places production risk with the producer, and normal
publishing workflows distinguish staging from release. YouTube, for example, allows copyright
checks to run before or during publishing and does not make a check equivalent to final legal
authority.
[YouTube upload and checks](https://support.google.com/youtube/answer/57407?hl=en)

### 7.2 What the original framing overclaims

Rights-management and creative-approval systems already implement much of the deterministic
surface:

- Rightsline advertises continuous rights recalculation, configurable conflict logic, and
  availability across territory, platform, language, and time.
  [Rightsline Avails and Conflict Engine](https://www.rightsline.com/features/avails-and-conflict-engine/)
- Rightsline's API documentation also describes Availability Endpoints and message queues that
  notify integrations when availability changes and let scheduling or publishing systems fetch
  current windows. This makes a structured event input technically plausible, although it does
  not validate Greenlight's exact decision schema or customer demand.
  [Rightsline Availability Feed](https://api-docs.rightsline.com/starter-packs/availability-feed)
- Adobe Workfront already attaches approval processes to creative objects, supports status
  transitions, notifications, human approvers, and approve/reject/approve-with-changes flows.
  [Workfront approval overview](https://experienceleague.adobe.com/en/docs/workfront/using/review-and-approve-work/work-approvals/approval-process-in-workfront)

Direct WebMCP prior art also occupies adjacent creative and human-approval territory:

- [Creative Review Room](https://github.com/Genviral/webmcp-creative-review-room);
- [Film the Gap](https://github.com/mkwatson/film-the-gap);
- [Rough Cut](https://github.com/awesamarth/rough-cut);
- [Screen Blueprint Studio](https://github.com/Morita-Atsuya/screen-blueprint-studio); and
- [ClearRights WebMCP](https://github.com/Vitali115/clearrights-webmcp).

Therefore, Greenlight cannot claim novelty for a condition matrix, rights calculation,
creative review, or human approval. It also must not imply that the Agent interprets law or
grants permission.

### 7.3 Defensible product wedge

The candidate becomes materially stronger when positioned after the rights system and before
publication:

~~~text
rights authority or rights system
    -> issues one signed, structured, version-bound decision

Greenlight Relay
    -> resumes the project-bound Agent
    -> reads current campaign and asset state through the live page
    -> applies deterministic eligibility policy
    -> uses Agent synthesis to preserve the creative objective
    -> stages a reviewable alternative release pack

human producer
    -> accepts, edits, rejects, schedules, or publishes
~~~

The differentiator is not computing rights. It is converting a later authoritative decision
into a context-aware continuation of creative work without confusing context, policy,
authority, or final consequence.

### 7.4 Required challenge scenario

Use a fully synthetic trailer campaign:

- **Project:** `Northstar Launch`, a 30-second fictional trailer.
- **Initial objective:** launch awareness in the UK and US through organic social and paid
  placements.
- **Pending asset:** music track `Pulse-17`, clearance case revision 1.
- **Grant:** allow one continuation only for `MUSIC_DECISION_ISSUED`, case revision 1, with
  staging authority and no publish authority.
- **Intervening change:** while clearance is pending, the producer adds a US paid placement
  and changes the campaign deadline.
- **Decision:** UK organic is allowed with attribution; US and paid media are excluded; the
  licence window is bounded.
- **Resumed task:** the Agent re-enters the release page, reads both current campaign revision
  and the signed decision, identifies the new conflict, preserves eligible UK variants, and
  stages an alternative release pack for the blocked US paid branch using an owned synthetic
  substitute track or a narrowed campaign.
- **Human boundary:** the producer reviews the diff and alone chooses publish/schedule.

The key judge-visible artifact is not the matrix. It is the changed release pack and the
explanation of how the original objective was preserved under new constraints.

### 7.5 Required Site Tool delta

Use approximately five domain tools and derive availability from the canonical page state:

| State | Tool | Role |
|---|---|---|
| Pending | `get_release_case` | Read project, campaign, asset, and revision context |
| Pending | `stage_clearance_request` | Create or revise the pending structured request |
| Pending | `get_reentry_offer` | Explain the exact future event and bounded authority offer |
| Decided | `get_release_decision_context` | Read signed decision, current campaign, eligibility matrix, and version conflicts |
| Decided | `stage_adapted_release_pack` | Stage a reviewable, revision-bound creative continuation |

`publish_release`, `accept_licence`, legal interpretation, and rights issuance must not be Site
Tools in the challenge MVP.

### 7.6 Why WebMCP is material

An ordinary rights API can supply the decision. It cannot by itself establish the current
signed-in creative workspace, current campaign revision, staged variants, human-visible diff,
page permissions, or state-derived action surface. The Agent must return to the live page
because that page is the shared canvas and authority for the next creative step.

If the demo instead calls an API, computes a matrix, and writes a hidden record, WebMCP becomes
decorative and the candidate fails.

### 7.7 Why the Agent is material

The deterministic policy layer decides eligibility. The Agent must not override it. The
Agent's job is to synthesize a good next creative plan under competing constraints:

- preserve the original campaign objective;
- respect the newly issued decision;
- account for campaign changes made during the wait;
- choose between substitute asset, reduced channel scope, revised timing, or escalation;
- maintain consistent messaging across variants; and
- produce a human-reviewable rationale and diff.

The test must compare this against a deterministic baseline that merely marks allowed and
blocked cells. If both outputs are functionally equivalent, Greenlight fails its Agent-value
gate.

### 7.8 Product and commercial posture

The most plausible initial product layer is an integration or companion layer for creative
operations, review, DAM, or rights platforms—not a replacement rights system.

- **Primary beneficiary:** producer or creative-operations lead.
- **Operator:** rights coordinator or creative-operations administrator.
- **Buyer hypothesis:** agency, production company, studio, or platform operating repeated
  campaigns.
- **External authority:** rights desk, counsel, licensor, or structured rights system.
- **Final risk owner:** human producer and the organization's existing approval chain.

The economic claim should remain modest until validated: Greenlight may reduce time-to-safe
next draft and reconstruction errors after delayed decisions. It has no current evidence of
willingness to pay, frequency, or net savings after setup and review costs.

### 7.9 Topology fit

Greenlight has the best fit with the application-neutral reference
[Cloud Receiver plus Local Connector topology](21-cloud-receiver-local-connector-candidate-topology.md):

- decisions are low-frequency and typically arrive after hours or days;
- the Cloud Receiver can accept a bounded signed decision while the device is offline;
- the Local Connector can later use the local project and signed-in Browser context;
- useful latency is likely minutes, not seconds; and
- one no-op or activation cost can be small relative to a high-consequence release decision.

This is still a topology hypothesis. The earliest implementation gate is not the hosted
Receiver. It is one foreground Connector proving the exact
Connector-to-Agent-to-Browser/WebMCP join with a read-only tool call. Failure must demote or
replace the topology rather than trigger a larger cloud build.

### 7.10 Original calibrated verdict

Greenlight is the strongest candidate only in its **Conditional Creative Release** form. A
rights-matrix-only version is less differentiated and less Agent-dependent than the original
2.92/3 score implied. The refined version leads because it turns the same event into a visible
continuation of the original creative artifact.

## 8. Original hard-gate review

Legend: `PASS` means the recommended narrow version has a credible answer; `CONDITIONAL`
requires a named pre-build test; `FAIL` means the current candidate should not be selected.

| Core/06 hard gate | Opportunity application-only | Sleepless Kingdom | Greenlight conditional release |
|---|---|---|---|
| 1. Observed current problem | CONDITIONAL — burden is verified; re-entry demand is not | FAIL — attention burden is plausible; demand for Agent delegation is not observed | CONDITIONAL — delayed clearance/rework is verified; target-user demand is not |
| 2. Real later event | PASS | PASS | PASS |
| 3. Same work matters across event | PASS | CONDITIONAL — doctrine persists, broader context is weak | PASS |
| 4. Live-page return required | PASS if current portal questions and revision are authoritative | PASS for live world state | PASS for current campaign, assets, permissions, and diff |
| 5. Current state changes tools | PASS | PASS | PASS |
| 6. Visible human boundary | PASS — final submission | CONDITIONAL — many game actions are designed to be autonomous | PASS — publish/schedule |
| 7. Synthetic/public data | PASS | PASS | PASS |
| 8. Explicit product layer | CONDITIONAL — portal integration layer | PASS — first-party game | PASS — creative-ops integration/companion |
| 9. Under-three-minute clarity | PASS only after flight removal | CONDITIONAL — visually clear but system-heavy | PASS |
| 10. Build without large dependency | PASS in one-round version | FAIL under current multi-user scope | PASS with synthetic rights authority |
| 11. Removing WebMCP materially weakens it | CONDITIONAL — must prove shared portal/workspace reconciliation | CONDITIONAL — game API or server bot may be equivalent | PASS only when the live creative canvas and revisioned diff are essential |

Strictly applied, none has fully passed Gate 1 because no candidate has direct user evidence.
The decision is therefore a ranked research recommendation, not permission to claim product
validation. Greenlight and Opportunity can proceed to fast falsification; Sleepless has
additional independent failures and should be deferred.

## 9. Original calibrated scorecards

### 9.1 Internal Core/06 scorecard

Scale: 0–3. These estimates deliberately reduce scores where the original documents treated
plausibility as evidence.

| Candidate scope | Pain | Event | WebMCP | Continuity | Tool delta | Complementarity | Clarity | Feasibility | Reproducibility | Weighted total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Opportunity — original two-app scope | 2.2 | 3.0 | 2.6 | 3.0 | 3.0 | 2.3 | 2.1 | 1.4 | 1.6 | **2.43/3** |
| Opportunity — recommended application-only scope | 2.4 | 3.0 | 2.9 | 3.0 | 3.0 | 2.7 | 2.8 | 2.5 | 2.5 | **2.77/3** |
| Sleepless — current scope | 1.6 | 3.0 | 2.2 | 2.2 | 3.0 | 1.4 | 2.7 | 1.2 | 1.4 | **2.14/3** |
| Greenlight — rights-matrix-only interpretation | 2.3 | 3.0 | 2.5 | 3.0 | 3.0 | 2.2 | 2.8 | 2.5 | 2.8 | **2.66/3** |
| Greenlight — recommended conditional creative release | 2.4 | 3.0 | 2.9 | 3.0 | 3.0 | 2.7 | 2.8 | 2.6 | 2.8 | **2.80/3** |

Weights are 15%, 15%, 15%, 10%, 10%, 10%, 10%, 10%, and 5%, in the order shown. The
totals do not override unresolved hard gates.

### 9.2 Official-criteria estimate

Scale: 0–5, equally weighted. Ranges express uncertainty and are more decision-useful than a
false precise rank.

| Recommended scope | WebMCP Leverage | Execution | Potential Impact | Creativity & Ambition | Base estimate | Confidence |
|---|---:|---:|---:|---:|---:|---|
| Greenlight — conditional creative release | 4.3–4.8 | 4.0–4.6 | 3.6–4.3 | 3.7–4.4 | **4.2/5** | Medium; hinges on visible non-deterministic adaptation |
| Opportunity — application-only | 4.0–4.6 | 3.7–4.4 | 3.4–4.2 | 3.3–4.1 | **4.0/5** | Medium; hinges on project-context reconciliation and buyer clarity |
| Sleepless — narrowed decision-window game | 3.3–4.2 | 2.4–3.6 | 2.1–3.3 | 2.7–3.8 | **3.1/5** | Low; latency, bot substitute, and prior art dominate |

The estimated difference between Greenlight and Opportunity is smaller than the uncertainty.
That is why the recommendation includes an explicit sensitivity rule rather than treating the
rank as mathematically proven.

## 10. Original sensitivity analysis

### 10.1 When Opportunity becomes the better choice

Switch the lead to the application-only Opportunity candidate if any of the following occurs:

1. Greenlight's Agent output is functionally identical to the deterministic rights matrix;
2. reviewers consistently interpret Greenlight as legal advice despite boundary copy;
3. the synthetic creative artifact cannot make the before/after adaptation visually clear;
4. one target applicant workflow provides better observed user evidence and a clearer buyer;
5. a project-context fixture demonstrates a stronger measurable advantage than the creative
   adaptation fixture.

### 10.2 When Sleepless becomes competitive

Sleepless rises only if all of these are proven early:

- a first-party game with a decision window measured in minutes rather than seconds;
- an Agent that materially beats a transparent deterministic doctrine on pre-registered
  fixtures;
- a single-user resettable demo that still makes another participant's event visible;
- a supported, reliable, low-cost re-entry path; and
- a narrative clearly distinct from existing WebMCP-playable games.

That proof set is too large for the current deadline, so it does not alter the recommendation.

### 10.3 Shared fatal dependency

All three candidates fail as a competition demonstration if the team cannot honestly show:

~~~text
accepted event
    -> bounded activation of the intended Agent context
    -> eligible Browser acquisition
    -> canonical page navigation
    -> fresh genuine Site Tool discovery and invocation
    -> visible same-artifact continuation
~~~

Queue acceptance, a manual prompt, REST substitution, DOM automation, generic MCP, or an
unbound new Agent turn must not be narrated as supported WebMCP re-entry.

## 11. Original recommended competition concept

### 11.1 One-sentence product thesis

**Greenlight Relay is a conditional creative-release workspace that turns a later signed
rights decision into a governed continuation of the same campaign, while the live page keeps
current state authoritative and the human retains release control.**

### 11.2 What it simplifies

It simplifies the post-decision restart:

- no human needs to recover the old brief and explain the full project again;
- no one has to manually compare the decision against every current campaign variant;
- stale pre-decision drafts are not treated as current authority;
- allowed and blocked branches are made visible in one release workspace; and
- the next creative option is staged where the human can review it.

### 11.3 What it automates

It automates only bounded preparation:

- receive and validate one signed event;
- resume one previously authorized continuation;
- fetch current state and changed tool inventory;
- apply deterministic eligibility policy;
- synthesize an adapted release pack;
- write a version-bound draft and receipt.

It does not automate rights issuance, legal judgment, licence acceptance, payment, scheduling,
or publication.

### 11.4 Why it is innovative

The innovation is the cross-time collaboration contract:

- the website can invite a future continuation without granting it;
- the user authorizes a narrow event and effect envelope;
- the event activates the same work context rather than a generic bot;
- the Agent must reacquire page authority and current tools;
- the artifact continues across a real interruption; and
- authority remains distributed among the rights issuer, policy layer, Agent, page, and human.

This is more defensible than claiming a new rights database, a new approval system, or an AI
that understands copyright.

### 11.5 Plausible commercial value

The initial commercial hypothesis is reduced time-to-safe-next-draft for teams that run many
versioned campaigns and wait on external approvals. The likely route is an integration into an
existing creative-operations or rights ecosystem. A standalone consumer subscription is not
currently supported by evidence.

Commercial validation must measure:

- delayed decisions per team per month;
- minutes of reconstruction and variant review per decision;
- error or rework rate caused by stale campaign assumptions;
- percentage of decisions that require genuine creative adaptation;
- setup, consent, review, and Connector burden; and
- willingness to pay by the operator or buyer.

## 12. Original Greenlight three-minute demo blueprint

The demo should show product behavior before architecture.

### 0:00–0:15 — Show the result first

Open the release workspace on a visible before/after split: the original campaign, the later
conditional decision, one blocked placement, and one newly staged compliant alternative.
State the problem in one sentence.

### 0:15–0:40 — Establish the pending case

Reset. Show the synthetic trailer, current campaign, pending music decision, and project-bound
Agent collaboration. Register the exact one-event grant and show that publish is excluded.

### 0:40–0:55 — End the original interaction

Close or end the Agent turn. Show the pre-event zero-effect checkpoint: no accepted event, no
activation, no staged post-decision pack.

### 0:55–1:15 — Change live business state

As the human, add the US paid placement and change the campaign deadline while the decision is
still pending. This proves stale context is insufficient.

### 1:15–1:35 — Issue the event

Use a synthetic rights-authority control to issue the signed conditional decision. Show one
accepted delivery and the exact bound workflow/version.

### 1:35–2:25 — Re-enter and continue

Show the intended Agent context resume, canonical page navigation, the old tools gone, the new
decision tools present, a fresh state read, and one invocation that stages the adapted release
pack. Make the changed visual artifact the focus.

### 2:25–2:45 — Show governance

Show the receipt, exact conditions, version binding, and why the US paid branch was not staged
with the original music. Show that the Agent cannot publish.

### 2:45–3:00 — Human boundary and thesis

The producer reviews the diff and clicks a non-production synthetic approval or leaves it for
review. End with the domain-neutral claim: an external event resumed the right Agent, but the
live page and human remained authoritative.

## 13. Original Greenlight implementation and kill-test order

The deadline makes ordering critical. Do not productionize or deploy the full Cloud Receiver
before the selected app and last-mile requirements are clear.

### Gate A — Fifteen-minute stranger-comprehension test

Use a static storyboard. Pass only if a viewer can state:

- who waited for what;
- what changed while the user was away;
- why the same Agent context mattered;
- why the Agent returned to the page; and
- which final action remained human-only.

### Gate B — Deterministic baseline versus Agent fixture

Create one frozen input with a conditional decision and an intervening campaign change.
Compare:

1. baseline matrix output; and
2. Agent-produced adapted release pack.

Pass only if independent review finds the Agent output materially more useful while remaining
policy-compliant. Otherwise switch to Opportunity.

### Gate C — Connector-to-Agent-to-Browser/WebMCP join

Use one foreground Local Connector and the smallest declared adapter. Pass only on genuine
read-only Site Tool discovery and invocation in the intended context. Do not build distributed
delivery until this last mile works.

### Gate D — One-page product slice

Build one state machine, one page, five tools, one synthetic fixture, one event control, one staged
artifact, one human boundary, and one reset. Specialize the current Re-entry Core contracts. Use
MVP1 and MVP2 only as provenance-aware references where they do not weaken those contracts.

At the same time, maintain a small provenance table linking each judged feature to its
challenge-period commit and identifying any pre-existing mechanism or imported contributor
work. The public narrative should make the new selected-app experience and WebMCP extension
unambiguous.

### Gate E — End-to-end and clean-room proof

Add the smallest event transport, correlated timeline, duplicate handling, stale-revision
rejection, revocation, and public evaluator instructions. Test in the actual eligible browser.

### Stop conditions

Stop and choose the reserve candidate or simplify the claim if:

- Gate B fails;
- Gate C cannot produce honest evidence quickly;
- the three-minute rehearsal exceeds 2:50 before error margin;
- the live path depends on private assets or production rights data;
- the implementation needs more than one primary page or event; or
- the human boundary is not visible without narration.

## 14. Unresolved evidence and claim limits

### Verified

- official challenge requirements and criteria;
- WebMCP's live-page and signed-in-session value proposition;
- real grant/application burden and existing staged-application products;
- real delayed rights-clearance and creative-adaptation patterns;
- existing rights/approval product capabilities;
- direct WebMCP game and creative prior art;
- current project evidence that the domain-neutral P0 mechanism is composable in bounded
  tests; and
- current project evidence that the production Agent-to-Browser/WebMCP join remains unresolved.

### Working assumptions

- a synthetic creative case will be emotionally and professionally legible to judges;
- the Agent can produce a visibly better alternative release pack than deterministic policy;
- minute-level continuation latency is sufficient;
- one selected Host/Agent environment can expose the required local project context; and
- a judge can reproduce the chosen path without unsupported private setup.

### Unknown

- user demand and willingness to pay for any candidate;
- actual delayed-decision frequency and reconstruction cost in the chosen segment;
- supported production continuation adapter;
- clean evaluator install and identity path for a Local Connector;
- net economics after model use, enrollment, review, support, and failed delivery; and
- whether the final implementation can be completed, deployed, and recorded before the
  submission lock.

Do not claim the application is validated, deployed, judge-reproducible, commercially proven,
or selected until current evidence supports those statements.

## 15. Source register

### Official challenge and WebMCP

- [The WebMCP Challenge](https://webmcp.devpost.com/)
- [Official rules](https://webmcp.devpost.com/rules)
- [Challenge resources and announcements](https://webmcp.devpost.com/resources)
- [OpenAI Site Tools guide](https://learn.chatgpt.com/docs/webmcp)
- [Chrome WebMCP workflow guidance](https://developer.chrome.com/docs/ai/webmcp/build-tools)
- [Chrome WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [OpenAI WebMCP showcase](https://developers.openai.com/showcase?view=webmcp-apps)

### Opportunity evidence and substitutes

- [NIH paperwork burden](https://www.grants.nih.gov/grants/paperwork-burden.htm)
- [GAO-25-106887](https://www.gao.gov/assets/gao-25-106887.pdf)
- [GAO-16-573](https://www.gao.gov/products/gao-16-573)
- [Good Grants rounds](https://help.goodgrants.com/hc/en-gb/articles/9233235247887-Ultimate-guide-to-rounds)
- [Good Grants action flow](https://help.goodgrants.com/hc/en-gb/articles/360001955915-Understanding-action-flow)
- [Submittable Next intake forms](https://next.support.submittable.com/hc/en-us/articles/30264162866583-Intake-Forms)

### Sleepless evidence and prior art

- [Supercell Safe and Fair Play Policy](https://supercell.com/en/safe-and-fair-play/)
- [Open Mercy](https://github.com/alii13/open-mercy)

### Greenlight evidence, substitutes, and prior art

- [WIPO rights-clearance guide](https://www.wipo.int/web-publications/rights-clearance-a-guide-for-independent-filmmakers/en/2-rights-clearance-from-idea-to-distribution.html)
- [GOV.UK copyright guidance](https://www.gov.uk/using-somebody-elses-intellectual-property/copyright)
- [Rightsline Avails and Conflict Engine](https://www.rightsline.com/features/avails-and-conflict-engine/)
- [Rightsline Availability Feed](https://api-docs.rightsline.com/starter-packs/availability-feed)
- [Rightsline Availability API dimensions](https://api-docs.rightsline.com/avails/avails-get-availability/availability-request-vs-rights-explorer)
- [Adobe Workfront approval overview](https://experienceleague.adobe.com/en/docs/workfront/using/review-and-approve-work/work-approvals/approval-process-in-workfront)
- [YouTube upload and checks](https://support.google.com/youtube/answer/57407?hl=en)
- [Creative Review Room](https://github.com/Genviral/webmcp-creative-review-room)
- [Film the Gap](https://github.com/mkwatson/film-the-gap)
- [Rough Cut](https://github.com/awesamarth/rough-cut)
- [Screen Blueprint Studio](https://github.com/Morita-Atsuya/screen-blueprint-studio)
- [ClearRights WebMCP](https://github.com/Vitali115/clearrights-webmcp)

External sources were inspected on 2026-08-31. Vendor pages establish existing capabilities
and competitive substitutes, not independent performance validation.

## Original recommendation statement

Advance **Greenlight Relay — Conditional Creative Release** to a short app-selection ADR after
Gates A and B. In parallel with the ADR, run the bounded Connector-to-Agent-to-Browser/WebMCP
kill test before building the Cloud Receiver. Preserve **Application Continuation Relay** as
the immediate reserve and remove flight from its judged path. Preserve **Sleepless Kingdom**
as future exploration, not current challenge scope.

This is the smallest option that makes the project's real contribution—the governed return of
the right Agent to the right live page at the right later moment—both visible and useful while
leaving enough execution margin to submit a coherent product rather than an ambitious proof
assembly.

## Current recommendation statement

Advance **Opportunity-to-Arrival Relay** to TASK-001's app-selection ADR only after its
custom-question, Agent-versus-deterministic-baseline, timed two-act comprehension, and independent
cross-site Site Tool gates pass. The judged core is application continuation; the arrival epilogue
is optional and must be removable without weakening that proof. Preserve **Greenlight Relay** as
the immediate execution-safe reserve and **Sleepless Kingdom** as a creative wild card.

This ranking remains supporting research. It does not select, implement, deploy, or validate the
Host application, continuation adapter, or challenge entry.
