"use client";

import { useRef, useState } from "react";

import { createContinuationPrompt } from "@webmcp-challenge/host-sdk/client";
import styles from "./page.module.css";

export default function Page() {
  const promptRef = useRef(null);
  const [status, setStatus] = useState("idle");

  async function testPrompt() {
    promptRef.current ??= createContinuationPrompt();
    setStatus("waiting");
    const prompt = promptRef.current;
    const result = await prompt.show({
      title: "Continue this workflow?",
      reason: "The next step is ready. Review it before the workflow continues.",
    });
    setStatus(result.action);
  }

  const statusCopy = {
    idle: "Ready to preview",
    waiting: "Waiting for your decision",
    approve: "Approved in preview",
    decline: "Kept on hold",
  };

  return (
    <main className={styles.hostShell}>
      <header className={styles.hostHeader}>
        <span>Demo host page</span>
        <span className={styles.hostEnvironment}>local test</span>
      </header>

      <section className={styles.hostPanel}>
        <span className={styles.hostEyebrow}>SDK integration test</span>
        <h1>Test the continuation popup</h1>
        <p>
          This page is intentionally simple. The visual review experience belongs to the SDK.
        </p>
        <button className={styles.hostButton} type="button" onClick={testPrompt}>
          Open SDK popup
          <span aria-hidden="true">↗</span>
        </button>
        <div className={styles.hostStatus} aria-live="polite">
          <span className={`${styles.statusIcon} ${status === "waiting" ? styles.statusIconWaiting : ""}`}>
            {status === "approve" ? "✓" : status === "decline" ? "—" : "•"}
          </span>
          <span>{statusCopy[status]}</span>
        </div>
      </section>
    </main>
  );
}
