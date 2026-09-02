# RIGHTSPOT-024: Allow the documented loopback host in local development

**Type:** `defect`
**Lifecycle:** `closed`
**Priority:** `P1` for the local demo surface at the host currently used by the project
**Owner:** Main RightSpot thread
**Opened:** 2026-09-02
**Depends on:** RightSpot Next.js local runtime; `RS-FLOW-01` entry contract; pinned Node.js
`v24.20.0`

## Task control

- Type: `defect`
- Lifecycle: `closed`
- Priority: `P1` for the supported local loopback entry; no production impact is claimed
- Owner: Main RightSpot thread
- Current increment: Permit the local development runtime to serve its own browser resources when
  the app is opened at `http://127.0.0.1:3100`.
- Execution posture: `CLOSED_VERIFIED`
- Evidence status: `VERIFIED_ENVIRONMENT_GAP` from fresh browser renders, server output, and
  cross-host comparison; the bounded config repair is now implemented.
- Next gate: Closed after path-scoped frozen-source verification and documentation reconciliation.

## Verified problem

With the pinned Node `v24.20.0` dev server running at port `3100`, a fresh tab opened at
`http://127.0.0.1:3100/` receives the server-rendered shell but never hydrates into the signed-out
role-selection state. After more than four seconds it still shows `Checking your demo session`, and
the server records no follow-up `GET /api/session` from that tab.

The dev server reports the concrete cause boundary:

```text
Blocked cross-origin request to Next.js dev resource /_next/hmr from "127.0.0.1".
To allow this host in development, add it to "allowedDevOrigins" in next.config.js and restart.
```

The same source and session-client repair settle correctly at `http://localhost:3100/`, including
Tenant and Property agent handoffs. The production build also settles correctly at
`http://127.0.0.1:3101/`. This isolates the finding to the local Next.js development-origin
configuration rather than the session API contract or product workflow.

## Bounded objective

Allow `127.0.0.1` as an explicit Next.js development origin so the documented local loopback URL:

1. hydrates the existing app shell;
2. reaches the existing `/api/session` endpoint and renders its truthful signed-out state;
3. preserves the existing localhost development path and production build behavior; and
4. changes no product, API, session, workflow, data, or authentication behavior.

## Work Order

### RS-WO-024-01 — Enable the loopback development origin

**Role:** Main-thread Builder → independent Verifier (sequential checkpoints)
**Pre-dispatch status:** `MAIN_BUILDER_ACTIVE`
**Execution state:** `CLOSED_VERIFIED`
**Owner:** Main RightSpot thread
**Dispatch state:** Main-thread Builder complete; read-only independent verifier returned `PASS`; no
supporting task dispatched; closed in canonical Main
**Parallelization:** `SERIAL_RUNTIME_CONFIG` — no other worker may change the Next config or run a
 competing `3100` server during the runtime check
**Execution profile:** `Standard` — one development-origin configuration entry and focused config
 regression

#### Acceptance criteria

1. `next.config.ts` explicitly allows `127.0.0.1` through `allowedDevOrigins`.
2. A fresh no-cookie tab at `http://127.0.0.1:3100/` hydrates, requests `/api/session`, settles into
   `Start with a bounded role`, and exposes both existing role actions.
3. Tenant sign-in still reaches `/tenant` with the seeded listing collection, and Property agent
   sign-in still reaches `/agent`; the server remains the authority for the actor.
4. The existing `http://localhost:3100/` dev path remains usable, and `next build` succeeds without
   a production-origin or route change.
5. No session-client, server route, API contract, cookie, workflow, listing, Favourite, dependency,
   external auth, WebMCP, Cloud Receiver, WebRTC, Redis, deployment, or production-readiness change
   is introduced.
6. TDD evidence is explicit: the focused config test fails before the allowlist entry, the minimal
   config change makes it pass, and any refactor preserves the same config contract.

#### Builder evidence

- Red: `tests/ui/dev-origin-config.test.ts` failed with `allowedDevOrigins` equal to `undefined`.
- Green: `next.config.ts` now exports exactly `allowedDevOrigins: ["127.0.0.1"]`; the focused config
  test passes.
- Path-scoped freeze: the only 024 source paths are `next.config.ts` and
  `tests/ui/dev-origin-config.test.ts`; the protected 023 session-client hash is recorded above and
  did not change.
- Aggregate checks: the full direct suite passes 125/125, typecheck passes, `next build` passes, and
  scoped diff checks pass under Node `v24.20.0`.
- Runtime: after a clean dev-server restart, a fresh `127.0.0.1:3100` tab settled into signed-out
  role selection, then reached `/tenant` with seeded listings and `/agent` with the request queue;
  server output showed the expected `401` and subsequent session/role requests with no dev-origin
  warning. Browser logs contained only normal HMR-connected messages.
- Path-scoped freeze: the only 024 source paths are `next.config.ts` and
  `tests/ui/dev-origin-config.test.ts`; the protected 023 session-client hash is recorded above and
  did not change.
