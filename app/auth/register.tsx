import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Link, router } from "expo-router";

import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/config/firebase";
import { COLORS } from "@/theme";
import SkillSelector from "@/components/auth/SkillSelector";
import { registerSchema } from "@/validations/auth.validation";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"customer" | "worker">("customer");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    const result = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
      phone: "",
      role,
      city: "",
      category: "",
      skills,
    });

    if (!result.success) {
      Alert.alert(
        "Validation Error",
        result.error.issues[0].message
      );
      return;
    }

    try {
      setLoading(true);

      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        name: name.trim(),
        email: email.trim(),
        role,
        phone: "",
        photoURL: "",
        skills: role === "worker" ? skills : [],
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Account Created Successfully");

      if (role === "customer") {
        router.replace("/customer/home");
      } else {
        router.replace("/worker/home");
      }
    } catch (error: any) {
      Alert.alert("Register Failed", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register your account</Text>

        <TextInput
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          placeholder="Email Address"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
        />

        <Text style={styles.label}>Select Account Type</Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "customer" && styles.roleActive,
            ]}
            onPress={() => {
              setRole("customer");
              setSkills([]);
            }}
          >
            <Text
              style={[
                styles.roleText,
                role === "customer" && styles.roleTextActive,
              ]}
            >
              👤 Customer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleButton,
              role === "worker" && styles.roleActive,
            ]}
            onPress={() => setRole("worker")}
          >
            <Text
              style={[
                styles.roleText,
                role === "worker" && styles.roleTextActive,
              ]}
            >
              👷 Worker
            </Text>
          </TouchableOpacity>
        </View>

        {role === "worker" && (
          <>
            <Text style={styles.label}>Select Your Skills</Text>
            <SkillSelector value={skills} onChange={setSkills} />
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating..." : "Create Account"}
          </Text>
        </TouchableOpacity>

        <Link href="/auth/login" asChild>
          <TouchableOpacity>
            <Text style={styles.login}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 25,
    paddingVertical: 40,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 30,
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 10,
  },

  roleContainer: {
    flexDirection: "row",
    marginBottom: 22,
  },

  roleButton: {
    flex: 1,
    height: 55,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: "#fff",
  },

  roleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  roleText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },

  roleTextActive: {
    color: "#fff",
  },

  button: {
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  login: {
    marginTop: 25,
    textAlign: "center",
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 16,
  },
});