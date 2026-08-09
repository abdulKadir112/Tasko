import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme";

type Props = {
  name: string;
  city: string;
  rating: number;
  experience: string;
  price: number;
  completedJobs: number;
  onPress: () => void;
};

export default function WorkerCard({
  name,
  city,
  rating,
  experience,
  price,
  completedJobs,
  onPress,
}: Props) {
  return (
    <View style={styles.card}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>👨‍🔧</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>

        <View style={styles.row}>
          <Ionicons
            name="location"
            size={15}
            color={COLORS.primary}
          />
          <Text style={styles.text}>{city}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons
            name="star"
            size={15}
            color="#F59E0B"
          />
          <Text style={styles.text}>{rating}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.text}>{completedJobs} Jobs</Text>
        </View>

        <View style={styles.row}>
          <Ionicons
            name="briefcase"
            size={15}
            color={COLORS.primary}
          />
          <Text style={styles.text}>{experience}</Text>
        </View>

        <Text style={styles.price}>Starting ৳{price}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={onPress}
        >
          <Text style={styles.buttonText}>View Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 42,
  },

  info: {
    flex: 1,
    marginLeft: 16,
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  text: {
    marginLeft: 5,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  dot: {
    marginHorizontal: 6,
    color: COLORS.textSecondary,
  },

  price: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },

  button: {
    marginTop: 15,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});