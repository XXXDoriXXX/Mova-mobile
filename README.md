# Mova — Mobile Client

React Native (Expo) клієнт для **MOVA** — сервісу, який допомагає
глухим / нечуючим людям робити звичайні телефонні дзвінки через AI.

Бекенд: <https://github.com/XXXDoriXXX/MOVA>. Документація — на гілці
`docs/frontend-onboarding/docs`.

---

## Стек

- **Expo SDK 54** + **Expo Router** (file-based routing, typed routes)
- **TypeScript** strict (`noUncheckedIndexedAccess`)
- **TanStack Query** v5 — серверний стан; пауза під час офлайну +
  refetch on reconnect через `@react-native-community/netinfo`
- **Zustand** — клієнтський стан (auth, live-call)
- **axios** — HTTP клієнт з single-flight 401 refresh
- **socket.io-client** — WebSocket під час дзвінка, з reconnect+replay
- **expo-secure-store** — токени (Keychain / EncryptedSharedPrefs)
- **react-hook-form** + **zod** — форми + валідація
- **i18next** + **expo-localization** — i18n (uk default, en fallback)
- **expo-haptics**, **expo-notifications** (scaffold), **expo-linking**
  (deep links), **expo-updates** (опціонально, для Reload у ErrorBoundary)
- Опціональний **@sentry/react-native** через env `EXPO_PUBLIC_SENTRY_DSN`
- Власна тема (`src/theme`) — light / dark / system + 4 рівні font scale

---

## Запуск

```sh
npm install
cp .env.example .env.local           # опційно: переоприділити URL'и / DSN
npm run start
```

Далі: `i` (iOS симулятор, macOS only) / `a` (Android емулятор / пристрій) /
QR з Expo Go (Android).

### Environment

| Змінна | За замовч. | Опис |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:3000/v1` | REST base URL (api-gateway) |
| `EXPO_PUBLIC_WS_URL` | `ws://localhost:3001` | Socket.IO URL (realtime-service) |
| `EXPO_PUBLIC_SENTRY_DSN` | _(пусто)_ | Якщо задано — увімкне Sentry |

Production: `https://api.mova.app/v1` + `wss://realtime.mova.app` + ваш DSN.

---

## Команди

```sh
npm run start           # Metro + dev menu
npm run android         # запуск на Android
npm run ios             # macOS only
npm run web             # web (для перевірок)
npm run lint            # ESLint (expo preset)
npm run typecheck       # tsc --noEmit
npm test                # Jest
npm run test:watch      # Jest watch mode
npm run prepush         # typecheck + lint + test --ci
```

---

## Що вкрите

Усі ендпоінти бекенда, які потрібні юзеру:

- **Auth**: register, login, refresh, logout, me (GET + PATCH),
  change-password, delete-account (з підтвердженням пароля).
- **Billing**: summary, plans, usage, topup (idempotent), subscribe.
- **Calls**: start + live WebSocket.
- **Conversations**: list (cursor pagination), get, messages (infinite
  scroll), delete.
- **Templates**: list, create, edit, delete, duplicate, set-default,
  set-default-style.
- **Styles**: list (builtin + custom), create / edit / delete custom,
  set preferred default.
- **Style profile**: view + reset adaptation.
- **WS**: всі 14 server events + 8 client commands через типовану
  discriminated union (mirror з `libs/shared-realtime`).

Admin endpoints не охоплено — мобільний застосунок призначений для
кінцевих користувачів.

---

## Архітектура

