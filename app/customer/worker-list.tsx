import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (categoryId) {
      loadWorkers();
    }
  }, [categoryId]);

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

  const title = formatCategoryTitle(categoryId);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
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
            Available professionals near you
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
          {/* Summary card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIcon}>
                <Ionicons name="people" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.summaryTitle}>
                  {workers.length} Worker{workers.length === 1 ? "" : "s"}
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

          {workers.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="search-outline"
                  size={32}
                  color="#94A3B8"
                />
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
            workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                name={worker.name}
                city={worker.city}
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
    marginBottom: 16,
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