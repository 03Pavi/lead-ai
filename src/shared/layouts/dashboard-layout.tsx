"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Stack,
  Button,
  useTheme as useMuiTheme,
  useMediaQuery,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  LayoutDashboard,
  Search,
  FolderHeart,
  User,
} from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleThemeMode } from "@/entities/settings/model/settings-slice";
import Image from "next/image";
import { APP_ICON } from "../../../public";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const muiTheme = useMuiTheme();
  
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const { user, isAuthenticated, logout, checkSession } = useAuth();
  
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((state) => state.settings.themeMode);
  
  const [restoringSession, setRestoringSession] = useState(!isAuthenticated);

  // Verification & Silent Session Restoration
  useEffect(() => {
    let active = true;
    
    const verifySession = async () => {
      if (!isAuthenticated) {
        const restored = await checkSession();
        if (active) {
          setRestoringSession(false);
          if (!restored) {
            router.push("/login");
          }
        }
      } else {
        if (active) {
          setRestoringSession(false);
        }
      }
    };

    verifySession();

    return () => {
      active = false;
    };
  }, [isAuthenticated, router]);

  // Auth synchronization listeners
  useEffect(() => {
    const handleLogoutEvent = () => {
      logout();
    };

    window.addEventListener("leadlens_auth_logout", handleLogoutEvent);
    return () => {
      window.removeEventListener("leadlens_auth_logout", handleLogoutEvent);
    };
  }, [logout]);

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Lead Finder", path: "/search", icon: Search },
    { label: "Saved Lists", path: "/lists", icon: FolderHeart },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  // Render a clean loading interface while validating HttpOnly session
  if (restoringSession) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          bgcolor: "background.default",
          gap: 2,
        }}
      >
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Verifying secure session credentials...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <Box
          sx={{
            width: 240,
            flexShrink: 0,
            borderRight: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: 0,
            height: "100vh",
          }}
        >
          {/* Header/Logo */}
          <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Image src={APP_ICON} alt="LeadLens AI" width={26}  height={26} style={{ width: 26, height: 26, borderRadius: 6 }} />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "text.primary",
                letterSpacing: "-0.03em",
              }}
            >
              LeadLens <span style={{ color: muiTheme.palette.info.main }}>AI</span>
            </Typography>
          </Box>

          {/* Navigation Links */}
          <Stack spacing={0.5} sx={{ p: 2, flexGrow: 1 }}>
            {navItems.map((item) => {
              const active = pathname === item.path;
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  variant="text"
                  startIcon={<Icon size={18} />}
                  sx={{
                    justifyContent: "flex-start",
                    py: 1,
                    px: 1.5,
                    color: active ? "info.main" : "text.secondary",
                    bgcolor: active ? "action.hover" : "transparent",
                    fontWeight: active ? 600 : 500,
                    borderRadius: "6px",
                    "&:hover": {
                      bgcolor: "action.hover",
                      color: "text.primary",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          {/* User Block & Settings at Bottom */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button
              variant="text"
              onClick={() => handleNavigate("/profile")}
              startIcon={<User size={18} />}
              sx={{
                width: "100%",
                justifyContent: "flex-start",
                py: 1,
                px: 1.5,
                color: "text.secondary",
                fontWeight: 500,
                borderRadius: "6px",
                "&:hover": {
                  bgcolor: "action.hover",
                  color: "text.primary",
                },
              }}
            >
              My Profile
            </Button>
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, height: "100vh", minWidth: 0 }}>
        {/* MOBILE HEADER */}
        {isMobile && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Image src={APP_ICON} alt="LeadLens AI" width={22}  height={22} style={{ width: 22, height: 22, borderRadius: 4 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: "-0.03em", fontSize: "18px" }}>
                LeadLens <span style={{ color: muiTheme.palette.info.main }}>AI</span>
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => handleNavigate("/profile")}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "info.main", fontSize: "14px", fontWeight: 700 }}>
                {user?.name?.substring(0, 2).toUpperCase() || "US"}
              </Avatar>
            </IconButton>
          </Box>
        )}

        {/* CORE CONTENT LAYOUT */}
        <Box
          component="main"
          className="safe-top"
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: { xs: 2.5, sm: 4 },
            pb: isMobile ? "90px" : 4,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Box>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {isMobile && (
        <Box
          className="safe-bottom"
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "calc(64px + env(safe-area-inset-bottom, 0px))",
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            px: 2,
            pb: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {navItems.map((item) => {
            const active = pathname === item.path;
            const Icon = item.icon;
            const isSearch = item.path === "/search";
            
            return (
              <Box
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: active ? "info.main" : "text.secondary",
                  width: 60,
                  height: 48,
                  ...(isSearch && {
                    transform: "translateY(-16px)",
                    bgcolor: "info.main",
                    color: "white",
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    "&:active": {
                      transform: "translateY(-16px) scale(0.95)",
                    },
                  }),
                  ...(!isSearch && {
                    borderRadius: "6px",
                    transition: "all 0.2s",
                    "&:active": {
                      bgcolor: "action.hover",
                    },
                  }),
                }}
              >
                <Icon size={isSearch ? 24 : 20} strokeWidth={active || isSearch ? 2.5 : 2} />
                {!isSearch && (
                  <Typography variant="caption" sx={{ fontSize: "10px", fontWeight: active ? 600 : 500, mt: 0.5 }}>
                    {item.label}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      )}
      </Box>
    </Box>
  );
}
