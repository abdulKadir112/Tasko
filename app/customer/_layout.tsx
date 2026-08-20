import { Stack } from "expo-router";

export default function CustomerLayout() {
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

      {/* Jobs */}
      <Stack.Screen name="post-job" />
      <Stack.Screen name="job-details" />
      <Stack.Screen name="edit-job" />
      <Stack.Screen name="bids" />

      {/* Workers & Services */}
      <Stack.Screen name="worker-list" />
      <Stack.Screen name="worker-profile" />
      <Stack.Screen name="category-services" />
      <Stack.Screen name="book-worker" />

      {/* Emergency */}
      <Stack.Screen name="emergency" />

      {/* Profile */}
      <Stack.Screen name="edit-profile" />
    </Stack>
  );
}