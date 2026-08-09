import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/config/firebase";
import { COLORS } from "@/theme";

export default function SplashScreen() {
  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const user = auth.currentUser;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);

      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        router.replace("/auth/login");
        return;
      }

      const data = userSnap.data();

      if (data.role === "customer") {
        router.replace("/customer/(tabs)/home");
      } else if (data.role === "worker") {
        router.replace("/worker/(tabs)/home");
      } else {
        router.replace("/auth/login");
      }
    } catch (error) {
      console.log(error);
      router.replace("/auth/login");
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logo}>🛠️</Text>
      </View>

      <Text style={styles.title}>
        Hyperlocal Service
      </Text>

      <Text style={styles.subtitle}>
        Find Trusted Workers Near You
      </Text>

      <ActivityIndicator
        size="large"
        color="#fff"
        style={{ marginTop: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    fontSize: 60,
  },

  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 30,
  },

  subtitle: {
    color: "#E5E7EB",
    fontSize: 16,
    marginTop: 10,
  },
});