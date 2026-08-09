import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { useEffect, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";

import { doc, getDoc } from "firebase/firestore";

import Button from "@/components/ui/Button";
import { useAuthContext } from "@/context/AuthContext";
import { auth, db } from "@/config/firebase";
import { COLORS } from "@/theme";

export default function CustomerProfile() {
  const { user, logout } = useAuthContext();

  const [profile, setProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    try {
      const uid = auth.currentUser?.uid;

      if (!uid) return;

      const snap = await getDoc(doc(db, "users", uid));

      if (snap.exists()) {
        setProfile(snap.data());
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();

            router.replace("/auth/login");
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Image
          source={{
            uri:
              profile?.photoURL ||
              "https://ui-avatars.com/api/?name=User&background=2563EB&color=fff",
          }}
          style={styles.avatar}
        />

        <Text style={styles.name}>
          {profile?.name || "Customer"}
        </Text>

        <Text style={styles.email}>
          {profile?.email || user?.email}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.item}>
          <Ionicons
            name="mail"
            size={22}
            color={COLORS.primary}
          />

          <View style={styles.info}>
            <Text style={styles.label}>
              Email
            </Text>

            <Text style={styles.value}>
              {profile?.email}
            </Text>
          </View>
        </View>

        <View style={styles.item}>
          <Ionicons
            name="call"
            size={22}
            color={COLORS.primary}
          />

          <View style={styles.info}>
            <Text style={styles.label}>
              Phone
            </Text>

            <Text style={styles.value}>
              {profile?.phone || "Not Added"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.item,
            {
              marginBottom: 0,
            },
          ]}
        >
          <Ionicons
            name="key"
            size={22}
            color={COLORS.primary}
          />

          <View style={styles.info}>
            <Text style={styles.label}>
              User ID
            </Text>

            <Text
              style={styles.value}
              numberOfLines={1}
            >
              {user?.uid}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.editBtn}
        onPress={() =>
          router.push("/customer/edit-profile")
        }
      >
        <Ionicons
          name="create-outline"
          color="#fff"
          size={22}
        />

        <Text style={styles.editText}>
          Edit Profile
        </Text>
      </TouchableOpacity>

      <View
        style={{
          marginTop: 20,
        }}
      >
        <Button
          title="Logout"
          onPress={handleLogout}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E5E7EB",
  },

  name: {
    marginTop: 20,
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
  },

  email: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 25,
    elevation: 4,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  info: {
    marginLeft: 15,
    flex: 1,
  },

  label: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  value: {
    marginTop: 3,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },

  editBtn: {
    backgroundColor: COLORS.primary,
    height: 55,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  editText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
    marginLeft: 8,
  },
});