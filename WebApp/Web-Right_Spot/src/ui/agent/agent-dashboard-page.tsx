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
import AgentListingInterest from "./agent-listing-interest";

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
      <div className={styles.dashboardStack}>
        <AgentQueue />
        <AgentListingInterest />
      </div>
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
        <div className={styles.headerCopy}>
          <p className="eyebrow">Assigned work</p>
          <h2 id="queue-heading">See what needs a human response</h2>
          <p className="panel-copy">Scan the current states, then open one server-authorized request to review its facts and availability.</p>
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
      <div className={styles.loadingCopy}>
        <span className={styles.loadingMark} aria-hidden="true" />
        <div>
          <p className="eyebrow">Queue update</p>
          <h3>Loading the assigned queue</h3>
          <p className="panel-copy">RightSpot is reading the current workflow state.</p>
        </div>
      </div>
      <div className={styles.loadingPreview} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function QueueContent({ queue }: { queue: AgentQueueResponse }) {
  return (
    <>
      <dl className={styles.metricGrid} aria-label="Request state counts">
        {QUEUE_STATES.map((state) => (
          <div className={styles.metric} data-state={state} key={state}>
            <dt className={styles.metricLabel}>{STATE_LABELS[state]}</dt>
            <dd>{queue.counts[state]}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.queueSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className="eyebrow">Current work</p>
            <h3>Requests assigned to you</h3>
          </div>
          <details className={styles.technicalDetails}>
            <summary>Queue details</summary>
            <p>Fixture generation {queue.fixtureGeneration}</p>
          </details>
        </div>

        {queue.requests.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <span className={styles.emptyMark} aria-hidden="true">—</span>
            <div className={styles.emptyStateBody}>
              <h3>No requests are waiting</h3>
              <p className="panel-copy">The assigned queue is empty. Refresh when a tenant request is submitted.</p>
            </div>
          </div>
        ) : (
          <div className={styles.requestList}>
            {queue.requests.map((request) => (
              <a
                className={styles.requestCard}
                data-state={request.state}
                href={`/agent/requests/${encodeURIComponent(request.id)}`}
                key={request.id}
              >
                <span className={styles.requestCardTopline}>
                  <span className={styles.statePill} data-state={request.state}>{STATE_LABELS[request.state]}</span>
                  <span className={styles.requestVersion}>v{request.version}</span>
                </span>
                <span className={styles.requestCardBody}>
                  <strong>Viewing request</strong>
                  <span>Listing reference · {request.listingId}</span>
                  <small>Request {request.id}</small>
                </span>
                <span className={styles.requestCardFooter}>Review request <span aria-hidden="true">→</span></span>
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
