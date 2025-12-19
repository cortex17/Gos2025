# 🔧 Отладка входа в админ панель

## Шаг 1: Очистка данных

Откройте консоль браузера (F12) и выполните:

```javascript
// Очистить все данные авторизации
localStorage.clear();
console.log("localStorage cleared");

// Обновить страницу
location.reload();
```

## Шаг 2: Проверка кнопки "Войти как Админ"

1. Перейдите на `/login`
2. Откройте консоль (F12) → вкладка "Console"
3. Нажмите кнопку **"Войти как Админ"**
4. Смотрите логи в консоли - должны появиться сообщения:
   - `[QuickLoginAdmin] Starting admin login...`
   - `[QuickLoginAdmin] Login API response: ...`
   - `[AuthStore] setAuth called with role: admin`
   - `[QuickLoginAdmin] Redirecting to /admin`

## Шаг 3: Если кнопка не работает

### Вариант A: Вход через форму

1. На странице `/login` введите:
   - Email: `admin@test.com`
   - Пароль: `admin123`
2. Нажмите "Войти"
3. После входа проверьте в консоли:
   ```javascript
   console.log("Role:", localStorage.getItem("sr_role"));
   console.log("Token:", localStorage.getItem("sr_token") ? "exists" : "missing");
   ```
4. Если роль = "admin", перейдите на `/admin`

### Вариант B: Принудительный вход через консоль

Выполните в консоли браузера (F12):

```javascript
// Принудительно установить админа
localStorage.setItem("sr_token", "fake_token_admin_" + Date.now());
localStorage.setItem("sr_role", "admin");
localStorage.setItem("sr_email", "admin@test.com");

// Обновить store
window.location.href = "/admin";
```

## Шаг 4: Проверка доступа к /admin

После входа попробуйте перейти на `/admin` и проверьте консоль:

```javascript
// Должны увидеть:
// [RequireAdmin] Store - token: exists role: admin
// [RequireAdmin] Access granted for admin
```

Если видите `Access denied`, проверьте:

```javascript
// Проверить текущее состояние
const token = localStorage.getItem("sr_token");
const role = localStorage.getItem("sr_role");
console.log("Token:", token);
console.log("Role:", role);

// Если роль не "admin", установите вручную:
if (role !== "admin") {
  localStorage.setItem("sr_role", "admin");
  console.log("Role manually set to admin");
  location.reload();
}
```

## Шаг 5: Проверка fake API

Убедитесь, что fake API работает:

```javascript
// Проверить пользователей
const users = JSON.parse(localStorage.getItem("sosmap_fake_users") || "[]");
console.log("Fake users:", users);

// Должен быть пользователь с email "admin@test.com" и role "admin"
const admin = users.find(u => u.email === "admin@test.com");
console.log("Admin user:", admin);
```

Если админа нет, создайте его:

```javascript
const users = JSON.parse(localStorage.getItem("sosmap_fake_users") || "[]");
const adminExists = users.find(u => u.email === "admin@test.com");

if (!adminExists) {
  users.push({
    id: "fake_admin_1",
    email: "admin@test.com",
    password: "admin123",
    name: "Админ Админов",
    role: "admin"
  });
  localStorage.setItem("sosmap_fake_users", JSON.stringify(users));
  console.log("Admin user created");
}
```

## Частые проблемы

### Проблема: "Access denied" на /admin

**Решение:**
```javascript
localStorage.setItem("sr_role", "admin");
location.reload();
```

### Проблема: Кнопка не реагирует

**Решение:**
1. Откройте консоль (F12)
2. Проверьте, есть ли ошибки JavaScript
3. Попробуйте войти через форму

### Проблема: Роль не сохраняется

**Решение:**
```javascript
// Очистить и установить заново
localStorage.removeItem("sr_role");
localStorage.removeItem("sr_token");
localStorage.setItem("sr_role", "admin");
localStorage.setItem("sr_token", "fake_token_" + Date.now());
location.reload();
```

## Быстрый тест

Выполните все команды последовательно в консоли:

```javascript
// 1. Очистить
localStorage.clear();

// 2. Создать админа
const users = [{
  id: "fake_admin_1",
  email: "admin@test.com",
  password: "admin123",
  name: "Админ",
  role: "admin"
}];
localStorage.setItem("sosmap_fake_users", JSON.stringify(users));

// 3. Установить авторизацию
localStorage.setItem("sr_token", "fake_token_" + Date.now());
localStorage.setItem("sr_role", "admin");
localStorage.setItem("sr_email", "admin@test.com");

// 4. Перейти на админ панель
window.location.href = "/admin";
```

---

Если ничего не помогает, отправьте скриншот консоли браузера с ошибками.
