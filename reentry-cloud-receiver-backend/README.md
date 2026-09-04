# Re-entry Cloud Receiver v2 Backend

This directory is the independently deployable backend surface for Cloud
Receiver v2.

## Vercel project setup

Configure the Vercel project root as:

```text
reentry-cloud-receiver-backend
```

Vercel then discovers [`api/index.ts`](api/index.ts) as the Node.js function
entrypoint. It exports the Express app and deliberately does not call
`listen()`. The repository-level historical `vercel.json` is not part of this
deployment surface.

Required production runtime variables are `CLOUD_RECEIVER_RUNTIME_DATABASE_URL`
(the Supabase session-mode pooler URL) or `DATABASE_URL`, `JWT_SECRET` with at
least 32 characters, `FRONTEND_URL`, and `RECEIVER_PUBLIC_URL`. Set
`COOKIE_DOMAIN` only when the frontend and backend share a parent domain.
`DIRECT_URL` is for Prisma migration commands and is not needed by request
handling when the runtime URL is configured.

Keep the frontend's `NEXT_PUBLIC_BACKEND_URL` pointed at this backend origin.
The frontend has no database, JWT, Connector-token, Grant-control, or
Supabase service-role variable.

## Current Vercel Preview

The current non-production integration Preview is available at
<https://cloud-receiver-delta.vercel.app>. Its paired frontend is
<https://re-entry-weld.vercel.app>. These aliases are Preview-only and must not
be treated as production evidence.

The backend does not render account pages. For Connector compatibility,
`/user-login` and `/user-register` redirect to the matching path on the
configured `FRONTEND_URL`; the optional `next` value is preserved only when it
is a relative path.

For the split-origin browser flow, `FRONTEND_URL` must exactly match the
frontend origin. Production session cookies use `SameSite=None; Secure`, and
the API must answer credentialed CORS preflights without redirecting them.

## Connector lifecycle

The active v2 Connector signs itself out with
`POST /v0.1/connectors/disconnect` and an exact JSON body containing only its
saved `connector_token`. The Receiver stamps `revoked_at` once, retains the
Connector row, rejects future claims, and returns a replay-safe disconnected
response. The route uses no browser cookie or Organization credential and
never returns the raw token.

The read-only regression check is:

```sh
curl -i -X OPTIONS \
  -H 'Origin: https://re-entry-weld.vercel.app' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' \
  https://cloud-receiver-delta.vercel.app/v1/auth/users/login
```

Expected: `204`, an exact `Access-Control-Allow-Origin` for the frontend,
`Access-Control-Allow-Credentials: true`, and no `Location` header.

## Migration boundary

Run Prisma migrations as a separately authorized release step before routing
traffic to a deployment:

```sh
npx prisma migrate deploy
```

Supply `DIRECT_URL` (or the approved migration fallback) to that command. Do
not run migrations from the Vercel build, `api/index.ts`, or a function cold
start. The local `backend/entrypoint.sh` is for the Docker image and is not a
Vercel startup command.

## Local process

Use `src/index.ts` for the standalone local Express listener. The Vercel
handler is tested through Supertest and must remain listener-free.

## Local package

This directory is the backend half of the full-integration workspace. It was
copied from the SaaS boilerplate backend and made standalone by using the
local `shared/` type package. It does not require the SaaS repository
workspace to install or type-check.

```sh
npm install
cp .env.example .env.local
npm run type-check
npm run build
```
