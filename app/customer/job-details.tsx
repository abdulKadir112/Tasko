import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getJobById, deleteJob } from "@/services/job.service";
import { COLORS } from "@/theme";

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const jobId = Array.isArray(id) ? id[0] : id;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  async function loadJob() {
    try {
      const res = await getJobById(jobId as string);
      setJob(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      "Delete Job",
      "Are you sure you want to delete this job?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteJob(jobId as string);
              router.back();
            } catch (e) {
              console.log(e);
              Alert.alert("Error", "Failed to delete job");
            }
          },
        },
      ]
    );
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
        <Text>Job not found</Text>
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
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <Image
          source={{
            uri: job.image || "https://picsum.photos/800/500",
          }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <Text style={styles.title}>{job.title}</Text>

          <View style={styles.status}>
            <Text style={styles.statusText}>{job.status}</Text>
          </View>

          <Text style={styles.price}>৳ {job.budget}</Text>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="people" size={26} color={COLORS.primary} />
              <Text style={styles.statNumber}>{job.totalBids || 0}</Text>
              <Text style={styles.statLabel}>Workers Applied</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="eye" size={26} color="#2563EB" />
              <Text style={styles.statNumber}>{job.totalViews || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          </View>

          <View style={styles.item}>
            <Ionicons
              name="briefcase-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.text}>{job.category}</Text>
          </View>

          <View style={styles.item}>
            <Ionicons
              name="location-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.text}>{job.city}</Text>
          </View>

          <View style={styles.item}>
            <Ionicons name="home-outline" size={20} color={COLORS.primary} />
            <Text style={styles.text}>{job.address}</Text>
          </View>

          <Text style={styles.heading}>Description</Text>
          <Text style={styles.description}>{job.description}</Text>

          {/* View Applicants Button */}
          <TouchableOpacity
            style={styles.bidButton}
            onPress={() =>
              router.push({
                pathname: "/customer/bids",
                params: {
                  jobId: String(job.id || jobId),
                },
              })
            }
          >
            <Text style={styles.bidButtonText}>View Applicants</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View
        style={[
          styles.bottomActions,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            router.push({
              pathname: "/customer/edit-job",
              params: {
                id: String(job.id || jobId),
              },
            })
          }
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
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

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  image: {
    width: "100%",
    height: 280,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  content: {
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
  },

  status: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    color: "#D97706",
    fontWeight: "700",
    textTransform: "capitalize",
  },

  price: {
    fontSize: 26,
    fontWeight: "700",
    color: "#16A34A",
    marginTop: 18,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 8,
  },

  statLabel: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "500",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  text: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text,
  },

  heading: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: "700",
  },

  description: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },

  bidButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  bidButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  bottomActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },

  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },

  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});