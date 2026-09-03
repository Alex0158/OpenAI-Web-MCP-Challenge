import { handleReadOperationsInsights } from "../../../../src/server/application/operations-insights-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  return handleReadOperationsInsights(request);
}
