# Heartbeat Business Viability and Bounded Use

**Role:** SUPPORTING product, platform, and operating-model research  
**Status:** Current-build feasibility evidence plus a commercial kill-test plan; not a
production transport decision  
**Observed:** 2026-08-30  
**Scope:** Scheduled pull economics, latency, availability, scalability, claim boundaries,
and the smallest responsible H1 operating policy

## Executive judgment

The sealed-context H0b result made scheduled pull a credible **H1 experiment**. The bounded
H1 runtime has now passed and makes it a technically credible hackathon demonstration path.
It still does not make polling the likely production transport.

The route has one important strategic advantage: it uses an existing same-chat schedule as
the wake source, so an independent Receiver does not need an undocumented API to push into a
Desktop task. Its disadvantages are equally structural: time-based polling consumes runs
when nothing happened, introduces cadence-bounded latency, requires the relevant client and
device environment to remain available for local work, and has no published guarantee that
an unattended turn will retain Browser and Site Tool capability.

The correct near-term position is therefore:

> Use a short-lived, event-gated scheduled pull to test the concept. Measure it. Do not make
> it the product moat or production architecture unless the selected application's latency,
> reliability, privacy, and unit economics all fit the measured result.

## 1. Verified platform and runtime facts

### Official platform facts

- [Scheduled Tasks](https://learn.chatgpt.com/docs/automations) can run in the background.
  A task scheduled inside an existing chat returns to that chat with its existing context.
- Desktop scheduled work that needs local files requires the computer to remain on and the
  app to remain running.
- Native event-triggered tasks currently support selected Gmail, Slack, and GitHub events
  on web and mobile. They are not a generic custom-event trigger for Desktop.
- [Browser](https://learn.chatgpt.com/docs/browser) is available in the Desktop app and gives
  the user and Agent a shared view of web and local web applications.
- [Site Tools](https://learn.chatgpt.com/docs/webmcp) are page-bound. They can disappear when
  the page closes or navigates away. Current availability depends on model, client, rollout,
  workspace, and the current page; GPT-5.6 Luna and Enterprise/Edu are excluded at the time
  of observation.
- The official documents do not publish an unattended Browser/Site Tool compatibility
  guarantee, per-run schedule cost, exact schedule-latency service level, retry/catch-up
  semantics, or a per-task concurrency ceiling.
- [Official pricing and usage](https://learn.chatgpt.com/docs/pricing) states that ChatGPT
  Work and Codex share usage. Current local-message estimates per five-hour window vary by
  model and task complexity: Sol `10–100` and Terra `25–200` for Plus and Business. These are
  not Scheduled Task per-run prices or guaranteed capacities.

### Current-build empirical facts

- H0a proved that one scheduled turn in an existing idle task could create a fresh built-in
  Browser tab, rediscover current genuine Site Tools, and invoke one read-only tool.
- H0b removed the repeated-prompt false positive. Its trigger-only scheduled prompt recovered
  a previously stored bounded receipt, including the canonical URL and read-only action role,
  and completed the same fresh WebMCP join.
- H1 then used four trigger-only scheduled turns to prove no-event stopping, one authenticated
  event across Receiver restart, genuine fresh Inbox and Host Site Tools, one idempotent Host
  effect under acknowledgement loss, exact event replay, and a final completed-event no-op.
- H2a terminated the controlled task's old Node Browser kernel and proved that a scheduled
  turn could start a new kernel, reconstruct the Browser runtime, complete its mandatory
  documentation preflight, and make the genuine no-event Inbox call. The recovery took
  several failed cold-start calls and therefore exposes latency and robustness overhead that
  a longer-window experiment must measure.
- Both probes ran on ChatGPT Desktop `26.825.41651` build `7345`. They did not test app
  restart, device sleep, client update, a busy task, another account, or another workspace.

## 2. Polling economics

For a cadence of `T` minutes and a watch window of `H` minutes that is an exact multiple of
that cadence, the nominal number of due opportunities is:

~~~text
nominal due opportunities = H / T
~~~

For continuous operation, the nominal cadence rates are:

| Cadence | Nominal due opportunities per day | Nominal due opportunities per 30 days | Ideal cadence-only maximum delay | Ideal cadence-only mean delay under uniform event timing |
|---|---:|---:|---:|---:|
| 1 minute | 1,440 | 43,200 | about 1 minute | about 30 seconds |
| 5 minutes | 288 | 8,640 | about 5 minutes | about 2.5 minutes |
| 10 minutes | 144 | 4,320 | about 10 minutes | about 5 minutes |
| 15 minutes | 96 | 2,880 | about 15 minutes | about 7.5 minutes |
| 60 minutes | 24 | 720 | about 60 minutes | about 30 minutes |

These are nominal due opportunities, not guaranteed executed task-run counts or billed-token
estimates. A non-divisible window needs an explicit terminal-check and expiry policy. Actual
event-to-observation latency also includes scheduler jitter, missed or coalesced runs, Agent
startup, Browser/WebMCP preflight, navigation, and tool execution. Current official
documentation does not supply enough information to convert the table into a reliable
monetary cost or latency SLA. Every H1 run must therefore record actual no-event runs, model
usage when available, Browser launches, scheduled and actual start times, wall-clock
latency, and time-to-pause rather than inventing a unit price or treating cadence as an SLA.

Continuous one-minute polling is commercially weak for sparse events: one useful event may
be surrounded by thousands of no-op Agent turns. A bounded ten-minute watch at one-minute
cadence, by contrast, has at most ten checks and is defensible as a feasibility experiment.

The first-principles watch-window equations, shared-usage stress table, value model, and hard
transport falsifiers are maintained in
[Research 16](16-scheduled-pull-unit-economics-and-transport-kill-model.md). Its key
discipline is to charge every no-event window and lifecycle burden to the transport rather
than reporting only the successful continuation.

## 3. Where the route can be viable

Scheduled pull remains plausible when all of the following hold:

- the watch is created explicitly from a user-authorized Grant;
- the watch window is short and bounded;
- seconds-level reaction is not required;
- the expected continuation is valuable enough to justify several no-op checks;
- the user already runs an eligible Desktop environment during that window;
- the Receiver gate is minimal and does not expose Host business truth;
- the schedule pauses immediately after success, expiry, or revocation; and
- failure degrades to a normal notification or deep link rather than losing the work.

Examples include a demo, a short approval window, an import or generation job expected to
finish soon, or a user-attended workflow whose next state normally arrives within minutes.

## 4. Kill conditions

Do not retain scheduled pull as the production route if the selected application requires
any of the following:

- seconds-level or hard-bounded response time;
- reliable operation while the user's device sleeps, is offline, or lacks the Desktop app;
- Enterprise or Edu deployment under the current Site Tool availability boundary;
- unattended access to sensitive full workflow state on every no-event check;
- arbitrary judge or customer accounts without controlled feature availability;
- thousands of independently scheduled Grants per user or organization;
- a positive-only notification policy that the platform cannot guarantee; or
- measured polling usage, battery, latency, or failure rate that costs more than the saved
  coordination and reconstruction effort.

Any of these conditions should redirect the project toward a native event trigger, hosted
Agent/browser runtime, or explicit paired connector. It should not weaken the genuine WebMCP
proof or mislabel polling as direct event wake.

## 5. Bounded H1 operating policy

H1 should use the smallest policy that can falsify the mechanism:

1. One existing idle task, one Grant, one workflow, and one accepted event.
2. A one-minute cadence for no more than 10–15 minutes.
3. Every run first opens only the Receiver Inbox page and invokes one genuine read-only
   pending-event Site Tool.
4. No pending event means stop immediately: do not open the canonical business page and do
   not emit a mutation.
5. A valid pending event returns a bounded signed delivery ticket, not free-form Agent
   instructions or Host business truth.
6. The Agent opens the canonical URL from the ticket, reads current authoritative state,
   invokes one idempotent continuation Site Tool, and stops before the human boundary.
7. The Receiver marks delivery complete only after a valid Host effect receipt.
8. Pause the automation immediately after completion, expiry, revocation, or test failure.

Record at minimum:

- scheduled-at, started-at, event-accepted-at, event-observed-at, and completed-at;
- no-event check count and total scheduled-run count;
- fresh Browser and genuine Site Tool provenance;
- event, run, delivery, Host effect, and artifact revision counts;
- any user foregrounding, permission prompt, confirmation gate, or stray later run; and
- model usage or credit evidence if the product surface exposes it.

The 2026-08-30 run followed this policy and passed. It used four scheduled turns over roughly
seven minutes: two no-event checks and two positive/recovery turns. The automation was paused
after each intended turn. One event, run, delivery, Host effect, and artifact revision change
remained at the end; the private adapter count stayed zero. The platform surface did not
expose a reliable per-run monetary or token cost, so H1 proves no unit economics. See the
[H1 verdict](../../mvp/evidence/h1-event-gated-scheduled-reentry-2026-08-30-verdict.md).

## 6. Claim boundary after H1

After the bounded H1 pass, the strongest accurate claim is:

> On the tested current Desktop build, a scheduled turn in the same existing Agent context
> polled a durable accepted-event gate and conditionally produced one idempotent continuation
> through freshly discovered genuine WebMCP Site Tools.

Do not claim:

- the business event directly woke the Agent;
- scheduled Browser or Site Tool access is a stable public OpenAI contract;
- delivery or Agent wake is exactly once;
- polling is production-scalable or cost-effective;
- the route survives restart, sleep, client updates, other accounts, or other workspaces
  unless each condition is separately tested; or
- the mechanism creates business value before it beats a notification/deep-link control and
  a fresh Agent with a bounded continuation capsule.

## 7. Decision gates after H1

H1 answers only whether the supported-looking pull route can carry the full gate-and-effect
semantics. The next decisions remain separate:

1. **Transport:** keep bounded scheduled pull, select a hosted runtime, or build a paired
   connector.
2. **Product value:** prove that re-entry improves a selected workflow's time, error,
   completion, or abandonment outcome.
3. **Context value:** determine whether exact-thread history beats a structured continuation
   capsule.
4. **Deployment:** prove public HTTPS, identity, isolation, restart recovery, and clean-room
   reproducibility.
5. **Platform durability:** obtain either a documented compatibility contract or enough
   cross-version evidence to justify a bounded experimental dependency.

No production transport or demo application is selected by this document.
