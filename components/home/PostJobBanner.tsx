import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/theme";

type Props = {
  onPress: () => void;
};

export default function PostJobBanner({
  onPress,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons
          name="briefcase"
          size={38}
          color="#fff"
        />
      </View>

      <Text style={styles.title}>
        Need Any Service?
      </Text>

      <Text style={styles.subtitle}>
        Describe your problem and get
        {"\n"}
        offers from verified workers.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
      >
        <Ionicons
          name="add-circle"
          size={22}
          color="#fff"
        />

        <Text style={styles.buttonText}>
          Post a Job
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,

    borderRadius: 22,

    padding: 22,

    backgroundColor: COLORS.primary,

    alignItems: "center",

    shadowColor: "#000",

    shadowOpacity: 0.15,

    shadowRadius: 10,

    elevation: 8,
  },

  iconBox: {
    width: 70,

    height: 70,

    borderRadius: 35,

    backgroundColor: "rgba(255,255,255,.18)",

    justifyContent: "center",

    alignItems: "center",
  },

  title: {
    marginTop: 18,

    fontSize: 24,

    fontWeight: "700",

    color: "#fff",
  },

  subtitle: {
    marginTop: 10,

    fontSize: 15,

    color: "#EEF4FF",

    textAlign: "center",

    lineHeight: 22,
  },

  button: {
    marginTop: 22,

    backgroundColor: "#FF6B00",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 24,

    height: 52,

    borderRadius: 14,
  },

  buttonText: {
    marginLeft: 8,

    color: "#fff",

    fontSize: 17,

    fontWeight: "700",
  },
});