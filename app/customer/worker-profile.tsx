import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
  Linking,
  Alert,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getWorkerById } from "@/services/worker.service";
import { getServices } from "@/services/service.service";
import { COLORS } from "@/theme";

export default function WorkerProfile() {
  const {
    id,
    serviceId: paramServiceId,
    serviceTitle: paramServiceTitle,
    servicePrice: paramServicePrice,
    serviceCategory: paramServiceCategory,
  } = useLocalSearchParams();

  const insets = useSafeAreaInsets();

  const workerId = Array.isArray(id) ? id[0] : id;

  const [worker, setWorker] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
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
      const workerData = res?.data ?? res;
      setWorker(workerData);

      // Worker এর published services load
      try {
        const serviceRes = await getServices({
          workerId: String(workerId),
        });

        const list = Array.isArray(serviceRes?.data)
          ? serviceRes.data
          : Array.isArray(serviceRes)
            ? serviceRes
            : [];

        setServices(
          list.filter((s: any) => s?.isActive !== false)
        );
      } catch (e) {
        console.log("Worker services load error:", e);
        setServices([]);
      }
    } catch (error) {
      console.log("GET WORKER ERROR =", error);
      Alert.alert("Error", "Unable to load worker profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleCall() {
    const phone = worker?.phone || worker?.phoneNumber;

    if (!phone) {
      Alert.alert("Unavailable", "Phone number not available");
      return;
    }

    const url = `tel:${phone}`;

    try {
      const canOpen = await Linking.canOpenURL(url);

      if (!canOpen) {
        Alert.alert("Error", "Cannot open phone dialer");
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.log("CALL ERROR =", error);
      Alert.alert("Error", "Unable to open phone dialer");
    }
  }

  function handleChat() {
    if (!worker?.id) {
      Alert.alert("Error", "Worker information not available");
      return;
    }

    router.push({
      pathname: "/shared/chat/room",
      params: {
        receiverId: String(worker.id),
      },
    });
  }

  function handleBook() {
    if (!worker?.id) {
      Alert.alert("Error", "Worker information not available");
      return;
    }

    // 1) Route params থেকে serviceId
    const fromParam = Array.isArray(paramServiceId)
      ? paramServiceId[0]
      : paramServiceId;

    // 2) না থাকলে worker এর first active service
    const fromList = services[0];

    const finalServiceId =
      fromParam && String(fromParam).trim()
        ? String(fromParam)
        : fromList?.id
          ? String(fromList.id)
          : "";

    if (!finalServiceId) {
      Alert.alert(
        "No Service",
        "This worker has not published any service yet. You can post a job instead.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Post Job",
            onPress: () =>
              router.push({
                pathname: "/customer/post-job",
                params: {
                  workerId: String(worker.id),
                  category: worker.category || "",
                },
              }),
          },
        ]
      );
      return;
    }

    const titleFromParam = Array.isArray(paramServiceTitle)
      ? paramServiceTitle[0]
      : paramServiceTitle;

    const priceFromParam = Array.isArray(paramServicePrice)
      ? paramServicePrice[0]
      : paramServicePrice;

    const categoryFromParam = Array.isArray(paramServiceCategory)
      ? paramServiceCategory[0]
      : paramServiceCategory;

    const matchedService =
      services.find((s) => String(s.id) === finalServiceId) ||
      fromList;

    router.push({
      pathname: "/customer/book-worker",
      params: {
        serviceId: finalServiceId,
        workerId: String(worker.id),
        workerName: String(worker.name || "Worker"),
        category: String(
          categoryFromParam ||
            matchedService?.category ||
            worker.category ||
            ""
        ),
        serviceTitle: String(
          titleFromParam ||
            matchedService?.title ||
            `${worker.name || "Worker"} Service`
        ),
        price: String(
          priceFromParam ??
            matchedService?.price ??
            worker.price ??
            0
        ),
        city: String(
          matchedService?.city || worker.city || ""
        ),
      },
    });
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={styles.loading}>
        <Ionicons
          name="alert-circle-outline"
          size={42}
          color="#94A3B8"
        />
        <Text style={styles.loadingText}>Worker not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarUri =
    typeof worker.photoURL === "string" && worker.photoURL.trim()
      ? worker.photoURL.trim()
      : typeof worker.avatar === "string" && worker.avatar.trim()
        ? worker.avatar.trim()
        : null;

  const rating = Number(worker.rating || 0).toFixed(1);
  const experience = worker.experience || "N/A";
  const completedJobs = worker.completedJobs ?? 0;

  const fromParamPrice = Array.isArray(paramServicePrice)
    ? paramServicePrice[0]
    : paramServicePrice;

  const price =
    fromParamPrice ??
    services[0]?.price ??
    worker.price ??
    0;

  const city = worker.city || "Not specified";

  const about =
    worker.about ||
    "Professional service provider with quality work and customer satisfaction.";

  const selectedServiceTitle = Array.isArray(paramServiceTitle)
    ? paramServiceTitle[0]
    : paramServiceTitle || services[0]?.title || "";

  const selectedCategory = Array.isArray(paramServiceCategory)
    ? paramServiceCategory[0]
    : paramServiceCategory ||
      services[0]?.category ||
      worker.category ||
      "General";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 130 + insets.bottom,
        }}
      >
        {/* HERO */}
        <View
          style={[
            styles.hero,
            { paddingTop: insets.top + 10 },
          ]}
        >
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>

            <Text style={styles.heroTitle}>Worker Profile</Text>

            <View style={styles.iconBtnPlaceholder} />
          </View>

          <View style={styles.profileBlock}>
            <View style={styles.avatarWrap}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarEmoji}>👨‍🔧</Text>
                </View>
              )}
              <View style={styles.onlineDot} />
            </View>

            <Text style={styles.name}>{worker.name || "Worker"}</Text>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>{rating}</Text>
              <Text style={styles.ratingSub}>• Verified Pro</Text>
            </View>

            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={15}
                color="#DBEAFE"
              />
              <Text style={styles.locationText}>{city}</Text>
            </View>
          </View>
        </View>

        {/* SELECTED SERVICE */}
        {selectedServiceTitle ? (
          <View style={styles.selectedServiceCard}>
            <View style={styles.selectedServiceIcon}>
              <Ionicons
                name="construct-outline"
                size={22}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.selectedServiceInfo}>
              <Text style={styles.selectedServiceLabel}>
                Selected Service
              </Text>
              <Text
                style={styles.selectedServiceTitle}
                numberOfLines={2}
              >
                {selectedServiceTitle}
              </Text>
              <Text style={styles.selectedServiceCategory}>
                {selectedCategory}
              </Text>
            </View>

            <Text style={styles.selectedServicePrice}>৳{price}</Text>
          </View>
        ) : null}

        {/* STATS */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{experience}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedJobs}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statValue}>৳{price}</Text>
            <Text style={styles.statLabel}>Starting</Text>
          </View>
        </View>

        {/* ABOUT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <Text style={styles.description}>{about}</Text>
          </View>
        </View>

        {/* DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="briefcase-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.detailTextBox}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>
                  {selectedCategory}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.detailTextBox}>
                <Text style={styles.detailLabel}>Service Charge</Text>
                <Text style={styles.detailValue}>From ৳{price}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
              <View style={styles.detailTextBox}>
                <Text style={styles.detailLabel}>Service Area</Text>
                <Text style={styles.detailValue}>{city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* CONTACT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Worker</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.chatBtn]}
              onPress={handleChat}
              activeOpacity={0.85}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={18}
                color="#fff"
              />
              <Text style={styles.actionText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.callBtn]}
              onPress={handleCall}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM BOOK */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Service price</Text>
          <Text style={styles.priceValue}>৳{price}</Text>
        </View>

        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBook}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar-outline" size={19} color="#fff" />
          <Text style={styles.bookText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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

  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  backLink: {
    marginTop: 8,
    color: COLORS.primary,
    fontWeight: "700",
  },

  hero: {
    backgroundColor: COLORS.primary,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  topBar: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },

  iconBtnPlaceholder: {
    width: 40,
    height: 40,
  },

  heroTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  profileBlock: {
    alignItems: "center",
    marginTop: 18,
    paddingHorizontal: 20,
  },

  avatarWrap: {
    position: "relative",
  },

  avatar: {
    width: 104,
    height: 104,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "#DBEAFE",
  },

  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },

  avatarEmoji: {
    fontSize: 48,
  },

  onlineDot: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },

  name: {
    marginTop: 14,
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },

  ratingRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  ratingText: {
    color: "#FDE68A",
    fontWeight: "800",
    fontSize: 14,
  },

  ratingSub: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    fontSize: 13,
  },

  locationRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  locationText: {
    color: "#DBEAFE",
    fontWeight: "600",
    fontSize: 13,
  },

  selectedServiceCard: {
    marginTop: -10,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  selectedServiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  selectedServiceInfo: {
    flex: 1,
  },

  selectedServiceLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  selectedServiceTitle: {
    marginTop: 2,
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "800",
  },

  selectedServiceCategory: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  selectedServicePrice: {
    fontSize: 18,
    fontWeight: "900",
    color: "#16A34A",
  },

  statsCard: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },

  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E2E8F0",
  },

  section: {
    marginTop: 22,
    paddingHorizontal: 20,
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

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#475569",
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  detailTextBox: {
    marginLeft: 12,
    flex: 1,
  },

  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },

  detailValue: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
  },

  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  chatBtn: {
    backgroundColor: COLORS.primary,
  },

  callBtn: {
    backgroundColor: "#16A34A",
  },

  actionText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  priceBox: {
    flex: 1,
  },

  priceLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },

  priceValue: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "800",
    color: "#16A34A",
  },

  bookButton: {
    flex: 1.2,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  bookText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});