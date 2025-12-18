import axios from "axios";
import { useAuthStore } from "../store/auth";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    // Проверяем, это fake token или реальный
    if (token.startsWith("fake_token_")) {
      // Для fake API не отправляем токен в заголовках
      // Но можно оставить для совместимости
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) useAuthStore.getState().logout();
    return Promise.reject(err);
  }
);
