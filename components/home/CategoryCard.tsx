import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { COLORS } from "@/theme";

type Props = {
  id: string;
  emoji: string;
  title: string;
  onPress: (id: string) => void;
};

export default function CategoryCard({
  id,
  emoji,
  title,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={() => onPress(id)}
    >
      <View style={styles.iconBox}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    alignItems: "center",
    marginRight: 12,
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
    justifyContent: "center",
    alignItems: "center",
    // Clean & Subtle Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  emoji: {
    fontSize: 20,
  },

  title: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.text,
    letterSpacing: -0.2,
  },
});