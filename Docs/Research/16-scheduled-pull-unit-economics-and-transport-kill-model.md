# Scheduled-Pull Unit Economics and Transport Kill Model

**Role:** SUPPORTING scientific, operating, and business research  
**Status:** Active pre-app decision model; app-specific inputs and thresholds remain open  
**Observed:** 2026-08-30  
**Scope:** No-op polling load, event latency, shared usage, value per safe continuation,
human burden, and transport-selection falsifiers

## Executive judgment

Scheduled pull is a credible bounded demonstration adapter, but sparse, persistent, or
high-concurrency watches are presumptively poor production fits until measurements clear the
hard falsifiers below. The economically correct unit is not one successful event. It is one
complete **watch window**, including every no-event Agent turn, Browser startup, retry,
permission or recovery interaction, failure loss, and the probability that no useful event
is safely observed at all.

The cited official Scheduled Tasks and Pricing pages do not publish a dedicated Scheduled
Task per-run price or latency service level. The model must therefore use measured run usage
and explicit value inputs rather than inventing a monetary cost. Even without a price,
cadence arithmetic exposes a strong capacity warning: one continuously active one-minute
watch has a steady-state rate of 300 checks per five-hour window and 1,440 per day. This is
above the current published Plus/Business local-message ranges for both WebMCP-eligible
models if each check consumes roughly one local-message equivalent. Exact Scheduled Task
accounting is not documented, so this is a stress comparison, not a billing claim.

The bounded conclusion is:

> Retain Scheduled pull for short, explicitly authorized, low-concurrency windows whose
> latency tolerance is measured in minutes. Treat sparse, persistent, high-concurrency,
> device-independent, or usage-sensitive watches as presumptively unsuitable, and reject the
> transport only when a measured hard falsifier is hit.

This conclusion does not select the final transport. The selected app must supply the
latency, persistent-event observation probability, value, privacy, device-availability, and
administration inputs.

## 1. Current official facts

