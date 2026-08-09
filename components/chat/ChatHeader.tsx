import React from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

import { COLORS } from "@/theme";

type Props = {
  name: string;
  photoURL?: string;
  online?: boolean;
  lastSeen?: string;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
};

export default function ChatHeader({
  name,
  photoURL,
  online = false,
  lastSeen,
  onAudioCall,
  onVideoCall,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Left */}

      <View style={styles.left}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.profile}>
          {photoURL ? (
            <Image
              source={{
                uri: photoURL,
              }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons
                name="person"
                size={22}
                color="#fff"
              />
            </View>
          )}

          <View style={styles.info}>
            <Text
              numberOfLines={1}
              style={styles.name}
            >
              {name}
            </Text>

            <Text style={styles.status}>
              {online
                ? "Online"
                : lastSeen || "Offline"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Right */}

      <View style={styles.right}>
        <TouchableOpacity
          onPress={onAudioCall}
        >
          <Ionicons
            name="call-outline"
            size={23}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.icon}
          onPress={onVideoCall}
        >
          <Ionicons
            name="videocam-outline"
            size={25}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.icon}>
          <Ionicons
            name="ellipsis-vertical"
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    backgroundColor: COLORS.primary,

    paddingTop: 40,
    paddingHorizontal: 12,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    elevation: 3,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",

    flex: 1,
  },

  profile: {
    marginLeft: 12,

    flexDirection: "row",
    alignItems: "center",

    flex: 1,
  },

  avatar: {
    width: 44,
    height: 44,

    borderRadius: 22,
  },

  placeholder: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: "#ffffff30",

    justifyContent: "center",
    alignItems: "center",
  },

  info: {
    marginLeft: 12,

    flex: 1,
  },

  name: {
    color: "#fff",

    fontWeight: "700",

    fontSize: 17,
  },

  status: {
    color: "#E5E7EB",

    marginTop: 2,

    fontSize: 12,
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
  },

  icon: {
    marginLeft: 18,
  },
});