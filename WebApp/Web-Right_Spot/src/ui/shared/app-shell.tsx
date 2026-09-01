"use client";

import { useEffect, useState } from "react";
import DemoSessionPanel from "./demo-session-panel";
import SessionNav from "./session-nav";
import {
  createSession,
  deleteSession,
  readSession,
  type SessionActor,
  type SessionApiError,
  type SessionRole,
} from "./session-api";
import StatusBanner from "./status-banner";

type SessionView = {
  actor: SessionActor | null;
  isLoading: boolean;
};

type Banner = {
  tone: "info" | "success" | "error";
  message: string;
} | null;

const ROLE_LABELS = {
  tenant: "Tenant",
  agent: "Property agent",
} as const;

export default function AppShell() {
  const [session, setSession] = useState<SessionView>({ actor: null, isLoading: true });
  const [pendingRole, setPendingRole] = useState<SessionRole | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);

  useEffect(() => {
    let isCurrent = true;

    void readSession()
      .then((actor) => {
        if (!isCurrent) return;
        setSession({ actor, isLoading: false });
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setSession({ actor: null, isLoading: false });
        setBanner({ tone: "error", message: sessionErrorMessage(error, "read") });
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleSignIn(role: SessionRole) {
    setPendingRole(role);
    setBanner(null);

    try {
      const actor = await createSession(role);
      setSession({ actor, isLoading: false });
      setBanner({
        tone: "success",
        message: `Signed in as ${ROLE_LABELS[actor.role]}. The server resolved actor ${actor.id}.`,
      });
    } catch (error: unknown) {
      setBanner({ tone: "error", message: sessionErrorMessage(error, "sign in") });
    } finally {
      setPendingRole(null);
    }
  }

  async function handleLogout() {
    setIsSigningOut(true);
    setBanner(null);

    try {
      await deleteSession();
      setSession({ actor: null, isLoading: false });
      setBanner({ tone: "success", message: "Signed out. The demo session has ended." });
    } catch (error: unknown) {
      setBanner({ tone: "error", message: sessionErrorMessage(error, "sign out") });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <SessionNav
          actor={session.actor}
          isLoading={session.isLoading}
          isSigningOut={isSigningOut}
          onLogout={handleLogout}
          currentPath="/"
        />
      </header>

      <main id="main-content" className="site-main">
        <section className="hero-grid" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow">Rental workflow workspace</p>
            <h1 id="page-title">Keep the next step clear.</h1>
            <p className="hero-lede">
              RightSpot is a bounded demo for a tenant and a property agent moving one viewing request through a human-controlled workflow.
            </p>
            <p className="hero-boundary">
              This landing surface establishes session context only. The signed-in workspace link is the handoff for role-specific surfaces; listings, requests, queues, and decisions do not belong to this shell.
            </p>
          </div>

          <div className="hero-aside">
            {banner ? <StatusBanner tone={banner.tone} message={banner.message} /> : null}
            <DemoSessionPanel
              actor={session.actor}
              isLoading={session.isLoading}
              pendingRole={pendingRole}
              onSignIn={handleSignIn}
            />
          </div>
        </section>

        <section className="shell-capabilities" aria-labelledby="capabilities-title">
          <div className="section-heading">
            <p className="eyebrow">Shared foundation</p>
            <h2 id="capabilities-title">A calm starting point for the human flow</h2>
          </div>
          <div className="capability-grid">
            <article className="capability-card">
              <span className="capability-index" aria-hidden="true">01</span>
              <h3>Server-resolved identity</h3>
              <p>The shell displays the actor and role returned by the bounded demo session endpoint.</p>
            </article>
            <article className="capability-card">
              <span className="capability-index" aria-hidden="true">02</span>
              <h3>Visible session status</h3>
              <p>Sign-in, sign-out, loading, and failure states are readable in the page and reachable by keyboard.</p>
            </article>
            <article className="capability-card">
              <span className="capability-index" aria-hidden="true">03</span>
              <h3>Role workspace boundary</h3>
              <p>The signed-in workspace link hands off to a role-specific surface without making this shell a business-state owner.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>RightSpot</span>
          <span>Bounded local demo surface</span>
        </div>
      </footer>
    </div>
  );
}

function sessionErrorMessage(error: unknown, action: "read" | "sign in" | "sign out"): string {
  if (isSessionApiError(error)) {
    if (error.status === 400) {
      return "That demo-session request was invalid. Choose one of the available roles and try again.";
    }
    if (error.status === 401) {
      return action === "read"
        ? "No active demo session was found."
        : "The demo session is not authenticated. Please start again.";
    }
  }

  return `Could not ${action} the demo session. Please try again.`;
}

function isSessionApiError(error: unknown): error is SessionApiError {
  return error instanceof Error && error.name === "SessionApiError";
}
