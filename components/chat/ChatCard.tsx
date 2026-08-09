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
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View>
        {photoURL ? (
          <Image
            source={{ uri: photoURL }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatar}>
            <Ionicons
              name="person"
              color="#fff"
              size={28}
            />
          </View>
        )}

        {online && <View style={styles.online} />}
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <Text
            numberOfLines={1}
            style={styles.name}
          >
            {name}
          </Text>

          <Text style={styles.time}>
            {time}
          </Text>
        </View>

        <View style={styles.row}>
          <Text
            numberOfLines={1}
            style={styles.message}
          >
            {lastMessage}
          </Text>

          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  online: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },

  body: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },

  message: {
    flex: 1,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginRight: 8,
  },

  time: {
    color: "#94A3B8",
    fontSize: 12,
  },

  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
  },
});