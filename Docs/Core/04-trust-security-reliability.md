# Re-entry Core — Trust, Security, and Reliability

**Role:** CANONICAL cross-cutting trust, security, and reliability policy  
**Status:** Protocol-v0.1 controls, bounded active-v2 authorization/Consent/delivery paths, and the
additive standing-v0.2 application-neutral transport reference and active-Receiver working-tree
kernel locally verified; public controls, pinned release, product v0.2 adoption, pairing abuse
control, effective expiry, default effect acknowledgement,
production identity, custody, services, and runtime evidence remain open  
**Authority:** ADR-0006 through ADR-0015, historical ADR-0019 through ADR-0032, and active v2
ADR-0033 through ADR-0045

## Selected-product authority amendment

[ADR-0046](../Decisions/ADR-0046-restore-bound-task-notification-continuation.md) separates trusted notification handoff from business completion. The selected
Receiver must not infer failed delivery from Agent interruption, no action, or absent Game effects.
Handoff identity, receipt authority, bounded retry, response loss, and unknown-outcome reconciliation
remain mandatory design/verification gates under TASK-029; generic adapter acceptance is not proof.
Private binding ownership and restart-safe custody are TASK-035 gates. Existing effect-token,
lease, and revocation rules below still govern retained v0.1/v0.2 implementations; no route or
stored credential is reinterpreted by this target amendment. Revocation cannot retract an already
handed-over notification or undo work. Current Host authorization and human limits remain decisive.

## 1. Security objective

Allow user-approved future continuation, including a scoped standing relationship, without letting
the Host, event issuer, Receiver, Connector, Agent Adapter, page content, or stale runtime silently
widen durable authority or turn it into unbounded execution.

This document owns system-wide policy and trust boundaries. Module-specific state and failure
semantics belong to [Docs/Mechanisms](../Mechanisms/README.md). Dated implementation evidence
belongs to Core/05, Development, Research, and frozen evidence.

## 2. Protected assets

- Host issuer private keys;
- Receiver consent and control-session authority;
- Re-entry account session and account-to-device pairing state;
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
| Manifest issuer | Host key and trusted origin | offer one bounded v0.1 Event or one scoped v0.2 signal relationship | create a Grant or choose an Agent context |
| Consent decision | Receiver-owned authenticated session | approve or decline one exact challenge | caller-asserted approval or Host-selected subject |
| Continuation Grant | Receiver Core | accept one v0.1 Event or repeated ordered v0.2 signals within the visible scope | Host mutation, parallel activations, or arbitrary Agent instruction |
| Signed event | Host issuer plus live Grant | reserve one pending Delivery within the protocol mode | prove current Host state, Consent, or Agent execution |
| Connector lease | Receiver target authority | dispatch one bounded activation attempt | issue/revoke Grants or choose a context |
| Private context binding | configured adapter authority | select one exact managed context | expose the locator or acknowledge delivery |
| Current Host session | Host application | read or mutate current authorized workflow state | inherit stale event or Agent assertions |
| Human decision | authenticated user in current Host state | cross the selected consequence boundary | delegation by a hidden Site Tool |

Possession of one opaque identifier is never sufficient to gain the next authority.

## 4. Cross-cutting invariants

1. Authority is resolved from trusted stored state before untrusted caller data is interpreted.
2. Consent, control, Connector, and adapter tokens are action- and boundary-specific.
3. Secrets and raw platform identifiers are absent from public bindings, event bodies, activation,
   result, error, logs, and shareable evidence; the local Connector bearer is held only in its
   intended restrictive local credential file.
4. The event contains no prompt, goal, artifact, tool plan, or arbitrary instruction.
5. Current Host authorization and state are checked again after re-entry.
6. Replay returns prior truth only for exact canonical identity; conflicting reuse fails.
7. Retries are explicit and bounded; unknown external outcome never becomes assumed success.
8. Revocation fences future authority but does not rewrite committed history.
9. Test authorities, loopback transport, and deterministic adapters are not production identity.
10. No fallback may hide unsupported capability, missing binding, stale state, or failed evidence.
11. A standing Grant is non-consumable, but each signal receives only one bounded activation and the
    initial v0.2 profile permits at most one non-terminal activation per Grant.
