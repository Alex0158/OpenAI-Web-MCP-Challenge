# authentication

Shared credential validation and session-cookie primitives for the two account
modules. This module does not own a combined account table or role system.

## Files

| File | Role |
|---|---|
| `schemas.ts` | Email/password validation for user and developer forms. |
| `session.ts` | Signs, verifies, and clears the two typed JWT cookies. |
| `auth.routes.ts` | Mounts the user and developer auth routers. |

## Session contract

- `user_session` is accepted only by user routes.
- `developer_session` is accepted only by developer routes.
- Each JWT contains the account id as `sub` and its account type as `kind`.
- Cookies are httpOnly; localhost uses `sameSite: "lax"`, while the split-origin
  hosted flow uses `sameSite: "none"` and `Secure` in production.
- There is no Google OAuth, bearer-token fallback, refresh-token table, or
  role middleware.

The account-specific services and controllers live in `../users/` and
`../developers/`, keeping the two flows easy to change independently.
