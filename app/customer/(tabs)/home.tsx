import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import HomeHeader from "@/components/home/HomeHeader";
import HomeBanner from "@/components/home/HomeBanner";
import SearchBar from "@/components/home/SearchBar";
import CategoryCard from "@/components/home/CategoryCard";
import ServiceCard from "@/components/home/ServiceCard";
import WorkerCard from "@/components/home/WorkerCard";
import RecentJobCard from "@/components/home/RecentJobCard";

import { COLORS } from "@/theme";

import { getCategories } from "@/services/category.service";
import {
  getServices,
  getEmergencyServices,
} from "@/services/service.service";
import { getWorkers } from "@/services/worker.service";
import { getJobs } from "@/services/job.service";
import {
  getCurrentCoords,
  getDistanceKm,
  formatDistance,
} from "@/services/location.service";

export default function CustomerHome() {
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [emergencyServices, setEmergencyServices] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  useEffect(() => {
    loadHomeData();
    loadMyLocation();
  }, []);

  async function loadMyLocation() {
    try {
      const coords = await getCurrentCoords();
      setMyCoords(coords);
    } catch (e) {
      // permission deny হলে distance না দেখালেও চলবে
      console.log("Customer location:", e);
    }
  }

  async function loadHomeData() {
    try {
      setLoading(true);

      const [categoryRes, serviceRes, emergencyRes, workerRes, jobRes] =
        await Promise.all([
          getCategories(),
          getServices(),
          getEmergencyServices(),
          getWorkers(),
          getJobs(),
        ]);

      setCategories(categoryRes.data ?? []);
      setServices(serviceRes.data ?? []);
      setEmergencyServices(emergencyRes.data ?? []);
      setWorkers(workerRes.data ?? []);
      setJobs(jobRes.data ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  function getDistanceText(item: any) {
    if (
      !myCoords ||
      typeof item?.lat !== "number" ||
      typeof item?.lng !== "number"
    ) {
      return item?.city || undefined;
    }

    const km = getDistanceKm(
      myCoords.lat,
      myCoords.lng,
      item.lat,
      item.lng
    );

    return formatDistance(km);
  }

  function handleCategoryPress(categoryId: string) {
    router.push({
      pathname: "/customer/worker-list",
      params: {
        category: categoryId,
      },
    });
  }

  function handleWorkerPress(id: string) {
    router.push({
      pathname: "/customer/worker-profile",
      params: {
        id,
      },
    });
  }

  function handleJobPress(id: string) {
    router.push({
      pathname: "/customer/job-details",
      params: {
        id,
      },
    });
  }

  function handleServicePress(item: any) {
    if (item?.workerId) {
      router.push({
        pathname: "/customer/worker-profile",
        params: {
          id: String(item.workerId),
        },
      });
      return;
    }
  }

  const filteredServices = search.trim()
    ? services.filter((item) =>
        String(item.title || "")
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      )
    : services;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <HomeHeader />

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search services, workers..."
          onFilterPress={() => {
            console.log("Filter");
          }}
        />

        <HomeBanner />

        {/* ================= EMERGENCY ================= */}
        <TouchableOpacity
          style={styles.emergencyBanner}
          activeOpacity={0.9}
          onPress={() => router.push("/customer/emergency" as any)}
        >
          <View style={styles.emergencyIcon}>
            <Ionicons name="flash" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>Emergency Services</Text>
            <Text style={styles.emergencySub}>
              Roadside help, urgent repair — nearest workers
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>Categories</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <View style={styles.categoryGrid}>
            {categories.map((item) => (
              <CategoryCard
                key={item.id}
                id={item.id}
                emoji={item.emoji}
                title={item.title}
                onPress={handleCategoryPress}
              />
            ))}
          </View>
        )}

        {/* Emergency list preview */}
        {emergencyServices.length > 0 && (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.heading}>Nearby Emergency</Text>
              <TouchableOpacity
                onPress={() => router.push("/customer/emergency" as any)}
              >
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {emergencyServices.slice(0, 3).map((item) => (
              <ServiceCard
                key={item.id}
                title={item.title}
                category={item.category}
                price={`From ৳${item.price}`}
                rating={String(item.workerRating ?? item.rating ?? "5.0")}
                city={item.city}
                image={item.images?.[0] || item.image}
                isEmergency
                distanceText={getDistanceText(item)}
                workerName={item.workerName}
                onPress={() => handleServicePress(item)}
                onBook={() => handleServicePress(item)}
              />
            ))}
          </>
        )}

        {/* Popular Workers */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>Popular Workers</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          workers.slice(0, 5).map((worker) => (
            <WorkerCard
              key={worker.id}
              id={worker.id}
              name={worker.name}
              category={worker.category}
              city={
                getDistanceText(worker) ||
                worker.city
              }
              rating={worker.rating ?? 5}
              experience={worker.experience ?? "2 Years"}
              image={worker.photoURL}
              onPress={handleWorkerPress}
            />
          ))
        )}

        {/* Popular Services */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>Popular Services</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : filteredServices.length === 0 ? (
          <Text style={styles.emptyText}>No services found</Text>
        ) : (
          filteredServices.map((item) => (
            <ServiceCard
              key={item.id}
              title={item.title}
              category={item.category}
              price={`Starting ৳${item.price}`}
              rating={String(item.workerRating ?? item.rating ?? "5.0")}
              city={item.city}
              image={item.images?.[0] || item.image}
              isEmergency={Boolean(item.isEmergency)}
              distanceText={getDistanceText(item)}
              workerName={item.workerName}
              onPress={() => handleServicePress(item)}
              onBook={() => handleServicePress(item)}
            />
          ))
        )}

        {/* Recent Jobs */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>Recent Jobs</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          jobs.slice(0, 5).map((job) => (
            <RecentJobCard
              key={job.id}
              id={job.id}
              title={job.title}
              category={job.category}
              city={job.city}
              budget={job.budget}
              image={job.image}
              onPress={handleJobPress}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },

  emergencyBanner: {
    marginTop: 18,
    backgroundColor: "#EF4444",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  emergencyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  emergencyTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  emergencySub: {
    marginTop: 2,
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
  },

  titleRow: {
    marginTop: 28,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },

  seeAll: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  emptyText: {
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 10,
  },
});