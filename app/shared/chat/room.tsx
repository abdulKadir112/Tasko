import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { randomUUID } from "expo-crypto";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import {
  insertMessage,
  updateMessageStatus,
  replaceMessageId,
  type LocalMessage,
} from "@/database/messageDb";

import { isOnline } from "@/services/queue.service";
import { sendMessage } from "@/services/message.service";
import { uploadImage } from "@/services/upload.service";

import { useAuthContext } from "@/context/AuthContext";

import MessageBubble from "@/components/chat/MessageBubble";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatInput from "@/components/chat/ChatInput";
import AttachmentSheet from "@/components/chat/AttachmentSheet";
import ReplyPreview from "@/components/chat/ReplyPreview";
import SelectedImagePreview from "@/components/chat/SelectedImagePreview";

import { useChatMessages } from "@/hooks/chat/useChatMessages";
import { useVoiceRecorder } from "@/hooks/chat/useVoiceRecorder";

export default function ChatRoomScreen() {
  const { chatId, receiverId } = useLocalSearchParams<{
    chatId: string;
    receiverId: string;
  }>();

  const { user } = useAuthContext();

  const { messages, setMessages, flatRef } = useChatMessages(chatId);

  /*
  =====================================================
  DISPLAY MESSAGES
  =====================================================
  */

  const displayMessages = useMemo(() => {
    return [...messages].reverse();
  }, [messages]);

  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAttachment, setShowAttachment] = useState(false);
  const [replyMessage, setReplyMessage] = useState<LocalMessage | null>(null);

  /*
  =====================================================
  REPLY
  =====================================================
  */

  function getReplyTo() {
    if (!replyMessage) return null;

    return {
      id: replyMessage.id,
      message: replyMessage.message || "",
      type: replyMessage.type,
      senderId: replyMessage.senderId,
    };
  }

  /*
  =====================================================
  VOICE
  =====================================================
  */

  const {
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
  } = useVoiceRecorder({
    chatId,
    receiverId,
    userId: user?.uid,
    getReplyTo,
    setMessages,
    setReplyMessage,
  });

  /*
  =====================================================
  DATE NORMALIZER
  =====================================================
  */

  function normalizeDate(value: unknown, fallback = Date.now()): number {
    if (!value) return fallback;

    if (typeof value === "number") return value;

    if (value instanceof Date) return value.getTime();

    if (typeof value === "object" && value !== null && "seconds" in value) {
      const seconds = (value as { seconds?: unknown }).seconds;
      if (typeof seconds === "number") return seconds * 1000;
    }

    if (typeof value === "string") {
      const time = new Date(value).getTime();
      if (!Number.isNaN(time)) return time;
    }

    return fallback;
  }

  /*
  =====================================================
  SERVER RESPONSE → LOCAL MESSAGE
  =====================================================
  */

  function responseToLocalMessage(
    response: any,
    fallback: LocalMessage
  ): LocalMessage {
    const createdAt = normalizeDate(response?.createdAt, fallback.createdAt);
    const updatedAt = normalizeDate(response?.updatedAt, createdAt);

    return {
      id: String(response?.id ?? fallback.id),
      chatId: String(response?.chatId ?? fallback.chatId),
      senderId: String(response?.senderId ?? fallback.senderId),
      receiverId: String(response?.receiverId ?? fallback.receiverId),
      message: response?.message ?? fallback.message ?? "",
      type: response?.type ?? fallback.type,
      imageUrl: response?.imageUrl ?? fallback.imageUrl ?? null,
      voiceUrl: response?.voiceUrl ?? fallback.voiceUrl ?? null,
      fileUrl: response?.fileUrl ?? fallback.fileUrl ?? null,
      replyTo: response?.replyTo ?? fallback.replyTo ?? null,
      status: response?.isSeen ? "seen" : "sent",
      isSeen: response?.isSeen ? 1 : 0,
      createdAt,
      updatedAt,
    };
  }

  /*
  =====================================================
  SEND TEXT MESSAGE
  =====================================================
  */

  async function onSend() {
    const messageText = text.trim();

    if (!messageText || !user?.uid || !chatId || !receiverId) return;

    const clientMessageId = `temp_${randomUUID()}`;
    const createdAt = Date.now();
    const replyTo = getReplyTo();

    const tempMessage: LocalMessage = {
      id: clientMessageId,
      chatId: String(chatId),
      senderId: user.uid,
      receiverId: String(receiverId),
      message: messageText,
      type: "text",
      imageUrl: null,
      voiceUrl: null,
      fileUrl: null,
      replyTo,
      status: "sending",
      isSeen: 0,
      createdAt,
      updatedAt: createdAt,
    };

    // 1. Immediate UI
    setMessages((prev) => {
      if (prev.some((m) => m.id === clientMessageId)) return prev;
      return [...prev, tempMessage];
    });

    // 2. SQLite
    insertMessage(tempMessage);

    // 3. Clear input
    setText("");
    setReplyMessage(null);

    // 4. Offline
    if (!isOnline()) {
      console.log("📴 Offline → message saved locally");
      return;
    }

    // 5. Send API
    try {
      console.log("📤 Sending text message...", clientMessageId);

      const response = await sendMessage({
        chatId: tempMessage.chatId,
        receiverId: tempMessage.receiverId,
        message: tempMessage.message,
        type: "text",
        clientMessageId,
        replyTo: tempMessage.replyTo,
      });

      console.log("📥 TEXT RESPONSE =>", response);

      const realMessage = responseToLocalMessage(response, tempMessage);

      replaceMessageId(clientMessageId, realMessage);

      setMessages((prev) =>
        prev.map((m) => (m.id === clientMessageId ? realMessage : m))
      );
    } catch (error) {
      console.log("❌ TEXT SEND ERROR:", error);

      updateMessageStatus(clientMessageId, "failed");

      setMessages((prev) =>
        prev.map((m) =>
          m.id === clientMessageId ? { ...m, status: "failed" } : m
        )
      );
    }
  }

  /*
  =====================================================
  IMAGE PICKER
  =====================================================
  */

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  }

  /*
  =====================================================
  CAMERA
  =====================================================
  */

  async function openCamera() {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  }

  /*
  =====================================================
  SEND IMAGE
  =====================================================
  */

  async function sendImage() {
    if (!selectedImage || !user?.uid || !chatId || !receiverId) return;

    const clientMessageId = `temp_${randomUUID()}`;
    const createdAt = Date.now();
    const replyTo = getReplyTo();

    const optimisticMessage: LocalMessage = {
      id: clientMessageId,
      chatId: String(chatId),
      senderId: user.uid,
      receiverId: String(receiverId),
      message: "",
      type: "image",
      imageUrl: selectedImage,
      voiceUrl: null,
      fileUrl: null,
      replyTo,
      status: "sending",
      isSeen: 0,
      createdAt,
      updatedAt: createdAt,
    };

    // 1. Immediate UI
    setMessages((prev) => {
      if (prev.some((m) => m.id === clientMessageId)) return prev;
      return [...prev, optimisticMessage];
    });

    // 2. SQLite
    insertMessage(optimisticMessage);

    // 3. Clear preview
    setSelectedImage(null);
    setReplyMessage(null);

    // 4. Offline
    if (!isOnline()) {
      console.log("📴 Offline → image saved locally");
      return;
    }

    try {
      setUploading(true);

      const imageUrl = await uploadImage(optimisticMessage.imageUrl!);

      const response = await sendMessage({
        chatId: optimisticMessage.chatId,
        receiverId: optimisticMessage.receiverId,
        message: "",
        type: "image",
        imageUrl,
        clientMessageId,
        replyTo: optimisticMessage.replyTo,
      });

      console.log("📥 IMAGE RESPONSE =>", response);

      const realMessage = responseToLocalMessage(
        {
          ...response,
          imageUrl: response?.imageUrl ?? imageUrl,
        },
        {
          ...optimisticMessage,
          imageUrl,
        }
      );

      replaceMessageId(clientMessageId, realMessage);

      setMessages((prev) =>
        prev.map((m) => (m.id === clientMessageId ? realMessage : m))
      );
    } catch (error) {
      console.log("❌ IMAGE SEND ERROR:", error);

      updateMessageStatus(clientMessageId, "failed");

      setMessages((prev) =>
        prev.map((m) =>
          m.id === clientMessageId ? { ...m, status: "failed" } : m
        )
      );
    } finally {
      setUploading(false);
    }
  }

  /*
  =====================================================
  UI
  =====================================================
  */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ChatHeader
        name="Worker Name"
        photoURL=""
        online={true}
        onAudioCall={() => console.log("Audio")}
        onVideoCall={() => console.log("Video")}
      />

      {/*
        SQLite থাকলে সাথে সাথে দেখাবে।
        আলাদা loading UI নেই।
      */}
      <FlatList<LocalMessage>
        ref={flatRef}
        data={displayMessages}
        inverted
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 90,
        }}
        renderItem={({ item }) => {
          const time = item.createdAt
            ? new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return (
            <MessageBubble
              message={item.message}
              imageUrl={item.imageUrl ?? undefined}
              voiceUrl={item.voiceUrl ?? undefined}
              type={item.type}
              isMine={item.senderId === user?.uid}
              time={time}
              replyTo={item.replyTo}
              status={item.status}
              isSeen={Boolean(item.isSeen)}
              onReply={() => setReplyMessage(item)}
            />
          );
        }}
      />

      {selectedImage && (
        <SelectedImagePreview
          uri={selectedImage}
          uploading={uploading}
          onSend={sendImage}
        />
      )}

      <ReplyPreview
        replyMessage={replyMessage}
        onClose={() => setReplyMessage(null)}
      />

      <ChatInput
        text={text}
        setText={setText}
        onSend={onSend}
        onPickImage={() => setShowAttachment(true)}
        onCamera={openCamera}
        onVoiceStart={onVoiceStart}
        onVoiceEnd={onVoiceEnd}
        onVoiceCancel={onVoiceCancel}
        onVoiceStop={onVoiceStop}
        onVoiceLock={onVoiceLock}
        recording={recording}
        recordingTime={recordingTime}
        lockedRecording={lockedRecording}
      />

      <AttachmentSheet
        visible={showAttachment}
        onClose={() => setShowAttachment(false)}
        onCamera={() => {
          setShowAttachment(false);
          openCamera();
        }}
        onGallery={() => {
          setShowAttachment(false);
          pickImage();
        }}
        onDocument={() => setShowAttachment(false)}
        onLocation={() => setShowAttachment(false)}
        onContact={() => setShowAttachment(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});