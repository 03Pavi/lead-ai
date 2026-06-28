import { createTheme, ThemeOptions } from "@mui/material/styles";

// Common typography configuration
const typography = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    "sans-serif",
  ].join(","),
  h1: {
    fontSize: "2.25rem", // 36px
    fontWeight: 700,
    letterSpacing: "-0.03em",
  },
  h2: {
    fontSize: "1.75rem", // 28px
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  h3: {
    fontSize: "1.375rem", // 22px
    fontWeight: 600,
    letterSpacing: "-0.02em",
  },
  h4: {
    fontSize: "1.125rem", // 18px
    fontWeight: 600,
    letterSpacing: "-0.015em",
  },
  h5: {
    fontSize: "1rem", // 16px
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  h6: {
    fontSize: "0.875rem", // 14px
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  body1: {
    fontSize: "0.9375rem", // 15px
    lineHeight: 1.6,
  },
  body2: {
    fontSize: "0.875rem", // 14px
    lineHeight: 1.5,
  },
  button: {
    textTransform: "none" as const,
    fontWeight: 500,
    fontSize: "0.875rem",
  },
  caption: {
    fontSize: "0.75rem",
    color: "#64748b",
  },
};

// Light theme design tokens
const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: "#0f172a", // Slate 900
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#475569", // Slate 600
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8fafc", // Slate 50 (App background)
      paper: "#ffffff",   // White (Card/Container background)
    },
    divider: "#e2e8f0",    // Slate 200 (Clean thin borders)
    text: {
      primary: "#0f172a",
      secondary: "#64748b", // Slate 500
      disabled: "#cbd5e1",
    },
    info: {
      main: "#2563eb",     // Electric Blue accent
    },
    success: {
      main: "#10b981",     // Emerald Green
    },
    warning: {
      main: "#f59e0b",     // Amber
    },
    error: {
      main: "#ef4444",      // Red
    },
    action: {
      hover: "#f1f5f9",
      selected: "#e2e8f0",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          boxShadow: "none",
          padding: "6px 16px",
          "&:hover": {
            boxShadow: "none",
          },
        },
        containedPrimary: {
          backgroundColor: "#0f172a",
          "&:hover": {
            backgroundColor: "#1e293b",
          },
        },
        outlined: {
          borderColor: "#e2e8f0",
          color: "#0f172a",
          "&:hover": {
            borderColor: "#cbd5e1",
            backgroundColor: "#f8fafc",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: "1px solid #e2e8f0",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: "1px solid #e2e8f0",
          backgroundImage: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          backgroundColor: "#ffffff",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#e2e8f0",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#cbd5e1",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2563eb",
            borderWidth: "1px",
          },
        },
      },
    },
  },
};

// Dark theme design tokens
const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: "dark",
    primary: {
      main: "#fafafa",     // Muted White
      contrastText: "#09090b",
    },
    secondary: {
      main: "#a1a1aa",     // Muted Zinc
      contrastText: "#09090b",
    },
    background: {
      default: "#09090b", // Pure Dark
      paper: "#18181b",   // Zinc 900
    },
    divider: "#27272a",    // Zinc 800 (Clean dark borders)
    text: {
      primary: "#fafafa",
      secondary: "#a1a1aa",
      disabled: "#3f3f46",
    },
    info: {
      main: "#3b82f6",     // Muted Electric Blue
    },
    success: {
      main: "#10b981",
    },
    warning: {
      main: "#f59e0b",
    },
    error: {
      main: "#ef4444",
    },
    action: {
      hover: "#27272a",
      selected: "#3f3f46",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          boxShadow: "none",
          padding: "6px 16px",
          "&:hover": {
            boxShadow: "none",
          },
        },
        containedPrimary: {
          backgroundColor: "#fafafa",
          color: "#09090b",
          "&:hover": {
            backgroundColor: "#e4e4e7",
          },
        },
        outlined: {
          borderColor: "#27272a",
          color: "#fafafa",
          "&:hover": {
            borderColor: "#3f3f46",
            backgroundColor: "#18181b",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: "1px solid #27272a",
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: "1px solid #27272a",
          backgroundImage: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          backgroundColor: "#09090b",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#27272a",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#3f3f46",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#3b82f6",
            borderWidth: "1px",
          },
        },
      },
    },
  },
};

export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);
export default { lightTheme, darkTheme };
