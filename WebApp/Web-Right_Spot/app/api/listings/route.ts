import { handleListingCollection } from "../../../src/server/application/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  return handleListingCollection(request);
}
