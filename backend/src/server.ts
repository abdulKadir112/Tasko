import dotenv from "dotenv";
dotenv.config();

console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log(
  "Secret:",
  process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing"
);

import app from "./app";

import chatRoutes from "./routes/chat.routes";
import messageRoutes from "./routes/message.routes";
import notificationRoutes from "./routes/notification.routes";

// Chat Routes
app.use("/api/chats", chatRoutes);

// Message Routes
app.use("/api/messages", messageRoutes);

// Notification Routes
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server Running On Port ${PORT}`);
});