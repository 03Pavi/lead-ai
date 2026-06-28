import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { setCredentials, clearCredentials } from "../../entities/user/model/user-slice";
import { authApi } from "../api/auth-api";
import { useRouter } from "next/navigation";
import { setClientAccessToken } from "../api/client";
import {
  signInWithPopup,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { clientAuth, googleProvider } from "../config/firebase-config";

const ACTION_CODE_SETTINGS = {
  // After clicking the link, redirect back to /login so we can complete sign-in
  url: typeof window !== "undefined"
    ? `${window.location.origin}/login`
    : `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login`,
  handleCodeInApp: true,
};

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated, accessToken } = useAppSelector((state) => state.user);

  /** Helper: exchange a Firebase ID token for a BFF JWT session */
  const exchangeToken = async (idToken: string) => {
    const res = await authApi.exchangeToken(idToken);
    if (res.success && res.user && res.accessToken) {
      setClientAccessToken(res.accessToken);
      dispatch(
        setCredentials({
          user: res.user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken || "",
        })
      );
      router.push("/dashboard");
      return { success: true };
    }
    return { success: false, error: "Session exchange failed" };
  };

  /**
   * Send a magic sign-in link to the user's email.
   * Firebase emails the user a link; when clicked it returns to /login.
   */
  const sendMagicLink = async (email: string) => {
    try {
      await sendSignInLinkToEmail(clientAuth, email, ACTION_CODE_SETTINGS);
      // Save email so we can complete sign-in when they return
      window.localStorage.setItem("emailForSignIn", email);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to send sign-in link" };
    }
  };

  /**
   * Complete email link sign-in.
   * Call this on the /login page load to handle the redirect from the email link.
   * Returns true if sign-in was completed.
   */
  const completeMagicLink = async () => {
    if (!isSignInWithEmailLink(clientAuth, window.location.href)) return false;

    let email = window.localStorage.getItem("emailForSignIn");
    if (!email) {
      // If opened on a different device, we can't auto-retrieve email
      // Caller should prompt the user for it
      return null; // signal: need email prompt
    }

    try {
      const credential = await signInWithEmailLink(clientAuth, email, window.location.href);
      window.localStorage.removeItem("emailForSignIn");
      const idToken = await credential.user.getIdToken();
      await exchangeToken(idToken);
      return true;
    } catch (err: any) {
      console.error("Magic link sign-in failed:", err);
      return false;
    }
  };

  /** Google OAuth popup sign-in */
  const loginWithGoogle = async () => {
    try {
      const credential = await signInWithPopup(clientAuth, googleProvider);
      const idToken = await credential.user.getIdToken();
      return await exchangeToken(idToken);
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        return { success: false, error: "Sign-in cancelled" };
      }
      return { success: false, error: err.message || "Google sign-in failed" };
    }
  };

  /** Sign out from Firebase and clear BFF session */
  const logout = async () => {
    try {
      await signOut(clientAuth);
      await authApi.logout();
    } catch (err) {
      console.warn("Logout cleanup error:", err);
    } finally {
      setClientAccessToken(null);
      dispatch(clearCredentials());
      router.push("/login");
    }
  };

  /** Restore session silently on app mount using HttpOnly cookies */
  const checkSession = async () => {
    try {
      const res = await authApi.refresh();
      if (res.success && res.user && res.accessToken) {
        setClientAccessToken(res.accessToken);
        dispatch(
          setCredentials({
            user: res.user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken || "",
          })
        );
        return true;
      }
      return false;
    } catch {
      setClientAccessToken(null);
      dispatch(clearCredentials());
      return false;
    }
  };

  return {
    user,
    isAuthenticated,
    accessToken,
    sendMagicLink,
    completeMagicLink,
    loginWithGoogle,
    logout,
    checkSession,
  };
};
