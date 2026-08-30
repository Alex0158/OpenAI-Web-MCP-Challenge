# WebMCP Re-entry P0 Fixture

This directory implements the disposable, domain-neutral validation harness defined by
[`../Docs/Core/07-p0-technical-validation-mvp.md`](../Docs/Core/07-p0-technical-validation-mvp.md).
It is not the final application or a production architecture.

## Current proof boundary

The fixture has passed the five frozen questions in one clean correlated run. The current
ChatGPT Desktop Browser genuinely invoked the Stage-A Site Tools, the Receiver created a
user-authorized private Grant and returned only an opaque binding, one signed event reached
the same bound task, the event-opened canonical page genuinely rediscovered and invoked the
Stage-B Site Tool, and the same artifact stopped uncommitted at the human boundary. Exact
replay created no second event, run, or write. The frozen P0 contract scope had 37 tests
before the additive H1 work; the historical combined P0 and H1 suite passed 59 tests, and
the current full suite including the additive H2 spike plus hardened D4 lifecycle,
contamination-latch, and automation-history scanner controls passes 114 tests. The
frozen clean-run package retains its historical 23-test result. A separate post-fix runbook rehearsal repeated the complete chain
after correcting long-task relay response compaction.

The current fixture also fails closed when stale Stage-A tools are invoked after transition,
rejects non-canonical or overlong manifest expiry values and non-canonical event timestamps,
and uses SQL compare-and-swap for workflow transitions and artifact writes.
The page uses registration `AbortSignal` to replace state-inapplicable Site Tools after a
fresh authoritative read. The current Desktop Browser has passed the isolated lifecycle
probe implemented in
[`scripts/site-tool-lifecycle-probe-server.mjs`](scripts/site-tool-lifecycle-probe-server.mjs)
and recorded in
[`evidence/site-tool-lifecycle-probe-2026-08-30.json`](evidence/site-tool-lifecycle-probe-2026-08-30.json).

Two additive Scheduled Task probes are also recorded without changing the frozen P0 claim.
H0a is a qualified Browser-join pass because its scheduled prompt repeated the URL and tool
name. H0b is the stronger sealed-context pass: a trigger-only scheduled prompt in an existing
idle task recovered a previously stored bounded receipt, opened a fresh built-in Browser tab,
rediscovered the current genuine Site Tools, and invoked the receipt's read-only action role
without the private Desktop relay or a substitute data path. See the
[`H0b verdict`](evidence/h0b-sealed-context-scheduled-reentry-2026-08-30-verdict.md).

The additive H1 experiment has also passed once on the same current Desktop build. Four
trigger-only scheduled turns proved the no-event gate, one authenticated durable event across
Receiver restart, genuine fresh Inbox and Host Site Tool continuation, acknowledgement-loss
idempotency, exact event replay, and a final completed-event no-op. The Host artifact changed
once and remained uncommitted; the private adapter was never used. See the
[`H1 verdict`](evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md) and
[`H1 runbook`](H1_RUNBOOK.md). This is still a bounded local experiment, not a production
transport or a public platform guarantee.

The later [`H2a cold-runtime verdict`](evidence/h2a-cold-browser-runtime-reentry-2026-08-30-verdict.md)
proves that H0/H1 did not require the controlled task's old in-memory Browser variables. After
that task-scoped Node kernel was terminated, a scheduled turn started a new kernel,
reinitialized Browser/WebMCP, satisfied the new runtime's required documentation preflight,
and completed a genuine no-event Inbox call. The Desktop app itself was not restarted.

The additive
[`H2 durable-enrollment verdict`](evidence/h2-durable-enrollment-service-contract-2026-08-30-verdict.md)
proves a crash-recoverable enrollment service contract without changing the default P0/H1
paths. One approval transaction persists a non-active Grant, Inbox, and receipt outbox. A
stable dispatch ID, bounded lease, and separate idempotent SQLite destination tolerate lost
acknowledgements; activation remains fenced until durable receipt delivery and exact Host
binding. Real `SIGKILL` tests cover four commit boundaries, and independent approval
processes converge on one enrollment. The sealed receipt is purged after durable
acknowledgement, and H2 status and trace surfaces redact private authority data. This is a
synthetic service-contract pass, not evidence of a real Desktop or hosted destination,
production worker supervision, production key lifecycle, multi-tenant isolation, or
distributed exactly-once execution.

