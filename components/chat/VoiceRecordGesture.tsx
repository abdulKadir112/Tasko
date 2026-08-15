import React from "react";

import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

type Props = {
  recording: boolean;
  lockedRecording: boolean;
  recordingTime: number;

  onStart: () => void;
  onRelease: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  onLock: () => void;

  children: React.ReactNode;
};

const CANCEL_DISTANCE = -120;
const LOCK_DISTANCE = -90;

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 220,
  mass: 0.7,
};

export default function VoiceRecordGesture({
  recording,
  lockedRecording,
  recordingTime,
  onStart,
  onRelease,
  onCancel,
  onLock,
  children,
}: Props) {
  // =====================================================
  // ANIMATION VALUES
  // =====================================================

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const lockProgress = useSharedValue(0);
  const cancelProgress = useSharedValue(0);

  const micScale = useSharedValue(1);

  // =====================================================
  // TIME FORMAT
  // =====================================================

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(
      0,
      Math.floor(seconds)
    );

    const minutes = Math.floor(
      safeSeconds / 60
    );

    const remainingSeconds =
      safeSeconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;
  };

  // =====================================================
  // GESTURE
  // =====================================================

  const gesture = Gesture.Pan()
    .minDistance(0)

    // ===================================================
    // TOUCH START
    // ===================================================

    .onBegin(() => {
      if (lockedRecording) {
        return;
      }

      micScale.value = withSpring(
        1.08,
        SPRING_CONFIG
      );

      runOnJS(onStart)();
    })

    // ===================================================
    // FINGER MOVE
    // ===================================================

    .onUpdate((event) => {
      if (
        !recording ||
        lockedRecording
      ) {
        return;
      }

      const x = event.translationX;
      const y = event.translationY;

      // -----------------------------------------------
      // LEFT → CANCEL
      // -----------------------------------------------

      if (x < 0) {
        translateX.value = x;

        const progress = Math.min(
          Math.abs(x) /
            Math.abs(CANCEL_DISTANCE),
          1
        );

        cancelProgress.value =
          withTiming(progress, {
            duration: 50,
          });
      } else {
        translateX.value = 0;

        cancelProgress.value =
          withTiming(0, {
            duration: 100,
          });
      }

      // -----------------------------------------------
      // UP → LOCK
      // -----------------------------------------------

      if (y < 0) {
        translateY.value = y;

        const progress = Math.min(
          Math.abs(y) /
            Math.abs(LOCK_DISTANCE),
          1
        );

        lockProgress.value =
          withTiming(progress, {
            duration: 50,
          });
      } else {
        translateY.value = 0;

        lockProgress.value =
          withTiming(0, {
            duration: 100,
          });
      }
    })

    // ===================================================
    // RELEASE
    // ===================================================

    .onEnd(() => {
      if (lockedRecording) {
        return;
      }

      const movedLeft =
        translateX.value <=
        CANCEL_DISTANCE;

      const movedUp =
        translateY.value <=
        LOCK_DISTANCE;

      console.log(
        "🎙️ Voice Gesture END",
        {
          movedLeft,
          movedUp,
          x: translateX.value,
          y: translateY.value,
        }
      );

      // -----------------------------------------------
      // PRIORITY
      // LOCK → CANCEL → SEND
      // -----------------------------------------------

      if (movedUp) {
        runOnJS(onLock)();
      } else if (movedLeft) {
        runOnJS(onCancel)();
      } else {
        runOnJS(onRelease)();
      }

      // -----------------------------------------------
      // RESET
      // -----------------------------------------------

      translateX.value =
        withSpring(
          0,
          SPRING_CONFIG
        );

      translateY.value =
        withSpring(
          0,
          SPRING_CONFIG
        );

      lockProgress.value =
        withSpring(
          0,
          SPRING_CONFIG
        );

      cancelProgress.value =
        withSpring(
          0,
          SPRING_CONFIG
        );

      micScale.value =
        withSpring(
          1,
          SPRING_CONFIG
        );
    })

    // ===================================================
    // FINALIZE
    // ===================================================

    .onFinalize(() => {
      translateX.value =
        withSpring(
          0,
          SPRING_CONFIG
        );

      translateY.value =
        withSpring(
          0,
          SPRING_CONFIG
        );

      lockProgress.value =
        withSpring(
          0,
          SPRING_CONFIG
        );

      cancelProgress.value =
        withSpring(
          0,
          SPRING_CONFIG
        );

      micScale.value =
        withSpring(
          1,
          SPRING_CONFIG
        );
    });

  // =====================================================
  // MIC ANIMATION
  // =====================================================

  const animatedMicStyle =
    useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateX:
              translateX.value,
          },
          {
            translateY:
              translateY.value,
          },
          {
            scale:
              micScale.value,
          },
        ],
      };
    });

  // =====================================================
  // MIC INNER ANIMATION
  // =====================================================

  const animatedMicInnerStyle =
    useAnimatedStyle(() => {
      const scale = interpolate(
        lockProgress.value,
        [0, 1],
        [1, 1.08],
        Extrapolation.CLAMP
      );

      return {
        transform: [
          {
            scale,
          },
        ],
      };
    });

  // =====================================================
  // LOCK INDICATOR
  // =====================================================

  const lockStyle =
    useAnimatedStyle(() => {
      return {
        opacity:
          lockProgress.value,

        transform: [
          {
            translateY: interpolate(
              lockProgress.value,
              [0, 1],
              [35, 0],
              Extrapolation.CLAMP
            ),
          },
          {
            scale: interpolate(
              lockProgress.value,
              [0, 1],
              [0.6, 1],
              Extrapolation.CLAMP
            ),
          },
        ],
      };
    });

  // =====================================================
  // CANCEL INDICATOR
  // =====================================================

  const cancelStyle =
    useAnimatedStyle(() => {
      return {
        opacity:
          cancelProgress.value,

        transform: [
          {
            translateX: interpolate(
              cancelProgress.value,
              [0, 1],
              [25, 0],
              Extrapolation.CLAMP
            ),
          },
          {
            scale: interpolate(
              cancelProgress.value,
              [0, 1],
              [0.85, 1],
              Extrapolation.CLAMP
            ),
          },
        ],
      };
    });

  // =====================================================
  // RECORDING PULSE
  // =====================================================

  const pulseStyle =
    useAnimatedStyle(() => {
      return {
        opacity: recording
          ? 1
          : 0,

        transform: [
          {
            scale:
              recording
                ? 1.15
                : 1,
          },
        ],
      };
    });

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <GestureDetector
      gesture={gesture}
    >
      <Animated.View
        style={styles.gestureContainer}
      >
        {/* =================================================
            LEFT CANCEL AREA
        ================================================= */}

        {!lockedRecording && (
          <Animated.View
            style={[
              styles.cancelIndicator,
              cancelStyle,
            ]}
          >
            <View
              style={
                styles.cancelIconCircle
              }
            >
              <Text
                style={
                  styles.cancelIcon
                }
              >
                ×
              </Text>
            </View>

            <Text
              style={
                styles.cancelText
              }
            >
              Slide to cancel
            </Text>

            <Text
              style={
                styles.cancelArrow
              }
            >
              ←
            </Text>
          </Animated.View>
        )}

        {/* =================================================
            LOCK AREA
        ================================================= */}

        {!lockedRecording && (
          <Animated.View
            style={[
              styles.lockIndicator,
              lockStyle,
            ]}
          >
            <View
              style={
                styles.lockCircle
              }
            >
              <Text
                style={
                  styles.lockEmoji
                }
              >
                🔒
              </Text>
            </View>

            <Text
              style={
                styles.lockText
              }
            >
              Slide up to lock
            </Text>
          </Animated.View>
        )}

        {/* =================================================
            RECORDING TIME
        ================================================= */}

        {recording &&
          !lockedRecording && (
            <View
              style={
                styles.recordingTimeContainer
              }
            >
              <View
                style={
                  styles.recordingDot
                }
              />

              <Text
                style={
                  styles.recordingTime
                }
              >
                {formatTime(
                  recordingTime
                )}
              </Text>
            </View>
          )}

        {/* =================================================
            MIC
        ================================================= */}

        <Animated.View
          style={[
            styles.micWrapper,
            animatedMicStyle,
          ]}
        >
          {/* PULSE RING */}

          {recording && (
            <Animated.View
              style={[
                styles.pulseRing,
                pulseStyle,
              ]}
            />
          )}

          {/* MIC */}

          <Animated.View
            style={[
              styles.micButton,
              recording &&
                styles.recordingMic,
              lockedRecording &&
                styles.lockedMic,
              animatedMicInnerStyle,
            ]}
          >
            {children}
          </Animated.View>
        </Animated.View>

        {/* =================================================
            RECORDING STATUS
        ================================================= */}

        {recording &&
          !lockedRecording && (
            <View
              style={
                styles.statusContainer
              }
            >
              <View
                style={
                  styles.statusDot
                }
              />

              <Text
                style={
                  styles.statusText
                }
              >
                Recording...
              </Text>
            </View>
          )}
      </Animated.View>
    </GestureDetector>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  gestureContainer: {
    position: "relative",

    minWidth: 44,
    minHeight: 44,

    justifyContent: "center",
    alignItems: "center",
  },

  // ===================================================
  // MIC
  // ===================================================

  micWrapper: {
    position: "relative",

    width: 48,
    height: 48,

    justifyContent: "center",
    alignItems: "center",

    zIndex: 10,
  },

  micButton: {
    width: 44,
    height: 44,

    borderRadius: 22,

    justifyContent: "center",
    alignItems: "center",

    overflow: "visible",
  },

  recordingMic: {
    shadowColor: "#EF4444",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.3,
    shadowRadius: 8,

    elevation: 6,
  },

  lockedMic: {
    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.25,
    shadowRadius: 8,

    elevation: 6,
  },

  pulseRing: {
    position: "absolute",

    width: 58,
    height: 58,

    borderRadius: 29,

    borderWidth: 2,

    borderColor: "#EF4444",

    opacity: 0.35,
  },

  // ===================================================
  // RECORDING TIME
  // ===================================================

  recordingTimeContainer: {
    position: "absolute",

    right: 58,

    top: 2,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 9,

    height: 28,

    borderRadius: 14,

    backgroundColor: "#FEF2F2",

    zIndex: 15,
  },

  recordingDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: "#EF4444",

    marginRight: 6,
  },

  recordingTime: {
    fontSize: 12,

    fontWeight: "700",

    color: "#DC2626",

    fontVariant: [
      "tabular-nums",
    ],
  },

  // ===================================================
  // STATUS
  // ===================================================

  statusContainer: {
    position: "absolute",

    right: 58,

    bottom: -2,

    flexDirection: "row",

    alignItems: "center",

    zIndex: 15,
  },

  statusDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: "#EF4444",

    marginRight: 5,
  },

  statusText: {
    fontSize: 10,

    fontWeight: "600",

    color: "#64748B",
  },

  // ===================================================
  // LOCK
  // ===================================================

  lockIndicator: {
    position: "absolute",

    right: 48,

    bottom: 48,

    alignItems: "center",

    zIndex: 20,
  },

  lockCircle: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: "#EFF6FF",

    borderWidth: 1,

    borderColor: "#BFDBFE",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#2563EB",

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.15,
    shadowRadius: 6,

    elevation: 4,
  },

  lockEmoji: {
    fontSize: 20,
  },

  lockText: {
    marginTop: 5,

    fontSize: 10,

    fontWeight: "600",

    color: "#2563EB",

    backgroundColor: "#EFF6FF",

    paddingHorizontal: 7,

    paddingVertical: 3,

    borderRadius: 8,

    overflow: "hidden",
  },

  // ===================================================
  // CANCEL
  // ===================================================

  cancelIndicator: {
    position: "absolute",

    right: 52,

    bottom: 2,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 8,

    paddingVertical: 6,

    borderRadius: 16,

    backgroundColor: "#F8FAFC",

    borderWidth: 1,

    borderColor: "#E2E8F0",

    zIndex: 20,
  },

  cancelIconCircle: {
    width: 22,
    height: 22,

    borderRadius: 11,

    backgroundColor: "#FEF2F2",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 5,
  },

  cancelIcon: {
    fontSize: 18,

    lineHeight: 20,

    color: "#EF4444",

    fontWeight: "700",
  },

  cancelText: {
    fontSize: 10,

    fontWeight: "600",

    color: "#64748B",

    marginRight: 5,
  },

  cancelArrow: {
    fontSize: 14,

    color: "#EF4444",

    fontWeight: "700",
  },
});