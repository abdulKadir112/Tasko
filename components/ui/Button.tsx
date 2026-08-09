import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { COLORS } from "@/theme";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
};

export default function Button({
  title,
  onPress,
  loading = false,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
});