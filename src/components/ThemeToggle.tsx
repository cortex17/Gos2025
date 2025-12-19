import { IconButton, Tooltip } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const MotionIconButton = motion(IconButton);

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
    <Tooltip title={darkMode ? "Переключить на светлую тему" : "Переключить на темную тему"} arrow>
      <MotionIconButton
        onClick={() => setDarkMode(!darkMode)}
        whileHover={{ 
          scale: 1.1,
          rotate: 180,
        }}
        whileTap={{ scale: 0.9 }}
        sx={{
          bgcolor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          color: darkMode ? "#fff" : "text.primary",
          transition: "all 0.3s ease",
          border: "1px solid",
          borderColor: "divider",
          "&:hover": {
            bgcolor: darkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
            borderColor: darkMode ? "rgba(255,255,255,0.3)" : "primary.main",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
          },
        }}
      >
        <motion.div
          animate={{ rotate: darkMode ? 180 : 0 }}
          transition={{ duration: 0.3, type: "spring" }}
        >
          {darkMode ? <LightMode /> : <DarkMode />}
        </motion.div>
      </MotionIconButton>
    </Tooltip>
  );
}
