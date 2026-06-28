"use client";

import React, { useEffect } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useAppSelector } from "@/store/hooks";
import { lightTheme, darkTheme } from "../theme";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const themeMode = useAppSelector((state) => state.settings.themeMode);
  
  // Decide which theme to apply
  const activeTheme = themeMode === "dark" ? darkTheme : lightTheme;

  // Sync dark class to HTML element for custom global scrollbars or non-MUI styles
  useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [themeMode]);

  return (
    <MuiThemeProvider theme={activeTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
