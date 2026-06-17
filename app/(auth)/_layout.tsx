import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Soft fade between auth steps (welcome → register → verify) so the
        // onboarding feels continuous rather than snapping.
        animation: "fade",
        animationDuration: 240,
      }}
    />
  );
}
