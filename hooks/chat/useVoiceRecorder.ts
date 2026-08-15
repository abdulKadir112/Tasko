import {
  useRef,
  useState,
} from "react";

import { randomUUID } from "expo-crypto";

import {
  insertMessage,
  updateMessageStatus,
  replaceMessageId,
  type LocalMessage,
} from "@/database/messageDb";

import { sendMessage } from "@/services/message.service";
import { uploadVoice } from "@/services/upload.service";

import {
  startRecording,
  stopRecording,
} from "@/services/voice.service";

type Params = {
  chatId?: string;
  receiverId?: string;
  userId?: string;

  getReplyTo: () => any;

  setMessages: React.Dispatch<
    React.SetStateAction<any[]>
  >;

  setReplyMessage: (
    v: any
  ) => void;
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeDate(
  value: any,
  fallback: number
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
    const time =
      new Date(value).getTime();

    if (!Number.isNaN(time)) {
      return time;
    }
  }

  return fallback;
}

function getResponseData(
  response: any
) {
  return (
    response?.data?.data ??
    response?.data ??
    response ??
    {}
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useVoiceRecorder({
  chatId,
  receiverId,
  userId,
  getReplyTo,
  setMessages,
  setReplyMessage,
}: Params) {
  /* =======================================================
     TIMER
  ======================================================= */

  const timerRef =
    useRef<
      ReturnType<typeof setInterval> | null
    >(null);

  /* =======================================================
     LOCKS
  ======================================================= */

  const startingRef =
    useRef(false);

  const stoppingRef =
    useRef(false);

  const sendingRef =
    useRef(false);

  const recordingRef =
    useRef(false);

  const lockedRecordingRef =
    useRef(false);

  /* =======================================================
     CURRENT MESSAGE
  ======================================================= */

  const currentTempIdRef =
    useRef<string | null>(null);

  const currentClientMessageIdRef =
    useRef<string | null>(null);

  /* =======================================================
     STATE
  ======================================================= */

  const [recording, setRecording] =
    useState(false);

  const [recordingTime, setRecordingTime] =
    useState(0);

  const [lockedRecording, setLockedRecording] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  /* =======================================================
     CLEAR TIMER
  ======================================================= */

  function clearTimer() {
    if (
      timerRef.current !== null
    ) {
      clearInterval(
        timerRef.current
      );

      timerRef.current = null;
    }
  }

  /* =======================================================
     RESET RECORDING STATE
  ======================================================= */

  function resetRecordingState() {
    clearTimer();

    recordingRef.current =
      false;

    lockedRecordingRef.current =
      false;

    setRecording(false);

    setLockedRecording(false);

    setRecordingTime(0);
  }

  /* =======================================================
     START RECORDING
  ======================================================= */

  async function onVoiceStart(): Promise<boolean> {
    if (startingRef.current) {
      console.log(
        "⚠️ Voice start already running"
      );

      return false;
    }

    if (recordingRef.current) {
      console.log(
        "⚠️ Voice recording already active"
      );

      return true;
    }

    if (sendingRef.current) {
      console.log(
        "⚠️ Previous voice is still sending"
      );

      return false;
    }

    if (
      !chatId ||
      !receiverId ||
      !userId
    ) {
      console.log(
        "❌ Voice start: missing chat data"
      );

      return false;
    }

    startingRef.current = true;

    try {
      console.log(
        "🎤 START VOICE"
      );

      const started =
        await startRecording();

      if (!started) {
        console.log(
          "❌ Recording could not start"
        );

        resetRecordingState();

        return false;
      }

      recordingRef.current =
        true;

      lockedRecordingRef.current =
        false;

      setRecording(true);

      setLockedRecording(false);

      setRecordingTime(0);

      clearTimer();

      timerRef.current =
        setInterval(() => {
          setRecordingTime(
            (previous) =>
              previous + 1
          );
        }, 1000);

      console.log(
        "✅ Voice recording active"
      );

      return true;
    } catch (error) {
      console.log(
        "❌ Voice start error:",
        error
      );

      resetRecordingState();

      return false;
    } finally {
      startingRef.current =
        false;
    }
  }

  /* =======================================================
     STOP + UPLOAD + SEND
  ======================================================= */

  async function onVoiceEnd() {
    if (
      stoppingRef.current
    ) {
      console.log(
        "⚠️ Voice stop already running"
      );

      return;
    }

    if (
      sendingRef.current
    ) {
      console.log(
        "⚠️ Voice already sending"
      );

      return;
    }

    if (
      !chatId ||
      !receiverId ||
      !userId
    ) {
      console.log(
        "❌ Voice send: missing chat data"
      );

      return;
    }

    if (
      !recordingRef.current
    ) {
      console.log(
        "⚠️ No active recording"
      );

      return;
    }

    stoppingRef.current = true;

    clearTimer();

    try {
      console.log(
        "🛑 STOP VOICE"
      );

      /* ===================================================
         STOP NATIVE RECORDER
      =================================================== */

      const uri =
        await stopRecording();

      recordingRef.current =
        false;

      setRecording(false);

      setLockedRecording(false);

      setRecordingTime(0);

      lockedRecordingRef.current =
        false;

      if (!uri) {
        console.log(
          "❌ Recording URI not found"
        );

        return;
      }

      console.log(
        "🎵 Recording URI:",
        uri
      );

      /* ===================================================
         CLIENT MESSAGE ID
      =================================================== */

      const clientMessageId =
        `temp_${randomUUID()}`;

      currentTempIdRef.current =
        clientMessageId;

      currentClientMessageIdRef.current =
        clientMessageId;

      const createdAt =
        Date.now();

      const replyTo =
        getReplyTo();

      /* ===================================================
         SEND LOCK
      =================================================== */

      sendingRef.current = true;

      /* ===================================================
         STEP 1 — UPLOAD VOICE
      =================================================== */

      setUploading(true);

      console.log(
        "📤 UPLOADING VOICE:",
        uri
      );

      const voiceUrl =
        await uploadVoice(uri);

      if (
        !voiceUrl ||
        typeof voiceUrl !==
          "string" ||
        !voiceUrl.startsWith(
          "http"
        )
      ) {
        throw new Error(
          "Invalid Cloudinary voice URL"
        );
      }

      console.log(
        "✅ VOICE UPLOADED:",
        voiceUrl
      );

      /* ===================================================
         STEP 2 — OPTIMISTIC MESSAGE
      =================================================== */

      const optimisticMessage:
        LocalMessage = {
          id: clientMessageId,

          /*
           * ⭐ IMPORTANT
           * Same client ID will be sent
           * to server and Firebase.
           */
          clientMessageId,

          chatId:
            String(chatId),

          senderId:
            String(userId),

          receiverId:
            String(receiverId),

          message: "",

          type: "voice",

          imageUrl: null,

          voiceUrl,

          fileUrl: null,

          replyTo,

          status: "sending",

          isSeen: 0,

          createdAt,

          updatedAt:
            createdAt,
        };

      /* ===================================================
         UI — OPTIMISTIC
      =================================================== */

      setMessages(
        (previous) => [
          ...previous,
          optimisticMessage,
        ]
      );

      /* ===================================================
         SQLITE — OPTIMISTIC
      =================================================== */

      insertMessage(
        optimisticMessage
      );

      setReplyMessage(null);

      /* ===================================================
         STEP 3 — SEND TO SERVER
      =================================================== */

      console.log(
        "📤 SENDING VOICE MESSAGE"
      );

      console.log(
        "🆔 CLIENT MESSAGE ID:",
        clientMessageId
      );

      const response =
        await sendMessage({
          chatId:
            String(chatId),

          receiverId:
            String(receiverId),

          message: "",

          type: "voice",

          voiceUrl,

          clientMessageId,

          replyTo,
        });

      console.log(
        "📥 VOICE SERVER RESPONSE:",
        response
      );

      /* ===================================================
         STEP 4 — SERVER DATA
      =================================================== */

      const data =
        getResponseData(
          response
        );

      const serverId =
        String(
          data?.id ??
            data?._id ??
            data?.messageId ??
            clientMessageId
        );

      const serverCreatedAt =
        normalizeDate(
          data?.createdAt,
          createdAt
        );

      const serverUpdatedAt =
        normalizeDate(
          data?.updatedAt,
          serverCreatedAt
        );

      const finalVoiceUrl =
        data?.voiceUrl &&
        String(
          data.voiceUrl
        ).startsWith("http")
          ? String(
              data.voiceUrl
            )
          : voiceUrl;

      /* ===================================================
         STEP 5 — REAL MESSAGE
      =================================================== */

      const realMessage:
        LocalMessage = {
          ...optimisticMessage,

          id: serverId,

          /*
           * ⭐ Keep clientMessageId.
           */
          clientMessageId,

          voiceUrl:
            finalVoiceUrl,

          status:
            data?.isSeen
              ? "seen"
              : "sent",

          isSeen:
            data?.isSeen
              ? 1
              : 0,

          createdAt:
            serverCreatedAt,

          updatedAt:
            serverUpdatedAt,
        };

      /* ===================================================
         STEP 6 — SQLITE REPLACE
      =================================================== */

      try {
        /*
         * ⭐ IMPORTANT
         *
         * temp ID → server ID
         *
         * clientMessageId দিয়ে
         * duplicate-safe replacement।
         */
        replaceMessageId(
          clientMessageId,
          realMessage
        );

        console.log(
          "✅ SQLite voice message replaced:",
          {
            tempId:
              clientMessageId,

            serverId,
          }
        );
      } catch (error) {
        console.log(
          "⚠️ SQLite replace failed, inserting:",
          error
        );

        /*
         * Fallback
         */
        insertMessage(
          realMessage
        );
      }

      /* ===================================================
         STEP 7 — UI REPLACE
      =================================================== */

      setMessages(
        (previous) =>
          previous.map(
            (item) => {
              /*
               * Primary match:
               * temporary/server ID
               */
              if (
                String(item.id) ===
                clientMessageId
              ) {
                return realMessage;
              }

              /*
               * Secondary match:
               * clientMessageId
               */
              if (
                item.clientMessageId &&
                String(
                  item.clientMessageId
                ) ===
                  clientMessageId
              ) {
                return realMessage;
              }

              return item;
            }
          )
      );

      console.log(
        "✅ VOICE MESSAGE SENT SUCCESSFULLY"
      );
    } catch (error) {
      console.log(
        "❌ VOICE SEND ERROR:",
        error
      );

      /* =================================================
         FAILED MESSAGE
      ================================================= */

      const tempId =
        currentTempIdRef.current;

      const clientMessageId =
        currentClientMessageIdRef.current;

      if (tempId) {
        setMessages(
          (previous) =>
            previous.map(
              (item) => {
                const isSameMessage =
                  String(
                    item.id
                  ) === tempId ||
                  (
                    item.clientMessageId &&
                    String(
                      item.clientMessageId
                    ) ===
                      clientMessageId
                  );

                if (
                  !isSameMessage
                ) {
                  return item;
                }

                return {
                  ...item,

                  status:
                    "failed",
                };
              }
            )
        );

        try {
          updateMessageStatus(
            tempId,
            "failed"
          );
        } catch (dbError) {
          console.log(
            "⚠️ Failed DB update:",
            dbError
          );
        }
      }
    } finally {
      setUploading(false);

      sendingRef.current =
        false;

      stoppingRef.current =
        false;

      currentTempIdRef.current =
        null;

      currentClientMessageIdRef.current =
        null;

      resetRecordingState();

      console.log(
        "🔓 Voice operation unlocked"
      );
    }
  }

  /* =======================================================
     LOCK RECORDING
  ======================================================= */

  function onVoiceLock() {
    if (
      !recordingRef.current
    ) {
      return;
    }

    if (
      stoppingRef.current
    ) {
      return;
    }

    lockedRecordingRef.current =
      true;

    setLockedRecording(true);

    console.log(
      "🔒 Voice recording locked"
    );
  }

  /* =======================================================
     STOP LOCKED RECORDING
  ======================================================= */

  async function onVoiceStop() {
    if (
      !recordingRef.current
    ) {
      return;
    }

    if (
      !lockedRecordingRef.current
    ) {
      return;
    }

    await onVoiceEnd();
  }

  /* =======================================================
     CANCEL RECORDING
  ======================================================= */

  async function onVoiceCancel() {
    if (
      stoppingRef.current
    ) {
      return;
    }

    if (
      !recordingRef.current
    ) {
      return;
    }

    stoppingRef.current =
      true;

    clearTimer();

    try {
      console.log(
        "🗑️ CANCEL VOICE"
      );

      await stopRecording();

      console.log(
        "✅ Voice recording cancelled"
      );
    } catch (error) {
      console.log(
        "⚠️ Voice cancel error:",
        error
      );
    } finally {
      recordingRef.current =
        false;

      lockedRecordingRef.current =
        false;

      stoppingRef.current =
        false;

      setRecording(false);

      setLockedRecording(false);

      setRecordingTime(0);

      clearTimer();
    }
  }

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    recording,

    recordingTime,

    lockedRecording,

    uploading,

    setUploading,

    onVoiceStart,

    onVoiceEnd,

    onVoiceLock,

    onVoiceStop,

    onVoiceCancel,
  };
};