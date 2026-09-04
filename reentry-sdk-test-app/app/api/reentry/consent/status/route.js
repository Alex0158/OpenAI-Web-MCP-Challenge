import {
  createTestContext,
  getRequestHandle,
  readExactJson,
  retainApprovedContinuation,
  testErrorResponse,
  testJson,
} from "../../../../_lib/reentry-test.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await readExactJson(request, ["consent_session_id"]);
    const { reentry } = createTestContext();
    const requestHandle = getRequestHandle(body.consent_session_id);
    const confirmation = await reentry.confirm(requestHandle);

    if (confirmation.status !== undefined) {
      return testJson(200, { status: confirmation.status });
    }

    const continuationId = retainApprovedContinuation(
      body.consent_session_id,
      confirmation,
    );
    return testJson(200, {
      status: "approved",
      continuation_id: continuationId,
    });
  } catch (error) {
    return testErrorResponse(error);
  }
}
