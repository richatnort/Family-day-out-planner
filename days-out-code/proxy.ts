import { auth } from "@/lib/auth";
import { type NextRequest, type NextFetchEvent } from "next/server";

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  console.log(
    JSON.stringify({
      level: "info",
      time: Date.now(),
      msg: "request",
      method: request.method,
      path: request.nextUrl.pathname,
    })
  );
  return auth(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|api/health|api/auth|pin).*)",
  ],
};
