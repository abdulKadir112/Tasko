import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Switch,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getMyServices,
  deleteService,
  updateService,
} from "@/services/service.service";
import { COLORS } from "@/theme";

export default function MyServicesScreen() {
  const insets = useSafeAreaInsets();

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    try {
      setLoading(true);
      const res = await getMyServices();
      setServices(res.data || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(item: any, value: boolean) {
    try {
      await updateService(item.id, { isActive: value });
      setServices((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, isActive: value } : s))
      );
    } catch (e) {
      Alert.alert("Error", "Failed to update status");
    }
  }

  function confirmDelete(id: string) {
    Alert.alert("Delete Service", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteService(id);
            setServices((prev) => prev.filter((s) => s.id !== id));
          } catch (e) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>My Services</Text>
          <Text style={styles.sub}>{services.length} published</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/worker/(tabs)/post")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 40 + insets.bottom,
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No services yet</Text>
              <Text style={styles.emptySub}>
                Publish your first gig from the Post tab
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/worker/(tabs)/post")}
              >
                <Text style={styles.emptyBtnText}>Publish Service</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {item.category} • From ৳{item.price}
                  </Text>
                </View>

                {item.isEmergency && (
                  <View style={styles.emergencyBadge}>
                    <Text style={styles.emergencyText}>Emergency</Text>
                  </View>
                )}
              </View>

              <View style={styles.footer}>
                <View style={styles.activeRow}>
                  <Text style={styles.activeLabel}>Active</Text>
                  <Switch
                    value={item.isActive !== false}
                    onValueChange={(v) => toggleActive(item, v)}
                    trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
                    thumbColor={item.isActive !== false ? COLORS.primary : "#f4f4f5"}
                  />
                </View>

                <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  sub: { marginTop: 2, fontSize: 12, color: "#64748B", fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { marginTop: 80, alignItems: "center", paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  emptySub: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: { color: "#fff", fontWeight: "800" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  cardMeta: { marginTop: 4, color: "#64748B", fontWeight: "600", fontSize: 13 },
  emergencyBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emergencyText: { color: "#DC2626", fontWeight: "800", fontSize: 11 },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  activeLabel: { fontWeight: "700", color: "#475569" },
});