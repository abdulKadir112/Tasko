import { useState } from "react";
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
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/*
 * ⭐⭐⭐ CRITICAL FIX ⭐⭐⭐
 *
 * আগে এখানে "@/services/job.service" থেকে createJob
 * ইমপোর্ট হতো, যেটা শুধু "jobs" কালেকশনে একটা entry
 * তৈরি করত — "bookings" কালেকশনে কিছুই তৈরি করত না।
 * তাই worker-এর Bookings ট্যাবে (যেটা শুধু "bookings"
 * কালেকশন থেকে ডেটা নেয়) এই booking কখনো দেখা যেত না।
 *
 * এখন সঠিক createBooking() ব্যবহার করা হচ্ছে, যেটা
 * serviceId দিয়ে সরাসরি "bookings" কালেকশনে entry
 * তৈরি করে — এটাই আসল fix।
 */
import { createBooking } from "@/services/booking.service";

import { COLORS } from "@/theme";

export default function BookWorkerScreen() {
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams();

  /*
   * ⭐ NEW — এই স্ক্রিনে আসতে হলে এখন অবশ্যই serviceId
   * পাস করতে হবে। যেই স্ক্রিন থেকে "Book Now" বাটন চাপা
   * হয় (worker profile / service details), সেখান থেকে
   * router.push({ pathname: "...book-worker", params: {
   * serviceId, workerId, workerName, category, price,
   * city } }) — এভাবে serviceId পাঠাতে হবে।
   */

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

  const city = Array.isArray(params.city)
    ? params.city[0]
    : params.city || "";

  const [description, setDescription] = useState("");

  const [address, setAddress] = useState("");

  const [phone, setPhone] = useState("");

  const [urgency, setUrgency] = useState<
    "normal" | "urgent"
  >("normal");

  const [booking, setBooking] = useState(false);

  async function handleBooking() {
    /*
     * ⭐ NEW VALIDATION
     *
     * serviceId ছাড়া booking করা যাবে না, কারণ backend-এর
     * createBooking() endpoint একটা নির্দিষ্ট published
     * service-এর সাথে booking জুড়ে দেয়।
     */

    if (!serviceId) {
      Alert.alert(
        "Error",
        "Service information is missing. Please open this screen from a service's details page."
      );
      return;
    }

    if (!workerId) {
      Alert.alert(
        "Error",
        "Worker information is missing."
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        "Required",
        "Please describe what service you need."
      );
      return;
    }

    if (!address.trim()) {
      Alert.alert(
        "Required",
        "Please enter your service address."
      );
      return;
    }

    try {
      setBooking(true);

      console.log(
        "========== SERVICE BOOKING =========="
      );

      console.log("SERVICE ID =", serviceId);
      console.log("WORKER =", workerName);

      /*
       * ⭐⭐⭐ CORE FIX ⭐⭐⭐
       * createJob() এর বদলে সঠিক createBooking() কল
       */

      const response = await createBooking({
        serviceId: String(serviceId),

        customerMessage: description.trim(),

        address: address.trim(),

        phone: phone.trim() || undefined,

        urgency,
      });

      console.log(
        "BOOKING RESPONSE =",
        response
      );

      if (!response.success) {
        Alert.alert(
          "Booking Failed",
          response.message ||
            "Unable to book this worker."
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
              router.replace(
                "/customer/(tabs)/jobs"
              );
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "BOOK WORKER ERROR =",
        error?.response?.data || error
      );

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            paddingTop:
              Math.max(insets.top, 12),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#0F172A"
          />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            Book Worker
          </Text>

          <Text style={styles.headerSub}>
            Direct booking
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              40 + insets.bottom,
          },
        ]}
      >
        {/* WORKER CARD */}
        <View style={styles.workerCard}>
          <View style={styles.workerIcon}>
            <Ionicons
              name="person"
              size={25}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.workerInfo}>
            <Text style={styles.workerLabel}>
              Booking worker
            </Text>

            <Text style={styles.workerName}>
              {workerName}
            </Text>

            <Text style={styles.workerCategory}>
              {category || "General Service"}
            </Text>
          </View>

          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>
              Price
            </Text>

            <Text style={styles.price}>
              ৳{price}
            </Text>
          </View>
        </View>

        {/* INFO */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={20}
            color={COLORS.primary}
          />

          <Text style={styles.infoText}>
            This booking will be sent directly to{" "}
            <Text style={styles.infoBold}>
              {workerName}
            </Text>
            {" "}for this service at the listed price.
          </Text>
        </View>

        {/* DESCRIPTION */}
        <Text style={styles.label}>
          Service Details *
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.textArea,
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder="Explain what you need..."
          placeholderTextColor="#94A3B8"
          multiline
        />

        {/* ADDRESS */}
        <Text style={styles.label}>
          Service Address *
        </Text>

        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="House, road, area..."
          placeholderTextColor="#94A3B8"
        />

        {/* CITY */}
        <Text style={styles.label}>
          City
        </Text>

        <TextInput
          style={styles.input}
          value={city}
          editable={false}
          placeholder="City"
          placeholderTextColor="#94A3B8"
        />

        {/* PHONE */}
        <Text style={styles.label}>
          Contact Phone
        </Text>

        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="01XXXXXXXXX"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
        />

        {/* URGENCY */}
        <Text style={styles.label}>
          Service Priority
        </Text>

        <View style={styles.urgencyRow}>
          <TouchableOpacity
            style={[
              styles.urgencyButton,
              urgency === "normal" &&
                styles.normalActive,
            ]}
            onPress={() =>
              setUrgency("normal")
            }
          >
            <Ionicons
              name="time-outline"
              size={18}
              color={
                urgency === "normal"
                  ? COLORS.primary
                  : "#64748B"
              }
            />

            <Text
              style={[
                styles.urgencyText,
                urgency === "normal" &&
                  styles.normalText,
              ]}
            >
              Normal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.urgencyButton,
              urgency === "urgent" &&
                styles.urgentActive,
            ]}
            onPress={() =>
              setUrgency("urgent")
            }
          >
            <Ionicons
              name="flash"
              size={18}
              color={
                urgency === "urgent"
                  ? "#DC2626"
                  : "#64748B"
              }
            />

            <Text
              style={[
                styles.urgencyText,
                urgency === "urgent" &&
                  styles.urgentText,
              ]}
            >
              Urgent
            </Text>
          </TouchableOpacity>
        </View>

        {/* BOOK */}
        <TouchableOpacity
          style={[
            styles.bookButton,
            booking && styles.disabled,
          ]}
          onPress={handleBooking}
          disabled={booking}
          activeOpacity={0.85}
        >
          {booking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="calendar"
                size={21}
                color="#fff"
              />

              <Text style={styles.bookButtonText}>
                Confirm Booking
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.bottomNote}>
          The worker will receive this booking with your
          contact and service details.
        </Text>
      </ScrollView>
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

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  headerInfo: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },

  headerSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  content: {
    padding: 20,
  },

  workerCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  workerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  workerInfo: {
    flex: 1,
    marginLeft: 12,
  },

  workerLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
  },

  workerName: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  workerCategory: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  priceBox: {
    alignItems: "flex-end",
  },

  priceLabel: {
    fontSize: 11,
    color: "#94A3B8",
  },

  price: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "800",
    color: "#16A34A",
  },

  infoBox: {
    marginTop: 14,
    padding: 13,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    gap: 9,
  },

  infoText: {
    flex: 1,
    color: "#475569",
    fontSize: 12,
    lineHeight: 19,
  },

  infoBold: {
    fontWeight: "800",
    color: "#0F172A",
  },

  label: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#0F172A",
  },

  textArea: {
    height: 115,
    textAlignVertical: "top",
  },

  urgencyRow: {
    flexDirection: "row",
    gap: 10,
  },

  urgencyButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  normalActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#EFF6FF",
  },

  urgentActive: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  urgencyText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748B",
  },

  normalText: {
    color: COLORS.primary,
  },

  urgentText: {
    color: "#DC2626",
  },

  bookButton: {
    marginTop: 24,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  disabled: {
    opacity: 0.65,
  },

  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  bottomNote: {
    marginTop: 10,
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
  },
});