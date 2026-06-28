import { NextResponse } from "next/server";
import { AuthService } from "@/shared/services/server/auth-service";

export async function POST(request: Request) {
  try {
    let refreshToken = "";

    try {
      const body = await request.json();
      refreshToken = body.refreshToken || "";
    } catch {
      // Body may be empty
    }

    if (!refreshToken) {
      const cookieStore = request.headers.get("cookie") || "";
      const match = cookieStore.match(/refreshToken=([^;]+)/);
      if (match) {
        refreshToken = match[1];
      }
    }

    if (refreshToken) {
      AuthService.logout(refreshToken);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear authentication cookie
    response.cookies.delete("refreshToken");

    return response;
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
