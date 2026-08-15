import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
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

/* =========================================================
   TYPES
========================================================= */

type ReplyTo = {
  id?: string;
  message?: string;
  type?: "text" | "image" | "voice" | "file";
  senderId?: string;
};

type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "seen"
  | "failed";

type Props = {
  message?: string;
  imageUrl?: string | null;
  voiceUrl?: string | null;
  type?: "text" | "image" | "voice" | "file";
  time: string;
  isMine: boolean;
  replyTo?: ReplyTo | null;
  status?: MessageStatus;
  isSeen?: boolean;
  onReply?: () => void;
  /*
   * ⭐ NEW
   * status === "failed" হলে মেসেজে tap করলে এটা কল হবে,
   * যাতে ইউজার আবার পাঠানোর চেষ্টা করতে পারে।
   */
  onRetry?: () => void;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function MessageBubble({
  message = "",
  imageUrl,
  voiceUrl,
  type = "text",
  time,
  isMine,
  replyTo,
  status = "sent",
  isSeen = false,
  onReply,
  onRetry,
}: Props) {
  /* =======================================================
     IMAGE / VOICE URL SAFETY (⭐⭐⭐ CRITICAL FIX ⭐⭐⭐)
     -------------------------------------------------------
     এই দুইটা এখানে, কম্পোনেন্টের একদম শুরুতেই ঘোষণা করা
     জরুরি — কারণ নিচে playVoice()-এর useCallback dependency
     array-তে (`[safeVoiceUrl, ...]`) এটা ব্যবহার হয়, এবং
     dependency array সাথে সাথে evaluate হয় (function body
     পরে execute হয় না)। safeVoiceUrl যদি এর পরে ঘোষণা করা
     হতো, তাহলে "used before declaration" এরর হতো।
  ======================================================= */

  const safeImageUrl =
    typeof imageUrl === "string" && imageUrl.trim().length > 0
      ? imageUrl.trim()
      : null;

  if (imageUrl && !safeImageUrl) {
    console.log(
      "⚠️ MessageBubble: imageUrl is not a valid string, ignoring:",
      "typeof:",
      typeof imageUrl,
      "value:",
      imageUrl
    );
  }

  const safeVoiceUrl =
    typeof voiceUrl === "string" && voiceUrl.trim().length > 0
      ? voiceUrl.trim()
      : null;

  if (voiceUrl && !safeVoiceUrl) {
    console.log(
      "⚠️ MessageBubble: voiceUrl is not a valid string, ignoring:",
      "typeof:",
      typeof voiceUrl,
      "value:",
      voiceUrl
    );
  }

  /* =======================================================
     VOICE STATE
  ======================================================= */

  const soundRef = useRef<Audio.Sound | null>(null);
  const durationTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  /* =======================================================
     STOP DURATION TIMER
  ======================================================= */

  const stopDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  /* =======================================================
     CLEANUP SOUND
  ======================================================= */

  const cleanupSound = useCallback(
    async (resetDuration = false) => {
      try {
        stopDurationTimer();

        if (soundRef.current) {
          try {
            await soundRef.current.stopAsync();
          } catch {}

          try {
            await soundRef.current.unloadAsync();
          } catch {}

          soundRef.current = null;
        }
      } catch (error) {
        console.log("⚠️ Voice cleanup error:", error);
      }

      setPlaying(false);
      setLoadingVoice(false);
      setPosition(0);

      if (resetDuration) {
        setDuration(0);
      }
    },
    [stopDurationTimer]
  );

  /* =======================================================
     DETECT AUDIO DURATION
  ======================================================= */

  const detectDuration = useCallback(
    async (sound: Audio.Sound) => {
      let attempts = 0;

      stopDurationTimer();

      durationTimerRef.current = setInterval(async () => {
        attempts++;

        try {
          const playbackStatus = await sound.getStatusAsync();

          if (playbackStatus.isLoaded) {
            const durationMillis = playbackStatus.durationMillis;
            const positionMillis = playbackStatus.positionMillis;

            if (durationMillis && durationMillis > 0) {
              setDuration(durationMillis);
            }

            setPosition(positionMillis ?? 0);

            if (durationMillis && durationMillis > 0) {
              stopDurationTimer();
            }
          }
        } catch (error) {
          console.log("⚠️ Duration detect error:", error);
        }

        /* Stop retry after 10 seconds */
        if (attempts >= 100) {
          stopDurationTimer();
        }
      }, 100);
    },
    [stopDurationTimer]
  );

  /* =======================================================
     PLAY / PAUSE VOICE
  ======================================================= */

  const playVoice = useCallback(async () => {
    if (!safeVoiceUrl) {
      console.log("⚠️ Voice URL নেই");
      return;
    }

    try {
      /* =================================================
         PAUSE CURRENT AUDIO
      ================================================= */

      if (playing && soundRef.current) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
        return;
      }

      /* =================================================
         RESUME EXISTING AUDIO
      ================================================= */

      if (soundRef.current && !playing) {
        setLoadingVoice(true);

        const currentStatus =
          await soundRef.current.getStatusAsync();

        if (
          currentStatus.isLoaded &&
          currentStatus.durationMillis
        ) {
          setDuration(currentStatus.durationMillis);
          setPosition(currentStatus.positionMillis ?? 0);
        }

        await soundRef.current.playAsync();
        setLoadingVoice(false);
        setPlaying(true);
        return;
      }

      /* =================================================
         LOAD NEW AUDIO
      ================================================= */

      setLoadingVoice(true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      /* =================================================
         REMOVE OLD SOUND
      ================================================= */

      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch {}

        soundRef.current = null;
      }

      /* =================================================
         CREATE AUDIO
      ================================================= */

      const result = await Audio.Sound.createAsync(
        {
          uri: safeVoiceUrl,
        },
        {
          shouldPlay: false,
          isLooping: false,
          progressUpdateIntervalMillis: 100,
        }
      );

      const sound = result.sound;
      const initialStatus = result.status;

      soundRef.current = sound;

      /* =================================================
         INITIAL DURATION
      ================================================= */

      if (initialStatus.isLoaded) {
        const initialDuration = initialStatus.durationMillis;
        const initialPosition = initialStatus.positionMillis;

        if (initialDuration && initialDuration > 0) {
          setDuration(initialDuration);
        }

        setPosition(initialPosition ?? 0);
      }

      /* =================================================
         PLAYBACK STATUS UPDATE
      ================================================= */

      sound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (!playbackStatus.isLoaded) {
          return;
        }

        if (
          playbackStatus.durationMillis &&
          playbackStatus.durationMillis > 0
        ) {
          setDuration(playbackStatus.durationMillis);
          stopDurationTimer();
        }

        setPosition(playbackStatus.positionMillis ?? 0);

        if (playbackStatus.didJustFinish) {
          setPlaying(false);
          setPosition(0);

          sound.setPositionAsync(0).catch(() => {});
        }
      });

      /* =================================================
         DETECT DURATION
      ================================================= */

      await detectDuration(sound);

      /* =================================================
         LOADING COMPLETE
      ================================================= */

      setLoadingVoice(false);

      /* =================================================
         PLAY
      ================================================= */

      await sound.playAsync();
      setPlaying(true);
    } catch (error) {
      console.log("❌ Voice playback error:", error);
      setLoadingVoice(false);
      await cleanupSound(false);
    }
  }, [
    safeVoiceUrl,
    playing,
    cleanupSound,
    detectDuration,
    stopDurationTimer,
  ]);

  /* =======================================================
     UNMOUNT CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      stopDurationTimer();

      const sound = soundRef.current;
      soundRef.current = null;

      if (sound) {
        sound.stopAsync().catch(() => {});
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [stopDurationTimer]);

  /* =======================================================
     FORMAT VOICE TIME
  ======================================================= */

  function formatVoiceTime(milliseconds: number) {
    if (!milliseconds || milliseconds <= 0) {
      return "0:00";
    }

    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /* =======================================================
     DISPLAY DURATION
  ======================================================= */

  function getVoiceTimeText() {
    if (duration <= 0) {
      return `${formatVoiceTime(position)} / --:--`;
    }

    return `${formatVoiceTime(position)} / ${formatVoiceTime(duration)}`;
  }

  /* =======================================================
     REPLY PREVIEW
  ======================================================= */

  function getReplyPreviewText() {
    if (!replyTo) {
      return "";
    }

    if (replyTo.type === "image") {
      return "📷 Photo";
    }

    if (replyTo.type === "voice") {
      return "🎤 Voice message";
    }

    if (replyTo.type === "file") {
      return "📎 File";
    }

    return replyTo.message || "Message";
  }

  /* =======================================================
     REPLY ICON
  ======================================================= */

  function getReplyIcon() {
    if (!replyTo) {
      return "chatbubble-outline";
    }

    if (replyTo.type === "image") {
      return "image-outline";
    }

    if (replyTo.type === "voice") {
      return "mic-outline";
    }

    if (replyTo.type === "file") {
      return "document-outline";
    }

    return "chatbubble-outline";
  }

  /* =======================================================
     STATUS
  ======================================================= */

  function renderStatusIcon() {
    if (!isMine) {
      return null;
    }

    /* Seen priority */
    if (isSeen || status === "seen") {
      return (
        <Ionicons
          name="checkmark-done"
          size={16}
          color="#93C5FD"
          style={styles.statusIcon}
        />
      );
    }

    switch (status) {
      case "sending":
        return (
          <ActivityIndicator
            size="small"
            color="#E2E8F0"
            style={styles.statusLoader}
          />
        );

      case "failed":
        return (
          <Ionicons
            name="alert-circle"
            size={15}
            color="#FCA5A5"
            style={styles.statusIcon}
          />
        );

      case "delivered":
        return (
          <Ionicons
            name="checkmark-done"
            size={16}
            color="#E2E8F0"
            style={styles.statusIcon}
          />
        );

      case "sent":
      default:
        return (
          <Ionicons
            name="checkmark"
            size={16}
            color="#E2E8F0"
            style={styles.statusIcon}
          />
        );
    }
  }

  /* =======================================================
     VOICE PROGRESS
  ======================================================= */

  const progress =
    duration > 0 ? Math.min(position / duration, 1) : 0;

  /* =======================================================
     IMAGE OPEN
  ======================================================= */

  function openImage() {
    if (!safeImageUrl) {
      return;
    }

    router.push({
      pathname: "/shared/chat/image-viewer",
      params: {
        uri: encodeURIComponent(safeImageUrl),
      },
    });
  }

  /* =======================================================
     RETRY HANDLING (⭐ NEW)
  ======================================================= */

  const isRetryable =
    isMine &&
    status === "failed" &&
    typeof onRetry === "function";

  const BubbleContainer = isRetryable ? TouchableOpacity : View;

  /* =======================================================
     RENDER
  ======================================================= */

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
        <BubbleContainer
          activeOpacity={isRetryable ? 0.75 : 1}
          onPress={isRetryable ? onRetry : undefined}
          style={[
            styles.bubble,
            isMine ? styles.myBubble : styles.otherBubble,
            type === "image" && styles.imageBubble,
          ]}
        >
          {/* =================================================
              REPLY
          ================================================= */}

          {replyTo && (
            <View
              style={[
                styles.replyBox,
                isMine ? styles.myReplyBox : styles.otherReplyBox,
              ]}
            >
              <View style={styles.replyIconContainer}>
                <Ionicons
                  name={getReplyIcon() as any}
                  size={15}
                  color={isMine ? "#DBEAFE" : COLORS.primary}
                />
              </View>

              <View style={styles.replyContent}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.replyLabel,
                    isMine && styles.myReplyLabel,
                  ]}
                >
                  Reply
                </Text>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.replyText,
                    isMine && styles.myReplyText,
                  ]}
                >
                  {getReplyPreviewText()}
                </Text>
              </View>
            </View>
          )}

          {/* =================================================
              IMAGE MESSAGE
          ================================================= */}

          {type === "image" && safeImageUrl ? (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={status === "failed" ? onRetry : openImage}
            >
              <View style={styles.imageWrapper}>
                <Image
                  source={{
                    uri: safeImageUrl,
                  }}
                  style={[
                    styles.image,
                    status === "sending" && styles.imageSending,
                  ]}
                  resizeMode="cover"
                />

                {status === "sending" && (
                  <View style={styles.uploadingOverlay}>
                    <View style={styles.uploadingCircle}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                    <Text style={styles.uploadingText}>
                      Uploading...
                    </Text>
                  </View>
                )}

                {status === "failed" && (
                  <View style={styles.failedOverlay}>
                    <Ionicons
                      name="alert-circle"
                      size={22}
                      color="#fff"
                    />
                    <Text style={styles.failedText}>Failed</Text>
                    <Text style={styles.failedRetryText}>
                      Tap to retry
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : type === "voice" && safeVoiceUrl ? (
            /* =================================================
               VOICE MESSAGE
            ================================================= */
            <View style={styles.voiceContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={status === "failed" ? onRetry : playVoice}
                disabled={status === "sending" || loadingVoice}
                style={styles.voicePlayButton}
              >
                {status === "sending" || loadingVoice ? (
                  <ActivityIndicator
                    size="small"
                    color={isMine ? "#fff" : COLORS.primary}
                  />
                ) : status === "failed" ? (
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={isMine ? "#fff" : COLORS.primary}
                  />
                ) : (
                  <Ionicons
                    name={playing ? "pause" : "play"}
                    size={21}
                    color={isMine ? "#fff" : COLORS.primary}
                  />
                )}
              </TouchableOpacity>

              <View style={styles.voiceContent}>
                <View style={styles.waveform}>
                  {Array.from({ length: 24 }).map((_, index) => {
                    const active =
                      duration > 0 && index / 24 <= progress;

                    const heights = [
                      5, 9, 14, 8, 18, 11, 7, 16, 12, 20, 9, 15, 6,
                      18, 11, 8, 16, 12, 7, 17, 10, 14, 8, 12,
                    ];

                    return (
                      <View
                        key={index}
                        style={[
                          styles.waveBar,
                          {
                            height: heights[index],
                            backgroundColor: active
                              ? isMine
                                ? "#fff"
                                : COLORS.primary
                              : isMine
                                ? "rgba(255,255,255,0.35)"
                                : "#CBD5E1",
                          },
                        ]}
                      />
                    );
                  })}
                </View>

                <Text
                  style={[
                    styles.voiceDuration,
                    isMine && styles.myVoiceDuration,
                  ]}
                >
                  {status === "sending"
                    ? "Sending..."
                    : status === "failed"
                      ? "Tap to retry"
                      : getVoiceTimeText()}
                </Text>
              </View>
            </View>
          ) : type === "file" ? (
            /* =================================================
               FILE MESSAGE
            ================================================= */
            <View style={styles.fileContainer}>
              <View style={styles.fileIcon}>
                <Ionicons
                  name="document-text"
                  size={24}
                  color={isMine ? "#fff" : COLORS.primary}
                />
              </View>

              <View style={styles.fileContent}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.fileTitle,
                    isMine && styles.myFileTitle,
                  ]}
                >
                  {message || "File"}
                </Text>

                <Text
                  style={[
                    styles.fileSubtitle,
                    isMine && styles.myFileSubtitle,
                  ]}
                >
                  {status === "failed" ? "Tap to retry" : "Tap to open"}
                </Text>
              </View>
            </View>
          ) : (
            /* =================================================
               TEXT MESSAGE
            ================================================= */
            <Text
              style={[styles.message, isMine && styles.myMessage]}
            >
              {message}
            </Text>
          )}

          {/* =================================================
              META
          ================================================= */}

          <View
            style={[
              styles.metaRow,
              type === "image" && styles.imageMetaRow,
            ]}
          >
            {status === "failed" &&
              type !== "image" &&
              type !== "voice" &&
              type !== "file" && (
                <Text style={styles.retryHintText}>
                  Tap to retry
                </Text>
              )}

            <Text
              style={[
                styles.time,
                isMine && styles.myTime,
                type === "image" && styles.imageTime,
              ]}
            >
              {time}
            </Text>

            {renderStatusIcon()}
          </View>
        </BubbleContainer>
      </View>
    </SwipeableMessage>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 4,
  },

  leftContainer: {
    alignItems: "flex-start",
  },

  rightContainer: {
    alignItems: "flex-end",
  },

  bubble: {
    maxWidth: "82%",
    minWidth: 60,
    borderRadius: 20,
    overflow: "hidden",
  },

  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  otherBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EDF3",
    borderBottomLeftRadius: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  imageBubble: {
    padding: 4,
  },

  replyBox: {
    flexDirection: "row",
    marginHorizontal: 7,
    marginTop: 7,
    paddingVertical: 8,
    paddingHorizontal: 9,
    borderRadius: 11,
    borderLeftWidth: 3,
  },

  myReplyBox: {
    backgroundColor: "rgba(255,255,255,0.13)",
    borderLeftColor: "#DBEAFE",
  },

  otherReplyBox: {
    backgroundColor: "#F1F5F9",
    borderLeftColor: COLORS.primary,
  },

  replyIconContainer: {
    width: 25,
    height: 25,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 7,
  },

  replyContent: {
    flex: 1,
    justifyContent: "center",
  },

  replyLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 2,
  },

  myReplyLabel: {
    color: "#DBEAFE",
  },

  replyText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#475569",
  },

  myReplyText: {
    color: "#F8FAFC",
  },

  message: {
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 5,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.text,
  },

  myMessage: {
    color: "#FFFFFF",
  },

  imageWrapper: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 16,
  },

  image: {
    width: 240,
    height: 280,
    backgroundColor: "#E2E8F0",
  },

  imageSending: {
    opacity: 0.72,
  },

  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.38)",
  },

  uploadingCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    alignItems: "center",
  },

  uploadingText: {
    marginTop: 7,
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  failedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(127,29,29,0.55)",
  },

  failedText: {
    marginTop: 5,
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  failedRetryText: {
    marginTop: 2,
    color: "#FCA5A5",
    fontSize: 10,
    fontWeight: "600",
  },

  voiceContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 270,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  voicePlayButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  voiceContent: {
    flex: 1,
    marginLeft: 11,
  },

  waveform: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 4,
  },

  waveBar: {
    width: 3,
    borderRadius: 3,
    opacity: 0.95,
  },

  voiceDuration: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },

  myVoiceDuration: {
    color: "rgba(255,255,255,0.78)",
  },

  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 220,
  },

  fileIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  fileContent: {
    flex: 1,
    marginLeft: 10,
  },

  fileTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  myFileTitle: {
    color: "#fff",
  },

  fileSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: "#64748B",
  },

  myFileSubtitle: {
    color: "rgba(255,255,255,0.7)",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 3,
    paddingBottom: 8,
  },

  imageMetaRow: {
    position: "absolute",
    right: 5,
    bottom: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  retryHintText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#FCA5A5",
    marginRight: 6,
  },

  time: {
    fontSize: 10.5,
    fontWeight: "500",
    color: "#94A3B8",
  },

  myTime: {
    color: "rgba(255,255,255,0.72)",
  },

  imageTime: {
    color: "#fff",
  },

  statusIcon: {
    marginLeft: 4,
  },

  statusLoader: {
    marginLeft: 5,
  },
});