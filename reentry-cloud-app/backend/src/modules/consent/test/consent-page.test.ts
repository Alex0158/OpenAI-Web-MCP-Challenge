import { renderConsentPage } from "../consent-page";
import type { ConsentPrompt } from "../consent.service";

function prompt(overrides: Partial<ConsentPrompt> = {}): ConsentPrompt {
  return {
    consentSessionId: "consent_session_test",
    status: "pending",
    session: {
      challenge_id: "challenge_test",
      manifest_id: "manifest_test",
      correlation_id: "correlation_test",
      status: "pending",
      issuer_origin: "https://host.example",
      offer_expires_at: "2026-09-03T12:10:00.000Z",
      workflow: {
        id: "workflow_test",
        type: "review",
        canonical_url: "https://host.example/workflows/workflow_test",
      },
      display: {
        title: "Return to the review?",
        reason: "The next review step is ready.",
      },
      grant_scope: {
        event_type: "workflow.ready",
        expires_at: "2026-09-03T12:10:00.000Z",
        max_runs: 1,
        human_boundary: "A person confirms the final submission.",
      },
    },
    connectors: [
      {
        id: "connector_test",
        deviceName: "Studio Mac",
        expiresAt: "2026-09-10T12:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("renderConsentPage", () => {
  test("renders the pending Receiver-owned decision without embedding the raw URL token", () => {
    const html = renderConsentPage(prompt(), {
      frontendUrl: "http://localhost:3000",
    });

    expect(html).toContain("Return to the review?");
    expect(html).toContain("The next review step is ready.");
    expect(html).toContain("host.example is asking");
    expect(html).toContain("workflow_test");
    expect(html).toContain("workflow.ready");
    expect(html).toContain("Studio Mac");
    expect(html).toContain('type="radio"');
    expect(html).toContain('id="approve"');
    expect(html).toContain('id="decline"');
    expect(html).toContain('new URLSearchParams(window.location.search).get("token")');
    expect(html).toContain('const hostOrigin = "https://host.example";');
    expect(html).toContain("window.opener.postMessage");
    expect(html).not.toContain('postMessage(\n              { type: "reentry.consent.complete", consent_session_id: consentSessionId, status },\n              window.location.origin');
    expect(html).not.toContain('postMessage(\n              { type: "reentry.consent.complete", consent_session_id: consentSessionId, status },\n              "*"');
    expect(html).not.toContain("consent-token-secret");
  });

  test("escapes Host-controlled display fields and device names", () => {
    const unsafe = prompt();
    unsafe.session.display.title = '<img src=x onerror="alert(1)">';
    unsafe.session.display.reason = "Review & approve <now>";
    unsafe.connectors[0].deviceName = '<script>alert("device")</script>';

    const html = renderConsentPage(unsafe, {
      frontendUrl: "http://localhost:3000",
    });

    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("Review &amp; approve &lt;now&gt;");
    expect(html).toContain("&lt;script&gt;alert(&quot;device&quot;)&lt;/script&gt;");
  });

  test("disables approval when no eligible Mac exists and offers the user a recovery path", () => {
    const html = renderConsentPage(prompt({ connectors: [] }), {
      frontendUrl: "http://localhost:3000",
    });

    expect(html).toContain("No connected Mac is ready");
    expect(html).toContain('href="http://localhost:3000/user-dashboard"');
    expect(html).toContain('id="approve"');
    expect(html).toContain("disabled");
  });

  test.each(["approved", "declined"] as const)(
    "renders %s as terminal without decision controls",
    (status) => {
      const html = renderConsentPage(prompt({ status }), {
        frontendUrl: "http://localhost:3000",
      });

      expect(html).toContain(`This request was ${status}`);
      expect(html).not.toContain('id="approve"');
      expect(html).not.toContain('id="decline"');
      expect(html).not.toContain("account-consent-decisions");
    }
  );
});
