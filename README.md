# PicPac: фотопечать и фотокниги

Мобильное приложение для заказа фотопечати и фотокниг: выбор продукта, шаблон, загрузка фото, корзина с промокодом, оформление заказа, статусы и поддержка.

## Структура репозитория

| Папка | Что внутри |
| --- | --- |
| `mobile/` | Мобильное приложение (Expo / React Native, TypeScript) |
| `server/` | REST API (Node.js, Express 5, TypeScript, zod, sharp) |
| `supabase/` | SQL: схема БД, миграции, тестовые данные (каталог, доставка, промокоды) |

База данных, авторизация и хранилище фото работают на Supabase. Сервер ходит в Supabase от имени пользователя (токен из заголовка `Authorization`), поэтому права доступа проверяет и сам Postgres (RLS).

## Быстрый старт

Понадобятся: Node.js 20 или новее, бесплатный аккаунт [Supabase](https://supabase.com), на телефоне приложение Expo Go (или эмулятор).

### 1. База данных (Supabase)

1. Создайте проект в Supabase.
2. Откройте **Project Settings → API** и сохраните: `Project URL`, ключ `anon` и ключ `service_role` (секретный, никому не отправляйте).
3. Откройте **SQL Editor** и выполните файлы **строго по порядку** (копируйте содержимое целиком):
   1. `supabase/schema.sql`
   2. `supabase/migrations/01-schema-upd.sql`
   3. `supabase/migrations/002_delivery_pricing.sql`
   4. `supabase/migrations/003_projects_orders_api.sql`
   5. `supabase/seed/001_catalog.sql`
4. В **Authentication → Sign In / Providers** включите нужные способы входа. Если приложение входит как гость, включите *Allow anonymous sign-ins*. Для демо удобно отключить подтверждение почты (*Confirm email*).

### 2. Сервер

```bash
cd server
cp .env.example .env        # Windows: copy .env.example .env
```

Заполните `server/.env`:

```
PORT=5001
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

```bash
npm install
npm run dev
```

Проверка: откройте <http://localhost:5001/api/health>, должен прийти `status: ok`.

> Файл `.env` содержит секретный ключ. Он в `.gitignore`, не коммитьте его и не пересылайте в архивах.

### 3. Мобильное приложение

```bash
cd mobile
cp .env.example .env        # Windows: copy .env.example .env
```

Заполните `mobile/.env`: `EXPO_PUBLIC_SUPABASE_URL` (тот же Project URL) и `EXPO_PUBLIC_SUPABASE_KEY` (ключ `anon`).

```bash
npm install
npx expo start
```

Отсканируйте QR-код в Expo Go. Если приложение обращается к серверу, на телефоне вместо `localhost` нужен адрес компьютера в локальной сети, например `http://192.168.1.10:5001/api` (телефон и компьютер должны быть в одной Wi-Fi сети).

### 4. Тестовые пользователи

1. В Supabase откройте **Authentication → Users → Add user**, создайте двух пользователей с отметкой *Auto Confirm User*: покупателя и админа.
2. Сделайте второго админом (в **SQL Editor**, подставьте его почту):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');
```

Роли: `customer` (по умолчанию), `support`, `admin`.

### 5. Быстрая проверка API через curl

Нужен bash (на Windows: Git Bash или WSL). Из корня репозитория:

```bash
API=http://localhost:5001/api
TOKEN=$(server/scripts/get-token.sh customer@example.com 'ваш-пароль')
AUTH="Authorization: Bearer $TOKEN"

# 1) создать проект (печать 10x15)
curl -s -X POST $API/projects -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"product_id":"print","variant_name":"10x15 матовая"}'
PID=<project.id из ответа>

# 2) загрузить фото (JPEG, PNG или WebP)
curl -s -X POST $API/projects/$PID/photos -H "$AUTH" -F "photo=@/путь/к/фото.jpg"

# 3) проверка перед заказом (число фото, DPI, пустые слоты)
curl -s $API/projects/$PID/check -H "$AUTH"

# 4) цена с промокодом (без создания заказа)
curl -s -X POST $API/orders/quote -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$PID\",\"qty\":1,\"delivery\":\"belpost\",\"promo_code\":\"TEST10\"}"

