# Вхідні app-to-app дзвінки

Глухонімий користувач може приймати дзвінки від чуючих користувачів застосунку.
Розмова йде через нашу мережу (LiveKit-кімната + AI-міст), а не через телефонну
лінію. Чуючий абонент передає голос (мікрофон) у кімнату й чує озвучку (TTS);
глухонімий спілкується текстом на екрані `/call/live`, як і у звичайному дзвінку.

## Потоки

- Сигналінг присутності/дзвінків: окремий сокет `/signal` (`src/realtime/signal.ts`),
  підключається на рівні `(app)/_layout` через `useCallSignaling`.
- Вхідний дзвінок: подія `call.incoming` → екран `app/(app)/call/incoming.tsx`
  (+ нативний екран дзвінка, якщо доступний). Прийняти → `POST /calls/peer/:id/answer`
  → перехід на `/call/live`. Відхилити → `POST /calls/peer/:id/decline`.
- Вихідний дзвінок (чуючий): `useStartPeerCall` → `POST /calls/peer/start` →
  під'єднання аудіо (`callMediaTransport`) → екран `app/(app)/call/outgoing.tsx`.
- Профіль: онбординг та `EditProfileModal` записують `isDeafMute` через `PATCH /auth/me`.

## Нативні залежності (потрібен dev build, не Expo Go)

Аудіо-нога чуючого та системний екран дзвінка реалізовані за чистими портами з
опціональним `require`, тож код збирається і працює без модулів (з graceful
degradation до in-app екрана). Щоб увімкнути реальне аудіо та CallKit/ConnectionService:

```
npx expo install @livekit/react-native @livekit/react-native-webrtc react-native-callkeep
```

Далі зібрати dev/standalone build (`npx expo run:ios` / `run:android` або EAS).
Порти автоматично активують реальні адаптери, щойно модулі присутні:

- `src/features/calls/outgoing/application/callMediaTransport.ts` — LiveKit аудіо.
- `src/features/calls/incoming/application/nativeCallUi.ts` — CallKeep / CallKit.

## VoIP push (бекенд)

`PushNotifierService` відсилає Expo-пуш для data-токенів і б'є на
`VOIP_PUSH_ENDPOINT` (APNs PushKit-проксі) для voip-токенів. Зареєструвати токен
пристрою: `POST /push-tokens { token, platform, kind }`.
