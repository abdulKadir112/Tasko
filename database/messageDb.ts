import { db } from "./database";

/* ===========================
   TYPES
=========================== */

export type MessageType =
  | "text"
  | "image"
  | "voice"
  | "file";

export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "seen"
  | "failed";

export interface ReplyTo {
  id: string;
  message: string;
  type: MessageType;
  senderId: string;
}

export interface LocalMessage {
  id: string;

  chatId: string;

  senderId: string;

  receiverId: string;

  message: string;

  type: MessageType;

  imageUrl: string | null;

  voiceUrl: string | null;

  fileUrl: string | null;

  replyTo: ReplyTo | null;

  status: MessageStatus;

  isSeen: number;

  createdAt: number;

  updatedAt: number;
}

/* ===========================
   SAFE REPLY PARSER
=========================== */

function parseReplyTo(value: any): ReplyTo | null {
  if (!value) {
    return null;
  }

  try {
    if (typeof value === "string") {
      return JSON.parse(value);
    }

    return value;
  } catch (error) {
    console.log("❌ Reply parse error:", error);
    return null;
  }
}

/* ===========================
   INSERT ONE MESSAGE
=========================== */

export function insertMessage(message: LocalMessage) {
  db.runSync(
    `
    INSERT OR REPLACE INTO messages (
      id,
      chatId,
      senderId,
      receiverId,
      message,
      type,
      imageUrl,
      voiceUrl,
      fileUrl,
      replyTo,
      status,
      isSeen,
      createdAt,
      updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      message.id,
      message.chatId,
      message.senderId,
      message.receiverId,
      message.message,
      message.type,
      message.imageUrl,
      message.voiceUrl,
      message.fileUrl,

      message.replyTo
        ? JSON.stringify(message.replyTo)
        : null,

      message.status,
      message.isSeen,
      message.createdAt,
      message.updatedAt,
    ]
  );
}

/* ===========================
   INSERT MANY MESSAGES
=========================== */

export function insertMessages(
  messages: LocalMessage[]
) {
  messages.forEach((message) => {
    insertMessage(message);
  });
}

/* ===========================
   GET CHAT MESSAGES
=========================== */

export function getMessagesByChatId(
  chatId: string
): LocalMessage[] {
  const rows = db.getAllSync(
    `
    SELECT *
    FROM messages
    WHERE chatId = ?
    ORDER BY createdAt ASC
    `,
    [chatId]
  ) as any[];

  return rows.map((item) => ({
    id: String(item.id),

    chatId: String(item.chatId),

    senderId: String(item.senderId),

    receiverId: String(item.receiverId),

    message: item.message ?? "",

    type: item.type ?? "text",

    imageUrl: item.imageUrl ?? null,

    voiceUrl: item.voiceUrl ?? null,

    fileUrl: item.fileUrl ?? null,

    replyTo: parseReplyTo(item.replyTo),

    status: item.status ?? "sent",

    isSeen: Number(item.isSeen ?? 0),

    createdAt: Number(item.createdAt ?? 0),

    updatedAt: Number(item.updatedAt ?? 0),
  }));
}

/* ===========================
   UPDATE MESSAGE STATUS
=========================== */

export function updateMessageStatus(
  id: string,
  status: MessageStatus
) {
  db.runSync(
    `
    UPDATE messages
    SET
      status = ?,
      updatedAt = ?
    WHERE id = ?
    `,
    [
      status,
      Date.now(),
      id,
    ]
  );
}

/* ===========================
   REPLACE TEMP MESSAGE
   TEMP ID → REAL SERVER ID
=========================== */

export function replaceMessageId(
  oldId: string,
  newMessage: LocalMessage
) {
  db.runSync(
    `
    UPDATE messages
    SET
      id = ?,
      chatId = ?,
      senderId = ?,
      receiverId = ?,
      message = ?,
      type = ?,
      imageUrl = ?,
      voiceUrl = ?,
      fileUrl = ?,
      replyTo = ?,
      status = ?,
      isSeen = ?,
      createdAt = ?,
      updatedAt = ?
    WHERE id = ?
    `,
    [
      newMessage.id,
      newMessage.chatId,
      newMessage.senderId,
      newMessage.receiverId,
      newMessage.message,
      newMessage.type,
      newMessage.imageUrl,
      newMessage.voiceUrl,
      newMessage.fileUrl,
      newMessage.replyTo
        ? JSON.stringify(newMessage.replyTo)
        : null,
      newMessage.status,
      newMessage.isSeen,
      newMessage.createdAt,
      newMessage.updatedAt,
      oldId,
    ]
  );
}

/* ===========================
   MARK CHAT AS SEEN
=========================== */

export function markSeen(chatId: string) {
  db.runSync(
    `
    UPDATE messages
    SET
      isSeen = 1,
      status = 'seen',
      updatedAt = ?
    WHERE chatId = ?
    `,
    [
      Date.now(),
      chatId,
    ]
  );
}

/* ===========================
   DELETE MESSAGE
=========================== */

export function deleteMessage(id: string) {
  db.runSync(
    `
    DELETE FROM messages
    WHERE id = ?
    `,
    [id]
  );
}

/* ===========================
   GET PENDING MESSAGES
=========================== */

export function getPendingMessages(): LocalMessage[] {
  const rows = db.getAllSync(
    `
    SELECT *
    FROM messages
    WHERE status = 'sending'
    ORDER BY createdAt ASC
    `
  ) as any[];

  return rows.map((item) => ({
    id: String(item.id),

    chatId: String(item.chatId),

    senderId: String(item.senderId),

    receiverId: String(item.receiverId),

    message: item.message ?? "",

    type: item.type ?? "text",

    imageUrl: item.imageUrl ?? null,

    voiceUrl: item.voiceUrl ?? null,

    fileUrl: item.fileUrl ?? null,

    replyTo: parseReplyTo(item.replyTo),

    status: item.status ?? "sending",

    isSeen: Number(item.isSeen ?? 0),

    createdAt: Number(item.createdAt ?? 0),

    updatedAt: Number(item.updatedAt ?? 0),
  }));
}