# Experimental Desktop Bridge

**Not a product Adapter or published Connector integration.**

[ADR-0047](../../Docs/Decisions/ADR-0047-authorize-local-desktop-bridge-probe.md) authorizes one
local experimental messaging/wake probe inspired by the frozen MVP 1 native Desktop relay.
[CLOUD-027](../../Docs/Development/CLOUD-027-experimental-desktop-bridge-probe.md) owns its exact
runtime evidence. This module does not import or modify frozen MVP code.

## Scope and prerequisites

- Run only inside the explicitly approved local Desktop execution environment on Node 24.
- The app must supply `CODEX_APP_TOOLS_PIPE_PATH`; the executor must supply its actual
  `CODEX_THREAD_ID`. These are private runtime context, not user-editable destination overrides.
- The app-owned socket must pass restrictive endpoint and parent checks. Never chmod, replace,
  remove, discover another pipe, or repair its configuration to make the check pass.
- The operator privately selects one existing disposable task and its expected workspace. This is
  not Grant enrollment or proof of account ownership. The destination is verified before sending.
- The only native operations are catalog read, exact-task read, and one fixed inert probe message.
  The message asks for its marker and no tools. There is no Browser, task-create, configuration,
  arbitrary prompt/method, Receiver, Game, or effect-ACK operation.

The transport is non-public and version-sensitive. `send_message_to_thread` is a messaging primitive;
a successful experiment is not proof of ADR-0046's notification-only input semantics. In particular,
a `userMessage` is recorded as such, not relabelled as `functionCallOutput`.

## Operator interface

The one-shot CLI reads at most 4096 bytes of private JSON from stdin, then stdin must close. Its
allowed fields are `targetId`, `expectedCwd`, `marker`, and optional `priorMarker`. Do not put raw
locators in command arguments, environment files, prompts, shell history, logs, or tracked evidence.
Supply this input through the approved local operator; no private configuration file is generated.

`node runtime/experimental-desktop-bridge/scripts/probe-once.mjs --inspect` performs only preflight.
Omitting the mode also selects read-only preflight. `--send-once` is a separate explicit operation
and requires the authorized one-shot input; it is never used as a fallback for another route.

The allowed new marker begins with `REENTRY_BRIDGE_` and contains only bounded uppercase letters,
digits, and underscores. It is correlation, not authentication. A retained older marker is observed
separately, not resent or deleted. A new live attempt after unknown outcome or process restart
requires separate owner approval, even though the software latch is only process-local.

Normal output contains redacted phases and bounded fields: preflight, reported submission,
correlated input role, actual Agent activity, exact marker response, unexpected tool activity,
and shutdown. Native failures expose only a fixed allowlisted code, never native error text or task
content. Submission acceptance is not a
trusted delivery receipt, actual wake, Browser capability, or business completion.

The CLI exits nonzero for failed preflight or an unproven clean correlated completed turn. Exit zero
in inspect mode means only exact-task preflight passed; in send mode it means the bounded observer
saw the new input start a completed turn with its exact marker response and no observed tool or
unknown item types. Even that result is experimental messaging evidence, not a delivery receipt.

Observation lasts at most a 90-second loop plus an in-flight bounded native request. It is read-only,
not Receiver supervision of Game work. The client stops on completed correlated response, unexpected
tool activity, observation failure, or the deadline. No send is retried. Exiting closes only its own
connection: no listener or daemon remains, but already submitted input cannot be retracted.

## Local verification

Run `node --test runtime/experimental-desktop-bridge/test/*.test.mjs` from the repository root.
These tests use injected clients or fresh local fake sockets, never the app's real pipe or real
tasks. They verify the bounded client, not enrollment, cross-process idempotency, Browser/WebMCP,
or production support. The runtime probe is a separately authorized, manually controlled check.
