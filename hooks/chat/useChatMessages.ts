
import { useEffect, useRef, useState } from "react";

import {
  getMessagesByChatId,
  insertMessages,
  type LocalMessage,
} from "@/database/messageDb";

import {
  listenMessages,
  seenMessages,
} from "@/services/message.service";

/*
=========================================================
HOOK
=========================================================
*/

export function useChatMessages(
  chatId?: string,
  currentUserId?: string,
  receiverId?: string
) {
  const flatRef = useRef<any>(null);

  const [messages, setMessages] =
    useState<LocalMessage[]>([]);

  const mountedRef =
    useRef(true);

  /*
  ========================================================
  OTHER USER ID
  ========================================================
  */

  const otherUserId =
    getOtherUserId(
      currentUserId,
      receiverId,
      messages
    );

  /*
  ========================================================
  MOUNT / UNMOUNT
  ========================================================
  */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /*
  ========================================================
  CHAT CHANGE
  ========================================================
  */

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const id = String(chatId);

    /*
    ========================================================
    1. LOAD SQLITE FIRST
    ========================================================
    */

    try {
      const localMessages =
        getMessagesByChatId(id);

      if (mountedRef.current) {
        setMessages(
          deduplicateMessages(
            localMessages
          )
        );
      }
    } catch (error) {
      console.log(
        "❌ SQLite message read error:",
        error
      );

      if (mountedRef.current) {
        setMessages([]);
      }
    }

    /*
    ========================================================
    2. FIREBASE REALTIME LISTENER
    ========================================================
    */

    const unsubscribe =
      listenMessages(
        id,
        (remoteList) => {
          if (!mountedRef.current) {
            return;
          }

          /*
          ==================================================
          3. FIREBASE → LOCAL MESSAGE FORMAT
          ==================================================
          */

          const firebaseMessages =
            remoteList
              .map(
                (item: any) => {
                  const createdAt =
                    normalizeDate(
                      item?.createdAt
                    );

                  const updatedAt =
                    normalizeDate(
                      item?.updatedAt,
                      createdAt
                    );

                  const clientMessageId =
                    normalizeClientMessageId(
                      item?.clientMessageId
                    );

                  return {
                    id: String(
                      item?.id ?? ""
                    ),

                    /*
                     * ⭐ IMPORTANT
                     *
                     * Firebase থেকে clientMessageId
                     * অবশ্যই নিতে হবে।
                     */
                    clientMessageId,

                    chatId: String(
                      item?.chatId ?? id
                    ),

                    senderId: String(
                      item?.senderId ?? ""
                    ),

                    receiverId: String(
                      item?.receiverId ?? ""
                    ),

                    message:
                      item?.message ?? "",

                    type:
                      item?.type ?? "text",

                    imageUrl:
                      item?.imageUrl ??
                      null,

                    voiceUrl:
                      item?.voiceUrl ??
                      null,

                    fileUrl:
                      item?.fileUrl ??
                      null,

                    replyTo:
                      normalizeReplyTo(
                        item?.replyTo
                      ),

                    status:
                      item?.isSeen
                        ? "seen"
                        : "sent",

                    isSeen:
                      item?.isSeen
                        ? 1
                        : 0,

                    createdAt,
                    updatedAt,
                  } satisfies LocalMessage;
                }
              )
              .filter(
                (message) =>
                  Boolean(
                    message.id
                  )
              );

          /*
          ==================================================
          4. REMOVE DUPLICATES INSIDE FIREBASE LIST
          ==================================================
          */

          const uniqueFirebaseMessages =
            deduplicateMessages(
              firebaseMessages
            );

          /*
          ==================================================
          5. FIREBASE → SQLITE
          ==================================================
          */

          if (
            uniqueFirebaseMessages.length >
            0
          ) {
            try {
              insertMessages(
                uniqueFirebaseMessages
              );
            } catch (error) {
              console.log(
                "❌ SQLite sync error:",
                error
              );
            }
          }

          /*
          ==================================================
          6. LOCAL + FIREBASE MERGE
          ==================================================
          */

          setMessages(
            (previous) => {
              if (
                !mountedRef.current
              ) {
                return previous;
              }

              /*
              ----------------------------------------------
              LOCAL + FIREBASE
              ----------------------------------------------
              */

              const combined: LocalMessage[] =
                [
                  ...previous,
                  ...uniqueFirebaseMessages,
                ];

              /*
              ----------------------------------------------
              IMPORTANT:
              একই message-এর optimistic copy
              এবং Firebase copy থাকলে
              এখানে একটি মাত্র রাখা হবে।
              ----------------------------------------------
              */

              return deduplicateMessages(
                combined
              );
            }
          );
        }
      );

    /*
    ========================================================
    7. MARK CHAT AS SEEN
    ========================================================
    */

    void seenMessages(id).catch(
      (error) => {
        console.log(
          "⚠️ Seen update failed:",
          error
        );
      }
    );

    /*
    ========================================================
    8. CLEANUP
    ========================================================
    */

    return () => {
      unsubscribe?.();
    };
  }, [chatId]);

  /*
  ========================================================
  RETURN
  ========================================================
  */

  return {
    messages,
    setMessages,
    flatRef,
    otherUserId,
  };
}

