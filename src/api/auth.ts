import { http } from "./http";

// Проверка, использовать ли Fake API
const USE_FAKE_API = import.meta.env.VITE_USE_FAKE_API !== "false";

// Маппинг ролей: бэкенд использует student/volunteer/admin, фронтенд - user/admin
function mapBackendRoleToFrontend(backendRole: string): "user" | "admin" {
  if (backendRole === "admin") return "admin";
  // student и volunteer -> user
  return "user";
}

// Fake API для аутентификации
const FAKE_USERS_KEY = "sosmap_fake_users";
const FAKE_TOKENS_KEY = "sosmap_fake_tokens";

interface FakeUser {
  id: string;
  email: string;
  password: string; // В реальном приложении не хранить!
  name?: string;
  role: "user" | "admin";
}

function getFakeUsers(): FakeUser[] {
  try {
    const stored = localStorage.getItem(FAKE_USERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  
  // Инициализация с тестовым админом, если нет пользователей
  const defaultAdmin: FakeUser = {
    id: "fake_admin_1",
    email: "admin@test.com",
    password: "admin123",
    name: "Админ Админов",
    role: "admin"
  };
  
  const defaultUsers: FakeUser[] = [
    defaultAdmin,
    {
      id: "fake_user_1",
      email: "student1@test.com",
      password: "student123",
      name: "Студент 1",
      role: "user"
    }
  ];
  
  localStorage.setItem(FAKE_USERS_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

function saveFakeUser(user: FakeUser): void {
  const users = getFakeUsers();
  const existingIndex = users.findIndex(u => u.email === user.email);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(FAKE_USERS_KEY, JSON.stringify(users));
}

function generateFakeToken(): string {
  return `fake_token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

function saveFakeToken(email: string, token: string, role: "user" | "admin"): void {
  const tokens = JSON.parse(localStorage.getItem(FAKE_TOKENS_KEY) || "{}");
  tokens[token] = { email, role };
  localStorage.setItem(FAKE_TOKENS_KEY, JSON.stringify(tokens));
  // Сохраняем email для использования в профиле
  localStorage.setItem("sr_email", email);
}

export async function loginApi(email: string, password: string) {
  if (USE_FAKE_API) {
    // Fake API логин
    await new Promise(resolve => setTimeout(resolve, 500)); // Задержка
    
    const users = getFakeUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (!user) {
      throw new Error("Неверный email или пароль");
    }
    
    const token = generateFakeToken();
    saveFakeToken(user.email, token, user.role);
    
    return {
      access_token: token,
      role: user.role
    };
  }
  
  // Реальный бэкенд
  const { data: tokenData } = await http.post("/auth/login", { email, password });
  const access_token = tokenData.access_token || tokenData.token;
  
  // Сохраняем email для профиля
  localStorage.setItem("sr_email", email);
  
  // Получаем информацию о пользователе для роли
  try {
    const axios = (await import("axios")).default;
    const tempHttp = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const { data: userData } = await tempHttp.get("/auth/me");
    // Сохраняем email из ответа, если есть
    if (userData.email) {
      localStorage.setItem("sr_email", userData.email);
    }
    return {
      access_token,
      role: mapBackendRoleToFrontend(userData.role)
    };
  } catch (error) {
    console.error("[Login] Failed to get user role, using default:", error);
    return {
      access_token,
      role: "user"
    };
  }
}

export async function registerApi(email: string, password: string, name?: string) {
  if (USE_FAKE_API) {
    // Fake API регистрация
    await new Promise(resolve => setTimeout(resolve, 800)); // Задержка
    
    const users = getFakeUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      throw new Error("Пользователь с таким email уже зарегистрирован");
    }
    
    // Создаем нового пользователя
    const newUser: FakeUser = {
      id: `fake_user_${Date.now()}`,
      email: email.trim().toLowerCase(),
      password: password, // В реальном приложении хешировать!
      name: name?.trim(),
      role: "user" // По умолчанию user
    };
    
    saveFakeUser(newUser);
    
    // Автоматически логинимся после регистрации
    const token = generateFakeToken();
    saveFakeToken(newUser.email, token, newUser.role);
    
    console.log("[Register] User created via Fake API:", newUser.email);
    
    return {
      access_token: token,
      role: newUser.role
    };
  }
  
  // Реальный бэкенд
  const payload: any = { 
    email: email.trim().toLowerCase(), 
    password,
    role: "student"
  };
  
  if (name && name.trim()) {
    const nameParts = name.trim().split(" ");
    payload.first_name = nameParts[0] || "";
    if (nameParts.length > 1) {
      payload.last_name = nameParts.slice(1).join(" ");
    }
  }
  
  try {
    console.log("[Register] Sending request to /auth/register", { 
      email: payload.email, 
      hasPassword: !!payload.password,
      hasName: !!payload.first_name 
    });
    
    const { data: userData } = await http.post("/auth/register", payload);
    console.log("[Register] User created successfully:", { 
      id: userData.id, 
      email: userData.email, 
      role: userData.role 
    });
    
    const loginResult = await loginApi(email, password);
    console.log("[Register] Login successful, token received, role:", loginResult.role);
    
    return loginResult;
    
  } catch (error: any) {
    console.error("[Register] Error details:", {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      responseData: error?.response?.data,
      message: error?.message,
      url: error?.config?.url,
    });
    
    // Улучшенная обработка ошибок
    if (error?.response?.status === 400) {
      const detail = error?.response?.data?.detail;
      if (typeof detail === 'string' && detail.includes('already registered')) {
        throw new Error("Пользователь с таким email уже зарегистрирован");
      }
      if (typeof detail === 'string') {
        throw new Error(detail);
      }
      if (Array.isArray(detail)) {
        const errors = detail.map((err: any) => 
          `${err.loc?.join('.') || 'field'}: ${err.msg || err.message || 'validation error'}`
        ).join(', ');
        throw new Error(`Ошибка валидации: ${errors}`);
      }
      throw new Error(error?.response?.data?.detail || "Неверные данные. Проверьте формат email и пароль.");
    }
    
    if (error?.response?.status === 422) {
      const detail = error?.response?.data?.detail;
      if (Array.isArray(detail)) {
        const errors = detail.map((err: any) => 
          `${err.loc?.join('.') || 'field'}: ${err.msg || err.message || 'validation error'}`
        ).join(', ');
        throw new Error(`Ошибка валидации: ${errors}`);
      }
      throw new Error("Ошибка валидации данных. Проверьте все поля.");
    }
    
    if (error?.response?.status === 409) {
      throw new Error("Пользователь с таким email уже существует.");
    }
    
    if (!error?.response) {
      if (error?.message?.includes('Network Error') || error?.code === 'ERR_NETWORK') {
        throw new Error(`Не удалось подключиться к серверу. Убедитесь, что бэкенд запущен на ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}`);
      }
      throw new Error(`Ошибка подключения: ${error?.message || "Неизвестная ошибка"}`);
    }
    
    // Общая ошибка
    const errorMessage = error?.response?.data?.detail || 
                        error?.response?.data?.message || 
                        `Ошибка регистрации (${error?.response?.status || 'unknown'})`;
    throw new Error(errorMessage);
  }
}
