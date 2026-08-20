import * as Device from "expo-device";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import { saveFcmToken } from "./notification.service";

// চেক: অ্যাপটি Expo Go-তে চলছে কিনা
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * ডিভাইসের FCM Token নিয়ে ব্যাকএন্ডে সেভ করার মূল ফাংশন
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // ১. Expo Go অ্যাপ চেক (Expo Go-তে নোটিফিকেশন মডিউল ইমপোর্ট করা যাবে না)
  if (isExpoGo) {
    console.log(
      "⚠️ Push Notifications (FCM) are disabled in Expo Go. Use a Development Build to test push notifications."
    );
    return null;
  }

  // ২. শুধুমাত্র Development Build/Production-এ ডাইনামিকালি মডিউল লোড হবে
  const Notifications = require("expo-notifications");

  // ফোরগ্রাউন্ড নোটিফিকেশন বিহেভিয়ার সেটআপ
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // ৩. রিয়েল ডিভাইস চেক
  if (!Device.isDevice) {
    console.log("⚠️ Push Notifications require a physical device");
    return null;
  }

  // ৪. পারমিশন চেক ও রিকোয়েস্ট
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("❌ Notification permission denied");
    return null;
  }

  // ৫. FCM Native Token সংগ্রহ
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const fcmToken =
      typeof tokenData?.data === "string"
        ? tokenData.data
        : String(tokenData?.data || "");

    console.log("🔥 FCM Token obtained:", fcmToken);

    if (fcmToken) {
      await saveFcmToken(fcmToken);
      console.log("✅ FCM Token registered to backend successfully");
    }

    // Android Notification Channel Setup
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return fcmToken;
  } catch (error) {
    console.error("❌ Failed to get FCM token:", error);
    return null;
  }
}