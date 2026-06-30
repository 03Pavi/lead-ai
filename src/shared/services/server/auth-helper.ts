import { AuthService } from "./auth-service";

/**
 * Extract the authenticated userId from a request's Authorization header.
 * Returns the userId string, or null if the token is missing / invalid.
 */
export function getUserIdFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^bearer\s+/i, "");

  if (!token) return null;

  const payload = AuthService.verifyAccessToken(token);
  return payload?.userId ?? null;
}
