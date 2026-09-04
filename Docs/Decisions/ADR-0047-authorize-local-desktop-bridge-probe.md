# ADR-0047: Authorize a Local Experimental Desktop Bridge Probe

**Status:** Accepted for the bounded experiment only; no production Adapter selected  
**Date:** 2026-09-04  
**Decision owner:** Project owner  
**Task:** TASK-035

## Context and decision

The owner explicitly approved a local, disableable experimental Desktop bridge, including the
possibility of non-public local interfaces, after CLOUD-026 persisted a queue input without an
observed same-task wake. The owner also identified MVP 1's successful original-task route as
relevant evidence. Its frozen P0 relay used the Desktop app's native task-control pipe, not a
public standalone Connector API.

Authorize one separate runtime client under `runtime/experimental-desktop-bridge/` to revalidate
that exact class of local route against one pre-existing disposable test task. Do not modify or
import frozen MVP behavior as a production dependency. This decision does not supersede ADR-0046
or select the final product Adapter, enrollment binding, notification protocol, or receipt.

## Allowed route and authority

- Use only the current execution environment's app-provided `CODEX_APP_TOOLS_PIPE_PATH`, not a
  filesystem search, discovered credential store, different account, or alternate runtime.
- Verify the app-owned endpoint is an absolute, non-symlink Unix socket owned by the executing
  user with restrictive permissions. Its resolved parent must prevent another user replacing the
  endpoint, including appropriate sticky-directory protection when applicable. Never repair,
  chmod, replace, or delete app-owned state. These checks are local isolation, not cryptographic
  peer attestation or proof of cloud-account ownership.
- Read the live tool catalog and allow only exact-task `read_thread` and one
  `send_message_to_thread` operation. No arbitrary native RPC, Browser opening, task creation,
  history injection, configuration changes, permission overrides, or writer takeover.
- Use the actual caller task identity inherited from the current executor. Do not impersonate
  the destination as caller. Per-request synthetic correlation labels, where required by the
  installed wrapper, are not asserted to be real runtime turn identifiers.
- The manually approved private test target and expected workspace are fixed before dispatch.
  Require authoritative readback of that exact target and workspace. Keep locators, pipe paths,
  conversation content, and native error text out of normal output and tracked evidence.

## One-shot diagnostic contract

The default is disabled/read-only. An explicit one-shot invocation permits at most one new inert
probe input, constructed internally from an allowlisted non-secret marker. It requests only a
marker acknowledgement, no tools or business work. A latch is set before submitting; failure,
timeout, or ambiguous response cannot cause a resend in that invocation. No daemon, listener,
LaunchAgent, background monitor, or reconnect fallback is authorized.

This experiment permits at most one new live submission. A timeout, ambiguous outcome, or process
restart does not authorize another submission; a second live attempt requires a separate explicit
owner decision. The process-local latch is not cross-process idempotency.

The original native probe permits a `userMessage` diagnostic input; it does not prescribe the
role returned by every task-messaging surface. Observe the actual role without relabelling it.
The host-mediated control below observed `functionCallOutput` through the exposed task tool, not
through a substituted `turn/start.toolOutput` API. Neither role alone proves ADR-0046 notification
delivery or a new user strategy. Deliberately selecting another input API still requires its own
reviewed admission test; do not silently substitute one inside this probe.

CLOUD-026's older Q1 input may still be queued. Preserve it, use a distinct marker, and separate
its eventual consumption from the new bridge-correlated turn. Do not claim the task receives only
one total input, and do not delete queued messages to simplify evidence.

## Verification, shutdown, and stop conditions

### Original-method baseline clarification

The owner requested restoration of the successful MVP method and prompt correction of misleading
Core statements. Reproduction must account for its launcher, route-specific runtime, real source
task context, caller/target relationship, allowed operations and message contract. A one-shot
scope reduction does not establish that a different process identity is equivalent. Node 24 is
the fixture-test baseline, not a requirement to replace an integration-specific runtime.

Test-only checks may exercise the frozen launcher using a clearly fake runtime and the frozen
relay using an injected fake native client, with no ambient App context. Frozen source remains
unchanged. These checks do not connect to Desktop or consume C1. Do not reinterpret this request
as permission to bypass peer authorization, run the rejected native client through a trusted
executable, or overwrite a source task identifier to equal the approved destination. The existing
live invocation prerequisite and one-shot scope below remain unchanged.

