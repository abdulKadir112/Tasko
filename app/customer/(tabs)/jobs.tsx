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
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { getMyCustomerJobs } from "@/services/job.service";
import { COLORS } from "@/theme";

export default function JobsScreen() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const res = await getMyCustomerJobs();
  
      console.log("==============");
      console.log(JSON.stringify(res, null, 2));
      console.log("==============");
  
      setJobs(res.data || []);
    } catch (e) {
      console.log("ERROR =", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  
  async function onRefresh() {
    setRefreshing(true);
    await loadJobs();
  }

  function statusColor(status: string) {
    switch (status) {
      case "pending":
        return "#F59E0B";

      case "accepted":
        return "#10B981";

      case "completed":
        return "#2563EB";

      default:
        return "#EF4444";
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
      ListHeaderComponent={
        <Text style={styles.header}>
          My Posted Jobs
        </Text>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons
            name="briefcase-outline"
            size={70}
            color="#CBD5E1"
          />

          <Text style={styles.emptyTitle}>
            No Jobs Yet
          </Text>

          <Text style={styles.emptyText}>
            Your posted jobs will appear here.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.card}
          onPress={() =>
            router.push(`/customer/job-details?id=${item.id}`)
          }
        >
          <Image
            source={{
              uri:
                item.image ||
                "https://via.placeholder.com/120",
            }}
            style={styles.image}
          />

          <View style={styles.right}>
            <View style={styles.row}>
              <Text
                numberOfLines={1}
                style={styles.title}
              >
                {item.title}
              </Text>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: statusColor(
                      item.status
                    ),
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {item.status}
                </Text>
              </View>
            </View>

            <Text style={styles.category}>
              {item.category}
            </Text>

            <Text
              numberOfLines={2}
              style={styles.description}
            >
              {item.description}
            </Text>

            <View style={styles.bottom}>
              <Text style={styles.price}>
                ৳ {item.budget}
              </Text>

              <Text style={styles.city}>
                📍 {item.city}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 120,
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: COLORS.text,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    elevation: 3,
  },

  image: {
    width: 100,
    height: 100,
    borderRadius: 14,
  },

  right: {
    flex: 1,
    marginLeft: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginRight: 10,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  category: {
    marginTop: 6,
    color: COLORS.primary,
    fontWeight: "600",
  },

  description: {
    marginTop: 6,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  price: {
    fontWeight: "700",
    color: "#16A34A",
    fontSize: 17,
  },

  city: {
    color: COLORS.textSecondary,
  },

  empty: {
    marginTop: 120,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 24,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 8,
    color: COLORS.textSecondary,
  },
});