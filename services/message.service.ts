import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/config/firebase";

/* =========================================================
   TYPES
========================================================= */

export type MessageType =
  | "text"
  | "image"
  | "voice"
  | "file";

export interface ReplyTo {
  id: string;
  message: string;
  senderId: string;
  type: MessageType;
}

export interface SendMessageData {
  chatId: string;

  receiverId: string;

  message: string;

  type?: MessageType;

  imageUrl?: string | null;

  voiceUrl?: string | null;

  fileUrl?: string | null;

  /*
   * ⭐ VERY IMPORTANT
   *
   * প্রতিটি message-এর জন্য frontend থেকে
   * একটি unique ID আসবে।
   *
   * Network retry হলেও এই ID একই থাকবে।
   */
  clientMessageId: string;

  replyTo?: ReplyTo | null;
}

/* =========================================================
   TOKEN
========================================================= */

async function getToken(): Promise<string> {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("User not logged in");
  }

  return token;
}

/* =========================================================
   GET ALL MESSAGES
========================================================= */

export async function getMessages(
  chatId: string
) {
  const token = await getToken();

  const response = await api.get(
    `/messages/${chatId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data;
}

/* =========================================================
   REALTIME FIREBASE LISTENER
========================================================= */

export function listenMessages(
  chatId: string,
  callback: (messages: any[]) => void
) {
  const q = query(
    collection(db, "messages"),

    where(
      "chatId",
      "==",
      String(chatId)
    ),

    orderBy("createdAt", "asc")
  );

  const unsubscribe = onSnapshot(
    q,

    (snapshot) => {
      const messages = snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );

      callback(messages);
    },

    (error) => {
      console.log(
        "❌ Firestore Listener Error:",
        error
      );
    }
  );

  return unsubscribe;
}

/* =========================================================
   SEND MESSAGE
========================================================= */

export async function sendMessage(
  data: SendMessageData
) {
  const token = await getToken();

  const payload = {
    chatId: String(data.chatId),

    receiverId: String(
      data.receiverId
    ),

    message: data.message ?? "",

    type: data.type ?? "text",

    imageUrl:
      data.imageUrl ?? null,

    voiceUrl:
      data.voiceUrl ?? null,

    fileUrl:
      data.fileUrl ?? null,

    /*
     * ⭐ Duplicate protection
     */
    clientMessageId:
      data.clientMessageId,

    replyTo:
      data.replyTo ?? null,
  };

  console.log(
    "📤 Sending message:",
    payload
  );

  const response = await api.post(
    "/messages",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log(
    "✅ Message sent:",
    response.data
  );

  return response.data.data;
}

/* =========================================================
   MARK MESSAGES AS SEEN
========================================================= */

export async function seenMessages(
  chatId: string
) {
  const token = await getToken();

  const response = await api.put(
    `/messages/seen/${chatId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}