import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("service-marketplace.db");

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      chatId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      receiverId TEXT NOT NULL,
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

  console.log("✅ SQLite Database Initialized");
}