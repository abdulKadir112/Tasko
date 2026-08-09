import {
    getPendingMessages,
    updateMessageStatus,
  } from "@/database/messageDb";
  
  import { sendMessage } from "@/services/message.service";
  import { isOnline } from "@/services/queue.service";
  
  let worker: ReturnType<typeof setInterval> | null = null;
  
  export function startQueueWorker() {
    if (worker) return;
  
    worker = setInterval(async () => {
      if (!isOnline()) return;
  
      const pendingMessages = getPendingMessages();
  
      if (pendingMessages.length === 0) return;
  
      for (const msg of pendingMessages) {
        try {
          await sendMessage({
            chatId: msg.chatId,
            receiverId: msg.receiverId,
            message: msg.message,
  
            type: msg.type,
  
            imageUrl: msg.imageUrl ?? undefined,
            voiceUrl: msg.voiceUrl ?? undefined,
            fileUrl: msg.fileUrl ?? undefined,
          });
  
          updateMessageStatus(msg.id, "sent");
        } catch (error) {
          console.log(
            `Queue Retry Failed (${msg.id})`,
            error
          );
  
          updateMessageStatus(msg.id, "failed");
        }
      }
    }, 5000);
  }
  
  export function stopQueueWorker() {
    if (!worker) return;
  
    clearInterval(worker);
    worker = null;
  }