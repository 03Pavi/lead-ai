import { NextResponse } from "next/server";
import { AuthService } from "@/shared/services/server/auth-service";

export async function POST(request: Request) {
  try {
    let refreshToken = "";

    // 1. Try to read from request body
    try {
      const body = await request.json();
      refreshToken = body.refreshToken || "";
    } catch {
      // Body might be empty, fallback to cookies
    }

    // 2. Try to read from cookies if not found in body
    if (!refreshToken) {
      const cookieStore = request.headers.get("cookie") || "";
      const match = cookieStore.match(/refreshToken=([^;]+)/);
      if (match) {
        refreshToken = match[1];
      }
    }

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is missing" }, { status: 400 });
    }

    const refreshResult = await AuthService.refreshAccessToken(refreshToken);
    if (!refreshResult) {
      // Invalid/expired token
      const response = NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
      response.cookies.delete("refreshToken");
      return response;
    }

    const { user, tokens } = refreshResult;

    const response = NextResponse.json({
      success: true,
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    // Set new refresh token in httpOnly cookie
    response.cookies.set("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Refresh Token API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
