import { Tabs } from "expo-router";
import BottomTabBar from "@/components/navigation/BottomTabBar";

export default function CustomerTabs() {
  return (
    <Tabs
      tabBar={(props) => (
        <BottomTabBar {...props} />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home" }}
      />

      <Tabs.Screen
        name="jobs"
        options={{ title: "Jobs" }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: "",
          tabBarLabel: "Post",
          href: null,
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: "Messages" }}
      />

      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />
    </Tabs>
  );
}