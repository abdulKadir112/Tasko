import { useLocalSearchParams, router } from "expo-router";

import {
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";

import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from "react-native-reanimated";

import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

export default function ImageViewerScreen() {
  const { uri } = useLocalSearchParams<{
    uri: string;
  }>();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const backgroundOpacity = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      let nextScale = savedScale.value * event.scale;

      if (nextScale < 1) {
        nextScale = 1;
      }

      if (nextScale > 4) {
        nextScale = 4;
      }

      scale.value = nextScale;
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        scale.value = withSpring(1);

        translateX.value = withSpring(0);
        translateY.value = withSpring(0);

        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;

        return;
      }

      if (scale.value > 4) {
        scale.value = withSpring(4);
        savedScale.value = 4;
        return;
      }

      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        const maxX =
          ((scale.value - 1) * SCREEN_WIDTH) / 2;

        const maxY =
          ((scale.value - 1) * SCREEN_HEIGHT) / 2;

        translateX.value = clamp(
          savedTranslateX.value + event.translationX,
          -maxX,
          maxX
        );

        translateY.value = clamp(
          savedTranslateY.value + event.translationY,
          -maxY,
          maxY
        );
      } else {
        translateY.value = event.translationY;

        backgroundOpacity.value =
          1 - Math.abs(event.translationY) / 300;

        if (backgroundOpacity.value < 0.3) {
          backgroundOpacity.value = 0.3;
        }
      }
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        if (Math.abs(translateY.value) > 180) {
          router.back();
          return;
        }

        translateY.value = withTiming(0);
        backgroundOpacity.value = withTiming(1);

        return;
      }

      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);

        translateX.value = withTiming(0);
        translateY.value = withTiming(0);

        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  const gesture = Gesture.Simultaneous(
    pinch,
    pan,
    doubleTap
  );

  const imageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: translateX.value,
        },
        {
          translateY: translateY.value,
        },
        {
          scale: scale.value,
        },
      ],
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: backgroundOpacity.value,
    };
  });

  return (
    <>
      <TouchableOpacity
        style={styles.close}
        onPress={() => router.back()}
      >
        <Ionicons
          name="close"
          size={34}
          color="#fff"
        />
      </TouchableOpacity>

      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[styles.container, backgroundStyle]}
        >
          <Animated.Image
            source={{
              uri: decodeURIComponent(String(uri)),
            }}
            style={[styles.image, imageStyle]}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  close: {
    position: "absolute",
    top: 55,
    left: 20,
    zIndex: 999,
  },
});