```
app/                    Expo Router routes (file-based)
  _layout.tsx           Root: ErrorBoundary, Sentry init, QueryProvider,
                        OfflineBanner, ThemeProvider, AuthGate
  index.tsx             Boot redirect (authed → home, guest → welcome)
  (auth)/               Public: welcome / login / register
  (app)/                Private: bottom tabs + hidden screens
    home, history, settings
    settings/style-profile
    billing, templates, template/[id]
    styles, style/[id]
    conversation/[id], call/pre, call/live

src/
  api/                  Axios client + per-resource modules + refresh
  auth/                 Zustand store + AuthGate + SecureStore tokens
                        + pre-emptive refresh scheduler
  realtime/             Single-source-of-truth protocol.ts (mirrored
                        from backend's libs/shared-realtime), Socket.IO
                        factory, error-codes
  theme/                Tokens (palette, typography, spacing), ThemeProvider
                        with mode + fontScale prefs persisted to SecureStore
  components/           Themed primitives — Screen, Button, TextField, Modal,
                        Banner, Chip, Card, Row, Spinner, BalanceWidget,
                        ErrorBoundary, OfflineBanner
  features/             Screen-level composition (auth, billing, calls/live,
                        conversations, home, settings, styles, templates)
  net/                  QueryProvider + useOnline (NetInfo bridge)
  observability/        Opt-in Sentry init
  notifications/        expo-notifications registration scaffold
  navigation/           Typed deep-link builders
  i18n/                 i18next setup, UA / EN dictionaries
  types/                Wire-shape domain types (mirror of backend DTOs)
  utils/                idempotency-key, phone, format, jwt, haptics
  constants/            env (apiUrl, wsUrl, sentryDsn)

__tests__/              Jest suites — protocol parsing, call store reducer,
                        axios refresh, auth store, error boundary,
                        formatters, idempotency keys
docs/adr/               Architecture decision records
```

---

## Архітектурні рішення

- [`docs/adr/0001-realtime-protocol-mirror.md`](./docs/adr/0001-realtime-protocol-mirror.md)
  — чому ми копіюємо `ws-events.ts` верзи бекенда у `src/realtime/protocol.ts`
- [`docs/adr/0002-error-boundary-placement.md`](./docs/adr/0002-error-boundary-placement.md)
  — чому один root-only boundary, а не per-route
- [`docs/adr/0003-no-voip-background-mvp.md`](./docs/adr/0003-no-voip-background-mvp.md)
  — чому MVP не тримає WS у фоні і покладається на reconnect-on-resume

---

## Deep links

Експорти зі `src/navigation/deepLinks.ts`. Схема: `mova://`. Expo Router
автоматично мапить файлові маршрути; типізовані будівники гарантують, що
push-payload або зовнішнє посилання зламає білд, якщо маршрут перейменують.

```
mova://welcome
mova://home
mova://billing
mova://settings/style-profile
mova://conversation/<uuid>
mova://call/pre
mova://call/live?conversationId=<uuid>&initialStyleId=builtin:friendly
```

---

## Manual QA checklist

Цей чекліст виконує людина на справжньому пристрої — sandbox без
симулятора це не покриває.

- [ ] **Register**: створити акаунт з UA / EN → токени збереглись →
  холодний перезапуск → юзер залишається залогінений.
- [ ] **Login**: невалідний пароль → банер; правильний → home.
- [ ] **Refresh**: дочекатись 15 хв (access TTL) → будь-який запит
  мовчазно поновлюється; альтернатива — ребут із токенами що ось-ось
  спливуть, побачити пре-emptive refresh.
- [ ] **Live call**: pre-call → bubbles мають текст (не пусті) → tap
  suggestion → AI стрімить відповідь → timer + free-seconds-left
  оновлюються → end → ended screen з причиною.
- [ ] **Background mid-call**: смикнути в background → "Перепідключаємось…"
  банер → foreground → або відновлюється, або переходить у ended з
  `timeout`.
- [ ] **Topup**: Idempotency-Key reuse — два рази підряд однакова сума,
  баланс росте один раз.
- [ ] **Change password**: змінити, потім log in зі старим = 401, з
  новим = OK.
- [ ] **Delete account**: модалка з паролем → 401 = "Невірний пароль";
  правильний → акаунт видалений, юзер на welcome.
- [ ] **Appearance**: dark / light / system + 4 розміри тексту →
  перезавантажити app → налаштування зберігаються.
- [ ] **Style profile**: написати декілька повідомлень у дзвінку → у
  Settings → Адаптація стилю з'являється summary → Reset обнуляє.
- [ ] **Deep link**: відкрити `mova://billing` з іншого застосунку →
  приземляється на Billing.
- [ ] **Offline**: вимкнути мережу → банер "Немає звʼязку" → запити не
  спамлять backoff'ами; увімкнути → автоматично рефетчиться.

---

## Контракт із бекендом — обережно

Realtime payloads повинні точно матчити
`libs/shared-realtime/src/lib/ws-events.ts` (на бекенді). Якщо ви
додаєте поле / нову подію на сервері:

1. Оновити `src/realtime/protocol.ts` у дзеркальному форматі.
2. Якщо подія нова — додати фікстуру в `__tests__/fixtures/ws/<name>.json`.
3. `npm run prepush` має бути зеленим перед PR.