/*
=========================================================
DUPLICATE-SAFE MESSAGE MERGER
=========================================================
*/

/**
 * একই message একাধিক source থেকে এলে
 * একটি মাত্র message রাখে।
 *
 * Priority:
 *
 * 1. clientMessageId
 * 2. server/Firebase id
 * 3. optimistic content + timestamp fallback
 */

function deduplicateMessages(
  input: LocalMessage[]
): LocalMessage[] {
  if (
    !Array.isArray(input) ||
    input.length === 0
  ) {
    return [];
  }

  /*
  ========================================================
  MAPS
  ========================================================
  */

  const byClientId =
    new Map<
      string,
      LocalMessage
    >();

  const byId =
    new Map<
      string,
      LocalMessage
    >();

  /*
  ========================================================
  PROCESS MESSAGE
  ========================================================
  */

  for (const message of input) {
    if (!message) {
      continue;
    }

    const normalized =
      normalizeLocalMessage(
        message
      );

    /*
    --------------------------------------------------------
    1. CLIENT MESSAGE ID
    --------------------------------------------------------
    */

    const clientMessageId =
      normalizeClientMessageId(
        normalized.clientMessageId
      );

    if (clientMessageId) {
      const existing =
        byClientId.get(
          clientMessageId
        );

      if (!existing) {
        byClientId.set(
          clientMessageId,
          normalized
        );
      } else {
        byClientId.set(
          clientMessageId,
          chooseBetterMessage(
            existing,
            normalized
          )
        );
      }

      continue;
    }

    /*
    --------------------------------------------------------
    2. SERVER / FIREBASE ID
    --------------------------------------------------------
    */

    const messageId =
      String(
        normalized.id ?? ""
      ).trim();

    if (messageId) {
      const existing =
        byId.get(messageId);

      if (!existing) {
        byId.set(
          messageId,
          normalized
        );
      } else {
        byId.set(
          messageId,
          chooseBetterMessage(
            existing,
            normalized
          )
        );
      }

      continue;
    }
  }

  /*
  ========================================================
  COMBINE CLIENT ID MAP
  ========================================================
  */

  const finalMessages: LocalMessage[] =
    Array.from(
      byClientId.values()
    );

  /*
  ========================================================
  ADD SERVER ID MESSAGES
  ========================================================
  */

  for (const message of byId.values()) {
    /*
    ------------------------------------------------------
    যদি clientMessageId-এর message-এর
    সাথে একই message হয়, তাহলে দ্বিতীয়টি
    যোগ করবো না।
    ------------------------------------------------------
    */

    const duplicate =
      finalMessages.some(
        (existing) =>
          areSameMessage(
            existing,
            message
          )
      );

    if (!duplicate) {
      finalMessages.push(
        message
      );
    }
  }

  /*
  ========================================================
  FINAL SORT
  ========================================================
  */

  return finalMessages.sort(
    (a, b) =>
      Number(a.createdAt ?? 0) -
      Number(b.createdAt ?? 0)
  );
}

/*
=========================================================
SAME MESSAGE DETECTION
=========================================================
*/

