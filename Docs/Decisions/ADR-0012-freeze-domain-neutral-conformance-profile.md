# ADR-0012: Freeze the Domain-Neutral Conformance Profile

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex and project team  
**Scope:** Non-production Host, Receiver, Connector, deterministic Agent, orchestration, lifecycle,
and evidence boundary outside the test tree

## Context

ADR-0007 through ADR-0011 now provide locally verified protocol, Host SDK, Receiver authority,
delivery, HTTP transport, and deterministic Agent Adapter contracts. ADR-0010 also has a strong
separate-process recovery test, but its role entrypoints and control plane live under `test/` and
are explicitly evidence fixtures. Relabelling those files as a development runtime would overstate
the current implementation.

ADR-0006 and the Re-entry Core Program Contract still require a domain-neutral conformance Host,
a local development profile around the same Receiver Core, and independently exercisable process
seams. The smallest honest next step is a source-repository conformance profile, not a production
Cloud Receiver, background Connector daemon, pairing system, selected application, or supported
Agent runtime.

## Decision

### 1. Increment boundary

This decision freezes only one deterministic loopback profile that:

- runs one Host role, one Receiver role, and one Connector role in distinct child processes;
- composes the existing Host SDK, Receiver Core, SQLite store, HTTP adapter, outbound Connector
  client, and Agent Adapter contract without changing their authority;
- completes one Manifest, explicit synthetic consent, signed event, delivery claim, deterministic
  Agent dispatch, separately authorized synthetic Host effect, and acknowledgement flow;
- emits one bounded redacted machine-readable result; and
- is reusable by direct execution and separate-process tests outside `test/`.

It does not implement production service shells, public ingress, TLS termination, real user
consent, pairing, credential custody, polling, supervision, installation, a real Host effect,
private managed-context binding, a real Agent, Browser/WebMCP access, a selected application, or a
fallback.

### 2. Profile ownership

| Role | Owns in this profile | Must not receive or infer |
|---|---|---|
| Host child | Ephemeral Host signing key, domain-neutral workflow fixture, Manifest, signed event, and synthetic effect attestation | Receiver database, Connector credential, lease authority, Agent result as effect proof |
| Receiver child | Receiver Core, one SQLite file, public Host key, deterministic consent/identity/effect verifier fixtures, and loopback HTTP listener | Host private key, Agent adapter, Host business truth, production identity claim |
| Connector child | Outbound Connector client, synthetic Connector credential, caller-owned claim input, received lease, and deterministic Agent adapter | Receiver store, Grant issuance, Host signing key, effect assertion authority |
| Profile runner | Child lifecycle, synthetic configuration, bounded control sequencing, assertions, and redacted result | Product authority, public API, persistent credential store, runtime success claim |

The runner is evidence coordination, not a fourth Re-entry Core component. Its ability to seed
deterministic authorities does not prove production isolation or credential custody.

### 3. Communication boundary

The three material protocol operations use only ADR-0010 HTTP:

```text
Host child -> POST /v0.1/events -> Receiver child
Connector child -> POST /v0.1/delivery-claims -> Receiver child
Connector child -> POST /v0.1/delivery-acknowledgements -> Receiver child
```

The listener binds only to literal loopback. The Connector exposes no listener. Existing request,
response, timeout, no-redirect, redaction, replay, lease, and acknowledgement rules remain
unchanged.

Bounded child-process IPC may coordinate readiness, synthetic consent, synthetic effect-verifier
setup, inspection, and teardown. IPC is not a Re-entry Core wire contract and must not add a
runtime health, admin, reset, pairing, consent, or effect route.

### 4. One conformance flow

The profile performs exactly one happy-path run:

1. The Host child creates an ephemeral Ed25519 identity and one domain-neutral Manifest.
2. The Receiver child validates the Manifest and creates a consent challenge.
3. The runner supplies one visibly synthetic decision input; the Receiver's deterministic
   consent fixture creates one private Grant and opaque public binding.
4. The Host child commits its fixture transition conceptually and sends one signed event through
   the Receiver HTTP route.
5. The Connector child claims one delivery through its outbound client using one canonical claim
   value supplied for this run.
6. The Connector derives one credential-free activation and invokes one deterministic Agent
   adapter exactly once.
7. The deterministic adapter returns `accepted / activation_dispatch_accepted`. This proves only
   accepted typed dispatch and does not authorize acknowledgement.
8. The Host child separately creates one correlated synthetic Host-effect attestation. The
   Receiver fixture authorizes that attestation independently of the Agent result.
9. The Connector acknowledges through HTTP with the resulting synthetic effect token.
10. The runner verifies exact correlation, distinct process ownership, Receiver-only SQLite
    loading, bounded outputs, and clean process exit before reporting `passed`.

