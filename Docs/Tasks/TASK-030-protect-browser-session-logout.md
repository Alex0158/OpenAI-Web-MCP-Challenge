# TASK-030: Protect Browser Session Logout

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `defect`
- Lifecycle: `pending`
- Priority: `P2`
- Owner: Cloud Receiver v2 authentication owner.
- Current increment: Bind user and developer logout to the intended session and origin/content-type
  boundary.
- Next gate: Focused negative tests prove that a cross-origin request cannot clear either production
  session cookie while same-origin logout remains idempotent.
- Dependencies: AUDIT-V2-008 in Core/09, Core/04, ADR-0033's separate account boundary, and the
  Primary Development Runbook.

## 1. Problem and objective

Production cookies use `SameSite=None; Secure`, while both logout routes accept a POST without the
session or same-origin JSON guards used by other state-changing browser routes. A cross-site form can
therefore terminate a browser session. No authority gain or data mutation beyond logout is evidenced.

The objective is to remove this session-disruption path without combining user and developer
identity or changing consent authority.

## 2. Authority and evidence

- Core/04 owns production anti-CSRF and session controls.
- ADR-0033 owns separate user/developer sessions.
- Current evidence is the cookie options, both auth routers and logout controllers, and the existing
  same-origin middleware, as indexed by Core/09 AUDIT-V2-008.

## 3. Scope

Apply the narrowest consistent logout authorization/origin rule to both account types and add
same-origin success, cross-origin rejection, wrong-account, missing-session, and cookie-clearing
tests. Preserve stable public error handling.

## 4. Non-goals

- replacing JWT sessions or adding OAuth/refresh tokens;
- combining account tables or roles;
- changing consent, pairing, API-key, or Connector authorization; or
- claiming complete production session security from this one fix.

## 5. Verification and closure

Close only when focused authentication tests, backend aggregate tests, type-check, build, and a
credentialed split-origin browser check pass, and Core/04 plus the active auth README match the
implemented boundary.

## 6. Reopen condition

Reopen if cookie SameSite/domain behavior, frontend/backend origins, logout method, session type, or
cross-origin middleware changes.
