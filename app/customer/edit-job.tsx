import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getJobById, updateJob } from "@/services/job.service";
import { COLORS } from "@/theme";

export default function EditJobScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const jobId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  async function loadJob() {
    try {
      const res = await getJobById(String(jobId));
      const job = res.data;

      setTitle(job?.title || "");
      setCategory(job?.category || "");
      setDescription(job?.description || "");
      setBudget(job?.budget != null ? String(job.budget) : "");
      setCity(job?.city || "");
      setAddress(job?.address || "");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to load job");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter job title");
      return;
    }

    if (!category.trim()) {
      Alert.alert("Required", "Please enter category");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Required", "Please enter description");
      return;
    }

    if (!budget.trim() || Number(budget) <= 0) {
      Alert.alert("Required", "Please enter a valid budget");
      return;
    }

    if (!city.trim()) {
      Alert.alert("Required", "Please enter city");
      return;
    }

    if (!address.trim()) {
      Alert.alert("Required", "Please enter address");
      return;
    }

    try {
      setSaving(true);

      await updateJob(String(jobId), {
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        budget: Number(budget),
        city: city.trim(),
        address: address.trim(),
      });

      Alert.alert("Success", "Job updated successfully");
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to update job");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading job...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Edit Job</Text>
          <Text style={styles.headerSubtitle}>
            Update job details and save changes
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.tipsCard}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={COLORS.primary}
          />
          <Text style={styles.tipsText}>
            Clear title and fair budget help you get better applicants.
          </Text>
        </View>

        <Text style={styles.label}>Job Title *</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="briefcase-outline"
            size={18}
            color="#94A3B8"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="e.g. AC Repair Needed"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            editable={!saving}
          />
        </View>

        <Text style={styles.label}>Category *</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="grid-outline"
            size={18}
            color="#94A3B8"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="e.g. Plumbing"
            placeholderTextColor="#94A3B8"
            value={category}
            onChangeText={setCategory}
            editable={!saving}
          />
        </View>

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.plainInput, styles.textArea]}
          placeholder="Describe the job clearly..."
          placeholderTextColor="#94A3B8"
          multiline
          value={description}
          onChangeText={setDescription}
          editable={!saving}
        />

        <Text style={styles.label}>Budget (৳) *</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.currency}>৳</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 800"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
            editable={!saving}
          />
        </View>

        <Text style={styles.label}>City *</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="location-outline"
            size={18}
            color="#94A3B8"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="e.g. Dhaka"
            placeholderTextColor="#94A3B8"
            value={city}
            onChangeText={setCity}
            editable={!saving}
          />
        </View>

        <Text style={styles.label}>Address *</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="home-outline"
            size={18}
            color="#94A3B8"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="House, road, area"
            placeholderTextColor="#94A3B8"
            value={address}
            onChangeText={setAddress}
            editable={!saving}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleUpdate}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Update Job</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    gap: 10,
  },

  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
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

  headerTextBox: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  content: {
    padding: 20,
  },

  tipsCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },

  tipsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#334155",
    fontWeight: "600",
  },

  label: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "800",
    fontSize: 14,
    color: "#334155",
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    minHeight: 52,
  },

  inputIcon: {
    marginRight: 8,
  },

  currency: {
    marginRight: 8,
    fontSize: 16,
    fontWeight: "800",
    color: "#16A34A",
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    paddingVertical: 12,
  },

  plainInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0F172A",
  },

  textArea: {
    height: 120,
    textAlignVertical: "top",
  },

  button: {
    marginTop: 28,
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});