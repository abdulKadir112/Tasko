import { TextInput, StyleSheet } from "react-native";
import { COLORS } from "@/theme";

type Props = {
  placeholder: string;
  secureTextEntry?: boolean;
};

export default function AppInput({
  placeholder,
  secureTextEntry,
}: Props) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={COLORS.textSecondary}
      secureTextEntry={secureTextEntry}
      style={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    height: 56,
    marginBottom: 16,
  },
});