# 5) оформить заказ ДВА раза с одним ключом: номер заказа будет один и тот же
KEY=$(uuidgen)
for i in 1 2; do
  curl -s -X POST $API/orders -H "$AUTH" -H "Content-Type: application/json" \
    -H "Idempotency-Key: $KEY" \
    -d "{\"project_id\":\"$PID\",\"qty\":1,\"delivery\":\"belpost\",\"promo_code\":\"TEST10\"}"
  echo
done
```

Тестовые данные из seed: промокоды `TEST10` (−10%) и `WELCOME5` (−5%); способы получения `europochta`, `belpost`, `ems`, `courier_minsk`, `courier_by`; продукты `print`, `print-digital`, `photobook-lite`, `photobook-classic`, `photobook-premium`.

## API

Базовый адрес: `/api`. Ошибки приходят в одном формате: `{ "error": { "code", "message", "details?" } }`. Всё, кроме `health`, `catalog` и `delivery-methods`, требует заголовок `Authorization: Bearer <токен Supabase>`.

| Метод | Путь | Описание |
| --- | --- | --- |
| GET | `/health` | Проверка работы сервера |
| GET | `/catalog`, `/catalog/:id` | Продукты; продукт с шаблонами |
| GET | `/delivery-methods` | Способы получения |
| GET, PATCH | `/me` | Профиль (имя, телефон) |
| POST | `/projects` | Создать проект (черновик). Необязательный `id` с клиента защищает от дублей |
| GET | `/projects?status=draft` | Мои проекты |
| GET, PATCH, DELETE | `/projects/:id` | Проект с фото; смена варианта, шаблона, раскладки (`layout`), настроек; удаление черновика |
| POST | `/projects/:id/photos` | Загрузка фото (`multipart`, поле `photo`; необязательные `client_id`, `position`, `fit`) |
| PUT | `/projects/:id/photos/order` | Новый порядок фото: `{ "ids": [...] }` со всеми фото проекта |
| DELETE | `/projects/:id/photos/:photoId` | Удалить фото |
| GET | `/projects/:id/check` | Проверка перед заказом: лимиты, низкое разрешение и DPI, пустые слоты |
| POST | `/orders/quote` | Расчёт цены для корзины (промокод, доставка) |
| POST | `/orders` | Оформить заказ (заголовок `Idempotency-Key` обязателен) |
| GET | `/orders`, `/orders/:id` | История заказов; заказ со статусной лентой |
| GET | `/admin/ping` | Проверка роли `support` / `admin` |

Статусы заказа (`orders.status`): `0` Принят, `1` Модерация, `2` Производство, `3` Готов / передан, `4` Завершён.

### Идемпотентность оформления заказа

Клиент один раз создаёт UUID для попытки оформления и отправляет его в `Idempotency-Key` при каждом повторе (двойной тап, обрыв сети):

- первый запрос: `201` и новый заказ;
- повтор с тем же ключом: `200` и **тот же** заказ (заголовок `Idempotent-Replayed: true`);
- тот же ключ с другими параметрами: `409`.

Защита работает на уровне базы: уникальный индекс `(user_id, idempotency_key)` и функция `create_order`. Цена, скидка и доставка всегда считаются на сервере.

Загрузка фото защищена так же: если передать один и тот же `client_id`, повторная загрузка не создаст дубль.

## Частые проблемы

- **Сервер не стартует, пишет «Ошибка настройки»:** не заполнен `server/.env` (образец: `.env.example`).
- **`401` на всех запросах:** токен просрочен, получите новый (`server/scripts/get-token.sh`).
- **`404` на `/orders/quote` или `reorder_project_photos` не найдена:** не выполнена миграция `003_projects_orders_api.sql`.
- **Загрузка фото падает с ошибкой хранилища:** проверьте, что `schema.sql` выполнился целиком (он создаёт приватный бакет `photos`).
- **HEIC с iPhone не загружается:** поддерживаются JPEG, PNG и WebP, поэтому на клиенте снимок нужно конвертировать в JPEG до отправки.

## Лицензии

Список используемых библиотек и их лицензий (CREDITS.md / LICENSES.md) пока не составлен. Зависимости перечислены в `server/package.json` и `mobile/package.json`.
