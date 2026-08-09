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
} from "react-native";

import { useLocalSearchParams, router } from "expo-router";

import {
  getJobById,
  updateJob,
} from "@/services/job.service";

import { COLORS } from "@/theme";

export default function EditJobScreen() {
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    loadJob();
  }, []);

  async function loadJob() {
    try {
      const res = await getJobById(id as string);

      const job = res.data;

      setTitle(job.title);
      setCategory(job.category);
      setDescription(job.description);
      setBudget(String(job.budget));
      setCity(job.city);
      setAddress(job.address);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to load job");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (
      !title ||
      !category ||
      !description ||
      !budget ||
      !city ||
      !address
    ) {
      Alert.alert("Error", "সব তথ্য পূরণ করুন");
      return;
    }

    try {
      setSaving(true);

      await updateJob(id as string, {
        title,
        category,
        description,
        budget: Number(budget),
        city,
        address,
      });

      Alert.alert(
        "Success",
        "Job Updated Successfully"
      );

      router.back();
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Error",
        "Failed to update job"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 50,
      }}
    >
      <Text style={styles.header}>
        Edit Job
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Job Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={styles.input}
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <TextInput
        style={styles.input}
        placeholder="Budget"
        keyboardType="numeric"
        value={budget}
        onChangeText={setBudget}
      />

      <TextInput
        style={styles.input}
        placeholder="City"
        value={city}
        onChangeText={setCity}
      />

      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleUpdate}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving
            ? "Updating..."
            : "Update Job"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 25,
    color: COLORS.text,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },

  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 15,
  },

  button: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});