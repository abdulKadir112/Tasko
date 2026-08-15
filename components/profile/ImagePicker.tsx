import { useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme";
import { uploadImage } from "@/services/upload.service";

type Props = {
  image: string;
  onChange: (uri: string) => void;
};

function extractImageUrl(result: any): string {
  if (!result) return "";

  if (typeof result === "string") {
    return result.trim();
  }

  if (typeof result === "object") {
    const url =
      result.url ??
      result.secure_url ??
      result.imageUrl ??
      result.photoURL ??
      result.data?.url ??
      result.data?.secure_url ??
      result.data?.imageUrl ??
      "";

    return typeof url === "string" ? url.trim() : "";
  }

  return "";
}

export default function ProfileImagePicker({
  image,
  onChange,
}: Props) {
  const [loading, setLoading] = useState(false);

  const safeImage =
    typeof image === "string" && image.trim().length > 0
      ? image.trim()
      : "https://i.pravatar.cc/300";

  async function pickImage() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      setLoading(true);

      const pickedUri = result.assets[0].uri;

      console.log("🖼️ Picked URI:", pickedUri);

      const uploaded = await uploadImage(pickedUri);

      console.log("🖼️ Upload result:", uploaded);

      const imageUrl = extractImageUrl(uploaded);

      console.log("🖼️ Final image URL:", imageUrl);

      if (!imageUrl) {
        console.log("❌ No valid image URL from upload");
        return;
      }

      onChange(imageUrl);
    } catch (e) {
      console.log("❌ Profile image pick/upload error:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} disabled={loading}>
        <Image
          source={{
            uri: safeImage,
          }}
          style={styles.avatar}
        />

        <View style={styles.camera}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="camera" size={18} color="#fff" />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={pickImage} disabled={loading}>
        <Text style={styles.text}>
          {loading ? "Uploading..." : "Change Photo"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 25,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  camera: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  text: {
    marginTop: 12,
    color: COLORS.primary,
    fontWeight: "700",
  },
});