import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme";

export default function HomeBanner() {
  return (
    <View style={styles.banner}>
      {/* Left */}

      <View style={styles.left}>
        <View style={styles.badge}>
          <Ionicons
            name="shield-checkmark"
            size={16}
            color="#fff"
          />

          <Text style={styles.badgeText}>
            Verified Professionals
          </Text>
        </View>

        <Text style={styles.title}>
          Find Skilled{"\n"}
          Workers Near You
        </Text>

        <Text style={styles.subtitle}>
          Electrician • Plumber • Painter •
          Mechanic • AC Repair • Cleaning
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              500+
            </Text>

            <Text style={styles.statText}>
              Workers
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              4.9★
            </Text>

            <Text style={styles.statText}>
              Rating
            </Text>
          </View>
        </View>
      </View>

      {/* Right */}

      <View style={styles.right}>
        <View style={styles.workerCircle}>
          <Text style={styles.workerEmoji}>
            👨‍🔧
          </Text>
        </View>

        <View style={styles.onlineBadge}>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color="#22C55E"
          />

          <Text style={styles.onlineText}>
            Online
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: 20,

    backgroundColor: COLORS.primary,

    borderRadius: 24,

    padding: 22,

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",
  },

  left: {
    flex: 1,

    paddingRight: 12,
  },

  badge: {
    flexDirection: "row",

    alignItems: "center",

    alignSelf: "flex-start",

    backgroundColor: "rgba(255,255,255,.18)",

    paddingHorizontal: 12,

    paddingVertical: 6,

    borderRadius: 20,
  },

  badgeText: {
    marginLeft: 6,

    color: "#fff",

    fontWeight: "600",

    fontSize: 12,
  },

  title: {
    marginTop: 18,

    fontSize: 26,

    fontWeight: "700",

    color: "#fff",
  },

  subtitle: {
    marginTop: 12,

    color: "#E8F0FE",

    lineHeight: 22,

    fontSize: 14,
  },

  statsRow: {
    marginTop: 20,

    flexDirection: "row",
  },

  statCard: {
    backgroundColor: "rgba(255,255,255,.15)",

    borderRadius: 14,

    paddingVertical: 10,

    paddingHorizontal: 16,

    marginRight: 10,

    alignItems: "center",
  },

  statNumber: {
    color: "#fff",

    fontWeight: "700",

    fontSize: 18,
  },

  statText: {
    marginTop: 3,

    color: "#E5E7EB",

    fontSize: 12,
  },

  right: {
    alignItems: "center",
  },

  workerCircle: {
    width: 95,

    height: 95,

    borderRadius: 48,

    backgroundColor: "rgba(255,255,255,.18)",

    justifyContent: "center",

    alignItems: "center",
  },

  workerEmoji: {
    fontSize: 50,
  },

  onlineBadge: {
    marginTop: 10,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#fff",

    borderRadius: 20,

    paddingHorizontal: 12,

    paddingVertical: 5,
  },

  onlineText: {
    marginLeft: 5,

    fontSize: 12,

    fontWeight: "700",

    color: "#22C55E",
  },
});