import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { auth } from "firebase-admin";
import { NextResponse } from "next/server";

type VerifySessionResponse = {
  isValid: boolean;
  uid?: string;
  emailVerified?: boolean;
  email?: string;
  error?: string;
};

initFirebaseAdmin();

export async function GET(request: Request) {
  return verifySession(request);
}

export async function POST(request: Request) {
  return verifySession(request);
}

async function verifySession(request: Request) {
  try {
    // Get the session cookie from the request
    const sessionCookie = request.headers
      .get("cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("session="))
      ?.split("=")[1];

    if (!sessionCookie) {
      return NextResponse.json<VerifySessionResponse>(
        {
          isValid: false,
          error: "No session cookie found",
        },
        { status: 401 }
      );
    }

    const decodedClaim = await auth().verifySessionCookie(
      sessionCookie,
      true // Check if cookie is revoked
    );

    // Get the full user record to check email verification
    const userRecord = await auth().getUser(decodedClaim.uid);

    return NextResponse.json<VerifySessionResponse>(
      {
        isValid: true,
        uid: decodedClaim.uid,
        emailVerified: userRecord.emailVerified,
        email: userRecord.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur de vérification de session:", error);

    return NextResponse.json<VerifySessionResponse>(
      {
        isValid: false,
        error: "Invalid session",
      },
      { status: 401 }
    );
  }
}

// Handle OPTIONS requests if needed for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
