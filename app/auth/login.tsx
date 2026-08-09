import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Alert,
  TouchableOpacity,
} from "react-native";

import { Link, router } from "expo-router";

import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import { auth, db } from "@/config/firebase";
import { COLORS } from "@/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedEmail();
  }, []);

  async function loadSavedEmail() {
    try {
      const savedEmail = await AsyncStorage.getItem("email");

      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert(
        "Error",
        "Please enter email and password"
      );
      return;
    }

    try {
      setLoading(true);

      const credential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      // Firebase ID Token
      const idToken =
        await credential.user.getIdToken(true);

      // Save locally
      await AsyncStorage.multiSet([
        ["email", email.trim()],
        ["token", idToken],
        ["uid", credential.user.uid],
      ]);

      const snapshot = await getDoc(
        doc(db, "users", credential.user.uid)
      );

      if (!snapshot.exists()) {
        Alert.alert(
          "Error",
          "User profile not found."
        );
        return;
      }

      const user = snapshot.data();

      await AsyncStorage.setItem(
        "role",
        user.role
      );

      if (user.role === "customer") {
        router.replace("/customer/(tabs)/home");
      } else {
        router.replace("/worker/(tabs)/home");
      }
    } catch (error: any) {
      console.log(error);

      Alert.alert(
        "Login Failed",
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>
          Welcome Back 👋
        </Text>

        <Text style={styles.subtitle}>
          Login to your account
        </Text>
      </View>

      <Input
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title="Login"
        loading={loading}
        onPress={handleLogin}
      />

      <Link href="/auth/register" asChild>
        <TouchableOpacity>
          <Text style={styles.bottom}>
            Don't have an account?
            <Text style={styles.signup}>
              {" "}Sign Up
            </Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 25,
    justifyContent: "center",
  },

  top: {
    marginBottom: 35,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.text,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 17,
    color: COLORS.textSecondary,
  },

  bottom: {
    marginTop: 25,
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 15,
  },

  signup: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});