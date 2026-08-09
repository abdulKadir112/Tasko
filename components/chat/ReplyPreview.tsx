import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme";

type Props = {
  replyMessage: any;
  onClose: () => void;
};

export default function ReplyPreview({ replyMessage, onClose }: Props) {
  if (!replyMessage) return null;

  const previewText =
    replyMessage.message ||
    (replyMessage.type === "image"
      ? "📷 Photo"
      : replyMessage.type === "voice"
        ? "🎤 Voice Message"
        : "");

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 14,
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <View
        style={{
          flex: 1,
          borderLeftWidth: 4,
          borderLeftColor: COLORS.primary,
          paddingLeft: 10,
        }}
      >
        <Text
          style={{
            color: COLORS.primary,
            fontWeight: "700",
            marginBottom: 3,
          }}
        >
          Reply
        </Text>

        <Text numberOfLines={1} style={{ color: "#444" }}>
          {previewText}
        </Text>
      </View>

      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={22} color="#666" />
      </TouchableOpacity>
    </View>
  );
}