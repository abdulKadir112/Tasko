import { useEffect, useState } from "react";

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

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import {
  COLORS,
} from "@/theme";

import {
  useAuthContext,
} from "@/context/AuthContext";

import {
  getCustomerChats,
  getWorkerChats,
  type ChatItem,
} from "@/services/chat.service";

export default function MessagesScreen() {
  const { user } =
    useAuthContext();

  const [
    chats,
    setChats,
  ] = useState<ChatItem[]>([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  /* =====================================================
     LOAD CHATS
  ===================================================== */

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    loadChats();
  }, [user?.uid, user?.role]);

  async function loadChats() {
    if (!user?.uid) {
      return;
    }

    try {
      const list =
        user.role === "worker"
          ? await getWorkerChats(
              user.uid
            )
          : await getCustomerChats(
              user.uid
            );

      console.log(
        "📥 CHAT LIST =>",
        JSON.stringify(
          list,
          null,
          2
        )
      );

      setChats(list);
    } catch (error) {
      console.log(
        "❌ Load chats error:",
        error
      );

      setChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* =====================================================
     REFRESH
  ===================================================== */

  async function onRefresh() {
    setRefreshing(true);

    await loadChats();
  }

  /* =====================================================
     SEARCH
  ===================================================== */

  const filtered =
    chats.filter((item) => {
      const name =
        item.otherUser?.name ??
        "";

      return name
        .toLowerCase()
        .includes(
          search
            .trim()
            .toLowerCase()
        );
    });

  /* =====================================================
     TIME FORMAT
  ===================================================== */

  function formatTime(
    value: any
  ) {
    if (!value) {
      return "";
    }

    let timestamp = 0;

    if (
      typeof value === "number"
    ) {
      timestamp = value;
    }

    else if (
      value instanceof Date
    ) {
      timestamp =
        value.getTime();
    }

    else if (
      typeof value ===
        "object" &&
      typeof value.seconds ===
        "number"
    ) {
      timestamp =
        value.seconds * 1000;
    }

    else if (
      typeof value ===
        "string"
    ) {
      timestamp =
        new Date(value).getTime();
    }

    if (!timestamp) {
      return "";
    }

    return new Date(
      timestamp
    ).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <View
        style={styles.loading}
      >
        <ActivityIndicator
          size="large"
          color={
            COLORS.primary
          }
        />
      </View>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <View
      style={styles.container}
    >
      <Text
        style={styles.header}
      >
        Messages
      </Text>

      {/* SEARCH */}

      <View
        style={styles.searchBox}
      >
        <Ionicons
          name="search"
          size={20}
          color="#777"
        />

        <TextInput
          placeholder="Search..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={
            setSearch
          }
          style={
            styles.input
          }
        />
      </View>

      {/* CHAT LIST */}

      <FlatList
        data={filtered}
        keyExtractor={(
          item,
          index
        ) =>
          String(
            item.id ||
              index
          )
        }
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              onRefresh
            }
          />
        }
        renderItem={({
          item,
        }) => {
          const other =
            item.otherUser;

          const hasPhoto =
            Boolean(
              other?.photoURL
            );

          const name =
            other?.name ||
            "Unknown";

          return (
            <TouchableOpacity
              style={
                styles.card
              }
              activeOpacity={
                0.75
              }
              onPress={() => {
                if (
                  !item.id ||
                  !other?.id
                ) {
                  console.log(
                    "❌ Invalid chat:",
                    item
                  );

                  return;
                }

                router.push({
                  pathname:
                    "/shared/chat/room",

                  params: {
                    chatId:
                      String(
                        item.id
                      ),

                    receiverId:
                      String(
                        other.id
                      ),
                  },
                });
              }}
            >
              {/* AVATAR */}

              {hasPhoto ? (
                <Image
                  source={{
                    uri:
                      other.photoURL!,
                  }}
                  style={
                    styles.avatar
                  }
                />
              ) : (
                <View
                  style={
                    styles.avatar
                  }
                >
                  <Ionicons
                    name="person"
                    size={28}
                    color="#fff"
                  />
                </View>
              )}

              {/* USER INFO */}

              <View
                style={
                  styles.info
                }
              >
                <Text
                  style={
                    styles.name
                  }
                  numberOfLines={
                    1
                  }
                >
                  {name}
                </Text>

                <Text
                  style={
                    styles.message
                  }
                  numberOfLines={
                    1
                  }
                >
                  {item.lastMessage ||
                    "Start conversation"}
                </Text>
              </View>

              {/* RIGHT */}

              <View
                style={
                  styles.right
                }
              >
                <Text
                  style={
                    styles.time
                  }
                >
                  {formatTime(
                    item.lastMessageAt
                  )}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View
            style={
              styles.empty
            }
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
              No Chats Yet
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
      backgroundColor:
        "#F8FAFC",
      paddingHorizontal: 16,
      paddingTop: 15,
    },

    loading: {
      flex: 1,
      justifyContent:
        "center",
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
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#fff",
      borderRadius: 15,
      paddingHorizontal:
        14,
      marginBottom: 18,
      height: 50,
    },

    input: {
      flex: 1,
      marginLeft: 10,
      color: COLORS.text,
    },

    card: {
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#fff",
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
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    info: {
      flex: 1,
      marginLeft: 12,
    },

    name: {
      fontSize: 17,
      fontWeight: "700",
      color: COLORS.text,
    },

    message: {
      color: "#64748B",
      marginTop: 5,
    },

    right: {
      alignItems:
        "flex-end",
      marginLeft: 8,
    },

    time: {
      fontSize: 11,
      color: "#94A3B8",
    },

    empty: {
      alignItems:
        "center",
      marginTop: 120,
    },

    emptyText: {
      marginTop: 20,
      fontSize: 18,
      color: "#94A3B8",
      fontWeight: "600",
    },
  });