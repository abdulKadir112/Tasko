import { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Linking,
  Alert,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ServiceCard from "@/components/home/ServiceCard";

import {
  getEmergencyServices,
} from "@/services/service.service";

import {
  getCurrentCoords,
  getDistanceKm,
  formatDistance,
} from "@/services/location.service";

import { COLORS } from "@/theme";

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();

  const [services, setServices] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [myCoords, setMyCoords] =
    useState<{
      lat: number;
      lng: number;
    } | null>(null);

  useEffect(() => {
    load();
  }, []);

  // =========================================================
  // LOAD EMERGENCY SERVICES
  // =========================================================

  async function load() {
    try {
      setLoading(true);

      let coords = null;

      try {
        coords =
          await getCurrentCoords();

        setMyCoords(coords);
      } catch (e) {
        console.log(
          "LOCATION ERROR =",
          e
        );
      }

      const res =
        await getEmergencyServices();

      let list =
        res.data ?? res ?? [];

      // -------------------------------------------------------
      // Sort by nearest distance
      // -------------------------------------------------------

      if (coords) {
        list = [...list].sort(
          (a: any, b: any) => {
            if (
              typeof a.lat !== "number" ||
              typeof a.lng !== "number"
            ) {
              return 1;
            }

            if (
              typeof b.lat !== "number" ||
              typeof b.lng !== "number"
            ) {
              return -1;
            }

            const da =
              getDistanceKm(
                coords.lat,
                coords.lng,
                a.lat,
                a.lng
              );

            const db =
              getDistanceKm(
                coords.lat,
                coords.lng,
                b.lat,
                b.lng
              );

            return da - db;
          }
        );
      }

      setServices(list);
    } catch (e) {
      console.log(
        "EMERGENCY SERVICES ERROR =",
        e
      );

      Alert.alert(
        "Error",
        "Unable to load emergency services"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // DISTANCE
  // =========================================================

  function distanceText(item: any) {
    if (
      !myCoords ||
      typeof item.lat !== "number" ||
      typeof item.lng !== "number"
    ) {
      return (
        item.city ||
        "Location N/A"
      );
    }

    return formatDistance(
      getDistanceKm(
        myCoords.lat,
        myCoords.lng,
        item.lat,
        item.lng
      )
    );
  }

  // =========================================================
  // CALL WORKER
  // =========================================================

  async function callWorker(
    phone?: string
  ) {
    if (!phone) {
      Alert.alert(
        "Unavailable",
        "Phone number not available"
      );
      return;
    }

    const url = `tel:${phone}`;

    try {
      const can =
        await Linking.canOpenURL(url);

      if (!can) {
        Alert.alert(
          "Error",
          "Cannot open dialer"
        );
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.log(
        "CALL WORKER ERROR =",
        error
      );
    }
  }

  // =========================================================
  // OPEN WORKER PROFILE
  // =========================================================

  function openWorkerProfile(
    item: any
  ) {
    if (!item.workerId) {
      Alert.alert(
        "Unavailable",
        "Worker information not available"
      );
      return;
    }

    router.push({
      pathname:
        "/customer/worker-profile",

      params: {
        id: String(
          item.workerId
        ),

        serviceId: String(
          item.id || ""
        ),

        serviceTitle: String(
          item.title ||
            "Emergency Service"
        ),

        servicePrice: String(
          item.price ?? 0
        ),

        serviceCategory:
          String(
            item.category || ""
          ),
      },
    });
  }

  // =========================================================
  // BOOK SERVICE DIRECTLY
  // =========================================================

  function bookService(
    item: any
  ) {
    if (!item.workerId) {
      Alert.alert(
        "Unavailable",
        "Worker information not available"
      );
      return;
    }

    router.push({
      pathname:
        "/customer/book-worker",

      params: {
        workerId: String(
          item.workerId
        ),

        workerName: String(
          item.workerName ||
            "Emergency Worker"
        ),

        serviceId: String(
          item.id || ""
        ),

        serviceTitle: String(
          item.title ||
            "Emergency Service"
        ),

        servicePrice: String(
          item.price ?? 0
        ),

        category: String(
          item.category || ""
        ),

        city: String(
          item.city || ""
        ),
      },
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
      />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <View
        style={[
          styles.header,
          {
            paddingTop:
              insets.top + 10,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#0F172A"
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <View
              style={styles.emergencyIcon}
            >
              <Ionicons
                name="flash"
                size={15}
                color="#EF4444"
              />
            </View>

            <Text style={styles.title}>
              Emergency
            </Text>
          </View>

          <Text style={styles.sub}>
            Nearest urgent help around you
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={load}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#EF4444"
            />
          ) : (
            <Ionicons
              name="refresh"
              size={18}
              color="#EF4444"
            />
          )}
        </TouchableOpacity>
      </View>

      {/* =====================================================
          INFO BANNER
      ====================================================== */}

      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Ionicons
            name="flash"
            size={20}
            color="#EF4444"
          />
        </View>

        <View style={styles.bannerInfo}>
          <Text style={styles.bannerTitle}>
            Emergency workers
          </Text>

          <Text style={styles.bannerText}>
            You can book the service directly,
            or contact the worker by chat or call.
          </Text>
        </View>
      </View>

      {/* =====================================================
          SERVICES
      ====================================================== */}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#EF4444"
          />

          <Text style={styles.loadingText}>
            Finding emergency workers...
          </Text>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item, index) =>
            String(
              item.id ||
                item._id ||
                index
            )
          }
          contentContainerStyle={{
            padding: 16,
            paddingTop: 6,
            paddingBottom:
              40 + insets.bottom,
          }}
          showsVerticalScrollIndicator={
            false
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View
                style={styles.emptyIcon}
              >
                <Ionicons
                  name="flash-off-outline"
                  size={32}
                  color="#EF4444"
                />
              </View>

              <Text
                style={styles.emptyTitle}
              >
                No emergency services
              </Text>

              <Text
                style={styles.emptySub}
              >
                Workers can publish emergency
                services from their Post tab.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.serviceWrapper}>
              <ServiceCard
                title={
                  item.title ||
                  "Emergency Service"
                }

                category={
                  item.category ||
                  "Emergency"
                }

                price={`From ৳${
                  item.price ?? 0
                }`}

                rating={String(
                  item.workerRating ??
                    "5.0"
                )}

                city={item.city}

                image={
                  item.images?.[0]
                }

                isEmergency

                distanceText={distanceText(
                  item
                )}

                workerName={
                  item.workerName
                }

                onPress={() =>
                  openWorkerProfile(
                    item
                  )
                }

                /*
                 * IMPORTANT:
                 *
                 * আগে এখানে:
                 *
                 * onBook={() =>
                 *   callWorker(item.workerPhone)
                 * }
                 *
                 * ছিল।
                 *
                 * ফলে Book চাপলে Call হচ্ছিল।
                 *
                 * এখন Book = Direct Booking.
                 */

                onBook={() =>
                  bookService(item)
                }
              />

              {/* =================================================
                  CONTACT BUTTONS
              ================================================== */}

              <View
                style={
                  styles.contactRow
                }
              >
                <TouchableOpacity
                  style={
                    styles.contactChat
                  }
                  onPress={() => {
                    if (
                      !item.workerId
                    ) {
                      Alert.alert(
                        "Unavailable",
                        "Worker information not available"
                      );
                      return;
                    }

                    router.push({
                      pathname:
                        "/shared/chat/room",

                      params: {
                        receiverId:
                          String(
                            item.workerId
                          ),
                      },
                    });
                  }}
                >
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={17}
                    color={
                      COLORS.primary
                    }
                  />

                  <Text
                    style={
                      styles.contactChatText
                    }
                  >
                    Chat
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.contactCall
                  }
                  onPress={() =>
                    callWorker(
                      item.workerPhone
                    )
                  }
                >
                  <Ionicons
                    name="call"
                    size={17}
                    color="#16A34A"
                  />

                  <Text
                    style={
                      styles.contactCallText
                    }
                  >
                    Call
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  headerInfo: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  emergencyIcon: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },

  sub: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  banner: {
    margin: 16,
    marginBottom: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  bannerInfo: {
    flex: 1,
  },

  bannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#991B1B",
  },

  bannerText: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 17,
    color: "#7F1D1D",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  loadingText: {
    color: "#64748B",
    fontWeight: "600",
  },

  serviceWrapper: {
    marginBottom: 14,
  },

  contactRow: {
    marginTop: -4,
    paddingHorizontal: 6,
    flexDirection: "row",
    gap: 8,
  },

  contactChat: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  contactChatText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 13,
  },

  contactCall: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  contactCallText: {
    color: "#16A34A",
    fontWeight: "800",
    fontSize: 13,
  },

  empty: {
    marginTop: 80,
    alignItems: "center",
    paddingHorizontal: 24,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  emptySub: {
    marginTop: 8,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 20,
  },
});