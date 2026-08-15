import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import api from "@/config/api";
import ServiceCard from "@/components/home/ServiceCard";
import { COLORS } from "@/theme";

export default function CategoryServices() {
  const { category } = useLocalSearchParams();

  const categoryId = Array.isArray(category)
    ? category[0]
    : category;

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Selected Category:", categoryId);

    if (categoryId) {
      loadServices();
    }
  }, [categoryId]);

  async function loadServices() {
    try {
      setLoading(true);

      console.log(
        "API URL:",
        `/services?category=${categoryId}`
      );

      const res = await api.get(
        `/services?category=${categoryId}`
      );

      console.log("API Response:", res.data);

      setServices(res.data.data || []);
    } catch (error: any) {
      console.log(
        "Category Service Error:",
        error?.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={26}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          {categoryId
            ? categoryId.toUpperCase()
            : "CATEGORY"}
        </Text>

        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
        </View>
      ) : services.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>
            No Services Found
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.count}>
            Total Services : {services.length}
          </Text>

          {services.map((item) => (
            <ServiceCard
              key={item.id}
              title={item.title}
              category={item.category}
              price={`Starting ৳${item.price}`}
              rating={String(item.rating)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    height: 70,
    backgroundColor: "#fff",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 20,

    elevation: 4,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  empty: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },

  list: {
    padding: 15,
    paddingBottom: 30,
  },

  count: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 15,
    color: COLORS.text,
  },
});