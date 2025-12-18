import { Button, Menu, MenuItem } from "@mui/material";
import { Download, FileDownload } from "@mui/icons-material";
import { useState } from "react";
import { Report } from "../api/reports";

interface ExportButtonProps {
  data: Report[];
  filename?: string;
}

export default function ExportButton({ data, filename = "reports" }: ExportButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportToCSV = () => {
    if (data.length === 0) {
      alert("Нет данных для экспорта");
      return;
    }

    const headers = ["ID", "Тип", "Уровень опасности", "Широта", "Долгота", "Описание", "Статус", "Дата создания"];
    const rows = data.map((r) => [
      r.id,
      r.type,
      r.severity.toString(),
      r.lat.toString(),
      r.lng.toString(),
      r.description || "",
      r.status,
      new Date(r.createdAt).toLocaleString("ru-RU"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleClose();
  };

  const exportToJSON = () => {
    if (data.length === 0) {
      alert("Нет данных для экспорта");
      return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleClose();
  };

  return (
    <>
      <Button
        startIcon={<Download />}
        variant="outlined"
        onClick={handleClick}
        sx={{ textTransform: "none" }}
      >
        Экспорт
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={exportToCSV}>
          <FileDownload sx={{ mr: 1 }} />
          Экспорт в CSV
        </MenuItem>
        <MenuItem onClick={exportToJSON}>
          <FileDownload sx={{ mr: 1 }} />
          Экспорт в JSON
        </MenuItem>
      </Menu>
    </>
  );
}

