import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
};

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
  onFilterPress,
}: Props) {
  const inputRef = useRef<TextInput>(null);

  const [isListening] = useState(false);

  function clearSearch() {
    onChangeText("");
    inputRef.current?.focus();
  }

  async function startVoiceSearch() {
    /**
     * Step 57.2.3.2
     * expo-speech-recognition
     * implementation
     */
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons
          name="search"
          size={22}
          color="#6B7280"
        />

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          style={styles.input}
          returnKeyType="search"
        />

        {value.length > 0 && (
          <TouchableOpacity
            onPress={clearSearch}
            style={styles.iconButton}
          >
            <Ionicons
              name="close-circle"
              size={22}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.iconButton}
          onPress={startVoiceSearch}
        >
          <Ionicons
            name={
              isListening
                ? "mic"
                : "mic-outline"
            }
            size={22}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.filterButton}
        onPress={onFilterPress}
      >
        <Ionicons
          name="options"
          size={22}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  searchBox: {
    flex: 1,
    height: 58,
    backgroundColor: "#fff",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 5,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text,
  },

  iconButton: {
    marginLeft: 8,
  },

  filterButton: {
    width: 58,
    height: 58,
    borderRadius: 18,
    marginLeft: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,

    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 5,
  },
});