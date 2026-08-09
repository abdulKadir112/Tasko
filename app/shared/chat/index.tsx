import { useEffect, useState } from "react";

import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { router } from "expo-router";

import ChatCard from "@/components/chat/ChatCard";
import { getMyChats } from "@/services/chat.service";
import { useAuthContext } from "@/context/AuthContext";

export default function ChatListScreen() {
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [chats, setChats] = useState<any[]>([]);

  async function loadChats() {
    try {
      const data = await getMyChats(user?.role || "customer");

      setChats(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadChats();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={chats}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadChats();
          }}
        />
      }
      renderItem={({ item }) => (
        <ChatCard
          name={
            user?.role === "worker"
              ? item.customerName
              : item.workerName
          }
          photoURL={
            user?.role === "worker"
              ? item.customerPhoto
              : item.workerPhoto
          }
          lastMessage={item.lastMessage}
          unread={item.unreadCount}
          online={item.online}
          time={
            item.lastMessageAt
              ? new Date(
                  item.lastMessageAt
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""
          }
          onPress={() =>
            router.push({
              pathname: "/shared/chat/room",
              params: {
                chatId: item.id,
              },
            })
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
  },
});