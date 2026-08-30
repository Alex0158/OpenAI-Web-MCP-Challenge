# MVP Evidence Index

This directory indexes the frozen P0 evidence package and the additive bounded runtime probes
that followed it. The additive H0, H1, H2a, H2, D4, and platform-join records do not rewrite or
widen the five frozen P0 feasibility questions.

The controlled P0 passed on 2026-08-30. `latest-trace.jsonl` remains mutable development
output and is not authoritative by itself. The frozen clean package is:

- [`p0-correlated-clean-run-2026-08-30-verdict.md`](p0-correlated-clean-run-2026-08-30-verdict.md) — concise Q1–Q5 verdict and claim boundary;
- `p0-correlated-clean-run-2026-08-30-environment.json` — current client, host, relay boundary, and immutable-reference hashes;
- `p0-correlated-clean-run-2026-08-30-stage-a.json` — genuine Stage-A inventory, calls, artifact, and signed Manifest;
- `p0-correlated-clean-run-2026-08-30-consent-and-binding.json` — Receiver decision, Grant, same-task receipt, and opaque-only host binding;
- `p0-correlated-clean-run-2026-08-30-stage-b.json` — separate downstream Browser verifier for the event-opened page, genuine Stage-B call, and human boundary;
- `p0-correlated-clean-run-2026-08-30-database-verdict.json` — final one-event, one-run, revision-2, uncommitted state;
- `p0-correlated-clean-run-2026-08-30-tests.json` — historical 23-of-23 clean-run snapshot;
- `p0-correlated-clean-run-2026-08-30-trace.jsonl` — frozen redacted 13-record correlation; and
- `p0-clean-run-stage-b-human-boundary-2026-08-30.jpg` — usable visible final-state evidence.

The package contains no raw Desktop task ID, full opaque binding, Receiver/relay bearer, or
native pipe path. The Receiver adapter's trace fields remain conservative because they are
recorded at dispatch time and cannot observe downstream Browser execution; the separate
Stage-B JSON is the verifier for Q4 and Q5.

The independent reproduction artifacts are separate from that frozen package:

- [`runbook-rehearsal-post-fix-2026-08-30-verdict.md`](runbook-rehearsal-post-fix-2026-08-30-verdict.md)
  indexes the successful post-fix rehearsal, including its environment, Stage-A,
  consent-and-binding, downstream Stage-B verifier, named trace, database verdict,
  historical 31-test report, and visible Stage-B JPEG;
- [`runbook-rehearsal-response-size-failure-2026-08-30.md`](runbook-rehearsal-response-size-failure-2026-08-30.md)
  preserves the earlier greater-than-64-KiB relay failure as diagnostic evidence only.

A passing package contains:

- the runtime and client environment snapshot;
- Stage-A and Stage-B genuine Site Tool inventories;
- one correlated redacted trace;
- the component-test report;
- visual evidence of Browser re-entry, uncommitted state, and the visible commit control;
- a verdict for Q1 through Q5 that distinguishes supported runtime evidence from fixture
  simulation.

The fixture adapter always reports `proof_classification: synthetic_only`. Evidence from
that adapter may validate contracts and negative controls, but it must never be presented
as proof of real Desktop resumption or Site Tool capability continuity. The final pass used
the explicit `desktop-task` route and genuine page-bound Browser observations.

## Current bounded probes

- `browser-webmcp-capability-probe.json` preserves the older Desktop client negative control.
  Its public copy redacts the private managed-context identifier.
- `browser-webmcp-stage-a-probe-2026-08-30.json` records the newer ChatGPT Desktop official
  control pass and the genuine Stage-A Q1 pass. It does not prove Q2 through Q5.
- `app-server-resume-probe.json` isolates exact App Server context continuation. Its public
  copy redacts the private thread and turn identifiers.
- [`app-server-browser-join-probe-2026-08-30.json`](app-server-browser-join-probe-2026-08-30.json)
  records the failed cold join. The App-Server-owned thread resumed exactly, but
  the Desktop in-app Browser was `iab-unavailable`; no page or genuine Site Tool was reached.
- [`app-server-browser-warm-join-probe-2026-08-30.json`](app-server-browser-warm-join-probe-2026-08-30.json)
  records the failed exact-task warm join. The standalone App Server returned an active-writer
  rejection for the exact task supplied by the controlled Desktop-priming step. The public JSON
  directly proves the rejection, but not the writer's owner or the pre-probe Browser state.
  Together, these bounded failures reject both tested standalone Desktop joins and remove that
  route from current selection unless a materially different supported contract or topology
  appears; they do not claim that App Server is unusable in every topology.
- `receiver-app-server-event-probe.json` isolates signed-event, exact-context, and
  one-run deduplication behavior for Q3. Its public copy redacts the private managed-context
  identifier.
- `bridge-kill-test-correlated-run-2026-08-30.jsonl` preserves an integrated kill test that
  includes earlier rejection/retry history. It is not the clean acceptance trace.
