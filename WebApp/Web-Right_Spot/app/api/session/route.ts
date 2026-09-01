import {
  handleCreateDemoSession,
  handleDeleteDemoSession,
  handleReadDemoSession,
} from "../../../src/server/application/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleCreateDemoSession(request);
}

export function GET(request: Request): Response {
  return handleReadDemoSession(request);
}

export function DELETE(): Response {
  return handleDeleteDemoSession();
}
