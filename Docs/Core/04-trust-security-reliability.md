# Re-entry Core — Trust, Security, and Reliability

**Role:** CANONICAL cross-cutting trust, security, and reliability policy  
**Status:** Application-neutral controls locally verified at their stated boundary; production
identity, custody, services, and runtime evidence open  
**Authority:** ADR-0006 through ADR-0015

## 1. Security objective

Allow one user-approved future continuation without letting the Host, event issuer, Receiver,
Connector, Agent Adapter, page content, or stale runtime silently widen authority.

This document owns system-wide policy and trust boundaries. Module-specific state and failure
semantics belong to [Docs/Mechanisms](../Mechanisms/README.md). Dated implementation evidence
belongs to Core/05, Development, Research, and frozen evidence.

## 2. Protected assets

- Host issuer private keys;
- Receiver consent and control-session authority;
- private Grant, subject, and delivery-target identity;
- Connector and lease credentials;
- private managed-context binding and raw platform locator;
- Host workflow state and artifact revision;
- human-only consequential actions;
- audit and evidence integrity; and
- user content excluded from bounded event and transport surfaces.

## 3. Authority model

| Authority | Granted by | Permits | Does not permit |
|---|---|---|---|
| Manifest issuer | Host key and trusted origin | offer one bounded future event | create a Grant or choose an Agent context |
| Consent decision | Receiver-owned authenticated session | approve or decline one exact challenge | caller-asserted approval or Host-selected subject |
| Continuation Grant | Receiver Core | accept one matching event within scope | Host mutation or arbitrary Agent instruction |
| Signed event | Host issuer plus live Grant | reserve one pending delivery | prove current Host state or Agent execution |
| Connector lease | Receiver target authority | dispatch one bounded activation attempt | issue/revoke Grants or choose a context |
| Private context binding | configured adapter authority | select one exact managed context | expose the locator or acknowledge delivery |
| Current Host session | Host application | read or mutate current authorized workflow state | inherit stale event or Agent assertions |
| Human decision | authenticated user in current Host state | cross the selected consequence boundary | delegation by a hidden Site Tool |

Possession of one opaque identifier is never sufficient to gain the next authority.

## 4. Cross-cutting invariants

1. Authority is resolved from trusted stored state before untrusted caller data is interpreted.
2. Consent, control, Connector, and adapter tokens are action- and boundary-specific.
3. Secrets and raw platform identifiers are absent from public bindings, event bodies, activation,
   result, error, logs, and shareable evidence.
4. The event contains no prompt, goal, artifact, tool plan, or arbitrary instruction.
5. Current Host authorization and state are checked again after re-entry.
6. Replay returns prior truth only for exact canonical identity; conflicting reuse fails.
7. Retries are explicit and bounded; unknown external outcome never becomes assumed success.
8. Revocation fences future authority but does not rewrite committed history.
9. Test authorities, loopback transport, and deterministic adapters are not production identity.
10. No fallback may hide unsupported capability, missing binding, stale state, or failed evidence.

## 5. Trust boundaries

~~~text
Host key boundary
    signed Manifest and event
          |
          v
Receiver identity and persistence boundary
    private Grant and delivery truth
          |
          v
Connector device/process boundary
    short lease and credential-free activation
          |
          v
Agent Adapter custody boundary
    private binding reference
          |
          v
Host page authority boundary
    current session, state, tools, and human consequence
~~~

No boundary receives the private authority held by the next boundary merely to simplify
integration.

## 6. Threat and control matrix

