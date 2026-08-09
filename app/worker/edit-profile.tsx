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
import SkillSelector from "@/components/auth/SkillSelector";
import ProfileImagePicker from "@/components/profile/ImagePicker";

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
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
      setCategory(user?.category || "");
      setSkills(user?.skills || []);
      setPhotoURL(user?.photoURL || "");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      await updateMyProfile({
        name,
        phone,
        city,
        category,
        skills,
        photoURL,
      });

      Alert.alert("Success", "Profile updated successfully");
      router.back();
    } catch (error) {
      console.log(error);
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Edit Profile</Text>

        <ProfileImagePicker image={photoURL} onChange={setPhotoURL} />

        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          placeholder="Phone Number"
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <TextInput
          placeholder="City"
          style={styles.input}
          value={city}
          onChangeText={setCity}
        />

        <TextInput
          placeholder="Category"
          style={styles.input}
          value={category}
          onChangeText={setCategory}
        />

        <Text style={styles.label}>Skills</Text>

        <SkillSelector value={skills} onChange={setSkills} />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSave}
          disabled={saving}
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
    backgroundColor: COLORS.background,
    padding: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 30,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: COLORS.text,
  },
  button: {
    marginTop: 25,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
});