# Transport Economics Calculator

This experiment contains a deterministic watch-window calculator for the model in
[`Research 16`](../../Docs/Research/16-scheduled-pull-unit-economics-and-transport-kill-model.md).

It calculates structural run counts, expected no-op load, observed-event and safe-success
run ratios, uniform-event detection latency, steady-state check rates, and optional measured
usage, lifecycle burden, failure loss, and expected value. It does not invent Scheduled Task
prices or convert published message ranges into a billing claim.

The calculator deliberately accepts only watch windows that are integer multiples of the
cadence. This avoids silently inventing a terminal check at expiry or allowing a check after
authority expires. A non-divisible real schedule needs an explicit terminal-check policy and
must be modeled separately.

The phase convention is enrollment at `t = 0`, no immediate `t = 0` check, and checks at
`d, 2d, ... T`. The returned continuous rates are steady-state stress rates, not claims that
every Scheduled Task opportunity executes.

## Run

~~~bash
node calculate-envelope.mjs
node calculate-envelope.mjs --self-test
node calculate-envelope.mjs scenarios.json
~~~

An input file can contain one scenario object or an array. Required fields are:

- `name`
- `activeWatches`
- `cadenceMinutes`
- `watchWindowMinutes`
- `observedPersistentEventProbability`
- `safeSuccessProbabilityGivenObservedEvent`

`observedPersistentEventProbability` is not a raw event-arrival rate. It is the probability
that exactly one event becomes available, remains pending until a poll, and is observed
inside the watch window while every scheduled check executes. The calculator assumes a
uniform conditional event time and stops after the first observation. Transient or multiple
events, missed or coalesced runs, offline periods, and queue backlogs require a different
arrival and availability model.

Optional measurement fields are:

- `usagePerNoopRun`
- `usagePerObservedEventRun`
- `usagePerRetryRun`
- `expectedRetriesPerObservedEvent`
- `costPerUsageUnit`
- `grossValuePerSafeSuccess`
- `expectedFailureLossGivenObservedEvent`
- `setupAndLifecycleCostPerWatch`
- `totalLifecycleBurdenPerWatch`

The four usage fields are all-or-none. The four value fields are all-or-none and require the
usage group. `totalLifecycleBurdenPerWatch` may be supplied independently in one frozen unit,
normally active human minutes. Missing optional outputs remain `null`; partial groups,
non-finite derived values, and ambiguous cadence/window combinations fail rather than being
silently treated as missing or free.

`measuredUsageInputsProvided` reports whether the complete usage group was supplied. It does
not claim that Scheduled Task accounting is exact or that the provided averages are portable.

All value fields must use the same currency and an explicit comparator baseline.
`grossValuePerSafeSuccess` should convert saved active time into currency and add only
incremental avoided loss or outcome value. Included-plan usage still has an opportunity or
shadow cost; it must not automatically be assigned zero.

The built-in scenarios are structural examples only. Their observed-event probabilities are
illustrative and are not product forecasts. Per-run usage fields are frozen measured
averages; if context growth or caching changes materially by check index, use weighted
measurements from the complete watch rather than assuming a constant synthetic cost.
