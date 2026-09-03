import {
  createDemoContext,
  demoErrorResponse,
  demoJson,
  getApprovedContinuation,
  readExactJson,
} from "../../../_lib/reentry-demo.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await readExactJson(request, ["continuation_id"]);
    const { reentry } = createDemoContext();
    const continuation = getApprovedContinuation(body.continuation_id);
    const acceptance = await reentry.trigger(continuation);
    return demoJson(202, {
      accepted: acceptance.accepted,
      event_id: acceptance.event_id,
      status: acceptance.status,
    });
  } catch (error) {
    return demoErrorResponse(error);
  }
}
