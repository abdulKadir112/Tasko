import { useEffect } from "react";
import { Tabs, router } from "expo-router";
import Constants, { ExecutionEnvironment } from "expo-constants";
import BottomTabBar from "@/components/navigation/BottomTabBar";

// চেক: অ্যাপটি Expo Go-তে চলছে কিনা
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function CustomerTabs() {
  useEffect(() => {
    // Expo Go-তে থাকলে লিসেনার রান করবে না (এরর এড়াতে)
    if (isExpoGo) return;

    // শুধুমাত্র Development Build/Standalone-এ লোড হবে
    const Notifications = require("expo-notifications");

    // নোটিফিকেশনে ক্লিক করলে সঠিক স্ক্রিনে নেভিগেট করার লিসেনার
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        const data = response.notification.request.content.data;

        if (data?.screen) {
          router.push({
            pathname: data.screen as any,
            params: (data.params as Record<string, any>) || {},
          });
        }
      }
    );

    return () => subscription.remove();
  }, []);

  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="jobs" options={{ title: "Jobs" }} />
      <Tabs.Screen
        name="post"
        options={{
          title: "",
          tabBarLabel: "Post",
          href: null,
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}