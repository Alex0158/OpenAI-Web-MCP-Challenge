import { handleRemoveFavourite } from "../../../../../src/server/application/favourites-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ listingId: string }>;
};

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  const { listingId } = await context.params;
  return handleRemoveFavourite(request, listingId);
}
