import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { auth } from "firebase-admin";
import { NextResponse } from "next/server";

const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 5 * 1000, // 5 days
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  sameSite: "strict" as const,
};

initFirebaseAdmin();

export async function POST(request: Request) {
  try {
    // Get the current session cookie from the request
    const sessionCookie = request.headers
      .get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("session="))
      ?.split("=")[1];

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "No session cookie found" },
        { status: 401 }
      );
    }

    // Verify the current session cookie - this also refreshes it internally
    await auth().verifySessionCookie(sessionCookie, false);

    // For session refresh, we just need to reset the cookie expiration
    // The session cookie itself is still valid, we just extend its browser expiration

    // Create response
    const response = NextResponse.json(
      {
        status: "success",
        message: "Session refreshed successfully",
      },
      { status: 200 }
    );

    // Set the existing session cookie with updated expiration
    response.cookies.set({
      name: "session",
      value: sessionCookie,
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      path: COOKIE_OPTIONS.path,
      maxAge: COOKIE_OPTIONS.maxAge / 1000, // Convert to seconds
      sameSite: COOKIE_OPTIONS.sameSite,
    });

    return response;
  } catch (error) {
    console.error("Session refresh error:", error);

    // If the session is invalid, return an error that the client can handle
    if (error instanceof Error && error.message.includes("expired")) {
      return NextResponse.json(
        {
          error: "Session expired",
          code: "SESSION_EXPIRED",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to refresh session",
        code: "REFRESH_FAILED",
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
