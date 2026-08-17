import { useCallback, useState } from "react";
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
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getMyCustomerJobs } from "@/services/job.service";
import {
  getCustomerBookings,
  cancelBooking,
  confirmBooking,
  Booking,
} from "@/services/booking.service";
import { COLORS } from "@/theme";

type TabType = "jobs" | "bookings";

function getStatusMeta(status?: string) {
  const value = String(status || "").toLowerCase();

  if (value === "pending" || value === "open") {
    return { bg: "#FEF3C7", text: "#D97706", label: status || "Pending" };
  }

  if (
    value === "accepted" ||
    value === "in_progress" ||
    value === "ongoing" ||
    value === "confirmed"
  ) {
    return { bg: "#DCFCE7", text: "#16A34A", label: status || "Accepted" };
  }

  if (value === "reschedule_requested") {
    return { bg: "#EDE9FE", text: "#7C3AED", label: "Schedule Proposed" };
  }

  if (value === "completed" || value === "done") {
    return { bg: "#DBEAFE", text: "#2563EB", label: status || "Completed" };
  }

  if (value === "cancelled" || value === "closed" || value === "rejected") {
    return { bg: "#FEE2E2", text: "#DC2626", label: status || "Cancelled" };
  }

  return { bg: "#F1F5F9", text: "#64748B", label: status || "Unknown" };
}

