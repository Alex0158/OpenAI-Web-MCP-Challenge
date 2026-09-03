"use client";

import { useEffect, useState, type ReactNode } from "react";
import SessionNav from "./session-nav";
import {
  createRoleSessionLifecycleMonitor,
  sessionActorKey,
} from "./role-session-lifecycle";
import {
  deleteSession,
  readSession,
  type SessionActor,
  type SessionApiError,
  type SessionRole,
} from "./session-api";
import StatusBanner from "./status-banner";

type RolePageFrameProps = {
  requiredRole: SessionRole;
  currentPath: string;
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
};

type Banner = {
  tone: "info" | "success" | "error";
  message: string;
} | null;

const ROLE_LABELS = {
  tenant: "Tenant",
  agent: "Property agent",
} as const;

export default function RolePageFrame({
  requiredRole,
  currentPath,
  title,
  eyebrow = "Role workspace",
  description,
  children,
}: RolePageFrameProps) {
  const [actor, setActor] = useState<SessionActor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const [sessionReadError, setSessionReadError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    let disposeMonitor = () => {};

    const startMonitor = (initialActor: SessionActor | null) => {
      if (!isCurrent) return;
      disposeMonitor = createRoleSessionLifecycleMonitor({
        windowTarget: window,
        documentTarget: document,
        initialActor,
        readSession,
        onActorChange: (resolvedActor) => {
          setActor(resolvedActor);
        },
        onError: (error: unknown) => {
          setSessionReadError(sessionErrorMessage(error, "read"));
        },
        onSuccess: () => {
          setSessionReadError(null);
        },
      });
    };

    void readSession()
      .then((resolvedActor) => {
        if (!isCurrent) return;
        setActor(resolvedActor);
        setIsLoading(false);
        setSessionReadError(null);
        startMonitor(resolvedActor);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setIsLoading(false);
        setSessionReadError(sessionErrorMessage(error, "read"));
        startMonitor(null);
      });

    return () => {
      isCurrent = false;
      disposeMonitor();
    };
  }, []);

  async function handleLogout() {
    setIsSigningOut(true);
    setBanner(null);
    setSessionReadError(null);

    try {
      await deleteSession();
      setActor(null);
      setBanner({ tone: "success", message: "Signed out. The demo session has ended." });
    } catch (error: unknown) {
      setBanner({ tone: "error", message: sessionErrorMessage(error, "sign out") });
    } finally {
      setIsSigningOut(false);
    }
  }

  const roleLabel = ROLE_LABELS[requiredRole];
  const isWrongRole = actor !== null && actor.role !== requiredRole;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <SessionNav
          actor={actor}
          isLoading={isLoading}
          isSigningOut={isSigningOut}
          onLogout={handleLogout}
          currentPath={currentPath}
        />
      </header>

      <main id="main-content" className="site-main" style={{ minWidth: 0 }}>
        <section aria-labelledby="role-page-title">
          {sessionReadError ? <StatusBanner tone="error" message={sessionReadError} /> : null}
          {banner ? <StatusBanner tone={banner.tone} message={banner.message} /> : null}

          <div className="session-panel" style={{ minWidth: 0, overflowWrap: "anywhere" }}>
            <p className="eyebrow">{eyebrow}</p>
            <h1 id="role-page-title">{title}</h1>
            {description ? <p className="panel-copy">{description}</p> : null}

            {isLoading ? (
              <div role="status" aria-live="polite" aria-busy="true">
                <h2>Checking your demo session</h2>
                <p className="panel-copy">RightSpot is asking the server to confirm access to this workspace.</p>
              </div>
            ) : !actor ? (
              <div>
                <h2>Sign in to continue</h2>
                <p className="panel-copy">This workspace requires an active server-resolved demo session.</p>
                <a className="button button-primary" href="/">Return to RightSpot sign in</a>
              </div>
            ) : isWrongRole ? (
              <div>
                <h2>This workspace is for {roleLabel}s</h2>
                <p className="panel-copy">
                  The server resolved this session as {ROLE_LABELS[actor.role]}. Sign out, then start the matching demo session from the root surface.
                </p>
                <a className="button button-quiet" href="/">Return to session surface</a>
              </div>
            ) : (
              <div key={sessionActorKey(actor)} style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                {children}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>RightSpot</span>
          <span>{roleLabel} workspace · bounded local demo surface</span>
        </div>
      </footer>
    </div>
  );
}

function sessionErrorMessage(error: unknown, action: "read" | "sign out"): string {
  if (isSessionApiError(error)) {
    if (error.status === 401) {
      return action === "read"
        ? "No active demo session was found."
        : "The demo session is not authenticated. Please start again.";
    }
    if (error.status === 400) {
      return "That demo-session request was invalid. Return to the root session surface and try again.";
    }
  }

  return `Could not ${action} the demo session. Please try again.`;
}

function isSessionApiError(error: unknown): error is SessionApiError {
  return error instanceof Error && error.name === "SessionApiError";
}
