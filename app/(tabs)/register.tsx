import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function NGORegistrationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);

  const [formData, setFormData] = useState({
    ngoName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    registrationNumber: "",
    website: "",
  });

  const [documents, setDocuments] = useState({
    registrationCertificate: null as any,
    taxExemptionCertificate: null as any,
    otherDocuments: [] as any[],
  });

  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: 10, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatAnim1, { toValue: -10, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: -15, duration: 4000, useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 15, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    checkExistingRegistration();
  }, []);

  const checkExistingRegistration = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("ngo_registrations")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setExistingRegistration(data);
      setFormData({
        ngoName: data.ngo_name || "",
        contactPerson: data.contact_person || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        description: data.description || "",
        registrationNumber: data.registration_number || "",
        website: data.website || "",
      });
    }
  };

  const pickDocument = async (type: "registration" | "tax" | "other") => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your photos to upload documents");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const fileInfo = {
        uri: asset.uri,
        name: `document_${Date.now()}.jpg`,
        mimeType: "image/jpeg",
      };

      if (type === "other") {
        setDocuments(prev => ({
          ...prev,
          otherDocuments: [...prev.otherDocuments, fileInfo],
        }));
      } else if (type === "registration") {
        setDocuments(prev => ({ ...prev, registrationCertificate: fileInfo }));
      } else {
        setDocuments(prev => ({ ...prev, taxExemptionCertificate: fileInfo }));
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const uploadDocument = async (file: any, path: string) => {
    if (!file) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const fileExt = file.mimeType?.split("/")[1] || "jpg";
      const fileName = `${user.id}/${path}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("ngo-documents")
        .upload(fileName, blob, {
          contentType: file.mimeType || "image/jpeg",
        });

      if (error) {
        console.error("Upload error:", error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("ngo-documents")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.ngoName || !formData.contactPerson || !formData.email || !formData.phone) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!documents.registrationCertificate) {
      Alert.alert("Error", "Please upload registration certificate");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const regCertUrl = await uploadDocument(
        documents.registrationCertificate,
        "registration_cert"
      );
      const taxCertUrl = documents.taxExemptionCertificate
        ? await uploadDocument(documents.taxExemptionCertificate, "tax_cert")
        : null;

      const otherDocsUrls = await Promise.all(
        documents.otherDocuments.map((doc, index) =>
          uploadDocument(doc, `other_doc_${index}`)
        )
      );

      const { error } = await supabase.from("ngo_registrations").insert({
        user_id: user.id,
        ngo_name: formData.ngoName,
        contact_person: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        description: formData.description,
        registration_number: formData.registrationNumber,
        website: formData.website,
        registration_certificate_url: regCertUrl,
        tax_exemption_certificate_url: taxCertUrl,
        other_documents_url: otherDocsUrls.filter(Boolean),
        verification_status: "pending",
      });

      if (error) throw error;

      Alert.alert(
        "Success",
        "Your NGO registration has been submitted for verification!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error("Submission error:", error);
      Alert.alert("Error", error.message || "Failed to submit registration");
    } finally {
      setLoading(false);
    }
  };

  if (existingRegistration && existingRegistration.verification_status !== "rejected") {
    return (
      <LinearGradient colors={["#A78BFA", "#7C3AED", "#5B21B6"]} style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Registration Status</Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusCard}>
              <MaterialIcons
                name={
                  existingRegistration.verification_status === "approved"
                    ? "check-circle"
                    : "pending"
                }
                size={64}
                color={existingRegistration.verification_status === "approved" ? "#10B981" : "#F59E0B"}
              />
              <Text style={styles.statusTitle}>
                {existingRegistration.verification_status === "approved"
                  ? "Approved"
                  : "Pending Verification"}
              </Text>
              <Text style={styles.statusDescription}>
                {existingRegistration.verification_status === "approved"
                  ? "Your NGO is verified and active on the platform"
                  : "Your registration is under review. We'll notify you once verified."}
              </Text>
              <View style={styles.statusDetails}>
                <Text style={styles.statusLabel}>NGO Name:</Text>
                <Text style={styles.statusValue}>{existingRegistration.ngo_name}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#A78BFA", "#7C3AED", "#5B21B6"]} style={styles.container}>
      <Animated.View style={[styles.bgShape1, { transform: [{ translateY: floatAnim1 }] }]} />
      <Animated.View style={[styles.bgShape2, { transform: [{ translateY: floatAnim2 }] }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NGO Registration</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#7C3AED" />
              <Text style={styles.infoText}>
                Register your NGO to receive materials from students. Your registration will be
                verified before activation.
              </Text>
            </View>

            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  NGO Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter NGO name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.ngoName}
                  onChangeText={(text) => setFormData({ ...formData, ngoName: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Contact Person <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full name of contact person"
                  placeholderTextColor="#9CA3AF"
                  value={formData.contactPerson}
                  onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="contact@ngo.org"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Phone Number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="+91 XXXXXXXXXX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Address <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Complete address"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Registration Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="NGO registration number"
                  placeholderTextColor="#9CA3AF"
                  value={formData.registrationNumber}
                  onChangeText={(text) => setFormData({ ...formData, registrationNumber: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Website</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://www.ngo.org"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="url"
                  autoCapitalize="none"
                  value={formData.website}
                  onChangeText={(text) => setFormData({ ...formData, website: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us about your NGO and its mission"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                />
              </View>
            </View>

            {/* Documents */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Documents</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Registration Certificate <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickDocument("registration")}
                >
                  <MaterialIcons name="upload-file" size={24} color="#7C3AED" />
                  <Text style={styles.uploadText}>
                    {documents.registrationCertificate
                      ? documents.registrationCertificate.name
                      : "Upload Certificate"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tax Exemption Certificate (Optional)</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickDocument("tax")}
                >
                  <MaterialIcons name="upload-file" size={24} color="#7C3AED" />
                  <Text style={styles.uploadText}>
                    {documents.taxExemptionCertificate
                      ? documents.taxExemptionCertificate.name
                      : "Upload Certificate"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Other Documents (Optional)</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickDocument("other")}
                >
                  <MaterialIcons name="add-circle" size={24} color="#7C3AED" />
                  <Text style={styles.uploadText}>Add Document</Text>
                </TouchableOpacity>
                {documents.otherDocuments.map((doc, index) => (
                  <View key={index} style={styles.documentChip}>
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setDocuments((prev) => ({
                          ...prev,
                          otherDocuments: prev.otherDocuments.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <MaterialIcons name="close" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={["#EC4899", "#8B5CF6"]} style={styles.submitGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="send" size={24} color="#fff" />
                    <Text style={styles.submitText}>Submit for Verification</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgShape1: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    top: -50,
    right: -80,
  },
  bgShape2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    bottom: 100,
    left: -60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  required: {
    color: "#FCA5A5",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1F2937",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  uploadButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  uploadText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
    flex: 1,
  },
  documentChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  documentName: {
    fontSize: 13,
    color: "#1F2937",
    flex: 1,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 12,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  statusDetails: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
});