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

export function useChatMessages(chatId?: string) {
  const flatRef = useRef<any>(null);

  const [messages, setMessages] = useState<LocalMessage[]>([]);

  const mountedRef = useRef(true);

  /*
  ==================================================
  MOUNT / UNMOUNT
  ==================================================
  */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /*
  ==================================================
  CHAT CHANGE
  ==================================================
  */

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const id = String(chatId);

    /*
    ==================================================
    1. SQLITE FIRST
    ==================================================

    Firebase-এর জন্য অপেক্ষা করবে না।

    Room খুললেই SQLite থেকে message
    সরাসরি UI-তে চলে আসবে।
    */

    try {
      const localMessages =
        getMessagesByChatId(id);

      /*
      SQLite empty হলেও state immediately set হবে।
      কোনো loading লাগবে না।
      */

      setMessages(localMessages);
    } catch (error) {
      console.log(
        "❌ SQLite message read error:",
        error
      );

      setMessages([]);
    }

    /*
    ==================================================
    2. FIREBASE REALTIME LISTENER
    ==================================================

    এটা background-এ চলবে।
    UI Firebase-এর জন্য অপেক্ষা করবে না।
    */

    const unsubscribe = listenMessages(
      id,
      (remoteList) => {
        if (!mountedRef.current) {
          return;
        }

        /*
        ==============================================
        FIREBASE → LOCAL MESSAGE
        ==============================================
        */

        const firebaseMessages: LocalMessage[] =
          remoteList.map((item: any) => {
            const createdAt =
              normalizeDate(item.createdAt);

            const updatedAt =
              normalizeDate(
                item.updatedAt,
                createdAt
              );

            return {
              id: String(item.id),

              chatId: String(
                item.chatId ?? id
              ),

              senderId: String(
                item.senderId ?? ""
              ),

              receiverId: String(
                item.receiverId ?? ""
              ),

              message:
                item.message ?? "",

              type:
                item.type ?? "text",

              imageUrl:
                item.imageUrl ?? null,

              voiceUrl:
                item.voiceUrl ?? null,

              fileUrl:
                item.fileUrl ?? null,

              replyTo:
                normalizeReplyTo(
                  item.replyTo
                ),

              status: item.isSeen
                ? "seen"
                : "sent",

              isSeen: item.isSeen
                ? 1
                : 0,

              createdAt,

              updatedAt,
            };
          });

        /*
        ==============================================
        3. FIREBASE → SQLITE
        ==============================================
        */

        if (firebaseMessages.length > 0) {
          try {
            insertMessages(
              firebaseMessages
            );
          } catch (error) {
            console.log(
              "❌ SQLite sync error:",
              error
            );
          }
        }

        /*
        ==============================================
        4. MERGE LOCAL + FIREBASE
        ==============================================
        */

        setMessages((previous) => {
          /*
          Firebase message আগে রাখছি
          */

          const merged = [
            ...firebaseMessages,
          ];

          /*
          ============================================
          Pending optimistic messages
          ============================================
          */

          const pendingMessages =
            previous.filter(
              (message) =>
                message.status ===
                  "sending" ||
                message.status ===
                  "failed"
            );

          /*
          Firebase-এ এখনো না আসা
          optimistic message রাখবো।
          */

          for (const pending of pendingMessages) {
            const exists =
              firebaseMessages.some(
                (remote) => {
                  /*
                  Exact ID
                  */

                  if (
                    String(
                      remote.id
                    ) ===
                    String(
                      pending.id
                    )
                  ) {
                    return true;
                  }

                  /*
                  clientMessageId support
                  */

                  const remoteClientId =
                    (
                      remote as any
                    ).clientMessageId;

                  const pendingClientId =
                    (
                      pending as any
                    ).clientMessageId;

                  if (
                    remoteClientId &&
                    pendingClientId &&
                    remoteClientId ===
                      pendingClientId
                  ) {
                    return true;
                  }

                  /*
                  Fallback matching
                  */

                  const sameContent =
                    remote.chatId ===
                      pending.chatId &&
                    remote.senderId ===
                      pending.senderId &&
                    remote.receiverId ===
                      pending.receiverId &&
                    remote.type ===
                      pending.type &&
                    remote.message ===
                      pending.message;

                  const sameTime =
                    Math.abs(
                      remote.createdAt -
                        pending.createdAt
                    ) < 10000;

                  return (
                    sameContent &&
                    sameTime
                  );
                }
              );

            if (!exists) {
              merged.push(pending);
            }
          }

          /*
          ============================================
          5. DUPLICATE PROTECTION
          ============================================
          */

          const unique =
            new Map<
              string,
              LocalMessage
            >();

          for (const message of merged) {
            unique.set(
              String(message.id),
              message
            );
          }

          /*
          ============================================
          6. SORT
          ============================================
          */

          return Array.from(
            unique.values()
          ).sort(
            (a, b) =>
              a.createdAt -
              b.createdAt
          );
        });
      }
    );

    /*
    ==================================================
    7. MARK SEEN
    ==================================================

    Background request।
    UI এর জন্য অপেক্ষা করবে না।
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
    ==================================================
    8. CLEANUP
    ==================================================
    */

    return () => {
      unsubscribe?.();
    };
  }, [chatId]);

  return {
    messages,
    setMessages,
    flatRef,
  };
}

/*
==================================================
DATE NORMALIZER
==================================================
*/

function normalizeDate(
  value: any,
  fallback = Date.now()
): number {
  if (!value) {
    return fallback;
  }

  if (typeof value === "number") {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  /*
  Firestore Timestamp
  */

  if (
    typeof value?.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  if (
    typeof value?.seconds ===
    "number"
  ) {
    return (
      value.seconds * 1000 +
      Math.floor(
        (value.nanoseconds ?? 0) /
          1000000
      )
    );
  }

  if (typeof value === "string") {
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
==================================================
REPLY NORMALIZER
==================================================
*/

function normalizeReplyTo(
  value: any
): LocalMessage["replyTo"] {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return {
    id: String(value.id ?? ""),

    message:
      value.message ?? "",

    type:
      value.type ?? "text",

    senderId:
      String(
        value.senderId ?? ""
      ),
  };
}