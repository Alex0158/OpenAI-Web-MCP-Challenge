import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { CloudAccountStore } from "../src/account-store.mjs";
import { createCloudConsoleControlPlane } from "../src/dashboard-control.mjs";
import { createCloudReceiverService } from "../src/cloud-receiver-service.mjs";

test("Re-entry Cloud console serves the landing page and authenticated dashboard", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "reentry-console-"));
  const store = new CloudAccountStore({ filename: join(directory, "accounts.sqlite") });
  const consoleControl = createCloudConsoleControlPlane({
    store,
    activity: {
      snapshot(options) {
        assert.deepEqual(options, { limit: 25 });
        return {
          available: true,
          receiver_scope: "org_preview",
          generated_at: "2026-09-01T12:00:00.000Z",
          counts: { events: 1, pending_work: 1 },
          events: [{
            event_id: "event_001",
            event_type: "workflow.ready",
            workflow_id: "workflow_001",
            workflow_type: "review",
            received_at: "2026-09-01T12:00:00.000Z",
            delivery_id: "delivery_001",
            delivery_status: "pending",
            attempt: 0,
            maximum_attempts: 3,
          }],
          pending_work: [{
            event_id: "event_001",
            event_type: "workflow.ready",
            workflow_id: "workflow_001",
            workflow_type: "review",
            received_at: "2026-09-01T12:00:00.000Z",
            delivery_id: "delivery_001",
            delivery_status: "pending",
            attempt: 0,
            maximum_attempts: 3,
          }],
        };
      },
    },
  });
  const service = createCloudReceiverService({
    receiver: {
      acceptEvent() {
        return {};
      },
      claimDelivery() {
        return null;
      },
      acknowledgeDelivery() {
        return {};
      },
    },
    controlHandler: consoleControl.handler,
    readiness: () => true,
    close() {
      store.close();
    },
  });
  const address = await service.start({ host: "127.0.0.1", port: 0 });
  t.after(async () => {
    await service.stop();
    await rm(directory, { recursive: true, force: true });
  });

  const landing = await fetch(address.origin);
  assert.equal(landing.status, 200);
  const landingHtml = await landing.text();
  assert.match(landingHtml, /Work can/);
  assert.match(landingHtml, /class="wordmark"[^>]*>re-entry/);
  assert.match(landingHtml, /approved next step to Codex/);
  assert.match(landingHtml, /Host to Re-entry to Codex/);
  assert.match(landingHtml, /data-reentry-mesh/);
  assert.match(landingHtml, /href="\/docs"/);
  assert.doesNotMatch(landingHtml, /reentry-hedgehog-engineer/);

  const docsPage = await fetch(address.origin + "/docs");
  assert.equal(docsPage.status, 200);
  const docsHtml = await docsPage.text();
  assert.match(docsHtml, /Connect your website to a safe return path/);
  assert.match(docsHtml, /REENTRY_ORGANIZATION_API_KEY/);
  assert.match(docsHtml, /createConsentSession/);
  assert.match(docsHtml, /Follow the return path/);
  assert.match(docsHtml, /registerHostKey/);
  assert.match(docsHtml, /Account user decides/);
  assert.match(docsHtml, /getConsentSession/);
  assert.match(docsHtml, /Do not mix credentials/);

  const legacyRegisterPage = await fetch(address.origin + "/register", { redirect: "manual" });
  assert.equal(legacyRegisterPage.status, 302);
  assert.equal(legacyRegisterPage.headers.get("location"), "/developer-register");

  const registerPage = await fetch(address.origin + "/developer-register");
  assert.equal(registerPage.status, 200);
  const registerHtml = await registerPage.text();
  assert.match(registerHtml, /class="brand-word">re-entry/);
  assert.match(registerHtml, /name="identity" type="email"/);
  assert.match(registerHtml, /name="password" type="password"/);
  assert.doesNotMatch(registerHtml, /name="(?:organization_name|account_code|access_pin)"/);
  assert.match(registerHtml, /dashboard\/organizations/);
  assert.doesNotMatch(registerHtml, /reentry-hedgehog-engineer/);

  const userRegisterPage = await fetch(address.origin + "/user-register?next=%2Fdashboard");
  assert.equal(userRegisterPage.status, 200);
  const userRegisterHtml = await userRegisterPage.text();
  assert.match(userRegisterHtml, /USER SETUP \/ 01 OF 03/);
  assert.match(userRegisterHtml, /For people using Codex/);
  assert.match(userRegisterHtml, /Pair this Mac/);
  assert.match(userRegisterHtml, /developer credentials/);
  assert.match(userRegisterHtml, /data-success-path="\/user-dashboard"/);
  assert.match(userRegisterHtml, /href="\/user-login\?next=%2Fuser-dashboard"/);
  assert.doesNotMatch(userRegisterHtml, /Create an organization/);

  const userLoginPage = await fetch(address.origin + "/user-login?next=%2Fdashboard");
  assert.equal(userLoginPage.status, 200);
  const userLoginHtml = await userLoginPage.text();
  assert.match(userLoginHtml, /Log in to Re-entry/);
  assert.match(userLoginHtml, /data-success-path="\/user-dashboard"/);
  assert.match(userLoginHtml, /href="\/user-register\?next=%2Fuser-dashboard"/);

  const pairRegisterPage = await fetch(address.origin + "/developer-register?flow=pair&next=%2Fdashboard");
  assert.equal(pairRegisterPage.status, 200);
  const pairRegisterHtml = await pairRegisterPage.text();
  assert.match(pairRegisterHtml, /Create your Re-entry account/);
  assert.match(pairRegisterHtml, /PAIR THIS MAC/);

  const mascot = await fetch(address.origin + "/assets/reentry-hedgehog-engineer.png");
  assert.equal(mascot.status, 404);

  const protectedPage = await fetch(address.origin + "/dashboard", { redirect: "manual" });
  assert.equal(protectedPage.status, 302);
  assert.equal(protectedPage.headers.get("location"), "/developer-login?next=%2Fdashboard");

  const protectedUserPage = await fetch(address.origin + "/user-dashboard", { redirect: "manual" });
  assert.equal(protectedUserPage.status, 302);
  assert.equal(protectedUserPage.headers.get("location"), "/user-login?next=%2Fuser-dashboard");

  const unauthorizedActivity = await fetch(address.origin + "/api/activity");
  assert.equal(unauthorizedActivity.status, 401);

  const malformedRegistration = await postJson(address.origin + "/api/auth/register", {
    email: "wrong-field@example.com",
    password: "correct horse battery staple",
  });
  assert.equal(malformedRegistration.response.status, 422);
  assert.deepEqual(malformedRegistration.body, {
    error: { code: "credentials_invalid" },
  });

  const registration = await postJson(address.origin + "/api/auth/register", {
    identity: "eyad@example.com",
    password: "correct horse battery staple",
  });
  assert.equal(registration.response.status, 201);
  assert.equal(Object.hasOwn(registration.body, "organization"), false);
  assert.equal(Object.hasOwn(registration.body, "api_key"), false);
  const cookie = registration.response.headers.get("set-cookie").split(";", 1)[0];

  const signedInLanding = await fetch(address.origin, {
    headers: { Cookie: cookie },
  });
  assert.equal(signedInLanding.status, 200);
  const signedInLandingHtml = await signedInLanding.text();
  assert.match(signedInLandingHtml, /data-session-state="authenticated"/);
  assert.match(signedInLandingHtml, /Signed in · eyad@example\.com/);
  assert.match(signedInLandingHtml, /href="\/dashboard">Developer dashboard/);
  assert.match(signedInLandingHtml, /href="\/user-dashboard">Connect a Mac/);
  assert.match(signedInLandingHtml, /Open developer dashboard/);
  assert.doesNotMatch(signedInLandingHtml, /href="\/developer-login"/);
  assert.doesNotMatch(signedInLandingHtml, /href="\/developer-register"/);

  for (const [path, location] of [
    ["/developer-login", "/dashboard/organizations"],
    ["/developer-register", "/dashboard/organizations"],
    ["/developer-login?next=%2Fdashboard", "/dashboard"],
    ["/user-login", "/user-dashboard"],
    ["/user-register", "/user-dashboard"],
  ]) {
    const authenticatedAuthPage = await fetch(address.origin + path, {
      redirect: "manual",
      headers: { Cookie: cookie },
    });
    assert.equal(authenticatedAuthPage.status, 302);
    assert.equal(authenticatedAuthPage.headers.get("location"), location);
  }

  const dashboard = await fetch(address.origin + "/dashboard", {
    headers: { Cookie: cookie },
  });
  assert.equal(dashboard.status, 200);
  const dashboardHtml = await dashboard.text();
  assert.match(dashboardHtml, /See what needs your attention/);
  assert.match(dashboardHtml, /class="brand-word">re-entry/);
  assert.match(dashboardHtml, /Build one return path/);
  assert.match(dashboardHtml, /Quick connect/);
  assert.match(dashboardHtml, /Pair this Mac/);
  assert.match(dashboardHtml, /Create pairing code/);
  assert.match(dashboardHtml, /Current activity/);
  assert.match(dashboardHtml, /PENDING WORK/);
  assert.match(dashboardHtml, /href="\/dashboard\/activity"/);
  assert.match(dashboardHtml, /href="\/dashboard\/pending"/);
  assert.match(dashboardHtml, /href="\/dashboard\/organizations"/);
  assert.match(dashboardHtml, /href="\/dashboard\/quick-connect"/);
  assert.doesNotMatch(dashboardHtml, /reentry-hedgehog-engineer/);

  const userDashboard = await fetch(address.origin + "/user-dashboard", {
    headers: { Cookie: cookie },
  });
  assert.equal(userDashboard.status, 200);
  const userDashboardHtml = await userDashboard.text();
  assert.match(userDashboardHtml, /RE-ENTRY \/ USER PORTAL/);
  assert.match(userDashboardHtml, /Pair this Mac/);
  assert.match(userDashboardHtml, /Create pairing code/);
  assert.match(userDashboardHtml, /user-pairing-result/);
  assert.match(userDashboardHtml, /Developer console/);
  assert.doesNotMatch(userDashboardHtml, /Create organization/);

  for (const view of ["activity", "pending", "organizations", "quick-connect"]) {
    const page = await fetch(address.origin + "/dashboard/" + view, {
      headers: { Cookie: cookie },
    });
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, new RegExp('data-dashboard-view="' + view + '"'));
    if (view === "organizations") {
      assert.match(html, /id="organization-chooser"/);
      assert.match(html, /Create organization/);
      assert.doesNotMatch(html, /class="doc-sidebar"|class="metric-grid"|Quick connect/);
    }
  }
  const activityPage = await fetch(address.origin + "/dashboard/activity", {
    headers: { Cookie: cookie },
  });
  assert.match(await activityPage.text(), /EVENT DETAILS/);
  const pendingPage = await fetch(address.origin + "/dashboard/pending", {
    headers: { Cookie: cookie },
  });
  assert.match(await pendingPage.text(), /DELIVERY DETAILS/);
  const quickConnectPage = await fetch(address.origin + "/dashboard/quick-connect", {
    headers: { Cookie: cookie },
  });
  const quickConnectHtml = await quickConnectPage.text();
  assert.match(quickConnectHtml, /SETUP IN ONE VIEW/);
  assert.match(quickConnectHtml, /Next\.js/);
  assert.match(quickConnectHtml, /REENTRY_ORGANIZATION_API_KEY/);

  const activity = await fetch(address.origin + "/api/activity", {
    headers: { Cookie: cookie },
  });
  assert.equal(activity.status, 200);
  const activityBody = await activity.json();
  assert.equal(activityBody.counts.events, 1);
  assert.equal(activityBody.pending_work[0].delivery_id, "delivery_001");

  const organizations = await fetch(address.origin + "/api/organizations", {
    headers: { Cookie: cookie },
  });
  assert.equal(organizations.status, 200);
  const initialOrganizations = await organizations.json();
  assert.equal(initialOrganizations.organizations.length, 0);

  const created = await postJson(
    address.origin + "/api/organizations",
    { name: "Second Lab" },
    { Cookie: cookie },
  );
  assert.equal(created.response.status, 201);
  assert.match(created.body.api_key.secret, /^re_org_[A-Za-z0-9_-]+$/);

  const organizationWorkspace = await fetch(
    address.origin + "/dashboard/organizations/" + created.body.organization.organization_id,
    { headers: { Cookie: cookie } },
  );
  assert.equal(organizationWorkspace.status, 200);
  const organizationWorkspaceHtml = await organizationWorkspace.text();
  assert.match(organizationWorkspaceHtml, /data-dashboard-view="organization"/);
  assert.match(organizationWorkspaceHtml, /data-organization-id="org_/);
  assert.match(organizationWorkspaceHtml, /Connect the Host/);
  assert.match(organizationWorkspaceHtml, /Connected Macs/);
  assert.match(organizationWorkspaceHtml, /Host secrets/);
  assert.match(organizationWorkspaceHtml, /Delete organization/);

  const scopedOrganizationDashboard = await fetch(
    address.origin + "/" + created.body.organization.organization_id + "/dashboard",
    { headers: { Cookie: cookie } },
  );
  assert.equal(scopedOrganizationDashboard.status, 200);
  const scopedDashboardHtml = await scopedOrganizationDashboard.text();
  assert.match(scopedDashboardHtml, /data-organization-dashboard="true"/);
  assert.match(scopedDashboardHtml, /data-dashboard-view="overview"/);
  assert.match(scopedDashboardHtml, /Overview/);
  assert.match(scopedDashboardHtml, /Activity/);
  assert.match(scopedDashboardHtml, /Pending work/);
  assert.match(scopedDashboardHtml, /Contracts/);
  assert.match(scopedDashboardHtml, /Two installs\. One return path\./);
  assert.match(scopedDashboardHtml, /Connected Macs/);
  assert.match(scopedDashboardHtml, /id="quick-connect-drawer"/);
  assert.match(scopedDashboardHtml, /id="secrets-drawer"/);
  assert.match(scopedDashboardHtml, /data-copy-target="agent-install-code"/);
  assert.match(scopedDashboardHtml, /data-receiver-command/);

  for (const view of ["activity", "pending", "contracts"]) {
    const scopedPage = await fetch(
      address.origin + "/" + created.body.organization.organization_id + "/dashboard/" + view,
      { headers: { Cookie: cookie } },
    );
    assert.equal(scopedPage.status, 200);
    const scopedPageHtml = await scopedPage.text();
    assert.match(scopedPageHtml, new RegExp('data-dashboard-view="' + view + '"'));
    assert.match(scopedPageHtml, /data-organization-dashboard="true"/);
  }

  const keys = await fetch(
    address.origin + "/api/organizations/" + created.body.organization.organization_id + "/api-keys",
    { headers: { Cookie: cookie } },
  );
  assert.equal(keys.status, 200);
  const keyList = await keys.json();
  assert.equal(keyList.api_keys.length, 1);
  assert.equal(Object.hasOwn(keyList.api_keys[0], "secret"), false);
  assert.equal(keyList.api_keys[0].status, "active");

  const revoked = await postJson(
    address.origin + "/api/organizations/" + created.body.organization.organization_id +
      "/api-keys/" + created.body.api_key.api_key_id + "/revoke",
    {},
    { Cookie: cookie },
  );
  assert.equal(revoked.response.status, 200);
  assert.equal(revoked.body.status, "revoked");

  const organizationsAfterRevoke = await fetch(address.origin + "/api/organizations", {
    headers: { Cookie: cookie },
  });
  const organizationListAfterRevoke = await organizationsAfterRevoke.json();
  assert.equal(organizationListAfterRevoke.organizations[0].api_key_count, 0);

  const deleted = await fetch(
    address.origin + "/api/organizations/" + created.body.organization.organization_id,
    { method: "DELETE", headers: { Cookie: cookie } },
  );
  assert.equal(deleted.status, 200);
  assert.equal((await deleted.json()).status, "deleted");

  const deletedKeys = await fetch(
    address.origin + "/api/organizations/" + created.body.organization.organization_id + "/api-keys",
    { headers: { Cookie: cookie } },
  );
  assert.equal(deletedKeys.status, 404);

  const organizationsAfterDelete = await fetch(address.origin + "/api/organizations", {
    headers: { Cookie: cookie },
  });
  assert.equal((await organizationsAfterDelete.json()).organizations.length, 0);

  const loggedOut = await postJson(address.origin + "/api/auth/logout", {}, { Cookie: cookie });
  assert.equal(loggedOut.response.status, 200);

  const invalidLogin = await postJson(address.origin + "/api/auth/login", {
    identity: "eyad@example.com",
    password: "wrong password",
  });
  assert.equal(invalidLogin.response.status, 401);

  const login = await postJson(address.origin + "/api/auth/login", {
    identity: "eyad@example.com",
    password: "correct horse battery staple",
  });
  assert.equal(login.response.status, 200);
  assert.equal(login.body.authenticated, true);
});

async function postJson(url, body, extraHeaders = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}
