import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { COLORS } from "@/theme";
import { getMyProfile } from "@/services/user.service";

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    try {
      setLoading(true);
      const res = await getMyProfile();
      setUser(res.data);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loader}>
        <Text>No Profile Found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image
          source={{
            uri: user?.photoURL || "https://i.pravatar.cc/300",
          }}
          style={styles.avatar}
        />

        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.card}>
          <Item
            icon="call-outline"
            title="Phone"
            value={user?.phone || "Not Added"}
          />

          <Item
            icon="location-outline"
            title="City"
            value={user?.city || "Not Added"}
          />

          <Item
            icon="briefcase-outline"
            title="Category"
            value={user?.category || "Not Added"}
          />

          <Item
            icon="star-outline"
            title="Rating"
            value={String(user?.rating ?? 5)}
          />

          <Item
            icon="hammer-outline"
            title="Completed Jobs"
            value={String(user?.completedJobs ?? 0)}
          />

          <Item
            icon="construct-outline"
            title="Skills"
            value={user?.skills?.join(", ") || "No Skills"}
          />
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push("/worker/edit-profile")}
        >
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Item({
  icon,
  title,
  value,
}: {
  icon: any;
  title: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
        <Text style={styles.label}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginTop: 20,
  },

  name: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 15,
    color: COLORS.text,
  },

  email: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  label: {
    marginLeft: 10,
    fontWeight: "600",
    color: COLORS.text,
  },

  value: {
    color: COLORS.textSecondary,
    maxWidth: "45%",
    textAlign: "right",
  },

  editButton: {
    marginTop: 30,
    backgroundColor: COLORS.primary,
    height: 55,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  editText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
});