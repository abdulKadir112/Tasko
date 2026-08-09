import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/theme";
import {
  getJobById,
  addJobView,
} from "@/services/job.service";
import BidBottomSheet from "@/components/bid/BidBottomSheet";

export default function WorkerJobDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const jobId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [showBid, setShowBid] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  async function loadJob() {
    try {
      // View Count Update
      await addJobView(jobId as string);
  
      // Job Data Load
      const res = await getJobById(jobId as string);
  
      if (res.success) {
        setJob(res.data);
      }
  
      setAlreadyApplied(false);
    } catch (error: any) {
      console.log("Load Job Error:", error?.response?.data || error.message);
      Alert.alert("Error", "Failed to load job.");
    } finally {
      setLoading(false);
    }
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
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.loading}>
        <Text>Job Not Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 140,
        }}
      >
        {/* COVER */}
        <Image
          source={{
            uri: job.image || "https://picsum.photos/900/700",
          }}
          resizeMode="cover"
          style={styles.cover}
        />

        {/* BACK */}
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              top: insets.top + 10,
            },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.container}>
          <View style={styles.statusContainer}>
            <Text
              style={[
                styles.statusText,
                {
                  backgroundColor: statusColor(job.status),
                },
              ]}
            >
              {job.status}
            </Text>
          </View>

          <Text style={styles.title}>{job.title}</Text>

          <Text style={styles.price}>৳ {job.budget}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.card}>
              <Ionicons name="people" size={26} color={COLORS.primary} />
              <Text style={styles.number}>{job.totalBids || 0}</Text>
              <Text style={styles.label}>Workers Applied</Text>
            </View>

            <View style={styles.card}>
              <Ionicons name="eye" size={26} color="#2563EB" />
              <Text style={styles.number}>{job.totalViews || 0}</Text>
              <Text style={styles.label}>Views</Text>
            </View>
          </View>

          {/* DETAILS */}
          <View style={styles.info}>
            <Ionicons name="briefcase" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{job.category}</Text>
          </View>

          <View style={styles.info}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{job.city}</Text>
          </View>

          <View style={styles.info}>
            <Ionicons name="home" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>{job.address}</Text>
          </View>

          <Text style={styles.heading}>Description</Text>

          <Text style={styles.description}>{job.description}</Text>
        </View>
      </ScrollView>

      {/* APPLY BUTTON */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 15,
          },
        ]}
      >
        <TouchableOpacity
          disabled={alreadyApplied}
          onPress={() => setShowBid(true)}
          style={[
            styles.applyButton,
            alreadyApplied && {
              backgroundColor: "#94A3B8",
            },
          ]}
        >
          <Ionicons
            name={alreadyApplied ? "checkmark-circle" : "send"}
            size={20}
            color="#fff"
          />
          <Text style={styles.applyText}>
            {alreadyApplied ? "Already Applied" : "Apply Now"}
          </Text>
        </TouchableOpacity>
      </View>

      <BidBottomSheet
        visible={showBid}
        jobId={job.id || jobId}
        onClose={() => setShowBid(false)}
        onSuccess={() => {
          setAlreadyApplied(true);
          loadJob();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  cover: {
    width: "100%",
    height: 320,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  backButton: {
    position: "absolute",
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  container: {
    padding: 20,
  },

  statusContainer: {
    marginBottom: 12,
  },

  statusText: {
    alignSelf: "flex-start",
    color: "#fff",
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    textTransform: "capitalize",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 36,
  },

  price: {
    fontSize: 28,
    fontWeight: "700",
    color: "#16A34A",
    marginTop: 14,
  },

  statsRow: {
    flexDirection: "row",
    marginTop: 24,
    gap: 14,
  },

  card: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  number: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 10,
  },

  label: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
    textAlign: "center",
  },

  info: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },

  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },

  heading: {
    marginTop: 30,
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },

  description: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 26,
    color: COLORS.textSecondary,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  applyButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  applyText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
    marginLeft: 10,
  },
});