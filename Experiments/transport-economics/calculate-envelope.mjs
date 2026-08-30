import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const REQUIRED_KEYS = [
  "name",
  "activeWatches",
  "cadenceMinutes",
  "watchWindowMinutes",
  "observedPersistentEventProbability",
  "safeSuccessProbabilityGivenObservedEvent",
];

const USAGE_KEYS = [
  "usagePerNoopRun",
  "usagePerObservedEventRun",
  "usagePerRetryRun",
  "expectedRetriesPerObservedEvent",
];

const VALUE_KEYS = [
  "costPerUsageUnit",
  "grossValuePerSafeSuccess",
  "expectedFailureLossGivenObservedEvent",
  "setupAndLifecycleCostPerWatch",
];

const DEFAULT_SCENARIOS = [
  {
    name: "bounded-demo-window",
    activeWatches: 1,
    cadenceMinutes: 1,
    watchWindowMinutes: 15,
    observedPersistentEventProbability: 1,
    safeSuccessProbabilityGivenObservedEvent: 1,
  },
  {
    name: "attended-approval-window",
    activeWatches: 1,
    cadenceMinutes: 5,
    watchWindowMinutes: 120,
    observedPersistentEventProbability: 0.75,
    safeSuccessProbabilityGivenObservedEvent: 0.95,
  },
  {
    name: "sparse-business-day",
    activeWatches: 1,
    cadenceMinutes: 15,
    watchWindowMinutes: 480,
    observedPersistentEventProbability: 0.2,
    safeSuccessProbabilityGivenObservedEvent: 0.95,
  },
  {
    name: "continuous-hourly-watch",
    activeWatches: 1,
    cadenceMinutes: 60,
    watchWindowMinutes: 1440,
    observedPersistentEventProbability: 0.1,
    safeSuccessProbabilityGivenObservedEvent: 0.95,
  },
];

function requireFiniteNumber(value, key, minimum, maximum = Number.POSITIVE_INFINITY) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new TypeError(`${key} must be a finite number in [${minimum}, ${maximum}]`);
  }
}

function validateAllOrNoneGroup(scenario, keys, label) {
  const present = keys.filter((key) => key in scenario);
  if (present.length !== 0 && present.length !== keys.length) {
    const missing = keys.filter((key) => !(key in scenario));
    throw new TypeError(`${label} requires all fields; missing: ${missing.join(", ")}`);
  }
  return present.length === keys.length;
}

function deriveMaximumChecks(watchWindowMinutes, cadenceMinutes) {
  const ratio = watchWindowMinutes / cadenceMinutes;
  if (!Number.isFinite(ratio)) {
    throw new RangeError("watchWindowMinutes / cadenceMinutes must be finite");
  }

  const nearestInteger = Math.round(ratio);
  const tolerance = Number.EPSILON * 16 * Math.max(1, Math.abs(ratio));
  if (Math.abs(ratio - nearestInteger) > tolerance) {
    throw new TypeError(
      "watchWindowMinutes must be an integer multiple of cadenceMinutes; " +
        "model an explicit terminal-check or post-expiry policy separately",
    );
  }
  if (!Number.isSafeInteger(nearestInteger) || nearestInteger < 1) {
    throw new RangeError("maximumChecksPerWatch must be a positive safe integer");
  }
  return nearestInteger;
}

