import api from "@/config/api";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/config/firebase";

/* =========================================================
TYPES
========================================================= */

export interface ChatUser {
  id: string;
  name: string;
  photoURL: string | null;
  isOnline: boolean;
  lastSeen: string | null;
}

export interface ChatItem {
  id: string;

  customerId?: string;
  workerId?: string;
  jobId?: string;

  lastMessage?: string;
  lastMessageAt?: number | null;

  otherUser: ChatUser;
}

/*
 * ⭐ NEW
 *
 * Firestore থেকে আসা সর্বশেষ মেসেজের সংক্ষিপ্ত তথ্য —
 * inbox list-এ realtime দেখানোর জন্য।
 */
export interface LastMessagePreview {
  message: string;
  type: string;
  createdAt: number;
  senderId: string;
  isSeen: boolean;
}

/* =========================================================
CREATE CHAT
========================================================= */

export async function createChat(data: {
  workerId: string;
  jobId: string;
}) {
  const response = await api.post("/chats/create", data);

  return response.data?.data;
}

/* =========================================================
DATE NORMALIZER
========================================================= */

function normalizeDate(value: any): number | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  /* Firestore Timestamp (instance) */
  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  /* Firestore Timestamp */
  if (
    typeof value === "object" &&
    typeof value.seconds === "number"
  ) {
    return (
      value.seconds * 1000 +
      Math.floor((value.nanoseconds ?? 0) / 1000000)
    );
  }

  if (typeof value === "string") {
    const time = new Date(value).getTime();

    if (!Number.isNaN(time)) {
      return time;
    }
  }

  return null;
}

/* =========================================================
NORMALIZE LAST SEEN
========================================================= */

function normalizeLastSeen(value: any): string | null {
  const timestamp = normalizeDate(value);

  if (timestamp === null) {
    return null;
  }

  return new Date(timestamp).toISOString();
}

/* =========================================================
NORMALIZE ONLINE
========================================================= */

function normalizeOnline(value: any): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    return (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "online"
    );
  }

  return false;
}

/* =========================================================
NORMALIZE USER
========================================================= */

function normalizeUser(user: any): ChatUser | null {
  if (!user || typeof user !== "object") {
    return null;
  }

  /* -------------------------------------------------------
  ID
  ------------------------------------------------------- */

  const id =
    user.id ??
    user._id ??
    user.uid ??
    user.userId ??
    user.workerId ??
    user.customerId;

  if (!id) {
    return null;
  }

  /* -------------------------------------------------------
  NAME
  ------------------------------------------------------- */

  const name =
    user.name ??
    user.fullName ??
    user.displayName ??
    user.username ??
    user.userName ??
    user.workerName ??
    user.customerName ??
    "Unknown User";

  /* -------------------------------------------------------
  PHOTO
  ------------------------------------------------------- */

  const photoURL =
    user.photoURL ??
    user.photoUrl ??
    user.profileImage ??
    user.profileImageUrl ??
    user.avatar ??
    user.image ??
    user.imageUrl ??
    null;

  /* -------------------------------------------------------
  ONLINE
  -------------------------------------------------------

  Backend যদি isOnline পাঠায় সেটা priority পাবে।

  পুরোনো backend যদি online পাঠায়,
  সেটাও এখানে normalize হবে।

  কিন্তু বাইরে থেকে ChatUser-এ
  শুধু isOnline থাকবে।
  ------------------------------------------------------- */

  const isOnline = normalizeOnline(
    user.isOnline ?? user.online ?? user.onlineStatus ?? false
  );

  /* -------------------------------------------------------
  LAST SEEN
  ------------------------------------------------------- */

  const lastSeen = normalizeLastSeen(
    user.lastSeen ?? user.last_seen ?? user.lastSeenAt
  );

  return {
    id: String(id),

    name: String(name).trim() || "Unknown User",

    photoURL:
      photoURL && String(photoURL).trim()
        ? String(photoURL).trim()
        : null,

    isOnline,

    lastSeen,
  };
}

/* =========================================================
GET OTHER USER
========================================================= */

