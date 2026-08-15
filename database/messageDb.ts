import { db, initDatabase } from "./database";

/* =========================================================
   TYPES
========================================================= */

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

  clientMessageId?: string | null;

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

/* =========================================================
   DATABASE
========================================================= */

function ensureDatabase() {
  initDatabase();
}

/* =========================================================
   SAFE STRING
========================================================= */

function safeString(
  value: unknown,
  fallback = ""
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value);
}

/* =========================================================
   CLIENT MESSAGE ID
========================================================= */

function normalizeClientMessageId(
  value?: string | null
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const result =
    String(value).trim();

  return result.length > 0
    ? result
    : null;
}

/* =========================================================
   MESSAGE TYPE
========================================================= */

function normalizeMessageType(
  value: unknown
): MessageType {
  if (value === "image") {
    return "image";
  }

  if (value === "voice") {
    return "voice";
  }

  if (value === "file") {
    return "file";
  }

  return "text";
}

/* =========================================================
   MESSAGE STATUS
========================================================= */

function normalizeMessageStatus(
  value: unknown
): MessageStatus {
  if (value === "sending") {
    return "sending";
  }

  if (value === "delivered") {
    return "delivered";
  }

  if (value === "seen") {
    return "seen";
  }

  if (value === "failed") {
    return "failed";
  }

  return "sent";
}

/* =========================================================
   SAFE REPLY PARSER
========================================================= */

function parseReplyTo(
  value: any
): ReplyTo | null {
  if (!value) {
    return null;
  }

  try {
    const parsed =
      typeof value === "string"
        ? JSON.parse(value)
        : value;

    if (!parsed) {
      return null;
    }

    return {
      id: safeString(
        parsed?.id
      ),

      message: safeString(
        parsed?.message
      ),

      type: normalizeMessageType(
        parsed?.type
      ),

      senderId: safeString(
        parsed?.senderId
      ),
    };
  } catch (error) {
    console.log(
      "❌ Reply parse error:",
      error
    );

    return null;
  }
}

/* =========================================================
   ROW → LOCAL MESSAGE
========================================================= */

function rowToMessage(
  item: any,
  fallbackChatId = ""
): LocalMessage {
  return {
    id: safeString(
      item?.id
    ),

    clientMessageId:
      normalizeClientMessageId(
        item?.clientMessageId
      ),

    chatId: safeString(
      item?.chatId,
      fallbackChatId
    ),

    senderId: safeString(
      item?.senderId
    ),

    receiverId: safeString(
      item?.receiverId
    ),

    message: safeString(
      item?.message
    ),

    type: normalizeMessageType(
      item?.type
    ),

    imageUrl:
      item?.imageUrl ?? null,

    voiceUrl:
      item?.voiceUrl ?? null,

    fileUrl:
      item?.fileUrl ?? null,

    replyTo:
      parseReplyTo(
        item?.replyTo
      ),

    status:
      normalizeMessageStatus(
        item?.status
      ),

    isSeen: Number(
      item?.isSeen ?? 0
    ),

    createdAt: Number(
      item?.createdAt ?? 0
    ),

    updatedAt: Number(
      item?.updatedAt ??
        item?.createdAt ??
        0
    ),
  };
}

/* =========================================================
   INSERT / UPSERT MESSAGE

   ⭐ Duplicate prevention:
   1. clientMessageId
   2. server message id
========================================================= */

