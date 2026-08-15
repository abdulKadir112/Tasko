import React, { useEffect } from "react";

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

type Props = {
  recording: boolean;
  recordingTime: number;
  lockedRecording: boolean;
};

export default function VoiceRecorder({
  recording,
  recordingTime,
}: Props) {
  const bar1 = useSharedValue(8);
  const bar2 = useSharedValue(18);
  const bar3 = useSharedValue(12);
  const bar4 = useSharedValue(24);
  const bar5 = useSharedValue(10);
  const bar6 = useSharedValue(15);
  const bar7 = useSharedValue(20);

  useEffect(() => {
    if (!recording) {
      return;
    }

    const animate = (
      value: any,
      max: number
    ) => {
      value.value = withRepeat(
        withTiming(max, {
          duration: 250,
          easing: Easing.linear,
        }),
        -1,
        true
      );
    };

    animate(bar1, 20);
    animate(bar2, 30);
    animate(bar3, 18);
    animate(bar4, 34);
    animate(bar5, 22);
    animate(bar6, 28);
    animate(bar7, 24);
  }, [recording]);

  const barStyle1 = useAnimatedStyle(() => ({
    height: bar1.value,
  }));

  const barStyle2 = useAnimatedStyle(() => ({
    height: bar2.value,
  }));

  const barStyle3 = useAnimatedStyle(() => ({
    height: bar3.value,
  }));

  const barStyle4 = useAnimatedStyle(() => ({
    height: bar4.value,
  }));

  const barStyle5 = useAnimatedStyle(() => ({
    height: bar5.value,
  }));

  const barStyle6 = useAnimatedStyle(() => ({
    height: bar6.value,
  }));

  const barStyle7 = useAnimatedStyle(() => ({
    height: bar7.value,
  }));

  if (!recording) {
    return null;
  }

  const minute = Math.floor(
    recordingTime / 60
  )
    .toString()
    .padStart(2, "0");

  const second = (
    recordingTime % 60
  )
    .toString()
    .padStart(2, "0");

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.dot} />

        <Text style={styles.recording}>
          Recording...
        </Text>

        <View style={styles.waveContainer}>
          <Animated.View
            style={[
              styles.waveBar,
              barStyle1,
            ]}
          />

          <Animated.View
            style={[
              styles.waveBar,
              barStyle2,
            ]}
          />

          <Animated.View
            style={[
              styles.waveBar,
              barStyle3,
            ]}
          />

          <Animated.View
            style={[
              styles.waveBar,
              barStyle4,
            ]}
          />

          <Animated.View
            style={[
              styles.waveBar,
              barStyle5,
            ]}
          />

          <Animated.View
            style={[
              styles.waveBar,
              barStyle6,
            ]}
          />

          <Animated.View
            style={[
              styles.waveBar,
              barStyle7,
            ]}
          />
        </View>
      </View>

      <Text style={styles.timer}>
        {minute}:{second}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 58,

    borderRadius: 30,

    backgroundColor: "#111827",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 18,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  dot: {
    width: 12,
    height: 12,

    borderRadius: 6,

    backgroundColor: "#EF4444",

    marginRight: 10,
  },

  recording: {
    color: "#fff",

    fontSize: 16,

    fontWeight: "600",
  },

  timer: {
    color: "#fff",

    fontSize: 18,

    fontWeight: "700",

    marginLeft: 10,
  },

  waveContainer: {
    flexDirection: "row",

    alignItems: "flex-end",

    marginLeft: 15,
  },

  waveBar: {
    width: 4,

    marginHorizontal: 2,

    borderRadius: 3,

    backgroundColor: "#22C55E",
  },
});