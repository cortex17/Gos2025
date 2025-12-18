import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline } from "@mui/material";

import App from "./App";
import { queryClient } from "./app/queryClient";
import { ToastProvider } from "./components/Toast";
import { theme } from "./theme";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <CssBaseline />
        <ToastProvider>
          <App />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
