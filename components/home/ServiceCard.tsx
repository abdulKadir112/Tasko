import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
  } from "react-native";
  
  import { Ionicons } from "@expo/vector-icons";
  import { COLORS } from "@/theme";
  
  type Props = {
    title: string;
    category: string;
    price: string;
    rating: string;
  };
  
  export default function ServiceCard({
    title,
    category,
    price,
    rating,
  }: Props) {
    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.image}>
          <Text style={{ fontSize: 38 }}>👨‍🔧</Text>
        </View>
  
        <TouchableOpacity style={styles.favorite}>
          <Ionicons
            name="heart-outline"
            size={22}
            color="#EF4444"
          />
        </TouchableOpacity>
  
        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
  
          <Text style={styles.category}>
            {category}
          </Text>
  
          <View style={styles.locationRow}>
            <Ionicons
              name="location"
              size={15}
              color={COLORS.primary}
            />
  
            <Text style={styles.location}>
              Kushtia
            </Text>
          </View>
  
          <View style={styles.bottom}>
            <Text style={styles.price}>
              {price}
            </Text>
  
            <View style={styles.ratingBox}>
              <Ionicons
                name="star"
                size={15}
                color="#F59E0B"
              />
  
              <Text style={styles.rating}>
                {rating}
              </Text>
            </View>
          </View>
  
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>
              Book Now
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
  
    image: {
      height: 180,
      borderRadius: 18,
      backgroundColor: "#EEF4FF",
      justifyContent: "center",
      alignItems: "center",
    },
  
    favorite: {
      position: "absolute",
      top: 25,
      right: 25,
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#fff",
      justifyContent: "center",
      alignItems: "center",
    },
  
    info: {
      marginTop: 15,
    },
  
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: COLORS.text,
    },
  
    category: {
      marginTop: 5,
      color: COLORS.textSecondary,
      fontSize: 16,
    },
  
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
  
    location: {
      marginLeft: 5,
      color: COLORS.textSecondary,
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
  
    buttonText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
  });