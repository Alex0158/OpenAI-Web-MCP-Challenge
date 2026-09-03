# CLOUD-025: Browser Session Logout Protection

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Status:** `verification_pending` — local route, focused tests, builds, and credentialed split-origin browser flow pass; standing aggregate preflight and hosted readback remain open  
**Opened:** 2026-09-03  
**Task:** [TASK-030](../Tasks/TASK-030-protect-browser-session-logout.md)  
**Finding:** AUDIT-V2-008 in [Core/09](../Core/09-business-flows-and-ux.md)

## Objective

Prevent a cross-site form from clearing either production browser session while preserving the
separate user/developer cookies and idempotent same-origin logout behavior.

## Implemented boundary

- User and developer `POST /v1/auth/.../logout` routes use the existing
  `requireSameOriginJson` guard.
- The guard requires the configured frontend `Origin` and `application/json`; it does not combine
  account types or make logout depend on a live session.
- The frontend user and developer logout helpers send the exact empty JSON object (`{}`), so the
  browser call satisfies the guard on the split-origin deployment.
- Controllers still clear only their own httpOnly cookie. No database migration or token model
  change is included.

## Red and Green evidence

The focused backend authentication suite was first run against a disposable local PostgreSQL
database with the unguarded routes. The intentional Red run observed cross-origin logout returning
`200` and unsupported content type returning `200`.

After the route/client change, the same suite passed `5/5` tests:

| Case | Result |
|---|---|
| Cross-origin user and developer logout | `403 csrf_origin_invalid`; both sessions remain usable |
| Unsupported content type | `415 http_content_type_invalid`; session remains usable |
| Same-origin user logout | `200`; only `user_session` is cleared |
| Same-origin developer logout | `200`; only `developer_session` is cleared |
| Repeated logout | `200`; idempotent |

The test file is
`saas-boilerplate/backend/src/modules/authentication/test/authentication.test.ts`.

The backend and frontend type-checks passed. Backend compilation passed with `npm run build -w
backend`, and the frontend production build passed with
`NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4400 npm run build -w frontend`.

An aggregate backend run with the same disposable database passed `16` suites and `121` tests.
Five standing suites (`32` tests) intentionally stopped at their existing task-owned database
preflight because this run did not provide the restricted `STANDING_*_TEST_DATABASE_URL` values;
this is a verification precondition, not a logout failure. The full aggregate gate remains open.

## Browser evidence

With backend `:4400`, frontend `:4300`, and a separate attacker origin `:4301`:

1. The browser registered and reached the authenticated user dashboard.
2. A real cross-origin HTML form POST to `/v1/auth/users/logout` received `403` and the browser
   returned to the dashboard still authenticated.
3. The dashboard's same-origin **Log out** action returned to the public home page; reopening the
   dashboard redirected to `/user-login`, proving the intended cookie was cleared.

No cookie values were captured or written to evidence.

## Remaining verification gate

Run the standing aggregate suites with their task-owned baseline/closure database preflight and
perform the intended hosted release readback. Capture only status/cookie-presence outcomes; never
record cookie values.

This record does not claim that hosted deployment, production cookie domain configuration, or a
complete production session-security review is verified.
