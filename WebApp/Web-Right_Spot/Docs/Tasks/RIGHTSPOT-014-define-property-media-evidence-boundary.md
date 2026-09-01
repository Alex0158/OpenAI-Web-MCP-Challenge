# RIGHTSPOT-014: Define the property-media evidence boundary

**Type:** `decision`  
**Lifecycle:** `pending`  
**Priority:** `P1` for evaluator-facing visual credibility, independent of the Operations authority lane  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** ADR-RS-0009; the closed `RIGHTSPOT-007` Field Desk surface; the accepted tenant listing/detail route contract

## Task Control

- Type: `decision`
- Lifecycle: `pending`
- Priority: `P1`
- Owner: Main RightSpot thread
- Objective: Define the smallest truthful local property-media contract that replaces the current
  placeholder treatment without expanding rental workflow, route, data, or external-service scope.
- Current increment: `RS-WO-014-01` is a read-only UI/Asset Direction proposal. It must establish the
  asset manifest, listing-to-asset identity, alt-text and presentation rules, loading/error behavior,
  and the exact later implementation split before any binary asset or UI source is changed.
- Next gate: The main thread reviews the proposal and either registers a bounded asset/UI implementation
  slice or records a defer/reject disposition with its residual visual risk.
- Execution posture: `READ_ONLY_UI_ASSET_ADVISOR`; this task must not reopen the closed MVP or modify
  the Operations, authentication, WebMCP, Cloud Receiver, or workflow boundaries.

## Why this task exists

The accepted Field Desk visual direction calls for natural daylight synthetic property imagery, but the
integrated tenant discovery surface still renders a CSS media placeholder labelled `Seeded rental`.
That placeholder is useful for deterministic development evidence but weakens the evaluator-facing
rental-marketplace impression. A local asset increment may materially improve trust and visual quality,
but it must remain reproducible, copyright-safe, accessible, and bounded to the existing listing
identity. This task first resolves the asset contract so generated media does not become an unowned
or misleading source of property facts.

## Working direction to challenge

The Advisor must test these assumptions against current source rather than treat them as accepted
implementation authorization:

- Use local, synthetic, natural-daylight property imagery with no faces, logos, documents, watermarks,
  identifiable real addresses, or implied factual evidence beyond the listing record.
- Keep one deterministic asset identity per seeded listing, with an explicit manifest and meaningful
  alt text; do not select images by array index or silently reuse an unrelated listing's image.
- Use the same media contract across tenant discovery, tenant detail, and any agent listing context
  that already displays the listing, while keeping role-specific data privacy unchanged.
- Prefer a simple native image surface and local files over a remote image CDN, asset service, UI kit,
  animation package, or generated runtime URL.
- Preserve a truthful bounded fallback for a missing asset without hiding a broken asset mapping or
  inventing listing facts.

## RS-WO-014-01 — Define the property-media asset and presentation boundary

**Role:** UI/UX and Asset Direction Advisor  
**Status:** `GATED`  
**Parallelization:** `READ_ONLY_PARALLEL` — may run beside `RS-WO-013-01`; it has no source write set and does not depend on Operations data  
**Risk profile:** `Standard` for proposal; later implementation touches binary assets, tenant/agent presentation paths, accessibility, and browser evidence  
**Supporting worker:** To be assigned only after the main thread validates the activation prompt  
**Source baseline:** To be captured immediately before dispatch; the collaborator-owned dirty and untracked files listed in current status remain outside this Work Order  
**Ownership:** The Advisor may inspect only. The main thread owns the decision, asset generation/import, source changes, canonical writeback, integration, and closure.

### Required read set

- `/Users/alex/.codex/AGENTS.md`, `/Users/alex/OpenAI-WebMCP/AGENTS.md`, and
  `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`.
- RightSpot `RUNBOOK.md`, `Docs/00-current-status.md`, `Docs/01-product-definition.md`,
  `Docs/02-requirements.md`, `Docs/03-system-design.md`, `Docs/04-domain-and-data-model.md`,
  `Docs/05-api-and-integration-contracts.md`, and `Docs/06-validation-and-evidence.md`.
- ADR-RS-0001 through ADR-RS-0011, especially ADR-RS-0009 and the source-identity/path-ownership
  boundary in ADR-RS-0005.
- The closed `RIGHTSPOT-007` task and the current tenant/agent listing components, styles, domain
  listing types, listing DTOs, fixture image keys, tests, and package/build configuration.
- The current Git status and ignored/generated-artifact boundary; do not inspect secrets or external
  account state.

### Required proposal contents

Return an evidence-backed English proposal that labels verified facts, recommendation, assumptions,
unresolved decisions, and non-goals. It must cover:

1. **Current gap and consumer map:** every existing tenant/agent surface that renders listing media,
   current `imageKey` meaning, and the exact likely future source paths.
2. **Asset manifest:** deterministic listing-to-file identity, dimensions/aspect ratios, formats,
   local path ownership, naming/versioning, generation/import provenance, and how a missing or corrupt
   asset is detected without silently using another listing's image.
3. **Truth and safety:** what imagery may and may not imply, synthetic-content labeling if needed,
   no real-person/address/document/logo requirements, and whether generated images require a review
   manifest before adoption.
4. **Accessibility and responsive behavior:** useful alt-text rules, decorative versus informative
   treatment, object-fit/cropping, keyboard/focus implications, reduced motion, and behavior at the
   established responsive widths.
5. **Failure and empty states:** deterministic missing-asset fallback, broken-image handling, loading
   behavior, no-network assumption, and a clear distinction between asset failure and listing-data
   failure.
6. **Later implementation decomposition:** smallest serial/parallel Work Orders, exact likely asset,
   component, style, manifest, and test write sets; shared-file conflicts; generation/import boundary;
   browser checks; rollback and stop conditions. Do not implement anything.
7. **Alternatives:** compare CSS placeholder, one shared stock/AI image, per-listing local imagery,
   remote URLs, runtime generation, and a full media model. Recommend the smallest credible route.

### Forbidden actions

- Do not edit source, tests, fixtures, dependencies, configuration, assets, generated output,
  documentation, task files, Git metadata, or the main checkout.
- Do not generate, download, import, or delete images; do not call an external image or storage
  service; do not inspect secrets, browser storage, or credentials.
- Do not change the listing domain, public DTOs, image-key semantics, route topology, workflow state,
  authentication, Operations authority, WebMCP, Cloud Receiver, WebRTC, or deployment boundary.
- Do not claim browser, deployment, image-generation, copyright, or visual-compliance evidence that
  was not directly observed.

### Return gate

Return `READY_FOR_REVIEW` or `BLOCKED` with exact source identity, consumer map, manifest proposal,
truth/accessibility rules, failure behavior, future path ownership, implementation sequence, and claim
limits. Stop after the report; the main thread owns all follow-on decisions and changes.

## Closure gate

Close this task only after the main thread records a reviewed disposition and either registers the
smallest implementation increment or explicitly defers the asset work with its residual visual risk.
The proposal does not authorize binary assets or UI changes by itself.

## Reopen condition

Reopen if the listing identity, asset provenance, visual direction, accessibility requirement, or
evaluator-facing demo surface changes, or if a later product increment requests video, remote media,
user-uploaded media, or a richer media lifecycle.
