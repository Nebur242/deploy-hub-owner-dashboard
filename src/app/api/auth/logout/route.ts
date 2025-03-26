import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true }, { status: 200 });

    response.cookies.set({
      name: "session",
      value: "",
      expires: new Date(0),
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json({ error: "Error during logout" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
