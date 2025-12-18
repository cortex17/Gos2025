import { IconButton, Tooltip, Snackbar, Alert } from "@mui/material";
import { Share } from "@mui/icons-material";
import { useState } from "react";

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url: window.location.origin + url,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: копирование в буфер обмена
        await navigator.clipboard.writeText(shareData.url);
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        // Fallback: копирование в буфер обмена
        try {
          await navigator.clipboard.writeText(shareData.url);
          setSnackbarOpen(true);
        } catch (clipboardError) {
          console.error("Failed to copy to clipboard:", clipboardError);
        }
      }
    }
  };

  return (
    <>
      <Tooltip title="Поделиться">
        <IconButton onClick={handleShare} color="primary">
          <Share />
        </IconButton>
      </Tooltip>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          Ссылка скопирована в буфер обмена!
        </Alert>
      </Snackbar>
    </>
  );
}

