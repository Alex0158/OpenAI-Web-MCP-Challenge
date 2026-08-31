# RECORE-006: Private Managed-Context Binding Resolution

**Role:** CLOSED IMPLEMENTATION RECORD  
**Risk profile:** High — private target selection and adapter authority  
**Status:** `locally_verified`  
**Opened:** 2026-08-31  
**Closed:** 2026-08-31  
**Branch:** `codex/re-entry-core-foundation`  
**Baseline:** `1b4f4b204f01d03dddb51a478dac668474e93904`  
**Implementation commit:** `41fa3ef47b6b43c1234962419f08165f52d7b004`

## Objective

Implement and locally verify the ADR-0014 application-neutral private binding-resolution
contract. Let one replaceable adapter resolve the Receiver-issued private receipt `grant_id` to
one adapter-private binding without exposing a raw context locator through the Host, Cloud
Receiver, delivery activation, typed result, or public evidence.

Target closure is `locally_verified` only. Production binding capture, provisioning, persistence,
custody, retirement propagation, and real Agent activation remain selected-runtime work.

## Authority and sequencing

- ADR-0006 owns the Host, Receiver, Local Connector, and adapter process boundaries.
- ADR-0007 owns the private continuation receipt and opaque Host binding.
- ADR-0011 owns credential-free activation, typed results, one-call behavior, and no fallback.
- ADR-0013 owns Grant revocation and existing lease-order semantics.
- ADR-0014 owns binding lookup, raw-locator custody, and the bound-adapter contract.
- Core/03 through Core/05 own the final architecture, trust, and evidence ceiling.

This increment follows RECORE-005 because process-fault evidence no longer depends on an
unimplemented authority transition. It precedes the final Program audit because private binding
is the last application-neutral contract marked partial by RECORE-003.

## Challenge

### Hypothesis

One new module, one explicit package subpath, one deterministic authority, and focused tests can
close the application-neutral lookup seam. The existing private receipt already supplies the only
safe key, and the existing Agent result contract already supplies the correct failure surface.
No Receiver route, schema, persistence method, Connector API, platform SDK, or fallback is needed.

### Falsifiers and stop conditions

- A raw context locator must enter Host, Cloud Receiver, delivery lease, activation, result, log,
  or tracked evidence.
- Context selection requires a public binding, workflow ID, delivery target, event field, or
  caller-supplied value instead of the private receipt `grant_id`.
- Correct behavior requires a new Receiver route, schema, binding database, enrollment outbox,
  Connector retry, or production credential store.
- One activation can invoke more than one resolver or driver, or try another adapter/context.
- Missing capability cannot remain an exact ADR-0011 unsupported result.
- The implementation must choose Codex, Browser, WebMCP, or another concrete Agent platform.

If a falsifier occurs, preserve the smallest failing evidence and reopen ADR-0014. Do not hide the
gap through a synthetic global binding, automatic retry, or generic adapter framework.

### Result

The hypothesis held. One new zero-dependency module and one explicit subpath close the Core
consumer seam without changing a Receiver route, schema, Connector client, conformance output, or
platform contract. Review found one lease-boundary race in the first implementation: an authority
lookup could complete after dispatch timeout and still continue inside the unresolved adapter
promise. The final implementation rechecks the adapter clock after lookup and before any driver
call. A deterministic boundary test proves that late resolution reaches no driver.

## Minimal implementation boundary

- Add `src/managed-context-adapter.mjs` with the exact binding record validator and
  `createManagedContextAdapter` factory.
- Add one `./managed-context-adapter` package export; keep the root import unchanged.
- Reuse the existing activation and result types. Add only the smallest validation export needed
  to prevent a bound adapter from accepting a malformed direct activation.
- Keep the authority and driver injected. Do not implement a runtime store or platform command.
- Add focused tests for exact active, missing, inactive, malformed, mismatch, accessor, exception,
  timeout, one-call, and non-disclosure behavior.
- Re-run aggregate, protocol, direct conformance, dependency, package-weight, and current Agent
  Adapter benchmark checks on Node 24 and the current runtime where material.

## Acceptance and claim boundary

- Resolution input contains only exact private Grant and configured adapter identifiers.
- One valid live binding reaches one selected driver once, after activation time is rechecked on
  lookup completion.
- A live binding must remain authoritative through the complete activation lease.
- No active binding returns exact `managed_context_resume` unsupported status.
- Expired binding rejects without driver invocation.
- Authority and driver failures remain bounded unknown outcomes with no retry.
- Private binding data is absent from every public or typed result surface.
- Runtime dependencies remain zero and package expansion is limited to the named module/export.
- Closure claims no real context capture, persistence, wake, Browser, WebMCP, Host effect,
  production process, deployment, selected app, or judge portability.

## Explicitly unaffected

- Manifest, event, public binding, receipt, lease, acknowledgement, and Host-effect wire shapes;
- Receiver Core, SQLite Receiver schema, Cloud Receiver HTTP, and Local Connector client;
- consent, Grant control, pairing, production identity, credential custody, and revocation
  propagation;
- conformance profile output and separate-process fault harness unless a direct contradiction is
  found;
- MVP1, MVP2, References, research, scenarios, final-app work, deployment, and submission;
- user-owned dirty files outside the exact task paths.

## Verification record

**Closure:** `locally_verified` on 2026-08-31.

- Eight managed-context tests and the combined fourteen-test Agent/managed-context focused suite
  pass on Node 24.20.0 and Node 26.5.0.
- The complete suite passes 79 of 79 tests on both runtimes. The protocol suite separately passes
  11 of 11 tests on both, and the unchanged conformance runner emits its exact passing bounded
  result on both.
- Focused evidence covers exact factory and activation shapes, immutable Grant-only lookup, one
  configured adapter, active, missing, expired, lease-shorter, late-resolution, mismatched,
  malformed, accessor-bearing, authority exception, timeout, invalid-driver-result, one-call,
  no-driver, and raw-reference non-disclosure paths.
- Package self-import succeeds on both runtimes. Runtime dependencies remain zero.
- `npm pack --dry-run --json` selects 16 files, 34,227 compressed bytes, and 180,301 unpacked
  bytes. Relative to the RECORE-005 closure baseline, the exact change is one file, 1,625
  compressed bytes, and 9,869 unpacked bytes; tests and development evidence remain excluded.
- The unchanged Agent Adapter benchmark remains a bounded regression sample. Node 24.20.0 records
  23.759 ms median process-plus-import startup, 127,432 activation derivations per second, and
  60,512 accepted dispatches per second. Node 26.5.0 records 28.946 ms, 107,346, and 52,051
  respectively. These are same-machine samples, not managed-context, Agent, or service latency.
- Exact staging excluded MVP1, MVP2, references, research, scenarios, mutable runtime state, raw
  locator evidence, and the user's unrelated dirty files. The implementation commit is pushed and
  the local and remote branch both resolve to
  `41fa3ef47b6b43c1234962419f08165f52d7b004`.

## Residual boundary

The authority and driver are deterministic injected ports. No production binding was captured,
stored, encrypted, rotated, retired, or resumed. No real Agent, Browser, WebMCP, Host effect,
Cloud Receiver process, Connector daemon, deployment, selected app, or judge path is proven. A
selected runtime must decide and verify those surfaces without moving its raw locator into the
Host, Cloud Receiver, event, activation, typed result, or public evidence.

**Next entry condition:** run the final exact Program completion audit. Do not widen private
binding resolution into a platform implementation before a selected-runtime decision.
