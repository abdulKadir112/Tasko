import React, { useEffect, useRef } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import VoiceRecorder from "@/components/chat/VoiceRecorder";
import VoiceRecordGesture from "./VoiceRecordGesture";

import { COLORS } from "@/theme";

type Props = {
  text: string;
  setText: (text: string) => void;

  onSend: () => void;
  onPickImage: () => void;
  onCamera: () => void;

  onVoiceStart: () => Promise<boolean> | void;
  onVoiceEnd: () => void | Promise<void>;
  onVoiceCancel: () => void | Promise<void>;
  onVoiceLock: () => void;
  onVoiceStop: () => void | Promise<void>;

  recording: boolean;
  recordingTime: number;
  lockedRecording: boolean;
};

export default function ChatInput({
  text,
  setText,

  onSend,
  onPickImage,

  onVoiceStart,
  onVoiceEnd,
  onVoiceCancel,
  onVoiceLock,
  onVoiceStop,

  recording,
  recordingTime,
  lockedRecording,
}: Props) {
  /*
   * ⭐⭐⭐ NEW ⭐⭐⭐
   *
   * ফোনের নিচের safe area (gesture bar / home indicator)
   * কতটুকু জায়গা নেয় সেটা বের করা হচ্ছে, যাতে chat input
   * সেই অংশের সাথে লেগে না থেকে একটু উপরে বসে — আগে এটা
   * না থাকায় input বার একদম screen-এর একদম কিনারে চলে
   * যেত এবং দেখতে খারাপ লাগত।
   */

  const insets = useSafeAreaInsets();

  /*
   * ন্যূনতম কিছু padding সবসময় থাকবে, তার সাথে safe area
   * যোগ হবে। খুব বড় inset (যেমন iOS-এ ৩৪px) হলে সেটা
   * অতিরিক্ত জায়গা নিয়ে নেবে, তাই একটা reasonable cap
   * রাখা হয়েছে।
   */

  const bottomInset = Math.min(
    insets.bottom,
    24
  );

  // =====================================================
  // VOICE REFS
  // =====================================================

  const pressRecordingRef = useRef(false);

  const endingVoiceRef = useRef(false);

  const startPromiseRef = useRef<Promise<boolean> | null>(null);

  // =====================================================
  // DEBUG
  // =====================================================

  useEffect(() => {
    console.log("🔄 ChatInput recording:", recording);
    console.log("🔄 ChatInput locked:", lockedRecording);
    console.log("⏱️ Recording time:", recordingTime);
  }, [recording, lockedRecording, recordingTime]);

  // =====================================================
  // RESET
  // =====================================================

  useEffect(() => {
    if (!recording) {
      if (!startPromiseRef.current) {
        pressRecordingRef.current = false;
      }

      endingVoiceRef.current = false;
    }
  }, [recording]);

  // =====================================================
  // START VOICE
  // =====================================================

  const startVoice = () => {
    console.log("🎤 ChatInput START REQUEST");

    if (pressRecordingRef.current) {
      console.log("⚠️ Voice press already active");
      return;
    }

    if (endingVoiceRef.current) {
      console.log("⚠️ Previous voice is ending");
      return;
    }

    pressRecordingRef.current = true;

    console.log("🎤 ChatInput -> onVoiceStart()");

    try {
      const result = onVoiceStart();

      if (
        result &&
        typeof (result as Promise<boolean>).then === "function"
      ) {
        const promise = Promise.resolve(
          result as Promise<boolean>
        );

        startPromiseRef.current = promise;

        void promise.finally(() => {
          if (startPromiseRef.current === promise) {
            startPromiseRef.current = null;
          }
        });
      }
    } catch (error) {
      console.log("❌ ChatInput start error:", error);

      pressRecordingRef.current = false;
      startPromiseRef.current = null;
    }
  };

  // =====================================================
  // RELEASE → SEND
  // =====================================================

  const releaseVoice = async () => {
    console.log("🟡 MIC RELEASE");

    const startPromise = startPromiseRef.current;

    // Recording start হওয়ার জন্য wait
    if (startPromise) {
      console.log("⏳ Waiting for recording to start...");

      try {
        const started = await startPromise;

        console.log("🎤 Start result:", started);
      } catch (error) {
        console.log("❌ Start promise failed:", error);
      }
    }

    // Locked হলে release থেকে send হবে না
    if (lockedRecording) {
      console.log("🔒 Recording locked");
      return;
    }

    // Recording active না হলে
    if (!recording) {
      console.log("⚠️ Recording never became active");

      pressRecordingRef.current = false;

      return;
    }

    // Already ending
    if (endingVoiceRef.current) {
      console.log("⚠️ Ending already running");
      return;
    }

    endingVoiceRef.current = true;
    pressRecordingRef.current = false;

    console.log("🛑 ChatInput -> onVoiceEnd()");

    try {
      await onVoiceEnd();
    } catch (error) {
      console.log("❌ Voice end error:", error);
    } finally {
      endingVoiceRef.current = false;
    }
  };

  // =====================================================
  // CANCEL
  // =====================================================

  const cancelVoice = async () => {
    console.log("🗑️ ChatInput CANCEL");

    if (endingVoiceRef.current) {
      return;
    }

    endingVoiceRef.current = true;

    pressRecordingRef.current = false;

    startPromiseRef.current = null;

    try {
      await onVoiceCancel();
    } catch (error) {
      console.log("❌ Voice cancel error:", error);
    } finally {
      endingVoiceRef.current = false;
    }
  };

  // =====================================================
  // LOCK
  // =====================================================

  const lockVoice = () => {
    console.log("🔒 ChatInput LOCK");

    if (endingVoiceRef.current) {
      return;
    }

    if (!recording) {
      return;
    }

    pressRecordingRef.current = false;

    onVoiceLock();
  };

  // =====================================================
  // STOP LOCKED VOICE
  // =====================================================

  const stopLockedVoice = async () => {
    console.log("📤 LOCKED SEND PRESSED");

    if (endingVoiceRef.current) {
      return;
    }

    if (!recording) {
      return;
    }

    endingVoiceRef.current = true;

    pressRecordingRef.current = false;

    try {
      await onVoiceStop();
    } catch (error) {
      console.log("❌ Locked voice stop error:", error);
    } finally {
      endingVoiceRef.current = false;
    }
  };

  // =====================================================
  // MIC BUTTON
  // =====================================================

  const renderMicButton = () => {
    return (
      <VoiceRecordGesture
        recording={recording}
        recordingTime={recordingTime}
        lockedRecording={lockedRecording}
        onStart={startVoice}
        onRelease={releaseVoice}
        onCancel={cancelVoice}
        onLock={lockVoice}
      >
        <View style={styles.micGestureButton}>
          <View
            style={[
              styles.send,
              recording && styles.recordingMicButton,
            ]}
          >
            <Ionicons
              name="mic"
              size={22}
              color="#fff"
            />
          </View>
        </View>
      </VoiceRecordGesture>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <View
      style={[
        styles.wrapper,

        /*
         * ⭐ safe area bottom padding — এইটাই মূল ফিক্স।
         * ফোনের gesture bar/home indicator-এর জন্য
         * প্রয়োজনীয় জায়গা রাখা হচ্ছে, যাতে input বার
         * স্ক্রিনের একদম কিনারে না লেগে থাকে।
         */
        { paddingBottom: bottomInset },
      ]}
    >
      {/* =================================================
          RECORDING AREA
      ================================================= */}

      {recording && (
        <View style={styles.recordingContainer}>
          {/* HINT */}

          {!lockedRecording && (
            <Text style={styles.hintText}>
              ← Slide left to cancel • ↑ Slide up to lock
            </Text>
          )}

          {/* LOCKED */}

          {lockedRecording && (
            <Text style={styles.lockedText}>
              🔒 Recording Locked
            </Text>
          )}

          {/* =================================================
              VOICE RECORDER
          ================================================= */}

          <View style={styles.recorderWrap}>
            <VoiceRecorder
              recording={recording}
              recordingTime={recordingTime}
              lockedRecording={lockedRecording}
            />
          </View>

          {/* =================================================
              LOCKED ACTIONS
          ================================================= */}

          {lockedRecording && (
            <View style={styles.lockedActions}>
              {/* CANCEL */}

              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.8}
                onPress={cancelVoice}
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color="#EF4444"
                />

                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              {/* SEND */}

              <TouchableOpacity
                style={styles.lockedSendButton}
                activeOpacity={0.8}
                onPress={stopLockedVoice}
              >
                <Ionicons
                  name="send"
                  size={21}
                  color="#fff"
                />

                <Text style={styles.lockedSendText}>
                  Send Voice
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* RELEASE INFO */}

          {!lockedRecording && (
            <View style={styles.releaseInfo}>
              <Ionicons
                name="mic"
                size={18}
                color={COLORS.primary}
              />

              <Text style={styles.releaseInfoText}>
                Release to send
              </Text>
            </View>
          )}
        </View>
      )}

      {/* =================================================
          NORMAL INPUT
      ================================================= */}

      <View style={styles.container}>
        {/* PLUS */}

        <TouchableOpacity
          style={styles.plusButton}
          activeOpacity={0.7}
          onPress={onPickImage}
          disabled={recording}
        >
          <Ionicons
            name="add"
            size={28}
            color={
              recording
                ? "#CBD5E1"
                : COLORS.primary
            }
          />
        </TouchableOpacity>

        {/* TEXT INPUT */}

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#94A3B8"
          multiline
          editable={!recording}
          style={styles.input}
        />

        {/* =================================================
            SEND / MIC
        ================================================= */}

        {text.trim().length > 0 && !recording ? (
          <TouchableOpacity
            onPress={onSend}
            style={styles.send}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
        ) : (
          renderMicButton()
        )}
      </View>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
  },

  container: {
    flexDirection: "row",
    alignItems: "flex-end",

    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,

    backgroundColor: "#fff",

    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },

  plusButton: {
    width: 40,
    height: 40,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 8,
  },

  input: {
    flex: 1,

    backgroundColor: "#F1F5F9",

    borderRadius: 22,

    paddingHorizontal: 16,
    paddingVertical: 10,

    maxHeight: 120,

    fontSize: 16,

    color: COLORS.text,
  },

  micGestureButton: {
    marginLeft: 8,
  },

  send: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: COLORS.primary,

    justifyContent: "center",
    alignItems: "center",
  },

  recordingMicButton: {
    backgroundColor: "#EF4444",
  },

  recordingContainer: {
    backgroundColor: "#fff",

    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },

  recorderWrap: {
    width: "100%",
  },

  hintText: {
    textAlign: "center",

    color: "#94A3B8",

    fontSize: 12,

    marginBottom: 6,
  },

  lockedText: {
    textAlign: "center",

    color: "#22C55E",

    fontWeight: "700",

    fontSize: 12,

    marginBottom: 6,
  },

  releaseInfo: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    marginTop: 8,
    marginBottom: 4,
  },

  releaseInfoText: {
    marginLeft: 6,

    color: "#64748B",

    fontSize: 12,

    fontWeight: "600",
  },

  lockedActions: {
    flexDirection: "row",

    alignItems: "center",

    gap: 8,

    marginTop: 8,
    marginBottom: 4,
  },

  cancelButton: {
    flex: 1,

    height: 42,

    borderRadius: 21,

    backgroundColor: "#FEF2F2",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",
  },

  cancelText: {
    marginLeft: 7,

    color: "#EF4444",

    fontSize: 14,

    fontWeight: "700",
  },

  lockedSendButton: {
    flex: 1,

    height: 42,

    borderRadius: 21,

    backgroundColor: COLORS.primary,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",
  },

  lockedSendText: {
    marginLeft: 7,

    color: "#fff",

    fontSize: 14,

    fontWeight: "700",
  },
});