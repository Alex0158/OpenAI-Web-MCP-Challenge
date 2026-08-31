# RECORE-006: Private Managed-Context Binding Resolution

**Role:** ACTIVE IMPLEMENTATION RECORD  
**Risk profile:** High — private target selection and adapter authority  
**Status:** `specified`  
**Opened:** 2026-08-31  
**Branch:** `codex/re-entry-core-foundation`  
**Baseline:** `1b4f4b204f01d03dddb51a478dac668474e93904`

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

**Next entry condition:** implement only after ADR-0014 and this record are committed and remotely
verified. On closure, run the final exact Program completion audit rather than widening private
binding into a platform implementation.
