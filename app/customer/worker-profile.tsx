import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getWorkerById } from "@/services/worker.service";
import { COLORS } from "@/theme";

export default function WorkerProfile() {
  const { id } = useLocalSearchParams();

  const workerId = Array.isArray(id) ? id[0] : id;

  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workerId) {
      loadWorker();
    }
  }, [workerId]);

  async function loadWorker() {
    try {
      setLoading(true);

      const res = await getWorkerById(String(workerId));

      setWorker(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={26}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👨‍🔧</Text>
        </View>

        <Text style={styles.name}>{worker?.name}</Text>

        <Text style={styles.rating}>
          ⭐ {worker?.rating ?? 0}
        </Text>

        <Text style={styles.location}>
          📍 {worker?.city}
        </Text>

        <Text style={styles.info}>
          💼 {worker?.experience}
        </Text>

        <Text style={styles.info}>
          ✅ {worker?.completedJobs} Jobs Completed
        </Text>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <Text style={styles.description}>
            {worker?.about ??
              "Professional service provider with quality work and customer satisfaction."}
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.chatButton}>
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.callButton}>
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={() =>
            router.push({
              pathname: "/customer/post-job",
              params: {
                workerId: worker.id,
                category: worker.category,
              },
            })
          }
        >
          <Text style={styles.bookText}>
            Book Now • ৳{worker?.price}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 20,
  },

  avatarEmoji: {
    fontSize: 60,
  },

  name: {
    marginTop: 20,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: COLORS.text,
  },

  rating: {
    marginTop: 8,
    textAlign: "center",
    color: "#F59E0B",
    fontWeight: "700",
  },

  location: {
    marginTop: 8,
    textAlign: "center",
    color: COLORS.textSecondary,
  },

  info: {
    marginTop: 8,
    textAlign: "center",
    color: COLORS.textSecondary,
  },

  section: {
    marginTop: 35,
    paddingHorizontal: 20,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: COLORS.text,
  },

  description: {
    lineHeight: 24,
    color: COLORS.textSecondary,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 35,
  },

  chatButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  callButton: {
    flex: 1,
    backgroundColor: "#22C55E",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },

  bookButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
    backgroundColor: "#FF6B00",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  bookText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});