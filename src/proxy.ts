import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/dashboard"];
const AUTH_ROUTES = ["/auth/login", "/auth/register", "/auth/reset-password"];

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/auth/register",
    "/auth/reset-password",
    "/auth/verify-email",
    "/",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/(fr|en)/:path*",
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};

export async function proxy(req: NextRequest) {
  try {
    const { pathname, search } = req.nextUrl;

    // Skip middleware for RSC, static files and API routes
    if (
      search?.includes("_rsc") ||
      pathname.includes("_next") ||
      pathname.includes("api")
    ) {
      return NextResponse.next();
    }

    const session = req.cookies.get("session")?.value;
    const redirectTo = req.cookies.get("redirectTo")?.value;
    const isAuthenticated = !!session;

    // Protect routes that require authentication
    if (
      PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) &&
      !isAuthenticated
    ) {
      const response = NextResponse.redirect(new URL("/auth/login", req.url));
      response.cookies.set("redirectTo", pathname, {
        path: "/",
        secure: true,
        sameSite: "lax",
        maxAge: 300,
      });
      return response;
    }

    // Redirect authenticated users away from auth routes
    if (AUTH_ROUTES.some((route) => pathname === route) && isAuthenticated) {
      const response = NextResponse.redirect(
        new URL(redirectTo || "/dashboard", req.url)
      );
      if (redirectTo) {
        response.cookies.delete("redirectTo");
      }
      return response;
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
  } catch (error) {
    console.error("Erreur middleware:", error);
    return NextResponse.redirect(new URL("/error", req.url));
  }
}
