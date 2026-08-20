import { useCallback, useState } from "react";
import {
  SafeAreaView,
  FlatList,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { getMyBids } from "@/services/bid.service";

import {
  getWorkerBookings,
  acceptBooking,
  rejectBooking,
  proposeBookingTime,
  startBooking,
  completeBooking,
  Booking,
} from "@/services/booking.service";

import { COLORS } from "@/theme";

type TabType = "bookings" | "bids";

export default function WorkerJobs() {
  const [activeTab, setActiveTab] =
    useState<TabType>("bookings");

  const [bids, setBids] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [scheduleModal, setScheduleModal] =
    useState(false);

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [workerMessage, setWorkerMessage] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  /* =====================================================
     LOAD DATA
  ===================================================== */

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      setLoading(true);

      const [bidRes, bookingRes] =
        await Promise.all([
          getMyBids(),
          getWorkerBookings(),
        ]);

      console.log(
        "========== MY BIDS RESPONSE =========="
      );

      console.log(
        JSON.stringify(bidRes, null, 2)
      );

      console.log(
        "========== WORKER BOOKINGS RESPONSE =========="
      );

      console.log(
        JSON.stringify(bookingRes, null, 2)
      );

      const bidData = extractArray(bidRes);

      const bookingData =
        extractArray(bookingRes);

      setBids(bidData);

      setBookings(
        bookingData as Booking[]
      );
    } catch (error: any) {
      console.log(
        "WORKER JOBS LOAD ERROR =",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Error",
        "Failed to load jobs."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     EXTRACT ARRAY
  ===================================================== */

  function extractArray(
    response: any
  ): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (
      Array.isArray(
        response?.data?.data
      )
    ) {
      return response.data.data;
    }

    if (
      Array.isArray(
        response?.data?.items
      )
    ) {
      return response.data.items;
    }

    if (
      Array.isArray(response?.items)
    ) {
      return response.items;
    }

    if (
      Array.isArray(response?.results)
    ) {
      return response.results;
    }

    return [];
  }

  /* =====================================================
     REFRESH
  ===================================================== */

  async function onRefresh() {
    try {
      setRefreshing(true);

      const [bidRes, bookingRes] =
        await Promise.all([
          getMyBids(),
          getWorkerBookings(),
        ]);

      console.log(
        "========== REFRESH BIDS =========="
      );

      console.log(
        JSON.stringify(bidRes, null, 2)
      );

      const bidData = extractArray(bidRes);

      const bookingData =
        extractArray(bookingRes);

      setBids(bidData);

      setBookings(
        bookingData as Booking[]
      );
    } catch (error: any) {
      console.log(
        "REFRESH ERROR =",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Error",
        "Failed to refresh jobs."
      );
    } finally {
      setRefreshing(false);
    }
  }

  /* =====================================================
     ACCEPT BOOKING
  ===================================================== */

  async function handleAcceptBooking(
    booking: Booking
  ) {
    try {
      setActionLoading(true);

      const response =
        await acceptBooking(
          booking.id
        );

      if (!response.success) {
        Alert.alert(
          "Error",
          response.message ||
            "Failed to accept booking"
        );

        return;
      }

      setBookings((prev) =>
        prev.map((item) =>
          item.id === booking.id
            ? {
                ...item,
                status: "accepted",
                workerAcceptedAt:
                  new Date(),
              }
            : item
        )
      );

      Alert.alert(
        "Booking Accepted",
        "Now choose a date and time for the customer."
      );
    } catch (error: any) {
      console.log(
        "ACCEPT ERROR =",
        error?.response?.data ||
          error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to accept booking"
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =====================================================
     REJECT BOOKING
  ===================================================== */

  async function handleRejectBooking(
    booking: Booking
  ) {
    Alert.alert(
      "Reject Booking",
      "Are you sure you want to reject this booking?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Reject",
          style: "destructive",

          onPress: async () => {
            try {
              setActionLoading(true);

              const response =
                await rejectBooking(
                  booking.id
                );

              if (!response.success) {
                Alert.alert(
                  "Error",
                  response.message ||
                    "Failed to reject booking"
                );

                return;
              }

              setBookings((prev) =>
                prev.map((item) =>
                  item.id === booking.id
                    ? {
                        ...item,
                        status:
                          "rejected",
                      }
                    : item
                )
              );
            } catch (error: any) {
              console.log(
                "REJECT ERROR =",
                error?.response?.data ||
                  error
              );

              Alert.alert(
                "Error",
                error?.response?.data
                  ?.message ||
                  "Failed to reject booking"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  /* =====================================================
     OPEN SCHEDULE MODAL
  ===================================================== */

  function openScheduleModal(
    booking: Booking
  ) {
    setSelectedBooking(
      booking
    );

    setDate(
      booking.proposedDate ||
        booking.requestedDate ||
        ""
    );

    setStartTime(
      booking.proposedStartTime ||
        ""
    );

    setEndTime(
      booking.proposedEndTime ||
        ""
    );

    setWorkerMessage(
      booking.workerMessage ||
        ""
    );

    setScheduleModal(true);
  }

  /* =====================================================
     PROPOSE TIME
  ===================================================== */

  async function handleProposeTime() {
    if (!selectedBooking) {
      return;
    }

    if (!date.trim()) {
      Alert.alert(
        "Required",
        "Please enter the service date."
      );

      return;
    }

    if (!startTime.trim()) {
      Alert.alert(
        "Required",
        "Please enter start time."
      );

      return;
    }

    if (!endTime.trim()) {
      Alert.alert(
        "Required",
        "Please enter end time."
      );

      return;
    }

    try {
      setActionLoading(true);

      const response =
        await proposeBookingTime(
          selectedBooking.id,
          {
            date: date.trim(),
            startTime:
              startTime.trim(),
            endTime:
              endTime.trim(),
            message:
              workerMessage.trim(),
          }
        );

      if (!response.success) {
        Alert.alert(
          "Error",
          response.message ||
            "Failed to send schedule"
        );

        return;
      }

      setBookings((prev) =>
        prev.map((item) =>
          item.id ===
          selectedBooking.id
            ? {
                ...item,

                status:
                  "reschedule_requested",

                proposedDate:
                  date.trim(),

                proposedStartTime:
                  startTime.trim(),

                proposedEndTime:
                  endTime.trim(),

                workerMessage:
                  workerMessage.trim(),
              }
            : item
        )
      );

      setScheduleModal(false);

      Alert.alert(
        "Schedule Sent",
        "The customer has been notified."
      );
    } catch (error: any) {
      console.log(
        "PROPOSE TIME ERROR =",
        error?.response?.data ||
          error
      );

      Alert.alert(
        "Error",
        error?.response?.data
          ?.message ||
          "Failed to send schedule"
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =====================================================
     START JOB
  ===================================================== */

  async function handleStartJob(
    booking: Booking
  ) {
    Alert.alert(
      "Start Job",
      "Are you ready to start this service?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Start",

          onPress: async () => {
            try {
              setActionLoading(true);

              const response =
                await startBooking(
                  booking.id
                );

              if (!response.success) {
                Alert.alert(
                  "Error",
                  response.message ||
                    "Failed to start job"
                );

                return;
              }

              setBookings((prev) =>
                prev.map((item) =>
                  item.id ===
                  booking.id
                    ? {
                        ...item,
                        status:
                          "in_progress",
                      }
                    : item
                )
              );
            } catch (error: any) {
              console.log(
                "START JOB ERROR =",
                error?.response?.data ||
                  error
              );

              Alert.alert(
                "Error",
                error?.response?.data
                  ?.message ||
                  "Failed to start job"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  /* =====================================================
     COMPLETE JOB
  ===================================================== */

  async function handleCompleteJob(
    booking: Booking
  ) {
    Alert.alert(
      "Complete Job",
      "Have you completed this service?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Complete",

          onPress: async () => {
            try {
              setActionLoading(true);

              const response =
                await completeBooking(
                  booking.id
                );

              if (!response.success) {
                Alert.alert(
                  "Error",
                  response.message ||
                    "Failed to complete job"
                );

                return;
              }

              setBookings((prev) =>
                prev.map((item) =>
                  item.id ===
                  booking.id
                    ? {
                        ...item,
                        status:
                          "completed",
                      }
                    : item
                )
              );
            } catch (error: any) {
              console.log(
                "COMPLETE JOB ERROR =",
                error?.response?.data ||
                  error
              );

              Alert.alert(
                "Error",
                error?.response?.data
                  ?.message ||
                  "Failed to complete job"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }

  /* =====================================================
     BOOKING STATUS COLOR
  ===================================================== */

  function bookingStatusColor(
    status: string
  ) {
    switch (status) {
      case "pending":
        return "#F59E0B";

      case "accepted":
        return "#2563EB";

      case "rejected":
        return "#EF4444";

      case "reschedule_requested":
        return "#8B5CF6";

      case "confirmed":
        return "#10B981";

      case "in_progress":
        return "#0EA5E9";

      case "completed":
        return "#16A34A";

      case "cancelled":
        return "#64748B";

      default:
        return "#64748B";
    }
  }

  /* =====================================================
     BOOKING STATUS LABEL
  ===================================================== */

  function bookingStatusLabel(
    status: string
  ) {
    switch (status) {
      case "pending":
        return "New Booking";

      case "accepted":
        return "Accepted";

      case "rejected":
        return "Rejected";

      case "reschedule_requested":
        return "Waiting Customer";

      case "confirmed":
        return "Confirmed";

      case "in_progress":
        return "In Progress";

      case "completed":
        return "Completed";

      case "cancelled":
        return "Cancelled";

      default:
        return status;
    }
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Loading jobs...
        </Text>
      </View>
    );
  }

  /* =====================================================
     MAIN
  ===================================================== */

  return (
    <SafeAreaView
      style={styles.container}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View>
          <Text
            style={styles.headerTitle}
          >
            Jobs
          </Text>

          <Text
            style={styles.headerSub}
          >
            Manage your work and bookings
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons
            name="refresh"
            size={21}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* TABS */}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab ===
              "bookings" &&
              styles.activeTab,
          ]}
          onPress={() =>
            setActiveTab(
              "bookings"
            )
          }
        >
          <Ionicons
            name="calendar-outline"
            size={19}
            color={
              activeTab ===
              "bookings"
                ? COLORS.primary
                : "#64748B"
            }
          />

          <Text
            style={[
              styles.tabText,
              activeTab ===
                "bookings" &&
                styles.activeTabText,
            ]}
          >
            Bookings
          </Text>

          {bookings.filter(
            (item) =>
              item.status ===
              "pending"
          ).length > 0 && (
            <View
              style={
                styles.countBadge
              }
            >
              <Text
                style={
                  styles.countText
                }
              >
                {
                  bookings.filter(
                    (item) =>
                      item.status ===
                      "pending"
                  ).length
                }
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "bids" &&
              styles.activeTab,
          ]}
          onPress={() =>
            setActiveTab("bids")
          }
        >
          <Ionicons
            name="briefcase-outline"
            size={19}
            color={
              activeTab === "bids"
                ? COLORS.primary
                : "#64748B"
            }
          />

          <Text
            style={[
              styles.tabText,
              activeTab === "bids" &&
                styles.activeTabText,
            ]}
          >
            My Bids
          </Text>

          {bids.length > 0 && (
            <View
              style={
                styles.bidCountBadge
              }
            >
              <Text
                style={
                  styles.countText
                }
              >
                {bids.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* =================================================
          BOOKINGS
      ================================================= */}

      {activeTab ===
      "bookings" ? (
        <FlatList
          data={bookings}
          keyExtractor={(item) =>
            String(item.id)
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[
                COLORS.primary,
              ]}
            />
          }
          contentContainerStyle={
            bookings.length === 0
              ? styles.emptyList
              : styles.list
          }
          ListEmptyComponent={
            <View
              style={
                styles.empty
              }
            >
              <Ionicons
                name="calendar-outline"
                size={65}
                color="#CBD5E1"
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No bookings yet
              </Text>

              <Text
                style={
                  styles.emptySub
                }
              >
                Customer bookings will
                appear here.
              </Text>
            </View>
          }
          renderItem={({
            item,
          }) => (
            <BookingCard
              booking={item}
              actionLoading={
                actionLoading
              }
              onAccept={() =>
                handleAcceptBooking(
                  item
                )
              }
              onReject={() =>
                handleRejectBooking(
                  item
                )
              }
              onSchedule={() =>
                openScheduleModal(
                  item
                )
              }
              onStart={() =>
                handleStartJob(
                  item
                )
              }
              onComplete={() =>
                handleCompleteJob(
                  item
                )
              }
              statusColor={bookingStatusColor(
                item.status
              )}
              statusLabel={bookingStatusLabel(
                item.status
              )}
            />
          )}
        />
      ) : (
        /* =================================================
           MY BIDS
        ================================================= */

        <FlatList
          data={bids}
          keyExtractor={(item, index) =>
            String(
              item?.id ||
                item?._id ||
                item?.bidId ||
                index
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[
                COLORS.primary,
              ]}
            />
          }
          contentContainerStyle={
            bids.length === 0
              ? styles.emptyList
              : styles.list
          }
          ListEmptyComponent={
            <View
              style={
                styles.empty
              }
            >
              <Ionicons
                name="briefcase-outline"
                size={65}
                color="#CBD5E1"
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No bids yet
              </Text>

              <Text
                style={
                  styles.emptySub
                }
              >
                You haven't applied to any
                jobs yet.
              </Text>
            </View>
          }
          renderItem={({
            item,
          }) => {
            const job =
              item?.job ||
              item?.Job ||
              item?.jobData ||
              item?.service ||
              {};

            const jobId =
              job?.id ||
              job?._id ||
              item?.jobId;

            const title =
              job?.title ||
              job?.name ||
              item?.jobTitle ||
              item?.title ||
              "Job";

            const image =
              job?.image ||
              job?.imageUrl ||
              job?.photo ||
              item?.image ||
              "https://picsum.photos/300";

            const budget =
              job?.budget ??
              job?.price ??
              item?.budget ??
              0;

            const amount =
              item?.amount ??
              item?.bidAmount ??
              item?.price ??
              0;

            const status =
              item?.status ||
              "pending";

            return (
              <TouchableOpacity
                style={
                  styles.bidCard
                }
                activeOpacity={0.9}
                onPress={() => {
                  if (!jobId) {
                    Alert.alert(
                      "Error",
                      "Job ID not found."
                    );

                    return;
                  }

                  router.push({
                    pathname:
                      "/worker/job-details",
                    params: {
                      id: String(
                        jobId
                      ),
                    },
                  });
                }}
              >
                <Image
                  source={{
                    uri: image,
                  }}
                  style={
                    styles.bidImage
                  }
                />

                <View
                  style={
                    styles.bidContent
                  }
                >
                  <Text
                    style={
                      styles.bidTitle
                    }
                    numberOfLines={2}
                  >
                    {title}
                  </Text>

                  <Text
                    style={
                      styles.info
                    }
                  >
                    Job Budget : ৳
                    {budget}
                  </Text>

                  <Text
                    style={
                      styles.info
                    }
                  >
                    Your Bid : ৳
                    {amount}
                  </Text>

                  <View
                    style={[
                      styles.bidStatus,
                      {
                        backgroundColor:
                          bookingStatusColor(
                            status
                          ),
                      },
                    ]}
                  >
                    <Text
                      style={
                        styles.statusText
                      }
                    >
                      {status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* =================================================
          SCHEDULE MODAL
      ================================================= */}

      <Modal
        visible={scheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setScheduleModal(false)
        }
      >
        {/* 
          IMPORTANT:
          KeyboardAvoidingView MUST be INSIDE Modal.
          Modal নিজস্ব native layer-এ render হয়।
        */}

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
          keyboardVerticalOffset={
            Platform.OS === "ios" ? 0 : 20
          }
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={styles.modal}
            >
              {/* 
                ScrollView রাখা হয়েছে যাতে keyboard
                উঠলেও নিচের input/button দেখা যায়।
              */}

              <ScrollView
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={
                  styles.modalScrollContent
                }
              >
                {/* MODAL HEADER */}

                <View
                  style={
                    styles.modalHeader
                  }
                >
                  <View
                    style={
                      styles.modalHeaderInfo
                    }
                  >
                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      Set Service Time
                    </Text>

                    <Text
                      style={
                        styles.modalSub
                      }
                    >
                      Choose when you can do
                      the work
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.modalCloseButton
                    }
                    onPress={() =>
                      setScheduleModal(
                        false
                      )
                    }
                  >
                    <Ionicons
                      name="close"
                      size={25}
                      color="#0F172A"
                    />
                  </TouchableOpacity>
                </View>

                {/* DATE */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Date
                </Text>

                <View
                  style={
                    styles.inputWrapper
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={19}
                    color="#64748B"
                  />

                  <TextInput
                    value={date}
                    onChangeText={
                      setDate
                    }
                    placeholder="2026-08-20"
                    placeholderTextColor="#94A3B8"
                    style={
                      styles.input
                    }
                    returnKeyType="next"
                  />
                </View>

                {/* START TIME */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Start Time
                </Text>

                <View
                  style={
                    styles.inputWrapper
                  }
                >
                  <Ionicons
                    name="time-outline"
                    size={19}
                    color="#64748B"
                  />

                  <TextInput
                    value={
                      startTime
                    }
                    onChangeText={
                      setStartTime
                    }
                    placeholder="10:00 AM"
                    placeholderTextColor="#94A3B8"
                    style={
                      styles.input
                    }
                    returnKeyType="next"
                  />
                </View>

                {/* END TIME */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  End Time
                </Text>

                <View
                  style={
                    styles.inputWrapper
                  }
                >
                  <Ionicons
                    name="time-outline"
                    size={19}
                    color="#64748B"
                  />

                  <TextInput
                    value={
                      endTime
                    }
                    onChangeText={
                      setEndTime
                    }
                    placeholder="12:00 PM"
                    placeholderTextColor="#94A3B8"
                    style={
                      styles.input
                    }
                    returnKeyType="next"
                  />
                </View>

                {/* MESSAGE */}

                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  Message
                </Text>

                <TextInput
                  value={
                    workerMessage
                  }
                  onChangeText={
                    setWorkerMessage
                  }
                  placeholder="Tell customer anything important..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  style={
                    styles.messageInput
                  }
                />

                {/* SEND */}

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    actionLoading &&
                      styles.disabledButton,
                  ]}
                  disabled={
                    actionLoading
                  }
                  onPress={
                    handleProposeTime
                  }
                  activeOpacity={0.85}
                >
                  {actionLoading ? (
                    <ActivityIndicator
                      color="#fff"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="send-outline"
                        size={19}
                        color="#fff"
                      />

                      <Text
                        style={
                          styles.sendButtonText
                        }
                      >
                        Send Schedule
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* BOTTOM SPACE */}

                <View
                  style={
                    styles.modalBottomSpace
                  }
                />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================================================
   BOOKING CARD
========================================================= */

function BookingCard({
  booking,
  actionLoading,
  onAccept,
  onReject,
  onSchedule,
  onStart,
  onComplete,
  statusColor,
  statusLabel,
}: {
  booking: Booking;
  actionLoading: boolean;
  onAccept: () => void;
  onReject: () => void;
  onSchedule: () => void;
  onStart: () => void;
  onComplete: () => void;
  statusColor: string;
  statusLabel: string;
}) {
  return (
    <View
      style={
        styles.bookingCard
      }
    >
      <View
        style={
          styles.bookingHeader
        }
      >
        <View
          style={
            styles.serviceIcon
          }
        >
          <Ionicons
            name="construct-outline"
            size={24}
            color={COLORS.primary}
          />
        </View>

        <View
          style={
            styles.bookingHeaderContent
          }
        >
          <Text
            style={
              styles.bookingTitle
            }
            numberOfLines={2}
          >
            {booking.serviceTitle ||
              "Service Booking"}
          </Text>

          <Text
            style={
              styles.bookingCategory
            }
          >
            {booking.category ||
              "Service"}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                statusColor,
            },
          ]}
        >
          <Text
            style={
              styles.statusText
            }
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      <View
        style={styles.priceRow}
      >
        <View>
          <Text
            style={
              styles.smallLabel
            }
          >
            Service Price
          </Text>

          <Text
            style={styles.price}
          >
            ৳{booking.price || 0}
          </Text>
        </View>

        <View
          style={
            styles.customerBox
          }
        >
          <Ionicons
            name="person-outline"
            size={17}
            color="#64748B"
          />

          <Text
            style={
              styles.customerText
            }
          >
            Customer
          </Text>
        </View>
      </View>

      {booking.requestedDate && (
        <View
          style={
            styles.requestedBox
          }
        >
          <Ionicons
            name="calendar-outline"
            size={17}
            color="#64748B"
          />

          <Text
            style={
              styles.requestedText
            }
          >
            Requested:{" "}
            {
              booking.requestedDate
            }
          </Text>
        </View>
      )}

      {booking.customerMessage ? (
        <View
          style={
            styles.messageBox
          }
        >
          <Ionicons
            name="chatbubble-outline"
            size={17}
            color="#64748B"
          />

          <Text
            style={
              styles.customerMessage
            }
          >
            {
              booking.customerMessage
            }
          </Text>
        </View>
      ) : null}

      {booking.proposedDate &&
        booking.proposedStartTime &&
        booking.proposedEndTime && (
          <View
            style={
              styles.scheduleBox
            }
          >
            <Ionicons
              name="calendar"
              size={19}
              color="#7C3AED"
            />

            <View>
              <Text
                style={
                  styles.scheduleTitle
                }
              >
                Proposed Schedule
              </Text>

              <Text
                style={
                  styles.scheduleText
                }
              >
                {
                  booking.proposedDate
                }
              </Text>

              <Text
                style={
                  styles.scheduleText
                }
              >
                {
                  booking.proposedStartTime
                }{" "}
                -{" "}
                {
                  booking.proposedEndTime
                }
              </Text>
            </View>
          </View>
        )}

      {/* ACTIONS */}

      {booking.status ===
        "pending" && (
        <View
          style={styles.actions}
        >
          <TouchableOpacity
            style={
              styles.rejectButton
            }
            disabled={
              actionLoading
            }
            onPress={
              onReject
            }
          >
            <Ionicons
              name="close-circle-outline"
              size={19}
              color="#DC2626"
            />

            <Text
              style={
                styles.rejectText
              }
            >
              Reject
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.acceptButton
            }
            disabled={
              actionLoading
            }
            onPress={
              onAccept
            }
          >
            {actionLoading ? (
              <ActivityIndicator
                size="small"
                color="#fff"
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={19}
                  color="#fff"
                />

                <Text
                  style={
                    styles.acceptText
                  }
                >
                  Accept
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {booking.status ===
        "accepted" && (
        <TouchableOpacity
          style={
            styles.scheduleButton
          }
          onPress={
            onSchedule
          }
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color="#fff"
          />

          <Text
            style={
              styles.scheduleButtonText
            }
          >
            Choose Date & Time
          </Text>
        </TouchableOpacity>
      )}

      {booking.status ===
        "reschedule_requested" && (
        <View
          style={
            styles.waitingBox
          }
        >
          <Ionicons
            name="hourglass-outline"
            size={20}
            color="#7C3AED"
          />

          <Text
            style={
              styles.waitingText
            }
          >
            Waiting for customer to
            confirm the schedule
          </Text>
        </View>
      )}

      {booking.status ===
        "confirmed" && (
        <TouchableOpacity
          style={
            styles.startButton
          }
          onPress={
            onStart
          }
        >
          <Ionicons
            name="play-circle-outline"
            size={20}
            color="#fff"
          />

          <Text
            style={
              styles.startButtonText
            }
          >
            Start Job
          </Text>
        </TouchableOpacity>
      )}

      {booking.status ===
        "in_progress" && (
        <TouchableOpacity
          style={
            styles.completeButton
          }
          onPress={
            onComplete
          }
        >
          <Ionicons
            name="checkmark-done-outline"
            size={20}
            color="#fff"
          />

          <Text
            style={
              styles.completeButtonText
            }
          >
            Complete Job
          </Text>
        </TouchableOpacity>
      )}

      {booking.status ===
        "completed" && (
        <View
          style={
            styles.completedBox
          }
        >
          <Ionicons
            name="checkmark-circle"
            size={21}
            color="#16A34A"
          />

          <Text
            style={
              styles.completedText
            }
          >
            Service completed successfully
          </Text>
        </View>
      )}
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 14,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },

  headerSub: {
    marginTop: 3,
    fontSize: 13,
    color: "#64748B",
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  tab: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },

  activeTab: {
    borderBottomColor:
      COLORS.primary,
  },

  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },

  activeTabText: {
    color: COLORS.primary,
  },

  countBadge: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },

  bidCountBadge: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor:
      COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  countText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  list: {
    padding: 16,
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  empty: {
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
  },

  emptySub: {
    marginTop: 7,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },

  /* BOOKING */

  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
  },

  bookingHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  serviceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  bookingHeaderContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  bookingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  bookingCategory: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  priceRow: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  smallLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },

  price: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primary,
  },

  customerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },

  customerText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  requestedBox: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 11,
    backgroundColor: "#F8FAFC",
  },

  requestedText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },

  messageBox: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 11,
    backgroundColor: "#F8FAFC",
  },

  customerMessage: {
    flex: 1,
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
  },

  scheduleBox: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 13,
    backgroundColor: "#F5F3FF",
  },

  scheduleTitle: {
    fontSize: 12,
    color: "#6D28D9",
    fontWeight: "800",
  },

  scheduleText: {
    marginTop: 2,
    fontSize: 13,
    color: "#5B21B6",
    fontWeight: "600",
  },

  actions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },

  rejectButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  rejectText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "800",
  },

  acceptButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: "#16A34A",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  acceptText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  scheduleButton: {
    marginTop: 14,
    minHeight: 47,
    borderRadius: 13,
    backgroundColor: "#7C3AED",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  scheduleButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  waitingBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F5F3FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  waitingText: {
    flex: 1,
    color: "#6D28D9",
    fontSize: 13,
    fontWeight: "700",
  },

  startButton: {
    marginTop: 14,
    minHeight: 47,
    borderRadius: 13,
    backgroundColor: "#0284C7",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  startButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  completeButton: {
    marginTop: 14,
    minHeight: 47,
    borderRadius: 13,
    backgroundColor: "#16A34A",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  completeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  completedBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  completedText: {
    flex: 1,
    color: "#15803D",
    fontSize: 13,
    fontWeight: "700",
  },

  /* BIDS */

  bidCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
  },

  bidImage: {
    width: 110,
    height: 110,
    backgroundColor: "#E2E8F0",
  },

  bidContent: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
  },

  bidTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  info: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  bidStatus: {
    alignSelf: "flex-start",
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  /* =====================================================
     MODAL + KEYBOARD
  ===================================================== */

  keyboardContainer: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(15,23,42,0.55)",
    justifyContent: "flex-end",
  },

  modal: {
    maxHeight: "92%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  modalHeaderInfo: {
    flex: 1,
    paddingRight: 12,
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  modalSub: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  inputLabel: {
    marginTop: 10,
    marginBottom: 7,
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },

  inputWrapper: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#F8FAFC",
  },

  input: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 11,
  },

  messageInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: "#0F172A",
    fontSize: 14,
    textAlignVertical: "top",
    backgroundColor: "#F8FAFC",
  },

  sendButton: {
    marginTop: 18,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  sendButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.6,
  },

  modalBottomSpace: {
    height: 20,
  },
});