function getOtherUser(
  chat: any,
  currentUserId?: string
): ChatUser {
  const currentId = currentUserId
    ? String(currentUserId)
    : undefined;

  /* =======================================================
  1. DIRECT otherUser
  ======================================================= */

  const directUser = normalizeUser(chat?.otherUser);

  if (directUser && (!currentId || directUser.id !== currentId)) {
    return directUser;
  }

  /* =======================================================
  2. WORKER
  ======================================================= */

  const worker = normalizeUser(chat?.worker);

  if (worker && (!currentId || worker.id !== currentId)) {
    return worker;
  }

  /* =======================================================
  3. CUSTOMER
  ======================================================= */

  const customer = normalizeUser(chat?.customer);

  if (customer && (!currentId || customer.id !== currentId)) {
    return customer;
  }

  /* =======================================================
  4. RECEIVER
  ======================================================= */

  const receiver = normalizeUser(chat?.receiver);

  if (receiver && (!currentId || receiver.id !== currentId)) {
    return receiver;
  }

  /* =======================================================
  5. SENDER
  ======================================================= */

  const sender = normalizeUser(chat?.sender);

  if (sender && (!currentId || sender.id !== currentId)) {
    return sender;
  }

  /* =======================================================
  6. DIRECT USER FIELDS
  ======================================================= */

  const directOther = normalizeUser({
    id:
      chat?.otherUserId ??
      chat?.otherUserUid ??
      chat?.receiverId ??
      chat?.senderId ??
      chat?.workerId ??
      chat?.customerId,

    name:
      chat?.otherUserName ??
      chat?.receiverName ??
      chat?.senderName ??
      chat?.workerName ??
      chat?.customerName,

    photoURL:
      chat?.otherUserPhotoURL ??
      chat?.receiverPhotoURL ??
      chat?.senderPhotoURL ??
      chat?.workerPhotoURL ??
      chat?.customerPhotoURL,

    isOnline:
      chat?.otherUserOnline ??
      chat?.receiverOnline ??
      chat?.senderOnline ??
      chat?.workerOnline ??
      chat?.customerOnline ??
      chat?.isOnline ??
      chat?.online ??
      false,

    lastSeen:
      chat?.otherUserLastSeen ??
      chat?.receiverLastSeen ??
      chat?.senderLastSeen ??
      chat?.workerLastSeen ??
      chat?.customerLastSeen ??
      chat?.lastSeen ??
      null,
  });

  if (
    directOther &&
    (!currentId || directOther.id !== currentId)
  ) {
    return directOther;
  }

  /* =======================================================
  7. PARTICIPANTS
  ======================================================= */

  if (Array.isArray(chat?.participants)) {
    const participant = chat.participants
      .map((item: any) => normalizeUser(item))
      .find(
        (item: ChatUser | null) =>
          item && (!currentId || item.id !== currentId)
      );

    if (participant) {
      return participant;
    }
  }

  /* =======================================================
  8. FALLBACK
  ======================================================= */

  return {
    id: "",
    name: "Unknown User",
    photoURL: null,
    isOnline: false,
    lastSeen: null,
  };
}

/* =========================================================
NORMALIZE CHAT
========================================================= */

function normalizeChat(
  chat: any,
  currentUserId?: string
): ChatItem {
  const otherUser = getOtherUser(chat, currentUserId);

  return {
    id: String(chat?.id ?? chat?._id ?? chat?.chatId ?? ""),

    customerId: chat?.customerId
      ? String(chat.customerId)
      : undefined,

    workerId: chat?.workerId ? String(chat.workerId) : undefined,

    jobId: chat?.jobId ? String(chat.jobId) : undefined,

    otherUser,

    lastMessage:
      chat?.lastMessage ??
      chat?.latestMessage?.message ??
      chat?.lastMessageText ??
      "",

    lastMessageAt: normalizeDate(
      chat?.lastMessageAt ??
        chat?.latestMessage?.createdAt ??
        chat?.updatedAt
    ),
  };
}

/* =========================================================
GET CUSTOMER CHATS
========================================================= */

export async function getCustomerChats(
  currentUserId?: string
): Promise<ChatItem[]> {
  const response = await api.get("/chats/customer");

  const raw = response.data?.data ?? response.data ?? [];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((chat: any) =>
    normalizeChat(chat, currentUserId)
  );
}

/* =========================================================
GET WORKER CHATS
========================================================= */

export async function getWorkerChats(
  currentUserId?: string
): Promise<ChatItem[]> {
  const response = await api.get("/chats/worker");

  const raw = response.data?.data ?? response.data ?? [];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((chat: any) =>
    normalizeChat(chat, currentUserId)
  );
}

/* =========================================================
GET MY CHATS
========================================================= */

export async function getMyChats(
  role: string,
  currentUserId?: string
): Promise<ChatItem[]> {
  if (role === "worker") {
    return getWorkerChats(currentUserId);
  }

  return getCustomerChats(currentUserId);
}

/* =========================================================
GET CHAT ROOM
========================================================= */

export async function getChat(jobId: string, workerId: string) {
  const response = await api.get("/chats/room", {
    params: {
      jobId,
      workerId,
    },
  });

  return response.data?.data;
}

/* =========================================================
   LISTEN LAST MESSAGE (⭐ NEW)
   ---------------------------------------------------------
   Inbox list-এ প্রতিটা চ্যাটের সর্বশেষ মেসেজ realtime-এ
   দেখানোর জন্য। "messages" কালেকশন থেকে chatId ম্যাচ করে
   সবচেয়ে নতুন (createdAt desc) একটা মাত্র ডকুমেন্ট শোনে।

   এটা আলাদা কোনো "chats" কালেকশন লাগবে না — বিদ্যমান
   "messages" কালেকশনই যথেষ্ট।
========================================================= */

export function listenLastMessage(
  chatId: string,
  callback: (preview: LastMessagePreview | null) => void
) {
  const normalizedChatId = String(chatId);

  const q = query(
    collection(db, "messages"),
    where("chatId", "==", normalizedChatId),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }

      const docSnap = snapshot.docs[0];
      const data = docSnap.data();

      /*
       * ⭐ TYPE অনুযায়ী preview text আগে থেকেই বানিয়ে
       * দিচ্ছি না — সেটা UI component নিজেই বানাবে,
       * এখানে শুধু raw data দিচ্ছি।
       */

      callback({
        message: String(data?.message ?? ""),

        type: String(data?.type ?? "text"),

        createdAt: normalizeDate(data?.createdAt) ?? Date.now(),

        senderId: String(data?.senderId ?? ""),

        isSeen: Boolean(data?.isSeen),
      });
    },
    (error) => {
      console.log("❌ listenLastMessage error:", error);
    }
  );

  return unsubscribe;
}