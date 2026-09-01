import { checkHealth } from "../../../src/server/application/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  const result = checkHealth();

  return new Response(JSON.stringify(result.payload), {
    status: result.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
  });
}
