import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme";

type Props = {
  name: string;
  photoURL?: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
  onPress: () => void;
};

export default function ChatCard({
  name,
  photoURL,
  lastMessage,
  time,
  unread = 0,
  online = false,
  onPress,
}: Props) {
  /*
   * ⭐⭐⭐ CRITICAL DEFENSIVE FIX ⭐⭐⭐
   *
   * <Image source={{ uri: photoURL }}> এ আগে কোনো typeof
   * চেক ছিল না — photoURL prop যদি backend থেকে কোনো
   * কারণে object আকারে (normalize না হয়ে) সরাসরি চলে
   * আসে, তাহলে RCTImageView crash করত:
   *
   *   "Value for uri cannot be cast from
   *    ReadableNativeMap to String"
   *
   * এখন এখানেই সবসময় safe string-এ coerce করা হচ্ছে,
   * কম্পোনেন্ট নিজে থেকেই নিরাপদ থাকবে — parent component
   * ঠিকভাবে normalize করুক বা না করুক।
   */

  const safePhotoURL =
    typeof photoURL === "string" &&
    photoURL.trim().length > 0
      ? photoURL.trim()
      : null;

  if (photoURL && !safePhotoURL) {
    console.log(
      "⚠️ ChatCard: photoURL is not a valid string, ignoring:",
      "typeof:",
      typeof photoURL,
      "value:",
      photoURL
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.72}
      onPress={onPress}
    >
      {/* =========================
          AVATAR
      ========================= */}

      <View style={styles.avatarWrapper}>
        {safePhotoURL ? (
          <Image
            source={{ uri: safePhotoURL }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name="person"
              size={27}
              color="#FFFFFF"
            />
          </View>
        )}

        {/* ONLINE */}

        {online && (
          <View style={styles.onlineOuter}>
            <View style={styles.onlineDot} />
          </View>
        )}
      </View>

      {/* =========================
          CONTENT
      ========================= */}

      <View style={styles.body}>
        {/* TOP ROW */}

        <View style={styles.topRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.name,
              unread > 0 && styles.unreadName,
            ]}
          >
            {name}
          </Text>

          <Text
            style={[
              styles.time,
              unread > 0 && styles.unreadTime,
            ]}
          >
            {time}
          </Text>
        </View>

        {/* BOTTOM ROW */}

        <View style={styles.bottomRow}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.message,
              unread > 0 && styles.unreadMessage,
            ]}
          >
            {lastMessage}
          </Text>

          {/* UNREAD BADGE */}

          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unread > 99 ? "99+" : unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",

    alignItems: "center",

    minHeight: 82,

    paddingHorizontal: 16,

    paddingVertical: 11,

    backgroundColor: "#FFFFFF",

    borderBottomWidth: 1,

    borderBottomColor: "#F1F5F9",
  },

  // ===================================================
  // AVATAR
  // ===================================================

  avatarWrapper: {
    width: 58,

    height: 58,

    position: "relative",

    justifyContent: "center",

    alignItems: "center",
  },

  avatar: {
    width: 58,

    height: 58,

    borderRadius: 29,

    backgroundColor: "#E2E8F0",
  },

  avatarPlaceholder: {
    width: 58,

    height: 58,

    borderRadius: 29,

    justifyContent: "center",

    alignItems: "center",

    backgroundColor: COLORS.primary,
  },

  // ===================================================
  // ONLINE INDICATOR
  // ===================================================

  onlineOuter: {
    position: "absolute",

    right: -1,

    bottom: -1,

    width: 18,

    height: 18,

    borderRadius: 9,

    backgroundColor: "#FFFFFF",

    justifyContent: "center",

    alignItems: "center",
  },

  onlineDot: {
    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: "#22C55E",
  },

  // ===================================================
  // BODY
  // ===================================================

  body: {
    flex: 1,

    marginLeft: 14,

    minWidth: 0,

    justifyContent: "center",
  },

  // ===================================================
  // TOP ROW
  // ===================================================

  topRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 6,
  },

  name: {
    flex: 1,

    minWidth: 0,

    marginRight: 10,

    color: COLORS.text,

    fontSize: 16,

    lineHeight: 20,

    fontWeight: "700",
  },

  unreadName: {
    fontWeight: "800",
  },

  time: {
    color: "#94A3B8",

    fontSize: 11.5,

    lineHeight: 16,

    fontWeight: "500",
  },

  unreadTime: {
    color: COLORS.primary,

    fontWeight: "700",
  },

  // ===================================================
  // BOTTOM ROW
  // ===================================================

  bottomRow: {
    flexDirection: "row",

    alignItems: "center",

    minWidth: 0,
  },

  message: {
    flex: 1,

    minWidth: 0,

    color: "#64748B",

    fontSize: 13.5,

    lineHeight: 19,

    fontWeight: "400",

    marginRight: 8,
  },

  unreadMessage: {
    color: "#334155",

    fontWeight: "600",
  },

  // ===================================================
  // UNREAD BADGE
  // ===================================================

  badge: {
    minWidth: 22,

    height: 22,

    paddingHorizontal: 6,

    borderRadius: 11,

    backgroundColor: COLORS.primary,

    justifyContent: "center",

    alignItems: "center",

    shadowColor: COLORS.primary,

    shadowOffset: {
      width: 0,

      height: 2,
    },

    shadowOpacity: 0.18,

    shadowRadius: 4,

    elevation: 2,
  },

  badgeText: {
    color: "#FFFFFF",

    fontSize: 10.5,

    lineHeight: 14,

    fontWeight: "800",

    textAlign: "center",
  },
});