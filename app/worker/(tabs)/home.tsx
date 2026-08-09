import { useEffect, useState } from "react";
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { COLORS } from "@/theme";
import HomeHeader from "@/components/home/HomeHeader";
import SearchBar from "@/components/home/SearchBar";
import RecentJobCard from "@/components/home/RecentJobCard";
import { getWorkerFeedJobs } from "@/services/job.service";

export default function WorkerHome() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredJobs(jobs);
      return;
    }

    const keyword = search.toLowerCase();

    setFilteredJobs(
      jobs.filter((item: any) => {
        return (
          item?.title?.toLowerCase()?.includes(keyword) ||
          item?.category?.toLowerCase()?.includes(keyword) ||
          item?.city?.toLowerCase()?.includes(keyword)
        );
      })
    );
  }, [search, jobs]);

  async function loadJobs() {
    try {
      const res = await getWorkerFeedJobs();
      const jobsData = res?.data ?? [];

      setJobs(jobsData);
      setFilteredJobs(jobsData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadJobs();
  }

  function openJob(id: string) {
    router.push({
      pathname: "/worker/job-details",
      params: {
        id: String(id),
      },
    });
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            <HomeHeader />
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search jobs..."
              onFilterPress={() => {
                console.log("Filter");
              }}
            />
            <Text style={styles.heading}>Recommended Jobs</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Matching Jobs</Text>
            <Text style={styles.emptySub}>
              No jobs found based on your skills.
            </Text>
          </View>
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        renderItem={({ item }) => (
          <RecentJobCard
            id={item.id}
            title={item.title}
            category={item.category}
            city={item.city}
            budget={item.budget}
            image={item.image}
            onPress={openJob}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginVertical: 20,
  },
  emptyBox: {
    marginTop: 100,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptySub: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: "center",
  },
});