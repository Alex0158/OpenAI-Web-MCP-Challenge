# ADR-0024: Adopt email/password preview authentication

**Status:** Accepted  
**Date:** 2026-09-01  
**Scope:** Local Re-entry Cloud console account sign-in and registration

> **Current disposition:** The console implementation described here is superseded by
> [ADR-0032](ADR-0032-retire-current-cloud-receiver-runtime.md) and remains historical preview
> evidence only.

## Context

The local console used a three-digit workspace code plus a four-digit access PIN. That shape was
only useful as a temporary test credential and made the product feel unlike a developer service.
The requested preview experience is a normal email/password sign-in while keeping the existing
file-backed account store and opaque HttpOnly session cookie.

## Decision

The local Re-entry console accepts exactly an email and password for account registration and
login. Organization creation is a separate authenticated action after login. Passwords are stored
as salted `scrypt` digests. Passwords are never returned to the browser or written to logs. Sessions
remain seven-day opaque HttpOnly cookies.

The preview enforces a simple eight-character minimum and basic email shape validation. It does
not claim production identity, email verification, recovery, MFA, rate limiting, anti-CSRF, or
anti-abuse controls.

## Consequences

- Registration and login are simpler for a developer to understand and test.
- A new account starts with zero organizations and is routed to the organization chooser.
- Existing preview accounts created with the old code/PIN shape must be recreated in a fresh preview
  database; the old credential material cannot be converted into a password.
- Organization API keys and Receiver protocol authentication are unchanged by this decision.
- A future production identity provider can replace this local account store without changing the
  Host organization-key boundary.

## Verification

The Cloud Receiver dashboard test covers registration, invalid-password rejection, valid-password
login, session creation, organization access, and organization management. Full local preview
verification remains `npm run verify` in `runtime/cloud-receiver`.
