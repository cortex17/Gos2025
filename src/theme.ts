import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#2196f3",
      light: "#64b5f6",
      dark: "#1976d2",
    },
    secondary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    error: {
      main: "#f44336",
      light: "#e57373",
      dark: "#d32f2f",
    },
    background: {
      default: "#fafafa",
      paper: "#ffffff",
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    h1: { fontWeight: 800, fontSize: "3.5rem", lineHeight: 1.2 },
    h2: { fontWeight: 800, fontSize: "2.75rem", lineHeight: 1.3 },
    h3: { fontWeight: 700, fontSize: "2rem", lineHeight: 1.4 },
    h4: { fontWeight: 700, fontSize: "1.75rem", lineHeight: 1.4 },
    h5: { fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.5 },
    h6: { fontWeight: 700, fontSize: 18 },
    body1: { fontSize: 15, lineHeight: 1.6 },
    body2: { fontSize: 13, lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  components: {
    MuiPaper: {
      styleOverrides: { 
        root: { 
          backgroundImage: "none",
          borderRadius: 14,
        } 
      },
    },
    MuiCard: {
      styleOverrides: { 
        root: { 
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderRadius: 14,
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          },
        } 
      },
    },
    MuiButton: {
      styleOverrides: { 
        root: { 
          textTransform: "none", 
          fontWeight: 600,
          borderRadius: 12,
          padding: "10px 24px",
        } 
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        },
      },
    },
  },
});

