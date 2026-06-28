import { NextResponse } from "next/server";
import { AuthService } from "@/shared/services/server/auth-service";

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

    // Set refresh token in httpOnly cookie for web security
    response.cookies.set("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
