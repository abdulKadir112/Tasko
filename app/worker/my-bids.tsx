import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/theme";
import { getMyBids } from "@/services/bid.service";

export default function MyBidsScreen() {
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<any[]>([]);

  useEffect(() => {
    loadBids();
  }, []);

  async function loadBids() {
    try {
      const res = await getMyBids();
      setBids(res.data || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
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
    <FlatList
      data={bids}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        padding: 16,
      }}
      ListEmptyComponent={
        <View style={styles.center}>
          <Ionicons
            name="briefcase-outline"
            size={60}
            color="#CBD5E1"
          />
          <Text style={styles.empty}>
            No Applied Jobs
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
                item.job.image ||
                "https://picsum.photos/300",
            }}
            style={styles.image}
          />

          <View style={styles.content}>
            <Text
              numberOfLines={1}
              style={styles.title}
            >
              {item.job.title}
            </Text>

            <Text style={styles.price}>
              Job Budget ৳{item.job.budget}
            </Text>

            <Text style={styles.bid}>
              Your Bid ৳{item.amount}
            </Text>

            <View
              style={[
                styles.status,
                {
                  backgroundColor:
                    getStatusColor(item.status),
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
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
  },

  empty: {
    marginTop: 12,
    fontSize: 18,
    color: "#64748B",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 18,
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

  price: {
    color: "#10B981",
    fontWeight: "700",
  },

  bid: {
    color: COLORS.primary,
    fontWeight: "600",
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