function areSameMessage(
  a: LocalMessage,
  b: LocalMessage
): boolean {
  /*
  ========================================================
  1. CLIENT MESSAGE ID
  ========================================================
  */

  const aClient =
    normalizeClientMessageId(
      a.clientMessageId
    );

  const bClient =
    normalizeClientMessageId(
      b.clientMessageId
    );

  if (
    aClient &&
    bClient &&
    aClient === bClient
  ) {
    return true;
  }

  /*
  ========================================================
  2. SERVER ID
  ========================================================
  */

  const aId =
    String(a.id ?? "").trim();

  const bId =
    String(b.id ?? "").trim();

  if (
    aId &&
    bId &&
    aId === bId
  ) {
    return true;
  }

  /*
  ========================================================
  3. OPTIMISTIC FALLBACK
  ========================================================
  */

  /*
   * শুধু একই chat + sender + receiver +
   * type + content হলে এবং timestamp কাছাকাছি হলে
   * duplicate হিসেবে ধরবো।
   */

  if (
    String(a.chatId) !==
    String(b.chatId)
  ) {
    return false;
  }

  if (
    String(a.senderId) !==
    String(b.senderId)
  ) {
    return false;
  }

  if (
    String(a.receiverId) !==
    String(b.receiverId)
  ) {
    return false;
  }

  if (
    String(a.type) !==
    String(b.type)
  ) {
    return false;
  }

  /*
  --------------------------------------------------------
  TEXT
  --------------------------------------------------------
  */

  if (
    String(a.message ?? "") !==
    String(b.message ?? "")
  ) {
    return false;
  }

  /*
  --------------------------------------------------------
  MEDIA URL
  --------------------------------------------------------
  */

  if (
    String(a.imageUrl ?? "") !==
    String(b.imageUrl ?? "")
  ) {
    return false;
  }

  if (
    String(a.voiceUrl ?? "") !==
    String(b.voiceUrl ?? "")
  ) {
    return false;
  }

  if (
    String(a.fileUrl ?? "") !==
    String(b.fileUrl ?? "")
  ) {
    return false;
  }

  /*
  --------------------------------------------------------
  TIME WINDOW
  --------------------------------------------------------
  */

  const timeDifference =
    Math.abs(
      Number(a.createdAt ?? 0) -
        Number(b.createdAt ?? 0)
    );

  return (
    timeDifference <= 10000
  );
}

/*
=========================================================
CHOOSE BETTER MESSAGE
=========================================================
*/

function chooseBetterMessage(
  existing: LocalMessage,
  incoming: LocalMessage
): LocalMessage {
  /*
  ========================================================
  FIREBASE/SERVER MESSAGE SHOULD WIN
  ========================================================
  */

  const existingSending =
    existing.status ===
    "sending";

  const existingFailed =
    existing.status ===
    "failed";

  const incomingSending =
    incoming.status ===
    "sending";

  const incomingFailed =
    incoming.status ===
    "failed";

  /*
  --------------------------------------------------------
  incoming server message
  --------------------------------------------------------
  */

  if (
    (existingSending ||
      existingFailed) &&
    !incomingSending &&
    !incomingFailed
  ) {
    return mergeMessageData(
      existing,
      incoming
    );
  }

  /*
  --------------------------------------------------------
  existing server message
  --------------------------------------------------------
  */

  if (
    !existingSending &&
    !existingFailed &&
    (incomingSending ||
      incomingFailed)
  ) {
    return mergeMessageData(
      incoming,
      existing
    );
  }

  /*
  ========================================================
  UPDATED TIME
  ========================================================
  */

  if (
    Number(
      incoming.updatedAt ?? 0
    ) >=
    Number(
      existing.updatedAt ?? 0
    )
  ) {
    return mergeMessageData(
      existing,
      incoming
    );
  }

  return mergeMessageData(
    incoming,
    existing
  );
}

/*
=========================================================
MERGE MESSAGE DATA
=========================================================
*/

function mergeMessageData(
  oldMessage: LocalMessage,
  newMessage: LocalMessage
): LocalMessage {
  return {
    ...oldMessage,
    ...newMessage,

    /*
     * নতুন message-এ clientMessageId না থাকলে
     * পুরোনোটা রাখবো।
     */

    clientMessageId:
      normalizeClientMessageId(
        newMessage.clientMessageId
      ) ??
      normalizeClientMessageId(
        oldMessage.clientMessageId
      ),

    /*
     * URL missing হলে পুরোনো URL হারাবে না।
     */

    imageUrl:
      newMessage.imageUrl ??
      oldMessage.imageUrl ??
      null,

    voiceUrl:
      newMessage.voiceUrl ??
      oldMessage.voiceUrl ??
      null,

    fileUrl:
      newMessage.fileUrl ??
      oldMessage.fileUrl ??
      null,

    replyTo:
      newMessage.replyTo ??
      oldMessage.replyTo ??
      null,
  };
}

/*
=========================================================
NORMALIZE LOCAL MESSAGE
=========================================================
*/

