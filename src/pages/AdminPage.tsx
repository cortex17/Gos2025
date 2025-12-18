import { useState } from "react";
import { Box, Button, Card, CardContent, Typography, Container, Chip, Skeleton, Tabs, Tab, Grid, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { CheckCircle, Cancel, LocationOn, Warning, People, Analytics, Block, LockOpen } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { approveReport, listPendingReports, rejectReport, listApprovedReports } from "../api/reports";
import { getUsers, blockUser, unblockUser, getAnalytics } from "../api/admin";
import { queryClient } from "../app/queryClient";
import { useToast } from "../components/Toast";
import HeatMap from "../components/HeatMap";
import FlashCard from "../components/FlashCard";

export default function AdminPage() {
  const [tab, setTab] = useState(0);
  const { showToast } = useToast();

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["reports", "pending"],
    queryFn: listPendingReports,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: getUsers,
  });

  const { data: analytics } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: getAnalytics,
  });

  const { data: allReports = [] } = useQuery({
    queryKey: ["reports", "approved"],
    queryFn: listApprovedReports,
  });

  async function onApprove(id: string) {
    try {
    await approveReport(id);
    await queryClient.invalidateQueries({ queryKey: ["reports"] });
      showToast("Отчет одобрен", "success");
    } catch (error) {
      showToast("Ошибка при одобрении отчета", "error");
    }
  }

  async function onReject(id: string) {
    try {
    await rejectReport(id);
    await queryClient.invalidateQueries({ queryKey: ["reports"] });
      showToast("Отчет отклонен", "success");
    } catch (error) {
      showToast("Ошибка при отклонении отчета", "error");
    }
  }

  async function handleBlockUser(userId: string) {
    try {
      await blockUser(userId);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showToast("Пользователь заблокирован", "success");
    } catch (error) {
      showToast("Ошибка при блокировке пользователя", "error");
    }
  }

  async function handleUnblockUser(userId: string) {
    try {
      await unblockUser(userId);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      showToast("Пользователь разблокирован", "success");
    } catch (error) {
      showToast("Ошибка при разблокировке пользователя", "error");
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      no_light: "Нет света",
      dogs: "Собаки",
      ice: "Гололёд",
      other: "Другое",
    };
    return labels[type] || type;
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Hero Section */}
      <Box
        sx={{
          width: "100%",
          py: { xs: 6, md: 8 },
          background: "linear-gradient(135deg, #f44336 0%, #e91e63 100%)",
          color: "white",
        }}
      >
        <Container maxWidth="xl">
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: "2rem", md: "3rem" },
            }}
          >
            Панель модерации
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
            Проверка и модерация отчетов о безопасности
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 4 }}>
          <Tab icon={<Warning />} label="Модерация" />
          <Tab icon={<People />} label="Пользователи" />
          <Tab icon={<Analytics />} label="Аналитика" />
        </Tabs>

        {/* Модерация отчетов */}
        {tab === 0 && (
          <>
            {reportsLoading ? (
    <Box sx={{ display: "grid", gap: 2 }}>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent>
                  <Skeleton height={40} />
                  <Skeleton height={20} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            ))}
          </Box>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: "center", py: 8 }}>
                  <CheckCircle sx={{ fontSize: 64, color: "success.main", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Нет отчетов на модерацию
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: "grid", gap: 3 }}>
                {reports.map((r) => (
              <FlashCard key={r.id} triggerKey={r.id}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 3, flexWrap: "wrap" }}>
                      <Box sx={{ flex: 1, minWidth: 300 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                          <Warning color="warning" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {getTypeLabel(r.type)}
                          </Typography>
                          <Chip
                            label={`Уровень: ${r.severity}/5`}
                            size="small"
                            color={r.severity >= 4 ? "error" : r.severity >= 3 ? "warning" : "default"}
                          />
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, color: "text.secondary" }}>
                          <LocationOn fontSize="small" />
                          <Typography variant="body2">
                            {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                          </Typography>
                        </Box>
                        {r.description && (
                          <Typography variant="body1" sx={{ mt: 2, color: "text.secondary" }}>
                            {r.description}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => onApprove(r.id)}
                          sx={{ minWidth: 140 }}
                        >
                          Одобрить
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => onReject(r.id)}
                          sx={{ minWidth: 140 }}
                        >
                          Отклонить
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </FlashCard>
                ))}
              </Box>
            )}
          </>
        )}

        {/* Управление пользователями */}
        {tab === 1 && (
          <>
            {usersLoading ? (
              <Box sx={{ display: "grid", gap: 2 }}>
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent>
                      <Skeleton height={40} />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Card>
                <CardContent sx={{ p: 0 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>Роль</TableCell>
                        <TableCell>Репутация</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell align="right">Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.role === "admin" ? "Админ" : "Пользователь"}
                              size="small"
                              color={user.role === "admin" ? "error" : "default"}
                            />
                          </TableCell>
                          <TableCell>{user.reputation ?? "-"}/100</TableCell>
                          <TableCell>
                            {user.isBlocked ? (
                              <Chip label="Заблокирован" color="error" size="small" />
                            ) : (
                              <Chip label="Активен" color="success" size="small" />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {user.isBlocked ? (
                              <Button
                                size="small"
                                startIcon={<LockOpen />}
                                onClick={() => handleUnblockUser(user.id)}
                              >
                                Разблокировать
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                color="error"
                                startIcon={<Block />}
                                onClick={() => handleBlockUser(user.id)}
                              >
                                Заблокировать
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Аналитика */}
        {tab === 2 && (
          <>
            {analytics ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {analytics.totalReports}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Всего отчетов
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "warning.main" }}>
                        {analytics.pendingReports}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        На модерации
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "success.main" }}>
                        {analytics.approvedReports}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Одобрено
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: "error.main" }}>
                        {analytics.rejectedReports}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Отклонено
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                {/* Heat Map */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Карта опасных зон
                      </Typography>
                      <HeatMap
                        data={allReports.map(r => ({
                          lat: r.lat,
                          lng: r.lng,
                          count: 1,
                          severity: r.severity,
                        }))}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {analytics.highRiskZones && analytics.highRiskZones.length > 0 && (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                          Зоны повышенного риска
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {analytics.highRiskZones.map((zone, i) => (
                            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", p: 2, bgcolor: "background.default", borderRadius: 1 }}>
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Инцидентов: {zone.count} | Средний уровень: {zone.avgSeverity.toFixed(1)}/5
                                </Typography>
                              </Box>
            </Box>
                          ))}
            </Box>
          </CardContent>
        </Card>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Card>
                <CardContent>
                  <Skeleton height={200} />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
