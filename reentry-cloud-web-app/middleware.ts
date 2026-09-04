import { NextResponse } from "next/server";

export function middleware() {
  // Sessions are issued by the separate backend origin. A host-only backend
  // cookie is not visible to this frontend middleware, so the client layouts
  // must verify /me with credentials and perform the redirect.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/user-dashboard/:path*", "/developer-dashboard/:path*"],
};
