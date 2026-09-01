import { handleListingDetail } from "../../../../src/server/application/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ listingId: string }>;
};

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const { listingId } = await context.params;
  return handleListingDetail(request, listingId);
}
