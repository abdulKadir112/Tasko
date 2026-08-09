import React, {
  useEffect,
  useState,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import SwipeableMessage from "./SwipeableMessage";
import { COLORS } from "@/theme";

type ReplyTo = {
  id?: string;
  message?: string;
  type?: "text" | "image" | "voice" | "file";
  senderId?: string;
};

type Props = {
  message?: string;
  imageUrl?: string | null;
  voiceUrl?: string | null;
  type?: "text" | "image" | "voice" | "file";
  time: string;
  isMine: boolean;
  replyTo?: ReplyTo | null;
  status?:
    | "sending"
    | "sent"
    | "delivered"
    | "seen"
    | "failed";
  isSeen?: boolean;
  onReply?: () => void;
};

export default function MessageBubble({
  message,
  imageUrl,
  voiceUrl,
  type = "text",
  time,
  isMine,
  replyTo,
  status = "sent",
  isSeen = false,
  onReply,
}: Props) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  async function playVoice() {
    if (!voiceUrl) return;
    if (playing && soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setPlaying(false);
      setPosition(0);
      return;
    }
    const { sound } = await Audio.Sound.createAsync({
      uri: voiceUrl,
    });
    soundRef.current = sound;
    setPlaying(true);
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (!status.isLoaded) return;
      setDuration(status.durationMillis ?? 0);
      setPosition(status.positionMillis ?? 0);
      if (status.didJustFinish) {
        setPlaying(false);
        setPosition(0);
        sound.unloadAsync();
        soundRef.current = null;
      }
    });
    await sound.playAsync();
  }

  function formatTime(ms: number) {
    const total = Math.floor(ms / 1000);
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  function getReplyPreviewText() {
    if (!replyTo) return "";
    if (replyTo.type === "image") return "📷 Photo";
    if (replyTo.type === "voice") return "🎤 Voice Message";
    if (replyTo.type === "file") return "📎 File";
    return replyTo.message || "";
  }

  function renderStatusIcon() {
    if (!isMine) return null;

    switch (status) {
      case "sending":
        return (
          <ActivityIndicator
            size="small"
            color="#E5E7EB"
            style={{ marginLeft: 4 }}
          />
        );

      case "failed":
        return (
          <Ionicons
            name="alert-circle"
            size={14}
            color="#EF4444"
            style={{ marginLeft: 4 }}
          />
        );

      case "sent":
        return (
          <Ionicons
            name="checkmark"
            size={15}
            color="#E5E7EB"
            style={{ marginLeft: 4 }}
          />
        );

      case "delivered":
        return (
          <Ionicons
            name="checkmark-done"
            size={15}
            color="#E5E7EB"
            style={{ marginLeft: 4 }}
          />
        );

      case "seen":
        return (
          <Ionicons
            name="checkmark-done"
            size={15}
            color="#3B82F6"
            style={{ marginLeft: 4 }}
          />
        );

      default:
        return null;
    }
  }

  const progress = duration > 0 ? position / duration : 0;

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  return (
    <SwipeableMessage
      onReply={() => {
        onReply?.();
      }}
    >
      <View
        style={[
          styles.container,
          isMine ? styles.rightContainer : styles.leftContainer,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMine ? styles.myBubble : styles.otherBubble,
          ]}
        >
          {/* REPLY PREVIEW */}
          {replyTo && (
            <View
              style={[
                styles.replyBox,
                isMine ? styles.myReplyBox : styles.otherReplyBox,
              ]}
            >
              <Text
                style={[
                  styles.replyLabel,
                  isMine && { color: "#E0E7FF" },
                ]}
                numberOfLines={1}
              >
                Reply
              </Text>
              <Text
                style={[
                  styles.replyText,
                  isMine && { color: "#F8FAFC" },
                ]}
                numberOfLines={1}
              >
                {getReplyPreviewText()}
              </Text>
            </View>
          )}

          {/* IMAGE */}
          {type === "image" && imageUrl ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/shared/chat/image-viewer",
                  params: {
                    uri: encodeURIComponent(imageUrl),
                  },
                })
              }
            >
              <View>
                <Image
                  source={{ uri: imageUrl }}
                  style={[
                    styles.image,
                    status === "sending" && { opacity: 0.7 },
                  ]}
                  resizeMode="cover"
                />
                {status === "sending" && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : type === "voice" && voiceUrl ? (
            <View style={styles.voiceContainer}>
              <TouchableOpacity
                onPress={playVoice}
                disabled={status === "sending"}
              >
                {status === "sending" ? (
                  <ActivityIndicator
                    size="small"
                    color={isMine ? "#fff" : COLORS.primary}
                  />
                ) : (
                  <Ionicons
                    name={playing ? "pause-circle" : "play-circle"}
                    size={44}
                    color={isMine ? "#fff" : COLORS.primary}
                  />
                )}
              </TouchableOpacity>
              <View style={styles.voiceContent}>
                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: isMine
                          ? "#fff"
                          : COLORS.primary,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.voiceDuration,
                    isMine && { color: "#fff" },
                  ]}
                >
                  {status === "sending"
                    ? "Sending..."
                    : `${formatTime(position)} / ${formatTime(duration)}`}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.message, isMine && styles.myMessage]}>
              {message}
            </Text>
          )}

          {/* TIME + STATUS */}
          <View style={styles.metaRow}>
            <Text style={[styles.time, isMine && styles.myTime]}>
              {time}
            </Text>
            {renderStatusIcon()}
          </View>
        </View>
      </View>
    </SwipeableMessage>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 6,
  },
  leftContainer: {
    alignItems: "flex-start",
  },
  rightContainer: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    overflow: "hidden",
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 5,
  },
  otherBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  replyBox: {
    marginTop: 8,
    marginHorizontal: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderRadius: 8,
  },
  myReplyBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderLeftColor: "#E0E7FF",
  },
  otherReplyBox: {
    backgroundColor: "#F1F5F9",
    borderLeftColor: COLORS.primary,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
    color: "#475569",
  },
  message: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    fontSize: 16,
    color: COLORS.text,
  },
  myMessage: {
    color: "#fff",
  },
  image: {
    width: 230,
    height: 260,
    borderRadius: 12,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  voiceContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    width: 250,
  },
  voiceContent: {
    flex: 1,
    marginLeft: 12,
  },
  progressBackground: {
    height: 4,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 3,
  },
  voiceDuration: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748B",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 4,
  },
  time: {
    fontSize: 11,
    color: "#94A3B8",
  },
  myTime: {
    color: "#E5E7EB",
  },
});