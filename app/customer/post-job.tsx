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
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";

import { createJob } from "@/services/job.service";
import { uploadImage } from "@/services/upload.service";
import { getCategories } from "@/services/category.service";

import { COLORS } from "@/theme";

export default function PostJob() {
  const { workerId } = useLocalSearchParams();

  const worker = Array.isArray(workerId) ? workerId[0] : workerId;

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [address, setAddress] = useState("");
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
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }

  async function handlePostJob() {
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    if (!title || !description || !budget || !address) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      let imageUrl = "";

      if (image) {
        imageUrl = await uploadImage(image);
      }

      await createJob({
        workerId: worker || undefined,
        category: selectedCategory,
        title,
        description,
        budget: Number(budget),
        address,
        city: "Kushtia",
        image: imageUrl,
      });

      Alert.alert("Success", "Job Posted Successfully");
      router.replace("/customer/(tabs)/jobs");
    } catch (error: any) {
      console.log("POST JOB ERROR =", error.response?.data);
      console.log(error);

      Alert.alert(
        "Error",
        JSON.stringify(error.response?.data)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Debug (optional) */}
        {worker && (
          <Text style={styles.debug}>Worker ID: {worker}</Text>
        )}

        {/* Category Selection */}
        <Text style={styles.label}>Select Category *</Text>

        {loadingCategories ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextActive,
                  ]}
                >
                  {cat.emoji} {cat.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Job Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. AC Repair Needed"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the problem in detail..."
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Budget (৳) *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 800"
          value={budget}
          onChangeText={setBudget}
        />

        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your address"
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.label}>Job Image</Text>
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={pickImage}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} />
          ) : (
            <Text style={styles.pickText}>Select Image</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          disabled={loading}
          onPress={handlePostJob}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Post Job</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  debug: {
    color: COLORS.textSecondary,
    marginBottom: 10,
    fontSize: 13,
  },
  label: {
    marginTop: 18,
    marginBottom: 8,
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.text,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  categoryTextActive: {
    color: "#fff",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  imagePicker: {
    height: 180,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  pickText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "700",
  },
  button: {
    marginTop: 30,
    backgroundColor: "#FF6B00",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});