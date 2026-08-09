import { useRef, useState } from "react";
import { randomUUID } from "expo-crypto";

import {
  insertMessage,
  updateMessageStatus,
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
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setReplyMessage: (v: any) => void;
};

export function useVoiceRecorder({
  chatId,
  receiverId,
  userId,
  getReplyTo,
  setMessages,
  setReplyMessage,
}: Params) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [lockedRecording, setLockedRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function onVoiceStart() {
    try {
      await startRecording();

      setRecording(true);
      setLockedRecording(false);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      console.log(e);
    }
  }

  async function onVoiceEnd() {
    try {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setRecording(false);
      setLockedRecording(false);
      setRecordingTime(0);

      const uri = await stopRecording();
      if (!uri || !userId) return;

      const tempId = randomUUID();
      const replyTo = getReplyTo();

      const optimisticMessage: LocalMessage = {
        id: tempId,
        chatId: String(chatId),
        senderId: userId,
        receiverId: String(receiverId),
        message: "",
        type: "voice",
        imageUrl: null,
        voiceUrl: uri,
        fileUrl: null,
        replyTo,
        status: "sending",
        isSeen: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      insertMessage(optimisticMessage);
      setReplyMessage(null);

      setUploading(true);

      const voiceUrl = await uploadVoice(uri);

      await sendMessage({
        chatId: String(chatId),
        receiverId: String(receiverId),
        message: "",
        type: "voice",
        voiceUrl,
        replyTo,
      });

      updateMessageStatus(tempId, "sent");

      setMessages((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? { ...item, status: "sent", voiceUrl }
            : item
        )
      );

      setUploading(false);
    } catch (e) {
      console.log(e);

      setMessages((prev) =>
        prev.map((m) =>
          m.status === "sending" ? { ...m, status: "failed" } : m
        )
      );

      setUploading(false);
      setRecording(false);
      setLockedRecording(false);
    }
  }

  function onVoiceLock() {
    setLockedRecording(true);
  }

  async function onVoiceStop() {
    if (!recording) return;
    await onVoiceEnd();
    setLockedRecording(false);
  }

  async function onVoiceCancel() {
    try {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await stopRecording();

      setRecording(false);
      setLockedRecording(false);
      setRecordingTime(0);
    } catch (e) {
      console.log(e);
      setRecording(false);
      setLockedRecording(false);
      setRecordingTime(0);
    }
  }

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
}