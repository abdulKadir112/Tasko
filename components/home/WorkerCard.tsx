import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme";

type Props = {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  experience: string;
  image?: string;
  onPress: (id: string) => void;
};

export default function WorkerCard({
  id,
  name,
  category,
  city,
  rating,
  experience,
  image,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress(id)}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarEmoji}>
            👨‍🔧
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <Text
          style={styles.name}
          numberOfLines={1}
        >
          {name}
        </Text>

        <Text style={styles.category}>
          {category}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color="#6B7280"
          />
          <Text style={styles.infoText}>
            {city}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="briefcase-outline"
            size={14}
            color="#6B7280"
          />
          <Text style={styles.infoText}>
            {experience}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={styles.ratingBox}>
          <Ionicons
            name="star"
            size={14}
            color="#F59E0B"
          />
          <Text style={styles.rating}>
            {rating}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => onPress(id)}
        >
          <Text style={styles.buttonText}>
            View
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarEmoji: {
    fontSize: 34,
  },

  content: {
    flex: 1,
    marginLeft: 14,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  category: {
    marginTop: 4,
    color: COLORS.primary,
    fontWeight: "600",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  infoText: {
    marginLeft: 5,
    color: "#6B7280",
    fontSize: 13,
  },

  right: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 70,
  },

  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  rating: {
    marginLeft: 4,
    fontWeight: "700",
  },

  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});