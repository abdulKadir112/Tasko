import { useEffect, useState } from "react";
import {
  SafeAreaView,
  FlatList,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getMyBids } from "@/services/bid.service";
import { COLORS } from "@/theme";

export default function WorkerJobs() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBids();
  }, []);

  async function loadBids() {
    try {
      const res = await getMyBids();
      setBids(res.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "accepted":
        return "#10B981";

      case "pending":
        return "#F59E0B";

      case "rejected":
        return "#EF4444";

      default:
        return "#64748B";
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={bids}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons
              name="briefcase-outline"
              size={60}
              color="#CBD5E1"
            />
            <Text style={styles.empty}>
              You haven't applied to any jobs yet.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: "/worker/job-details",
                params: {
                  id: item.job.id,
                },
              })
            }
          >
            <Image
              source={{
                uri:
                  item.job?.image ||
                  "https://picsum.photos/300",
              }}
              style={styles.image}
            />

            <View style={styles.content}>
              <Text
                style={styles.title}
                numberOfLines={1}
              >
                {item.job?.title}
              </Text>

              <Text style={styles.info}>
                Job Budget : ৳{item.job?.budget}
              </Text>

              <Text style={styles.info}>
                Your Bid : ৳{item.amount}
              </Text>

              <View
                style={[
                  styles.status,
                  {
                    backgroundColor: statusColor(
                      item.status
                    ),
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {item.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
  },

  empty: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
  },

  image: {
    width: 110,
    height: 110,
  },

  content: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },

  info: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  status: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    color: "#fff",
    fontWeight: "700",
    textTransform: "capitalize",
  },
});