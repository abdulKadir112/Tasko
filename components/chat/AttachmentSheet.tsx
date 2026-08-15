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

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type Props = {
  visible: boolean;

  onClose: () => void;

  onCamera: () => void;
  onGallery: () => void;
  onDocument: () => void;
  onLocation: () => void;
  onContact: () => void;
};

type ItemProps = {
  icon: IoniconName;
  color: string;
  title: string;
  onPress: () => void;
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
  const handleAction = (action: () => void) => {
    // আগে sheet বন্ধ হবে
    onClose();

    // তারপর action execute হবে
    setTimeout(() => {
      action();
    }, 150);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalWrapper}>
        {/* Background overlay */}
        <Pressable
          style={styles.overlay}
          onPress={onClose}
        />

        {/* Bottom Sheet */}
        <View style={styles.container}>
          {/* Drag Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Share
            </Text>

            <TouchableOpacity
              style={styles.closeButton}
              activeOpacity={0.7}
              onPress={onClose}
            >
              <Ionicons
                name="close"
                size={22}
                color={COLORS.text}
              />
            </TouchableOpacity>
          </View>

          {/* Attachment Items */}
          <View style={styles.grid}>
            <AttachmentItem
              icon="camera"
              color="#E53935"
              title="Camera"
              onPress={() =>
                handleAction(onCamera)
              }
            />

            <AttachmentItem
              icon="images"
              color="#43A047"
              title="Gallery"
              onPress={() =>
                handleAction(onGallery)
              }
            />

            <AttachmentItem
              icon="document-text"
              color="#3949AB"
              title="Document"
              onPress={() =>
                handleAction(onDocument)
              }
            />

            <AttachmentItem
              icon="location"
              color="#FB8C00"
              title="Location"
              onPress={() =>
                handleAction(onLocation)
              }
            />

            <AttachmentItem
              icon="person"
              color="#8E24AA"
              title="Contact"
              onPress={() =>
                handleAction(onContact)
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* =========================================================
   ATTACHMENT ITEM
========================================================= */

function AttachmentItem({
  icon,
  color,
  title,
  onPress,
}: ItemProps) {
  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.75}
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
          size={27}
          color="#fff"
        />
      </View>

      <Text
        style={styles.label}
        numberOfLines={1}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  container: {
    backgroundColor: COLORS.white ?? "#FFFFFF",

    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,

    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,

    minHeight: 220,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,

    elevation: 15,
  },

  /* Drag handle */

  handle: {
    alignSelf: "center",

    width: 42,
    height: 5,

    borderRadius: 3,

    backgroundColor: "#D1D5DB",

    marginBottom: 15,
  },

  /* Header */

  header: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 24,
  },

  title: {
    fontSize: 20,

    fontWeight: "700",

    color: COLORS.text,
  },

  closeButton: {
    width: 36,
    height: 36,

    borderRadius: 18,

    backgroundColor: "#F1F5F9",

    justifyContent: "center",
    alignItems: "center",
  },

  /* Grid */

  grid: {
    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "flex-start",

    columnGap: 18,

    rowGap: 22,
  },

  item: {
    width: 72,

    alignItems: "center",
  },

  circle: {
    width: 62,
    height: 62,

    borderRadius: 31,

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,

    elevation: 4,
  },

  label: {
    marginTop: 8,

    fontSize: 13,

    fontWeight: "500",

    color: COLORS.text,

    textAlign: "center",
  },
});