The [official Scheduled Tasks documentation](https://learn.chatgpt.com/docs/automations)
states that a task scheduled inside an existing chat returns to that chat with its existing
context. Desktop scheduled work that needs local files requires the computer to remain
on and the app running. Generic custom business-event triggers are not a Desktop capability;
the documented event-triggered surface is limited to supported Gmail, Slack, and GitHub
events on eligible web and mobile plans.

The [official pricing and usage documentation](https://learn.chatgpt.com/docs/pricing)
states that ChatGPT Work and Codex share usage. Consumption varies with model, context,
reasoning, tool use, retrieval, and caching, so prompt length alone is not a reliable
estimate. At the time of observation, the published local-message estimates per five-hour
window for Plus and Business are:

| Model | Published local messages per five hours | WebMCP eligibility |
|---|---:|---|
| GPT-5.6 Sol | 10–100 | Eligible |
| GPT-5.6 Terra | 25–200 | Eligible |
| GPT-5.6 Luna | 250–2,000 | Not eligible; Site Tools disabled |

The pricing page also says GPT-5.6 usage averages 5–30 credits per message, while the exact
amount varies. This is not a Scheduled Task rate card. Measure the actual no-op and positive
run credits when the product surface exposes them.

The [official Site Tools documentation](https://learn.chatgpt.com/docs/webmcp) lists Sol and
Terra for Site Tools, says Luna currently has WebMCP disabled, states that Site Tools are
unavailable in Enterprise and Edu, and makes availability dependent on rollout and the
current page. These restrictions make model, plan, workspace, and feature eligibility part
of the operating model rather than an implementation footnote.

## 2. First-principles watch-window model

### 2.1 Bounded model assumptions

The closed-form model is intentionally narrower than a production queue. It is valid only
when all of the following are true:

- the watch window is an integer multiple of the cadence, so every check occurs before or at
  expiry without inventing an extra terminal check;
- the schedule phase is fixed: enrollment occurs at `t = 0`, there is no immediate check at
  `t = 0`, and checks occur at `d, 2d, ... T`;
- at most one event becomes available in a watch;
- the event remains pending until observed;
- every scheduled check executes, with no missed, coalesced, or overlapping run;
- the Agent stops checking immediately after observing the event; and
- conditional on observation in the window, event time is uniform.

These assumptions make the model a controlled prior and instrumentation contract, not an
arrival-process forecast. A selected app with transient or multiple events, non-uniform
hazards, offline periods, schedule jitter, coalescing, or queue backlogs must replace `p` and
the uniform timing terms with measured interval masses, availability, and event-count data.
Non-divisible windows require an explicit choice among an at-expiry check, a post-expiry
check, or strict expiry with possible missed events; the calculator rejects them rather than
choosing silently.

### 2.2 Variables and equations

Define:

- `d`: polling cadence in minutes;
- `T`: authorized watch-window length in minutes;
- `N = T / d`: maximum checks in one window under the required integer-multiple rule;
- `p`: probability that exactly one persistent event is observed within the window under
  the assumptions above;
- `q`: probability that the observed event produces a safe successful continuation;
- `C0`: measured usage or credits for one no-event run;
- `C1`: measured usage or credits for one positive run;
- `Cr`: measured usage or credits for one retry or recovery run;
- `r`: expected retries per observed event;
- `K`: economic shadow cost per measured usage or credit unit in the selected currency;
- `V`: gross incremental currency value of one safe continuation against a named baseline;
- `F`: expected currency loss of one observed event that does not become a safe success;
- `S`: enrollment, consent, review, recovery, and administration cost per watch in the same
  currency;
- `B`: measured total lifecycle burden per watch in one frozen unit, normally active human
  minutes; and
- `W`: concurrently active watches.

If event time is uniform within the window, the exact expected positive-check index is the
interval-length-weighted mean of `1..N`. When `T` is an exact multiple of `d`, it simplifies
to:

~~~text
ExpectedChecksGivenObservedEvent = (N + 1) / 2
ExpectedChecksPerWatch = (1 - p) * N + p * (N + 1) / 2
ExpectedObservedEventRuns = p
ExpectedNoOpRuns = ExpectedChecksPerWatch - p
ExpectedSafeSuccesses = p * q
ObservedEventRunRatio = p / ExpectedChecksPerWatch
SafeSuccessRunRatio = p * q / ExpectedChecksPerWatch
ExpectedUsage = ExpectedNoOpRuns * C0 + p * C1 + p * r * Cr
UsagePerSafeSuccess = ExpectedUsage / (p * q)
ExpectedUsageCost = ExpectedUsage * K
ExpectedNetValue = p * (q * V - (1 - q) * F) - ExpectedUsageCost - S
TotalLifecycleBurdenPerSafeSuccess = B / (p * q)
~~~

For uniformly timed events under the ideal cadence model, the cadence-only mean detection
delay is `d / 2` and the cadence-only maximum is `d`. Actual event-to-observation latency
adds scheduler jitter, missed or coalesced runs, Agent startup, Browser/WebMCP preflight,
navigation, and tool execution. A selected workflow whose hard maximum tolerance is below
the nominal cadence-only maximum is structurally incompatible; every other decision must use
the measured end-to-end distribution rather than the cadence as an SLA.

`V` must use one currency and one explicit comparator baseline:

~~~text
V = saved active human minutes * fully loaded currency per active minute
  + incremental avoided-error loss
  + incremental outcome or completion value
~~~

Do not count passive wait time as human time saved, mix minutes with currency, or double count
the same avoided loss in two terms. `F` must include wrong-stage work, duplicate or unsafe
effects, corrective review, and recovery where applicable. Included-plan credits still have
an opportunity or shadow cost; do not assume zero automatically. Do not omit failed watches,
consent, setup, review, recovery, connector administration, or revocation from `S` and `B`.

`C0`, `C1`, and `Cr` are appropriately weighted measured averages, not timeless constants.
If same-chat context growth, tool results, caching, or compaction changes usage materially by
run index, calculate them from the complete measured watch or use indexed terms.

## 3. Cadence stress table

For one continuously active watch:

| Cadence | Nominal due-opportunity rate per five hours | Nominal due-opportunity rate per day | Ideal cadence-only mean delay | Ideal cadence-only maximum delay |
|---|---:|---:|---:|---:|
| 1 minute | 300 | 1,440 | about 0.5 minute | about 1 minute |
| 5 minutes | 60 | 288 | about 2.5 minutes | about 5 minutes |
| 15 minutes | 20 | 96 | about 7.5 minutes | about 15 minutes |
| 60 minutes | 5 | 24 | about 30 minutes | about 60 minutes |

Multiply every nominal rate by `W` only as a first-order independent-watch stress case. Four
active five-minute watches create 240 due opportunities per five hours before retries or
observed-event continuation turns. This exceeds the upper published Terra local-message
estimate if every due opportunity executes and consumes roughly one message-equivalent; the
actual execution, coalescing, concurrency, and Scheduled Task usage mapping remain unknown
and must be measured. Per-watch expectations may be multiplied by `W` only while concurrency
does not change availability, latency, or per-run usage.

The probability of one persistent event being observed matters as much as cadence. For a
15-minute watch at a one-minute cadence under the bounded assumptions:

- if an event is guaranteed and uniformly timed, the watch averages 8 checks: 7 no-ops and
  1 positive run;
- if the persistent-event observation probability is 80%, the watch averages 9.4 checks and about 10.75 no-op runs
  per observed event; and
- if the persistent-event observation probability is 20%, the watch averages 13.6 checks and about 67 no-op runs
  per observed event.

These ratios exclude any second positive turn needed for acknowledgement recovery or human
follow-up. They show why a bounded demo can work while a sparse persistent watch can fail
commercially.

## 4. Hard transport falsifiers

Scheduled pull is disqualified for the selected workflow if any one of these conditions is
true after valid measurement. Before collecting pilot data, freeze the operational threshold,
minimum independent watch and observed-event counts, and interval method. Do not turn a small-
sample point estimate into a hard transport decision. For measured proportions use a stated
binomial interval; for p90 use an order-statistic or bootstrap interval; for net value report
a sensitivity distribution over uncertain inputs. A hard empirical rejection requires the
unfavorable conclusion to survive the preregistered uncertainty bound:

If an interval crosses its threshold, the result is inconclusive rather than a pass or a hard
rejection. Acceptance likewise requires the favorable bound to clear the threshold; otherwise
collect more evidence or choose a reversible pilot.

1. **Latency impossibility:** the nominal cadence-only maximum already exceeds a frozen hard
   tolerance, or the preregistered lower uncertainty bound for p90 end-to-end
   event-to-observation latency exceeds the frozen operational tolerance.
2. **Availability mismatch:** the preregistered upper uncertainty bound for the joint
   probability that the device, app, schedule, Browser, signed-in page, and Site Tools are
   available remains below the required success probability.
3. **Usage infeasibility:** the preregistered lower uncertainty bound for usage per safe
   success exceeds the user's or workspace's budget, or measured load materially crowds out
   normal work.
4. **Negative expected value:** the preregistered upper uncertainty bound for
   `p * (q * V - (1 - q) * F) - ExpectedUsageCost - S` is at or below zero.
5. **Concurrency infeasibility:** `W * checks` cannot run without starvation, overlap,
   wrong-task attachment, or unacceptable shared-usage pressure.
6. **Privacy mismatch:** repeated no-event checks require exposure or retention that the
   selected workflow cannot justify.
7. **Offline requirement:** the workflow must operate while the user's device or Desktop app
   is unavailable.
8. **Administration mismatch:** the required connector, permission, feature rollout, or
   workspace configuration costs more than the avoided coordination burden.

These are mechanism-selection rules, not product scores. Failure redirects the Agent
transport toward a hosted runtime, native event trigger, or paired outbound connector; it
does not falsify the Grant, event, canonical-page, or WebMCP mechanism itself.

## 5. Minimum selected-app instrumentation

Every watch and continuation must record, without secrets:

- watch creation, expiry, revocation, and actual active duration;
- cadence, scheduled time, actual start, event acceptance, event observation, authority
  ready, result reviewable, and completion timestamps;
- no-event, observed-event, retry, missed, coalesced, and stray-later run counts;
- model, reasoning effort, input, cached-input, and output tokens or exposed credits;
- Browser initialization and Site Tool preflight time;
- device/app availability and whether the task was busy;
- safe success, wrong-stage action, stale-state rejection, and duplicate-effect outcome;
- enrollment, consent, human review, recovery, and revocation active seconds;
- baseline notification/deep-link active seconds and material errors;
- selected app's monetary value per active minute, avoided error, completed outcome, and
  expected failure loss against a named baseline; and
- setup, connector, support, and workspace-administration burden amortized per useful event.

The primary commercial outputs are `UsagePerSafeSuccess`,
`TotalLifecycleBurdenPerSafeSuccess`, and `ExpectedNetValuePerWatch`. The calculator derives
the lifecycle ratio only when measured `B` is supplied. Reporting only event-to-result
latency hides the dominant no-event and failed-watch cost.

## 6. Transport-fit regions

| Observed workflow shape | Plausible transport direction |
|---|---|
| Short user-attended window, few watches, minute-level tolerance | Bounded Scheduled pull remains a viable candidate |
| Long-lived sparse watch, many no-op checks | Event-native or paired outbound transport |
| Device may sleep or be offline | Hosted Agent/runtime or durable connector path |
| Seconds-level response | Event-native hosted trigger; Scheduled pull rejected |
| Sensitive page/session must remain local | Explicit local connector may justify its administration cost |
| No exact-task advantage after capsule test | Fresh Agent plus bounded capsule may reduce continuity coupling |

Do not select one row before the app supplies evidence. The table identifies which topology
deserves the next experiment.

## 7. Current project implication

The H1 run used four scheduled turns over roughly seven minutes and produced one safe
visible effect. It proved composability, not a steady-state cost. The current project should:

1. keep Scheduled pull as a bounded reference adapter;
2. avoid building multi-watch production infrastructure before app selection;
3. use the selected app's first pilot to measure `C0`, `C1`, `Cr`, `r`, `p`, `q`, `K`, `V`,
   `F`, `S`, and `B`, replacing the uniform model when the event process violates its
   assumptions and applying preregistered uncertainty bounds before a hard decision;
4. compare those measurements with notification/deep-link and deterministic Host controls;
   and
5. select the production transport only after the hard falsifiers are evaluated.

A deterministic calculator for the equations and cadence examples is preserved in the
[transport-economics experiment](../../Experiments/transport-economics/README.md).

## 8. Nonclaims

This model does not establish a Scheduled Task price, a guaranteed messages-per-run mapping,
a rate-limit SLA, willingness to pay, or any app-specific return on investment. It does not
model transient or multiple events, missed or coalesced runs, a non-uniform arrival process,
or a non-divisible window. Published message ranges are capacity context, not a billing
conversion. Monetary conclusions require measured credits or tokens, a defensible shadow
cost, selected-app value and failure-loss evidence, and an explicit baseline.
