import React from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/theme";

export default function HomeBanner() {
  return (
    <LinearGradient
      colors={[COLORS.primary || "#1E40AF", "#1E3A8A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      {/* Left Section */}
      <View style={styles.left}>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={14} color="#60A5FA" />
          <Text style={styles.badgeText}>Verified Professionals</Text>
        </View>

        <Text style={styles.title}>
          Find Skilled{"\n"}Workers Near You
        </Text>

        <Text style={styles.subtitle} numberOfLines={1}>
          Electrician • Plumber • Painter • AC Repair
        </Text>

        {/* Stats Section */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>500+</Text>
            <Text style={styles.statLabel}>Workers</Text>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.statItem}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text style={styles.statNumber}> 4.9</Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Right Section */}
      <View style={styles.right}>
        <View style={styles.avatarContainer}>
          {/* ইমোজির পরিবর্তে একটি হাই-কোয়ালিটি প্রোফাইল বা সার্ভিস ইমেজ ব্যবহার করুন */}
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=300&auto=format&fit=crop",
            }}
            style={styles.workerImage}
          />
          <View style={styles.onlineStatusDot} />
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Book Now</Text>
          <Ionicons name="arrow-forward" size={12} color="#1E3A8A" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 6,
  },

  left: {
    flex: 1,
    paddingRight: 10,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },

  badgeText: {
    marginLeft: 6,
    color: "#E0E7FF",
    fontWeight: "600",
    fontSize: 11,
  },

  title: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 28,
  },

  subtitle: {
    marginTop: 6,
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "500",
  },

  statsRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  statItem: {
    alignItems: "center",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statNumber: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  statLabel: {
    color: "#C7D2FE",
    fontSize: 10,
    marginTop: 1,
  },

  divider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 12,
  },

  right: {
    alignItems: "center",
    justifyContent: "center",
  },

  avatarContainer: {
    position: "relative",
    padding: 3,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  workerImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  onlineStatusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#1E3A8A",
  },

  actionBtn: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  actionBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E3A8A",
  },
});