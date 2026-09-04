# SK-TASK-082: CP-18 Judge Guide Narrative and Entry Surface

## Task Control

- Lifecycle state: `verified`
- Closure type: `integrated`
- Checkpoint: `CP-18`
- Owner: Game owner / judge surface
- Current increment: The judge guide now leads with Connector and Manifest setup, explains the Re-entry vision, embeds the supplied video, links the SDK Playground through a project-owned preview image, and routes gameplay instructions to a separate tutorial page.
- Next gate: The hosted presentation readback is complete; package compatibility, genuine WebMCP/Agent behavior, external delivery, and final judge reproduction remain separate CP-18 gates.

## Identity

- Task ID: `SK-TASK-082`
- Date: `2026-09-04`
- Risk profile: `Standard`
- Reason for profile: This is a reversible presentation-only increment over two static App Router pages and one project-owned SVG preview. It changes reviewer narrative and links but does not change game state, identity, persistence, WebMCP registration, Re-entry delivery, or deployment behavior.

## Objective

Give a judge a clear, light, and self-contained route from Local Connector installation and signed Manifest consent to the Sleepless Kingdom game path, the Re-entry vision, the supplied video, and one linked Re-entry SDK Playground surface.

## Success and non-goals

- Success: `/OpenAI-WebMCP-Challenge-Judge-Guide` leads with a four-move judge path: install the Local Connector, understand the signed Manifest/consent step, open the canonical game page, and observe one causal return.
- Success: The page includes the Re-entry vision, problem/mechanism/advantage framing, the supplied YouTube video in a responsive privacy-enhanced iframe with a direct fallback link, and a lighter visual system inspired by the approved reference direction.
- Success: The page contains one image-led, keyboard-accessible entry for `https://reentry-sdk-playground.vercel.app/`, with copy identifying it as another mini application that tests Re-entry.
- Success: `/game-tutorial` provides the separate player and Agent collaboration instructions and links back to the judge guide and game.
- Success: Both routes remain responsive with no horizontal overflow, no remote font dependency, visible keyboard focus, and no new runtime dependency.
- Non-goals: Adding gameplay or state transitions, changing the WebMCP tool contract, changing authentication or server behavior, claiming hosted Agent wake or genuine WebMCP execution, modifying Re-entry Core/Host SDK/Local Connector/Cloud Receiver, or deploying external services.

## Scope and authority

- In scope: `app/OpenAI-WebMCP-Challenge-Judge-Guide/page.tsx`, its CSS module, `app/game-tutorial/page.tsx`, its CSS module, the project-owned `public/mini-apps/reentry-sdk-playground-preview.svg`, generated `next-env.d.ts` route references, this task record, and the task README routing entry.
- Out of scope: `app/page.tsx`, `app/layout.tsx`, `src/server/`, `src/shared/`, persistence, worker logic, HTTP/WebSocket/WebMCP contracts, `reentry-core/`, `mvp/`, the Host SDK, Local Connector, Cloud Receiver, Clerk, Railway, Vercel, and external deployment configuration.
- Allowed actions: Edit the named presentation files and SVG, allow Next.js to update route type references, run focused static/build/browser checks, update this task record and task routing, and commit only the exact Game paths after verification.
- Revalidate when: The judge journey, page-tool names, accepted Re-entry/Manifest contract, external-link ownership, or hosted claim boundary changes.

## Owning authority

- Reviewer narrative: [`../Design/05-hackathon-demo.md`](../Design/05-hackathon-demo.md)
- Visual direction: [`../Design/Visual/06-ui-visual-system.md`](../Design/Visual/06-ui-visual-system.md) and [`../Design/Visual/07-reference-board.md`](../Design/Visual/07-reference-board.md)
- Page-tool boundary: [`../Engineering/05-api-and-webmcp.md`](../Engineering/05-api-and-webmcp.md)
- Existing presentation task: [`SK-TASK-081`](SK-TASK-081-cp18-openai-webmcp-challenge-judge-guide.md)
- External setup references: [`../../../../runtime/local-connector/README.md`](../../../../runtime/local-connector/README.md) and [`../../../../runtime/host-sdk/README.md`](../../../../runtime/host-sdk/README.md)