- `p0-clean-run-consent-before-approval-2026-08-30.png` is a visually cropped diagnostic
  capture whose historical `.png` name contains JPEG data. It is not used as consent
  acceptance evidence. Q2 relies on the explicit user authorization, Receiver decision,
  final database state, same-task enrollment receipt, and genuine binding registration.
- `p0-clean-run-stage-b-human-boundary-2026-08-30.png` is the original historical filename
  for the JPEG capture. The correctly named `.jpg` copy is the indexed acceptance artifact.
- `site-tool-lifecycle-probe-2026-08-30.json` records the bounded current-client stale-tool
  reproduction and post-fix `AbortSignal` reconciliation result without task identity,
  bindings, secrets, or local temporary paths.
- [`h0-scheduled-browser-site-tool-probe-2026-08-30-verdict.md`](h0-scheduled-browser-site-tool-probe-2026-08-30-verdict.md)
  and its JSON record preserve the existing-idle-task Scheduled Turn, fresh built-in Browser,
  and genuine read-only Site Tool H0a qualified pass. Because its prompt repeated the marker,
  URL, and tool name, it does not prove prior-context-driven re-entry, direct event wake, or H1.
- [`h0b-sealed-context-scheduled-reentry-2026-08-30-verdict.md`](h0b-sealed-context-scheduled-reentry-2026-08-30-verdict.md)
  and its redacted JSON record preserve the stronger sealed-receipt H0b pass. The scheduled
  prompt contained no canary, workflow ID, URL, or Site Tool name; the task recovered them
  from prior context and completed the fresh genuine read-only Site Tool action.
- [`h1-event-gated-scheduled-reentry-2026-08-30-verdict.md`](h1-event-gated-scheduled-reentry-2026-08-30-verdict.md)
  and its redacted JSON record preserve the bounded H1 pass. Four trigger-only scheduled turns
  proved a no-event stop, one authenticated event across Receiver restart, one genuine Host
  effect, acknowledgement-loss idempotency, exact event replay, and a final no-op after
  completion. The package deliberately excludes the task ID, Inbox bearer, event identities,
  tickets, effect receipts, opaque binding, and runtime secrets.
- [`h2a-cold-browser-runtime-reentry-2026-08-30-verdict.md`](h2a-cold-browser-runtime-reentry-2026-08-30-verdict.md)
  and its redacted JSON record preserve the controlled cold-runtime pass. After the prior
  task-scoped Node Browser kernel was terminated, one scheduled turn started a new kernel,
  rebuilt the Browser runtime, satisfied its mandatory documentation preflight, and invoked
  the genuine Inbox no-event Site Tool without Host navigation or mutation. It does not claim
  a full Desktop app restart.
- [`h2-durable-enrollment-service-contract-2026-08-30-verdict.md`](h2-durable-enrollment-service-contract-2026-08-30-verdict.md)
  and its [machine-readable JSON record](h2-durable-enrollment-service-contract-2026-08-30.json)
  preserve the `H2_SERVICE_CONTRACT_PASS`. At that H2 checkpoint, the focused H2 suite passed
  30 of 30 tests and the then-current full MVP suite passed 88 of 88. The bounded evidence covers atomic approval, real
  process-kill recovery, concurrent approval and dispatch, lease fencing, pre-dispatch
  authority checks, exact sealed-receipt validation, idempotent Host binding, and secret
  exclusion. Its destination is synthetic, its worker is a one-shot process rather than a
  daemon, and it does not prove real Desktop or hosted delivery, production architecture, or
  product value.
- [`h2-worker-trace-routing-contamination-2026-08-30-verdict.md`](h2-worker-trace-routing-contamination-2026-08-30-verdict.md)
  preserves a diagnostic trace-routing mistake from an early H2 one-shot worker test. Its
  fourteen synthetic records are retained in the adjacent JSONL file and were removed only
  from the mutable P0 trace, leaving the original thirteen P0 records unchanged. The worker
  trace-isolation regression test now prevents recurrence. This is not H2 acceptance evidence.
- [`d4-h2b-first-formal-no-event-inconclusive-2026-08-30.md`](d4-h2b-first-formal-no-event-inconclusive-2026-08-30.md)
  preserves the first formal D4 no-event attempt as `INCONCLUSIVE`. Normal quit reached zero
  Desktop main/current-tree processes, but an unrelated detached P0 relay was misclassified as
  lifecycle state, so the helper did not relaunch. A delayed turn later failed closed with no
  Site Tool or workflow effect. Thirteen focused lifecycle/contamination controls and thirteen
  automation-history scanner controls passed. The then-current suite passed 114 tests after the
  harness correction; the current 118-test suite adds four App Server join-probe evidence controls.
  The scanner correctly refuses to certify this attempt because the observed
  contract drifted and the current automation row is absent; no valid D4 arm has completed.
