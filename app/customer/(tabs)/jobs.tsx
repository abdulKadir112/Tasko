import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getMyCustomerJobs } from "@/services/job.service";
import { COLORS } from "@/theme";

function getStatusMeta(status?: string) {
  const value = String(status || "").toLowerCase();

  if (value === "pending" || value === "open") {
    return { bg: "#FEF3C7", text: "#D97706", label: status || "Pending" };
  }

  if (value === "accepted" || value === "in_progress" || value === "ongoing") {
    return { bg: "#DCFCE7", text: "#16A34A", label: status || "Accepted" };
  }

  if (value === "completed" || value === "done") {
    return { bg: "#DBEAFE", text: "#2563EB", label: status || "Completed" };
  }

  if (value === "cancelled" || value === "closed") {
    return { bg: "#FEE2E2", text: "#DC2626", label: status || "Cancelled" };
  }

  return { bg: "#F1F5F9", text: "#64748B", label: status || "Unknown" };
}

export default function JobsScreen() {
  const insets = useSafeAreaInsets();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await getMyCustomerJobs();
      setJobs(res.data || []);
    } catch (e) {
      console.log("ERROR =", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    await loadJobs(true);
  }

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((job) => {
    const status = String(job.status || "").toLowerCase();
    return (
      status === "pending" ||
      status === "open" ||
      status === "accepted" ||
      status === "in_progress" ||
      status === "ongoing"
    );
  }).length;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your jobs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={jobs}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 12) + 8,
          paddingHorizontal: 16,
          paddingBottom: 120 + insets.bottom,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.header}>My Jobs</Text>
                <Text style={styles.headerSub}>
                  Track and manage your posted work
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addBtn}
                activeOpacity={0.85}
                onPress={() => router.push("/customer/post-job")}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalJobs}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: "#16A34A" }]}>
                  {activeJobs}
                </Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: COLORS.primary }]}>
                  {Math.max(totalJobs - activeJobs, 0)}
                </Text>
                <Text style={styles.statLabel}>Closed</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="briefcase-outline" size={34} color="#94A3B8" />
            </View>

            <Text style={styles.emptyTitle}>No Jobs Yet</Text>
            <Text style={styles.emptyText}>
              Your posted jobs will appear here. Create your first job to get
              applicants.
            </Text>

            <TouchableOpacity
              style={styles.emptyBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/customer/post-job")}
            >
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={styles.emptyBtnText}>Post a Job</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const status = getStatusMeta(item.status);
          const imageUri =
            item.image ||
            item.imageUrl ||
            "https://picsum.photos/200/200";

          return (
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/customer/job-details",
                  params: { id: String(item.id) },
                })
              }
            >
              <Image source={{ uri: imageUri }} style={styles.image} />

              <View style={styles.right}>
                <View style={styles.row}>
                  <Text numberOfLines={1} style={styles.title}>
                    {item.title}
                  </Text>

                  <View
                    style={[styles.badge, { backgroundColor: status.bg }]}
                  >
                    <Text style={[styles.badgeText, { color: status.text }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>

                {!!item.category && (
                  <View style={styles.categoryRow}>
                    <Ionicons
                      name="grid-outline"
                      size={13}
                      color={COLORS.primary}
                    />
                    <Text style={styles.category} numberOfLines={1}>
                      {item.category}
                    </Text>
                  </View>
                )}

                <Text numberOfLines={2} style={styles.description}>
                  {item.description || "No description"}
                </Text>

                <View style={styles.bottom}>
                  <Text style={styles.price}>৳ {item.budget}</Text>

                  <View style={styles.cityRow}>
                    <Ionicons
                      name="location-outline"
                      size={13}
                      color="#94A3B8"
                    />
                    <Text style={styles.city} numberOfLines={1}>
                      {item.city || "N/A"}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={13} color="#64748B" />
                    <Text style={styles.metaText}>
                      {item.totalBids || 0} applicants
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#CBD5E1"
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    gap: 10,
  },

  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  headerBlock: {
    marginBottom: 16,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  header: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text || "#0F172A",
  },

  headerSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },

  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  image: {
    width: 96,
    height: 110,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },

  right: {
    flex: 1,
    marginLeft: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },

  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text || "#0F172A",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  categoryRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  category: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 12,
    flex: 1,
  },

  description: {
    marginTop: 6,
    color: "#64748B",
    lineHeight: 18,
    fontSize: 13,
  },

  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },

  price: {
    fontWeight: "800",
    color: "#16A34A",
    fontSize: 16,
  },

  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    maxWidth: "55%",
  },

  city: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },

  metaRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  empty: {
    marginTop: 60,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },

  emptyText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 21,
    fontSize: 14,
  },

  emptyBtn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  emptyBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});