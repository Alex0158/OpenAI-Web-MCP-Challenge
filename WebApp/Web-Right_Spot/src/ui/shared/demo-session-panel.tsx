import type { SessionActor, SessionRole } from "./session-api";

type DemoSessionPanelProps = {
  actor: SessionActor | null;
  isLoading: boolean;
  pendingRole: SessionRole | null;
  onSignIn: (role: SessionRole) => void;
};

const ROLE_LABELS = {
  tenant: "Tenant",
  agent: "Property agent",
} as const;

const ROLE_WORKSPACE_HREFS = {
  tenant: "/tenant",
  agent: "/agent",
} as const;

export default function DemoSessionPanel({
  actor,
  isLoading,
  pendingRole,
  onSignIn,
}: DemoSessionPanelProps) {
  if (isLoading) {
    return (
      <section className="session-panel" aria-labelledby="session-panel-title" aria-busy="true">
        <p className="eyebrow">Session</p>
        <h2 id="session-panel-title">Checking your demo session</h2>
        <p className="panel-copy">RightSpot is asking the server whether a bounded session is active.</p>
      </section>
    );
  }

  if (actor) {
    return (
      <section className="session-panel session-panel-active" aria-labelledby="session-panel-title">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">Session established</p>
            <h2 id="session-panel-title">The demo session is active</h2>
          </div>
          <span className="session-badge">{ROLE_LABELS[actor.role]}</span>
        </div>
        <dl className="session-details">
          <div>
            <dt>Server-resolved actor</dt>
            <dd>{actor.id}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{ROLE_LABELS[actor.role]}</dd>
          </div>
        </dl>
        <a className="button button-primary" href={ROLE_WORKSPACE_HREFS[actor.role]}>
          Open {ROLE_LABELS[actor.role]} workspace
        </a>
        <p className="panel-note">
          Use the workspace link above to continue. This shared shell confirms the demo session only; it does not create or display workflow data.
        </p>
      </section>
    );
  }

  return (
    <section className="session-panel" aria-labelledby="session-panel-title" aria-busy={pendingRole !== null}>
      <p className="eyebrow">Demo session</p>
      <h2 id="session-panel-title">Start with a bounded role</h2>
      <p className="panel-copy">
        Choose the synthetic role you want to preview. The server establishes the session and returns the authoritative actor.
      </p>
      <div className="role-actions">
        {(["tenant", "agent"] as const).map((role) => (
          <button
            className="button button-primary"
            type="button"
            key={role}
            onClick={() => onSignIn(role)}
            disabled={pendingRole !== null}
            aria-label={`Sign in as ${ROLE_LABELS[role]}`}
          >
            {pendingRole === role ? "Signing in…" : `Sign in as ${ROLE_LABELS[role]}`}
          </button>
        ))}
      </div>
      <p className="panel-note">This is a local demonstration session, not production authentication.</p>
    </section>
  );
}
