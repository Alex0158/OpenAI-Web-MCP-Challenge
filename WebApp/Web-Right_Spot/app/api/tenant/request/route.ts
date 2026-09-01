import {
  handleCreateTenantRequest,
  handleReadTenantRequest,
  handleUpdateTenantRequest,
} from "../../../../src/server/application/workflow-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  return handleReadTenantRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleCreateTenantRequest(request);
}

export async function PATCH(request: Request): Promise<Response> {
  return handleUpdateTenantRequest(request);
}
