"use client";

import React from "react";
import { Box, Typography, Paper, Stack, Avatar, Button, IconButton, useTheme } from "@mui/material";
import { LogOut, Sun, Moon, User as UserIcon } from "lucide-react";
import { useAuth } from "@/shared/hooks/use-auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleThemeMode } from "@/store/theme-slice";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((state) => state.theme.mode);
  const theme = useTheme();

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", py: { xs: 2, sm: 6 } }}>
      <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: "28px", sm: "36px" }, mb: 4 }}>
        Your Profile
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 3, borderColor: "divider" }}>
        <Stack spacing={4}>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Avatar
              sx={{
                bgcolor: "info.main",
                width: 72,
                height: 72,
                fontSize: "24px",
                fontWeight: 700,
                color: "white",
              }}
            >
              {user?.name?.substring(0, 2).toUpperCase() || "US"}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {user?.name || "User"}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user?.email || "user@leadlens.ai"}
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
            <Typography variant="h6" sx={{ fontSize: "15px", fontWeight: 700, mb: 2 }}>
              Preferences
            </Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Interface Theme
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => dispatch(toggleThemeMode())}
                startIcon={themeMode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                sx={{ borderColor: "divider", color: "text.primary" }}
              >
                {themeMode === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              color="error"
              onClick={logout}
              startIcon={<LogOut size={18} />}
              sx={{ py: 1.5, fontWeight: 700 }}
            >
              Logout securely
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
