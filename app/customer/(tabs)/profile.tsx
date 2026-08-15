import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { doc, getDoc } from "firebase/firestore";

import { useAuthContext } from "@/context/AuthContext";
import { auth, db } from "@/config/firebase";
import { COLORS } from "@/theme";

type MenuItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  color?: string;
  danger?: boolean;
  onPress: () => void;
};

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
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  }

  const displayName = profile?.name || "Customer";
  const displayEmail = profile?.email || user?.email || "";
  const displayPhone = profile?.phone || "Not added";
  const displayCity = profile?.city || "Not added";
  const displayAddress = profile?.address || "Not added";

  const avatarUri =
    typeof profile?.photoURL === "string" &&
    profile.photoURL.trim().length > 0
      ? profile.photoURL.trim()
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          displayName
        )}&background=2563EB&color=fff&size=256`;

  const accountMenu: MenuItem[] = [
    {
      id: "edit",
      icon: "person-outline",
      title: "Edit Profile",
      subtitle: "Name, photo, phone, address",
      onPress: () => router.push("/customer/edit-profile"),
    },
    {
      id: "security",
      icon: "shield-checkmark-outline",
      title: "Account & Security",
      subtitle: "Password, privacy settings",
      onPress: () =>
        Alert.alert("Coming Soon", "Security settings will be available soon."),
    },
  ];

  const activityMenu: MenuItem[] = [
    {
      id: "jobs",
      icon: "briefcase-outline",
      title: "My Jobs",
      subtitle: "Posted & ongoing tasks",
      onPress: () => router.push("/customer/jobs"),
    },
    {
      id: "chats",
      icon: "chatbubbles-outline",
      title: "Messages",
      subtitle: "Chat with workers",
      onPress: () => router.push("/shared/chat"),
    },
    {
      id: "payments",
      icon: "wallet-outline",
      title: "Payments",
      subtitle: "Billing & transaction history",
      onPress: () =>
        Alert.alert("Coming Soon", "Payments section will be available soon."),
    },
    {
      id: "favorites",
      icon: "heart-outline",
      title: "Saved Workers",
      subtitle: "Your favorite professionals",
      onPress: () =>
        Alert.alert("Coming Soon", "Favorites will be available soon."),
    },
  ];

  const supportMenu: MenuItem[] = [
    {
      id: "help",
      icon: "help-circle-outline",
      title: "Help & Support",
      subtitle: "FAQs, contact support",
      onPress: () =>
        Alert.alert("Support", "Email us at support@tasko.app"),
    },
    {
      id: "about",
      icon: "information-circle-outline",
      title: "About Tasko",
      subtitle: "App version & info",
      onPress: () =>
        Alert.alert("Tasko", "Version 1.0.0\nYour trusted task marketplace."),
    },
  ];

  const dangerMenu: MenuItem[] = [
    {
      id: "logout",
      icon: "log-out-outline",
      title: "Logout",
      subtitle: "Sign out from this device",
      danger: true,
      color: "#EF4444",
      onPress: handleLogout,
    },
  ];

  function renderMenuSection(title: string, items: MenuItem[]) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>

        <View style={styles.menuCard}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === items.length - 1 && styles.menuItemLast,
              ]}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View
                style={[
                  styles.menuIconBox,
                  item.danger && styles.menuIconBoxDanger,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.color || COLORS.primary}
                />
              </View>

              <View style={styles.menuTextBox}>
                <Text
                  style={[
                    styles.menuTitle,
                    item.danger && styles.menuTitleDanger,
                  ]}
                >
                  {item.title}
                </Text>
                {!!item.subtitle && (
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                )}
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={item.danger ? "#FCA5A5" : "#CBD5E1"}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerLabel}>My Profile</Text>

            <TouchableOpacity
              style={styles.headerEditBtn}
              onPress={() => router.push("/customer/edit-profile")}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {displayEmail}
              </Text>

              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                <Text style={styles.badgeText}>Verified Customer</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================= STATS ================= */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Jobs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* ================= INFO ================= */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Info</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={COLORS.primary} />
              <View style={styles.infoTextBox}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{displayPhone}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color={COLORS.primary}
              />
              <View style={styles.infoTextBox}>
                <Text style={styles.infoLabel}>City</Text>
                <Text style={styles.infoValue}>{displayCity}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Ionicons name="home-outline" size={18} color={COLORS.primary} />
              <View style={styles.infoTextBox}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{displayAddress}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================= MENUS ================= */}
        {renderMenuSection("Account", accountMenu)}
        {renderMenuSection("Activity", activityMenu)}
        {renderMenuSection("Support", supportMenu)}
        {renderMenuSection("Session", dangerMenu)}

        <Text style={styles.versionText}>Tasko • v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },

  scrollContent: {
    paddingBottom: 40,
  },

  /* Header */
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  headerLabel: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },

  headerEditBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrap: {
    position: "relative",
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "#DBEAFE",
  },

  onlineDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },

  email: {
    marginTop: 4,
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
  },

  badge: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  /* Stats */
  statsCard: {
    marginTop: -18,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text || "#0F172A",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },

  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E2E8F0",
  },

  /* Sections */
  section: {
    marginTop: 22,
    paddingHorizontal: 20,
  },

  sectionTitle: {
    marginBottom: 10,
    marginLeft: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  infoTextBox: {
    marginLeft: 12,
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },

  infoValue: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text || "#0F172A",
  },

  infoDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },

  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  menuItemLast: {
    borderBottomWidth: 0,
  },

  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  menuIconBoxDanger: {
    backgroundColor: "#FEF2F2",
  },

  menuTextBox: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text || "#0F172A",
  },

  menuTitleDanger: {
    color: "#EF4444",
  },

  menuSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },

  versionText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
});