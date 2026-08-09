import { View, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme";

type Props = {
  uri: string;
  uploading: boolean;
  onSend: () => void;
};

export default function SelectedImagePreview({
  uri,
  uploading,
  onSend,
}: Props) {
  return (
    <View
      style={{
        padding: 10,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderColor: "#ddd",
      }}
    >
      <Image
        source={{ uri }}
        style={{
          width: 120,
          height: 120,
          borderRadius: 10,
        }}
      />

      <TouchableOpacity
        onPress={onSend}
        disabled={uploading}
        style={{
          marginTop: 10,
          backgroundColor: COLORS.primary,
          padding: 10,
          borderRadius: 8,
          alignItems: "center",
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <Ionicons name="send" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}