function normalizeLocalMessage(
  message: LocalMessage
): LocalMessage {
  const createdAt =
    normalizeDate(
      message?.createdAt
    );

  const updatedAt =
    normalizeDate(
      message?.updatedAt,
      createdAt
    );

  return {
    id: String(
      message?.id ?? ""
    ),

    clientMessageId:
      normalizeClientMessageId(
        message?.clientMessageId
      ),

    chatId: String(
      message?.chatId ?? ""
    ),

    senderId: String(
      message?.senderId ?? ""
    ),

    receiverId: String(
      message?.receiverId ?? ""
    ),

    message:
      message?.message ?? "",

    type:
      message?.type ?? "text",

    imageUrl:
      message?.imageUrl ??
      null,

    voiceUrl:
      message?.voiceUrl ??
      null,

    fileUrl:
      message?.fileUrl ??
      null,

    replyTo:
      normalizeReplyTo(
        message?.replyTo
      ),

    status:
      message?.status ?? "sent",

    isSeen:
      Number(
        message?.isSeen ?? 0
      ),

    createdAt,
    updatedAt,
  };
}

/*
=========================================================
CLIENT MESSAGE ID NORMALIZER
=========================================================
*/

function normalizeClientMessageId(
  value: any
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const id =
    String(value).trim();

  return id ? id : null;
}

/*
=========================================================
GET OTHER USER ID
=========================================================
*/

function getOtherUserId(
  currentUserId?: string,
  receiverId?: string,
  messages: LocalMessage[] = []
): string | null {
  /*
  ========================================================
  1. RECEIVER ID
  ========================================================
  */

  if (receiverId) {
    const id =
      String(receiverId).trim();

    if (
      id &&
      id !==
        String(
          currentUserId ?? ""
        )
    ) {
      return id;
    }
  }

  /*
  ========================================================
  2. MESSAGE PARTICIPANTS
  ========================================================
  */

  if (currentUserId) {
    const currentId =
      String(currentUserId);

    for (
      const message of messages
    ) {
      const senderId =
        String(
          message.senderId ?? ""
        );

      const receiver =
        String(
          message.receiverId ?? ""
        );

      /*
      ------------------------------------------------------
      Sender is the other user
      ------------------------------------------------------
      */

      if (
        senderId &&
        senderId !== currentId
      ) {
        return senderId;
      }

      /*
      ------------------------------------------------------
      Receiver is the other user
      ------------------------------------------------------
      */

      if (
        receiver &&
        receiver !== currentId
      ) {
        return receiver;
      }
    }
  }

  return null;
}

/*
=========================================================
DATE NORMALIZER
=========================================================
*/

function normalizeDate(
  value: any,
  fallback = Date.now()
): number {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  /*
  ========================================================
  NUMBER
  ========================================================
  */

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  /*
  ========================================================
  DATE
  ========================================================
  */

  if (
    value instanceof Date
  ) {
    return value.getTime();
  }

  /*
  ========================================================
  FIRESTORE TIMESTAMP
  ========================================================
  */

  if (
    typeof value?.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  /*
  ========================================================
  FIRESTORE SERIALIZED TIMESTAMP
  ========================================================
  */

  if (
    typeof value?.seconds ===
    "number"
  ) {
    return (
      value.seconds * 1000 +
      Math.floor(
        Number(
          value.nanoseconds ?? 0
        ) / 1000000
      )
    );
  }

  /*
  ========================================================
  STRING DATE
  ========================================================
  */

  if (
    typeof value === "string"
  ) {
    const numeric =
      Number(value);

    if (
      Number.isFinite(numeric) &&
      numeric > 0
    ) {
      return numeric;
    }

    const timestamp =
      new Date(value).getTime();

    if (
      !Number.isNaN(timestamp)
    ) {
      return timestamp;
    }
  }

  return fallback;
}

/*
=========================================================
REPLY NORMALIZER
=========================================================
*/

function normalizeReplyTo(
  value: any
): LocalMessage["replyTo"] {
  if (!value) {
    return null;
  }

  /*
  ========================================================
  REPLY JSON STRING
  ========================================================
  */

  if (
    typeof value === "string"
  ) {
    try {
      const parsed =
        JSON.parse(value);

      if (!parsed) {
        return null;
      }

      return {
        id: String(
          parsed?.id ?? ""
        ),

        message:
          parsed?.message ?? "",

        type:
          parsed?.type ?? "text",

        senderId: String(
          parsed?.senderId ?? ""
        ),
      };
    } catch {
      return null;
    }
  }

  /*
  ========================================================
  REPLY OBJECT
  ========================================================
  */

  return {
    id: String(
      value?.id ?? ""
    ),

    message:
      value?.message ?? "",

    type:
      value?.type ?? "text",

    senderId: String(
      value?.senderId ?? ""
    ),
  };
}
