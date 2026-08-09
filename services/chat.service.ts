
import api from "./api";

/* =========================================================
TYPES
========================================================= */

export interface ChatUser {
  id: string;
  name: string;
  photoURL: string | null;
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

/* =========================================================
CREATE CHAT
========================================================= */

export async function createChat(data: {
  workerId: string;
  jobId: string;
}) {
  const response = await api.post(
    "/chats/create",
    data
  );

  return response.data?.data;
}

/* =========================================================
NORMALIZE USER
========================================================= */

function normalizeUser(
  user: any
): ChatUser | null {
  if (!user || typeof user !== "object") {
    return null;
  }

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

  const name =
    user.name ??
    user.fullName ??
    user.displayName ??
    user.username ??
    user.userName ??
    user.workerName ??
    user.customerName ??
    "Unknown";

  const photoURL =
    user.photoURL ??
    user.photoUrl ??
    user.profileImage ??
    user.profileImageUrl ??
    user.avatar ??
    user.image ??
    user.imageUrl ??
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
  1. Direct otherUser
  ======================================================= */

  const directUser = normalizeUser(
    chat?.otherUser
  );

  if (
    directUser &&
    (!currentId ||
      directUser.id !== currentId)
  ) {
    return directUser;
  }

  /* =======================================================
  2. Worker
  ======================================================= */

  const worker = normalizeUser(
    chat?.worker
  );

  if (
    worker &&
    (!currentId ||
      worker.id !== currentId)
  ) {
    return worker;
  }

  /* =======================================================
  3. Customer
  ======================================================= */

  const customer = normalizeUser(
    chat?.customer
  );

  if (
    customer &&
    (!currentId ||
      customer.id !== currentId)
  ) {
    return customer;
  }

  /* =======================================================
  4. Receiver
  ======================================================= */

  const receiver = normalizeUser(
    chat?.receiver
  );

  if (
    receiver &&
    (!currentId ||
      receiver.id !== currentId)
  ) {
    return receiver;
  }

  /* =======================================================
  5. Sender
  ======================================================= */

  const sender = normalizeUser(
    chat?.sender
  );

  if (
    sender &&
    (!currentId ||
      sender.id !== currentId)
  ) {
    return sender;
  }

  /* =======================================================
  6. Direct user fields
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
  });

  if (
    directOther &&
    (!currentId ||
      directOther.id !== currentId)
  ) {
    return directOther;
  }

  /* =======================================================
  7. Participants
  ======================================================= */

  if (
    Array.isArray(chat?.participants)
  ) {
    const participant =
      chat.participants
        .map((item: any) =>
          normalizeUser(item)
        )
        .find(
          (item: ChatUser | null) =>
            item &&
            (!currentId ||
              item.id !== currentId)
        );

    if (participant) {
      return participant;
    }
  }

  /* =======================================================
  8. Fallback
  ======================================================= */

  return {
    id: "",
    name: "Unknown",
    photoURL: null,
  };
}

/* =========================================================
DATE NORMALIZER
========================================================= */

function normalizeDate(
  value: any
): number | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  /* Firestore Timestamp */

  if (
    typeof value === "object" &&
    typeof value.seconds === "number"
  ) {
    return value.seconds * 1000;
  }

  if (typeof value === "string") {
    const time = new Date(
      value
    ).getTime();

    if (!Number.isNaN(time)) {
      return time;
    }
  }

  return null;
}

/* =========================================================
NORMALIZE CHAT
========================================================= */

function normalizeChat(
  chat: any,
  currentUserId?: string
): ChatItem {
  const otherUser =
    getOtherUser(
      chat,
      currentUserId
    );

  return {
    id: String(
      chat?.id ??
        chat?._id ??
        chat?.chatId ??
        ""
    ),

    customerId:
      chat?.customerId
        ? String(
            chat.customerId
          )
        : undefined,

    workerId:
      chat?.workerId
        ? String(
            chat.workerId
          )
        : undefined,

    jobId:
      chat?.jobId
        ? String(chat.jobId)
        : undefined,

    otherUser,

    lastMessage:
      chat?.lastMessage ??
      chat?.latestMessage?.message ??
      chat?.lastMessageText ??
      "",

    lastMessageAt:
      normalizeDate(
        chat?.lastMessageAt ??
          chat?.latestMessage
            ?.createdAt ??
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
  const response =
    await api.get(
      "/chats/customer"
    );

  const raw =
    response.data?.data ??
    response.data ??
    [];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map(
    (chat: any) =>
      normalizeChat(
        chat,
        currentUserId
      )
  );
}

/* =========================================================
GET WORKER CHATS
========================================================= */

export async function getWorkerChats(
  currentUserId?: string
): Promise<ChatItem[]> {
  const response =
    await api.get(
      "/chats/worker"
    );

  const raw =
    response.data?.data ??
    response.data ??
    [];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map(
    (chat: any) =>
      normalizeChat(
        chat,
        currentUserId
      )
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
    return getWorkerChats(
      currentUserId
    );
  }

  return getCustomerChats(
    currentUserId
  );
}

/* =========================================================
GET CHAT ROOM
========================================================= */

export async function getChat(
  jobId: string,
  workerId: string
) {
  const response =
    await api.get(
      "/chats/room",
      {
        params: {
          jobId,
          workerId,
        },
      }
    );

  return response.data?.data;
}

