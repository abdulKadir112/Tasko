import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post-job" />
      <Stack.Screen name="job-details" />
    </Stack>
  );
}