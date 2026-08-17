import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/theme";
import { getMyProfile } from "@/services/user.service";
import { updateMyLocation } from "@/services/location.service";
import { useAuthContext } from "@/context/AuthContext";

type MenuItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  danger?: boolean;
  onPress: () => void;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuthContext();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingLocation, setUpdatingLocation] = useState(false);

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

  async function handleUpdateLocation() {
    try {
      setUpdatingLocation(true);
      const coords = await updateMyLocation();
      Alert.alert(
        "Location Updated",
        `Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}`
      );
      await loadProfile();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update location");
    } finally {
      setUpdatingLocation(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/auth/login");
          } catch (e) {
            console.log(e);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loader}>
        <Ionicons name="person-outline" size={42} color="#94A3B8" />
        <Text style={styles.loaderText}>No Profile Found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = user?.name || "Worker";
  const displayEmail = user?.email || "";
  const avatarUri =
    typeof user?.photoURL === "string" && user.photoURL.trim()
      ? user.photoURL.trim()
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          displayName
        )}&background=2563EB&color=fff&size=256`;

  const rating = Number(user?.rating ?? 5).toFixed(1);
  const completedJobs = user?.completedJobs ?? 0;
  const experience = user?.experience || "N/A";
  const skills: string[] = Array.isArray(user?.skills) ? user.skills : [];

  const hasLocation =
    typeof user?.lat === "number" && typeof user?.lng === "number";

  const accountMenu: MenuItem[] = [
    {
      id: "edit",
      icon: "create-outline",
      title: "Edit Profile",
      subtitle: "Photo, skills, service area",
      onPress: () => router.push("/worker/edit-profile"),
    },
    {
      id: "availability",
      icon: "time-outline",
      title: "Availability",
      subtitle: "Set your working hours",
      onPress: () =>
        Alert.alert("Coming Soon", "Availability settings will be added soon."),
    },
  ];

  const workMenu: MenuItem[] = [
    {
      id: "services",
      icon: "storefront-outline",
      title: "My Services",
      subtitle: "Published gigs & packages",
      onPress: () => router.push("/worker/my-services"),
    },
    {
      id: "location",
      icon: "locate-outline",
      title: updatingLocation ? "Updating..." : "Update Location",
      subtitle: hasLocation
        ? "Location shared with customers"
        : "Share GPS so customers see distance",
      onPress: () => {
        if (!updatingLocation) {
          handleUpdateLocation();
        }
      },
    },
    {
      id: "jobs",
      icon: "briefcase-outline",
      title: "My Jobs",
      subtitle: "Assigned & completed work",
      onPress: () => router.push("/worker/(tabs)/jobs"),
    },
    {
      id: "chats",
      icon: "chatbubbles-outline",
      title: "Messages",
      subtitle: "Chat with customers",
      onPress: () => router.push("/worker/(tabs)/messages"),
    },
    {
      id: "earnings",
      icon: "wallet-outline",
      title: "Earnings",
      subtitle: "Payment history & balance",
      onPress: () =>
        Alert.alert("Coming Soon", "Earnings section will be available soon."),
    },
    {
      id: "reviews",
      icon: "star-outline",
      title: "Reviews",
      subtitle: "Customer feedback",
      onPress: () =>
        Alert.alert("Coming Soon", "Reviews page will be available soon."),
    },
  ];

  const supportMenu: MenuItem[] = [
    {
      id: "help",
      icon: "help-circle-outline",
      title: "Help & Support",
      subtitle: "FAQs and contact support",
      onPress: () => Alert.alert("Support", "Email us at support@tasko.app"),
    },
    {
      id: "about",
      icon: "information-circle-outline",
      title: "About Tasko",
      subtitle: "App version & info",
      onPress: () =>
        Alert.alert(
          "Tasko Worker",
          "Version 1.0.0\nGrow your service business."
        ),
    },
  ];

  const dangerMenu: MenuItem[] = [
    {
      id: "logout",
      icon: "log-out-outline",
      title: "Logout",
      subtitle: "Sign out from this device",
      danger: true,
      onPress: handleLogout,
    },
  ];

  function renderMenu(title: string, items: MenuItem[]) {
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
              activeOpacity={0.75}
              onPress={item.onPress}
            >
              <View
                style={[styles.menuIcon, item.danger && styles.menuIconDanger]}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.danger ? "#EF4444" : COLORS.primary}
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
                  <Text style={styles.menuSub}>{item.subtitle}</Text>
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>Worker Profile</Text>

            <TouchableOpacity
              style={styles.heroEditBtn}
              onPress={() => router.push("/worker/edit-profile")}
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
                <Ionicons name="shield-checkmark" size={13} color="#22C55E" />
                <Text style={styles.badgeText}>Verified Worker</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedJobs}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{experience}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Info</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="call-outline"
              label="Phone"
              value={user?.phone || "Not added"}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="location-outline"
              label="City"
              value={user?.city || "Not added"}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="navigate-outline"
              label="GPS Location"
              value={
                hasLocation
                  ? `${Number(user.lat).toFixed(4)}, ${Number(user.lng).toFixed(4)}`
                  : "Not shared"
              }
            />
            <View style={styles.divider} />
            <InfoRow
              icon="briefcase-outline"
              label="Category"
              value={user?.category || "Not added"}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="cash-outline"
              label="Starting Price"
              value={user?.price != null ? `৳${user.price}` : "Not set"}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsCard}>
            {skills.length > 0 ? (
              <View style={styles.skillsWrap}>
                {skills.map((skill, index) => (
                  <View key={`${skill}-${index}`} style={styles.skillChip}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noSkills}>No skills added yet</Text>
            )}
          </View>
        </View>

        {!!user?.about && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.infoCard}>
              <Text style={styles.aboutText}>{user.about}</Text>
            </View>
          </View>
        )}

        {renderMenu("Account", accountMenu)}
        {renderMenu("Work", workMenu)}
        {renderMenu("Support", supportMenu)}
        {renderMenu("Session", dangerMenu)}

        <Text style={styles.versionText}>Tasko Worker • v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.infoTextBox}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
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
    gap: 10,
  },

  loaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  retryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },

  retryText: {
    color: "#fff",
    fontWeight: "700",
  },

  hero: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  heroLabel: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },

  heroEditBtn: {
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
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  statsCard: {
    marginTop: -18,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
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
    letterSpacing: 0.5,
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  infoTextBox: {
    marginLeft: 12,
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },

  infoValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },

  skillsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  skillChip: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  skillText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 12,
  },

  noSkills: {
    color: "#94A3B8",
    fontWeight: "600",
    fontSize: 13,
  },

  aboutText: {
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
  },

  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
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

  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  menuIconDanger: {
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
    color: "#0F172A",
  },

  menuTitleDanger: {
    color: "#EF4444",
  },

  menuSub: {
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