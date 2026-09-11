import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminTokenEdge, getAdminSessionTokenFromCookie } from "./src/lib/auth-edge";

const isDev = process.env.NODE_ENV !== "production";

const SECURITY_HEADERS: Record<string, string> = {
  "X-DNS-Prefetch-Control": "on",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "0",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy": [
    "default-src 'self'",
    isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https:",
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};

function applySecurityHeaders(res: NextResponse): void {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  // Login/logout must stay reachable so an admin can obtain the session
  // cookie in the first place (otherwise nobody could ever authenticate).
  const isAuthEndpoint =
    pathname === "/api/admin/login" || pathname === "/api/admin/logout";
  const isAdminApi = pathname.startsWith("/api/admin") && !isAuthEndpoint;

  if (isAdminPage || isAdminApi) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const token = getAdminSessionTokenFromCookie(cookieHeader);
    // Must mirror the chain in /api/admin/login and src/lib/admin-api.ts:
    const secret =
      process.env.ADMIN_PASS ||
      process.env.AEGIS_ADMIN_PASS ||
      process.env.ADMIN_PASSWORD ||
      process.env.NEXTAUTH_SECRET ||
      "change-me-before-prod-32chars";
    const valid = await verifyAdminTokenEdge(token, secret);

    if (!valid) {
      if (isAdminApi) {
        const res = NextResponse.json({ error: "Unauthorized — admin session required" }, { status: 401 });
        applySecurityHeaders(res);
        return res;
      }
      if (!request.nextUrl.searchParams.has("login")) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        url.search = "?login";
        const res = NextResponse.redirect(url);
        applySecurityHeaders(res);
        return res;
      }
    }
  }

  const res = NextResponse.next();
  applySecurityHeaders(res);
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};