import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const sendOTP = async () => {
    if (!email.includes("@")) return Alert.alert("Enter valid email");

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) Alert.alert(error.message);
    else router.push("/(tabs)/auth/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ReuseHub ♻️</Text>
      <Text style={styles.subtitle}>Login / Sign Up</Text>

      <TextInput
        placeholder="Enter your college email"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
      />

      <TouchableOpacity style={styles.button} onPress={sendOTP}>
        <Text style={styles.buttonText}>Send OTP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 30, backgroundColor: "#F9FAFB" },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center", color: "#6D28D9" },
  subtitle: { fontSize: 14, textAlign: "center", marginVertical: 6, color: "#6B7280" },
  input: { backgroundColor: "white", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", marginTop: 20 },
  button: { backgroundColor: "#6D28D9", padding: 14, borderRadius: 10, marginTop: 16 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600", textAlign: "center" },
});
