import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

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
import { getUserById } from "@/services/user.service";

import { useAuthContext } from "@/context/AuthContext";

import MessageBubble from "@/components/chat/MessageBubble";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatInput from "@/components/chat/ChatInput";
import AttachmentSheet from "@/components/chat/AttachmentSheet";
import ReplyPreview from "@/components/chat/ReplyPreview";
import SelectedImagePreview from "@/components/chat/SelectedImagePreview";

import { useChatMessages } from "@/hooks/chat/useChatMessages";
import { useVoiceRecorder } from "@/hooks/chat/useVoiceRecorder";

/* =========================================================
   PARAMS
========================================================= */

type ChatParams = {
  chatId?: string;
  receiverId?: string;

  otherUserName?: string;
  otherUserPhoto?: string;

  otherUserOnline?: string;
  otherUserLastSeen?: string;
};

/* =========================================================
   DATE HELPER
========================================================= */

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

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value?.seconds === "number") {
    return (
      value.seconds * 1000 +
      Math.floor(
        (value.nanoseconds ?? 0) / 1000000
      )
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

/* =========================================================
   LAST SEEN
========================================================= */

function formatLastSeen(
  value: any
): string | null {
  if (!value) {
    return null;
  }

  const timestamp = normalizeDate(
    value,
    0
  );

  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `Last seen ${date.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  )}`;
}

/* =========================================================
   BOOLEAN
========================================================= */

function normalizeBoolean(
  value: any
): boolean {
  return (
    value === true ||
    value === 1 ||
    value === "true" ||
    value === "1"
  );
}

/* =========================================================
   CLIENT MESSAGE ID NORMALIZER
========================================================= */

function normalizeClientMessageId(
  value: any
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

/* =========================================================
   RESPONSE → LOCAL MESSAGE
========================================================= */

function responseToLocalMessage(
  response: any,
  fallback: LocalMessage
): LocalMessage {
  const createdAt = normalizeDate(
    response?.createdAt,
    fallback.createdAt
  );

  const updatedAt = normalizeDate(
    response?.updatedAt,
    createdAt
  );

  const replyTo =
    response?.replyTo ??
    response?.reply_to ??
    fallback.replyTo ??
    null;

  const clientMessageId =
    normalizeClientMessageId(
      response?.clientMessageId
    ) ||
    normalizeClientMessageId(
      fallback.clientMessageId
    ) ||
    null;

  return {
    id: String(
      response?.id ??
        response?._id ??
        response?.messageId ??
        fallback.id
    ),

    clientMessageId,

    chatId: String(
      response?.chatId ??
        fallback.chatId
    ),

    senderId: String(
      response?.senderId ??
        fallback.senderId
    ),

    receiverId: String(
      response?.receiverId ??
        fallback.receiverId
    ),

    message:
      response?.message ??
      fallback.message ??
      "",

    type:
      response?.type ??
      fallback.type,

    imageUrl:
      response?.imageUrl ??
      fallback.imageUrl ??
      null,

    voiceUrl:
      response?.voiceUrl ??
      fallback.voiceUrl ??
      null,

    fileUrl:
      response?.fileUrl ??
      fallback.fileUrl ??
      null,

    replyTo,

    status:
      response?.status ??
      (response?.isSeen
        ? "seen"
        : "sent"),

    isSeen:
      response?.isSeen
        ? 1
        : fallback.isSeen ?? 0,

    createdAt,
    updatedAt,
  } as LocalMessage;
}

/* =========================================================
   REMOVE DUPLICATE
========================================================= */

function removeDuplicateMessages(
  list: LocalMessage[]
): LocalMessage[] {
  if (
    !Array.isArray(list) ||
    list.length === 0
  ) {
    return [];
  }

  const seenClientIds =
    new Set<string>();

  const seenIds =
    new Set<string>();

  const result: LocalMessage[] = [];

  for (const item of list) {
    if (!item) {
      continue;
    }

    const id = String(
      item.id ?? ""
    ).trim();

    const clientId =
      normalizeClientMessageId(
        (item as any).clientMessageId
      );

    /* =====================================================
       1. CLIENT MESSAGE ID
    ===================================================== */

    if (clientId) {
      if (
        seenClientIds.has(clientId)
      ) {
        console.log(
          "⚠️ Duplicate message removed (clientMessageId):",
          clientId
        );

        continue;
      }

      seenClientIds.add(clientId);

      if (id) {
        seenIds.add(id);
      }

      result.push(item);

      continue;
    }

    /* =====================================================
       2. FALLBACK ID
    ===================================================== */

    if (id) {
      if (seenIds.has(id)) {
        console.log(
          "⚠️ Duplicate message removed (id):",
          id
        );

        continue;
      }

      seenIds.add(id);
    }

    result.push(item);
  }

  return result;
}

/* =========================================================
   CHAT ROOM
========================================================= */

export default function ChatRoomScreen() {
  const params =
    useLocalSearchParams<ChatParams>();

  const {
    chatId,
    receiverId,

    otherUserName:
      routeName,

    otherUserPhoto:
      routePhoto,

    otherUserOnline:
      routeOnline,

    otherUserLastSeen:
      routeLastSeen,
  } = params;

  const { user } =
    useAuthContext();

  /* =======================================================
     MESSAGES
  ======================================================= */

  const {
    messages,
    setMessages,
    flatRef,
    otherUserId,
  } = useChatMessages(
    chatId,
    user?.uid,
    receiverId
  );

  /* =======================================================
     SAFE SET MESSAGES
  ======================================================= */

  const safeSetMessages: Dispatch<
    SetStateAction<LocalMessage[]>
  > = useCallback(
    (action) => {
      setMessages((previous) => {
        const next =
          typeof action === "function"
            ? (
                action as (
                  p: LocalMessage[]
                ) => LocalMessage[]
              )(
                previous as LocalMessage[]
              )
            : action;

        return removeDuplicateMessages(
          next as LocalMessage[]
        );
      });
    },
    [setMessages]
  );

  /* =======================================================
     DISPLAY MESSAGES
  ======================================================= */

  const displayMessages =
    useMemo(() => {
      const unique =
        removeDuplicateMessages(
          messages as LocalMessage[]
        );

      return [...unique].reverse();
    }, [messages]);

  /* =======================================================
     PROFILE
  ======================================================= */

  const [
    otherUserName,
    setOtherUserName,
  ] = useState(
    routeName &&
      String(routeName).trim()
      ? String(routeName)
      : "User"
  );

  const [
    otherUserPhoto,
    setOtherUserPhoto,
  ] =
    useState<string | null>(
      routePhoto &&
        String(routePhoto).trim()
        ? String(routePhoto)
        : null
    );

  const [
    otherUserOnline,
    setOtherUserOnline,
  ] = useState(
    normalizeBoolean(
      routeOnline
    )
  );

  const [
    otherUserLastSeen,
    setOtherUserLastSeen,
  ] =
    useState<string | null>(
      routeLastSeen &&
        String(routeLastSeen).trim()
        ? String(routeLastSeen)
        : null
    );

  /* =======================================================
     SYNC ROUTE PROFILE
  ======================================================= */

  useEffect(() => {
    if (
      routeName &&
      String(routeName).trim()
    ) {
      setOtherUserName(
        String(routeName)
      );
    }

    if (
      routePhoto !== undefined
    ) {
      const photo =
        String(routePhoto).trim();

      setOtherUserPhoto(
        photo || null
      );
    }

    if (
      routeOnline !== undefined
    ) {
      setOtherUserOnline(
        normalizeBoolean(
          routeOnline
        )
      );
    }

    if (
      routeLastSeen !== undefined
    ) {
      const value =
        String(
          routeLastSeen
        ).trim();

      setOtherUserLastSeen(
        value || null
      );
    }
  }, [
    routeName,
    routePhoto,
    routeOnline,
    routeLastSeen,
  ]);

  /* =======================================================
     BACKGROUND PROFILE REFRESH
  ======================================================= */

  useEffect(() => {
    if (!otherUserId) {
      return;
    }

    if (
      user?.uid &&
      String(otherUserId) ===
        String(user.uid)
    ) {
      return;
    }

    let mounted = true;

    async function refreshProfile() {
      try {
        console.log(
          "👤 getUserById:",
          otherUserId
        );

        const profile =
          await getUserById(
            String(otherUserId)
          );

        if (
          !mounted ||
          !profile
        ) {
          return;
        }

        /* NAME */

        const name =
          profile?.name ??
          profile?.fullName ??
          profile?.displayName ??
          profile?.username ??
          profile?.userName;

        if (
          name &&
          String(name).trim()
        ) {
          setOtherUserName(
            String(name)
          );
        }

        /* PHOTO */

        const photo =
          profile?.photoURL ??
          profile?.photoUrl ??
          profile?.profileImage ??
          profile?.profileImageUrl ??
          profile?.avatar ??
          profile?.image ??
          profile?.imageUrl ??
          null;

        if (
          photo &&
          String(photo).trim()
        ) {
          setOtherUserPhoto(
            String(photo)
          );
        }

        /* ONLINE */

        const online =
          normalizeBoolean(
            profile?.isOnline ??
              profile?.online ??
              profile?.onlineStatus ??
              false
          );

        setOtherUserOnline(
          online
        );

        /* LAST SEEN */

        const lastSeenValue =
          profile?.lastSeen ??
          profile?.last_seen ??
          profile?.lastSeenAt ??
          null;

        if (
          lastSeenValue
        ) {
          const formatted =
            formatLastSeen(
              lastSeenValue
            );

          if (formatted) {
            setOtherUserLastSeen(
              formatted
            );
          }
        }
      } catch (error) {
        console.log(
          "⚠️ Background profile refresh failed:",
          error
        );
      }
    }

    void refreshProfile();

    return () => {
      mounted = false;
    };
  }, [
    otherUserId,
    user?.uid,
  ]);

  /* =======================================================
     TEXT
  ======================================================= */

  const [
    text,
    setText,
  ] = useState("");

  /* =======================================================
     SELECTED IMAGE
  ======================================================= */

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState<string | null>(
      null
    );

  /* =======================================================
     ATTACHMENT
  ======================================================= */

  const [
    showAttachment,
    setShowAttachment,
  ] = useState(false);

  /* =======================================================
     REPLY
  ======================================================= */

  const [
    replyMessage,
    setReplyMessage,
  ] =
    useState<LocalMessage | null>(
      null
    );

  /* =======================================================
     GET REPLY OBJECT
  ======================================================= */

  const getReplyTo = () => {
    if (!replyMessage) {
      return null;
    }

    return {
      id: String(
        replyMessage.id
      ),

      message:
        replyMessage.message ||
        "",

      type:
        replyMessage.type ||
        "text",

      senderId: String(
        replyMessage.senderId
      ),

      imageUrl:
        replyMessage.imageUrl ??
        null,

      voiceUrl:
        replyMessage.voiceUrl ??
        null,
    };
  };

  /* =======================================================
     VOICE
  ======================================================= */

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
  } =
    useVoiceRecorder({
      chatId,
      receiverId,
      userId:
        user?.uid,

      getReplyTo,

      setMessages:
        safeSetMessages,

      setReplyMessage,
    });

  /* =======================================================
     SEND TEXT
  ======================================================= */

  async function onSend() {
    const messageText =
      text.trim();

    if (
      !messageText ||
      !user?.uid ||
      !chatId ||
      !receiverId
    ) {
      return;
    }

    const clientMessageId =
      `temp_${randomUUID()}`;

    const createdAt =
      Date.now();

    const replyTo =
      getReplyTo();

    const tempMessage:
      LocalMessage = {
      id:
        clientMessageId,

      clientMessageId,

      chatId:
        String(chatId),

      senderId:
        user.uid,

      receiverId:
        String(receiverId),

      message:
        messageText,

      type:
        "text",

      imageUrl:
        null,

      voiceUrl:
        null,

      fileUrl:
        null,

      replyTo,

      status:
        "sending",

      isSeen:
        0,

      createdAt,

      updatedAt:
        createdAt,
    };

    /* =================================================
       IMMEDIATE UI
    ================================================= */

    safeSetMessages(
      (prev) => [
        ...prev,
        tempMessage,
      ]
    );

    /* =================================================
       SQLITE
    ================================================= */

    insertMessage(
      tempMessage
    );

    /* =================================================
       CLEAR INPUT
    ================================================= */

    setText("");

    setReplyMessage(
      null
    );

    /* =================================================
       OFFLINE
    ================================================= */

    if (!isOnline()) {
      return;
    }

    try {
      const response =
        await sendMessage({
          chatId:
            tempMessage.chatId,

          receiverId:
            tempMessage.receiverId,

          message:
            tempMessage.message,

          type:
            "text",

          clientMessageId,

          replyTo:
            tempMessage.replyTo,
        });

      const realMessage =
        responseToLocalMessage(
          response,
          tempMessage
        );

      /* SQLITE */

      replaceMessageId(
        clientMessageId,
        realMessage
      );

      /* UI */

      safeSetMessages(
        (prev) => {
          const updated =
            prev.map(
              (message) => {
                const messageClientId =
                  normalizeClientMessageId(
                    (message as any)
                      .clientMessageId
                  );

                const isSameMessage =
                  message.id ===
                    clientMessageId ||
                  (messageClientId &&
                    messageClientId ===
                      clientMessageId);

                return isSameMessage
                  ? realMessage
                  : message;
              }
            );

          return removeDuplicateMessages(
            updated
          );
        }
      );
    } catch (error) {
      console.log(
        "❌ SEND ERROR:",
        error
      );

      updateMessageStatus(
        clientMessageId,
        "failed"
      );

      safeSetMessages(
        (prev) =>
          prev.map(
            (message) =>
              message.id ===
              clientMessageId
                ? {
                    ...message,
                    status:
                      "failed",
                  }
                : message
          )
      );
    }
  }

  /* =======================================================
     IMAGE PICKER
  ======================================================= */

  async function pickImage() {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes:
              ImagePicker
                .MediaTypeOptions
                .Images,

            quality: 0.7,

            allowsEditing: false,
          }
        );

      console.log(
        "🖼️ ImagePicker result:",
        JSON.stringify(
          result,
          null,
          2
        )
      );

      if (
        !result.canceled &&
        result.assets?.[0]?.uri
      ) {
        const pickedUri =
          result.assets[0].uri;

        console.log(
          "🖼️ Picked URI type:",
          typeof pickedUri,
          "value:",
          pickedUri
        );

        setSelectedImage(
          pickedUri
        );
      }
    } catch (error) {
      console.log(
        "❌ PICK IMAGE ERROR:",
        error
      );
    }
  }

  /* =======================================================
     CAMERA
  ======================================================= */

  async function openCamera() {
    try {
      const result =
        await ImagePicker.launchCameraAsync(
          {
            quality: 0.7,

            allowsEditing: false,
          }
        );

      console.log(
        "📷 Camera result:",
        JSON.stringify(
          result,
          null,
          2
        )
      );

      if (
        !result.canceled &&
        result.assets?.[0]?.uri
      ) {
        const capturedUri =
          result.assets[0].uri;

        console.log(
          "📷 Captured URI type:",
          typeof capturedUri,
          "value:",
          capturedUri
        );

        setSelectedImage(
          capturedUri
        );
      }
    } catch (error) {
      console.log(
        "❌ CAMERA ERROR:",
        error
      );
    }
  }

  /* =======================================================
     SEND IMAGE
  ======================================================= */

  async function sendImage() {
    if (
      !selectedImage ||
      !user?.uid ||
      !chatId ||
      !receiverId
    ) {
      return;
    }

    if (uploading) {
      return;
    }

    const clientMessageId =
      `temp_${randomUUID()}`;

    const createdAt =
      Date.now();

    const replyTo =
      getReplyTo();

    const optimisticMessage:
      LocalMessage = {
      id:
        clientMessageId,

      clientMessageId,

      chatId:
        String(chatId),

      senderId:
        user.uid,

      receiverId:
        String(receiverId),

      message:
        "",

      type:
        "image",

      imageUrl:
        selectedImage,

      voiceUrl:
        null,

      fileUrl:
        null,

      replyTo,

      status:
        "sending",

      isSeen:
        0,

      createdAt,

      updatedAt:
        createdAt,
    };

    /* =================================================
       IMMEDIATE UI
    ================================================= */

    safeSetMessages(
      (prev) => [
        ...prev,
        optimisticMessage,
      ]
    );

    /* =================================================
       SQLITE
    ================================================= */

    insertMessage(
      optimisticMessage
    );

    /* =================================================
       CLEAR
    ================================================= */

    setSelectedImage(
      null
    );

    setReplyMessage(
      null
    );

    /* =================================================
       OFFLINE
    ================================================= */

    if (!isOnline()) {
      return;
    }

    try {
      setUploading(
        true
      );

      /* ===============================================
         UPLOAD
      =============================================== */

      const imageUrl =
        await uploadImage(
          optimisticMessage.imageUrl!
        );

      /* ===============================================
         API
      =============================================== */

      const response =
        await sendMessage({
          chatId:
            optimisticMessage.chatId,

          receiverId:
            optimisticMessage.receiverId,

          message:
            "",

          type:
            "image",

          imageUrl,

          clientMessageId,

          replyTo:
            optimisticMessage.replyTo,
        });

      /* ===============================================
         REAL MESSAGE
      =============================================== */

      const realMessage =
        responseToLocalMessage(
          {
            ...response,
            imageUrl,
          },

          {
            ...optimisticMessage,
            imageUrl,
          }
        );

      /* SQLITE */

      replaceMessageId(
        clientMessageId,
        realMessage
      );

      /* UI */

      safeSetMessages(
        (prev) => {
          const updated =
            prev.map(
              (message) => {
                const messageClientId =
                  normalizeClientMessageId(
                    (message as any)
                      .clientMessageId
                  );

                const isSameMessage =
                  message.id ===
                    clientMessageId ||
                  (messageClientId &&
                    messageClientId ===
                      clientMessageId);

                return isSameMessage
                  ? realMessage
                  : message;
              }
            );

          return removeDuplicateMessages(
            updated
          );
        }
      );
    } catch (error) {
      console.log(
        "❌ IMAGE SEND ERROR:",
        error
      );

      updateMessageStatus(
        clientMessageId,
        "failed"
      );

      safeSetMessages(
        (prev) =>
          prev.map(
            (message) =>
              message.id ===
              clientMessageId
                ? {
                    ...message,
                    status:
                      "failed",
                  }
                : message
          )
      );
    } finally {
      setUploading(
        false
      );
    }
  }

  /* =======================================================
     RETRY FAILED MESSAGE
  ======================================================= */

  async function retryMessage(
    message: LocalMessage
  ) {
    if (
      message.status !==
      "failed"
    ) {
      return;
    }

    if (
      !user?.uid ||
      !chatId ||
      !receiverId
    ) {
      return;
    }

    const clientMessageId =
      message.clientMessageId &&
      String(
        message.clientMessageId
      ).trim()
        ? String(
            message.clientMessageId
          ).trim()
        : null;

    if (!clientMessageId) {
      console.log(
        "⚠️ Retry skipped, no clientMessageId:",
        message.id
      );

      return;
    }

    console.log(
      "🔁 Retrying failed message:",
      message.id
    );

    /* UI */

    updateMessageStatus(
      message.id,
      "sending"
    );

    safeSetMessages(
      (prev) =>
        prev.map(
          (item) =>
            item.id ===
            message.id
              ? {
                  ...item,
                  status:
                    "sending" as const,
                }
              : item
        )
    );

    try {
      let imageUrl =
        message.imageUrl ??
        undefined;

      /* IMAGE UPLOAD */

      if (
        message.type ===
          "image" &&
        imageUrl &&
        !imageUrl.startsWith(
          "http"
        )
      ) {
        setUploading(
          true
        );

        imageUrl =
          await uploadImage(
            imageUrl
          );
      }

      /* SEND */

      const response =
        await sendMessage({
          chatId:
            message.chatId,

          receiverId:
            message.receiverId,

          message:
            message.message,

          type:
            message.type,

          imageUrl:
            message.type ===
            "image"
              ? imageUrl
              : undefined,

          voiceUrl:
            message.voiceUrl ??
            undefined,

          clientMessageId,

          replyTo:
            message.replyTo ??
            undefined,
        });

      const realMessage =
        responseToLocalMessage(
          {
            ...response,

            imageUrl:
              message.type ===
              "image"
                ? imageUrl
                : response?.imageUrl,
          },

          {
            ...message,

            imageUrl:
              message.type ===
              "image"
                ? imageUrl ??
                  message.imageUrl
                : message.imageUrl,
          }
        );

      replaceMessageId(
        message.id,
        realMessage
      );

      safeSetMessages(
        (prev) => {
          const updated =
            prev.map(
              (item) =>
                item.id ===
                message.id
                  ? realMessage
                  : item
            );

          return removeDuplicateMessages(
            updated
          );
        }
      );

      console.log(
        "✅ Retry success:",
        message.id
      );
    } catch (error) {
      console.log(
        "❌ Retry failed again:",
        error
      );

      updateMessageStatus(
        message.id,
        "failed"
      );

      safeSetMessages(
        (prev) =>
          prev.map(
            (item) =>
              item.id ===
              message.id
                ? {
                    ...item,
                    status:
                      "failed" as const,
                  }
                : item
          )
      );
    } finally {
      if (
        message.type ===
        "image"
      ) {
        setUploading(
          false
        );
      }
    }
  }

  /* =======================================================
     REPLY HANDLER
  ======================================================= */

  function handleReply(
    message: LocalMessage
  ) {
    console.log(
      "↩️ Reply selected:",
      message.id
    );

    setReplyMessage(
      message
    );
  }

  /* =======================================================
     CLOSE REPLY
  ======================================================= */

  function closeReply() {
    setReplyMessage(
      null
    );
  }

  /* =======================================================
     AUDIO CALL
  ======================================================= */

  function handleAudioCall() {
    console.log(
      "📞 Audio call:",
      receiverId
    );
  }

  /* =======================================================
     VIDEO CALL
  ======================================================= */

  function handleVideoCall() {
    console.log(
      "🎥 Video call:",
      receiverId
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <KeyboardAvoidingView
      style={
        styles.container
      }

      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }

      keyboardVerticalOffset={
        0
      }
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <ChatHeader
        name={
          otherUserName ||
          "User"
        }

        photoURL={
          otherUserPhoto ??
          undefined
        }

        online={
          otherUserOnline
        }

        lastSeen={
          otherUserOnline
            ? "Online"
            : otherUserLastSeen ??
              "Offline"
        }

        onAudioCall={
          handleAudioCall
        }

        onVideoCall={
          handleVideoCall
        }
      />

      {/* =================================================
          MESSAGES
      ================================================= */}

      <FlatList<LocalMessage>
        ref={flatRef}

        data={
          displayMessages
        }

        inverted

        keyExtractor={(
          item
        ) =>
          String(
            (item as any)
              .clientMessageId ||
              item.id
          )
        }

        keyboardShouldPersistTaps="handled"

        showsVerticalScrollIndicator={
          false
        }

        removeClippedSubviews={
          false
        }

        contentContainerStyle={
          styles.messages
        }

        renderItem={({
          item,
        }) => {
          const isMine =
            item.senderId ===
            user?.uid;

          return (
            <MessageBubble
              message={
                item.message
              }

              imageUrl={
                item.imageUrl ??
                undefined
              }

              voiceUrl={
                item.voiceUrl ??
                undefined
              }

              type={
                item.type
              }

              isMine={
                isMine
              }

              time={
                item.createdAt
                  ? new Date(
                      item.createdAt
                    ).toLocaleTimeString(
                      [],
                      {
                        hour:
                          "2-digit",

                        minute:
                          "2-digit",
                      }
                    )
                  : ""
              }

              replyTo={
                item.replyTo
              }

              status={
                item.status
              }

              isSeen={Boolean(
                item.isSeen
              )}

              onReply={() =>
                handleReply(
                  item
                )
              }

              onRetry={() =>
                retryMessage(
                  item
                )
              }
            />
          );
        }}
      />

      {/* =================================================
          SELECTED IMAGE PREVIEW
      ================================================= */}

      {selectedImage && (
        <SelectedImagePreview
          uri={
            selectedImage
          }

          uploading={
            uploading
          }

          onSend={
            sendImage
          }
        />
      )}

      {/* =================================================
          REPLY PREVIEW
      ================================================= */}

      <ReplyPreview
        replyMessage={
          replyMessage
        }

        onClose={
          closeReply
        }
      />

      {/* =================================================
          CHAT INPUT
      ================================================= */}

      <ChatInput
        text={
          text
        }

        setText={
          setText
        }

        onSend={
          onSend
        }

        onPickImage={() =>
          setShowAttachment(
            true
          )
        }

        onCamera={
          openCamera
        }

        onVoiceStart={
          onVoiceStart
        }

        onVoiceEnd={
          onVoiceEnd
        }

        onVoiceCancel={
          onVoiceCancel
        }

        onVoiceStop={
          onVoiceStop
        }

        onVoiceLock={
          onVoiceLock
        }

        recording={
          recording
        }

        recordingTime={
          recordingTime
        }

        lockedRecording={
          lockedRecording
        }
      />

      {/* =================================================
          ATTACHMENT SHEET
      ================================================= */}

      <AttachmentSheet
        visible={
          showAttachment
        }

        onClose={() =>
          setShowAttachment(
            false
          )
        }

        onCamera={() => {
          setShowAttachment(
            false
          );

          void openCamera();
        }}

        onGallery={() => {
          setShowAttachment(
            false
          );

          void pickImage();
        }}

        onDocument={() => {
          setShowAttachment(
            false
          );

          console.log(
            "📄 Document"
          );
        }}

        onLocation={() => {
          setShowAttachment(
            false
          );

          console.log(
            "📍 Location"
          );
        }}

        onContact={() => {
          setShowAttachment(
            false
          );

          console.log(
            "👤 Contact"
          );
        }}
      />
    </KeyboardAvoidingView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        "#F8FAFC",
    },

    messages: {
      paddingHorizontal:
        12,

      paddingTop:
        8,

      paddingBottom:
        90,
    },
  });