import { Dialog, DialogContent, DialogTitle, Button, Box, Typography } from "@mui/material";
import { Warning } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface SosAuthModalProps {
  open: boolean;
  onClose: () => void;
  onQuickSos?: () => void;
}

export default function SosAuthModal({ open, onClose, onQuickSos }: SosAuthModalProps) {
  const nav = useNavigate();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning color="error" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Требуется авторизация
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Button
            variant="contained"
            onClick={() => {
              onClose();
              nav("/login?redirectTo=/pulse");
            }}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Войти
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              onClose();
              nav("/register");
            }}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Регистрация
          </Button>
          {onQuickSos && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                onClose();
                onQuickSos();
              }}
              fullWidth
              sx={{ py: 1.5 }}
            >
              Быстрый SOS
            </Button>
          )}
          <Button
            variant="text"
            onClick={onClose}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Отмена
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

