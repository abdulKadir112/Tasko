import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme";

type ReplyMessage = {
  id?: string;
  message?: string;
  type?: string;
  senderName?: string;
  senderId?: string;
};

type Props = {
  replyMessage: ReplyMessage | null;
  onClose: () => void;
};

export default function ReplyPreview({
  replyMessage,
  onClose,
}: Props) {
  if (!replyMessage) {
    return null;
  }

  const previewText =
    replyMessage.message?.trim() ||
    (replyMessage.type === "image"
      ? "📷 Photo"
      : replyMessage.type === "voice"
        ? "🎤 Voice Message"
        : replyMessage.type === "video"
          ? "🎥 Video"
          : "Message");

  const senderName =
    replyMessage.senderName || "Replying to message";

  return (
    <View style={styles.container}>
      <View style={styles.replyIcon}>
        <Ionicons
          name="return-down-forward-outline"
          size={20}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.content}>
        <Text
          numberOfLines={1}
          style={styles.replyTitle}
        >
          {senderName}
        </Text>

        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.previewText}
        >
          {previewText}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.closeButton}
        activeOpacity={0.7}
        onPress={onClose}
      >
        <Ionicons
          name="close"
          size={20}
          color="#64748B"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",

    minHeight: 62,

    paddingHorizontal: 12,
    paddingVertical: 8,

    backgroundColor: "#FFFFFF",

    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  replyIcon: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: "#EFF6FF",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 10,
  },

  content: {
    flex: 1,

    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,

    paddingLeft: 10,

    justifyContent: "center",
  },

  replyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,

    marginBottom: 3,
  },

  previewText: {
    fontSize: 13,
    color: "#64748B",

    lineHeight: 18,
  },

  closeButton: {
    width: 36,
    height: 36,

    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",

    marginLeft: 8,
  },
});