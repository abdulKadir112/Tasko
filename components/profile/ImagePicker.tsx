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

export default function ProfileImagePicker({
  image,
  onChange,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) return;

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (!result.canceled) {
        setLoading(true);

        const imageUrl = await uploadImage(
          result.assets[0].uri
        );

        onChange(imageUrl); // ✅ uploaded URL only
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        <Image
          source={{
            uri: image || "https://i.pravatar.cc/300",
          }}
          style={styles.avatar}
        />

        <View style={styles.camera}>
          <Ionicons name="camera" size={18} color="#fff" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={pickImage}>
        <Text style={styles.text}>Change Photo</Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator
          style={{ marginTop: 10 }}
          color={COLORS.primary}
        />
      )}
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