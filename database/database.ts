import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync(
  "service-marketplace.db"
);

/* =========================================================
   INIT GUARD

   ⭐⭐⭐ CRITICAL FIX ⭐⭐⭐

   আগে initDatabase() কোনো গার্ড ছাড়াই প্রতিবার পুরো
   কাজ (CREATE TABLE, PRAGMA table_info, ALTER TABLE,
   দুইটা CREATE INDEX) চালাতো — এগুলো সব synchronous
   SQLite call, যেগুলো JS থ্রেডকে ব্লক করে।

   messageDb.ts-এর প্রায় সব ফাংশন (insertMessage,
   getMessagesByChatId, updateMessageStatus ইত্যাদি)
   প্রতিবার কল হওয়ার আগে ensureDatabase() → initDatabase()
   চালাতো। চ্যাট স্ক্রিনে Firestore listener + SQLite sync
   + re-render মিলিয়ে সেকেন্ডে বহুবার এই ফাংশনগুলো কল
   হচ্ছিল, ফলে initDatabase()-ও বহুবার (লগে দেখা গেছে
   শত শত বার) চলছিল — যেটা মেসেজ পাঠানোর সময় লক্ষণীয়
   delay তৈরি করছিল।

   এখন এই flag দিয়ে নিশ্চিত করা হচ্ছে যে ভারী init কাজ
   পুরো অ্যাপ লাইফসাইকেলে মাত্র একবারই চলবে।
========================================================= */

let isDatabaseInitialized = false;

/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

export function initDatabase() {
  /*
   * ইতিমধ্যে initialize হয়ে থাকলে সাথে সাথে রিটার্ন করো।
   * এটাই মূল ফিক্স — বারবার ভারী SQL statement চালানো
   * বন্ধ করে দেয়।
   */

  if (isDatabaseInitialized) {
    return;
  }

  /* =======================================================
     CREATE MESSAGES TABLE
  ======================================================= */

  db.execSync(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,

      chatId TEXT NOT NULL,

      senderId TEXT NOT NULL,

      receiverId TEXT NOT NULL,

      clientMessageId TEXT,

      message TEXT,

      type TEXT DEFAULT 'text',

      imageUrl TEXT,

      voiceUrl TEXT,

      fileUrl TEXT,

      replyTo TEXT,

      status TEXT DEFAULT 'sent',

      isSeen INTEGER DEFAULT 0,

      createdAt INTEGER,

      updatedAt INTEGER
    );
  `);

  /* =======================================================
     MIGRATION
  ======================================================= */

  try {
    const columns = db.getAllSync(
      `PRAGMA table_info(messages)`
    ) as Array<{
      name?: string;
    }>;

    const hasClientMessageId = columns.some(
      (column) =>
        String(column?.name ?? "") ===
        "clientMessageId"
    );

    if (!hasClientMessageId) {
      db.execSync(`
        ALTER TABLE messages
        ADD COLUMN clientMessageId TEXT;
      `);

      console.log(
        "✅ clientMessageId column added"
      );
    }
  } catch (error) {
    console.log(
      "⚠️ clientMessageId migration:",
      error
    );
  }

  /* =======================================================
     CLIENT MESSAGE ID INDEX
  ======================================================= */

  try {
    db.execSync(`
      CREATE INDEX IF NOT EXISTS
      idx_messages_clientMessageId
      ON messages(clientMessageId);
    `);
  } catch (error) {
    console.log(
      "⚠️ clientMessageId index error:",
      error
    );
  }

  /* =======================================================
     CHAT INDEX
  ======================================================= */

  try {
    db.execSync(`
      CREATE INDEX IF NOT EXISTS
      idx_messages_chatId_createdAt
      ON messages(chatId, createdAt);
    `);
  } catch (error) {
    console.log(
      "⚠️ chatId index error:",
      error
    );
  }

  /*
   * ⭐ flag সেট করা হচ্ছে যাতে ভবিষ্যতে ensureDatabase()
   * থেকে আসা কলগুলো তাৎক্ষণিকভাবে রিটার্ন করে।
   */

  isDatabaseInitialized = true;

  console.log(
    "✅ SQLite Database Initialized"
  );
}