# system-health

Public health endpoints for the Express/Prisma service.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Readiness: runs `SELECT 1` through Prisma/Postgres. |
| `GET` | `/health/live` | Liveness: checks only that the process is running. |
| `GET` | `/healthz` | Lightweight operational liveness response; does not query the database. |
| `GET` | `/readyz` | Operational readiness: runs `SELECT 1` through Prisma/Postgres. |

`/health` returns `503 DB_UNAVAILABLE` when the database cannot be reached;
`/readyz` returns `503 receiver_not_ready` for the same condition. The
operational routes set `Cache-Control: no-store`.
