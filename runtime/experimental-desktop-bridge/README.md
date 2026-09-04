# Experimental Desktop Bridge

**Not a product Adapter or published Connector integration.**

[ADR-0047](../../Docs/Decisions/ADR-0047-authorize-local-desktop-bridge-probe.md) bounds the local
messaging/wake experiments inspired by the frozen MVP 1 native Desktop relay.
[CLOUD-027](../../Docs/Development/CLOUD-027-experimental-desktop-bridge-probe.md) owns its exact
runtime evidence. Runtime modules do not import or modify frozen MVP code. The baseline regression
test alone imports the unchanged relay with an injected fake native client.

## Scope and prerequisites

- The operational CLI is held: CLOUD-028 has not established legitimate custom-client invocation.
  ADR-0047's one-shot allowance was consumed by a separately labelled host-mediated control.
  A subsequent temporary-relay/C1 experiment is approved, but has not established its host invocation
  or started a listener/send. There is no native-CLI unlock flag; C1 is not permission to bypass it.
- The receiving-side source review found no active-caller-turn gate for MCP messaging and found
  target resume/start/steer paths. This is source compatibility only: legitimate native client
  admission and preservation of upstream App approval remain unproved. Do not infer a required
  background delegation token or an idle-task rejection from missing wrapper metadata.
- Any future reviewed live route must run only inside its approved local Desktop execution
  environment and preserve the App's actual caller and approval policy. Node 24 is the local test
  closure baseline, not a rule to replace a route-specific App runtime.
- A custom native route must use only its own App-provided endpoint. Caller provenance must come
  from that route's host/executor contract; possession of a task-ID environment value or signed
  executable path does not establish caller authority. No destination-as-caller substitution.
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

The operational `scripts/probe-once.mjs` exits nonzero with `admission_unverified` and
`submission:not_sent` for default, `--inspect`, and `--send-once`. Unsupported or combined modes
return `invalid_mode`, also without sending. It does not read private stdin or runtime context,
import native code, inspect/connect an endpoint, or wait for stdin to close. It creates no listener
and performs no retry. Do not provide private locators to this held entrypoint.
`admission_unverified` is a fixed local guard result, not an App response or a new native failure.

Only a reviewed implementation of an established legitimate invocation contract may replace this
hold. A caller value, signed executable path, environment flag, marker, or purported approval field
cannot unlock it. This local guard is not an App authenticator and does not prove runtime admission.

## Current host-mediated control

CLOUD-028 records one current App-tool control on the already approved existing task. The readback
contains old Q1 input/response, then B1 as an untruncated named `functionCallOutput` object and its
exact marker response in the same new completed turn. No tool invocation was observed. This proves
same-task input/response, not isolated B1 wake, background Connector access, Browser or notification
receipt. The observer now recognizes that exact object shape, preserves its tool-data role, rejects
truncated/foreign envelopes, and keeps joined-turn attribution separate. This parser is not an
authenticator. The control used the single allowance; neither it nor native B1 may be resent without
a new explicit allowance.

## Retained fixture-only orchestration

The earlier CLI orchestration is retained in `test/fixtures/probe-runner.mjs` solely for subprocess
regressions. It uses a hardcoded fake caller and a fixture-specific temporary socket path supplied
by the test harness, never the ambient App pipe/caller variables. Launching without that fixture
context fails before native activity. This runner is not an alternative operator entrypoint, and
the operational CLI neither imports nor delegates to it.

Fixture input is bounded to 4096 bytes and fields `targetId`, `expectedCwd`, `marker`, and optional
`priorMarker`. Fixture default/inspect mode exercises preflight; fixture send mode exercises one
internally constructed inert message. These are fake-process checks, not instructions for a live run.

The allowed new marker begins with `REENTRY_BRIDGE_` and contains only bounded uppercase letters,
digits, and underscores. It is correlation, not authentication. A retained older marker is observed
separately, not resent or deleted. A new live attempt after unknown outcome or process restart
requires separate owner approval, even though the software latch is only process-local.

Normal output contains redacted phases and bounded fields: preflight, reported submission,
correlated input role, actual Agent activity, exact marker response, unexpected tool activity,
and shutdown. Native failures expose only a fixed allowlisted code, never native error text or task
content. Submission acceptance is not a
trusted delivery receipt, actual wake, Browser capability, or business completion.

The fixture runner exits nonzero for failed preflight or an unproven clean correlated completed turn.
Exit zero in fixture inspect mode means only exact-task preflight passed; in send mode the observer
saw the new input start a completed turn with its exact marker response and no observed tool or
unknown item types. Even that result is experimental messaging evidence, not a delivery receipt.

Observation lasts at most a 90-second loop plus an in-flight bounded native request. It is read-only,
not Receiver supervision of Game work. The client stops on completed correlated response, unexpected
tool activity, observation failure, or the deadline. No send is retried. Exiting closes only its own
connection: no listener or daemon remains, but already submitted input cannot be retracted.

## Local verification

`test/mvp-method-baseline.test.mjs` exercises the original launcher with a clearly fake runtime,
never the App-provided executable, and explicit child environments without ambient caller/pipe
context. It also proves that the frozen relay rejects inert-marker and target-override requests
before any fake native tool call. These checks preserve original-method distinctions; they do
not unlock the CLI, establish live admission, or reproduce a current Desktop wake.

Run `node --test runtime/experimental-desktop-bridge/test/*.test.mjs` from the repository root.
These tests use injected clients or fresh local fake sockets, never the app's real pipe or real
tasks. They verify the bounded client, not enrollment, cross-process idempotency, Browser/WebMCP,
or production support. Operational hold tests additionally deny filesystem reads except the CLI's
own source and deny child-process creation using the Node 24 permission model. No native B1 send
was performed; the distinct host-mediated control consumed the allowance. Fixture passes cannot
establish legitimate native admission or reopen that allowance.
