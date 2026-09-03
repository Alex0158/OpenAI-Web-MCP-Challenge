import {
  createDemoContext,
  DEMO_HOST_SUBJECT_REF,
  DEMO_REASON,
  DEMO_TITLE,
  demoWorkflowUrl,
  demoErrorResponse,
  demoJson,
  retainRequestHandle,
  readExactJson,
} from "../../../_lib/reentry-demo.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    await readExactJson(request, [], []);
    const { configuration, reentry } = createDemoContext();
    const created = await reentry.request({
      subject: DEMO_HOST_SUBJECT_REF,
      prompt: DEMO_REASON,
      url: demoWorkflowUrl(configuration.origin),
    });
    retainRequestHandle(created.handle);
    return demoJson(201, {
      title: DEMO_TITLE,
      reason: DEMO_REASON,
      consent_url: created.consentUrl,
      consent_session_id: created.consentSessionId,
    });
  } catch (error) {
    return demoErrorResponse(error);
  }
}
