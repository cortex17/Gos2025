import { useState } from "react";
import { Box, Button, Typography, Chip } from "@mui/material";
import { ThumbUp, ThumbDown } from "@mui/icons-material";
import { voteReport, getReportVotes } from "../api/reports";
import { useAuthStore } from "../store/auth";
import AuthModal from "./AuthModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface VoteButtonsProps {
  reportId: string;
}

export default function VoteButtons({ reportId }: VoteButtonsProps) {
  const { token } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const queryClient = useQueryClient();

  const { data: votes, isLoading } = useQuery({
    queryKey: ["votes", reportId],
    queryFn: () => getReportVotes(reportId),
    enabled: !!reportId,
  });

  const handleVote = async (vote: "confirm" | "fake") => {
    if (!token) {
      setShowAuth(true);
      return;
    }

    try {
      await voteReport(reportId, vote);
      await queryClient.invalidateQueries({ queryKey: ["votes", reportId] });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setShowAuth(true);
      } else {
        alert("Ошибка при голосовании");
      }
    }
  };

  const userVote = votes?.userVote;
  const confirmCount = votes?.confirm || 0;
  const fakeCount = votes?.fake || 0;

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Подтвердите достоверность:
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant={userVote === "confirm" ? "contained" : "outlined"}
            color="success"
            startIcon={<ThumbUp />}
            onClick={() => handleVote("confirm")}
            disabled={isLoading}
            size="small"
          >
            Подтвердить
            {confirmCount > 0 && (
              <Chip
                label={confirmCount}
                size="small"
                sx={{ ml: 1, height: 20 }}
              />
            )}
          </Button>
          <Button
            variant={userVote === "fake" ? "contained" : "outlined"}
            color="error"
            startIcon={<ThumbDown />}
            onClick={() => handleVote("fake")}
            disabled={isLoading}
            size="small"
          >
            Фейк
            {fakeCount > 0 && (
              <Chip
                label={fakeCount}
                size="small"
                sx={{ ml: 1, height: 20 }}
              />
            )}
          </Button>
        </Box>
      </Box>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          // После успешной авторизации можно автоматически проголосовать
        }}
        action="vote"
      />
    </>
  );
}

