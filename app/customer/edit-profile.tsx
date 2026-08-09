import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";

import { router } from "expo-router";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/config/firebase";
import { COLORS } from "@/theme";

export default function EditProfileScreen() {
  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [photoURL, setPhotoURL] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const uid = auth.currentUser?.uid;

      if (!uid) return;

      const snapshot = await getDoc(
        doc(db, "users", uid)
      );

      if (snapshot.exists()) {
        const data: any = snapshot.data();

        setName(data.name || "");
        setPhone(data.phone || "");
        setPhotoURL(data.photoURL || "");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const uid = auth.currentUser?.uid;

      if (!uid) return;

      setSaving(true);

      await updateDoc(
        doc(db, "users", uid),
        {
          name,
          phone,
          photoURL,
        }
      );

      Alert.alert(
        "Success",
        "Profile Updated Successfully"
      );

      router.back();
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Edit Profile
      </Text>

      <Text style={styles.label}>
        Full Name
      </Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
      />

      <Text style={styles.label}>
        Phone Number
      </Text>

      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="01XXXXXXXXX"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>
        Profile Photo URL
      </Text>

      <TextInput
        style={styles.input}
        value={photoURL}
        onChangeText={setPhotoURL}
        placeholder="https://..."
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving
            ? "Saving..."
            : "Save Changes"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancel}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelText}>
          Cancel
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 30,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 10,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 18,
  },

  button: {
    marginTop: 15,
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },

  cancel: {
    marginTop: 18,
    alignItems: "center",
  },

  cancelText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
});