export function insertMessage(
  message: LocalMessage
) {
  try {
    ensureDatabase();

    const id =
      safeString(
        message.id
      );

    const clientMessageId =
      normalizeClientMessageId(
        message.clientMessageId
      );

    const chatId =
      safeString(
        message.chatId
      );

    const senderId =
      safeString(
        message.senderId
      );

    const receiverId =
      safeString(
        message.receiverId
      );

    const messageText =
      safeString(
        message.message
      );

    const type =
      normalizeMessageType(
        message.type
      );

    const createdAt =
      Number(
        message.createdAt ??
          Date.now()
      );

    const updatedAt =
      Number(
        message.updatedAt ??
          createdAt
      );

    /* =====================================================
       CASE 1
       clientMessageId দিয়ে existing message
    ===================================================== */

    if (clientMessageId) {
      const existing =
        db.getFirstSync(
          `
          SELECT id
          FROM messages
          WHERE clientMessageId = ?
          LIMIT 1
          `,
          [clientMessageId]
        ) as
          | {
              id?: string;
            }
          | null;

      if (existing?.id) {
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
            updatedAt = ?,
            clientMessageId = ?
          WHERE clientMessageId = ?
          `,
          [
            id,
            chatId,
            senderId,
            receiverId,
            messageText,
            type,

            message.imageUrl ??
              null,

            message.voiceUrl ??
              null,

            message.fileUrl ??
              null,

            message.replyTo
              ? JSON.stringify(
                  message.replyTo
                )
              : null,

            message.status ??
              "sent",

            Number(
              message.isSeen ?? 0
            ),

            createdAt,
            updatedAt,

            clientMessageId,
            clientMessageId,
          ]
        );

        return;
      }
    }

    /* =====================================================
       CASE 2
       Server ID already exists
    ===================================================== */

    const existingById =
      db.getFirstSync(
        `
        SELECT id
        FROM messages
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      ) as
        | {
            id?: string;
          }
        | null;

    if (existingById?.id) {
      db.runSync(
        `
        UPDATE messages
        SET
          clientMessageId = ?,
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
          clientMessageId,
          chatId,
          senderId,
          receiverId,
          messageText,
          type,

          message.imageUrl ??
            null,

          message.voiceUrl ??
            null,

          message.fileUrl ??
            null,

          message.replyTo
            ? JSON.stringify(
                message.replyTo
              )
            : null,

          message.status ??
            "sent",

          Number(
            message.isSeen ?? 0
          ),

          createdAt,
          updatedAt,

          id,
        ]
      );

      return;
    }

    /* =====================================================
       CASE 3
       Completely new message
    ===================================================== */

    db.runSync(
      `
      INSERT INTO messages (
        id,
        clientMessageId,
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
      VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?
      )
      `,
      [
        id,
        clientMessageId,
        chatId,
        senderId,
        receiverId,
        messageText,
        type,

        message.imageUrl ??
          null,

        message.voiceUrl ??
          null,

        message.fileUrl ??
          null,

        message.replyTo
          ? JSON.stringify(
              message.replyTo
            )
          : null,

        message.status ??
          "sent",

        Number(
          message.isSeen ?? 0
        ),

        createdAt,
        updatedAt,
      ]
    );
  } catch (error) {
    console.log(
      "❌ insertMessage error:",
      error
    );
  }
}

/* =========================================================
   INSERT MANY
========================================================= */

export function insertMessages(
  messages: LocalMessage[]
) {
  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    return;
  }

  ensureDatabase();

  for (const message of messages) {
    insertMessage(message);
  }
}

/* =========================================================
   GET CHAT MESSAGES
========================================================= */

export function getMessagesByChatId(
  chatId: string
): LocalMessage[] {
  try {
    ensureDatabase();

    const rows =
      db.getAllSync(
        `
        SELECT *
        FROM messages
        WHERE chatId = ?
        ORDER BY createdAt ASC, rowid ASC
        `,
        [safeString(chatId)]
      ) as any[];

    const messageMap =
      new Map<
        string,
        LocalMessage
      >();

    for (const item of rows) {
      const message =
        rowToMessage(
          item,
          chatId
        );

      const clientId =
        normalizeClientMessageId(
          message.clientMessageId
        );

      const key = clientId
        ? `client:${clientId}`
        : `id:${message.id}`;

      const previous =
        messageMap.get(key);

      if (!previous) {
        messageMap.set(
          key,
          message
        );

        continue;
      }

      if (
        message.updatedAt >=
        previous.updatedAt
      ) {
        messageMap.set(
          key,
          message
        );
      }
    }

    return Array.from(
      messageMap.values()
    ).sort(
      (a, b) =>
        a.createdAt -
        b.createdAt
    );
  } catch (error) {
    console.log(
      "❌ getMessagesByChatId error:",
      error
    );

    return [];
  }
}

/* =========================================================
   UPDATE STATUS BY SERVER ID
========================================================= */

export function updateMessageStatus(
  id: string,
  status: MessageStatus
) {
  try {
    ensureDatabase();

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
        safeString(id),
      ]
    );
  } catch (error) {
    console.log(
      "❌ updateMessageStatus error:",
      error
    );
  }
}

/* =========================================================
   UPDATE STATUS BY CLIENT ID
========================================================= */

export function updateMessageStatusByClientMessageId(
  clientMessageId: string,
  status: MessageStatus
) {
  try {
    ensureDatabase();

    db.runSync(
      `
      UPDATE messages
      SET
        status = ?,
        updatedAt = ?
      WHERE clientMessageId = ?
      `,
      [
        status,
        Date.now(),
        safeString(
          clientMessageId
        ),
      ]
    );
  } catch (error) {
    console.log(
      "❌ updateMessageStatusByClientMessageId error:",
      error
    );
  }
}

/* =========================================================
   UPDATE VOICE URL BY SERVER ID
========================================================= */

export function updateMessageVoiceUrl(
  id: string,
  voiceUrl: string
) {
  try {
    ensureDatabase();

    db.runSync(
      `
      UPDATE messages
      SET
        voiceUrl = ?,
        updatedAt = ?
      WHERE id = ?
      `,
      [
        voiceUrl,
        Date.now(),
        safeString(id),
      ]
    );
  } catch (error) {
    console.log(
      "❌ updateMessageVoiceUrl error:",
      error
    );
  }
}

/* =========================================================
   UPDATE VOICE URL BY CLIENT ID
========================================================= */

export function updateMessageVoiceUrlByClientMessageId(
  clientMessageId: string,
  voiceUrl: string
) {
  try {
    ensureDatabase();

    db.runSync(
      `
      UPDATE messages
      SET
        voiceUrl = ?,
        updatedAt = ?
      WHERE clientMessageId = ?
      `,
      [
        voiceUrl,
        Date.now(),
        safeString(
          clientMessageId
        ),
      ]
    );
  } catch (error) {
    console.log(
      "❌ updateMessageVoiceUrlByClientMessageId error:",
      error
    );
  }
}

/* =========================================================
   REPLACE TEMP MESSAGE
========================================================= */

export function replaceMessageId(
  oldId: string,
  newMessage: LocalMessage
) {
  try {
    ensureDatabase();

    const oldMessageId =
      safeString(oldId);

    const newMessageId =
      safeString(
        newMessage.id
      );

    const clientMessageId =
      normalizeClientMessageId(
        newMessage.clientMessageId
      );

    /* =====================================================
       SERVER ID EXISTS
    ===================================================== */

    const existingByServerId =
      db.getFirstSync(
        `
        SELECT *
        FROM messages
        WHERE id = ?
        LIMIT 1
        `,
        [newMessageId]
      ) as any | null;

    /* =====================================================
       CLIENT ID EXISTS
    ===================================================== */

    let existingByClientId:
      | any
      | null = null;

    if (clientMessageId) {
      existingByClientId =
        db.getFirstSync(
          `
          SELECT *
          FROM messages
          WHERE clientMessageId = ?
          LIMIT 1
          `,
          [clientMessageId]
        ) as any | null;
    }

    /* =====================================================
       CASE A
       Server message already exists
    ===================================================== */

    if (
      existingByServerId &&
      existingByServerId.id !==
        oldMessageId
    ) {
      db.runSync(
        `
        DELETE FROM messages
        WHERE id = ?
        `,
        [oldMessageId]
      );

      db.runSync(
        `
        UPDATE messages
        SET
          clientMessageId = ?,
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
          clientMessageId,

          safeString(
            newMessage.chatId
          ),

          safeString(
            newMessage.senderId
          ),

          safeString(
            newMessage.receiverId
          ),

          safeString(
            newMessage.message
          ),

          normalizeMessageType(
            newMessage.type
          ),

          newMessage.imageUrl ??
            null,

          newMessage.voiceUrl ??
            null,

          newMessage.fileUrl ??
            null,

          newMessage.replyTo
            ? JSON.stringify(
                newMessage.replyTo
              )
            : null,

          newMessage.status ??
            "sent",

          Number(
            newMessage.isSeen ?? 0
          ),

          Number(
            newMessage.createdAt ??
              Date.now()
          ),

          Number(
            newMessage.updatedAt ??
              Date.now()
          ),

          newMessageId,
        ]
      );

      return;
    }

    /* =====================================================
       CASE B
       Same clientMessageId exists
    ===================================================== */

    if (
      existingByClientId &&
      existingByClientId.id !==
        oldMessageId
    ) {
      const existingId =
        safeString(
          existingByClientId.id
        );

      if (
        oldMessageId !==
        existingId
      ) {
        db.runSync(
          `
          DELETE FROM messages
          WHERE id = ?
          `,
          [oldMessageId]
        );
      }

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
          updatedAt = ?,
          clientMessageId = ?
        WHERE id = ?
        `,
        [
          newMessageId,

          safeString(
            newMessage.chatId
          ),

          safeString(
            newMessage.senderId
          ),

          safeString(
            newMessage.receiverId
          ),

          safeString(
            newMessage.message
          ),

          normalizeMessageType(
            newMessage.type
          ),

          newMessage.imageUrl ??
            null,

          newMessage.voiceUrl ??
            null,

          newMessage.fileUrl ??
            null,

          newMessage.replyTo
            ? JSON.stringify(
                newMessage.replyTo
              )
            : null,

          newMessage.status ??
            "sent",

          Number(
            newMessage.isSeen ?? 0
          ),

          Number(
            newMessage.createdAt ??
              Date.now()
          ),

          Number(
            newMessage.updatedAt ??
              Date.now()
          ),

          clientMessageId,

          existingId,
        ]
      );

      return;
    }

    /* =====================================================
       CASE C
       Old temporary row exists
    ===================================================== */

    const oldRow =
      db.getFirstSync(
        `
        SELECT id
        FROM messages
        WHERE id = ?
        LIMIT 1
        `,
        [oldMessageId]
      ) as
        | {
            id?: string;
          }
        | null;

    if (oldRow?.id) {
      db.runSync(
        `
        UPDATE messages
        SET
          id = ?,
          clientMessageId = ?,
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
          newMessageId,
          clientMessageId,

          safeString(
            newMessage.chatId
          ),

          safeString(
            newMessage.senderId
          ),

          safeString(
            newMessage.receiverId
          ),

          safeString(
            newMessage.message
          ),

          normalizeMessageType(
            newMessage.type
          ),

          newMessage.imageUrl ??
            null,

          newMessage.voiceUrl ??
            null,

          newMessage.fileUrl ??
            null,

          newMessage.replyTo
            ? JSON.stringify(
                newMessage.replyTo
              )
            : null,

          newMessage.status ??
            "sent",

          Number(
            newMessage.isSeen ?? 0
          ),

          Number(
            newMessage.createdAt ??
              Date.now()
          ),

          Number(
            newMessage.updatedAt ??
              Date.now()
          ),

          oldMessageId,
        ]
      );

      return;
    }

    /* =====================================================
       CASE D
       No row exists
    ===================================================== */

    insertMessage(
      newMessage
    );
  } catch (error) {
    console.log(
      "❌ replaceMessageId error:",
      error
    );
  }
}

