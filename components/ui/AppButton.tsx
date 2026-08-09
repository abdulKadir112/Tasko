import { Pressable, Text, StyleSheet } from "react-native";
import { COLORS } from "@/theme";

type Props = {
  title: string;
  onPress: () => void;
};

export default function AppButton({ title, onPress }: Props) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
});