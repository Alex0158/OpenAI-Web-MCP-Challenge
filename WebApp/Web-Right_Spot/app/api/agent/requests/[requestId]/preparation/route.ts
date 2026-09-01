import { handlePrepareAgentResponse } from "../../../../../../src/server/application/workflow-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ requestId: string }>;
};

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  const { requestId } = await context.params;
  return handlePrepareAgentResponse(request, requestId);
}
