# RIGHTSPOT-003: Define the rental marketplace UI/UX visual system

**Type:** `decision`  
**Lifecycle:** `closed`  
**Priority:** `P1`  
**Owner:** Main RightSpot thread  
**Depends on:** `RIGHTSPOT-002` closed local MVP; [Product Definition](../01-product-definition.md);
[Requirements](../02-requirements.md); [Logical System Design](../03-system-design.md);
[ADR-RS-0003](../Decisions/ADR-RS-0003-implementation-stack-and-realtime-boundary.md);
[ADR-RS-0008](../Decisions/ADR-RS-0008-ordinary-workflow-http-and-interface-contract.md)

## Task Control

- Type: `decision`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Main RightSpot thread
- Current increment: Review and accept one bounded UI/UX redesign proposal for the tenant marketplace and property-agent console.
- Next gate: Implement the accepted shared visual foundation and role-page slices through separately bounded Work Orders.
- Dependencies: The accepted ordinary rental workflow remains authoritative; the MVP closure record remains unchanged.

## Bounded objective

Define a coherent visual and interaction system that makes RightSpot feel like a trustworthy rental
marketplace rather than a generic AI-generated interface. The proposal may use Rightmove as a
pattern reference for search-first information architecture, property photography, and practical
listing presentation, but it must not copy Rightmove branding, assets, copy, or proprietary layout.

This task is a design decision proposal. It does not implement UI, generate final assets, change
routes, alter workflow behavior, or accept a new design system as product truth.

## Current evidence and authority

- RightSpot is a local Next.js App Router, React, TypeScript, Node.js 24, and SQLite application.
- The accepted MVP flow is tenant discovery, request draft, explicit submit, agent review, response preparation, explicit send, and tenant confirmation or decline.
- The current UI is integrated and locally verified, but still exposes demo-session language, fixture metadata, CSS gradient media placeholders, oversized generic typography, and repeated card treatments.
- The current tenant and agent route structure must be treated as stable unless a later accepted decision changes it.
- The current MVP is rental-only. Buying, commercial property, mortgage, live chat, payment, WebMCP, Cloud Receiver, Redis, and WebRTC media remain out of scope.

## RS-WO-003-01 — UI/UX redesign proposal

**Role:** UI/UX Advisor  
**Status:** `ACCEPTED`  
**Supporting task:** `01a05d47-7fa6-74f1-9f74-fdb88f78c9aa` on host `local`  
**Write policy:** Read-only. Return the proposal in the supporting task report; do not write it into the repository.  
**Source baseline:** RightSpot integrated source at `625048a74e4fa7d716dd0067b29467438c648940`; the shared tree also contains the owner-held untracked file `Docs/Reference/RIGHTSPOT-GOAL-PROMPT-HISTORY.md`, which must remain untouched.

### Required read set

- `/Users/alex/.codex/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/AGENTS.md`
- `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/AGENTS.md`
- RightSpot `RUNBOOK.md`
- RightSpot `Docs/00-current-status.md`
- RightSpot `Docs/01-product-definition.md`
- RightSpot `Docs/02-requirements.md`
- RightSpot `Docs/03-system-design.md`
- RightSpot `Docs/04-domain-and-data-model.md`
- RightSpot `Docs/05-api-and-integration-contracts.md`
- RightSpot `Docs/06-validation-and-evidence.md`
- RightSpot ADR-RS-0001 through ADR-RS-0008
- Current tenant, agent, shared-shell, and global stylesheet source
- The public Rightmove homepage supplied by the owner, only as a visual and information-architecture reference

### Required proposal contents

1. Evidence-backed audit of the current tenant entry, discovery, listing detail, request dashboard, agent queue, and agent request-detail surfaces.
2. A single proposed design read: audience, tone, density, theme, typography direction, color direction, shape/radius rule, imagery rule, and restrained-motion rule.
3. Page-by-page information architecture and layout recommendations that preserve the accepted workflow and existing route ownership.
4. Shared component and token boundaries, including which files should remain shared and which tenant/agent surfaces can be implemented independently.
5. Responsive, keyboard, focus, contrast, loading, empty, error, and reduced-motion requirements.
6. Synthetic property-image art direction and an asset manifest proposal. Do not generate or add assets in this task.
7. Explicit non-goals, implementation risks, design alternatives rejected, and the smallest implementation wave after acceptance.
8. A short challenge section identifying any part of the owner's Rightmove reference that would harm RightSpot's MVP clarity or scope.

### Forbidden actions

- Do not edit code, CSS, tests, package manifests, lockfiles, or canonical documents.
- Do not create a branch, commit, push, deploy, or open a pull request.
- Do not install a UI kit, font, icon library, animation library, or image-generation dependency.
- Do not create ImageGen assets or transmit project data to an external service.
- Do not change the accepted rental workflow, route structure, role authority, or MVP non-goals.
- Do not treat the proposal as accepted architecture or product truth.

### Return gate

Return `READY_FOR_REVIEW` with verified facts, observations, recommendations, assumptions, unknowns,
scope risks, and the exact questions that must be resolved by the main thread. The main thread owns
canonical writeback and any later implementation dispatch.

## Closure gate

The main thread reviewed the supporting proposal, accepted the bounded design boundary in
[ADR-RS-0009](../Decisions/ADR-RS-0009-ui-ux-visual-system-and-navigation.md), and registered the
next bounded implementation Work Order in `RIGHTSPOT-005`. The proposal task is closed; it did not
authorize an external UI dependency or change the accepted workflow/API boundary.