12. High-frequency Host domain events are coalesced into bounded Agent signals; the canonical page,
    not an Event backlog or Agent memory, remains authoritative for current work.

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
| Forged Host offer or event | origin anchoring, allowlisted Ed25519 key, canonical bytes, bounded clock skew; standing Grants pin exact consented key ID and SHA-256 SPKI material fingerprint | local deterministic keys and vectors; same-origin alternate key and same-ID material rebinding rejected |
| Caller-asserted consent | Receiver-owned decision authority, challenge/action/subject binding, expiry | local preview control only; no production session |
| Binding enumeration or cross-subject control | authenticate before private resolution, same-subject check, bounded summary | Core/store tests; no production session |
| Replay or conflicting event reuse | exact event identity, canonical payload comparison, atomic prior-outcome return | local Core/store tests |
| Double run or partial reservation | v0.1 atomically consumes one run and creates pending delivery; v0.2 atomically advances sequence and reserves one active slot without consuming the Grant | SQLite reference evidence |
| Standing-Grant Agent storm or parallel mutation | one-active reservation, contiguous sequence, retryable backpressure, Host-side signal coalescing, Receiver quota | **REFERENCE LOCALLY VERIFIED:** one-active/sequence/backpressure; Host coalescing and production quota open under TASK-033 |
| Hidden standing-scope expansion | exact visible scope, new Consent for origin/Host-key/workflow/URL/signal/instruction/subject/target/human-boundary change unless a separately accepted audited rotation preserves authority | **REFERENCE LOCALLY VERIFIED:** strict v0.2 Manifest scope and persisted key-material pin; product UX and cross-layer enforcement open under TASK-033 |
| Stale or wrong Connector | target identity, short lease, claim digest, attempt bound, stale-worker fence | local and test-process evidence |
| Adapter credential leakage | credential-free activation and private adapter-local binding lookup | deterministic contract evidence |
| Wrong managed context | lookup only by private Grant and configured adapter, exact scope and lifetime checks | deterministic authority/driver |
| False completion | selected product requires trusted notification-handoff proof, distinct from Agent/Game completion; retained v0.1/v0.2 ACKs still require separate Host-effect verification | notification transition open under TASK-029; existing effect evidence uses synthetic authority |
| Stale Host mutation | canonical-page revalidation, server authorization, revision compare-and-swap | frozen MVP1 fixture evidence |
| Prompt injection through event/page copy | bounded typed event, untrusted display treatment, no prompt transport | contract and negative tests |
| Hidden fallback | explicit unsupported/unknown states and no automatic retry or alternate adapter | local tests |
| Accidental Stage 1 public exposure | literal loopback bind, absolute trusted composition, fail-closed startup | local shell and child-process tests; no TLS or public-profile evidence |
| Device-authorization or Connector-token leakage | short-lived device secret, one-time credential issue, digest-only control state, no token logs or browser display, restrictive local credential file | local preview tests; no production browser session, rotation, or recovery evidence |
| Pairing-code guessing | bounded entropy plus an enforceable attempt/rate fence and secret-free terminal behavior | **CONFLICTED:** active v2 has an eight-hex-character code, no claim limiter, and an unused failed-attempt field; TASK-026 |
| Consent/Grant lifetime misunderstanding | distinct windows, explicit Receiver narrowing, and user-visible effective expiry | **CONFLICTED:** the retained active-v2 v0.1 path copies the shorter session expiry into the Grant without displaying it. The standing kernel stores separate deadlines, but product lifetime and display policy remain open under TASK-027 |
| Cross-site session termination | matching session plus origin/content-type protection on state-changing browser requests | **LOCALLY VERIFIED:** both logout routes use the configured same-origin JSON guard, preserve the other account cookie, and passed a local split-origin browser flow; hosted release readback remains under TASK-030 |
| Consent replay, wrong-account approval, or Host-selected device | account session, organization authentication, challenge/action binding, eligible-device selection, digest-only storage, exact decision fencing | local preview tests; no production session or CSRF evidence |

## 7. Reliability semantics

### Atomic boundaries

- Enrollment decision creates Grant, binding, and receipt under one Receiver transaction.
- Protocol-v0.1 Event acceptance records the Event, consumes the one-run budget, and creates pending
  Delivery atomically.
- Protocol-v0.2 signal acceptance must record the Event, advance its sequence, reserve the single
  active slot, and create pending Delivery atomically without consuming the standing Grant.
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
- The Receiver stores no raw consent, device-authorization, control, Connector, or lease tokens;
  the Local Connector stores its own bearer only in its restrictive credential file.
- Managed-context references remain inside the adapter custody boundary.
- Logs and public evidence use bounded correlation and redacted outcomes.
- Revocation preserves minimal private history needed for replay, race, and audit semantics.

Production retention periods, deletion, export, backup, legal hold, and subject-access behavior are
selected-app and deployment decisions. They are not invented by the application-neutral Core.

## 9. Human control

The user must understand the signal, scope, expiry or renewal rule, activation limit, reason for
return, and consequence that remains human-only. For v0.1 the control surface shows the one-run
limit. For v0.2 it shows that authorization persists across signals until revoked, expired, or
materially changed, plus the fact that revocation cannot retract an activation already delivered to
an external Agent. The user can decline enrollment and later inspect or revoke the exact Grant
through an authenticated Receiver-owned control surface.

Agent preparation must remain visible and revisable in normal Host UI. A selected app must enforce
the human consequence in backend authorization and tool registration, not only in copy or model
instructions.

## 10. Production controls still required

- real consent and Grant-control identity, recovery, anti-CSRF, and session security;
- issuer onboarding, origin ownership, key rotation, revocation, and compromise response;
- Receiver service identity, TLS, rate limits, admission control, and abuse monitoring;
- production Connector authorization, credential storage, revocation, supervision, upgrade, and
  device recovery;
- managed-context capture, encryption, retirement, migration, and in-flight revocation behavior;
- real Host-effect verification;
- production persistence, backup, restore, corruption handling, and multi-instance ownership;
- selected-app retention, deletion, privacy, audit, and support obligations; and
- deployment, incident response, observability, and judge-safe evidence.

The active v2 P0/P1 deviations are indexed in Core/09. In particular, green Pairing tests do not
prove the ADR-0033 failed-claim fence, green Consent tests do not select the effective Grant lifetime,
and green acknowledgement tests do not provide the default Connector with a real effect authority.

These controls are gates. Test fixtures must not be renamed or wrapped to imply that they exist.

## 11. Update rule

Change this file only for a cross-cutting authority, threat, reliability, data-minimization, or
human-control rule. Put exact module behavior in the owning Mechanism document, durable choices in
an ADR, and executed evidence in Core/05 or its evidence owner.
