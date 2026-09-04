import {
  createDemoContext,
  demoErrorResponse,
  demoJson,
  getRequestHandle,
  readExactJson,
  retainApprovedContinuation,
} from "../../../../_lib/reentry-demo.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await readExactJson(request, ["consent_session_id"]);
    const { reentry } = createDemoContext();
    const requestHandle = getRequestHandle(body.consent_session_id);
    let continuationId;
    const confirmation = await reentry.confirm(requestHandle, {
      async onApproved(continuation) {
        continuationId = retainApprovedContinuation(
          body.consent_session_id,
          continuation,
        );
      },
    });
    if (confirmation.status !== undefined) {
      return demoJson(200, { status: confirmation.status });
    }
    if (continuationId === undefined) {
      throw new Error("Approved Re-entry continuation was not persisted");
    }
    return demoJson(200, {
      status: "approved",
      continuation_id: continuationId,
    });
  } catch (error) {
    return demoErrorResponse(error);
  }
}
