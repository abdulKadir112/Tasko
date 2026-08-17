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
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="job-details" />
      <Stack.Screen name="my-bids" />
      <Stack.Screen name="my-services" />
    </Stack>
  );
}