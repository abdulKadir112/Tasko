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
      activeOpacity={0.8}
      onPress={() => onPress(id)}
    >
      <View style={styles.iconBox}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      <Text numberOfLines={2} style={styles.title}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "23%",
    alignItems: "center",
    marginBottom: 22,
  },

  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,

    elevation: 5,
  },

  emoji: {
    fontSize: 34,
  },

  title: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
});