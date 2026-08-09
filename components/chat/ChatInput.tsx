import React, { useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import VoiceRecorder from "@/components/chat/VoiceRecorder";
import { COLORS } from "@/theme";

type Props = {
  text: string;
  setText: (text: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  onCamera: () => void;
  onVoiceStart: () => void;
  onVoiceEnd: () => void;
  onVoiceCancel: () => void;
  onVoiceLock: () => void;
  onVoiceStop: () => void;
  recording: boolean;
  recordingTime: number;
  lockedRecording: boolean;
};

export default function ChatInput({
  text,
  setText,
  onSend,
  onPickImage,
  onCamera,
  onVoiceStart,
  onVoiceEnd,
  onVoiceCancel,
  onVoiceLock,
  onVoiceStop,
  recording,
  recordingTime,
  lockedRecording,
}: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!recording) {
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [recording]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!recording || lockedRecording) return;

      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }

      if (event.translationY < 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      if (translateY.value < -90) {
        runOnJS(onVoiceLock)();
      } else if (translateX.value < -120) {
        runOnJS(onVoiceCancel)();
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const slideStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  if (recording) {
    return (
      <View style={styles.recordingContainer}>
        {!lockedRecording && (
          <Text style={styles.hintText}>← Slide left to cancel</Text>
        )}

        {lockedRecording && (
          <Text style={styles.lockedText}>🔒 Recording Locked</Text>
        )}

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.recorderWrap, slideStyle]}>
            <VoiceRecorder
              recording={recording}
              recordingTime={recordingTime}
              lockedRecording={lockedRecording}
              onStop={onVoiceStop}
            />
          </Animated.View>
        </GestureDetector>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.plusButton} onPress={onPickImage}>
        <Ionicons name="add" size={28} color={COLORS.primary} />
      </TouchableOpacity>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        placeholderTextColor="#94A3B8"
        multiline
        style={styles.input}
      />

      {text.trim() ? (
        <TouchableOpacity onPress={onSend} style={styles.send}>
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.send}
          delayLongPress={100}
          onLongPress={onVoiceStart}
          onPressOut={() => {
            if (!lockedRecording) {
              onVoiceEnd();
            }
          }}
        >
          <Ionicons name="mic" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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

  recordingContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 8,
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
  },

  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 8,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});