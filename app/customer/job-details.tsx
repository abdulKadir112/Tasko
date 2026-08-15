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
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getJobById, deleteJob } from "@/services/job.service";
import { COLORS } from "@/theme";

const { width } = Dimensions.get("window");

function getStatusStyle(status?: string) {
  const value = String(status || "").toLowerCase();

  if (value === "open" || value === "active") {
    return {
      bg: "#DCFCE7",
      text: "#16A34A",
      label: status || "Open",
    };
  }

  if (value === "in_progress" || value === "ongoing") {
    return {
      bg: "#DBEAFE",
      text: "#2563EB",
      label: status || "In Progress",
    };
  }

  if (value === "completed" || value === "done") {
    return {
      bg: "#E0E7FF",
      text: "#4F46E5",
      label: status || "Completed",
    };
  }

  if (value === "cancelled" || value === "closed") {
    return {
      bg: "#FEE2E2",
      text: "#DC2626",
      label: status || "Cancelled",
    };
  }

  return {
    bg: "#FEF3C7",
    text: "#D97706",
    label: status || "Pending",
  };
}

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
    Alert.alert("Delete Job", "Are you sure you want to delete this job?", [
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
    ]);
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
        <Ionicons name="alert-circle-outline" size={42} color="#94A3B8" />
        <Text style={styles.notFoundTitle}>Job not found</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusStyle = getStatusStyle(job.status);
  const imageUri =
    job.image ||
    job.imageUrl ||
    job.photoURL ||
    "https://picsum.photos/800/500";

  return (
    <View style={styles.wrapper}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: 120 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= HERO IMAGE ================= */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Top overlay buttons */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>

            <View style={styles.topBarRight}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() =>
                  router.push({
                    pathname: "/customer/edit-job",
                    params: {
                      id: String(job.id || jobId),
                    },
                  })
                }
              >
                <Ionicons name="create-outline" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Status badge on image */}
          <View style={[styles.heroStatus, { backgroundColor: statusStyle.bg }]}>
            <View
              style={[styles.statusDot, { backgroundColor: statusStyle.text }]}
            />
            <Text style={[styles.heroStatusText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        {/* ================= CONTENT ================= */}
        <View style={styles.content}>
          {/* Title + Price */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.price}>৳ {job.budget}</Text>
          </View>

          {!!job.category && (
            <View style={styles.categoryChip}>
              <Ionicons name="grid-outline" size={14} color={COLORS.primary} />
              <Text style={styles.categoryText}>{job.category}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="people" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.statNumber}>{job.totalBids || 0}</Text>
              <Text style={styles.statLabel}>Applicants</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#ECFDF5" }]}>
                <Ionicons name="eye" size={20} color="#059669" />
              </View>
              <Text style={styles.statNumber}>{job.totalViews || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="cash-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.statNumber}>৳{job.budget || 0}</Text>
              <Text style={styles.statLabel}>Budget</Text>
            </View>
          </View>

          {/* Location card */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.infoTextBox}>
                  <Text style={styles.infoLabel}>City</Text>
                  <Text style={styles.infoValue}>
                    {job.city || "Not specified"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Ionicons
                    name="home-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.infoTextBox}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>
                    {job.address || "Not specified"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.description}>
                {job.description || "No description provided."}
              </Text>
            </View>
          </View>

          {/* Quick actions */}
          <TouchableOpacity
            style={styles.applicantsBtn}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/customer/bids",
                params: {
                  jobId: String(job.id || jobId),
                },
              })
            }
          >
            <View style={styles.applicantsLeft}>
              <View style={styles.applicantsIcon}>
                <Ionicons name="people" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.applicantsTitle}>View Applicants</Text>
                <Text style={styles.applicantsSub}>
                  {job.totalBids || 0} workers applied
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ================= BOTTOM BAR ================= */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.85}
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
          <Text style={styles.actionText}>Edit Job</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          activeOpacity={0.85}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
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

  notFoundTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748B",
  },

  backLink: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  backLinkText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 15,
  },

  container: {
    flex: 1,
  },

  /* Hero */
  imageWrap: {
    width: "100%",
    height: 300,
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E2E8F0",
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  topBarRight: {
    flexDirection: "row",
    gap: 10,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  heroStatus: {
    position: "absolute",
    left: 16,
    bottom: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  heroStatusText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  /* Content */
  content: {
    marginTop: -20,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
  },

  titleRow: {
    gap: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text || "#0F172A",
    lineHeight: 32,
  },

  price: {
    fontSize: 28,
    fontWeight: "800",
    color: "#16A34A",
  },

  categoryChip: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  categoryText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  statNumber: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text || "#0F172A",
  },

  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },

  section: {
    marginTop: 24,
  },

  sectionTitle: {
    marginBottom: 10,
    marginLeft: 2,
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  infoTextBox: {
    marginLeft: 12,
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },

  infoValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text || "#0F172A",
  },

  infoDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },

  descriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.textSecondary || "#475569",
  },

  applicantsBtn: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  applicantsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  applicantsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  applicantsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  applicantsSub: {
    marginTop: 2,
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
  },

  /* Bottom */
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  editButton: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
  },

  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  actionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  deleteText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "800",
  },
});