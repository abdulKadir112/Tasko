import { useEffect, useState } from "react";
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";

import { useLocalSearchParams } from "expo-router";

import {
  getJobBids,
  acceptBid,
  rejectBid,
} from "@/services/bid.service";

import { COLORS } from "@/theme";

export default function CustomerBids() {
  const { jobId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<any[]>([]);

  useEffect(() => {
    loadBids();
  }, []);

  async function loadBids() {
    try {
      const res = await getJobBids(jobId as string);
      setBids(res.data || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(id: string) {
    Alert.alert(
      "Accept Worker",
      "Assign this worker?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Accept",
          onPress: async () => {
            await acceptBid(id);
            loadBids();
          },
        },
      ]
    );
  }

  async function handleReject(id: string) {
    Alert.alert(
      "Reject Worker",
      "Reject this proposal?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject",
          onPress: async () => {
            await rejectBid(id);
            loadBids();
          },
        },
      ]
    );
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
        contentContainerStyle={{
          padding: 16,
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>No Applicants Yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={{
                uri:
                  item.worker?.photoURL ||
                  "https://picsum.photos/300",
              }}
              style={styles.avatar}
            />

            <Text style={styles.name}>
              {item.worker?.name}
            </Text>

            <Text style={styles.info}>
              ⭐ {item.worker?.rating || 5}
            </Text>

            <Text style={styles.info}>
              {item.worker?.experience}
            </Text>

            <Text style={styles.bid}>
              Bid : ৳{item.amount}
            </Text>

            <Text style={styles.message}>
              {item.message}
            </Text>

            <Text
              style={[
                styles.status,
                {
                  color:
                    item.status === "accepted"
                      ? "#10B981"
                      : item.status === "pending"
                      ? "#F59E0B"
                      : "#EF4444",
                },
              ]}
            >
              {item.status}
            </Text>

            {item.status === "pending" && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.accept}
                  onPress={() =>
                    handleAccept(item.id)
                  }
                >
                  <Text style={styles.btnText}>
                    Accept
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reject}
                  onPress={() =>
                    handleReject(item.id)
                  }
                >
                  <Text style={styles.btnText}>
                    Reject
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignSelf: "center",
    marginBottom: 12,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: COLORS.text,
  },

  info: {
    textAlign: "center",
    marginTop: 5,
    color: COLORS.textSecondary,
  },

  bid: {
    marginTop: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  message: {
    marginTop: 8,
    color: COLORS.textSecondary,
  },

  status: {
    marginTop: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  actions: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },

  accept: {
    flex: 1,
    backgroundColor: "#10B981",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  reject: {
    flex: 1,
    backgroundColor: "#EF4444",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
});