/* =========================================================
   MARK CHAT AS SEEN
========================================================= */

export function markSeen(
  chatId: string
) {
  try {
    ensureDatabase();

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
        safeString(chatId),
      ]
    );
  } catch (error) {
    console.log(
      "❌ markSeen error:",
      error
    );
  }
}

/* =========================================================
   DELETE MESSAGE
========================================================= */

export function deleteMessage(
  id: string
) {
  try {
    ensureDatabase();

    db.runSync(
      `
      DELETE FROM messages
      WHERE id = ?
      `,
      [safeString(id)]
    );
  } catch (error) {
    console.log(
      "❌ deleteMessage error:",
      error
    );
  }
}

/* =========================================================
   DELETE BY CLIENT MESSAGE ID
========================================================= */

export function deleteMessageByClientMessageId(
  clientMessageId: string
) {
  try {
    ensureDatabase();

    db.runSync(
      `
      DELETE FROM messages
      WHERE clientMessageId = ?
      `,
      [
        safeString(
          clientMessageId
        ),
      ]
    );
  } catch (error) {
    console.log(
      "❌ deleteMessageByClientMessageId error:",
      error
    );
  }
}

/* =========================================================
   GET PENDING MESSAGES
========================================================= */

export function getPendingMessages():
  LocalMessage[] {
  try {
    ensureDatabase();

    const rows =
      db.getAllSync(
        `
        SELECT *
        FROM messages
        WHERE status = 'sending'
        ORDER BY createdAt ASC
        `
      ) as any[];

    return rows.map(
      (item) =>
        rowToMessage(item)
    );
  } catch (error) {
    console.log(
      "❌ getPendingMessages error:",
      error
    );

    return [];
  }
}

