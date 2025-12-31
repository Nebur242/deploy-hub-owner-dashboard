import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { auth } from "firebase-admin";
import { NextResponse } from "next/server";

const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 5 * 1000, // 5 days
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  // Use "lax" to allow the cookie to be sent on top-level navigations (like redirects from Stripe)
  sameSite: "lax" as const,
};

initFirebaseAdmin();

export async function POST(request: Request) {
  try {
    // Get the ID token from request body
    const { idToken } = await request.json();

    // Create the session cookie
    const sessionCookie = await auth().createSessionCookie(idToken, {
      expiresIn: COOKIE_OPTIONS.maxAge,
    });

    // Create response
    const response = NextResponse.json({ status: "success" }, { status: 200 });

    // Set the cookie
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
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }
}
// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
