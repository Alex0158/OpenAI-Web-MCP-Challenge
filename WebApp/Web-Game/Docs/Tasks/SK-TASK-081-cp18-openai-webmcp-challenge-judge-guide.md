# SK-TASK-081: CP-18 OpenAI-WebMCP-Challenge-Judge-Guide Surface

## Task Control

- Lifecycle state: `verified`
- Closure type: `integrated`
- Checkpoint: `CP-18`
- Owner: Game owner / judge surface
- Current increment: The static `OpenAI-WebMCP-Challenge-Judge-Guide` route is implemented as a reviewer-facing explanation of the Sleepless Kingdom causal story, Re-entry path, Local Connector setup, page tools, mini-application entry, and human consequence boundary.
- Next gate: No further gate remains for this named local presentation surface; clean-identity hosted rehearsal, genuine WebMCP invocation, external Receiver/Connector delivery, Agent wake, and final judge claims remain the separate CP-18 gates.

## Identity

- Task ID: `SK-TASK-081`
- Date: `2026-09-04`
- Risk profile: `Standard`
- Reason for profile: This is a reversible presentation-only route. It adds no game state, command,
  identity, persistence, WebMCP registration, Re-entry delivery, or deployment behavior.

## Objective

Give a clean reviewer a direct page at `/OpenAI-WebMCP-Challenge-Judge-Guide` that explains what to
observe in the game, how a meaningful event becomes a bounded Agent re-entry, how to set up the
Local Connector, which page tools are available, where to try another local mini application, and
where human/server authority remains.

## Success and non-goals

- Success: The exact route prerenders with the page title
  `OpenAI-WebMCP-Challenge-Judge-Guide | Sleepless Kingdom` and presents a short judge path from
  shelter, mission, persistent world, causal event, signal, Agent task, and WebMCP page.
- Success: The page explains the five read/action tool names, scoped server checks, stale revision
  handling, and the rule that a safe read precedes any consequential action.
- Success: The page gives a clear four-step Local Connector setup path, a verified public package
  download link, and a setup-guide link while keeping the preview and hosted-claim boundary visible.
- Success: The page includes an image-led RightSpot project entry with a source/local-runbook link;
  it does not invent a hosted URL for the un-deployed child application.
- Success: The page remains readable at the tested wide and narrow viewports with no horizontal
  overflow, no remote font dependency, keyboard-visible link focus states, and a loaded local
  mini-application image.
- Success: The route links back to the game and source repository without changing the authenticated
  game entry flow.
- Non-goals: Adding gameplay or state transitions, exposing credentials, adding a demo bypass,
  claiming hosted or genuine WebMCP execution, claiming Agent wake, changing the Cloud Receiver or
  Local Connector, or publishing submission/eligibility claims.

## Scope and authority

- In scope: `app/OpenAI-WebMCP-Challenge-Judge-Guide/page.tsx`, its CSS module, the local
  `public/mini-apps/rightspot-primary.v1.webp` presentation asset, the generated
  `next-env.d.ts` route-type reference required by the current Next.js build, and this task record.
- Out of scope: `app/page.tsx`, `app/layout.tsx`, `src/server/`, `src/shared/`, persistence, worker
  logic, WebSocket/HTTP contracts, WebMCP registrar behavior, `reentry-core/`, `mvp/`, RightSpot,
  Clerk, Railway, Vercel, and external Receiver/Connector code.
- Allowed actions: Edit the route files and the one presentation asset, allow the owning Next.js
  tool to update `next-env.d.ts`, run focused build/type/browser checks, and record the result.
  Owner-authorized repository closure may stage, commit, and push these exact in-scope files; do not
  deploy or contact external parties as part of this task.
- Revalidate when: The CP-18 reviewer journey, page-tool names, accepted Game contract, or hosted
  claim boundary changes.

## Owning authority

- Product and reviewer narrative: [`Design/05-hackathon-demo.md`](../Design/05-hackathon-demo.md)
- Checkpoint and artifact requirements: [`Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md)
- Clean-identity preparation: [`SK-TASK-018`](SK-TASK-018-cp18-judge-reproduction-preimplementation-pack.md)
- Visual boundary: [`ADR-GAME-0007`](../Decisions/ADR-GAME-0007-mvp-visual-assets-and-parallel-delivery.md)
- Page-tool boundary: [`Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md)

