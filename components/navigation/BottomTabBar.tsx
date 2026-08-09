import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";

import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { COLORS } from "@/theme";

export default function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;

          const options = descriptors[route.key].options;

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          let icon: keyof typeof Ionicons.glyphMap = "ellipse";

          switch (route.name) {
            case "home":
              icon = focused ? "home" : "home-outline";
              break;

            case "jobs":
              icon = focused
                ? "briefcase"
                : "briefcase-outline";
              break;

            case "messages":
              icon = focused
                ? "chatbubble"
                : "chatbubble-outline";
              break;

            case "profile":
              icon = focused
                ? "person"
                : "person-outline";
              break;

            default:
              icon = "ellipse";
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(route.name)}
            >
              <Ionicons
                name={icon}
                size={24}
                color={
                  focused
                    ? COLORS.primary
                    : "#9CA3AF"
                }
              />

              <Text
                style={[
                  styles.label,
                  focused && {
                    color: COLORS.primary,
                  },
                ]}
              >
                {String(label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Floating Action Button */}

      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.fab}
        onPress={() =>
          router.push("/customer/post-job")
        }
      >
        <Ionicons
          name="add"
          size={32}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },

  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",

    height: 72,

    backgroundColor: "#fff",

    borderTopWidth: 0.5,
    borderColor: "#E5E7EB",

    elevation: 15,

    shadowColor: "#000",

    shadowOpacity: 0.08,

    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: -2,
    },

    paddingHorizontal: 15,
  },

  tab: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",
  },

  label: {
    marginTop: 3,

    fontSize: 11,

    color: "#9CA3AF",

    fontWeight: "600",
  },

  fab: {
    position: "absolute",

    alignSelf: "center",

    bottom: 28,

    width: 64,

    height: 64,

    borderRadius: 32,

    backgroundColor: "#FF6B00",

    justifyContent: "center",

    alignItems: "center",

    borderWidth: 5,

    borderColor: "#fff",

    elevation: 18,

    shadowColor: "#000",

    shadowOpacity: 0.25,

    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: 5,
    },
  },
});