import { Stack } from "expo-router";

export default function WorkerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}