| Threat | Required control | Current evidence limit |
|---|---|---|
| Forged Host offer or event | origin anchoring, allowlisted Ed25519 key, canonical bytes, bounded clock skew | local deterministic keys and vectors |
| Caller-asserted consent | Receiver-owned decision authority, challenge/action/subject binding, expiry | deterministic authority only |
| Binding enumeration or cross-subject control | authenticate before private resolution, same-subject check, bounded summary | Core/store tests; no production session |
| Replay or conflicting event reuse | exact event identity, canonical payload comparison, atomic prior-outcome return | local Core/store tests |
| Double run or partial reservation | one transaction consumes run and creates pending delivery | SQLite reference evidence |
| Stale or wrong Connector | target identity, short lease, claim digest, attempt bound, stale-worker fence | local and test-process evidence |
| Adapter credential leakage | credential-free activation and private adapter-local binding lookup | deterministic contract evidence |
| Wrong managed context | lookup only by private Grant and configured adapter, exact scope and lifetime checks | deterministic authority/driver |
| False completion | separate trusted Host-effect verification before acknowledgement | synthetic authority only |
| Stale Host mutation | canonical-page revalidation, server authorization, revision compare-and-swap | frozen MVP1 fixture evidence |
| Prompt injection through event/page copy | bounded typed event, untrusted display treatment, no prompt transport | contract and negative tests |
| Hidden fallback | explicit unsupported/unknown states and no automatic retry or alternate adapter | local tests |

## 7. Reliability semantics

### Atomic boundaries

- Enrollment decision creates Grant, binding, and receipt under one Receiver transaction.
- Event acceptance records the event, consumes the one-run budget, and creates pending delivery
  atomically.
- Revocation compare-and-set serializes against event and lease transitions.
- Delivery claim, reclaim, stale-worker fencing, effect binding, and acknowledgement use explicit
  store transactions.

### Failure states

The system keeps these states distinct:

- rejected input or authority;
- accepted pending work;
- leased activation;
- unsupported capability;
- rejected activation;
- outcome unknown;
- Host effect absent, present, or conflicting;
- acknowledged completion;
- expired, revoked, exhausted, or terminal work.

Timeout, exception, process exit, and response loss do not collapse into success. The operator or a
later exact replay reconciles authoritative stored state.

### Durability boundary

The Node SQLite reference store uses explicit transactions and file-backed durability settings.
Recorded tests cover exact migrations, close/reopen behavior, response loss, selected process
restarts, and one pre-commit termination position. This is not arbitrary-crash, disk-corruption,
power-loss, distributed-store, or multi-replica evidence.

## 8. Data minimization and retention

- Host events carry identifiers, state version, event type, time, and canonical URL only.
- Full artifacts and free-form business payloads remain in the Host application.
- Public bindings exclude private Grant, subject, delivery target, receipt, and Agent identity.
- Raw consent, control, Connector, and lease tokens are not persisted.
- Managed-context references remain inside the adapter custody boundary.
- Logs and public evidence use bounded correlation and redacted outcomes.
- Revocation preserves minimal private history needed for replay, race, and audit semantics.

Production retention periods, deletion, export, backup, legal hold, and subject-access behavior are
selected-app and deployment decisions. They are not invented by the application-neutral Core.

## 9. Human control

The user must understand the event, scope, expiry, one-run limit, reason for return, and consequence
that remains human-only. The user can decline enrollment and later inspect or revoke the exact
Grant through an authenticated Receiver-owned control surface.

Agent preparation must remain visible and revisable in normal Host UI. A selected app must enforce
the human consequence in backend authorization and tool registration, not only in copy or model
instructions.

## 10. Production controls still required

- real consent and Grant-control identity, recovery, anti-CSRF, and session security;
- issuer onboarding, origin ownership, key rotation, revocation, and compromise response;
- Receiver service identity, TLS, rate limits, admission control, and abuse monitoring;
- Connector pairing, credential storage, revocation, supervision, upgrade, and device recovery;
- managed-context capture, encryption, retirement, migration, and in-flight revocation behavior;
- real Host-effect verification;
- production persistence, backup, restore, corruption handling, and multi-instance ownership;
- selected-app retention, deletion, privacy, audit, and support obligations; and
- deployment, incident response, observability, and judge-safe evidence.

These controls are gates. Test fixtures must not be renamed or wrapped to imply that they exist.

## 11. Update rule

Change this file only for a cross-cutting authority, threat, reliability, data-minimization, or
human-control rule. Put exact module behavior in the owning Mechanism document, durable choices in
an ADR, and executed evidence in Core/05 or its evidence owner.
