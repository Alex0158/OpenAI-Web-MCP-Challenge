# RIGHTSPOT-006: Integrate the provider-backed authentication boundary

**Type:** `implementation`  
**Lifecycle:** `pending`  
**Priority:** `P1` for external-identity credibility, not a blocker to the accepted local MVP  
**Owner:** Main RightSpot thread  
**Opened:** 2026-09-01  
**Depends on:** [ADR-RS-0010](../Decisions/ADR-RS-0010-external-authentication-boundary.md); explicit owner authorization for a Clerk application, test identities, callback/origin configuration, and local secret handling

## Task Control

- Type: `implementation`
- Lifecycle: `pending`
- Priority: `P1`
- Owner: Main RightSpot thread
- Current increment: Prepare and implement the smallest provider-backed identity boundary that maps authenticated Clerk users to pre-provisioned local `AppUser` records and existing `Actor` roles without changing workflow authority.
- Next gate: The owner authorizes the external credential/account gate, the exact compatible SDK version and local origin are verified, and the main thread records a precise implementation Work Order.
- Dependencies: ADR-RS-0010, the accepted workflow HTTP/DTO contract, and a recoverable local environment/secret path. The accepted demo-session MVP remains the rollback target.
- Implementation status: No Work Order has been dispatched. No package installation, provider setup, environment change, or auth source change is authorized by this registration.

## Bounded objective

Replace the current fixed `rightspot_demo_session` only through an explicit, provider-backed
identity boundary after the credential gate is authorized. The provider verifies who authenticated;
the RightSpot application maps `(provider, providerUserId)` to a local `AppUser`, then resolves the
existing stable `Actor` and applies the existing server-side role, assignment, privacy, and workflow
checks.

The first implementation target is username plus password for two pre-provisioned synthetic users.
Google sign-in remains optional and must not block the primary acceptance gate. A provider outage or
unmapped user must fail closed; the application must not silently fall back to the demo cookie.

## Required implementation boundary

The future Work Order must declare exact read/write/forbidden/generated paths before execution. It
will likely cross these serialized surfaces, which must not be modified by parallel workers:

- `package.json` and `package-lock.json` for the exact auth dependency;
- `app/layout.tsx` and shared session UI;
- `/api/session` and the server identity resolver;
- `src/server/application/http.ts` and `src/server/application/workflow-http.ts` where protected route identity is resolved;
- SQLite schema/repository paths for a persistent `AppUser` mapping outside resettable workflow state; and
- focused identity, route/privacy, reset-survival, and no-secret tests.

The Work Order must preserve the existing `/api/health` public contract, workflow route paths,
role-specific DTOs, request state machine, version semantics, audit privacy, and deterministic
workflow reset. It must not make provider claims based only on documentation or a successful sign-in
screen.

## Credential and external-action gate

Before dispatching implementation, the main thread must receive explicit authorization for:

- creating or using the Clerk application;
- creating two synthetic provider test identities;
- configuring the exact local callback/origin using one host and port;
- installing the exact verified package version;
- writing approved local environment variables through the authorized secret boundary; and
- testing username/password and, if separately approved, Google in an external browser.

No secret, cookie, token, password, OAuth code, or provider dashboard data belongs in this Task File,
source, logs, or supporting-task report.

## Non-goals

- Do not change the accepted local MVP closure or remove its deterministic demo rollback target.
- Do not add public registration, self-service role assignment, organizations, enterprise SSO, MFA, passkeys, broad profile management, or custom account linking.
- Do not add password recovery unless a separate decision approves a verified email/phone boundary.
- Do not use client role selection, username, email, provider metadata, or Google claims as the RightSpot authorization source.
- Do not add WebMCP, Cloud Receiver, WebRTC, Redis, payments, chat, notifications, deployment, or production SLA work.

## Verification and closure gate

After the credential gate and implementation Work Order are approved, verification must cover the
provider session lifecycle, mapped/unknown/disabled identities, tenant/agent route and object-level
privacy, client role tampering, sign-out/expiry, no dual trust, no-secret logging, fixture-reset
survival of `AppUser`, unchanged public health, unchanged workflow Happy Path, and recoverable
rollback to the demo baseline. Close this task only after the main thread reconciles code, evidence,
environment claims, and the rollback boundary.

## Reopen condition

Reopen or replace this task if Clerk cannot satisfy the verified Next.js/Node/local-origin boundary,
if external credentials are not authorized, if the provider requires excluded product scope, or if
the implementation would move role/assignment authority outside RightSpot.
