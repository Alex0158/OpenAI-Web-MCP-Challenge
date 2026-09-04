import {
  createTestContext,
  getApprovedContinuation,
  readExactJson,
  testErrorResponse,
  testJson,
} from "../../../../_lib/reentry-test.mjs";
import {
  getPlaygroundScenario,
} from "../../../../_lib/playground-config.mjs";
import { markPlaygroundEventQueued } from "../../../../_lib/playground-state.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Human-only demo control. The browser supplies only an opaque continuation id
 * and a known scenario id; the server owns the continuation and event fields.
 */
export async function POST(request) {
  try {
    const body = await readExactJson(request, ["scenario_id", "continuation_id"]);
    const scenario = getPlaygroundScenario(body.scenario_id);
    if (!scenario) {
      return testJson(404, { error: { code: "reentry_test_scenario_not_found" } });
    }

    const continuation = getApprovedContinuation(body.continuation_id);
    const { reentry } = createTestContext();
    const acceptance = await reentry.trigger(continuation);
    markPlaygroundEventQueued(scenario.id, acceptance.event_id);

    return testJson(202, {
      status: acceptance.status,
      event_id: acceptance.event_id,
      duplicate: acceptance.duplicate,
    });
  } catch (error) {
    return testErrorResponse(error);
  }
}
