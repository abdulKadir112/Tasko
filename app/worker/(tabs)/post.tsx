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
  Image,
  Switch,
  StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { createService } from "@/services/service.service";
import { uploadImage } from "@/services/upload.service";
import { getCategories } from "@/services/category.service";
import { updateMyLocation } from "@/services/location.service";
import { COLORS } from "@/theme";

type PackageDraft = {
  id: "basic" | "standard" | "premium";
  title: string;
  price: string;
  description: string;
  deliveryHours: string;
};

function extractImageUrl(result: any): string {
  if (!result) return "";
  if (typeof result === "string") return result.trim();

  const nested =
    result.url ??
    result.secure_url ??
    result.imageUrl ??
    result.data?.url ??
    result.data?.secure_url ??
    result.data?.imageUrl ??
    "";

  return typeof nested === "string" ? nested.trim() : "";
}

export default function WorkerPostServiceScreen() {
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [image, setImage] = useState("");

  const [packages, setPackages] = useState<PackageDraft[]>([
    {
      id: "basic",
      title: "Basic",
      price: "",
      description: "Essential service",
      deliveryHours: "24",
    },
    {
      id: "standard",
      title: "Standard",
      price: "",
      description: "Faster + extra support",
      deliveryHours: "12",
    },
    {
      id: "premium",
      title: "Premium",
      price: "",
      description: "Priority emergency support",
      deliveryHours: "2",
    },
  ]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await getCategories();
      setCategories(res.data ?? res ?? []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingCategories(false);
    }
  }

  function updatePackage(
    id: PackageDraft["id"],
    field: keyof PackageDraft,
    value: string
  ) {
    setPackages((prev) =>
      prev.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg))
    );
  }

  async function pickImage() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission", "Photo library permission is required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async function handleShareLocation() {
    try {
      setUpdatingLocation(true);
      const coords = await updateMyLocation();
      Alert.alert(
        "Location Saved",
        `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`
      );
    } catch (e: any) {
      Alert.alert(
        "Location Error",
        e?.message || "Failed to update location"
      );
    } finally {
      setUpdatingLocation(false);
    }
  }

  async function handlePublish() {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter service title");
      return;
    }

    if (!category) {
      Alert.alert("Required", "Please select a category");
      return;
    }

    const validPackages = packages
      .filter((pkg) => pkg.price.trim() && Number(pkg.price) > 0)
      .map((pkg) => ({
        id: pkg.id,
        title: pkg.title,
        price: Number(pkg.price),
        description: pkg.description.trim(),
        deliveryHours: pkg.deliveryHours
          ? Number(pkg.deliveryHours)
          : undefined,
      }));

    if (validPackages.length === 0) {
      Alert.alert("Required", "Add price for at least one package");
      return;
    }

    try {
      setSaving(true);

      let imageUrl = "";

      if (image) {
        const uploaded = await uploadImage(image);
        imageUrl = extractImageUrl(uploaded);
      }

      await createService({
        title: title.trim(),
        description: description.trim(),
        category,
        city: city.trim() || undefined,
        isEmergency,
        images: imageUrl ? [imageUrl] : [],
        packages: validPackages,
        price: validPackages[0].price,
      });

      Alert.alert("Success", "Service published successfully", [
        {
          text: "OK",
          onPress: () => {
            setTitle("");
            setDescription("");
            setCategory("");
            setCity("");
            setIsEmergency(false);
            setImage("");
            setPackages((prev) =>
              prev.map((pkg) => ({
                ...pkg,
                price: "",
              }))
            );
            router.push("/worker/(tabs)/home");
          },
        },
      ]);
    } catch (e: any) {
      console.log(e?.response?.data || e);
      Alert.alert(
        "Error",
        e?.response?.data?.message || "Failed to publish service"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Text style={styles.headerTitle}>Publish Service</Text>
        <Text style={styles.headerSub}>
          Fiverr-style packages + emergency offer
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 40 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Location */}
        <View style={styles.locationCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>Share your location</Text>
            <Text style={styles.locationSub}>
              Customers can see how far you are
            </Text>
          </View>

          <TouchableOpacity
            style={styles.locationBtn}
            onPress={handleShareLocation}
            disabled={updatingLocation}
          >
            {updatingLocation ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="locate" size={16} color="#fff" />
                <Text style={styles.locationBtnText}>Update</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Image */}
        <Text style={styles.label}>Cover Image</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={28} color={COLORS.primary} />
              <Text style={styles.pickText}>Add Service Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.label}>Service Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Emergency Car Battery Jump Start"
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        {/* Category */}
        <Text style={styles.label}>Category *</Text>
        {loadingCategories ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <View style={styles.chips}>
            {categories.map((item: any) => {
              const id = item.id || item.slug || item.name;
              const name = item.name || item.title || String(id);
              const active = category === id || category === name;

              return (
                <TouchableOpacity
                  key={String(id)}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(String(id))}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What is included in this service?"
          placeholderTextColor="#94A3B8"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* City */}
        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dhaka"
          placeholderTextColor="#94A3B8"
          value={city}
          onChangeText={setCity}
        />

        {/* Emergency */}
        <View style={styles.emergencyCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>Emergency Service</Text>
            <Text style={styles.emergencySub}>
              Enable if you can respond quickly (roadside, urgent repair)
            </Text>
          </View>
          <Switch
            value={isEmergency}
            onValueChange={setIsEmergency}
            trackColor={{ false: "#CBD5E1", true: "#FCA5A5" }}
            thumbColor={isEmergency ? "#EF4444" : "#f4f4f5"}
          />
        </View>

        {/* Packages */}
        <Text style={styles.sectionTitle}>Packages *</Text>
        <Text style={styles.sectionHint}>
          Like Fiverr — set Basic / Standard / Premium (fill at least one)
        </Text>

        {packages.map((pkg) => (
          <View key={pkg.id} style={styles.packageCard}>
            <Text style={styles.packageName}>{pkg.title}</Text>

            <Text style={styles.smallLabel}>Price (৳)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={pkg.price}
              onChangeText={(v) => updatePackage(pkg.id, "price", v)}
            />

            <Text style={styles.smallLabel}>Delivery hours</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={pkg.deliveryHours}
              onChangeText={(v) => updatePackage(pkg.id, "deliveryHours", v)}
            />

            <Text style={styles.smallLabel}>Package details</Text>
            <TextInput
              style={styles.input}
              placeholder="What's included?"
              placeholderTextColor="#94A3B8"
              value={pkg.description}
              onChangeText={(v) => updatePackage(pkg.id, "description", v)}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.publishBtn, saving && { opacity: 0.7 }]}
          onPress={handlePublish}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="rocket" size={18} color="#fff" />
              <Text style={styles.publishText}>Publish Service</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },

  headerSub: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },

  content: {
    padding: 20,
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },

  locationTitle: {
    fontWeight: "800",
    color: "#0F172A",
    fontSize: 14,
  },

  locationSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
  },

  locationBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 88,
    justifyContent: "center",
  },

  locationBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  label: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: "800",
    fontSize: 14,
    color: "#334155",
  },

  smallLabel: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0F172A",
    marginBottom: 12,
  },

  textArea: {
    height: 110,
    textAlignVertical: "top",
  },

  imagePicker: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },

  preview: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  pickText: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },

  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  chipText: {
    fontWeight: "700",
    color: "#334155",
    fontSize: 13,
  },

  chipTextActive: {
    color: "#fff",
  },

  emergencyCard: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  emergencyTitle: {
    fontWeight: "800",
    color: "#B91C1C",
    fontSize: 14,
  },

  emergencySub: {
    marginTop: 3,
    fontSize: 12,
    color: "#7F1D1D",
    lineHeight: 17,
  },

  sectionTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  sectionHint: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 12,
    color: "#64748B",
  },

  packageCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 12,
  },

  packageName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 10,
  },

  publishBtn: {
    marginTop: 10,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  publishText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});