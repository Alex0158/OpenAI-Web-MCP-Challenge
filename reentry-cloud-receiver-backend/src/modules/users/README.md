# users

Owns the minimal user account flow.

## Endpoints

Mounted at `/v1/auth/users`:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/register` | Create a user account and start a session. |
| `POST` | `/login` | Verify the email/password and start a session. |
| `GET` | `/me` | Return the current user. |
| `POST` | `/logout` | Clear the user session cookie. |

## Files

- `user.service.ts` contains the Prisma queries for `UserAccount`.
- `user-auth.controller.ts` contains registration, login, profile, and logout
  handlers.
- `user-auth.routes.ts` defines the endpoint and middleware order.

The public shape is only `{ id, email }`. Password hashes never leave the
service boundary.
