# SK-EVID-027: CP-12 Original SVG UI Icon Runtime Verification

## Identity

- Evidence ID: `SK-EVID-027`
- Related task and decision: [`SK-TASK-039`](../Tasks/SK-TASK-039-cp12-original-svg-ui-icon-pack.md); [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
- Evidence class: `process-runtime`
- Ladder level: `4` — local React server-render, typecheck, and Next production-build boundary
- Executor and date: Codex, 2026-09-02

## Exact identity under test

- Source state: working tree on `main`, `HEAD 4224f3a` (uncommitted; no commit or push claim)
- Contract version: `SK-MVP-0.2` remains unchanged
- Runtime versions: Node.js `v26.5.0` (the repository baseline is Node 24); npm `11.17.0`; TypeScript `7.0.2`; React `19.2.8`; Next.js `16.3.4`
- Source and build root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Game`
- Fixture and identity: no database fixture or identity binding is used by the icon tests; the production build mounts the existing null-snapshot page shell
- External boundaries: no browser session, WebMCP capability, Agent Signal, Re-entry Core, credential, external asset service, or hosted process

## Objective and claim boundary

- Behavior under test: The accepted CP-12 visual vocabulary is exposed as stable typed IDs, each known ID renders a deterministic inline 24 x 24 SVG, labelled and decorative accessibility semantics are explicit, unknown IDs render a visible deterministic fallback, and the real `GameProjection` consumer uses the icons alongside text.
- Claim this evidence may support: local level-4 verification that the icon registry, server-rendered SVG markup, dashboard consumer, CSS module, type surface, and Next build are coherent in the named source state.
- Claims this evidence cannot support: browser pixel fidelity, keyboard or focus behavior, Canvas actor/tile art, animation smoothness or FPS, live `client_snapshot` delivery, session/bootstrap, WebMCP registration, Agent Signal/Re-entry delivery, hosted continuity, deployment, or judge reproduction.

## Source-to-consumer path

1. [`Docs/Design/Visual/prototypes/core-icons.svg`](../Design/Visual/prototypes/core-icons.svg) remains the original source reference; it is not copied into `public/`.
2. [`src/client/visual-icons.tsx`](../../src/client/visual-icons.tsx) owns the eight stable UI IDs and deterministic inline SVG geometry.
3. [`src/client/game-projection.tsx`](../../src/client/game-projection.tsx) consumes the registry for non-ready status, map landmark cue, shelter coins, sensed Wood/Rock counts, and mission tool cues while preserving visible text.
4. [`src/client/game-projection.module.css`](../../src/client/game-projection.module.css) supplies bounded inline layout and size rules; the Canvas draw path remains geometric and unchanged.

## Execution

| Replayable command | Result |
|---|---|
| `npm run test:cp12-visual` | **4 passed, 0 failed** — stable ID list, deterministic known icon markup, labelled semantics, and unknown fallback |
| `npm run test:cp12-projection` | **5 passed, 0 failed** — server-owned projection, route/cargo/encounter rows, privacy, deterministic Canvas commands, and degraded states |
| `npm run typecheck` | **passed** |
| `npm run build` | **passed** — Next.js production build compiles and mounts the canonical page shell |
| `rg -o 'data-asset-id="[^\"]+"' .next/server/app/index.html \| sort \| uniq -c` | **passed** — the built page contains `icon_warning`, `icon_landmark` (2 consumers), `icon_coin`, `icon_wood`, `icon_rock`, `icon_pickaxe`, `icon_sword`, and `icon_cargo` |
| `python3 scripts/test_validate_game_docs.py` | **22 passed, 0 failed** |
| `python3 scripts/validate_game_docs.py --root . --report` | **passed** — task, evidence, audit, visual vocabulary, and links reconcile |
| `git diff --check -- WebApp/Web-Game` | **passed** — no whitespace errors in the game scope |

## Assertions

- The registry contains exactly the eight accepted low-count UI IDs: Wood, Rock, Pickaxe, Sword,
  Cargo, Coin, Warning, and Landmark.
- Known markup is repeatable, carries `data-asset-id`, `data-state="normal"`, `viewBox="0 0 24 24"`,
  and a 24 x 24 intrinsic size. Decorative instances are `aria-hidden`; a supplied label produces
  `role="img"` and `aria-label` without `aria-hidden`.
- Unknown names never disappear silently: the component emits `data-asset-id="unknown"`,
  `data-asset-fallback="true"`, the requested name, and a visible warning-shaped path.
- The dashboard retains text equivalents. Icon markup is additive presentation and does not enter
  `ClientSnapshot`, commands, persistence, event ordering, identity, or session resolution.
- The static build contains the actual consumer instances, including the null-snapshot warning path;
  this is build evidence, not a live browser claim.

## Analysis and closure

- Failure classification: no product, test, build, documentation, or source-link failure remained in
  the named scope after the focused rerun.
- Limitations and residual risk: no browser accessibility tree, visual screenshot, device-pixel
  performance, live snapshot state, Canvas atlas, actor/world art, or hosted runtime was exercised.
- Invalidation triggers: changes to the accepted visual IDs or source prototypes, icon component
  semantics, the GameProjection consumer, React/Next versions, CSS contract, snapshot authority, or
  a later decision to move these icons into the Canvas atlas.
- Exact conclusion: **SK-TASK-039 is integrated and locally runtime-verified for the CP-12 React
  dashboard icon boundary at level 4. The visual asset, browser/session, Canvas, WebMCP, Re-entry,
  and hosted gates remain separate.**
