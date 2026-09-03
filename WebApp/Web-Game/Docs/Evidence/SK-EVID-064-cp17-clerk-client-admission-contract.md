# SK-EVID-064: CP-17 Clerk Client Admission Contract

## Identity

- Evidence ID: `SK-EVID-064`
- Related task, issue, or decision: [`SK-TASK-078`](../Tasks/SK-TASK-078-cp17-production-identity-and-hosted-admission.md) and [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
- Evidence class: `contract`
- Ladder level: `2`
- Executor and date: Codex primary session, 2026-09-03, Europe/London

## Exact identity under test

- Source state: Game repository `main`, local commit `14df10a` plus the Clerk client admission working-tree increment
- Contract version: `SK-MVP-0.2`
- Runtime versions: Node.js `v24.13.1`, npm `11.6.2`, Next.js `16.3.4`, React `19.2.8`, `@clerk/nextjs` `7.9.0`
- Fixture world and seed: none for the pure presentation contract; local fallback semantics are tested without a world
- Environment and configuration: `NODE_ENV` branch selection with and without `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Objective and claim boundary

- Behavior under test: Provide a minimal invite-only Clerk client gate around the canonical Game page while keeping the explicit non-production fixture path usable and making a missing production publishable key visible.
- Claim this evidence may support: The exact presentation-mode decision, `ClerkProvider` wiring when a publishable key exists, signed-out Sign in control, signed-in UserButton/Game surface, and explicit missing-production-configuration state in the named source scope.
- Claims this evidence cannot support: Clerk account creation, invite configuration, token or cookie issuance, server-side subject verification, hosted browser admission, WebSocket admission, or hosted continuity.

## Preconditions and fixture

- Starting state: CP-17 server-side resolver/bootstrap implementation and Railway resource preflight were already recorded; no Clerk secret or account was available locally.
- Synthetic identities and seeded actors: none. The test uses only a non-secret publishable-key-shaped string to select the client branch.
- Real, fake, and stubbed boundaries: The TypeScript mapper and Next build are real; Clerk network/session behavior and browser identity are absent.

## Execution

| Replayable procedure | Expected result | Actual result | Status |
|---|---|---|---|
| Run `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run test:cp17-clerk` | Production without a publishable key is explicit, a configured key selects Clerk, and test/development without a key retains the local path | Two assertions passed | **pass** |
| Run `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run typecheck` | The App Router layout, Clerk shell, and typed mapper compile | Passed | **pass** |
| Run `PATH=/Users/alex/.nvm/versions/node/v24.13.1/bin:$PATH npm run build` | The production Next page builds without a local secret | Passed; no Clerk network call was made | **pass** |

## Assertions

- Player-visible state: configured production presentation shows an invite-only Sign in control when signed out, and the Game projection plus UserButton only when signed in; missing production client configuration shows an explicit closed state.
- Command and failure contract: The shell does not create a player, choose a Game scope, or bypass the server resolver; the local branch is selected only outside production.
- Persistence, event, and outbox state: not touched.
- Exactly-once settlement after duplicate delivery and replay: not touched.
- Ownership denial, stale revision, restart, and reconnect: not touched.

## Analysis and closure

- Failure classification: `unknown` for real Clerk browser/session behavior because no credentials or identity were available.
- Limitations and residual risk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, Clerk Production invite-only configuration, two provider subjects, same-origin `__session` issuance, and clean-browser readback remain open. No `proxy.ts` or server `auth()` path is needed by this shell; the custom Node entrypoint remains the authority for game APIs and WebSocket admission.
- Invalidation triggers: Clerk SDK major/API change, Next App Router change, auth presentation change, server session-cookie contract change, or a new hosted origin.
- Exact conclusion: The minimal Clerk client admission gate is contract-verified at ladder level 2. It closes the page-level UI wiring gap while preserving local fixture behavior; it does not claim a Clerk session or hosted browser journey.
