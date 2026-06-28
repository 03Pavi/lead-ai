import { NextResponse } from "next/server";
import { AuthService } from "@/shared/services/server/auth-service";

// Firebase handles account creation on the client via createUserWithEmailAndPassword.
// After creation, the client sends the Firebase ID token here to establish a BFF session.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Firebase ID token is required" }, { status: 400 });
    }

    const authResult = await AuthService.exchangeFirebaseToken(idToken);

    if (typeof authResult === "string") {
      return NextResponse.json({ error: authResult }, { status: 401 });
    }

    const { user, tokens } = authResult;

    const response = NextResponse.json({
      success: true,
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    response.cookies.set("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
