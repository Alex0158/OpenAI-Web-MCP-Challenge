import {
  DEFAULT_SCENARIO_ID,
  getPlaygroundScenario,
  scenarioCanonicalPath,
} from "../../../../_lib/playground-config.mjs";
import { getPlaygroundState } from "../../../../_lib/playground-state.mjs";
import { testJson } from "../../../../_lib/reentry-test.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, read-only context for the selected mini-app. It is deliberately small: the agent gets
 * the workflow identity, current state, canonical page, and safe boundary, while the business
 * system remains the source of truth for any real action.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const scenarioId = url.searchParams.get("scenario_id") ?? DEFAULT_SCENARIO_ID;
  const scenario = getPlaygroundScenario(scenarioId);
  if (!scenario) {
    return testJson(404, { error: { code: "reentry_test_scenario_not_found" } });
  }

  const state = getPlaygroundState(scenario.id);
  const canonicalOrigin = process.env.HOST_ORIGIN || url.origin;
  return testJson(200, {
    scenario_id: scenario.id,
    app_name: scenario.brand,
    industry: scenario.category,
    workflow_id: scenario.workflowId,
    workflow_type: scenario.workflowType,
    record_id: scenario.recordId,
    event_type: "workflow.ready",
    status: state.status,
    state_version: state.stateVersion,
    event_id: state.eventId || null,
    canonical_url: new URL(scenarioCanonicalPath(scenario.id), canonicalOrigin).href,
    agent_instruction: scenario.agentInstruction,
    human_boundary: "explicit_receiver_consent",
  });
}
