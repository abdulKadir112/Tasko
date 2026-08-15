import {
  getPendingMessages,
  updateMessageStatus,
  replaceMessageId,
  type LocalMessage,
} from "@/database/messageDb";

import { sendMessage } from "@/services/message.service";
import { isOnline } from "@/services/queue.service";

/* =========================================================
   WORKER STATE
========================================================= */

let worker: ReturnType<typeof setInterval> | null = null;

/*
 * ⭐⭐⭐ CRITICAL FIX ⭐⭐⭐
 *
 * একই মেসেজ একসাথে দুইবার retry হওয়া ঠেকানোর জন্য
 * in-memory lock। এটা না থাকলে দুইটা interval tick
 * ওভারল্যাপ করলে একই মেসেজ দুইবার পাঠানো হতে পারে।
 */

const processingIds = new Set<string>();

/*
 * ⭐ GRACE PERIOD
 *
 * মেসেজ তৈরি হওয়ার পর অন্তত এই সময় (ms) পার না হলে
 * worker সেটা touch করবে না। কারণ onSend() ইতিমধ্যে
 * ওই মেসেজটা পাঠানোর চেষ্টা করছে হতে পারে (normal
 * network round-trip)। এই grace period ছাড়া worker
 * আর onSend() একই মেসেজ একসাথে পাঠিয়ে duplicate
 * তৈরি করে ফেলছিল — এটাই আসল বাগ ছিল।
 */

const RETRY_GRACE_PERIOD_MS = 8000;

const QUEUE_INTERVAL_MS = 5000;

/* =========================================================
   START QUEUE WORKER
========================================================= */

export function startQueueWorker() {
  if (worker) return;

  worker = setInterval(async () => {
    if (!isOnline()) return;

    const pendingMessages = getPendingMessages();

    if (pendingMessages.length === 0) return;

    const now = Date.now();

    for (const msg of pendingMessages) {
      await processPendingMessage(msg, now);
    }
  }, QUEUE_INTERVAL_MS);
}

/* =========================================================
   STOP QUEUE WORKER
========================================================= */

export function stopQueueWorker() {
  if (!worker) return;

  clearInterval(worker);
  worker = null;

  processingIds.clear();
}

/* =========================================================
   PROCESS ONE PENDING MESSAGE
========================================================= */

async function processPendingMessage(
  msg: LocalMessage,
  now: number
) {
  const localId = String(msg.id);

  /* =======================================================
     1. ইতিমধ্যে প্রসেস হচ্ছে? স্কিপ করো
  ======================================================= */

  if (processingIds.has(localId)) {
    return;
  }

  /* =======================================================
     2. GRACE PERIOD চেক
     ------------------------------------------------------
     সদ্য তৈরি হওয়া মেসেজ (এখনো onSend()-এর normal
     network কল চলতে পারে) স্কিপ করো। শুধু যেই মেসেজগুলো
     সত্যিকারভাবে stuck/failed হয়ে গেছে সেগুলোই retry
     করবো।
  ======================================================= */

  const age = now - Number(msg.createdAt ?? 0);

  if (age < RETRY_GRACE_PERIOD_MS) {
    return;
  }

  /* =======================================================
     3. clientMessageId না থাকলে retry করা নিরাপদ না
     ------------------------------------------------------
     clientMessageId ছাড়া retry করলে backend-এ নতুন
     duplicate মেসেজ তৈরি হয়ে যাবে (এটাই মূল বাগ ছিল)।
     তাই clientMessageId না থাকলে শুধু status "failed"
     করে দিচ্ছি, যাতে ইউজার ম্যানুয়ালি আবার পাঠাতে পারে।
  ======================================================= */

  const clientMessageId =
    msg.clientMessageId &&
    String(msg.clientMessageId).trim()
      ? String(msg.clientMessageId).trim()
      : null;

  if (!clientMessageId) {
    console.log(
      "⚠️ Queue retry skipped (no clientMessageId):",
      localId
    );

    updateMessageStatus(localId, "failed");

    return;
  }

  processingIds.add(localId);

  try {
    console.log(
      "🔁 Queue retry sending:",
      localId,
      clientMessageId
    );

    /* =====================================================
       4. RETRY SEND
       ----------------------------------------------------
       ⭐ clientMessageId অবশ্যই পাঠাতে হবে, নাহলে
       backend/message.service.ts নতুন random UUID
       বানিয়ে নেবে এবং duplicate message তৈরি হবে।
    ===================================================== */

    const response = await sendMessage({
      chatId: msg.chatId,
      receiverId: msg.receiverId,
      message: msg.message,

      type: msg.type,

      imageUrl: msg.imageUrl ?? undefined,
      voiceUrl: msg.voiceUrl ?? undefined,
      fileUrl: msg.fileUrl ?? undefined,

      clientMessageId,

      replyTo: msg.replyTo ?? undefined,
    } as any);

    /* =====================================================
       5. SERVER RESPONSE → REAL MESSAGE
    ===================================================== */

    const data =
      (response as any)?.data?.data ??
      (response as any)?.data ??
      response ??
      {};

    const serverId = String(
      data?.id ??
        data?._id ??
        data?.messageId ??
        localId
    );

    const serverCreatedAt = normalizeDate(
      data?.createdAt,
      msg.createdAt
    );

    const serverUpdatedAt = normalizeDate(
      data?.updatedAt,
      serverCreatedAt
    );

    const realMessage: LocalMessage = {
      ...msg,

      id: serverId,

      /*
       * ⭐ clientMessageId বজায় রাখা হচ্ছে যাতে
       * Firestore listener / useChatMessages dedup
       * ঠিকভাবে চিনতে পারে।
       */
      clientMessageId,

      status: data?.isSeen ? "seen" : "sent",

      isSeen: data?.isSeen ? 1 : 0,

      createdAt: serverCreatedAt,
      updatedAt: serverUpdatedAt,
    };

    /* =====================================================
       6. LOCAL TEMP ID → SERVER ID REPLACE
       ----------------------------------------------------
       শুধু status আপডেট করলেই যথেষ্ট না — id-টাও server
       id দিয়ে replace করতে হবে, নাহলে পরবর্তীতে Firestore
       থেকে একই মেসেজ এলে সেটাকে নতুন entry ধরে নেওয়ার
       ঝুঁকি থেকে যায়।
    ===================================================== */

    replaceMessageId(localId, realMessage);

    console.log(
      "✅ Queue retry success:",
      localId,
      "->",
      serverId
    );
  } catch (error) {
    console.log(
      `❌ Queue Retry Failed (${localId})`,
      error
    );

    updateMessageStatus(localId, "failed");
  } finally {
    processingIds.delete(localId);
  }
}

/* =========================================================
   DATE NORMALIZER
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

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value?.seconds === "number") {
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

  return fallback;
}