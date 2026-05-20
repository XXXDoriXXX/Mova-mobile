# Mova — Mobile Client

React Native (Expo) клієнт для **MOVA** — сервісу, який допомагає
глухим/нечуючим людям робити звичайні телефонні дзвінки через AI.

Бекенд: <https://github.com/XXXDoriXXX/MOVA> — детальна документація на
гілці `docs/frontend-onboarding/docs`.

---

## Стек

- **Expo SDK 54** + **Expo Router** (file-based)
- **TypeScript** strict
- **TanStack Query** v5 — серверний стан
- **Zustand** — клієнтський стан (auth)
- **axios** — HTTP клієнт (з auto-refresh interceptor)
- **socket.io-client** — WebSocket під час дзвінка
- **expo-secure-store** — токени (Keychain / EncryptedSharedPrefs)
- **react-hook-form** + **zod** — форми
- **i18next** + **expo-localization** — i18n (uk / en)
- Власна тема (`src/theme`) + кастомні компоненти (`src/components`)

---

## Запуск

```sh
npm install
cp .env.example .env.local          # за потреби переоприділіть URL'и
npm run start
```

Далі:
- `i` — iOS симулятор (macOS only)
- `a` — Android emulator / device
- Сканування QR з Expo Go (Android) — найшвидший шлях

### Environment

| Змінна | За замовч. | Опис |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:3000/v1` | REST base URL — `api-gateway` |
| `EXPO_PUBLIC_WS_URL` | `ws://localhost:3001` | Socket.IO URL — `realtime-service` |

Для продакшну: `https://api.mova.app/v1` + `wss://realtime.mova.app`.

---

## Що готово

- ✅ Auth: register / login / logout / **automatic token refresh** (single-flight 401 retry)
- ✅ Secure token storage (SecureStore)
- ✅ Home shell: balance widget + recent calls list
- ✅ Theme system (light / dark, large body font for a11y)
- ✅ i18n (uk default, en fallback)
- ✅ HTTP + WebSocket client modules (з типізованими events/commands)
- 🟡 Stub routes for billing / templates / styles / history / pre-call / live-call

---

## Структура

```
app/                    Expo Router routes (file-based)
  _layout.tsx           Root providers + AuthGate
  index.tsx             Boot redirect
  (auth)/               Public group: welcome / login / register
  (app)/                Private group: home + tab nav + stubs
src/
  api/                  Axios client + per-resource modules
  auth/                 Zustand store + SecureStore tokens + AuthGate
  realtime/             socket.io factory + event/command types
  theme/                Tokens + ThemeProvider
  components/           Custom themed primitives
  features/             Screen-level composition (forms, lists)
  i18n/                 i18next setup + UA/EN dictionaries
  types/                Domain types from backend docs
  utils/                idempotency-key, phone, format, jwt
  constants/            env (apiUrl, wsUrl)
```

---

## Команди

```sh
npm run start           # Metro + dev menu
npm run android         # запуск на Android
npm run ios             # macOS only
npm run web             # web (для перевірок)
npm run lint            # ESLint (expo preset)
npx tsc --noEmit        # type-check
```
