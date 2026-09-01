"use client";

import { useCallback, useEffect, useState } from "react";

import RolePageFrame from "../shared/role-page-frame";
import StatusBanner from "../shared/status-banner";
import {
  AgentApiError,
  readAgentQueue,
  type AgentQueueResponse,
} from "./agent-api";
import styles from "./agent.module.css";

const QUEUE_STATES = [
  "REQUEST_SUBMITTED",
  "AGENT_REVIEWING",
  "SLOT_PROPOSED",
  "AGENT_DECLINED",
] as const;

const STATE_LABELS: Record<string, string> = {
  TENANT_DRAFT: "Draft",
  REQUEST_SUBMITTED: "Needs review",
  AGENT_REVIEWING: "In review",
  SLOT_PROPOSED: "Proposal sent",
  VIEWING_CONFIRMED: "Confirmed",
  TENANT_DECLINED: "Tenant declined",
  EXPIRED: "Expired",
  AGENT_DECLINED: "Declined",
};

export default function AgentDashboardPage() {
  return (
    <RolePageFrame
      requiredRole="agent"
      currentPath="/agent"
      title="Your request queue"
      eyebrow="Property agent workspace"
      description="Review the next request, compare the available times, and keep the human response explicit."
    >
      <AgentQueue />
    </RolePageFrame>
  );
}

function AgentQueue() {
  const [queue, setQueue] = useState<AgentQueueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadQueue = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      setQueue(await readAgentQueue());
    } catch (caught: unknown) {
      setError(agentErrorMessage(caught, "queue"));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue("initial");
  }, [loadQueue]);

  return (
    <section className={styles.workspace} aria-labelledby="queue-heading">
      <div className={styles.workspaceHeader}>
        <div>
          <p className="eyebrow">Assigned requests</p>
          <h2 id="queue-heading">A short queue, kept current</h2>
          <p className="panel-copy">Counts and request links below come from the server-authorized agent queue.</p>
        </div>
        <button
          className={`button button-quiet ${styles.refreshButton}`}
          type="button"
          onClick={() => void loadQueue("refresh")}
          disabled={isLoading || isRefreshing}
        >
          {isRefreshing ? "Refreshing…" : "Refresh queue"}
        </button>
      </div>

      {error ? (
        <div className={styles.feedbackStack}>
          <StatusBanner tone="error" message={error} />
          <button
            className="button button-primary"
            type="button"
            onClick={() => void loadQueue("refresh")}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Trying again…" : "Retry queue read"}
          </button>
        </div>
      ) : null}

      {isLoading ? <QueueLoading /> : queue ? <QueueContent queue={queue} /> : null}
    </section>
  );
}

function QueueLoading() {
  return (
    <div className={styles.loadingState} role="status" aria-live="polite" aria-busy="true">
      <span className={styles.loadingMark} aria-hidden="true" />
      <div>
        <h3>Loading the assigned queue</h3>
        <p className="panel-copy">RightSpot is reading the current workflow state.</p>
      </div>
    </div>
  );
}

function QueueContent({ queue }: { queue: AgentQueueResponse }) {
  return (
    <>
      <div className={styles.metricGrid} aria-label="Request state counts">
        {QUEUE_STATES.map((state) => (
          <div className={styles.metric} key={state}>
            <span className={styles.metricLabel}>{STATE_LABELS[state]}</span>
            <strong>{queue.counts[state]}</strong>
          </div>
        ))}
      </div>

      <div className={styles.queueSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className="eyebrow">Current work</p>
            <h3>Requests assigned to you</h3>
          </div>
          <span className={styles.generation}>Fixture {queue.fixtureGeneration}</span>
        </div>

        {queue.requests.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <span className={styles.emptyMark} aria-hidden="true">—</span>
            <h3>No requests are waiting</h3>
            <p className="panel-copy">The assigned queue is empty. Refresh when a tenant request is submitted.</p>
          </div>
        ) : (
          <div className={styles.requestList}>
            {queue.requests.map((request) => (
              <a
                className={styles.requestCard}
                href={`/agent/requests/${encodeURIComponent(request.id)}`}
                key={request.id}
              >
                <span className={styles.requestCardTopline}>
                  <span className={styles.statePill}>{STATE_LABELS[request.state]}</span>
                  <span className={styles.requestVersion}>Version {request.version}</span>
                </span>
                <strong>Viewing request</strong>
                <span className={styles.requestCardFooter}>Open request workspace <span aria-hidden="true">↗</span></span>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function agentErrorMessage(error: unknown, surface: "queue" | "detail"): string {
  if (error instanceof AgentApiError) {
    if (error.status === 401) return "Your agent session could not be verified. Return to sign in and start again.";
    if (error.status === 403) return "This agent workspace is not available for the active demo session.";
    if (error.status === 404) return surface === "detail" ? "This viewing request was not found." : "The agent queue was not found.";
    if (error.status === 400) return "The request was rejected because its input was invalid.";
    if (error.status === 409) return "The workflow changed while you were viewing it. Refresh the current state before continuing.";
    if (error.status === 503) return "The workflow service is temporarily unavailable. Try again shortly.";
  }
  return `Could not load the agent ${surface}. Try again.`;
}

export { agentErrorMessage };
