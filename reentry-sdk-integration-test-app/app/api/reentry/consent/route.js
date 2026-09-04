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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    await readExactJson(request, [], []);
    const { configuration, reentry } = createTestContext();
    const created = await reentry.request({
      subject: TEST_SUBJECT,
      prompt: TEST_PROMPT,
      url: testWorkflowUrl(configuration.origin),
    });
    retainRequestHandle(created.handle);
    return testJson(201, {
      title: TEST_TITLE,
      reason: TEST_PROMPT,
      consent_url: created.consentUrl,
      consent_session_id: created.consentSessionId,
    });
  } catch (error) {
    return testErrorResponse(error);
  }
}