function validateScenario(scenario) {
  if (!scenario || typeof scenario !== "object" || Array.isArray(scenario)) {
    throw new TypeError("Each scenario must be an object");
  }
  for (const key of REQUIRED_KEYS) {
    if (!(key in scenario)) {
      throw new TypeError(`Missing required key: ${key}`);
    }
  }
  if (typeof scenario.name !== "string" || scenario.name.length === 0) {
    throw new TypeError("name must be a non-empty string");
  }
  requireFiniteNumber(scenario.activeWatches, "activeWatches", 1);
  if (!Number.isSafeInteger(scenario.activeWatches)) {
    throw new TypeError("activeWatches must be a safe integer");
  }
  requireFiniteNumber(scenario.cadenceMinutes, "cadenceMinutes", Number.EPSILON);
  requireFiniteNumber(scenario.watchWindowMinutes, "watchWindowMinutes", Number.EPSILON);
  requireFiniteNumber(
    scenario.observedPersistentEventProbability,
    "observedPersistentEventProbability",
    0,
    1,
  );
  requireFiniteNumber(
    scenario.safeSuccessProbabilityGivenObservedEvent,
    "safeSuccessProbabilityGivenObservedEvent",
    0,
    1,
  );

  const optionalNonnegative = [
    ...USAGE_KEYS,
    ...VALUE_KEYS,
    "totalLifecycleBurdenPerWatch",
  ];
  for (const key of optionalNonnegative) {
    if (key in scenario) {
      requireFiniteNumber(scenario[key], key, 0);
    }
  }

  const usageFieldsPresent = validateAllOrNoneGroup(scenario, USAGE_KEYS, "Usage accounting");
  const valueFieldsPresent = validateAllOrNoneGroup(scenario, VALUE_KEYS, "Value accounting");
  if (valueFieldsPresent && !usageFieldsPresent) {
    throw new TypeError("Value accounting requires the complete usage-accounting group");
  }

  deriveMaximumChecks(scenario.watchWindowMinutes, scenario.cadenceMinutes);
}

