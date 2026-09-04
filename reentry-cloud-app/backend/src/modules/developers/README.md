# developers

Owns the minimal developer account flow. It deliberately mirrors the user
flow without sharing its database model or session cookie.

## Endpoints

Mounted at `/v1/auth/developers`:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/register` | Create a developer account and start a session. |
| `POST` | `/login` | Verify the email/password and start a session. |
| `GET` | `/me` | Return the current developer. |
| `POST` | `/logout` | Clear the developer session cookie. |

The Prisma model is `DeveloperAccount`, mapped to
`cr2_developer_accounts`. The public shape is only `{ id, email }`.
