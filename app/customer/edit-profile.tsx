import { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { COLORS } from "@/theme";
import {
  getMyProfile,
  updateMyProfile,
} from "@/services/user.service";
import { uploadImage } from "@/services/upload.service";
import ProfileImagePicker from "@/components/profile/ImagePicker";

export default function CustomerEditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await getMyProfile();
      const user = res.data;

      setName(user?.name || "");
      setPhone(user?.phone || "");
      setCity(user?.city || "");
      setAddress(user?.address || "");
      setPhotoURL(user?.photoURL || "");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  function isLocalImage(uri: string) {
    if (!uri) return false;

    return (
      uri.startsWith("file://") ||
      uri.startsWith("content://") ||
      uri.startsWith("ph://") ||
      uri.startsWith("/")
    );
  }

  async function handleSave() {
    try {
      if (!name.trim()) {
        Alert.alert("Required Field", "Please enter your name");
        return;
      }

      setSaving(true);

      let finalPhotoURL = photoURL;

      // Local image হলে আগে upload করো
      if (photoURL && isLocalImage(photoURL)) {
        console.log("📤 Uploading profile image...");

        finalPhotoURL = await uploadImage(photoURL);

        console.log("✅ Uploaded URL:", finalPhotoURL);

        // UI-তেও remote URL set করো
        setPhotoURL(finalPhotoURL);
      }

      await updateMyProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
        photoURL: finalPhotoURL || null,
      });

      Alert.alert("Success", "Profile updated successfully");
      router.back();
    } catch (error) {
      console.log("❌ Profile update error:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Edit Customer Profile</Text>

        <ProfileImagePicker image={photoURL} onChange={setPhotoURL} />

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          placeholder="Enter your name"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={name}
          onChangeText={setName}
          editable={!saving}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          placeholder="01XXXXXXXXX"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          editable={!saving}
        />

        <Text style={styles.label}>City</Text>
        <TextInput
          placeholder="e.g. Dhaka, Chittagong"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={city}
          onChangeText={setCity}
          editable={!saving}
        />

        <Text style={styles.label}>Full Address</Text>
        <TextInput
          placeholder="Enter your detailed address"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.multilineInput]}
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
          editable={!saving}
        />

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || "#fff",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background || "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text || "#111827",
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: COLORS.text || "#374151",
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border || "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: "#fff",
    color: COLORS.text || "#111827",
  },
  multilineInput: {
    height: 90,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 15,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
});