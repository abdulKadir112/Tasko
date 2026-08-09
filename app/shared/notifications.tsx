import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { COLORS } from "@/theme";

const notifications = [
  {
    id: "1",
    title: "New Bid Received",
    message: "Rahim submitted a bid on your job.",
    time: "2 min ago",
    icon: "hammer-outline",
    color: "#3B82F6",
  },
  {
    id: "2",
    title: "Job Accepted",
    message: "Your bid has been accepted.",
    time: "10 min ago",
    icon: "checkmark-circle-outline",
    color: "#10B981",
  },
  {
    id: "3",
    title: "Payment Completed",
    message: "Customer completed the payment.",
    time: "1 hour ago",
    icon: "wallet-outline",
    color: "#F59E0B",
  },
  {
    id: "4",
    title: "New Message",
    message: "You received a new chat message.",
    time: "Yesterday",
    icon: "chatbubble-outline",
    color: "#8B5CF6",
  },
];

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Notifications
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: item.color,
                },
              ]}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color="#fff"
              />
            </View>

            <View style={styles.content}>
              <Text style={styles.title}>
                {item.title}
              </Text>

              <Text style={styles.message}>
                {item.message}
              </Text>

              <Text style={styles.time}>
                {item.time}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 55,
    marginBottom: 25,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    flex: 1,
    marginLeft: 15,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  message: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  time: {
    marginTop: 8,
    fontSize: 12,
    color: "#94A3B8",
  },
});