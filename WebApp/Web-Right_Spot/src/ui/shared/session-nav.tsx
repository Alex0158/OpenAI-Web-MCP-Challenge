import type { SessionActor } from "./session-api";

type SessionNavProps = {
  actor: SessionActor | null;
  isLoading: boolean;
  isSigningOut: boolean;
  onLogout: () => void;
  currentPath?: string;
};

const ROLE_LABELS = {
  tenant: "Tenant",
  agent: "Property agent",
} as const;

export default function SessionNav({
  actor,
  isLoading,
  isSigningOut,
  onLogout,
  currentPath = "/",
}: SessionNavProps) {
  const sessionMessage = isLoading
    ? "Checking demo session"
    : actor
      ? `${ROLE_LABELS[actor.role]} session active`
      : "Demo session not active";

  return (
    <nav className="session-nav" aria-label="Primary navigation">
      <a className="brand" href="/" aria-current={currentPath === "/" ? "page" : undefined}>
        <span className="brand-mark" aria-hidden="true">RS</span>
        <span>RightSpot</span>
      </a>
      <div className="session-nav-actions">
        <span className="session-indicator" role="status" aria-live="polite">
          <span className="session-indicator-dot" aria-hidden="true" />
          {sessionMessage}
        </span>
        {actor ? (
          <button
            className="button button-quiet"
            type="button"
            onClick={onLogout}
            disabled={isSigningOut}
            aria-label={`Sign out of ${ROLE_LABELS[actor.role]} demo session`}
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        ) : null}
      </div>
    </nav>
  );
}
