import { handleConfirmTenantRequest } from "../../../../../src/server/application/workflow-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleConfirmTenantRequest(request);
}