The prepared [`D4 — Desktop restart with an independent Receiver`](D4_H2B_RUNBOOK.md) defines the
next app-neutral Desktop-lifecycle experiment. Its bounded harness uses a `launchd`-owned
Receiver, observer, and relaunch helpers; keeps the Receiver available while only the Desktop
app is restarted; correlates process replacement with a one-shot scheduler attempt and strict
accepted heartbeat envelope; and scans any public derivative for private authority. Its scripts
pass syntax checks, and local fail-closed rehearsals have completed. An earlier scanner revision passed
one clean rehearsal candidate, but that is not certification under the hardened history,
current-row, and expected-arm gates. The first formal no-event attempt is
preserved as `INCONCLUSIVE`: normal quit reached zero Desktop main/current-tree processes, but an
unrelated detached P0 relay was misclassified as lifecycle state, so the helper never requested
automatic relaunch. A delayed turn later failed closed with no Site Tool or workflow effect. The
shared lifecycle classifier and contamination latch now pass thirteen focused process controls;
thirteen scanner-history controls also pass. The hardened scanner rejects this historical attempt
because its automation contract drifted and its row was later deleted. No valid no-event arm or
event arm has completed. No full Desktop restart continuity claim is made. See the
[provisional attempt record](evidence/d4-h2b-first-formal-no-event-inconclusive-2026-08-30.md).

This is a controlled, same-user, current-build P0 technical-feasibility result. The Desktop
join in the frozen P0 run used an undocumented local relay and is not a supported production
architecture. H0b, H1, and H2a used Scheduled same-task pull and did not use that relay, but
they also do not establish a public production transport contract. The fixture adapter
remains synthetic-only; the frozen P0 Desktop result comes from the explicit `desktop-task`
adapter route plus downstream Browser evidence. See the
[clean-run verdict](evidence/p0-correlated-clean-run-2026-08-30-verdict.md) and
[post-fix rehearsal](evidence/runbook-rehearsal-post-fix-2026-08-30-verdict.md), plus the
[reproduction runbook](RUNBOOK.md).

## Run locally

Requires Node.js 24 or newer.

```sh
npm test
npm run reset
npm start
```

The opt-in H2 spike also exposes one bounded worker invocation:

```sh
npm run worker:h2:once
```

This command drains one eligible H2 outbox item and exits. It is not a continuously
supervised production daemon.

Then open `http://127.0.0.1:4317/workflows/WF-001` in the ChatGPT Desktop built-in Browser.
The fixture keeps mutable runtime state under `var/` and bounded proof output under
`evidence/`; both are local development artifacts.

Before accepting any Site Tool result, use a current unified ChatGPT Desktop client, select
GPT-5.6 Sol or GPT-5.6 Terra, confirm
`Settings > Browser > Permissions > Enable site tools`, and verify that OpenAI's official
[Site Tools control page](https://learn.chatgpt.com/docs/webmcp) exposes genuine Site Tools.
If the official control fails, stop the WebMCP assertion and resolve the client, permission,
account, workspace, or rollout gate before diagnosing this fixture.

To perform the deterministic transition and deliver a signed event while the server is
running:

```sh
npm run trigger
```

After the resumed Stage-B continuation, prove deduplication without changing state:

```sh
npm run replay
```

The frozen P0 Desktop bridge run has additional private-runtime prerequisites and an exact
genuine-WebMCP sequence. Follow [`RUNBOOK.md`](RUNBOOK.md); ordinary REST calls, DOM
automation, generic MCP tools, and the synthetic adapter cannot be counted as Q1 or Q4.

Development secrets are fixed test values and must not be reused outside this local
fixture.

Trusted context capture is disabled unless the server and the local Receiver client share an
ephemeral `WEBMCP_P0_RECEIVER_CLIENT_TOKEN`. The token is never returned to the website or
written to evidence. The capture route accepts no context ID; the adapter selects the private
managed context and the Receiver returns only a short-lived one-time bearer.