/* =========================================================
   FIND MESSAGE BY CLIENT ID
========================================================= */

export function getMessageByClientMessageId(
  clientMessageId: string
): LocalMessage | null {
  try {
    ensureDatabase();

    const row =
      db.getFirstSync(
        `
        SELECT *
        FROM messages
        WHERE clientMessageId = ?
        LIMIT 1
        `,
        [
          safeString(
            clientMessageId
          ),
        ]
      ) as any | null;

    if (!row) {
      return null;
    }

    return rowToMessage(
      row
    );
  } catch (error) {
    console.log(
      "❌ getMessageByClientMessageId error:",
      error
    );

    return null;
  }
}

/* =========================================================
   CLEAN DUPLICATES
========================================================= */

export function cleanupMessageDuplicates() {
  try {
    ensureDatabase();

    /*
     * Same clientMessageId-এর duplicate row
     * থাকলে সবচেয়ে নতুন row রাখবো।
     */

    db.execSync(`
      DELETE FROM messages
      WHERE rowid NOT IN (
        SELECT MAX(rowid)
        FROM messages
        WHERE clientMessageId IS NOT NULL
          AND TRIM(clientMessageId) != ''
        GROUP BY clientMessageId
      )
      AND clientMessageId IS NOT NULL
      AND TRIM(clientMessageId) != '';
    `);

    console.log(
      "✅ Message duplicates cleaned"
    );
  } catch (error) {
    console.log(
      "❌ cleanupMessageDuplicates error:",
      error
    );
  }
}