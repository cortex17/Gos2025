import { useState } from "react";
import { Box, Button, Typography, Dialog, DialogContent, Stepper, Step, StepLabel, StepContent } from "@mui/material";
import { LocationOn, Warning, AddAlert } from "@mui/icons-material";

interface OnboardingOverlayProps {
  onClose: () => void;
}

export default function OnboardingOverlay({ onClose }: OnboardingOverlayProps) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      label: "Разреши геолокацию",
      description: "Включи геолокацию для получения предупреждений о ближайших опасностях",
      icon: <LocationOn />,
    },
    {
      label: "Нажми и удерживай SOS",
      description: "Для отправки SOS сигнала удерживай кнопку SOS 2-3 секунды",
      icon: <Warning />,
    },
    {
      label: "Клик по карте → отчет",
      description: "Нажми на карту, чтобы быстро создать отчет об инциденте",
      icon: <AddAlert />,
    },
  ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onClose();
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  return (
    <Dialog open fullScreen sx={{ zIndex: 1400 }}>
      <DialogContent sx={{ bgcolor: "rgba(0, 0, 0, 0.9)", color: "white", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Box sx={{ maxWidth: 600, mx: "auto", width: "100%" }}>
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, textAlign: "center" }}>
            Добро пожаловать в SOSMap
          </Typography>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box sx={{ color: "primary.main", fontSize: 32 }}>{step.icon}</Box>
                  )}
                >
                  <Typography variant="h6" sx={{ color: "white" }}>
                    {step.label}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body1" sx={{ mb: 2, color: "rgba(255, 255, 255, 0.8)" }}>
                    {step.description}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    {index > 0 && (
                      <Button onClick={handleBack} variant="outlined" sx={{ textTransform: "none" }}>
                        Назад
                      </Button>
                    )}
                    <Button onClick={handleNext} variant="contained" sx={{ textTransform: "none" }}>
                      {index === steps.length - 1 ? "Начать" : "Далее"}
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

