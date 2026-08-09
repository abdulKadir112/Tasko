import React from "react";

import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/theme";

type Props = {
  visible: boolean;

  onClose: () => void;

  onCamera: () => void;

  onGallery: () => void;

  onDocument: () => void;

  onLocation: () => void;

  onContact: () => void;
};

export default function AttachmentSheet({
  visible,
  onClose,
  onCamera,
  onGallery,
  onDocument,
  onLocation,
  onContact,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      />

      <View style={styles.container}>
        <Text style={styles.title}>
          Share
        </Text>

        <View style={styles.grid}>
          <Item
            icon="camera"
            color="#E53935"
            title="Camera"
            onPress={onCamera}
          />

          <Item
            icon="image"
            color="#43A047"
            title="Gallery"
            onPress={onGallery}
          />

          <Item
            icon="document"
            color="#3949AB"
            title="Document"
            onPress={onDocument}
          />

          <Item
            icon="location"
            color="#FB8C00"
            title="Location"
            onPress={onLocation}
          />

          <Item
            icon="person"
            color="#8E24AA"
            title="Contact"
            onPress={onContact}
          />
        </View>
      </View>
    </Modal>
  );
}

function Item({
  icon,
  color,
  title,
  onPress,
}: any) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={onPress}
    >
      <View
        style={[
          styles.circle,
          {
            backgroundColor: color,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={26}
          color="#fff"
        />
      </View>

      <Text style={styles.label}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000055",
  },

  container: {
    backgroundColor: "#fff",

    borderTopLeftRadius: 28,

    borderTopRightRadius: 28,

    padding: 24,
  },

  title: {
    fontSize: 18,

    fontWeight: "700",

    marginBottom: 25,
  },

  grid: {
    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "space-between",
  },

  item: {
    width: "30%",

    alignItems: "center",

    marginBottom: 24,
  },

  circle: {
    width: 65,

    height: 65,

    borderRadius: 35,

    justifyContent: "center",

    alignItems: "center",
  },

  label: {
    marginTop: 8,

    fontSize: 13,
  },
});