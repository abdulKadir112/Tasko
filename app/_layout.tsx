import { useEffect } from "react";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AuthProvider } from "@/context/AuthContext";

import { initDatabase } from "@/database/database";
import { startQueueWorker } from "@/services/queue.worker";

export default function RootLayout() {
  useEffect(() => {
    // Initialize SQLite Database
    initDatabase();

    // Start Offline Queue Worker
    startQueueWorker();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar
              style="dark"
              backgroundColor="#ffffff"
              translucent={false}
            />

            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade",
                contentStyle: {
                  backgroundColor: "#ffffff",
                },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="splash" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="customer" />
              <Stack.Screen name="worker" />
              <Stack.Screen name="shared/notifications" />
              <Stack.Screen name="shared/chat/index" />
              <Stack.Screen name="shared/chat/room" />
              <Stack.Screen name="shared/chat/image-viewer" />
            </Stack>
          </AuthProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}