import { IconButton, Tooltip } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  return (
    <Tooltip title={darkMode ? "Светлая тема" : "Темная тема"}>
      <IconButton
        onClick={() => setDarkMode(!darkMode)}
        sx={{
          bgcolor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          color: darkMode ? "#fff" : "text.primary",
          "&:hover": {
            bgcolor: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
          },
        }}
      >
        {darkMode ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
}

