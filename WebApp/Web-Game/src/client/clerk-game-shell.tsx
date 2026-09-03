"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";

import { LiveGameProjection } from "./live-game-projection";
import { resolveClerkPresentationMode } from "./clerk-presentation";
import styles from "./clerk-game-shell.module.css";

function MissingProductionConfiguration() {
  return (
    <main className={styles.authGate}>
      <section className={styles.authCard} aria-labelledby="auth-config-title">
        <p className={styles.eyebrow}>Sleepless Kingdom</p>
        <h1 id="auth-config-title" className={styles.title}>Admission unavailable</h1>
        <p className={styles.copy}>
          Clerk Production admission is not configured for this deployment. The game remains closed
          until the publishable key and server verification material are present.
        </p>
      </section>
    </main>
  );
}

function InviteOnlyAdmission() {
  return (
    <>
      <Show when="signed-out">
        <main className={styles.authGate}>
          <section className={styles.authCard} aria-labelledby="sign-in-title">
            <p className={styles.eyebrow}>Sleepless Kingdom</p>
            <h1 id="sign-in-title" className={styles.title}>Enter the frontier</h1>
            <p className={styles.copy}>
              This world is invite-only. Sign in with one of the two provisioned player accounts to
              continue.
            </p>
            <SignInButton mode="modal">
              <button className={styles.signInButton} type="button">Sign in to play</button>
            </SignInButton>
          </section>
        </main>
      </Show>
      <Show when="signed-in">
        <div className={styles.signedInBar} aria-label="Signed-in player controls">
          <span className={styles.signedInLabel}>Player session</span>
          <UserButton />
        </div>
        <LiveGameProjection />
      </Show>
    </>
  );
}

export function ClerkGameShell() {
  const mode = resolveClerkPresentationMode({
    nodeEnv: process.env.NODE_ENV,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
  if (mode === "local") {
    return <LiveGameProjection />;
  }
  if (mode === "missing-production-config") {
    return <MissingProductionConfiguration />;
  }
  return <InviteOnlyAdmission />;
}
