import { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import HomeHeader from "@/components/home/HomeHeader";
import HomeBanner from "@/components/home/HomeBanner";
import SearchBar from "@/components/home/SearchBar";
import CategoryCard from "@/components/home/CategoryCard";
import ServiceCard from "@/components/home/ServiceCard";
import WorkerCard from "@/components/home/WorkerCard";

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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const JOB_CARD_WIDTH = SCREEN_WIDTH - 60;

export default function CustomerHome() {
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [emergencyServices, setEmergencyServices] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [myCoords, setMyCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    loadHomeData();
    loadMyLocation();
  }, []);

  async function loadMyLocation() {
    try {
      const coords = await getCurrentCoords();
      setMyCoords(coords);
    } catch (e) {
      console.log("Customer location:", e);
    }
  }

  async function loadHomeData() {
    try {
      setLoading(true);

      const [
        categoryRes,
        serviceRes,
        emergencyRes,
        workerRes,
        jobRes,
      ] = await Promise.all([
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
      console.log("Customer Home Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadHomeData(), loadMyLocation()]);
    setRefreshing(false);
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
    const image =
      item?.images?.[0] ||
      item?.image ||
      item?.coverImage ||
      item?.bannerImage ||
      null;

    router.push({
      pathname: "/customer/book-worker",
      params: {
        serviceId: String(item.id || ""),
        workerId: String(item.workerId || ""),
        workerName: item.workerName || "Worker",
        category: item.category || "",
        price: String(item.price || "0"),
        city: item.city || "",
        workerPhoto: item.workerPhoto || item.workerAvatar || "",
        image: image ? String(image) : "",
      },
    });
  }

  const filteredServices = search.trim()
    ? services.filter((item) =>
        String(item.title || "")
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      )
    : services;

  const mostBiddedJobs = useMemo(() => {
    const openJobs = jobs.filter((job) => {
      const status = String(job?.status || "open").toLowerCase();

      return (
        status === "open" ||
        status === "pending" ||
        status === "active"
      );
    });

    return [...openJobs]
      .map((job) => {
        const bidCount =
          typeof job?.bidCount === "number"
            ? job.bidCount
            : Array.isArray(job?.bids)
            ? job.bids.length
            : Array.isArray(job?.bid)
            ? job.bid.length
            : 0;

        return {
          ...job,
          bidCount,
        };
      })
      .sort((a, b) => b.bidCount - a.bidCount)
      .slice(0, 10);
  }, [jobs]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* HEADER */}
        <HomeHeader />

        {/* SEARCH */}
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search services, workers..."
          onFilterPress={() => {
            console.log("Filter");
          }}
        />

        {/* CATEGORIES */}
        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
              />
            ) : (
              categories.map((item) => (
                <CategoryCard
                  key={item.id}
                  id={item.id}
                  emoji={item.emoji}
                  title={item.title}
                  onPress={handleCategoryPress}
                />
              ))
            )}
          </ScrollView>
        </View>

        {/* HOME BANNER */}
        <HomeBanner />

        {/* EMERGENCY */}
        <TouchableOpacity
          style={styles.emergencyBanner}
          activeOpacity={0.9}
          onPress={() =>
            router.push("/customer/emergency" as any)
          }
        >
          <View style={styles.emergencyIcon}>
            <Ionicons
              name="flash"
              size={22}
              color="#fff"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>
              Emergency Services
            </Text>

            <Text style={styles.emergencySub}>
              Roadside help, urgent repair — nearest workers
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        {/* NEARBY EMERGENCY */}
        {emergencyServices.length > 0 && (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.heading}>
                Nearby Emergency
              </Text>

              <TouchableOpacity
                onPress={() =>
                  router.push("/customer/emergency" as any)
                }
              >
                <Text style={styles.seeAll}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            {emergencyServices.slice(0, 3).map((item) => (
              <ServiceCard
                key={item.id}
                title={item.title}
                category={item.category}
                price={`From ৳${item.price}`}
                rating={String(
                  item.workerRating ??
                    item.rating ??
                    "5.0"
                )}
                city={item.city}
                image={item.images?.[0] || item.image}
                isEmergency
                distanceText={getDistanceText(item)}
                workerName={item.workerName}
                onPress={() =>
                  handleServicePress(item)
                }
                onBook={() =>
                  handleServicePress(item)
                }
              />
            ))}
          </>
        )}

        {/* POPULAR WORKERS */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>
            Popular Workers
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
        ) : workers.length === 0 ? (
          <Text style={styles.emptyText}>
            No workers found
          </Text>
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
              experience={
                worker.experience ?? "2 Years"
              }
              image={worker.photoURL}
              onPress={handleWorkerPress}
            />
          ))
        )}

        {/* POPULAR SERVICES */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>
            Popular Services
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
        ) : filteredServices.length === 0 ? (
          <Text style={styles.emptyText}>
            No services found
          </Text>
        ) : (
          filteredServices.map((item) => (
            <ServiceCard
              key={item.id}
              title={item.title}
              category={item.category}
              price={`Starting ৳${item.price}`}
              rating={String(
                item.workerRating ??
                  item.rating ??
                  "5.0"
              )}
              city={item.city}
              image={item.images?.[0] || item.image}
              isEmergency={Boolean(
                item.isEmergency
              )}
              distanceText={getDistanceText(item)}
              workerName={item.workerName}
              onPress={() =>
                handleServicePress(item)
              }
              onBook={() =>
                handleServicePress(item)
              }
            />
          ))
        )}

        {/* MOST BIDDED JOBS */}
        {mostBiddedJobs.length > 0 && (
          <>
            <View style={styles.titleRow}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.fireEmoji}>
                  🔥
                </Text>

                <Text style={styles.heading}>
                  Most Bidded Jobs
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  router.push(
                    "/customer/jobs" as any
                  );
                }}
              >
                <Text style={styles.seeAll}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              snapToInterval={JOB_CARD_WIDTH + 12}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.jobsSliderContent
              }
            >
              {mostBiddedJobs.map((job) => {
                const jobImage =
                  job?.image ||
                  job?.images?.[0] ||
                  job?.coverImage ||
                  job?.thumbnail ||
                  null;

                return (
                  <TouchableOpacity
                    key={job.id}
                    activeOpacity={0.92}
                    style={styles.biddedJobCard}
                    onPress={() =>
                      handleJobPress(job.id)
                    }
                  >
                    <View
                      style={styles.jobImageContainer}
                    >
                      {jobImage ? (
                        <Image
                          source={{
                            uri: String(jobImage),
                          }}
                          style={styles.jobImage}
                        />
                      ) : (
                        <View
                          style={
                            styles.jobImagePlaceholder
                          }
                        >
                          <Ionicons
                            name="briefcase-outline"
                            size={42}
                            color="#94A3B8"
                          />
                        </View>
                      )}

                      <View
                        style={styles.bidBadge}
                      >
                        <Ionicons
                          name="flame"
                          size={15}
                          color="#fff"
                        />

                        <Text
                          style={styles.bidBadgeText}
                        >
                          {job.bidCount} Bids
                        </Text>
                      </View>

                      <View
                        style={styles.openBadge}
                      >
                        <View
                          style={
                            styles.openDot
                          }
                        />

                        <Text
                          style={styles.openBadgeText}
                        >
                          Open
                        </Text>
                      </View>
                    </View>

                    <View
                      style={styles.jobContent}
                    >
                      <Text
                        style={styles.jobTitle}
                        numberOfLines={2}
                      >
                        {job.title ||
                          "Service Job"}
                      </Text>

                      <View
                        style={
                          styles.jobCategoryRow
                        }
                      >
                        <Ionicons
                          name="grid-outline"
                          size={15}
                          color="#64748B"
                        />

                        <Text
                          style={
                            styles.jobCategory
                          }
                          numberOfLines={1}
                        >
                          {job.category ||
                            "General Service"}
                        </Text>
                      </View>

                      <View
                        style={styles.jobInfoRow}
                      >
                        <View
                          style={
                            styles.jobInfoItem
                          }
                        >
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color={
                              COLORS.primary
                            }
                          />

                          <Text
                            style={
                              styles.jobInfoText
                            }
                            numberOfLines={1}
                          >
                            {getDistanceText(
                              job
                            ) ||
                              job.city ||
                              "Location"}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.jobInfoItem
                          }
                        >
                          <Ionicons
                            name="cash-outline"
                            size={16}
                            color="#16A34A"
                          />

                          <Text
                            style={[
                              styles.jobInfoText,
                              styles.budgetText,
                            ]}
                            numberOfLines={1}
                          >
                            ৳
                            {job.budget ??
                              job.price ??
                              "Negotiable"}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={
                          styles.viewJobRow
                        }
                      >
                        <Text
                          style={
                            styles.viewJobText
                          }
                        >
                          View Job
                        </Text>

                        <Ionicons
                          name="arrow-forward"
                          size={18}
                          color={
                            COLORS.primary
                          }
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
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

  categorySection: {
    marginTop: 16,
    marginBottom: 8,
  },

  categoryScroll: {
    paddingRight: 10,
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

  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  fireEmoji: {
    fontSize: 21,
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

  emptyText: {
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 10,
  },

  jobsSliderContent: {
    paddingRight: 8,
  },

  biddedJobCard: {
    width: JOB_CARD_WIDTH,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  jobImageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
    backgroundColor: "#E2E8F0",
  },

  jobImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  jobImagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E2E8F0",
  },

  bidBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#EF4444",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  bidBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  openBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  openDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: "#16A34A",
  },

  openBadgeText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "800",
  },

  jobContent: {
    padding: 16,
  },

  jobTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    lineHeight: 24,
  },

  jobCategoryRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  jobCategory: {
    flex: 1,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  jobInfoRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  jobInfoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  jobInfoText: {
    flex: 1,
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },

  budgetText: {
    color: "#15803D",
    fontWeight: "800",
  },

  viewJobRow: {
    marginTop: 16,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  viewJobText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },
});