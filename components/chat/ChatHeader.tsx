import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { COLORS } from "@/theme";

type Props = {
  name?: string | null;
  photoURL?: string | null;
  online?: boolean;
  lastSeen?: string;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
};

export default function ChatHeader({
  name,
  photoURL,
  online = false,
  lastSeen,
  onAudioCall,
  onVideoCall,
}: Props) {
  /*
   * PROFILE NAME
   *
   * কখনো Loading দেখাবে না।
   * Name না থাকলে সরাসরি Unknown User।
   */
  const displayName =
    typeof name === "string" && name.trim().length > 0
      ? name.trim()
      : "Unknown User";

  /*
   * PROFILE PHOTO
   *
   * Photo না থাকলে placeholder দেখাবে।
   * কোনো loading indicator নেই।
   */
  const displayPhoto =
    typeof photoURL === "string" && photoURL.trim().length > 0
      ? photoURL.trim()
      : null;

  /*
   * STATUS
   */
  const displayStatus =
    online === true
      ? "Online"
      : typeof lastSeen === "string" && lastSeen.trim().length > 0
        ? lastSeen.trim()
        : "Offline";

  return (
    <View style={styles.container}>
      {/* =========================
          LEFT
      ========================= */}

      <View style={styles.left}>
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Profile */}
        <View style={styles.profile}>
          {displayPhoto ? (
            <Image
              source={{ uri: displayPhoto }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons
                name="person"
                size={22}
                color="#fff"
              />
            </View>
          )}

          <View style={styles.info}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.name}
            >
              {displayName}
            </Text>

            <Text style={styles.status}>
              {displayStatus}
            </Text>
          </View>
        </View>
      </View>

      {/* =========================
          RIGHT
      ========================= */}

      <View style={styles.right}>
        {/* Audio Call */}
        <TouchableOpacity
          onPress={onAudioCall}
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="call-outline"
            size={23}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Video Call */}
        <TouchableOpacity
          onPress={onVideoCall}
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="videocam-outline"
            size={25}
            color="#fff"
          />
        </TouchableOpacity>

        {/* More */}
        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    backgroundColor: COLORS.primary,

    paddingTop: 40,
    paddingHorizontal: 12,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    elevation: 3,

    shadowOpacity: 0.15,
    shadowRadius: 4,

    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  left: {
    flexDirection: "row",
    alignItems: "center",

    flex: 1,
    minWidth: 0,
  },

  backButton: {
    width: 38,
    height: 44,

    justifyContent: "center",
    alignItems: "center",
  },

  profile: {
    marginLeft: 6,

    flexDirection: "row",
    alignItems: "center",

    flex: 1,
    minWidth: 0,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,

    backgroundColor: "#ffffff30",
  },

  placeholder: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: "#ffffff30",

    justifyContent: "center",
    alignItems: "center",
  },

  info: {
    marginLeft: 10,

    flex: 1,
    minWidth: 0,
  },

  name: {
    color: "#fff",

    fontWeight: "700",
    fontSize: 17,
  },

  status: {
    color: "#E5E7EB",

    marginTop: 2,

    fontSize: 12,
  },

  right: {
    flexDirection: "row",
    alignItems: "center",

    marginLeft: 8,
  },

  actionButton: {
    width: 38,
    height: 44,

    justifyContent: "center",
    alignItems: "center",

    marginLeft: 4,
  },
});