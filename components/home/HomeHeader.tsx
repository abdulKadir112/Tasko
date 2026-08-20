import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { COLORS } from "@/theme";
import { useAuthContext } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

export default function HomeHeader() {
  const { user } = useAuthContext();

  const name = user?.name || "Guest";
  const role = user?.role || "customer";
  const location = user?.city || "Bangladesh";
  const avatar = user?.photoURL || "";

  /**
   * Unread notification count.
   *
   * useNotifications hook নিজেই প্রতি 15 সেকেন্ডে
   * unread count refresh করে (polling), তাই এখানে
   * আলাদা কোনো interval লাগবে না।
   */
  const { unreadCount } = useNotifications({
    autoFetch: true,
    enablePolling: true,
    pollingInterval: 15000,
  });

  const notificationCount = unreadCount;

  function openProfile() {
    if (role === "worker") {
      router.push("/worker/profile");
    } else {
      router.push("/customer/profile");
    }
  }

  function openNotification() {
    router.push("/shared/notifications");
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.left}
        activeOpacity={0.8}
        onPress={openProfile}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color="#fff" />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.welcome}></Text>

          <Text style={styles.name}>{name}</Text>

          <View style={styles.roleRow}>
            <View style={styles.onlineDot} />

            <Text style={styles.role}>
              {role === "worker" ? "Worker" : "Customer"}
            </Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location" size={15} color={COLORS.primary} />

            <Text style={styles.location}>{location}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.notify} onPress={openNotification}>
        <Ionicons
          name="notifications-outline"
          size={24}
          color={COLORS.text}
        />

        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notificationCount > 99 ? "99+" : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 15,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  welcome: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 2,
  },

  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },

  role: {
    fontSize: 13,
    fontWeight: "600",
    color: "#10B981",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  location: {
    marginLeft: 5,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  notify: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 5,
  },

  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },

  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 10,
  },
});