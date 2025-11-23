import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";

export default function AddItem() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // Helper: Upload image to Supabase Storage
  const uploadImage = async (uri: string, filename: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from("item-photos") // bucket name
        .upload(filename, blob, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("item-photos")
        .getPublicUrl(filename);

      return urlData.publicUrl;
    } catch (err: any) {
      console.log("Upload error:", err);
      throw err;
    }
  };

  const submitItem = async () => {
    if (!image || !title.trim()) {
      Alert.alert("Missing Fields", "Please add an image and enter a title.");
      return;
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return Alert.alert("Error", "User not logged in");

    setUploading(true);

    try {
      const filename = `items/${crypto.randomUUID()}.jpg`;
      const imageUrl = await uploadImage(image, filename);

      const { data, error } = await supabase.from("items").insert([
        {
          title,
          photo_url: imageUrl,
          category: category || "Clothing",
          location: location || "Not specified",
          description: description || null,
          user_email: user.email,
          user_name: user.email?.split("@")[0],
          created_at: new Date().toISOString(), // Add timestamp
        },
      ]).select();

      if (error) throw error;

      Alert.alert("Item Listed 🎉", "Your item has been successfully added!");
      
      // Clear form
      setImage(null);
      setTitle("");
      setCategory("");
      setLocation("");
      setDescription("");
      
      router.back();
    } catch (err: any) {
      Alert.alert("Upload failed", err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <LinearGradient colors={["#cfd9ff", "#e2ebf8"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>List an Item ♻️</Text>

        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={{ color: "#9CA3AF" }}>No image selected</Text>
          </View>
        )}

        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>Pick from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
            <Text style={styles.imageButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Item Name *"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#7C3AED"
        />
        <TextInput
          placeholder="Category (e.g., Clothing, Books, Electronics)"
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholderTextColor="#7C3AED"
        />
        <TextInput
          placeholder="Location (e.g., Rajiv Bhawan, Library)"
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholderTextColor="#7C3AED"
        />
        <TextInput
          placeholder="Description (optional)"
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#7C3AED"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity 
          style={[styles.submitButton, uploading && styles.submitButtonDisabled]} 
          onPress={submitItem}
          disabled={uploading}
        >
          <Text style={styles.submitText}>
            {uploading ? "Uploading..." : "Submit"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20, flexGrow: 1 },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#4B0082",
    textAlign: "center",
  },
  preview: { height: 200, borderRadius: 20, marginBottom: 16 },
  placeholder: {
    height: 200,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  imageButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
    backgroundColor: "rgba(123,97,255,0.7)",
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
  },
  imageButtonText: { color: "white", fontWeight: "600" },
  input: {
    backgroundColor: "rgba(255,255,255,0.25)",
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(123,97,255,0.5)",
    marginBottom: 16,
    fontSize: 14,
    color: "#2E026D",
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  submitButton: {
    backgroundColor: "#7B61FF",
    paddingVertical: 16,
    borderRadius: 15,
    marginTop: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.05,
  },
  submitText: { color: "white", fontWeight: "700", fontSize: 16 },
});