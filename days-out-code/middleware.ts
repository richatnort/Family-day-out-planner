import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { method, nextUrl } = request;
  const path = nextUrl.pathname;
  const start = Date.now();

  console.log(
    JSON.stringify({
      level: "info",
      time: start,
      msg: "incoming request",
      method,
      path,
    })
  );

  const response = NextResponse.next();

  console.log(
    JSON.stringify({
      level: "info",
      time: Date.now(),
      msg: "request dispatched",
      method,
      path,
      durationMs: Date.now() - start,
    })
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
