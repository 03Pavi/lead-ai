import jwt from "jsonwebtoken";
import * as admin from "firebase-admin";
import "./firebase-service"; // Ensures admin is initialized

const JWT_ACCESS_SECRET = process.env.AUTH_SECRET || "access-token-secret-leadlens-ai-key-123456";
const JWT_REFRESH_SECRET = process.env.SESSION_SECRET || "refresh-token-secret-leadlens-ai-key-789012";

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

// Active refresh tokens list (in-memory; swap for Redis in production)
let activeRefreshTokens: Set<string> = new Set();

export class AuthService {
  /**
   * Verify a Firebase ID token issued by the Firebase client SDK.
   * Returns the decoded token payload or throws.
   */
  static async verifyFirebaseIdToken(idToken: string) {
    return admin.auth().verifyIdToken(idToken);
  }

  /**
   * Exchange a verified Firebase ID token for our own JWT session tokens.
   * Creates a local session without an in-memory user database.
   */
  static async exchangeFirebaseToken(idToken: string): Promise<
    { user: { id: string; email: string; name: string }; tokens: { accessToken: string; refreshToken: string } } | string
  > {
    try {
      const decoded = await this.verifyFirebaseIdToken(idToken);

      const user = {
        id: decoded.uid,
        email: decoded.email || "",
        name: decoded.name || decoded.email?.split("@")[0] || "User",
      };

      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        name: user.name,
      });

      return { user, tokens };
    } catch (err: any) {
      console.error("Firebase ID token verification failed:", err.message);
      return "Invalid or expired authentication token";
    }
  }

  /**
   * Generate Access and Refresh JWT Tokens
   */
  static generateTokens(payload: JWTPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId: payload.userId }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    activeRefreshTokens.add(refreshToken);

    return { accessToken, refreshToken };
  }

  /**
   * Verify Access Token (for API route guards)
   */
  static verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_ACCESS_SECRET) as JWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * Refresh the Access Token using a Refresh Token (sliding rotation)
   */
  static async refreshAccessToken(
    refreshToken: string
  ): Promise<{ user: { id: string; email: string; name: string }; tokens: { accessToken: string; refreshToken: string } } | null> {
    if (!activeRefreshTokens.has(refreshToken)) return null;

    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string; email?: string; name?: string };

      // Revoke old refresh token
      activeRefreshTokens.delete(refreshToken);

      const payload: JWTPayload = {
        userId: decoded.userId,
        email: (decoded as any).email || "",
        name: (decoded as any).name || "",
      };

      // We need to re-fetch name/email from Firebase Admin if not stored in refresh token
      try {
        const firebaseUser = await admin.auth().getUser(decoded.userId);
        payload.email = firebaseUser.email || "";
        payload.name = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User";
      } catch {
        // Use whatever was in the token if Firebase lookup fails
      }

      const tokens = this.generateTokens(payload);

      return {
        user: {
          id: payload.userId,
          email: payload.email,
          name: payload.name,
        },
        tokens,
      };
    } catch {
      activeRefreshTokens.delete(refreshToken);
      return null;
    }
  }

  /**
   * Revoke refresh token (logout)
   */
  static logout(refreshToken: string): void {
    activeRefreshTokens.delete(refreshToken);
  }
}
