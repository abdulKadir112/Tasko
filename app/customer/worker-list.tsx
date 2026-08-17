import { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import WorkerCard from "@/components/worker/WorkerCard";
import { getWorkersByCategory } from "@/services/worker.service";
import {
  getCurrentCoords,
  getDistanceKm,
  formatDistance,
} from "@/services/location.service";
import { COLORS } from "@/theme";

function formatCategoryTitle(value?: string) {
  if (!value) return "Workers";

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function WorkerList() {
  const { category } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const categoryId = Array.isArray(category) ? category[0] : category;

  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [sortBy, setSortBy] = useState<"nearest" | "rating">("nearest");

  useEffect(() => {
    loadMyLocation();
  }, []);

  useEffect(() => {
    if (categoryId) {
      loadWorkers();
    }
  }, [categoryId]);

  async function loadMyLocation() {
    try {
      const coords = await getCurrentCoords();
      setMyCoords(coords);
    } catch (e) {
      console.log("Location:", e);
    }
  }

  async function loadWorkers(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await getWorkersByCategory(String(categoryId));
      setWorkers(res.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const sortedWorkers = useMemo(() => {
    const list = [...workers];

    if (sortBy === "rating") {
      return list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    // nearest
    if (!myCoords) {
      return list;
    }

    return list.sort((a, b) => {
      const aOk = typeof a.lat === "number" && typeof a.lng === "number";
      const bOk = typeof b.lat === "number" && typeof b.lng === "number";

      if (!aOk && !bOk) return 0;
      if (!aOk) return 1;
      if (!bOk) return -1;

      const da = getDistanceKm(myCoords.lat, myCoords.lng, a.lat, a.lng);
      const db = getDistanceKm(myCoords.lat, myCoords.lng, b.lat, b.lng);

      return da - db;
    });
  }, [workers, sortBy, myCoords]);

  function distanceLabel(worker: any) {
    if (
      !myCoords ||
      typeof worker.lat !== "number" ||
      typeof worker.lng !== "number"
    ) {
      return worker.city || "Location N/A";
    }

    return formatDistance(
      getDistanceKm(myCoords.lat, myCoords.lng, worker.lat, worker.lng)
    );
  }

  const title = formatCategoryTitle(categoryId);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle}>
            {myCoords
              ? "Sorted by distance from you"
              : "Available professionals near you"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => loadWorkers(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding workers...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 24 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadWorkers(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIcon}>
                <Ionicons name="people" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.summaryTitle}>
                  {sortedWorkers.length} Worker
                  {sortedWorkers.length === 1 ? "" : "s"}
                </Text>
                <Text style={styles.summarySub}>
                  Tap a worker to view full profile
                </Text>
              </View>
            </View>

            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText} numberOfLines={1}>
                {title}
              </Text>
            </View>
          </View>

          {/* Sort chips */}
          <View style={styles.sortRow}>
            <TouchableOpacity
              style={[
                styles.sortChip,
                sortBy === "nearest" && styles.sortChipActive,
              ]}
              onPress={() => setSortBy("nearest")}
            >
              <Ionicons
                name="navigate-outline"
                size={14}
                color={sortBy === "nearest" ? "#fff" : "#475569"}
              />
              <Text
                style={[
                  styles.sortText,
                  sortBy === "nearest" && styles.sortTextActive,
                ]}
              >
                Nearest
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortChip,
                sortBy === "rating" && styles.sortChipActive,
              ]}
              onPress={() => setSortBy("rating")}
            >
              <Ionicons
                name="star-outline"
                size={14}
                color={sortBy === "rating" ? "#fff" : "#475569"}
              />
              <Text
                style={[
                  styles.sortText,
                  sortBy === "rating" && styles.sortTextActive,
                ]}
              >
                Top rated
              </Text>
            </TouchableOpacity>
          </View>

          {sortedWorkers.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={32} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No workers found</Text>
              <Text style={styles.emptySub}>
                There are no available workers in this category right now.
              </Text>

              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => loadWorkers(true)}
              >
                <Text style={styles.emptyBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sortedWorkers.map((worker) => (
              <WorkerCard
                key={worker.id}
                name={worker.name}
                city={distanceLabel(worker)}
                rating={worker.rating}
                experience={worker.experience}
                price={worker.price}
                completedJobs={worker.completedJobs}
                onPress={() =>
                  router.push({
                    pathname: "/customer/worker-profile",
                    params: {
                      id: worker.id,
                    },
                  })
                }
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 12,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTextBox: {
    flex: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  listContent: {
    padding: 16,
  },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  summarySub: {
    marginTop: 2,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },

  categoryChip: {
    maxWidth: 110,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  categoryChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },

  sortRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },

  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  sortChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  sortText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },

  sortTextActive: {
    color: "#fff",
  },

  emptyBox: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  emptySub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },

  emptyBtn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },

  emptyBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});