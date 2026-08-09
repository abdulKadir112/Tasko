import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import WorkerCard from "@/components/worker/WorkerCard";
import { getWorkersByCategory } from "@/services/worker.service";
import { COLORS } from "@/theme";

export default function WorkerList() {
  const { category } = useLocalSearchParams();

  const categoryId = Array.isArray(category)
    ? category[0]
    : category;

  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      loadWorkers();
    }
  }, [categoryId]);

  async function loadWorkers() {
    try {
      setLoading(true);

      const res = await getWorkersByCategory(
        String(categoryId)
      );

      setWorkers(res.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>

        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={26}
            color={COLORS.text}
          />
        </TouchableOpacity>

        <Text style={styles.title}>
          {String(categoryId).toUpperCase()}
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
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: 15,
          }}
        >
          <Text style={styles.count}>
            Total Workers : {workers.length}
          </Text>

          {workers.map((worker) => (
            <WorkerCard
              key={worker.id}
              name={worker.name}
              city={worker.city}
              rating={worker.rating}
              experience={worker.experience}
              price={worker.price}
              completedJobs={worker.completedJobs}
              onPress={() =>
                router.push({
                  pathname: "/customer/worker-profile",
                  params: {
                    id: worker.id,
                  },
                })
              }
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
    justifyContent: "space-between",
    alignItems: "center",
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

  count: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 20,
    color: COLORS.text,
  },
});