## Evidence status

- Verified: The existing judge-guide route is static and has the accepted page-tool names.
- Verified: The supplied YouTube URL returns the intended video page; the supplied SDK Playground URL and its current image resource return `200 OK` during this increment.
- Verified: Railway production deployment `165641ed-9d01-45fc-bb8b-97bdfbca1e11` for the existing `game` service completed with `SUCCESS`; the custom Game origin served the revised routes and project-owned preview with `200 OK` readback.
- Inferred: A separate static gameplay route reduces judge-guide cognitive load while keeping the complete game/Agent instructions one click away.
- Unknown: Final package compatibility, genuine browser WebMCP discovery/invocation, external Receiver/Connector delivery, Agent wake, and final judge reproduction.

## Smallest reversible action

Update only the two presentation routes, their CSS modules, and the small project-owned SVG preview. Stop if the build requires a runtime/auth change, if an external link becomes unavailable, or if any copy would require a hosted or genuine WebMCP claim without fresh evidence.

## Implementation result

- Reordered the judge guide so the first actionable section covers Local Connector installation, signed Manifest/consent, the canonical game page, and the observation path.
- Added a light editorial visual system with dark green and lime accents, a responsive YouTube `youtube-nocookie` preview, the Re-entry vision framing, and a causal flow strip.
- Added an image-led entry for the Re-entry SDK Playground at `https://reentry-sdk-playground.vercel.app/`, using a project-owned SVG preview.
- Added `/game-tutorial` as a separate static player/Agent collaboration guide with back-links to the judge guide and game.
- Kept the increment presentation-only. No game state, auth, persistence, WebMCP registration, Re-entry transport, Receiver, Connector, or deployment code changed.
- Released the committed Game app through the existing Railway `game` service without changing its production topology, persistent Volume, or environment configuration.

## Verification and closure target

- Minimum verification: `npm run typecheck`; `npm run build`; local HTTP `200`/title/content readback for both routes; a disposable wide and narrow browser readback for equal document/client widths, key links, iframe, and image load; whitespace/diff checks; and `python3 scripts/test_validate_game_docs.py` plus `python3 scripts/validate_game_docs.py --root . --report` from the Game app root.
- Closure target: `integrated` for the local judge-facing presentation and gameplay tutorial surfaces only.
- Rollback or remediation: Restore only the named route files, CSS modules, SVG, generated route reference, task record, and task README entry if the build or responsive route fails. Preserve unrelated dirty and untracked work.
- Reopen trigger: The page becomes a source of game state, changes a command or identity path, introduces a contract claim, asserts hosted/genuine Agent behavior without evidence, or the supplied external entries no longer resolve.

## Verification result

- `npm run typecheck`: passed under Node 24.
- `npm run build`: passed with Next.js `16.3.4`; both `/OpenAI-WebMCP-Challenge-Judge-Guide` and `/game-tutorial` are static prerendered routes.
- Local HTTP read: both routes returned `200`; titles, Connector/Manifest copy, Re-entry vision, YouTube embed, SDK Playground link, and tutorial content were present.
- Browser readback: passed at `1440 x 1000` and `390 x 844`; document and client widths matched, the YouTube iframe and SDK Playground preview loaded, and no horizontal overflow was reported.
- Hosted readback: `https://game.sleepless-kingdom.com/OpenAI-WebMCP-Challenge-Judge-Guide` and `/game-tutorial` returned `200`; the hosted Judge Guide contained the Re-entry vision, `youtube-nocookie` embed, SDK Playground link, and gameplay-guide link; `/mini-apps/reentry-sdk-playground-preview.svg` returned `200 image/svg+xml`.
- Documentation validation: `python3 scripts/test_validate_game_docs.py` and `python3 scripts/validate_game_docs.py --root . --report` passed from the Game app root.
- Claim limit: This closes the judge-facing presentation and tutorial surfaces, including hosted route delivery. It does not prove hosted package compatibility, genuine WebMCP invocation, Agent wake, external Receiver/Connector delivery, or final judge reproduction.
