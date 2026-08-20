import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Image,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { createBooking } from "@/services/booking.service";
import { getServiceById } from "@/services/service.service";
import { getWorkerById } from "@/services/worker.service";
import { COLORS } from "@/theme";

// ======================================================
// TYPES
// ======================================================

type ServicePackage = {
  id: "basic" | "standard" | "premium";
  title: string;
  price: number;
  description?: string;
  deliveryHours?: number;
};

// ======================================================
// STORAGE KEYS
// ======================================================

const SAVED_CITY_KEY = "@tasko_saved_city";
const SAVED_PHONE_KEY = "@tasko_saved_phone";

// ======================================================
// SCREEN
// ======================================================

export default function BookWorkerScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // ====================================================
  // ROUTE PARAMS
  // ====================================================

  const serviceId = Array.isArray(params.serviceId)
    ? params.serviceId[0]
    : params.serviceId;

  const workerId = Array.isArray(params.workerId)
    ? params.workerId[0]
    : params.workerId;

  const workerName = Array.isArray(params.workerName)
    ? params.workerName[0]
    : params.workerName || "Worker";

  const category = Array.isArray(params.category)
    ? params.category[0]
    : params.category || "";

  const price = Array.isArray(params.price)
    ? params.price[0]
    : params.price || "0";

  const initialCity = Array.isArray(params.city)
    ? params.city[0]
    : params.city || "";

  const initialWorkerPhoto = Array.isArray(params.workerPhoto)
    ? params.workerPhoto[0]
    : params.workerPhoto || null;

  // ✅ ServiceCard থেকে যেই image আসছে, সেটাই banner-এ ব্যবহার হবে
  const initialServiceImage = Array.isArray(params.image)
    ? params.image[0]
    : params.image || null;

  // ====================================================
  // FORM STATES
  // ====================================================

  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState(String(initialCity));
  const [phone, setPhone] = useState("");

  const [contactInfoLoaded, setContactInfoLoaded] = useState(false);

  const [urgency, setUrgency] = useState<"normal" | "urgent">("normal");
  const [booking, setBooking] = useState(false);

  // ====================================================
  // PACKAGE STATES
  // ====================================================

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] =
    useState<ServicePackage["id"]>("basic");
  const [loadingPackages, setLoadingPackages] = useState(true);

  // ====================================================
  // SERVICE COVER IMAGE (banner background)
  // ====================================================

  // ✅ Card এর image দিয়ে সাথে সাথে initialize
  const [coverImage, setCoverImage] = useState<string | null>(
    initialServiceImage ? String(initialServiceImage) : null
  );

  const serviceRequestRef = useRef(0);

  // ====================================================
  // WORKER PHOTO
  // ====================================================

  const [workerPhotoState, setWorkerPhotoState] = useState<string | null>(
    initialWorkerPhoto ? String(initialWorkerPhoto) : null
  );

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    loadServicePackages();
    loadWorkerPhoto();
    loadSavedContactInfo();

    setWorkerPhotoState(
      initialWorkerPhoto ? String(initialWorkerPhoto) : null
    );

    // ✅ serviceId বদলালে নতুন card image দিয়ে banner reset
    setCoverImage(
      initialServiceImage ? String(initialServiceImage) : null
    );
  }, [serviceId, workerId]);

  // ====================================================
  // LOAD SAVED CITY + PHONE
  // ====================================================

  async function loadSavedContactInfo() {
    try {
      const [savedCity, savedPhone] = await Promise.all([
        AsyncStorage.getItem(SAVED_CITY_KEY),
        AsyncStorage.getItem(SAVED_PHONE_KEY),
      ]);

      if (savedCity !== null) {
        setCity(savedCity);
      } else {
        setCity(String(initialCity || ""));
      }

      if (savedPhone !== null) {
        setPhone(savedPhone);
      }
    } catch (error) {
      console.log("LOAD SAVED CONTACT INFO ERROR =", error);
    } finally {
      setContactInfoLoaded(true);
    }
  }

  // ====================================================
  // AUTO SAVE CITY
  // ====================================================

  useEffect(() => {
    if (!contactInfoLoaded) return;

    async function saveCity() {
      try {
        await AsyncStorage.setItem(SAVED_CITY_KEY, city);
      } catch (error) {
        console.log("SAVE CITY ERROR =", error);
      }
    }

    saveCity();
  }, [city, contactInfoLoaded]);

  // ====================================================
  // AUTO SAVE PHONE
  // ====================================================

  useEffect(() => {
    if (!contactInfoLoaded) return;

    async function savePhone() {
      try {
        await AsyncStorage.setItem(SAVED_PHONE_KEY, phone);
      } catch (error) {
        console.log("SAVE PHONE ERROR =", error);
      }
    }

    savePhone();
  }, [phone, contactInfoLoaded]);

  // ====================================================
  // EXTRACT IMAGE URL (fallback only)
  // ====================================================

  function extractImageUrl(service: any): string | null {
    if (!service) return null;

    const directFields = [
      service.coverImage,
      service.bannerImage,
      service.image,
      service.imageUrl,
      service.coverImageUrl,
      service.thumbnail,
      service.thumbnailUrl,
    ];

    for (const value of directFields) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    if (Array.isArray(service.images)) {
      for (const item of service.images) {
        if (typeof item === "string" && item.trim()) {
          return item.trim();
        }

        if (item && typeof item === "object") {
          const possibleUrl =
            item.url ||
            item.secure_url ||
            item.secureUrl ||
            item.imageUrl ||
            item.src;

          if (typeof possibleUrl === "string" && possibleUrl.trim()) {
            return possibleUrl.trim();
          }
        }
      }
    }

    if (service.image && typeof service.image === "object") {
      const possibleUrl =
        service.image.url ||
        service.image.secure_url ||
        service.image.secureUrl ||
        service.image.imageUrl ||
        service.image.src;

      if (typeof possibleUrl === "string" && possibleUrl.trim()) {
        return possibleUrl.trim();
      }
    }

    if (service.coverImage && typeof service.coverImage === "object") {
      const possibleUrl =
        service.coverImage.url ||
        service.coverImage.secure_url ||
        service.coverImage.secureUrl ||
        service.coverImage.imageUrl ||
        service.coverImage.src;

      if (typeof possibleUrl === "string" && possibleUrl.trim()) {
        return possibleUrl.trim();
      }
    }

    return null;
  }

  // ====================================================
  // NORMALIZE SERVICE RESPONSE
  // ====================================================

  function extractServiceData(response: any) {
    let service = response?.data ?? response;

    if (service?.service && typeof service.service === "object") {
      service = service.service;
    }

    if (
      service?.data &&
      typeof service.data === "object" &&
      !Array.isArray(service.data)
    ) {
      service = service.data;
    }

    return service;
  }

  // ====================================================
  // LOAD SERVICE + PACKAGES
  // ====================================================

  async function loadServicePackages() {
    const requestId = ++serviceRequestRef.current;

    setPackages([]);
    setSelectedPackageId("basic");

    if (!serviceId) {
      setLoadingPackages(false);
      return;
    }

    try {
      setLoadingPackages(true);

      const response = await getServiceById(String(serviceId));

      if (requestId !== serviceRequestRef.current) return;

      const service = extractServiceData(response);

      // Packages
      const servicePackages = Array.isArray(service?.packages)
        ? service.packages
        : [];

      setPackages(servicePackages);

      if (servicePackages.length > 0) {
        setSelectedPackageId(servicePackages[0].id);
      } else if (price && Number(price) > 0) {
        setPackages([
          {
            id: "basic",
            title: "Basic",
            price: Number(price),
            description: "Basic service",
          },
        ]);
        setSelectedPackageId("basic");
      }

      // ✅ Image priority: Card থেকে আসা image সবসময় প্রথম
      // শুধুমাত্র card image না থাকলে backend থেকে fallback
      if (requestId === serviceRequestRef.current) {
        if (!initialServiceImage) {
          const imageUrl = extractImageUrl(service);
          setCoverImage(imageUrl);
        }
      }
    } catch (error) {
      console.log("LOAD SERVICE PACKAGES ERROR =", error);

      if (requestId !== serviceRequestRef.current) return;

      if (price && Number(price) > 0) {
        setPackages([
          {
            id: "basic",
            title: "Basic",
            price: Number(price),
            description: "Basic service",
          },
        ]);
        setSelectedPackageId("basic");
      }
    } finally {
      if (requestId === serviceRequestRef.current) {
        setLoadingPackages(false);
      }
    }
  }

  // ====================================================
  // LOAD WORKER PHOTO
  // ====================================================

  async function loadWorkerPhoto() {
    if (!workerId) return;

    try {
      const response = await getWorkerById(String(workerId));
      const workerData = response?.data ?? response;

      const photo =
        typeof workerData?.photoURL === "string" && workerData.photoURL.trim()
          ? workerData.photoURL.trim()
          : typeof workerData?.avatar === "string" && workerData.avatar.trim()
          ? workerData.avatar.trim()
          : null;

      if (photo) {
        setWorkerPhotoState(photo);
      }
    } catch (error) {
      console.log("LOAD WORKER PHOTO ERROR =", error);
    }
  }

  // ====================================================
  // HANDLE BOOKING
  // ====================================================

  async function handleBooking() {
    if (booking) return;

    if (!serviceId) {
      Alert.alert(
        "Error",
        "Service information is missing. Please open this screen from a service's details page."
      );
      return;
    }

    if (!workerId) {
      Alert.alert("Error", "Worker information is missing.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Required", "Please describe what service you need.");
      return;
    }

    if (!address.trim()) {
      Alert.alert("Required", "Please enter your service address.");
      return;
    }

    const selectedPackage = packages.find(
      (pkg) => pkg.id === selectedPackageId
    );

    if (!selectedPackage) {
      Alert.alert("Required", "Please select a package.");
      return;
    }

    try {
      setBooking(true);

      await Promise.all([
        AsyncStorage.setItem(SAVED_CITY_KEY, city.trim()),
        AsyncStorage.setItem(SAVED_PHONE_KEY, phone.trim()),
      ]);

      const response = await createBooking({
        serviceId: String(serviceId),
        customerMessage: description.trim(),
        address: address.trim(),
        city: city.trim() || undefined,
        phone: phone.trim() || undefined,
        urgency,
        packageId: selectedPackage.id,
        packageTitle: selectedPackage.title,
        packagePrice: selectedPackage.price,
        packageDeliveryHours: selectedPackage.deliveryHours,
        selectedPackage: {
          id: selectedPackage.id,
          title: selectedPackage.title,
          price: selectedPackage.price,
          description: selectedPackage.description,
          deliveryHours: selectedPackage.deliveryHours,
        },
      });

      if (!response.success) {
        Alert.alert(
          "Booking Failed",
          response.message || "Unable to book this worker."
        );
        return;
      }

      Alert.alert(
        "Booking Successful",
        `Your booking has been sent to ${workerName}.`,
        [
          {
            text: "View My Bookings",
            onPress: () => {
              router.replace("/customer/(tabs)/jobs");
            },
          },
        ]
      );
    } catch (error: any) {
      console.log("BOOK WORKER ERROR =", error?.response?.data || error);

      Alert.alert(
        "Booking Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to book this worker."
      );
    } finally {
      setBooking(false);
    }
  }

  // ====================================================
  // ACTIVE PACKAGE
  // ====================================================

  const activePackage = packages.find(
    (pkg) => pkg.id === selectedPackageId
  );

  // ====================================================
  // UI
  // ====================================================

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Book Worker</Text>
          <Text style={styles.headerSub}>Direct booking request</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: 40 + insets.bottom,
          }}
        >
          {/* ==================================================
              BANNER (ServiceCard এর same image ব্যবহার করছে)
          ================================================== */}
          <View style={styles.bannerWrapper}>
            <ImageBackground
              key={`service-banner-${String(serviceId || "none")}`}
              source={
                coverImage
                  ? { uri: coverImage }
                  : undefined
              }
              style={styles.banner}
              resizeMode="cover"
              imageStyle={styles.bannerImage}
            >
              {/* Dark overlay */}
              <View style={styles.bannerOverlay} />

              {/* Fallback when no image */}
              {!coverImage && (
                <View style={styles.bannerFallback}>
                  <Ionicons
                    name="image-outline"
                    size={34}
                    color="#64748B"
                  />
                </View>
              )}

              {/* Banner content */}
              <View style={styles.bannerContent}>
                {/* Worker info */}
                <View style={styles.bannerLeft}>
                  <View style={styles.workerAvatar}>
                    {workerPhotoState ? (
                      <Image
                        source={{ uri: String(workerPhotoState) }}
                        style={styles.workerAvatarImage}
                        onError={() => setWorkerPhotoState(null)}
                      />
                    ) : (
                      <Ionicons name="person" size={26} color="#FFFFFF" />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.bannerLabel}>BOOKING WORKER</Text>
                    <Text style={styles.bannerName} numberOfLines={1}>
                      {workerName}
                    </Text>

                    <View style={styles.categoryBadge}>
                      <Text style={styles.bannerCategory} numberOfLines={1}>
                        {category || "General Service"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Price */}
                <View style={styles.bannerPriceBox}>
                  <Text style={styles.bannerPriceLabel}>Selected Price</Text>
                  <Text style={styles.bannerPrice}>
                    ৳{activePackage?.price ?? price}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </View>

          {/* FORM CONTENT */}
          <View style={styles.content}>
            {/* Info box */}
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle"
                size={20}
                color={COLORS.primary || "#2563EB"}
              />
              <Text style={styles.infoText}>
                This booking will be sent directly{" "}
                <Text style={styles.infoBold}>{workerName}</Text> for this
                service at the selected package price.
              </Text>
            </View>

            {/* Packages */}
            <Text style={styles.label}>Select Package *</Text>

            {loadingPackages ? (
              <View style={styles.packageLoading}>
                <ActivityIndicator color={COLORS.primary || "#2563EB"} />
                <Text style={styles.packageLoadingText}>
                  Loading packages...
                </Text>
              </View>
            ) : packages.length === 0 ? (
              <View style={styles.noPackageBox}>
                <Ionicons name="cube-outline" size={22} color="#94A3B8" />
                <Text style={styles.noPackageText}>No packages available</Text>
              </View>
            ) : (
              <View style={styles.packageList}>
                {packages.map((pkg) => {
                  const active = selectedPackageId === pkg.id;

                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[
                        styles.packageCard,
                        active && styles.packageCardActive,
                      ]}
                      onPress={() => setSelectedPackageId(pkg.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.packageTop}>
                        <View style={styles.packageTitleRow}>
                          <View
                            style={[
                              styles.radio,
                              active && styles.radioActive,
                            ]}
                          >
                            {active && <View style={styles.radioDot} />}
                          </View>

                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.packageTitle,
                                active && styles.packageTitleActive,
                              ]}
                            >
                              {pkg.title}
                            </Text>

                            {pkg.deliveryHours ? (
                              <View style={styles.deliveryBadge}>
                                <Ionicons
                                  name="time-outline"
                                  size={12}
                                  color="#64748B"
                                />
                                <Text style={styles.packageDelivery}>
                                  {pkg.deliveryHours} hrs estimated
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        <Text style={styles.packagePrice}>৳{pkg.price}</Text>
                      </View>

                      {pkg.description ? (
                        <Text style={styles.packageDescription}>
                          {pkg.description}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Description */}
            <Text style={styles.label}>Service Details *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Explain what specific work or service you need..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
            />

            {/* Address */}
            <Text style={styles.label}>Service Address *</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="House no, road, block, area..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="sentences"
            />

            {/* City */}
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              editable={true}
              placeholder="City"
              placeholderTextColor="#94A3B8"
              autoCapitalize="words"
              autoCorrect={false}
            />

            {/* Phone */}
            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="01XXXXXXXXX"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              editable={true}
            />

            {/* Urgency */}
            <Text style={styles.label}>Service Priority</Text>
            <View style={styles.urgencyRow}>
              <TouchableOpacity
                style={[
                  styles.urgencyButton,
                  urgency === "normal" && styles.normalActive,
                ]}
                onPress={() => setUrgency("normal")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={
                    urgency === "normal"
                      ? COLORS.primary || "#2563EB"
                      : "#64748B"
                  }
                />
                <Text
                  style={[
                    styles.urgencyText,
                    urgency === "normal" && styles.normalText,
                  ]}
                >
                  Normal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.urgencyButton,
                  urgency === "urgent" && styles.urgentActive,
                ]}
                onPress={() => setUrgency("urgent")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="flash"
                  size={18}
                  color={urgency === "urgent" ? "#DC2626" : "#64748B"}
                />
                <Text
                  style={[
                    styles.urgencyText,
                    urgency === "urgent" && styles.urgentText,
                  ]}
                >
                  Urgent
                </Text>
              </TouchableOpacity>
            </View>

            {/* Book Button */}
            <TouchableOpacity
              style={[styles.bookButton, booking && styles.disabled]}
              onPress={handleBooking}
              disabled={booking}
              activeOpacity={0.85}
            >
              {booking ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.bookButtonText}>Sending Booking...</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={22}
                    color="#FFFFFF"
                  />
                  <Text style={styles.bookButtonText}>Confirm Booking</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.bottomNote}>
              The worker will receive this booking with your contact and
              service details.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 10,
  },

  backButton: {
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

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  headerSub: {
    marginTop: 1,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Banner
  bannerWrapper: {
    width: "100%",
    backgroundColor: "#0F172A",
  },

  banner: {
    width: "100%",
    height: 150,
    justifyContent: "flex-end",
  },

  bannerImage: {
    width: "100%",
    height: "100%",
  },

  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
  },

  bannerFallback: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E2E8F0",
  },

  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    zIndex: 2,
  },

  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
    minWidth: 0,
  },

  workerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  workerAvatarImage: {
    width: "100%",
    height: "100%",
  },

  bannerLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  bannerName: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  categoryBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  bannerCategory: {
    fontSize: 11,
    color: "#F1F5F9",
    fontWeight: "600",
  },

  bannerPriceBox: {
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginLeft: 10,
  },

  bannerPriceLabel: {
    fontSize: 10,
    color: "#CBD5E1",
    fontWeight: "500",
  },

  bannerPrice: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "800",
    color: "#4ADE80",
  },

  // Info box
  infoBox: {
    marginTop: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  infoText: {
    flex: 1,
    color: "#1E40AF",
    fontSize: 12.5,
    lineHeight: 18,
  },

  infoBold: {
    fontWeight: "700",
    color: "#1E3A8A",
  },

  label: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    letterSpacing: 0.2,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
  },

  textArea: {
    height: 100,
    textAlignVertical: "top",
  },

  packageLoading: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  packageLoadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },

  noPackageBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  noPackageText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "600",
  },

  packageList: {
    gap: 10,
  },

  packageCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
  },

  packageCardActive: {
    borderColor: COLORS.primary || "#2563EB",
    backgroundColor: "#F8FAFC",
  },

  packageTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  packageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  radioActive: {
    borderColor: COLORS.primary || "#2563EB",
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary || "#2563EB",
  },

  packageTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  packageTitleActive: {
    color: COLORS.primary || "#2563EB",
  },

  deliveryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },

  packageDelivery: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },

  packagePrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#16A34A",
    marginLeft: 10,
  },

  packageDescription: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    fontSize: 12.5,
    color: "#64748B",
    lineHeight: 18,
  },

  urgencyRow: {
    flexDirection: "row",
    gap: 12,
  },

  urgencyButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  normalActive: {
    borderColor: COLORS.primary || "#2563EB",
    backgroundColor: "#EFF6FF",
  },

  urgentActive: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  urgencyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  normalText: {
    color: COLORS.primary || "#2563EB",
    fontWeight: "700",
  },

  urgentText: {
    color: "#DC2626",
    fontWeight: "700",
  },

  bookButton: {
    marginTop: 28,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary || "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    shadowColor: COLORS.primary || "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },

  disabled: {
    opacity: 0.65,
  },

  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  bottomNote: {
    marginTop: 8,
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 11.5,
    lineHeight: 16,
  },
});