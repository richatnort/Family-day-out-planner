import { auth } from "@/lib/auth";
import { type NextRequest, type NextFetchEvent } from "next/server";

type AuthMiddleware = (req: NextRequest, event: NextFetchEvent) => Promise<Response>;

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
  return (auth as unknown as AuthMiddleware)(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|api/health|api/auth|pin).*)",
  ],
};