function extractArray(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

export default function JobsScreen() {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>("jobs");

  const [jobs, setJobs] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [jobRes, bookingRes] = await Promise.all([
        getMyCustomerJobs(),
        getCustomerBookings(),
      ]);

      setJobs(extractArray(jobRes));
      setBookings(extractArray(bookingRes) as Booking[]);
    } catch (e) {
      console.log("CUSTOMER JOBS LOAD ERROR =", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    await loadData(true);
  }

  async function handleConfirmBooking(booking: Booking) {
    try {
      setActionLoading(true);

      const res = await confirmBooking(booking.id);

      if (!res.success) {
        Alert.alert("Error", res.message || "Failed to confirm");
        return;
      }

      setBookings((prev) =>
        prev.map((item) =>
          item.id === booking.id
            ? { ...item, status: "confirmed" }
            : item
        )
      );

      Alert.alert("Confirmed", "Schedule confirmed successfully.");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to confirm booking"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelBooking(booking: Booking) {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);

              const res = await cancelBooking(booking.id);

              if (!res.success) {
                Alert.alert("Error", res.message || "Failed to cancel");
                return;
              }

              setBookings((prev) =>
                prev.map((item) =>
                  item.id === booking.id
                    ? { ...item, status: "cancelled" }
                    : item
                )
              );
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.message || "Failed to cancel"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((job) => {
    const status = String(job.status || "").toLowerCase();
    return (
      status === "pending" ||
      status === "open" ||
      status === "accepted" ||
      status === "in_progress" ||
      status === "ongoing" ||
      status === "assigned"
    );
  }).length;

  const pendingBookings = bookings.filter(
    (b) => b.status === "pending" || b.status === "reschedule_requested"
  ).length;

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

      {/* HEADER */}
      <View
        style={[
          styles.headerBlock,
          { paddingTop: Math.max(insets.top, 12) + 8 },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.header}>My Jobs</Text>
            <Text style={styles.headerSub}>
              Track jobs and service bookings
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
            <Text style={styles.statLabel}>Jobs</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#16A34A" }]}>
              {activeJobs}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>
              {bookings.length}
            </Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
        </View>

        {/* TABS */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "jobs" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("jobs")}
          >
            <Ionicons
              name="briefcase-outline"
              size={18}
              color={
                activeTab === "jobs" ? COLORS.primary : "#64748B"
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "jobs" && styles.activeTabText,
              ]}
            >
              Posted Jobs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "bookings" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("bookings")}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={
                activeTab === "bookings" ? COLORS.primary : "#64748B"
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "bookings" && styles.activeTabText,
              ]}
            >
              Bookings
            </Text>

            {pendingBookings > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{pendingBookings}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* LIST */}
      {activeTab === "jobs" ? (
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
            paddingHorizontal: 16,
            paddingBottom: 120 + insets.bottom,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="briefcase-outline"
                  size={34}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.emptyTitle}>No Jobs Yet</Text>
              <Text style={styles.emptyText}>
                Your posted jobs will appear here. Create your first job
                to get applicants.
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
                      <Text
                        style={[styles.badgeText, { color: status.text }]}
                      >
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
                      <Ionicons
                        name="people-outline"
                        size={13}
                        color="#64748B"
                      />
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
      ) : (
        <FlatList
          data={bookings}
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
            paddingHorizontal: 16,
            paddingBottom: 120 + insets.bottom,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={34}
                  color="#94A3B8"
                />
              </View>
              <Text style={styles.emptyTitle}>No Bookings Yet</Text>
              <Text style={styles.emptyText}>
                When you book a worker service, it will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const status = getStatusMeta(item.status);

            return (
              <View style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.serviceIcon}>
                    <Ionicons
                      name="construct-outline"
                      size={22}
                      color={COLORS.primary}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.title} numberOfLines={2}>
                      {item.serviceTitle || "Service Booking"}
                    </Text>
                    <Text style={styles.category}>
                      {item.category || "Service"}
                    </Text>
                  </View>

                  <View
                    style={[styles.badge, { backgroundColor: status.bg }]}
                  >
                    <Text
                      style={[styles.badgeText, { color: status.text }]}
                    >
                      {status.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingPriceRow}>
                  <Text style={styles.price}>৳ {item.price || 0}</Text>
                  {item.urgency === "urgent" && (
                    <View style={styles.urgentBadge}>
                      <Ionicons name="flash" size={12} color="#DC2626" />
                      <Text style={styles.urgentText}>Urgent</Text>
                    </View>
                  )}
                </View>

                {!!item.address && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={15}
                      color="#64748B"
                    />
                    <Text style={styles.infoText}>{item.address}</Text>
                  </View>
                )}

                {!!item.customerMessage && (
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={15}
                      color="#64748B"
                    />
                    <Text style={styles.infoText} numberOfLines={3}>
                      {item.customerMessage}
                    </Text>
                  </View>
                )}

                {item.proposedDate && (
                  <View style={styles.scheduleBox}>
                    <Ionicons name="calendar" size={18} color="#7C3AED" />
                    <View>
                      <Text style={styles.scheduleTitle}>
                        Proposed Schedule
                      </Text>
                      <Text style={styles.scheduleText}>
                        {item.proposedDate}
                      </Text>
                      <Text style={styles.scheduleText}>
                        {item.proposedStartTime} - {item.proposedEndTime}
                      </Text>
                    </View>
                  </View>
                )}

                {/* ACTIONS */}
                {item.status === "reschedule_requested" && (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    disabled={actionLoading}
                    onPress={() => handleConfirmBooking(item)}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.confirmBtnText}>
                      Confirm Schedule
                    </Text>
                  </TouchableOpacity>
                )}

                {!["completed", "cancelled", "rejected"].includes(
                  item.status
                ) && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    disabled={actionLoading}
                    onPress={() => handleCancelBooking(item)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
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
    paddingHorizontal: 16,
    paddingBottom: 4,
    backgroundColor: "#F8FAFC",
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
    marginBottom: 14,
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

  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 8,
  },

  tab: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },

  activeTab: {
    borderBottomColor: COLORS.primary,
    backgroundColor: "#F8FAFC",
  },

  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  activeTabText: {
    color: COLORS.primary,
  },

  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },

  countText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
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

  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  bookingHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  bookingPriceRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  urgentText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "800",
  },

  infoRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  infoText: {
    flex: 1,
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
  },

  scheduleBox: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 13,
    backgroundColor: "#F5F3FF",
  },

  scheduleTitle: {
    fontSize: 12,
    color: "#6D28D9",
    fontWeight: "800",
  },

  scheduleText: {
    marginTop: 2,
    fontSize: 13,
    color: "#5B21B6",
    fontWeight: "600",
  },

  confirmBtn: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  confirmBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  cancelBtn: {
    marginTop: 10,
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelBtnText: {
    color: "#DC2626",
    fontWeight: "800",
    fontSize: 13,
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