import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Button from "@/components/ui/Button";
import { COLORS } from "@/theme";

export default function ChooseRole() {
  const [role, setRole] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>

      <Text style={styles.subtitle}>
        Choose how you want to use the app
      </Text>

      <TouchableOpacity
        style={[
          styles.card,
          role === "customer" && styles.active,
        ]}
        onPress={() => setRole("customer")}
      >
        <Text style={styles.emoji}>👤</Text>

        <Text style={styles.cardTitle}>
          Customer
        </Text>

        <Text style={styles.desc}>
          Post jobs and hire trusted workers
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.card,
          role === "worker" && styles.active,
        ]}
        onPress={() => setRole("worker")}
      >
        <Text style={styles.emoji}>🛠️</Text>

        <Text style={styles.cardTitle}>
          Worker / Mistri
        </Text>

        <Text style={styles.desc}>
          Find nearby jobs and earn money
        </Text>
      </TouchableOpacity>

      <Button
        title="Continue"
        onPress={() => {}}
      />
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

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.dark,
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    marginTop: 8,
    color: "#777",
    marginBottom: 40,
    fontSize: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },

  active: {
    borderColor: COLORS.primary,
    backgroundColor: "#EEF4FF",
  },

  emoji: {
    fontSize: 42,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.dark,
  },

  desc: {
    marginTop: 8,
    color: "#666",
    fontSize: 15,
  },
});