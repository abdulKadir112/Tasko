import { Stack } from "expo-router";

export default function WorkerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: "#ffffff",
        },
      }}
    >
      <Stack.Screen name="(tabs)" />

      {/* Profile & Account Settings */}
      <Stack.Screen name="edit-profile" />

      {/* Jobs & Bids Management */}
      <Stack.Screen name="job-details" />
      <Stack.Screen name="my-bids" />

      {/* Services Management */}
      <Stack.Screen name="my-services" />
    </Stack>
  );
}