import { db } from "../config/firebase";
import { ChatRoom } from "../types/chat.types";

const chatCollection = db.collection("chats");
const userCollection = db.collection("users");

/* =========================================================
   HELPERS
========================================================= */

function getTimestamp(value: any): number {
  if (!value) return 0;

  if (typeof value?.toDate === "function") {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string") {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }

  return 0;
}

/* =========================================================
   NORMALIZE USER
========================================================= */

function normalizeUser(
  id: string,
  data: any
) {
  if (!data) {
    return {
      id,
      name: "Unknown",
      photoURL: null,
    };
  }

  const name =
    data.name ??
    data.fullName ??
    data.displayName ??
    data.username ??
    data.userName ??
    data.workerName ??
    data.customerName ??
    "Unknown";

  const photoURL =
    data.photoURL ??
    data.photoUrl ??
    data.profileImage ??
    data.profileImageUrl ??
    data.avatar ??
    data.image ??
    data.imageUrl ??
    null;

  return {
    id: String(id),
    name: String(name),
    photoURL: photoURL
      ? String(photoURL)
      : null,
  };
}

/* =========================================================
   GET USER
========================================================= */

async function getUserById(
  userId?: string
) {
  if (!userId) {
    return null;
  }

  const userDoc = await userCollection
    .doc(String(userId))
    .get();

  if (!userDoc.exists) {
    console.log(
      "⚠️ User not found:",
      userId
    );

    return null;
  }

  return normalizeUser(
    userDoc.id,
    userDoc.data()
  );
}

/* =========================================================
   CREATE CHAT ROOM
========================================================= */

export async function createChatRoom(
  data: ChatRoom
) {
  const now = new Date();

  const docRef = await chatCollection.add({
    ...data,

    lastMessage:
      data.lastMessage ?? "",

    lastMessageAt:
      data.lastMessageAt ?? now,

    createdAt: now,
    updatedAt: now,
  });

  return {
    id: docRef.id,
    ...data,

    lastMessage:
      data.lastMessage ?? "",

    lastMessageAt:
      data.lastMessageAt ?? now,

    createdAt: now,
    updatedAt: now,
  };
}

/* =========================================================
   GET SINGLE CHAT
========================================================= */

export async function getChatRoom(
  jobId: string,
  workerId: string
) {
  const snapshot =
    await chatCollection
      .where(
        "jobId",
        "==",
        jobId
      )
      .where(
        "workerId",
        "==",
        workerId
      )
      .limit(1)
      .get();

  if (snapshot.empty) {
    return null;
  }

  const doc =
    snapshot.docs[0];

  const chat = doc.data();

  const worker =
    await getUserById(
      chat.workerId
    );

  const customer =
    await getUserById(
      chat.customerId
    );

  return {
    id: doc.id,
    ...chat,

    worker,
    customer,
  };
}

/* =========================================================
   CUSTOMER CHAT LIST
========================================================= */

export async function getCustomerChats(
  customerId: string
) {
  const snapshot =
    await chatCollection
      .where(
        "customerId",
        "==",
        customerId
      )
      .get();

  const docs =
    snapshot.docs.sort(
      (a, b) => {
        const aTime =
          getTimestamp(
            a.data().updatedAt
          );

        const bTime =
          getTimestamp(
            b.data().updatedAt
          );

        return bTime - aTime;
      }
    );

  const chats = [];

  for (const doc of docs) {
    const chat = doc.data();

    console.log(
      "👤 Customer Chat Worker ID:",
      chat.workerId
    );

    const worker =
      await getUserById(
        chat.workerId
      );

    chats.push({
      id: doc.id,

      ...chat,

      receiverId:
        String(chat.workerId ?? ""),

      otherUser:
        worker,

      otherUserId:
        String(chat.workerId ?? ""),

      otherUserName:
        worker?.name ??
        "Unknown",

      otherUserPhotoURL:
        worker?.photoURL ??
        null,
    });
  }

  return chats;
}

/* =========================================================
   WORKER CHAT LIST
========================================================= */

export async function getWorkerChats(
  workerId: string
) {
  const snapshot =
    await chatCollection
      .where(
        "workerId",
        "==",
        workerId
      )
      .get();

  const docs =
    snapshot.docs.sort(
      (a, b) => {
        const aTime =
          getTimestamp(
            a.data().updatedAt
          );

        const bTime =
          getTimestamp(
            b.data().updatedAt
          );

        return bTime - aTime;
      }
    );

  const chats = [];

  for (const doc of docs) {
    const chat = doc.data();

    console.log(
      "👤 Worker Chat Customer ID:",
      chat.customerId
    );

    const customer =
      await getUserById(
        chat.customerId
      );

    chats.push({
      id: doc.id,

      ...chat,

      receiverId:
        String(chat.customerId ?? ""),

      otherUser:
        customer,

      otherUserId:
        String(chat.customerId ?? ""),

      otherUserName:
        customer?.name ??
        "Unknown",

      otherUserPhotoURL:
        customer?.photoURL ??
        null,
    });
  }

  return chats;
}

/* =========================================================
   UPDATE LAST MESSAGE
========================================================= */

export async function updateLastMessage(
  chatId: string,
  message: string
) {
  const now = new Date();

  await chatCollection
    .doc(chatId)
    .update({
      lastMessage:
        message,

      lastMessageAt:
        now,

      updatedAt:
        now,
    });
}