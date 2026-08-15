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

/*
 * ⭐ যেকোনো ছোট নড়াচড়া (accidental touch/tap) যেন
 * ভুলবশত gesture activate না করে দেয়, তার জন্য একটা
 * ন্যূনতম movement threshold (pixel)।
 */
const ACTIVATION_THRESHOLD = 8;

/*
 * ⭐ কতদূর ডানে সরালে reply trigger হবে
 */
const REPLY_TRIGGER_DISTANCE = 90;

export default function SwipeableMessage({
  children,
  onReply,
}: Props) {
  const translateX = useSharedValue(0);

  /*
   * ⭐⭐⭐ CRITICAL FIX ⭐⭐⭐
   *
   * touch শুরু হওয়ার position মনে রাখার জন্য shared value।
   * আগে এইটা ছিল না, ফলে onTouchesMove-এ absolute screen
   * position (touch.absoluteX/Y) দিয়ে horizontal vs
   * vertical swipe চেক করা হচ্ছিল — যেটা ভুল। এখন প্রকৃত
   * movement (delta) হিসাব করে চেক করা হচ্ছে।
   */
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((event) => {
      const touch = event.changedTouches[0];

      if (!touch) return;

      startX.value = touch.absoluteX;
      startY.value = touch.absoluteY;
    })
    .onTouchesMove((event, manager) => {
      const touch = event.changedTouches[0];

      if (!touch) return;

      /*
       * ⭐ FIX: absolute position না, বরং শুরুর position
       * থেকে কতটুকু সরেছে (delta) সেটা হিসাব করা হচ্ছে।
       */
      const deltaX =
        touch.absoluteX - startX.value;

      const deltaY =
        touch.absoluteY - startY.value;

      /*
       * খুব ছোট movement হলে এখনই সিদ্ধান্ত নেব না,
       * আরেকটু নড়ার জন্য অপেক্ষা করব — accidental
       * activation এড়ানোর জন্য।
       */
      if (
        Math.abs(deltaX) < ACTIVATION_THRESHOLD &&
        Math.abs(deltaY) < ACTIVATION_THRESHOLD
      ) {
        return;
      }

      const isHorizontal =
        Math.abs(deltaX) > Math.abs(deltaY);

      if (isHorizontal) {
        if (deltaX > 0) {
          /*
           * ডানদিকে horizontal swipe -> reply gesture
           * activate করো
           */
          manager.activate();
        } else {
          /*
           * বামদিকে swipe -> reply-এর জন্য না, fail
           * করে দাও
           */
          manager.fail();
        }
      } else {
        /*
         * ⭐ IMPORTANT
         *
         * Vertical movement বেশি হলে gesture-কে fail
         * করে দিতে হবে, নাহলে এটা chat list-এর normal
         * vertical scroll-কে block করে ফেলতে পারে।
         */
        manager.fail();
      }
    })
    .onUpdate((e) => {
      if (e.translationX > 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd(() => {
      if (translateX.value > REPLY_TRIGGER_DISTANCE) {
        runOnJS(onReply)();
      }

      translateX.value = withSpring(0);
    })
    .onFinalize(() => {
      /*
       * gesture যেভাবেই শেষ হোক (success/fail/cancel),
       * bubble-কে সবসময় স্বাভাবিক জায়গায় ফিরিয়ে আনো।
       */
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