### Connector-initiated temporary relay extension, 2026-09-04

The owner explicitly approved one temporary local relay and one new inert test notification after
the B1 control. This is a new C1 allowance, not a reset of B1. Its objective is a notification
initiated by the existing Local Connector while the exact pre-approved target has no active turn,
followed by an attributable new turn and exact marker response in that same task.

The permitted implementation uses the existing Connector consumer and a narrow adapter/relay;
it does not select a production driver or add a second Connector. Before opening the listener,
establish an App-authorized host invocation with actual caller metadata and preserved approval
handling. A supplied runtime path, stored task identifier or local relay token is not that
authority. Do not retry the rejected custom native client through a trusted executable, manufacture
host request metadata, reuse another task as caller, or weaken the App's policy. If no legitimate
invocation is available, record the missing capability without starting a listener or sending C1.

The relay may expose only one newly created, owner-private local Unix socket, one fixed target and
workspace, readback, and one internally fixed marker-only send. No target, prompt, tool, endpoint,
caller or permission override from the Connector is accepted. Bound request size, connection count
and lifetime; stop the task-owned relay after this diagnostic or on failure. Preserve any existing
socket or other process. Do not install a service, open a network listener, access credentials,
change App configuration, start a new task, open Browser, perform Game work, contact the Receiver,
publish a package, or deploy.

Reserve C1 before any possible live submission; an uncertain send consumes the allowance and
permits no retry or transport fallback. Neither a relay acknowledgement nor a Connector result
proves task wake. Observe exact-target baseline, distinct input, actual input role, new-turn
attribution, exact response and unexpected tool use. Record source-executor dependence separately:
another active Agent relaying a tool call is not independent background Connector admission.
The old native CLI remains held. Broader lifetime, restart, enrollment and notification settlement
remain subsequent product decisions and tests.

### Host-mediated control clarification, 2026-09-04

The owner's continued authorization after the MVP provenance review permits using the already
exposed App task tools for one explicitly labelled positive control against the same approved
disposable target. Use the existing unused B1 allowance, not an additional send. The App handles
its own caller metadata and approval policy; do not construct another caller, override approval,
connect a custom native client, or start the frozen relay. Verify exact target/workspace and a non-running
baseline, send one internally fixed inert marker, then observe through read-only task tools.

Reserve the allowance before dispatch and treat an unknown outcome as consumed. Preserve any
older queued input and record its consumption separately. This control is not a retry or rescue of
the Q1 queue experiment and cannot turn that experiment's negative result into success. It proves
only current host-mediated task behavior, not custom-client admission, autonomous Connector wake,
Browser/WebMCP, private enrollment, or production notification semantics. The native CLI hold stays
in place. A later native submission requires a separate allowance even if this control fails.

This is a diagnostic-method clarification, not production Adapter selection or permission to replay
the complete MVP relay. That replay includes a task-launched listener and Browser operations outside
the current experiment. No such scope expansion is authorized here.

### Required observations

Unit and local socket tests must cover disabled mode, malformed/override input, exact-target and
workspace mismatch, unsafe endpoint, bounded framing/timeouts, repeated/concurrent submission,
redacted failure, and no fallback. The real probe separates:

1. local endpoint and task verification;
2. reported submission/admission;
3. the exact new input item and its role;
4. an actual correlated turn in the same task and marker response; and
5. any unexpected tool activity or consumption of the older input.

Observation is bounded and read-only. Stop submitting on uncertainty; close only the client-owned
connection at completion or interruption. Exiting disables the bridge but cannot retract a
previously accepted input. Missing capability, conflicting identity, unsafe custody, unexpected
authority requirements, or a need for broader secret access stops the experiment visibly.

Success proves only the named current-build experimental messaging/wake route. It does not prove
genuine Game WebMCP, standing authorization, Grant-to-task enrollment, restart durability, reliable
notification receipt, business completion, supported public integration, deployment, or release.
No new branch, Game/deployment edits, Receiver traffic, SDK/Connector publication, or mutation of
retained effect-backed v0.1/v0.2 contracts is authorized.

## Alternatives and consequences

The supported CLI queue path remains preserved negative/partial evidence. Waiting for an exposed
supported Desktop endpoint is the conservative alternative. The selected bounded experiment can
test original-task feasibility now, but non-public IPC may break on an app update and must never
be marketed as supported production integration. Broader use requires a new explicit decision.
