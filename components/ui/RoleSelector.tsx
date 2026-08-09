import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS } from "@/theme";

type Props = {
  value: "customer" | "worker";
  onChange: (role: "customer" | "worker") => void;
};

export default function RoleSelector({
  value,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          value === "customer" && styles.active,
        ]}
        onPress={() => onChange("customer")}
      >
        <Text
          style={[
            styles.text,
            value === "customer" && styles.activeText,
          ]}
        >
          👤 Customer
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          value === "worker" && styles.active,
        ]}
        onPress={() => onChange("worker")}
      >
        <Text
          style={[
            styles.text,
            value === "worker" && styles.activeText,
          ]}
        >
          👷 Worker
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },

  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  active: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  text: {
    color: COLORS.text,
    fontWeight: "600",
  },

  activeText: {
    color: "#fff",
  },
});