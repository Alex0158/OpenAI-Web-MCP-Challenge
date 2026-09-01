import { handleReadAgentQueue } from "../../../../src/server/application/workflow-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  return handleReadAgentQueue(request);
}
