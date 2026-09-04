"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createReentryConsentAction,
  registerReentryWebMcpTool,
} from "@4xeoz/re-entry-sdk/client";
import styles from "./page.module.css";

export default function Page() {
  const actionRef = useRef(null);
  const registrationStartedRef = useRef(false);
  const [status, setStatus] = useState("idle");
  const [webMcpStatus, setWebMcpStatus] = useState("checking");
  const [continuationId, setContinuationId] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("idle");
  const [error, setError] = useState("");

  const requestContinuation = useCallback(async (input = {}) => {
    setError("");
    setStatus("creating");
    try {
      actionRef.current ??= createReentryConsentAction({
        async createConsentSession(actionInput) {
          const session = await postJson("/api/reentry/consent", actionInput);
          return {
            title: session.title,
            reason: session.reason,
            consentUrl: session.consent_url,
            consentSessionId: session.consent_session_id,
          };
        },
        async confirmConsentSession({ consentSessionId }) {
          const confirmation = await postJson("/api/reentry/consent/status", {
            consent_session_id: consentSessionId,
          });
          return {
            status: confirmation.status,
            continuationId: confirmation.continuation_id,
          };
        },
      });
      setStatus("waiting");
      const result = await actionRef.current(input);
      setStatus(result.status);
      if (result.status === "approved") setContinuationId(result.continuationId);
      return result;
    } catch (caught) {
      setStatus("error");
      const code = publicErrorCode(caught);
      setError(code.replaceAll("_", " "));
      return { status: "error", code };
    }
  }, []);

  useEffect(() => {
    if (registrationStartedRef.current) return;
    registrationStartedRef.current = true;
    registerReentryWebMcpTool({
      name: "request_codex_reentry",
      description: "Ask the signed-in user to approve one future Codex continuation for this workflow. This creates consent; it does not trigger the later business event.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: requestContinuation,
    }).then((result) => {
      setWebMcpStatus(result.registered ? "registered" : "unavailable");
    }).catch(() => {
      setWebMcpStatus("failed");
    });
  }, [requestContinuation]);

  async function triggerLaterEvent() {
    setError("");
    setDeliveryStatus("sending");
    try {
      const acceptance = await postJson("/api/reentry/event", {
        continuation_id: continuationId,
      });
      setDeliveryStatus(acceptance.accepted ? "accepted" : "rejected");
    } catch (caught) {
      setDeliveryStatus("error");
      setError(publicErrorCode(caught).replaceAll("_", " "));
    }
  }

  const statusCopy = {
    idle: "Ready to request consent",
    creating: "Creating a signed request",
    waiting: "Waiting for Re-entry",
    approved: "Approved in Re-entry",
    declined: "Declined in Re-entry",
    cancelled: "Review closed",
    error: "Setup required",
  };
  const webMcpCopy = {
    checking: "Checking Site Tools",
    registered: "Site Tool registered",
    unavailable: "Normal browser path",
    failed: "Site Tool registration failed",
  };
  const deliveryCopy = {
    idle: "Waiting for the later business event",
    sending: "Signing and sending the Event",
    accepted: "Event accepted for your Connector",
    rejected: "Event rejected",
    error: "Event could not be sent",
  };

  return (
    <main className={styles.hostShell}>
      <header className={styles.hostHeader}>
        <span>Demo host page</span>
        <span className={styles.hostEnvironment}>local test</span>
      </header>

      <section className={styles.hostPanel}>
        <div className={styles.eyebrowRow}>
          <span className={styles.hostEyebrow}>WebMCP + Re-entry</span>
          <span className={`${styles.toolBadge} ${webMcpStatus === "registered" ? styles.toolBadgeReady : ""}`}>
            {webMcpCopy[webMcpStatus]}
          </span>
        </div>
        <h1>Let Codex come back later</h1>
        <p>
          One JavaScript action serves this button and the Site Tool. Re-entry owns approval; your
          Host owns the later business trigger.
        </p>
        <button className={styles.hostButton} type="button" onClick={() => requestContinuation({})}>
          Approve a future return
          <span aria-hidden="true">↗</span>
        </button>
        <div className={styles.hostStatus} aria-live="polite">
          <span className={`${styles.statusIcon} ${["creating", "waiting"].includes(status) ? styles.statusIconWaiting : ""}`}>
            {status === "approved" ? "✓" : status === "declined" ? "—" : "•"}
          </span>
          <span>{statusCopy[status]}</span>
        </div>
        <div className={styles.flowDivider} aria-hidden="true"><span /></div>
        <button
          className={styles.eventButton}
          type="button"
          disabled={!continuationId || deliveryStatus === "sending"}
          onClick={triggerLaterEvent}
        >
          Simulate the later business event
        </button>
        <p className={styles.eventStatus} aria-live="polite">{deliveryCopy[deliveryStatus]}</p>
        {error ? <p className={styles.hostError}>{error}</p> : null}
      </section>
    </main>
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
  if (!response.ok) throw Object.assign(new Error("Re-entry request failed"), {
    code: value?.error?.code,
  });
  return value;
}

function publicErrorCode(error) {
  return typeof error?.code === "string" && /^[a-z][a-z0-9_]{0,95}$/.test(error.code)
    ? error.code
    : "reentry_request_failed";
}
