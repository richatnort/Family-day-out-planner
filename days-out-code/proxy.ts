export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|api/health|api/auth|pin).*)",
  ],
};
