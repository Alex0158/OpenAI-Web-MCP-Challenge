# Sleepless Kingdom Game — Scoped Agent Guide

## Scope

This guide governs the working game application under `WebApp/Web-Game/`. The outer
`WebMCP_Challenge/AGENTS.md` remains the repository authority and the workspace guide remains a
local router. This child guide adds product-documentation boundaries for the game concept; it does
not replace the outer Re-entry Core contracts or select the outer host application.

## Current stage

The folder is a documentation-first concept workspace. The world, mechanics, roles, design, and
technical target are being shaped before implementation. Do not infer that a described feature is
built, deployed, or judge-verified.

## Source of truth

- `Docs/00-current-status.md` owns the current state of this child application.
- `Docs/Blueprint/00-game-blueprint.md` owns the current product thesis and game boundary.
- `Docs/World/` owns the setting and world rules.
- `Docs/Mechanics/detail-*` owns atomic gameplay state transitions and rules; `Docs/Mechanics/Chains/`
  owns cross-mechanism ordering.
- `Docs/Characters/` owns player, shelter, soldier, monster, and world-actor definitions.
- `Docs/Design/` owns player experience, capability contracts, map presentation, dashboard, and visual
  direction.
- `Docs/Engineering/` owns target architecture, data contracts, performance, operations, and WebMCP
  integration obligations.
- `Docs/Decisions/` owns accepted durable choices and their consequences.
- `Docs/Scenarios/` owns concrete, reviewable gameplay and re-entry examples.
- `Docs/Research/` owns external references and supporting investigation.
- `Docs/Blueprint/01-raw-discussion-reference.md` preserves owner-provided source wording and is
  reference material; it does not override the canonical documents.

## Authoring rules

- Follow all outer repository rules, especially English project-authored artifacts, evidence
  boundaries, explicit status labels, and preservation of unrelated work.
- Verbatim non-English owner quotations may remain in the raw source reference when fidelity is the
  purpose. Surrounding authored text must remain English.
- Keep current concept truth separate from implementation status, research, and historical ideas.
- Do not create implementation tasks yet. The owner explicitly requested concept and document
  initialization before task decomposition.
- Do not modify `reentry-core/`, outer Core documents, frozen MVP fixtures, or RightSpot to support
  this child application.
- Mark unverified choices as `WORKING ASSUMPTION`, `TARGET`, `OPEN`, or `UNKNOWN`.
- When implementation begins, add a bounded task and update the owning mechanic, decision, and
  current-status documents before closing the change.

## Required reading order

1. `Docs/README.md`
2. `Docs/00-current-status.md`
3. the owning Blueprint, World, Mechanic, Character, Design, or Engineering document
4. the relevant Decision and Scenario
5. current code, tests, and evidence once implementation exists
