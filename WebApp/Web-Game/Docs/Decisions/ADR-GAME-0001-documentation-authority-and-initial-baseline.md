# ADR-GAME-0001: Documentation Authority and Initial Baseline

**Status:** ACCEPTED FOR INITIALIZATION  
**Date:** 2026-09-01  
**Scope:** `WebApp/Web-Game/` documentation only

## Context

The game is being shaped through open-ended world and mechanic brainstorming. The owner asked for a
complete document architecture and a full original reference before task decomposition or code. The
outer repository already separates canonical product truth, mechanisms, decisions, research,
scenarios, evidence, and execution records. Codex Memory reinforces concise indexes, source-of-truth
separation, and durable history.

## Decision

Use the domain-oriented child tree:

```text
Docs/
  Blueprint/ World/ Mechanics/ Characters/ Design/ Engineering/
  Scenarios/ Research/ Decisions/ Validation/
```

Keep `Docs/00-current-status.md` as the current-state entry point, `Blueprint/00-game-blueprint.md`
as product concept authority, and `Blueprint/01-raw-discussion-reference.md` as a fidelity-preserved
source reference. Use English for authored project text and retain owner language only inside the
verbatim source block. Do not create implementation tasks during this initialization increment.

## Alternatives considered

- **Copy the complete Emorapy documentation tree:** rejected because this concept does not yet have
  those independent product and release boundaries.
- **Create one document per source file:** rejected because it mirrors implementation and increases
  stale-document risk.
- **Keep everything in one blueprint:** rejected because mechanics, world lore, technical authority,
  and raw source have different owners and update cadences.

## Consequences

The game can grow from a stable blueprint into implementation without losing the original discussion
or confusing proposals with verified runtime behavior. New mechanics must update their owning module
and any controlling decision; the Blueprint remains a concise map.

## Reopen triggers

Reopen when implementation reveals a different independent authority boundary, when the outer host
application decision selects a different product, or when the owner asks to change the documentation
model.
