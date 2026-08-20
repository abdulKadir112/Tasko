import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createJob } from "@/services/job.service";
import { uploadImage } from "@/services/upload.service";
import { getCategories } from "@/services/category.service";

import { COLORS } from "@/theme";

type Urgency = "normal" | "urgent";

function extractImageUrl(result: any): string {
  if (!result) return "";

  if (typeof result === "string") {
    return result.trim();
  }

  if (typeof result === "object") {
    const url =
      result.url ??
      result.secure_url ??
      result.imageUrl ??
      result.data?.url ??
      result.data?.secure_url ??
      "";

    return typeof url === "string" ? url.trim() : "";
  }

  return "";
}

export default function PostJob() {
  const { workerId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const worker = Array.isArray(workerId) ? workerId[0] : workerId;

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [image, setImage] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await getCategories();
      setCategories(res.data ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function pickImage() {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission", "Please allow gallery permission.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }

  function removeImage() {
    setImage("");
  }

  async function handlePostJob() {
    if (!selectedCategory) {
      Alert.alert("Required", "Please select a category");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Required", "Please enter job title");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Required", "Please enter job description");
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
      setLoading(true);

      let imageUrl = "";

      if (image) {
        const uploaded = await uploadImage(image);
        imageUrl = extractImageUrl(uploaded);
      }

      await createJob({
        workerId: worker || undefined,
        category: selectedCategory,
        title: title.trim(),
        description: description.trim(),
        budget: Number(budget),
        address: address.trim(),
        city: city.trim(),
        phone: phone.trim() || undefined,
        urgency,
        image: imageUrl || undefined,
      });

      Alert.alert("Success", "Job posted successfully");
      router.replace("/customer/(tabs)/jobs");
    } catch (error: any) {
      console.log("POST JOB ERROR =", error.response?.data);
      console.log(error);

      Alert.alert(
        "Error",
        error.response?.data?.message ||
          JSON.stringify(error.response?.data) ||
          "Failed to post job"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Post a Job</Text>
          <Text style={styles.headerSubtitle}>
            {worker
              ? "Direct job for selected worker"
              : "Find the right professional"}
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
        {/* Worker badge */}
        {!!worker && (
          <View style={styles.workerBadge}>
            <Ionicons name="person" size={16} color={COLORS.primary} />
            <Text style={styles.workerBadgeText}>
              Hiring specific worker
            </Text>
          </View>
        )}

        {/* Category */}
        <Text style={styles.label}>Category *</Text>
        {loadingCategories ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 8 }} />
        ) : (
          <View style={styles.categoryContainer}>
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                  >
                    {cat.emoji ? `${cat.emoji} ` : ""}
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Title */}
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
          />
        </View>

        {/* Description */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.plainInput, styles.textArea]}
          placeholder="Describe the problem, tools needed, timing preference..."
          placeholderTextColor="#94A3B8"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Budget */}
        <Text style={styles.label}>Budget (৳) *</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.currency}>৳</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 800"
            placeholderTextColor="#94A3B8"
            value={budget}
            onChangeText={setBudget}
          />
        </View>

        {/* Urgency */}
        <Text style={styles.label}>Urgency</Text>
        <View style={styles.urgencyRow}>
          <TouchableOpacity
            style={[
              styles.urgencyChip,
              urgency === "normal" && styles.urgencyChipActive,
            ]}
            onPress={() => setUrgency("normal")}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={urgency === "normal" ? "#fff" : "#64748B"}
            />
            <Text
              style={[
                styles.urgencyText,
                urgency === "normal" && styles.urgencyTextActive,
              ]}
            >
              Normal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.urgencyChip,
              urgency === "urgent" && styles.urgencyChipUrgent,
            ]}
            onPress={() => setUrgency("urgent")}
          >
            <Ionicons
              name="flash-outline"
              size={16}
              color={urgency === "urgent" ? "#fff" : "#64748B"}
            />
            <Text
              style={[
                styles.urgencyText,
                urgency === "urgent" && styles.urgencyTextActive,
              ]}
            >
              Urgent
            </Text>
          </TouchableOpacity>
        </View>

        {/* City */}
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
            placeholder="e.g. Kushtia, Dhaka"
            placeholderTextColor="#94A3B8"
            value={city}
            onChangeText={setCity}
          />
        </View>

        {/* Address */}
        <Text style={styles.label}>Full Address *</Text>
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
          />
        </View>

        {/* Phone */}
        <Text style={styles.label}>Contact Phone (optional)</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="call-outline"
            size={18}
            color="#94A3B8"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="01XXXXXXXXX"
            placeholderTextColor="#94A3B8"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Image */}
        <Text style={styles.label}>Job Image (optional)</Text>
        {image ? (
          <View style={styles.imagePreviewWrap}>
            <Image source={{ uri: image }} style={styles.preview} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={removeImage}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.changeImageBtn}
              onPress={pickImage}
            >
              <Ionicons name="camera-outline" size={16} color="#fff" />
              <Text style={styles.changeImageText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={pickImage}
            activeOpacity={0.85}
          >
            <View style={styles.imagePickerIcon}>
              <Ionicons name="image-outline" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.pickTitle}>Add Photo</Text>
            <Text style={styles.pickSub}>
              Help workers understand the job better
            </Text>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={COLORS.primary}
          />
          <Text style={styles.tipsText}>
            Clear title, fair budget and good photos help you get better
            applicants faster.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          disabled={loading}
          onPress={handlePostJob}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Post Job</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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

  workerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },

  workerBadgeText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },

  label: {
    marginTop: 18,
    marginBottom: 8,
    fontWeight: "800",
    fontSize: 14,
    color: "#334155",
  },

  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },

  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  categoryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },

  categoryTextActive: {
    color: "#fff",
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

  urgencyRow: {
    flexDirection: "row",
    gap: 10,
  },

  urgencyChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 12,
  },

  urgencyChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  urgencyChipUrgent: {
    backgroundColor: "#EF4444",
    borderColor: "#EF4444",
  },

  urgencyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },

  urgencyTextActive: {
    color: "#fff",
  },

  imagePicker: {
    minHeight: 150,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  imagePickerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  pickTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  pickSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },

  imagePreviewWrap: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#E2E8F0",
  },

  preview: {
    width: "100%",
    height: "100%",
  },

  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },

  changeImageBtn: {
    position: "absolute",
    left: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,23,42,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  changeImageText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  tipsCard: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
  },

  tipsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#334155",
    fontWeight: "600",
  },

  button: {
    marginTop: 24,
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