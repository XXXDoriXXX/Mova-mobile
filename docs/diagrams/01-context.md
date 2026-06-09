# Діаграма 1 — Контекстна (DFD Level 0)

Система MOVA як «чорний ящик» і всі зовнішні сутності, з якими вона
обмінюється даними. Внутрішні сервіси (api-gateway, agent-worker,
realtime-service, Postgres, Redis) сховано всередині системи —
з'являються тільки на Level 1.

## Нотація

| Фігура | Що означає |
|---|---|
| Овал (лайм) | Людина-актор |
| Прямокутник (форест) | Сама система MOVA |
| Паралелограм (бежевий) | Зовнішня служба / провайдер |
| Стрілка з підписом | Потік даних (текст / голос / події) |

Двонапрямлені стрілки використано **тільки** там, де обмін справді
синхронний (запит-відповідь або діалог); решта — одностороннє.

## Діаграма

```mermaid
flowchart LR
    %% ── Human actors ─────────────────────────────
    User(["👤 Користувач<br/>(глухонімий)"])
    Interlocutor(["👤 Співрозмовник<br/>(інша сторона дзвінка)"])
    Admin(["👤 Адміністратор"])

    %% ── The system ───────────────────────────────
    MOVA["🟢 <b>MOVA</b><br/>──────────<br/>голосовий асистент<br/>для телефонних дзвінків"]

    %% ── External services ────────────────────────
    LiveKit[/"☁️ LiveKit Cloud<br/>WebRTC + SIP gateway"/]
    Zadarma[/"☎️ Zadarma<br/>SIP trunk → PSTN"/]
    LLM[/"🧠 LLM providers<br/>OpenAI · Gemini · Anthropic · Groq"/]
    STT[/"🎙 STT — Deepgram"/]
    TTS[/"🔊 TTS<br/>Google · ElevenLabs · OpenAI · Gemini"/]
    Stripe[/"💳 Stripe"/]
    Google[/"🔐 Google OAuth"/]
    Push[/"📱 Expo Push"/]
    Sentry[/"📊 Sentry"/]

    %% ── User ↔ MOVA ──────────────────────────────
    User -- "email/пароль, номер,<br/>текст, accept / cancel,<br/>стиль, голос" --> MOVA
    MOVA -- "транскрипт, AI-прев'ю,<br/>швидкі підказки, статус,<br/>push-сповіщення" --> User

    User <-- "OAuth id_token" --> Google

    %% ── Admin ↔ MOVA ─────────────────────────────
    Admin -- "ключі провайдерів,<br/>force-end, monitoring" --> MOVA
    MOVA -- "інциденти, метрики,<br/>повна історія дзвінків" --> Admin

    %% ── Phone call legs ──────────────────────────
    Interlocutor <-- "голос (PSTN)" --> Zadarma
    Zadarma <-- "SIP signaling + RTP" --> LiveKit
    LiveKit <-- "WebRTC audio +<br/>SIP-події" --> MOVA

    %% ── AI providers ─────────────────────────────
    MOVA -- "prompt + історія" --> LLM
    LLM -- "стрімінг токенів" --> MOVA

    MOVA -- "аудіо-чанки" --> STT
    STT -- "partial / final<br/>транскрипти" --> MOVA

    MOVA -- "текст до озвучки" --> TTS
    TTS -- "audio frames" --> MOVA

    %% ── Other services ───────────────────────────
    MOVA <-- "Checkout session<br/>+ webhook" --> Stripe
    Push -- "device token" --> MOVA
    MOVA -- "push payload" --> Push
    MOVA -- "exceptions + traces" --> Sentry

    %% ── Styling ──────────────────────────────────
    classDef actor fill:#D7F25C,stroke:#0A0A0A,stroke-width:2px,color:#0A0A0A
    classDef system fill:#0F3A2E,stroke:#0A0A0A,stroke-width:3px,color:#FFFFFF
    classDef service fill:#F1F1EB,stroke:#0A0A0A,stroke-width:1px,color:#0A0A0A

    class User,Interlocutor,Admin actor
    class MOVA system
    class LiveKit,Zadarma,LLM,STT,TTS,Stripe,Google,Push,Sentry service
```

## Опис потоків

### Людські актори

**Користувач (глухонімий)** — основний beneficiary. Не чує/не говорить
голосом, тому з застосунком взаємодіє ТЕКСТОМ + ВІЗУАЛЬНО:
- надає: облікові дані, номер для дзвінка, друкований текст, тапи на
  швидкі підказки, accept/cancel прев'ю AI, налаштування стилю/голосу;
- отримує: live-транскрипт співрозмовника, картку «що зараз скажу»,
  3 варіанти швидких відповідей, статус дзвінка, push-сповіщення.

**Співрозмовник** — людина на іншому кінці звичайного телефонного дзвінка.
**Не знає** що говорить з ШІ — для нього це звичайна голосова розмова.

**Адміністратор** — оператор у admin-SPA. Дає системні ключі провайдерів
(шифровані AES-256-GCM), бачить інциденти, може примусово завершити дзвінок.

### Зовнішні служби

**LiveKit Cloud** — голосова інфраструктура. Зводить SIP-leg
співрозмовника + WebRTC-leg агента в одну кімнату. MOVA отримує SIP-події
(connected / answered / ended).

**Zadarma** — SIP trunk на справжню телефонну мережу. Через нього
ходять реальні дзвінки на справжні номери.

**LLM-провайдери** — генерація відповідей. Чотири з health-ranked
fallback'ом: OpenAI → Gemini → Anthropic → Groq (для швидких підказок).

**STT (Deepgram)** — потокове транскрибування мови співрозмовника.
Whisper як fallback.

**TTS** — синтез голосу. Google Cloud за замовчуванням (`uk-UA-Wavenet`,
найдешевший і стабільний для UA), ElevenLabs для преміум-голосів.

**Stripe** — оплата підписок і top-up балансу. Webhook'и підтверджують
платежі.

**Google OAuth** — Sign-In through Google як альтернатива email/паролю.

**Expo Push** — сповіщення на мобільний пристрій (втрата з'єднання,
завершення дзвінка, нові швидкі чаплети).

**Sentry** — спостережність. Усі unhandled exceptions + WS parse
errors + HTTP 5xx → події в Sentry.

## Що НЕ показано (свідомо)

- **Postgres** — внутрішній persistence шар MOVA, з'явиться на Level 1
- **Redis** — pub/sub між api-gateway / agent-worker / realtime-service,
  внутрішній
- **Prometheus / Grafana / Loki** — внутрішня observability-стек
- **Декомпозиція MOVA на сервіси** — це Level 1+

## Як рендерити

- GitHub: відображається автоматично у markdown-preview.
- VS Code: розширення «Markdown Preview Mermaid Support».
- Експорт у PNG/SVG: <https://mermaid.live/> → вставити блок коду →
  Actions → PNG/SVG.

Для друку у диплом — згенеруй SVG через mermaid.live і встав як зображення.