- Aggregate checks: the full direct suite passes 125/125, typecheck passes, `next build` passes, and
  scoped diff checks pass under Node `v24.20.0`.
- Runtime: after a clean dev-server restart, a fresh `127.0.0.1:3100` tab settled into signed-out
  role selection, then reached `/tenant` with seeded listings and `/agent` with the request queue;
  server output showed the expected `401` and subsequent session/role requests with no dev-origin
  warning. Browser logs contained only normal HMR-connected messages.

#### Baseline and source identity

- Repository root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`
- RightSpot package root: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge/WebApp/Web-Right_Spot`
- Branch/HEAD at registration: `main` / `81ee4392d173d796e404101818b741c0b64b861b`
- Runtime: `/Users/alex/.local/share/rightspot/node-v24.20.0-darwin-arm64/bin`, Node `v24.20.0`,
  npm `11.19.0`
- Worktree: canonical Main only; unrelated outer Web-Game work remains preserved
- Generated/local-only output: `.next/`, browser probe state, process logs, and `var/test/*.sqlite`
  are not product source
- Protected pre-existing source: `src/ui/shared/session-api.ts` belongs to `RIGHTSPOT-023`, not this
  Work Order. Its current SHA-256 is
  `0fef0c95f249639e57aeba53c1d67fa605e0eed548932fdf77966117eaac393a`; it is a forbidden path and
  remained unchanged throughout the 024 increment.

The Main Worktree is intentionally dirty because it contains the 023 candidate and existing
documentation/collaborator work. A clean whole-tree claim is not required for this config-only
Work Order. Its frozen identity is path-scoped: the 024 write set is `next.config.ts` plus the focused
test, while the protected 023 path and all other dirty/untracked paths are explicitly excluded.

The Builder must recapture branch, HEAD, status, Worktree list, runtime, and exact changed paths
before action. An unexpected source mutation, config requirement outside `next.config.ts` and the
focused test, or competing runtime process is a stop condition.

#### Mutable scope

- **Worker/Main write set:** `next.config.ts` and `tests/ui/dev-origin-config.test.ts`.
- **Main documentation writeback:** this Task File, the task index, current status, flow catalogue,
  validation/evidence, roadmap, and any required Runbook wording.
- **Forbidden set:** `src/ui/shared/session-api.ts`, `app-shell.tsx`, session panel/nav, all
  server/API/domain/persistence/route files, package manifests/lockfiles, assets, Git metadata,
  outer Web-Game files, and user-owned reference artifacts.
- **Generated set:** `.next/`, browser state, server logs, and test-owned databases; none may be
  staged as product source.

If the config entry does not resolve the 127.0.0.1 hydration boundary, stop with `NEEDS_REVIEW` and
do not add middleware, a custom proxy, a timeout, a retry, or a client fallback.

#### TDD and verification

1. **Red:** add/run a focused test asserting the explicit loopback origin; it must fail against the
   current empty config. The fresh 127.0.0.1 browser render is the runtime Red evidence.
2. **Green:** add only `allowedDevOrigins: ["127.0.0.1"]` to `next.config.ts`; run the focused test.
3. **Refactor:** only if it improves local config clarity without changing the exported value or
   scope.
4. Restart the dev server after config reload and verify fresh 127.0.0.1 and localhost tabs,
   `/api/session` activity, signed-out controls, both role handoffs, console errors, and no
   workflow/data mutation.
5. Run the full RightSpot direct suite, typecheck, production build, and scoped diff checks under the
   pinned runtime. Independent verification must use the frozen integrated source.

#### Non-goals and stop conditions

- Do not change the app's session client or server response to accommodate the dev host.
- Do not allow arbitrary external origins, wildcards, production CORS, or a new hosting/deployment
  policy.
- Do not introduce external authentication, username/password, Gmail, Clerk, WebMCP, Cloud Receiver,
  WebRTC, Redis, or any deferred integration.
- Do not edit canonical documents from a supporting worker, commit from a worker, dispatch follow-on
  work, or claim independent verification from a Builder result.

## Closure gate

Close only when the exact 127.0.0.1 dev-origin gap is fixed, the Red/Green evidence and relevant
direct checks pass, fresh browser proof shows a usable signed-out entry and both role handoffs, and
the config-only change is integrated into the canonical Main Worktree with current docs reconciled.
This Task does not claim production deployment or any deferred integration.

**Closure result (2026-09-02):** `next.config.ts` now allows exactly `127.0.0.1` through
`allowedDevOrigins`. The focused Red/Green config test, full 125-test direct suite, typecheck, clean
production build, path-scoped independent verifier, and fresh `127.0.0.1:3100` browser walkthrough
passed. The walkthrough reached signed-out role selection, Tenant listings, and the Property agent
queue; server output showed the expected session requests without the prior dev-origin warning. The
protected `RIGHTSPOT-023` session-client path remained unchanged.

## Reopen condition

Reopen or replace this Task if the fix requires changing application behavior, the server session
contract, middleware/authorization, dependency versions, production origin policy, or a new host
outside the documented local loopback boundary.
