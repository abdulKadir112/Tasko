import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/theme";

type Props = {
  title: string;
  category: string;
  price: string;
  rating?: string;
  city?: string;
  image?: string | null;
  isEmergency?: boolean;
  distanceText?: string;
  workerName?: string;
  onPress?: () => void;
  onBook?: () => void;
};

export default function ServiceCard({
  title,
  category,
  price,
  rating = "5.0",
  city,
  image,
  isEmergency = false,
  distanceText,
  workerName,
  onPress,
  onBook,
}: Props) {
  const hasImage = typeof image === "string" && image.trim().length > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {/* Image */}
      <View style={styles.imageWrap}>
        {hasImage ? (
          <Image source={{ uri: image as string }} style={styles.image} />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.fallbackEmoji}>
              {isEmergency ? "🚨" : "👨‍🔧"}
            </Text>
          </View>
        )}

        {isEmergency && (
          <View style={styles.emergencyBadge}>
            <Ionicons name="flash" size={12} color="#fff" />
            <Text style={styles.emergencyText}>Emergency</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.category} numberOfLines={1}>
          {category}
          {workerName ? ` • ${workerName}` : ""}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={15} color={COLORS.primary} />
          <Text style={styles.location} numberOfLines={1}>
            {distanceText || city || "Location N/A"}
          </Text>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.price}>{price}</Text>

          <View style={styles.ratingBox}>
            <Ionicons name="star" size={15} color="#F59E0B" />
            <Text style={styles.rating}>{rating}</Text>
          </View>
        </View>

        {/* Book / Call Button */}
        <TouchableOpacity
          style={[styles.button, isEmergency && styles.emergencyBtn]}
          onPress={onBook || onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {isEmergency ? "Call Now" : "Book Now"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  imageWrap: {
    position: "relative",
  },

  image: {
    height: 180,
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#EEF4FF",
  },

  imageFallback: {
    height: 180,
    borderRadius: 18,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
  },

  fallbackEmoji: {
    fontSize: 38,
  },

  emergencyBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#EF4444",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  emergencyText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 11,
  },

  info: {
    marginTop: 15,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  category: {
    marginTop: 5,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  location: {
    marginLeft: 5,
    color: COLORS.textSecondary,
    flex: 1,
  },

  bottom: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  price: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 18,
  },

  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  rating: {
    marginLeft: 4,
    color: "#F59E0B",
    fontWeight: "700",
  },

  button: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },

  emergencyBtn: {
    backgroundColor: "#EF4444",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});