import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";

import HomeHeader from "@/components/home/HomeHeader";
import HomeBanner from "@/components/home/HomeBanner";
import SearchBar from "@/components/home/SearchBar";
import CategoryCard from "@/components/home/CategoryCard";
import ServiceCard from "@/components/home/ServiceCard";
import WorkerCard from "@/components/home/WorkerCard";
import RecentJobCard from "@/components/home/RecentJobCard";

import { COLORS } from "@/theme";

import { getCategories } from "@/services/category.service";
import { getServices } from "@/services/service.service";
import { getWorkers } from "@/services/worker.service";
import { getJobs } from "@/services/job.service";

export default function CustomerHome() {
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadHomeData() {
    try {
      setLoading(true);

      const categoryRes = await getCategories();
      const serviceRes = await getServices();
      const workerRes = await getWorkers();
      const jobRes = await getJobs();

      setCategories(categoryRes.data ?? []);
      setServices(serviceRes.data ?? []);
      setWorkers(workerRes.data ?? []);
      setJobs(jobRes.data ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryPress(categoryId: string) {
    router.push({
      pathname: "/customer/worker-list",
      params: {
        category: categoryId,
      },
    });
  }

  function handlePostJob() {
    router.push("/customer/post-job");
  }

  function handleWorkerPress(id: string) {
    router.push({
      pathname: "/customer/worker-profile",
      params: {
        id,
      },
    });
  }

  function handleJobPress(id: string) {
    router.push({
      pathname: "/customer/job-details",
      params: {
        id,
      },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />
        <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search jobs..."
              onFilterPress={() => {
                console.log("Filter");
              }}
            />
        <HomeBanner />

        {/* Categories */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>Categories</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <View style={styles.categoryGrid}>
            {categories.map((item) => (
              <CategoryCard
                key={item.id}
                id={item.id}
                emoji={item.emoji}
                title={item.title}
                onPress={handleCategoryPress}
              />
            ))}
          </View>
        )}

        {/* Popular Workers */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>Popular Workers</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          workers.slice(0, 5).map((worker) => (
            <WorkerCard
              key={worker.id}
              id={worker.id}
              name={worker.name}
              category={worker.category}
              city={worker.city}
              rating={worker.rating ?? 5}
              experience={worker.experience ?? "2 Years"}
              image={worker.photoURL}
              onPress={handleWorkerPress}
            />
          ))
        )}

        {/* Popular Services */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>Popular Services</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          services.map((item) => (
            <ServiceCard
              key={item.id}
              title={item.title}
              category={item.category}
              price={`Starting ৳${item.price}`}
              rating={String(item.rating)}
            />
          ))
        )}

        {/* Recent Jobs */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>Recent Jobs</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          jobs.slice(0, 5).map((job) => (
            <RecentJobCard
              key={job.id}
              id={job.id}
              title={job.title}
              category={job.category}
              city={job.city}
              budget={job.budget}
              image={job.image}
              onPress={handleJobPress}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
  },

  titleRow: {
    marginTop: 28,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});