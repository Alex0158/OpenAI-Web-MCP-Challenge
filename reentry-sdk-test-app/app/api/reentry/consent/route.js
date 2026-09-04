import {
  createTestContext,
  TEST_PROMPT,
  TEST_SUBJECT,
  TEST_TITLE,
  retainRequestHandle,
  testErrorResponse,
  testJson,
  testWorkflowUrl,
  readExactJson,
} from "../../../_lib/reentry-test.mjs";
import {
  DEFAULT_SCENARIO_ID,
  getPlaygroundScenario,
  scenarioCanonicalPath,
} from "../../../_lib/playground-config.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await readExactJson(request, ["scenario_id"], []);
    const scenarioId = body.scenario_id ?? DEFAULT_SCENARIO_ID;
    const scenario = getPlaygroundScenario(scenarioId);
    if (!scenario) {
      return testJson(404, { error: { code: "reentry_test_scenario_not_found" } });
    }
    const { configuration, reentry } = createTestContext();
    const created = await reentry.request({
      subject: TEST_SUBJECT,
      prompt: scenario.consentReason ?? TEST_PROMPT,
      url: testWorkflowUrl(configuration.origin, scenarioCanonicalPath(scenario.id)),
    });
    retainRequestHandle(created.handle);
    return testJson(201, {
      title: scenario.consentTitle ?? TEST_TITLE,
      reason: scenario.consentReason ?? TEST_PROMPT,
      consent_url: created.consentUrl,
      consent_session_id: created.consentSessionId,
    });
  } catch (error) {
    return testErrorResponse(error);
  }
}
