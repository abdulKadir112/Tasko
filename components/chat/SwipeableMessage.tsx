import React from "react";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type Props = {
  children: React.ReactNode;
  onReply: () => void;
};

export default function SwipeableMessage({
  children,
  onReply,
}: Props) {
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((event, manager) => {
      const touch = event.changedTouches[0];

      if (!touch) return;

      // horizontal swipe হলে activate হবে
      if (
        Math.abs(touch.absoluteX) >
        Math.abs(touch.absoluteY)
      ) {
        manager.activate();
      }
    })
    .onUpdate((e) => {
      if (e.translationX > 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd(() => {
      if (translateX.value > 90) {
        runOnJS(onReply)();
      }

      translateX.value = withSpring(0);
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: translateX.value,
      },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}