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

## Нативний вхідний дзвінок (потрібен dev build, не Expo Go)

Повноекранний вхідний, що сам дзвонить навіть на заблокованому/вбитому Android
(callkeep + фоновий push-таск + канал високого пріоритету). Рішення —
[ADR-0005](adr/0005-android-native-incoming-call.md); покрокова збірка й тест —
[native-incoming-call.md](native-incoming-call.md). Інфраструктура дзвінка живе
у `src/notifications/` (`nativeCallUi.ts`, `backgroundCallTask.ts`,
`callChannel.ts`, `missedCall.ts`). iOS поки на звичайних сповіщеннях.

Аудіо-нога чуючого реалізована окремим портом з опціональним `require`
(`src/features/calls/outgoing/application/callMediaTransport.ts` — LiveKit), тож
збирається і без модуля. Для реального аудіо доставити:

```
npx expo install @livekit/react-native @livekit/react-native-webrtc
```

## VoIP push (бекенд)

`PushNotifierService` відсилає Expo-пуш для data-токенів і б'є на
`VOIP_PUSH_ENDPOINT` (APNs PushKit-проксі) для voip-токенів. Зареєструвати токен
пристрою: `POST /push-tokens { token, platform, kind }`.
