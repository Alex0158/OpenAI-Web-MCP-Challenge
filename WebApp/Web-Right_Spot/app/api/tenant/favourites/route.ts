import {
  handleReadTenantFavourites,
  handleSaveFavourite,
} from "../../../../src/server/application/favourites-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  return handleReadTenantFavourites(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleSaveFavourite(request);
}