## Evidence status

- Verified: `npm run typecheck` passes for the Game app.
- Verified: `npm run build` passes with Next.js `16.3.4`, and the route is listed as a static
  prerendered App Router page.
- Verified: A local HTTP read of the route returns `200`, the expected title, and the key
  `CargoLostToMonster` and `force_recall_soldier` content.
- Verified: A disposable Playwright readback at `1440 x 1000` and `390 x 844` reports equal
  document/client widths and produces wide/narrow screenshots with no horizontal overflow.
- Inferred: A single narrative page is the lowest-friction way to orient a reviewer before the
  clean-identity hosted rehearsal.
- Unknown: Hosted deployment of this route, genuine page-bound WebMCP discovery/invocation, Agent
  wake, external delivery, and final submission acceptance.

## Smallest reversible action

Add the route as an isolated App Router page with a CSS module and no new runtime dependency. If the
page changes an existing game component, introduces a contract claim, or requires credentials or a
production bypass, stop and route that change through its owning task instead.

## Verification and closure target

- Minimum verification: `npm run typecheck`; `npm run build`; local `200`/title/content readback;
  disposable wide/narrow browser readback including connector/mini-app links and image load; and
  whitespace/diff checks for the new files.
- Closure target: `integrated` for the named local reviewer-facing presentation surface only.
- Rollback or remediation: Remove only the route files, the added presentation asset, and this task
  record if the route blocks the build, overflows at the tested viewport, or introduces an
  unsupported product claim. Preserve all unrelated dirty and untracked work.
- Reopen trigger: The page becomes a source of game state, adds a command or identity path, claims
  hosted/genuine WebMCP behavior without evidence, or diverges from the CP-18 reviewer journey.

## Implementation result

- Added the exact route `/OpenAI-WebMCP-Challenge-Judge-Guide` as a server-rendered page with route
  metadata, a game-home link, and a source-repository link.
- Added a dark magical-field visual treatment that matches the game's existing forest/cream/gold
  vocabulary while keeping the visual signal trace diagram CSS-only and dependency-free.
- Added five judge steps, the causal Game → event log → Re-entry signal → existing Agent task →
  WebMCP page chain, the read/action tool table, and the server/Agent/player trust boundary.
- Added the “How to set up your Local Connector” section with four human-readable setup steps, the
  public `@4xeoz/re-entry` package trigger, and the repository setup guide. The copy labels the
  package as preview setup and preserves the current compatibility boundary.
- Added the “Other mini applications to test our Re-entry” section with a RightSpot image entry and
  source/local-runbook link. RightSpot is labelled as a local MVP entry because no hosted URL is
  currently verified.
- Added a read-first Agent prompt that explicitly leaves consequential commands behind human
  confirmation and explains typed stale/scope/no-action outcomes.
- Added one copied, project-owned RightSpot listing image under `public/mini-apps/`; no source files
  in the RightSpot child application were changed.
- Kept the route presentation-only: no auth, server, state, command, WebMCP, Receiver, Connector,
  or deployment behavior changed.

## Verification result

- `npm run typecheck`: passed.
- `npm run build`: passed; route listed as static (`○ /OpenAI-WebMCP-Challenge-Judge-Guide`).
- Local HTTP read: `200 OK`; expected title and guide/tool content present.
- Browser readback: passed at `1440 x 1000` and `390 x 844`; document/client widths were equal in
  both contexts, the local RightSpot image loaded at its intrinsic `1536 x 1024` size after entering
  the section, and the page rendered without horizontal overflow.
- Link readback: the Connector download points to the published npm package, the setup guide points
  to the repository README, and the RightSpot card points to the repository child-application
  entry. No hosted RightSpot URL is asserted.
- Claim limit: This closes only the local static judge-guide surface. It does not prove deployment,
  hosted continuity, WebMCP capability, Agent wake, Re-entry delivery, or clean-identity judge
  reproduction.
