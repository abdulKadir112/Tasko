import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/theme";
import { createBid } from "@/services/bid.service";

type Props = {
  visible: boolean;
  jobId: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function BidBottomSheet({
  visible,
  jobId,
  onClose,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!amount) {
      Alert.alert("Error", "Please enter your bid amount.");
      return;
    }

    if (Number(amount) <= 0) {
      Alert.alert("Error", "Invalid bid amount.");
      return;
    }

    if (message.trim().length < 5) {
      Alert.alert(
        "Error",
        "Message must be at least 5 characters."
      );
      return;
    }

    try {
      setLoading(true);

      await createBid({
        jobId,
        amount: Number(amount),
        message,
      });

      Alert.alert(
        "Success",
        "Bid submitted successfully."
      );

      setAmount("");
      setMessage("");

      onClose();

      onSuccess?.();
    } catch (error: any) {
      console.log(error);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to submit bid."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>
              Send Proposal
            </Text>

            <TouchableOpacity
              onPress={onClose}
            >
              <Ionicons
                name="close"
                size={24}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>
            Your Bid Amount
          </Text>

          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Enter Amount"
            style={styles.input}
          />

          <Text style={styles.label}>
            Message
          </Text>

          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            placeholder="Write your proposal..."
            style={styles.textArea}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={20}
                  color="#fff"
                />

                <Text style={styles.buttonText}>
                  Submit Bid
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,.35)",
  },

  backdrop: {
    flex: 1,
  },

  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 35,
    paddingTop: 15,
  },

  handle: {
    width: 60,
    height: 5,
    borderRadius: 10,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 15,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: COLORS.text,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 18,
    fontSize: 16,
  },

  textArea: {
    height: 130,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingTop: 15,
    textAlignVertical: "top",
    fontSize: 16,
  },

  button: {
    marginTop: 24,
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});