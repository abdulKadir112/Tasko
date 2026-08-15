import { useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { COLORS } from "@/theme";

import { useAuthContext } from "@/context/AuthContext";

import {
  getCustomerChats,
  getWorkerChats,
  listenLastMessage,
  type ChatItem,
  type LastMessagePreview,
} from "@/services/chat.service";

/* =========================================================
   PREVIEW TEXT HELPER
   ---------------------------------------------------------
   টাইপ অনুযায়ী inbox card-এ কী দেখাবে সেটা ঠিক করে।
========================================================= */

function getPreviewText(
  message: string,
  type: string
) {
  if (message && message.trim()) {
    return message;
  }

  if (type === "image") {
    return "📷 Photo";
  }

  if (type === "voice") {
    return "🎤 Voice message";
  }

  if (type === "file") {
    return "📎 File";
  }

  return "Start conversation";
}

export default function MessagesScreen() {
  const { user } = useAuthContext();

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /*
   * ⭐ NEW
   *
   * প্রতিটা চ্যাটের সর্বশেষ মেসেজের realtime তথ্য এখানে
   * রাখা হচ্ছে, chatId দিয়ে key করা। Firestore listener
   * থেকে আসা ডেটা REST API-এর initial ডেটাকে override
   * করবে।
   */

  const [
    lastMessagesMap,
    setLastMessagesMap,
  ] = useState<
    Record<string, LastMessagePreview>
  >({});

  /*
   * ⭐ সক্রিয় listener-গুলো ট্র্যাক করার জন্য, যাতে চ্যাট
   * লিস্ট বদলালে বা component unmount হলে ঠিকভাবে
   * unsubscribe করা যায়।
   */

  const unsubscribersRef = useRef<
    Record<string, () => void>
  >({});

  /* =====================================================
     LOAD CHATS
  ===================================================== */

  useEffect(() => {
    if (!user?.uid) {
      setChats([]);
      setLoading(false);
      return;
    }

    void loadChats();
  }, [user?.uid, user?.role]);

  async function loadChats() {
    if (!user?.uid) {
      return;
    }

    try {
      setLoading(true);

      const list =
        user.role === "worker"
          ? await getWorkerChats(user.uid)
          : await getCustomerChats(user.uid);

      console.log(
        "📥 CHAT LIST =>",
        JSON.stringify(list, null, 2)
      );

      setChats(Array.isArray(list) ? list : []);
    } catch (error) {
      console.log("❌ Load chats error:", error);
      setChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* =====================================================
     REALTIME LAST MESSAGE LISTENERS  (⭐ NEW)
     -----------------------------------------------------
     প্রতিটা চ্যাটের জন্য একটা করে Firestore listener বসানো
     হচ্ছে, যাতে "reload না করলে last message আপডেট হয় না"
     সমস্যাটা আর না থাকে।
  ===================================================== */

  useEffect(() => {
    /*
     * আগের সব listener বন্ধ করে দাও — নাহলে memory leak
     * আর duplicate listener জমে যাবে।
     */

    Object.values(
      unsubscribersRef.current
    ).forEach((unsub) => unsub());

    unsubscribersRef.current = {};

    if (chats.length === 0) {
      return;
    }

    for (const chat of chats) {
      if (!chat.id) {
        continue;
      }

      const unsubscribe = listenLastMessage(
        chat.id,

        (preview) => {
          if (!preview) {
            return;
          }

          setLastMessagesMap(
            (previous) => ({
              ...previous,

              [chat.id]: preview,
            })
          );
        }
      );

      unsubscribersRef.current[chat.id] =
        unsubscribe;
    }

    /*
     * component unmount হলে সব listener বন্ধ করে দাও
     */

    return () => {
      Object.values(
        unsubscribersRef.current
      ).forEach((unsub) => unsub());

      unsubscribersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats.map((c) => c.id).join(",")]);

  /* =====================================================
     REFRESH
  ===================================================== */

  async function onRefresh() {
    if (!user?.uid) {
      return;
    }

    setRefreshing(true);
    await loadChats();
  }

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredChats = chats.filter((item) => {
    const name =
      item.otherUser?.name ??
      "";

    return name
      .toLowerCase()
      .includes(
        search.trim().toLowerCase()
      );
  });

  /* =====================================================
     TIME FORMAT
  ===================================================== */

  function formatTime(value: any) {
    if (!value) {
      return "";
    }

    let timestamp = 0;

    if (typeof value === "number") {
      timestamp = value;
    } else if (value instanceof Date) {
      timestamp = value.getTime();
    } else if (
      typeof value === "object" &&
      typeof value.seconds === "number"
    ) {
      timestamp = value.seconds * 1000;
    } else if (typeof value === "string") {
      timestamp = new Date(value).getTime();
    }

    if (!timestamp || Number.isNaN(timestamp)) {
      return "";
    }

    return new Date(timestamp).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  /* =====================================================
     OPEN CHAT
  ===================================================== */

  function openChat(item: ChatItem) {
    const chatId = item.id;
    const other = item.otherUser;

    if (!chatId || !other?.id) {
      console.log(
        "❌ Invalid chat item:",
        item
      );
      return;
    }

    router.push({
      pathname: "/shared/chat/room",
      params: {
        chatId: String(chatId),

        receiverId: String(other.id),

        /*
         * Inbox-এর cached profile data
         * সরাসরি room-এ পাঠানো হচ্ছে।
         */

        otherUserName:
          other.name
            ? String(other.name)
            : "",

        otherUserPhoto:
          other.photoURL
            ? String(other.photoURL)
            : "",

        otherUserOnline:
          String(
            Boolean(
              other.isOnline ?? false
            )
          ),

        otherUserLastSeen:
          other.lastSeen
            ? String(other.lastSeen)
            : "",
      },
    });
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Messages
      </Text>

      {/* SEARCH */}

      <View style={styles.searchBox}>
        <Ionicons
          name="search"
          size={20}
          color="#777"
        />

        <TextInput
          placeholder="Search..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.input}
        />
      </View>

      {/* CHAT LIST */}

      <FlatList
        data={filteredChats}
        keyExtractor={(item, index) =>
          String(item.id ?? index)
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        renderItem={({ item }) => {
          const other =
            item.otherUser;

          const photo =
            other?.photoURL
              ? String(
                other.photoURL
              ).trim()
              : "";

          const hasPhoto =
            photo.length > 0;

          const name =
            other?.name &&
              String(other.name).trim()
              ? String(
                other.name
              ).trim()
              : "Unknown User";

          /*
           * ⭐ REALTIME OVERRIDE
           *
           * Firestore listener থেকে ডেটা এলে সেটা
           * ব্যবহার করো, নাহলে REST API-এর initial
           * ডেটা fallback হিসেবে থাকবে।
           */

          const realtimePreview =
            lastMessagesMap[item.id];

          const lastMessage =
            realtimePreview
              ? getPreviewText(
                  realtimePreview.message,
                  realtimePreview.type
                )
              : item.lastMessage &&
                  String(
                    item.lastMessage
                  ).trim()
                ? String(
                    item.lastMessage
                  )
                : "Start conversation";

          const lastMessageAt =
            realtimePreview?.createdAt ??
            item.lastMessageAt;

          const online =
            Boolean(
              other?.isOnline ?? false
            );

          /*
           * ⭐ SEEN TICK
           *
           * শুধু তখনই দেখাবে যখন সর্বশেষ মেসেজটা
           * আমি (current user) পাঠিয়েছি।
           */

          const isMyLastMessage =
            realtimePreview &&
            user?.uid &&
            realtimePreview.senderId ===
              String(user.uid);

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() =>
                openChat(item)
              }
            >
              {/* AVATAR */}

              {hasPhoto ? (
                <Image
                  source={{
                    uri: photo,
                  }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={styles.avatar}
                >
                  <Ionicons
                    name="person"
                    size={28}
                    color="#fff"
                  />
                </View>
              )}

              {/* ONLINE DOT */}

              {online && (
                <View
                  style={
                    styles.onlineDot
                  }
                />
              )}

              {/* USER INFO */}

              <View
                style={styles.info}
              >
                <Text
                  style={styles.name}
                  numberOfLines={1}
                >
                  {name}
                </Text>

                <View
                  style={
                    styles.messageRow
                  }
                >
                  {/*
                    ⭐ SEEN/SENT TICK
                    আমার পাঠানো শেষ মেসেজ হলে tick দেখাও
                  */}

                  {isMyLastMessage && (
                    <Ionicons
                      name={
                        realtimePreview?.isSeen
                          ? "checkmark-done"
                          : "checkmark"
                      }
                      size={15}
                      color={
                        realtimePreview?.isSeen
                          ? COLORS.primary
                          : "#94A3B8"
                      }
                      style={
                        styles.seenIcon
                      }
                    />
                  )}

                  <Text
                    style={styles.message}
                    numberOfLines={1}
                  >
                    {lastMessage}
                  </Text>
                </View>
              </View>

              {/* RIGHT */}

              <View
                style={styles.right}
              >
                <Text
                  style={styles.time}
                >
                  {formatTime(
                    lastMessageAt
                  )}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View
            style={styles.empty}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={80}
              color="#CBD5E1"
            />

            <Text
              style={
                styles.emptyText
              }
            >
              {search.trim()
                ? "No matching chats"
                : "No Chats Yet"}
            </Text>
          </View>
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
      backgroundColor: "#F8FAFC",
      paddingHorizontal: 16,
      paddingTop: 15,
    },

    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor:
        "#F8FAFC",
    },

    header: {
      fontSize: 30,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom: 20,
    },

    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 15,
      paddingHorizontal: 14,
      marginBottom: 18,
      height: 50,
    },

    input: {
      flex: 1,
      marginLeft: 10,
      color: COLORS.text,
    },

    card: {
      position: "relative",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
    },

    avatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor:
        COLORS.primary,
      justifyContent: "center",
      alignItems: "center",
    },

    onlineDot: {
      position: "absolute",
      left: 55,
      bottom: 13,
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor:
        "#22C55E",
      borderWidth: 2,
      borderColor: "#fff",
    },

    info: {
      flex: 1,
      marginLeft: 12,
      minWidth: 0,
    },

    name: {
      fontSize: 17,
      fontWeight: "700",
      color: COLORS.text,
    },

    messageRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
    },

    seenIcon: {
      marginRight: 4,
    },

    message: {
      flex: 1,
      color: "#64748B",
    },

    right: {
      alignItems: "flex-end",
      marginLeft: 8,
    },

    time: {
      fontSize: 11,
      color: "#94A3B8",
    },

    empty: {
      alignItems: "center",
      marginTop: 120,
    },

    emptyText: {
      marginTop: 20,
      fontSize: 18,
      color: "#94A3B8",
      fontWeight: "600",
    },
  });