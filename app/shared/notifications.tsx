import React, {
  useCallback,
  useMemo,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { COLORS } from "@/theme";

import {
  Notification,
  formatNotificationTime,
  getNotificationIcon,
  getNotificationIconColor,
} from "@/services/notification.service";

import { useNotifications } from "@/hooks/useNotifications";

/* =========================================================
   SCREEN
========================================================= */

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,

    refreshNotifications,

    markAsRead,
    markAllAsRead,

    removeNotification,
  } = useNotifications({
    autoFetch: true,
    enablePolling: true,
    pollingInterval: 15000,
  });

  /* =======================================================
     MARK ALL READ
  ======================================================= */

  const handleMarkAllAsRead =
    useCallback(async () => {
      if (unreadCount <= 0) {
        return;
      }

      const success =
        await markAllAsRead();

      if (!success) {
        Alert.alert(
          "Error",
          "Failed to mark all notifications as read."
        );
      }
    }, [
      unreadCount,
      markAllAsRead,
    ]);

  /* =======================================================
     NOTIFICATION CLICK
  ======================================================= */

  const handleNotificationPress =
  useCallback(
    async (
      notification: Notification
    ) => {
      /**
       * Notification read করে দিচ্ছি
       */
      if (!notification.isRead) {
        await markAsRead(
          notification.id
        );
      }

      try {
        /* ===============================================
           CHAT NOTIFICATION
           
           Actual project route:
           /shared/chat/room
        =============================================== */

        if (
          notification.type === "chat" &&
          notification.chatId
        ) {
          router.push({
            pathname: "/shared/chat/room",
            params: {
              chatId: String(
                notification.chatId
              ),
            },
          });
        
          return;
        }
        /* ===============================================
           BID NOTIFICATION
           
           Worker bid করলে Customer notification পায়।
           তাই Customer Job Details-এ যাবে।
           
           Actual route:
           /customer/job-details
        =============================================== */

        if (
          notification.type === "bid" &&
          notification.jobId
        ) {
          router.push({
            pathname:
              "/customer/job-details",

            params: {
              id: String(
                notification.jobId
              ),
            },
          });

          return;
        }

        /* ===============================================
           BOOKING NOTIFICATION
           
           তোমার project-এ আলাদা
           /booking/[id] route নেই।

           Worker-এর bookingগুলো:
           /worker/(tabs)/jobs

           তাই booking notification থেকে
           Worker Jobs screen-এ যাবে।
        =============================================== */

        if (
          notification.type ===
          "booking"
        ) {
          router.push(
            "/worker/(tabs)/jobs"
          );

          return;
        }

        /* ===============================================
           JOB NOTIFICATION
           
           Job notification যদি customer-এর হয়,
           Customer Job Details-এ যাবে।
        =============================================== */

        if (
          notification.type === "job" &&
          notification.jobId
        ) {
          router.push({
            pathname:
              "/customer/job-details",

            params: {
              id: String(
                notification.jobId
              ),
            },
          });

          return;
        }

        /* ===============================================
           FALLBACK
        =============================================== */

        console.log(
          "Notification has no navigation target:",
          notification
        );
      } catch (error) {
        console.error(
          "❌ Notification navigation error:",
          error
        );
      }
    },
    [markAsRead]
  );

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete =
    useCallback(
      async (
        notification: Notification
      ) => {
        const success =
          await removeNotification(
            notification.id
          );

        if (!success) {
          Alert.alert(
            "Error",
            "Failed to delete notification."
          );
        }
      },
      [removeNotification]
    );

  /* =======================================================
     EMPTY STATE
  ======================================================= */

  const emptyComponent =
    useMemo(() => {
      if (loading) {
        return null;
      }

      return (
        <View
          style={
            styles.emptyContainer
          }
        >
          <View
            style={
              styles.emptyIconBox
            }
          >
            <Ionicons
              name="notifications-outline"
              size={42}
              color="#94A3B8"
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            No Notifications
          </Text>

          <Text
            style={
              styles.emptyMessage
            }
          >
            You don't have any
            notifications yet.
          </Text>
        </View>
      );
    }, [loading]);

  /* =======================================================
     RENDER ITEM
  ======================================================= */

  const renderItem = ({
    item,
  }: {
    item: Notification;
  }) => {
    const iconName =
      getNotificationIcon(
        item.type
      );

    const iconColor =
      getNotificationIconColor(
        item.type
      );

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() =>
          handleNotificationPress(
            item
          )
        }
        onLongPress={() =>
          handleDelete(item)
        }
        style={[
          styles.card,

          /**
           * Unread notification
           */
          !item.isRead &&
            styles.unreadCard,
        ]}
      >
        {/* =============================================
            ICON
        ============================================= */}

        <View
          style={[
            styles.iconBox,
            {
              backgroundColor:
                iconColor,
            },
          ]}
        >
          <Ionicons
            name={
              iconName as any
            }
            size={24}
            color="#fff"
          />
        </View>

        {/* =============================================
            CONTENT
        ============================================= */}

        <View
          style={styles.content}
        >
          <View
            style={
              styles.titleRow
            }
          >
            <Text
              style={[
                styles.title,

                !item.isRead &&
                  styles.unreadTitle,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>

            {/* Unread dot */}

            {!item.isRead && (
              <View
                style={
                  styles.unreadDot
                }
              />
            )}
          </View>

          <Text
            style={styles.message}
            numberOfLines={3}
          >
            {item.body}
          </Text>

          <Text
            style={styles.time}
          >
            {formatNotificationTime(
              item.createdAt
            )}
          </Text>
        </View>

        {/* =============================================
            MORE / DELETE ICON
        ============================================= */}

        <TouchableOpacity
          style={
            styles.moreButton
          }
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }}
          onPress={() =>
            Alert.alert(
              "Notification",
              "What would you like to do?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () =>
                    handleDelete(
                      item
                    ),
                },
              ]
            )
          }
        >
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color="#94A3B8"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  /* =======================================================
     SCREEN
  ======================================================= */

  return (
    <View
      style={styles.container}
    >
      {/* ===============================================
          HEADER
      =============================================== */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerCenter
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Notifications
          </Text>

          {unreadCount > 0 && (
            <View
              style={
                styles.headerBadge
              }
            >
              <Text
                style={
                  styles.headerBadgeText
                }
              >
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* =============================================
            MARK ALL READ
        ============================================= */}

        <TouchableOpacity
          onPress={
            handleMarkAllAsRead
          }
          disabled={
            unreadCount === 0
          }
          hitSlop={{
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          }}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={24}
            color={
              unreadCount > 0
                ? COLORS.text
                : "#CBD5E1"
            }
          />
        </TouchableOpacity>
      </View>

      {/* ===============================================
          NOTIFICATION LIST
      =============================================== */}

      <FlatList
        data={notifications}
        keyExtractor={(
          item
        ) => item.id}
        renderItem={
          renderItem
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.listContent,

          notifications.length ===
            0 &&
            styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              refreshNotifications
            }
          />
        }
        ListEmptyComponent={
          emptyComponent
        }
      />
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F8FAFC",
      paddingHorizontal: 18,
    },

    /* ===============================================
       HEADER
    =============================================== */

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      marginTop: 55,
      marginBottom: 20,
    },

    headerCenter: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: COLORS.text,
    },

    headerBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,

      backgroundColor:
        "#EF4444",

      justifyContent:
        "center",
      alignItems:
        "center",

      marginLeft: 8,
      paddingHorizontal: 5,
    },

    headerBadgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },

    /* ===============================================
       LIST
    =============================================== */

    listContent: {
      paddingBottom: 30,
    },

    emptyList: {
      flexGrow: 1,
    },

    /* ===============================================
       CARD
    =============================================== */

    card: {
      flexDirection:
        "row",

      backgroundColor:
        "#fff",

      borderRadius: 18,

      padding: 16,

      marginBottom: 14,

      alignItems:
        "center",

      shadowColor:
        "#000",

      shadowOpacity:
        0.05,

      shadowRadius:
        8,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 3,
    },

    unreadCard: {
      backgroundColor:
        "#F8FBFF",

      borderWidth: 1,
      borderColor:
        "#DBEAFE",
    },

    /* ===============================================
       ICON
    =============================================== */

    iconBox: {
      width: 54,
      height: 54,

      borderRadius: 27,

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    /* ===============================================
       CONTENT
    =============================================== */

    content: {
      flex: 1,
      marginLeft: 15,
      marginRight: 8,
    },

    titleRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      paddingRight: 5,
    },

    title: {
      flex: 1,

      fontSize: 16,

      fontWeight:
        "600",

      color:
        COLORS.text,
    },

    unreadTitle: {
      fontWeight:
        "700",
    },

    unreadDot: {
      width: 8,
      height: 8,

      borderRadius: 4,

      backgroundColor:
        "#2563EB",

      marginLeft: 8,
    },

    message: {
      marginTop: 4,

      color:
        COLORS.textSecondary,

      fontSize: 14,

      lineHeight: 20,
    },

    time: {
      marginTop: 8,

      fontSize: 12,

      color:
        "#94A3B8",
    },

    /* ===============================================
       MORE BUTTON
    =============================================== */

    moreButton: {
      width: 28,
      height: 40,

      justifyContent:
        "center",

      alignItems:
        "center",
    },

    /* ===============================================
       EMPTY STATE
    =============================================== */

    emptyContainer: {
      flex: 1,

      justifyContent:
        "center",

      alignItems:
        "center",

      paddingHorizontal: 30,

      marginTop: -60,
    },

    emptyIconBox: {
      width: 86,
      height: 86,

      borderRadius: 43,

      backgroundColor:
        "#E2E8F0",

      justifyContent:
        "center",

      alignItems:
        "center",

      marginBottom: 18,
    },

    emptyTitle: {
      fontSize: 20,

      fontWeight:
        "700",

      color:
        COLORS.text,

      textAlign:
        "center",
    },

    emptyMessage: {
      marginTop: 8,

      fontSize: 14,

      lineHeight: 21,

      color:
        COLORS.textSecondary,

      textAlign:
        "center",
    },
  });