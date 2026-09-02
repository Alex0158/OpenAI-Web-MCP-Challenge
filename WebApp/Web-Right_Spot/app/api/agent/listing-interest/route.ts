import { handleReadAgentListingInterest } from "../../../../src/server/application/favourites-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  return handleReadAgentListingInterest(request);
}
