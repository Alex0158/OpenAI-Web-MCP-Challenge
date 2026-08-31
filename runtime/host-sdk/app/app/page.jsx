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
    <main className={styles.shell}>
      <div className={styles.glow} aria-hidden="true" />
      <header className={styles.navbar}>
        <div className={styles.wordmark}>
          <span className={styles.wordmarkMark}>A</span>
          <span>Acme Workspace</span>
        </div>
        <div className={styles.previewBadge}>
          <span className={styles.previewDot} />
          SDK preview
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>
            <span className={styles.kickerLine} />
            Continuation layer
          </div>
          <h1>Keep important work moving.</h1>
          <p>
            When a workflow needs a human decision, the SDK opens a calm, focused review layer
            without taking the user away from the page.
          </p>
        </div>

        <article className={styles.workflowCard}>
          <div className={styles.cardTopline}>
            <span className={styles.cardLabel}>Active workflow</span>
            <span className={styles.cardState}>
              <span className={styles.stateDot} />
              Ready for review
            </span>
          </div>

          <div className={styles.workflowTitleRow}>
            <div>
              <h2>Quarterly launch plan</h2>
              <p>Product operations · Updated just now</p>
            </div>
            <span className={styles.workflowIcon}>↗</span>
          </div>

          <div className={styles.progressBlock}>
            <div className={styles.progressLabels}>
              <span>Workflow progress</span>
              <span>3 of 4 steps</span>
            </div>
            <div className={styles.progressTrack} aria-label="Workflow progress: 75%">
              <span />
            </div>
          </div>

          <div className={styles.nextStep}>
            <span className={styles.nextStepIcon}>04</span>
            <div>
              <strong>Review continuation</strong>
              <span>One decision is waiting for you.</span>
            </div>
            <span className={styles.nextStepArrow}>›</span>
          </div>

          <button className={styles.primaryButton} type="button" onClick={testPrompt}>
            Open review prompt
            <span aria-hidden="true">↗</span>
          </button>

          <div className={styles.statusRow} aria-live="polite">
            <span className={`${styles.statusIcon} ${status === "waiting" ? styles.statusIconWaiting : ""}`}>
              {status === "approve" ? "✓" : status === "decline" ? "—" : "•"}
            </span>
            <span>{statusCopy[status]}</span>
          </div>
        </article>
      </section>

      <section className={styles.explainer} aria-label="What this preview demonstrates">
        <div className={styles.explainerIntro}>
          <span className={styles.explainerEyebrow}>What you are testing</span>
          <p>The page stays in place while the SDK handles the decision.</p>
        </div>
        <div className={styles.explainerSteps}>
          <div className={styles.explainerStep}>
            <span>01</span>
            <strong>Stay on page</strong>
          </div>
          <div className={styles.stepConnector} aria-hidden="true" />
          <div className={styles.explainerStep}>
            <span>02</span>
            <strong>Review popup</strong>
          </div>
          <div className={styles.stepConnector} aria-hidden="true" />
          <div className={styles.explainerStep}>
            <span>03</span>
            <strong>Return decision</strong>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Host SDK</span>
        <span className={styles.footerSeparator}>·</span>
        <span>Local UI preview</span>
        <span className={styles.footerSeparator}>·</span>
        <span>No data is sent</span>
      </footer>
    </main>
  );
}
