# ADR-RS-0009: RightSpot Field Desk UI/UX and Navigation Baseline

**Status:** Accepted — RightSpot post-MVP presentation decision  
**Decision date:** 2026-09-01  
**Decision owner:** Main RightSpot thread

## Context

The ordinary rental workflow is implemented and independently verified, but the current human
surfaces still read partly as a generic demo: large generic typography, repeated rounded cards,
CSS-gradient listing media, and technical fixture details in the primary reading path. A live
re-check also showed that successful sign-in leaves the user at a session-only root shell until the
user manually opens a role workspace. The listing data and API are healthy; the friction is in
presentation and navigation.

The UI/UX Advisor returned `READY_FOR_REVIEW` in `RS-WO-003-01`. This ADR accepts its bounded
direction with the revisions below. It does not reopen `RIGHTSPOT-002` or change the workflow,
route contract, domain, persistence, or future integration boundaries.

## Decision

### 1. Adopt the “RightSpot Field Desk” design read

RightSpot should feel like a calm, credible rental marketplace paired with a practical property
agent desk: locally grounded, readable, editorial, and operational. It must not look like a generic
AI dashboard, glassmorphism template, or luxury-property brochure.

The initial implementation direction is:

- warm paper background and solid off-white surfaces;
- deep evergreen as the primary brand colour and restrained terracotta as an attention/focus accent;
- system sans for body text with a dependable local serif fallback for display headings;
- smaller, controlled surface and control radii rather than the current oversized rounded treatment;
- fine borders and restrained or absent shadows instead of decorative gradients;
- short hover/focus transitions only, with reduced-motion support;
- natural daylight synthetic property imagery with no faces, logos, documents, watermarks, or real-person data.

No external font, UI kit, icon library, animation library, image service, or design-system package is
required by this decision.

### 2. Preserve the route and authority topology

The existing route ownership remains authoritative:

```text
/                         role entry
/tenant                   browse rentals
/tenant/listings/:id      listing detail and request draft
/tenant/requests          tenant request workspace
/agent                   agent queue
/agent/requests/:id       agent review and decision
```

The shared navigation may expose `Browse rentals` and `My request` for tenants and `Queue` for
agents. It must remain a presentation layer over the existing route/API boundary and must not own
workflow state.

Successful role sign-in should go directly to the server-resolved role workspace. The root shell may
remain the signed-out role entry surface; an already signed-in user who reaches `/` must receive a
role-aware redirect or an unambiguous primary continuation, as recorded in `RIGHTSPOT-005`.

### 3. Establish information hierarchy

Tenant surfaces prioritise listing image, rent, area, bedrooms/size, availability, detail, and the
next request action. The request dashboard prioritises current human-readable state, listing
summary, next permitted action, proposal deadline/slot, and timeline.

Agent surfaces prioritise queue state, request/listing context, availability comparison,
preparation, and the separately visible consequential send decision.

`fixtureGeneration`, raw workflow state, request/version identifiers, and other technical metadata
must move to secondary or development-only disclosure where they are not needed for the human task.
No business state may be inferred or reimplemented in the UI.

### 4. Use one shared visual foundation before role-page polish

The shared foundation owns tokens, global focus/control rules, shell/navigation, status/error
patterns, workflow timeline, property media presentation, and responsive primitives. Tenant and
agent pages retain disjoint route/component/style ownership and consume those primitives.

The first implementation sequence is:

1. resolve the post-login navigation defect in `RIGHTSPOT-005`;
2. implement and freeze the shared visual foundation;
3. implement tenant and agent page polish as separate bounded slices;
4. add local synthetic image assets only against a reviewed manifest and alt-text list.

### 5. Treat accessibility and responsive behaviour as acceptance criteria

Every surface must retain semantic landmarks, a valid heading hierarchy, labelled controls,
visible keyboard focus, text-based status (not colour alone), bounded loading/empty/error states,
layout support from 320px upward, touch targets of at least 44px, and
`prefers-reduced-motion: reduce` behaviour. Contrast must be measured during implementation; colour
selection alone is not a compliance claim.

## Alternatives considered

### Keep the current demo-card styling

Rejected as the default. It keeps the workflow functional but does not address the evaluator's
trust and rental-marketplace readability problem.

### Clone Rightmove's complete information architecture

Rejected. Rightmove is a reference for rent-first search, property facts, and practical imagery, not
an authority for adding buying, mortgage, commercial, map, alert, or broad marketplace scope.

### Add a UI kit, custom font, or animation dependency

Rejected for this wave. The current app can achieve the required distinction with local CSS and
existing React components; a dependency would increase installation and verification surface without
improving the core workflow evidence.

## Consequences

- The next UI increment has a coherent visual direction and can be split into shared, tenant, and
  agent implementation ownership.
- The evaluator reaches a role workspace without an unnecessary manual handoff step.
- Technical debug information remains available without competing with the human task.
- The design will look intentionally calm rather than maximally decorative; imagery consistency and
  typography carry more of the product identity.
- Synthetic assets require local ownership, alt text, manifest review, and deterministic paths.

## Validation and reopen triggers

Validate the shared and role surfaces at 320px, 768px, and 1440px; with keyboard-only navigation;
with reduced motion; across loading/empty/error/terminal states; and through the full tenant → agent
→ tenant Happy Path. Reopen if the route topology, workflow authority, or product scope changes, or
if the visual direction proves incompatible with the evaluator-facing demo.
