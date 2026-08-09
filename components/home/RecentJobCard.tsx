import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";

import { COLORS } from "@/theme";

type Props = {
  id: string;
  title: string;
  category: string;
  budget: number;
  city: string;
  image?: string;
  onPress: (id: string) => void;
};

export default function RecentJobCard({
  id,
  title,
  category,
  budget,
  city,
  image,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(id)}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={styles.image}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={{ fontSize: 36 }}>
            🛠
          </Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {title}
        </Text>

        <Text style={styles.category}>
          {category}
        </Text>

        <Text style={styles.city}>
          📍 {city}
        </Text>

        <Text style={styles.price}>
          Budget ৳{budget}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
  },

  image: {
    width: "100%",
    height: 170,
  },

  placeholder: {
    width: "100%",
    height: 170,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF4FF",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    margin: 12,
    marginBottom: 4,
  },

  category: {
    color: COLORS.primary,
    marginHorizontal: 12,
  },

  city: {
    marginHorizontal: 12,
    marginTop: 5,
    color: "#6B7280",
  },

  price: {
    margin: 12,
    fontWeight: "700",
    color: "#FF6B00",
  },
});