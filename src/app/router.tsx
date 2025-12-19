import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAdmin, RequireAuth } from "./guards";
import { AppLayout } from "./layout";

import AuthPage from "../pages/AuthPage";
import DashboardMapPage from "../pages/DashboardMapPage";
import PulsePage from "../pages/PulsePage";
import MapPage from "../pages/MapPage";
import ReportNewPage from "../pages/ReportNewPage";
import ReportDetailPage from "../pages/ReportDetailPage";
import ReportsListPage from "../pages/ReportsListPage";
import ProfilePage from "../pages/ProfilePage";
import AdminPage from "../pages/AdminPage";
import IncidentsListPage from "../pages/IncidentsListPage";
import IncidentDetailPage from "../pages/IncidentDetailPage";
import QuickAdminLogin from "../pages/QuickAdminLogin";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/pulse" replace /> },
  { path: "/login", element: <AuthPage /> },
  { path: "/register", element: <AuthPage /> },
  { path: "/admin-login", element: <QuickAdminLogin /> }, // Быстрый вход в админ панель
  { path: "/pulse", element: <PulsePage /> }, // Публичный - read-only для гостей

  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/map", element: <MapPage /> }, // Новая рабочая карта
          { path: "/dashboard", element: <DashboardMapPage /> }, // Старая карта (можно удалить позже)
          { path: "/incidents", element: <IncidentsListPage /> }, // Список инцидентов
          { path: "/incidents/:id", element: <IncidentDetailPage /> }, // Детали инцидента
          { path: "/reports", element: <ReportsListPage /> }, // Старый список (можно удалить)
          { path: "/report/new", element: <ReportNewPage /> }, // Создание отчета
          { path: "/report/:id", element: <ReportDetailPage /> }, // Старые детали (можно удалить)
          { path: "/profile", element: <ProfilePage /> },
        ],
      },
    ],
  },

  {
    element: <RequireAdmin />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/admin", element: <AdminPage /> },
          { path: "/admin/incidents", element: <AdminPage /> },
          { path: "/admin/users", element: <AdminPage /> },
          { path: "/admin/analytics", element: <AdminPage /> },
        ],
      },
    ],
  },
]);
