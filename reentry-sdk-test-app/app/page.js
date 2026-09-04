"use client";

import { useCallback, useRef, useState } from "react";
import { createReentryConsentAction } from "@4xeoz/re-entry-sdk/client";
import {
  DEFAULT_SCENARIO_ID,
  getPlaygroundScenario,
  PLAYGROUND_SCENARIOS,
} from "./_lib/playground-config.mjs";
import styles from "./page.module.css";

const INITIAL_SCENARIO_STATES = Object.fromEntries(
  PLAYGROUND_SCENARIOS.map((scenario) => [scenario.id, {
    stage: "waiting",
    continuationId: "",
    eventId: "",
    error: "",
  }]),
);

const STAGE_COPY = {
  waiting: "Waiting for permission",
  requesting: "Opening Re-entry consent",
  permission_ready: "Permission approved",
  actioning: "Sending the simulated update",
  queued: "Event accepted by Re-entry Cloud",
  declined: "Permission declined",
  cancelled: "Consent window closed",
  error: "Something needs attention",
};

export default function Page() {
  const actionRef = useRef(null);
  const [selectedId, setSelectedId] = useState(DEFAULT_SCENARIO_ID);
  const [view, setView] = useState("user");
  const [scenarioStates, setScenarioStates] = useState(INITIAL_SCENARIO_STATES);
  const [timeline, setTimeline] = useState([
    { label: "Playground loaded", detail: "WebMCP is paused for now." },
  ]);

  const selectedScenario = getPlaygroundScenario(selectedId) ?? PLAYGROUND_SCENARIOS[0];
  const selectedState = scenarioStates[selectedScenario.id];

  const changeScenario = useCallback((scenarioId) => {
    setSelectedId(scenarioId);
    setView("user");
  }, []);

  const addTimeline = useCallback((label, detail) => {
    setTimeline((current) => [
      { label, detail },
      ...current,
    ].slice(0, 7));
  }, []);

  const setScenarioState = useCallback((scenarioId, next) => {
    setScenarioStates((current) => ({
      ...current,
      [scenarioId]: {
        ...current[scenarioId],
        ...next,
      },
    }));
  }, []);

  const getConsent = useCallback(async (input) => {
    const session = await postJson("/api/reentry/consent", input);
    return {
      title: session.title,
      reason: session.reason,
      consentUrl: session.consent_url,
      consentSessionId: session.consent_session_id,
    };
  }, []);

  const confirmConsent = useCallback(async ({ consentSessionId }) => {
    const confirmation = await postJson("/api/reentry/consent/status", {
      consent_session_id: consentSessionId,
    });
    return {
      status: confirmation.status,
      continuationId: confirmation.continuation_id,
    };
  }, []);

  const requestPermission = useCallback(async () => {
    const scenario = getPlaygroundScenario(selectedId);
    if (!scenario) return;

    setScenarioState(scenario.id, { stage: "requesting", error: "" });
    addTimeline("Consent requested", `${scenario.brand}: ${scenario.title}`);

    try {
      actionRef.current ??= createReentryConsentAction({
        createConsentSession: getConsent,
        confirmConsentSession: confirmConsent,
      });
      const result = await actionRef.current({ scenario_id: scenario.id });
      if (result.status === "approved") {
        setScenarioState(scenario.id, {
          stage: "permission_ready",
          continuationId: result.continuationId,
        });
        addTimeline("Permission approved", "The test server retained an opaque continuation.");
      } else {
        setScenarioState(scenario.id, { stage: result.status });
        addTimeline("Consent finished", result.status);
      }
    } catch (error) {
      const code = publicErrorCode(error).replaceAll("_", " ");
      setScenarioState(scenario.id, { stage: "error", error: code });
      addTimeline("Consent failed", code);
    }
  }, [addTimeline, confirmConsent, getConsent, selectedId, setScenarioState]);

  const advanceWorkflow = useCallback(async () => {
    const scenario = getPlaygroundScenario(selectedId);
    const state = scenarioStates[selectedId];
    if (!scenario || !state?.continuationId) return;

    setScenarioState(scenario.id, { stage: "actioning", error: "" });
    addTimeline("Business action started", scenario.developerResult);

    try {
      const result = await postJson("/api/reentry/playground/advance", {
        scenario_id: scenario.id,
        continuation_id: state.continuationId,
      });
      setScenarioState(scenario.id, {
        stage: "queued",
        eventId: result.event_id,
      });
      addTimeline("Event accepted", "The Local Connector can now claim the queued work.");
    } catch (error) {
      const code = publicErrorCode(error).replaceAll("_", " ");
      setScenarioState(scenario.id, { stage: "error", error: code });
      addTimeline("Event failed", code);
    }
  }, [addTimeline, scenarioStates, selectedId, setScenarioState]);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brandLine}>
          <span className={styles.logo}>↗</span>
          <span className={styles.brand}>re-entry</span>
          <span className={styles.brandTag}>SDK playground</span>
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.liveDot} />
          <span>Test environment</span>
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Many small apps · one simple loop</p>
          <h1>Try Re-entry in different everyday workflows.</h1>
          <p className={styles.heroCopy}>
            Pick a mini-app, ask for permission, then use the human-only developer control to
            simulate the business update that sends an event.
          </p>
        </div>
        <div className={styles.protocolCard}>
          <span className={styles.protocolLabel}>Current boundary</span>
          <strong>WebMCP is paused</strong>
          <span>Every action here is ordinary UI until tool registration is added later.</span>
        </div>
      </section>

      <section className={styles.scenarioSection} aria-labelledby="scenario-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Choose a mini-app</p>
            <h2 id="scenario-heading">Playground scenarios</h2>
          </div>
          <span className={styles.scenarioCount}>{PLAYGROUND_SCENARIOS.length} demos</span>
        </div>

        <div className={styles.scenarioTabs} role="tablist" aria-label="Playground scenarios">
          {PLAYGROUND_SCENARIOS.map((scenario) => {
            const state = scenarioStates[scenario.id];
            return (
              <button
                key={scenario.id}
                className={`${styles.scenarioTab} ${selectedId === scenario.id ? styles.scenarioTabActive : ""}`}
                type="button"
                role="tab"
                aria-selected={selectedId === scenario.id}
                onClick={() => changeScenario(scenario.id)}
              >
                <span className={styles.scenarioMark}>{scenario.mark}</span>
                <span className={styles.scenarioTabCopy}>
                  <strong>{scenario.brand}</strong>
                  <span>{scenario.category}</span>
                </span>
                {state.stage === "queued" ? <span className={styles.check}>✓</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.workspace} aria-label={`${selectedScenario.brand} demo`}>
        <div className={styles.workspaceTop}>
          <div className={styles.workspaceTitle}>
            <span className={styles.largeMark}>{selectedScenario.mark}</span>
            <div>
              <p className={styles.eyebrow}>{selectedScenario.category}</p>
              <h2>{selectedScenario.brand}</h2>
            </div>
          </div>
          <div className={styles.sideTabs} role="tablist" aria-label="Demo side">
            <button
              className={view === "user" ? styles.sideTabActive : styles.sideTab}
              type="button"
              role="tab"
              aria-selected={view === "user"}
              onClick={() => setView("user")}
            >
              User side
            </button>
            <button
              className={view === "developer" ? styles.sideTabActive : styles.sideTab}
              type="button"
              role="tab"
              aria-selected={view === "developer"}
              onClick={() => setView("developer")}
            >
              Developer side
            </button>
          </div>
        </div>

        {view === "user" ? (
          <UserView
            scenario={selectedScenario}
            state={selectedState}
            onRequestPermission={requestPermission}
          />
        ) : (
          <DeveloperView
            scenario={selectedScenario}
            state={selectedState}
            onAdvance={advanceWorkflow}
          />
        )}
      </section>

      <section className={styles.bottomGrid}>
        <div className={styles.timelineCard}>
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.eyebrow}>What just happened</p>
              <h2>Event timeline</h2>
            </div>
            <span className={styles.smallPill}>in memory</span>
          </div>
          <div className={styles.timeline}>
            {timeline.map((item, index) => (
              <div className={styles.timelineItem} key={`${item.label}-${index}`}>
                <span className={`${styles.timelineDot} ${index === 0 ? styles.timelineDotActive : ""}`} />
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.simpleCard}>
          <p className={styles.eyebrow}>What this proves</p>
          <h2>Small data, clear handoff.</h2>
          <p>
            The app keeps the business state simple. The SDK carries the approved workflow and
            page address; the Connector decides how to continue locally.
          </p>
          <span className={styles.futureNote}>WebMCP tool registration · coming later</span>
        </div>
      </section>
    </main>
  );
}

function UserView({ scenario, state, onRequestPermission }) {
  const ready = state.stage === "permission_ready";
  const queued = state.stage === "queued";
  const busy = state.stage === "requesting";

  return (
    <div className={styles.demoSurface}>
      <div className={styles.userChrome}>
        <span>Signed in as Maya · demo account</span>
        <span className={styles.accountDot}>M</span>
      </div>
      <div className={styles.demoContent}>
        <div>
          <p className={styles.eyebrow}>My workspace</p>
          <h3>{scenario.title}</h3>
          <p className={styles.demoDescription}>{scenario.description}</p>
        </div>
        <div className={styles.recordCard}>
          <div className={styles.recordTop}>
            <span>{scenario.recordLabel}</span>
            <span className={styles.recordStatus}>{queued ? scenario.developerResult : scenario.recordValue}</span>
          </div>
          <strong>{scenario.recordValue}</strong>
          <span>{scenario.recordMeta}</span>
        </div>
        <div className={styles.userActionRow}>
          <div className={styles.stateReadout}>
            <span className={`${styles.stateDot} ${ready || queued ? styles.stateDotGood : ""}`} />
            <div>
              <strong>{STAGE_COPY[state.stage]}</strong>
              <span>{queued ? "A delivery is waiting for the Local Connector." : "The next step is controlled by this demo."}</span>
            </div>
          </div>
          <button className={styles.primaryButton} type="button" disabled={busy || ready || queued} onClick={onRequestPermission}>
            {busy ? "Opening consent…" : ready || queued ? "Permission approved" : "Ask for permission"}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
        {state.error ? <p className={styles.error}>{state.error}</p> : null}
      </div>
    </div>
  );
}

function DeveloperView({ scenario, state, onAdvance }) {
  const canAdvance = state.stage === "permission_ready";
  const queued = state.stage === "queued";

  return (
    <div className={styles.developerSurface}>
      <div className={styles.developerHeader}>
        <span className={styles.devIcon}>⌘</span>
        <div>
          <p className={styles.eyebrow}>Human-only developer controls</p>
          <h3>Simulate the next business update</h3>
        </div>
        <span className={styles.humanOnlyBadge}>Not a WebMCP tool</span>
      </div>
      <p className={styles.developerCopy}>
        This panel is visible for testing, but it is not registered with WebMCP. Use it after the
        user has approved permission to update this mini-app and send one event.
      </p>
      <div className={styles.developerAction}>
        <div>
          <span className={styles.actionLabel}>Business action</span>
          <strong>{scenario.developerAction}</strong>
          <span>{canAdvance ? "Permission is ready. This will call reentry.trigger()." : queued ? "The event has already been accepted." : "Ask for permission on the User side first."}</span>
        </div>
        <button
          className={styles.developerButton}
          type="button"
          data-webmcp-excluded="true"
          data-human-only-control="true"
          disabled={!canAdvance}
          onClick={onAdvance}
        >
          {queued ? "Event sent" : scenario.developerAction}
          <span aria-hidden="true">→</span>
        </button>
      </div>
      {state.error ? <p className={styles.error}>{state.error}</p> : null}
    </div>
  );
}

async function postJson(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const value = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error("Re-entry request failed"), {
      code: value?.error?.code,
    });
  }
  return value;
}

function publicErrorCode(error) {
  return typeof error?.code === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(error.code)
    ? error.code
    : "reentry_request_failed";
}
