import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

export default function AddItem() {
  const router = useRouter();

  const [image, setImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const submitItem = () => {
    if (!image || !title.trim()) {
      Alert.alert("Missing Fields", "Please add an image and enter a title.");
      return;
    }

    console.log({ image, title, category, location });

    Alert.alert("Item Listed 🎉", "Your item has been successfully added!");
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>List an Item ♻️</Text>

      {/* Image Preview */}
      {image ? (
        <Image source={{ uri: image }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={{ color: "#9CA3AF" }}>No image selected</Text>
        </View>
      )}

      {/* Image Buttons */}
      <View style={styles.imageButtons}>
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>Pick from Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
          <Text style={styles.imageButtonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Text Inputs */}
      <TextInput
        placeholder="Item Name (e.g., Study Lamp)"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        placeholder="Category (e.g., Stationery / Clothing / Books)"
        style={styles.input}
        value={category}
        onChangeText={setCategory}
      />

      <TextInput
        placeholder="Pickup Location (e.g., Hostel A Gate)"
        style={styles.input}
        value={location}
        onChangeText={setLocation}
      />

      {/* Submit */}
      <TouchableOpacity style={styles.submitButton} onPress={submitItem}>
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F9FAFB",
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: "#6D28D9",
  },
  preview: {
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  placeholder: {
    height: 200,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  imageButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  imageButton: {
    flex: 1,
    backgroundColor: "#8B5CF6",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  imageButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#6D28D9",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  submitText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});