function finiteDerived(value, key) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${key} overflowed or is not finite`);
  }
  return value;
}

function round(value, key) {
  if (value === null) {
    return null;
  }
  return Number(finiteDerived(value, key).toFixed(6));
}

export function calculateEnvelope(scenario) {
  validateScenario(scenario);

  const {
    activeWatches,
    cadenceMinutes,
    watchWindowMinutes,
    observedPersistentEventProbability,
    safeSuccessProbabilityGivenObservedEvent,
  } = scenario;

  const maximumChecksPerWatch = deriveMaximumChecks(watchWindowMinutes, cadenceMinutes);
  const expectedChecksGivenObservedEvent = (maximumChecksPerWatch + 1) / 2;
  const meanDetectionDelayGivenObservedEvent = cadenceMinutes / 2;
  const maximumDetectionDelay = cadenceMinutes;

  const expectedChecksPerWatch =
    (1 - observedPersistentEventProbability) * maximumChecksPerWatch +
    observedPersistentEventProbability * expectedChecksGivenObservedEvent;
  const expectedObservedEventRunsPerWatch = observedPersistentEventProbability;
  const expectedNoopRunsPerWatch =
    expectedChecksPerWatch - expectedObservedEventRunsPerWatch;
  const expectedSafeSuccessesPerWatch =
    observedPersistentEventProbability * safeSuccessProbabilityGivenObservedEvent;
  const observedEventRunRatio =
    expectedObservedEventRunsPerWatch / expectedChecksPerWatch;
  const safeSuccessRunRatio = expectedSafeSuccessesPerWatch / expectedChecksPerWatch;
  const noopRunsPerSafeSuccess =
    expectedSafeSuccessesPerWatch === 0
      ? null
      : expectedNoopRunsPerWatch / expectedSafeSuccessesPerWatch;

  const usageFieldsPresent = USAGE_KEYS.every((key) => key in scenario);

  let expectedUsagePerWatch = null;
  let usagePerSafeSuccess = null;
  if (usageFieldsPresent) {
    expectedUsagePerWatch =
      expectedNoopRunsPerWatch * scenario.usagePerNoopRun +
      expectedObservedEventRunsPerWatch * scenario.usagePerObservedEventRun +
      expectedObservedEventRunsPerWatch *
        scenario.expectedRetriesPerObservedEvent *
        scenario.usagePerRetryRun;
    finiteDerived(expectedUsagePerWatch, "expectedUsagePerWatch");
    usagePerSafeSuccess =
      expectedSafeSuccessesPerWatch === 0
        ? null
        : expectedUsagePerWatch / expectedSafeSuccessesPerWatch;
  }

  const valueFieldsPresent = VALUE_KEYS.every((key) => key in scenario);

  let expectedNetValuePerWatch = null;
  if (valueFieldsPresent) {
    expectedNetValuePerWatch =
      expectedObservedEventRunsPerWatch *
        (safeSuccessProbabilityGivenObservedEvent * scenario.grossValuePerSafeSuccess -
          (1 - safeSuccessProbabilityGivenObservedEvent) *
            scenario.expectedFailureLossGivenObservedEvent) -
      expectedUsagePerWatch * scenario.costPerUsageUnit -
      scenario.setupAndLifecycleCostPerWatch;
    finiteDerived(expectedNetValuePerWatch, "expectedNetValuePerWatch");
  }

  const totalLifecycleBurdenPerSafeSuccess =
    "totalLifecycleBurdenPerWatch" in scenario && expectedSafeSuccessesPerWatch !== 0
      ? scenario.totalLifecycleBurdenPerWatch / expectedSafeSuccessesPerWatch
      : null;

  const checksPerFiveHoursIfContinuouslyActive =
    (300 / cadenceMinutes) * activeWatches;
  const checksPerDayIfContinuouslyActive = (1440 / cadenceMinutes) * activeWatches;

  return {
    name: scenario.name,
    activeWatches,
    cadenceMinutes,
    watchWindowMinutes,
    maximumChecksPerWatch,
    expectedChecksGivenObservedEvent: round(
      expectedChecksGivenObservedEvent,
      "expectedChecksGivenObservedEvent",
    ),
    expectedChecksPerWatch: round(expectedChecksPerWatch, "expectedChecksPerWatch"),
    expectedObservedEventRunsPerWatch: round(
      expectedObservedEventRunsPerWatch,
      "expectedObservedEventRunsPerWatch",
    ),
    expectedNoopRunsPerWatch: round(expectedNoopRunsPerWatch, "expectedNoopRunsPerWatch"),
    expectedSafeSuccessesPerWatch: round(
      expectedSafeSuccessesPerWatch,
      "expectedSafeSuccessesPerWatch",
    ),
    observedEventRunRatio: round(observedEventRunRatio, "observedEventRunRatio"),
    safeSuccessRunRatio: round(safeSuccessRunRatio, "safeSuccessRunRatio"),
    noopRunsPerSafeSuccess: round(noopRunsPerSafeSuccess, "noopRunsPerSafeSuccess"),
    meanDetectionDelayMinutesGivenObservedEvent: round(
      meanDetectionDelayGivenObservedEvent,
      "meanDetectionDelayMinutesGivenObservedEvent",
    ),
    maximumDetectionDelayMinutes: round(
      maximumDetectionDelay,
      "maximumDetectionDelayMinutes",
    ),
    continuousCheckRatePerFiveHours: round(
      checksPerFiveHoursIfContinuouslyActive,
      "continuousCheckRatePerFiveHours",
    ),
    continuousCheckRatePerDay: round(
      checksPerDayIfContinuouslyActive,
      "continuousCheckRatePerDay",
    ),
    expectedUsagePerWatch: round(expectedUsagePerWatch, "expectedUsagePerWatch"),
    usagePerSafeSuccess: round(usagePerSafeSuccess, "usagePerSafeSuccess"),
    totalLifecycleBurdenPerSafeSuccess: round(
      totalLifecycleBurdenPerSafeSuccess,
      "totalLifecycleBurdenPerSafeSuccess",
    ),
    expectedNetValuePerWatch: round(
      expectedNetValuePerWatch,
      "expectedNetValuePerWatch",
    ),
    measuredUsageInputsProvided: usageFieldsPresent,
  };
}

function runSelfTest() {
  const guaranteed = calculateEnvelope(DEFAULT_SCENARIOS[0]);
  assert.equal(guaranteed.maximumChecksPerWatch, 15);
  assert.equal(guaranteed.expectedChecksGivenObservedEvent, 8);
  assert.equal(guaranteed.expectedNoopRunsPerWatch, 7);
  assert.equal(guaranteed.meanDetectionDelayMinutesGivenObservedEvent, 0.5);
  assert.equal(guaranteed.continuousCheckRatePerFiveHours, 300);
  assert.equal(guaranteed.measuredUsageInputsProvided, false);

  const floatingPointMultiple = calculateEnvelope({
    name: "floating-point-multiple",
    activeWatches: 1,
    cadenceMinutes: 0.1,
    watchWindowMinutes: 0.3,
    observedPersistentEventProbability: 1,
    safeSuccessProbabilityGivenObservedEvent: 1,
  });
  assert.equal(floatingPointMultiple.maximumChecksPerWatch, 3);
  assert.throws(
    () =>
      calculateEnvelope({
        name: "ambiguous-terminal-policy",
        activeWatches: 1,
        cadenceMinutes: 5,
        watchWindowMinutes: 12,
        observedPersistentEventProbability: 1,
        safeSuccessProbabilityGivenObservedEvent: 1,
      }),
    /integer multiple/,
  );
  assert.throws(
    () =>
      calculateEnvelope({
        ...DEFAULT_SCENARIOS[0],
        activeWatches: Number.MAX_SAFE_INTEGER + 1,
      }),
    /safe integer/,
  );

  const zeroEvent = calculateEnvelope({
    name: "zero-event",
    activeWatches: 2,
    cadenceMinutes: 60,
    watchWindowMinutes: 240,
    observedPersistentEventProbability: 0,
    safeSuccessProbabilityGivenObservedEvent: 1,
  });
  assert.equal(zeroEvent.expectedChecksPerWatch, 4);
  assert.equal(zeroEvent.expectedNoopRunsPerWatch, 4);
  assert.equal(zeroEvent.noopRunsPerSafeSuccess, null);
  assert.equal(zeroEvent.continuousCheckRatePerFiveHours, 10);

  const largeWindow = calculateEnvelope({
    name: "large-window",
    activeWatches: 1,
    cadenceMinutes: 1,
    watchWindowMinutes: 200_000,
    observedPersistentEventProbability: 1,
    safeSuccessProbabilityGivenObservedEvent: 1,
  });
  assert.equal(largeWindow.maximumChecksPerWatch, 200_000);
  assert.equal(largeWindow.expectedChecksGivenObservedEvent, 100_000.5);

  assert.throws(
    () =>
      calculateEnvelope({
        ...DEFAULT_SCENARIOS[0],
        usagePerNoopRun: 1,
      }),
    /Usage accounting requires all fields/,
  );

  assert.throws(
    () =>
      calculateEnvelope({
        ...DEFAULT_SCENARIOS[0],
        usagePerNoopRun: 1e308,
        usagePerObservedEventRun: 0,
        usagePerRetryRun: 0,
        expectedRetriesPerObservedEvent: 0,
      }),
    /expectedUsagePerWatch overflowed/,
  );

  const completeEconomics = calculateEnvelope({
    ...DEFAULT_SCENARIOS[0],
    safeSuccessProbabilityGivenObservedEvent: 0.8,
    usagePerNoopRun: 1,
    usagePerObservedEventRun: 2,
    usagePerRetryRun: 4,
    expectedRetriesPerObservedEvent: 0.5,
    costPerUsageUnit: 0.5,
    grossValuePerSafeSuccess: 100,
    expectedFailureLossGivenObservedEvent: 20,
    setupAndLifecycleCostPerWatch: 10,
    totalLifecycleBurdenPerWatch: 16,
  });
  assert.equal(completeEconomics.expectedUsagePerWatch, 11);
  assert.equal(completeEconomics.expectedNetValuePerWatch, 60.5);
  assert.equal(completeEconomics.totalLifecycleBurdenPerSafeSuccess, 20);
  assert.equal(completeEconomics.measuredUsageInputsProvided, true);

  console.log("Self-test passed: 21 assertions across envelope and rejection cases");
}

function loadScenarios(path) {
  const parsed = JSON.parse(fs.readFileSync(path, "utf8"));
  return Array.isArray(parsed) ? parsed : [parsed];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === "--self-test") {
    runSelfTest();
  } else {
    const scenarios = process.argv[2] ? loadScenarios(process.argv[2]) : DEFAULT_SCENARIOS;
    console.log(JSON.stringify(scenarios.map(calculateEnvelope), null, 2));
  }
}
