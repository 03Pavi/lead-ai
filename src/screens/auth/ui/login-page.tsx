"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Alert,
  InputAdornment,
  useTheme,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Compass, Mail } from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const theme = useTheme();
  const {
    sendMagicLink,
    completeMagicLink,
    loginWithGoogle,
    isAuthenticated,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(true);

  // Handle redirect from email link on mount
  useEffect(() => {
    const handleMount = async () => {
      const result = await completeMagicLink();
      if (result === true) {
        // success, wait for isAuthenticated to redirect
      } else if (result === null) {
        setApiError("Please enter your email to complete sign-in from the link.");
      } else {
        // not a link or failed
      }
      setIsCompleting(false);
    };
    handleMount();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setApiError("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    setApiError(null);
    setApiSuccess(null);
    
    // If we're completing sign in on a new device where localstorage didn't have the email
    if (typeof window !== "undefined" && window.location.href.includes("signInWithEmailLink")) {
      window.localStorage.setItem("emailForSignIn", email);
      const result = await completeMagicLink();
      setLoading(false);
      if (!result) {
        setApiError("Sign in failed or link expired. Please try again.");
      }
      return;
    }

    // Normal flow: send the link
    const result = await sendMagicLink(email);
    setLoading(false);
    
    if (result.success) {
      setApiSuccess("Check your email for the magic link!");
      setEmail("");
    } else {
      setApiError(result.error || "Failed to send link");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setApiError(null);
    setApiSuccess(null);
    const result = await loginWithGoogle();
    setGoogleLoading(false);
    if (!result.success && result.error !== "Sign-in cancelled") {
      setApiError(result.error || "Google sign-in failed");
    }
  };

  if (isCompleting) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
        py: 4,
      }}
    >
      <Stack spacing={4} sx={{ width: "100%", maxWidth: 420 }}>
        {/* Brand */}
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
          <img src='/icon.png' alt="LeadLens AI" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, letterSpacing: "-0.04em", color: "text.primary" }}
          >
            LeadLens <span style={{ color: theme.palette.info.main }}>AI</span>
          </Typography>
        </Stack>

        <Paper
          sx={{
            p: 4,
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textAlign: "center" }}>
            Sign In or Create Account
          </Typography>

          {apiError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "6px" }}>
              {apiError}
            </Alert>
          )}
          
          {apiSuccess && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: "6px" }}>
              {apiSuccess}
            </Alert>
          )}

          <form onSubmit={onEmailSubmit} autoComplete="off">
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Email Address"
                placeholder="you@company.com"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || googleLoading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={16} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading || googleLoading || !email.trim()}
                sx={{ py: 1.2, fontWeight: 600 }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : "Continue with Email"}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px", fontWeight: 500, px: 1 }}>
              OR
            </Typography>
          </Divider>

          {/* Google OAuth */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            startIcon={
              googleLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )
            }
            sx={{
              py: 1.2,
              borderColor: "divider",
              color: "text.primary",
              fontWeight: 600,
              "&:hover": {
                borderColor: "text.secondary",
                bgcolor: "action.hover",
              },
            }}
          >
            Continue with Google
          </Button>
        </Paper>
      </Stack>
    </Box>
  );
}
