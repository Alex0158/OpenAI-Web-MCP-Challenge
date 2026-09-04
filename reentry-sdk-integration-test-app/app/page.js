"use client";

import { useCallback, useRef, useState } from "react";
import { createReentryConsentAction } from "@4xeoz/re-entry-sdk/client";
import styles from "./page.module.css";

const statusCopy = {
  idle: "Ready to create a signed consent request.",
  requesting: "Creating a signed request on the Host server…",
  approved: "Approved and retained by the test server.",
  declined: "The consent request was declined.",
  cancelled: "The consent review was closed.",
  error: "The consent request could not be completed.",
};

export default function Page() {
  const actionRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [continuationId, setContinuationId] = useState("");
  const [error, setError] = useState("");

  const signTestContract = useCallback(async () => {
    setError("");
    setContinuationId("");
    setStatus("requesting");

    try {
      actionRef.current ??= createReentryConsentAction({
        async createConsentSession() {
          const session = await postJson("/api/reentry/consent", {});
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

      const result = await actionRef.current({});
      setStatus(result.status);
      if (result.status === "approved") setContinuationId(result.continuationId);
    } catch (caught) {
      setStatus("error");
      setError(publicErrorCode(caught).replaceAll("_", " "));
    }
  }, []);

  return (
    <main className={styles.shell}>
      <section className={styles.card}>
        <div className={styles.labelRow}>
          <span className={styles.eyebrow}>Re-entry SDK</span>
          <span className={styles.badge}>TEST ONLY</span>
        </div>
        <h1 className={styles.title}>Sign one test contract</h1>
        <p className={styles.intro}>
          This tiny Host app checks the consent handoff between the installed SDK and Re-entry
          Cloud. It ends after the approved continuation is stored on the test server.
        </p>

        <button
          className={styles.button}
          type="button"
          disabled={status === "requesting"}
          onClick={signTestContract}
        >
          {status === "requesting" ? "Opening consent…" : "Sign a test contract"}
          <span aria-hidden="true">↗</span>
        </button>

        <div className={styles.status} aria-live="polite">
          <span className={`${styles.statusDot} ${status === "approved" ? styles.statusDotGood : ""}`} />
          <span>{statusCopy[status]}</span>
        </div>

        {continuationId ? (
          <p className={styles.success}>
            Stored opaque continuation: <code>{continuationId}</code>
          </p>
        ) : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.boundary}>
          <strong>Intentionally excluded</strong>
          <span>WebMCP, later Events, workflow updates, Agent activation, and fallbacks.</span>
        </div>
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