There is no retry, alternate transport, direct Receiver store access from Host or Connector, or
success path that skips the Host-effect boundary.

### 5. Source and reuse boundary

Profile code belongs under `reentry-core/conformance/`, outside runtime `src/` and outside
`test/`. It is executed from the source repository with:

```sh
node conformance/run.mjs
```

The existing separate-process test must consume the same profile role entrypoints rather than
retain a second copy of Host, Receiver, Connector, or child-control logic. Fault injection and
forced-restart orchestration remain test-owned; reusable role composition does not.

The conformance directory is not a new package export and remains outside the main package
allowlist. No framework, RPC dependency, CLI framework, schema library, logger, retry library, or
service supervisor is added.

### 6. Output and secret boundary

Successful execution writes one exact JSON result to standard output with only:

```text
profile
protocol_version
status
process_isolation
event
delivery
activation
effect
```

The result may contain bounded booleans, protocol outcome/code values, attempt count, and
non-sensitive correlation identifiers. It must not contain private or public keys, Connector,
decision, claim, lease, or effect tokens, raw database paths, raw managed-context identifiers,
full receipts, request bodies, exception messages, stacks, or child stderr.

Expected failures exit non-zero and expose one bounded code on stderr. They do not emit a partial
`passed` result or substitute another operation. Internal test harnesses may retain bounded stderr
for assertion, but tracked evidence must remain redacted.

### 7. Lifecycle and weight

- Every child command and network operation is bounded by an explicit timeout.
- The Receiver uses an exact profile-owned temporary SQLite location; cleanup targets only files
  created for that run after all children close.
- Cleanup may terminate an owned child to prevent an orphan, but it cannot convert a failed flow
  into success.
- One run creates one event, delivery, lease, activation attempt, effect, and acknowledgement.
- The profile adds no background loop, idle polling, retained log, runtime dependency, or package
  export.
- Benchmark and package-weight claims remain separate; the profile measures orchestration truth,
  not service latency or production resource use.

## Consequences

### Positive

- The source repository gains one honest runnable composition instead of a test name standing in
  for a development profile.
- Existing separate-process recovery tests and direct conformance execution share role logic.
- Host key, Receiver persistence, Connector HTTP use, Agent dispatch, and Host effect remain
  visibly distinct.
- Final-app and real-Agent work can consume stable seams without entering the core now.
- Runtime package exports and dependencies remain unchanged.

### Costs and open risks

- Synthetic consent, identity, and effect verification remain evidence fixtures, not security
  implementations.
- The runner sees coordination data that a production topology must distribute through secure
  provisioning and authority stores.
- Loopback IPC and temporary state do not prove public networking, process supervision, restart
  policy, device custody, or multi-replica ownership.
- A deterministic accepted adapter still proves no Agent, Browser, WebMCP, page navigation, Host
  mutation, or human decision.

## Rejected alternatives

- **Leave all runnable composition under `test/`:** preserves good tests but does not supply the
  required development/conformance profile.
- **Promote the current fixtures without a boundary:** would turn fixed credentials, fault hooks,
  and test IPC into an ambiguous pseudo-runtime.
- **Copy the fixture implementation:** creates two drifting process compositions and duplicate
  authority explanations.
- **Build production daemons now:** requires unresolved pairing, credential custody, hosting,
  supervision, TLS, and selected-runtime decisions.
- **Use Agent acceptance as the Host effect:** collapses two authority facts and permits false
  acknowledgement.
- **Add health, admin, reset, consent, or effect HTTP routes:** widens runtime attack surface for
  evidence-only coordination.
- **Package or export the profile as runtime API:** adds install weight and implies a support level
  the project has not established.

## Verification gates

Implementation must prove:

- direct profile execution passes on Node 24 and the current local runtime;
- Host, Receiver, and Connector have distinct process identities;
- only the Receiver role loads SQLite and opens the profile database;
- Host event, Connector claim, and Connector acknowledgement traverse the existing HTTP boundary;
- Agent dispatch receives no Connector, lease, effect, or raw context credential and occurs once;
- acknowledgement remains impossible until the separate correlated synthetic Host effect exists;
- output and failure surfaces exclude all bounded secrets and raw paths;
- existing forced-restart, response-loss, aggregate, and protocol tests still pass against the
  shared role implementation;
- the main package remains zero-runtime-dependency and excludes conformance and test files; and
- no production process, pairing, real Host effect, Agent, Browser, WebMCP, app, deployment, or
  judge claim is inferred.

## Reopen triggers

Reopen this decision if shared role logic would weaken fault injection, source-repository users
need a stable non-IPC development control surface, the selected deployment profile supplies a
supported service lifecycle that should replace this fixture topology, or the selected Host or
Agent requires a materially different boundary.
