
import api from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";

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
   * ⭐ UNIQUE CLIENT MESSAGE ID
   *
   * একই message retry / optimistic update /
   * Firebase sync হলেও এই ID একই থাকবে।
   */
  clientMessageId?: string | null;

  replyTo?: ReplyTo | null;
}

/* =========================================================
TOKEN
========================================================= */

async function getToken(): Promise<string> {
  const token =
    await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error(
      "User not logged in"
    );
  }

  return token;
}

/* =========================================================
CLIENT MESSAGE ID
========================================================= */

function normalizeClientMessageId(
  value?: string | null
): string {
  if (value) {
    const normalized =
      String(value).trim();

    if (normalized) {
      return normalized;
    }
  }

  /*
   * Caller ID না দিলে এখানেই একটি নতুন
   * permanent client ID তৈরি হবে।
   */
  return randomUUID();
}

/* =========================================================
GET ALL MESSAGES
========================================================= */

export async function getMessages(
  chatId: string
) {
  const token =
    await getToken();

  const response =
    await api.get(
      `/messages/${String(chatId)}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data?.data ?? [];
}

/* =========================================================
REALTIME FIREBASE LISTENER
========================================================= */

export function listenMessages(
  chatId: string,
  callback: (
    messages: any[]
  ) => void
) {
  const normalizedChatId =
    String(chatId);

  const q = query(
    collection(
      db,
      "messages"
    ),

    where(
      "chatId",
      "==",
      normalizedChatId
    ),

    orderBy(
      "createdAt",
      "asc"
    )
  );

  const unsubscribe =
    onSnapshot(
      q,

      (snapshot) => {
        const messages =
          snapshot.docs.map(
            (doc) => {
              const data =
                doc.data();

              /*
               * ⭐ IMPORTANT
               *
               * Firebase document ID এবং
               * clientMessageId দুটোই preserve করছি।
               */

              return {
                id: String(
                  doc.id
                ),

                ...data,

                clientMessageId:
                  data?.clientMessageId
                    ? String(
                        data.clientMessageId
                      ).trim()
                    : null,
              };
            }
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
  const token =
    await getToken();

  /*
   * ======================================================
   * ⭐ CRITICAL DUPLICATE PROTECTION
   * ======================================================
   *
   * Caller আগে clientMessageId দিলে
   * সেটাই ব্যবহার হবে।
   *
   * Caller না দিলে service নতুন ID বানাবে।
   *
   * কিন্তু retry করার সময় caller-এর
   * একই ID আবার পাঠানো খুব গুরুত্বপূর্ণ।
   */

  const clientMessageId =
    normalizeClientMessageId(
      data.clientMessageId
    );

  /*
   * ======================================================
   * PAYLOAD
   * ======================================================
   */

  const payload = {
    chatId:
      String(data.chatId),

    receiverId:
      String(data.receiverId),

    message:
      data.message ?? "",

    type:
      data.type ?? "text",

    imageUrl:
      data.imageUrl ?? null,

    voiceUrl:
      data.voiceUrl ?? null,

    fileUrl:
      data.fileUrl ?? null,

    /*
     * ⭐ MUST SEND TO BACKEND
     */
    clientMessageId,

    replyTo:
      data.replyTo ?? null,
  };

  console.log(
    "📤 Sending message:",
    payload
  );

  /*
   * ======================================================
   * API REQUEST
   * ======================================================
   */

  const response =
    await api.post(
      "/messages",
      payload,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },
      }
    );

  console.log(
    "✅ Message sent:",
    response.data
  );

  /*
   * ======================================================
   * SERVER RESPONSE
   * ======================================================
   */

  const serverMessage =
    response.data?.data;

  /*
   * ======================================================
   * IMPORTANT
   *
   * Backend যদি clientMessageId return না করে,
   * তাহলে local response-এ caller-এর ID
   * আবার বসিয়ে দিচ্ছি।
   * ======================================================
   */

  if (
    serverMessage &&
    typeof serverMessage ===
      "object"
  ) {
    return {
      ...serverMessage,

      clientMessageId:
        serverMessage
          ?.clientMessageId ??
        clientMessageId,
    };
  }

  /*
   * Server data না থাকলেও
   * অন্তত clientMessageId হারাবে না।
   */

  return {
    ...(serverMessage ?? {}),

    clientMessageId,
  };
}

/* =========================================================
MARK MESSAGES AS SEEN
========================================================= */

export async function seenMessages(
  chatId: string
) {
  const token =
    await getToken();

  const response =
    await api.put(
      `/messages/seen/${String(
        chatId
      )}`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
};
