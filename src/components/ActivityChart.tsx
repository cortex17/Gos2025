import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

interface ActivityChartProps {
  data: Array<{ date: string; count: number }>;
  height?: number;
}

export default function ActivityChart({ data, height = 120 }: ActivityChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <Box sx={{ position: "relative", height, width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-around",
          height: "100%",
          gap: 0.5,
        }}
      >
        {data.map((item, index) => {
          const barHeight = (item.count / maxCount) * 100;
          return (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${barHeight}%` }}
              transition={{ delay: index * 0.05, duration: 0.5, type: "spring" }}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  background: `linear-gradient(180deg, #667eea 0%, #764ba2 100%)`,
                  borderRadius: "4px 4px 0 0",
                  minHeight: 4,
                  position: "relative",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
                style={{ height: "100%" }}
              />
              <Typography
                variant="caption"
                sx={{
                  mt: 0.5,
                  fontSize: 10,
                  color: "text.secondary",
                  textAlign: "center",
                }}
              >
                {item.count}
              </Typography>
            </motion.div>
          );
        })}
      </Box>
    </Box>
  );
}

