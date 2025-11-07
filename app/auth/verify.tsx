import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { supabase } from "../../lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function VerifyScreen() {
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const router = useRouter();

  const confirmOTP = async () => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: String(email),
      token: otp,
      type: "email"
    });

    if (error) return alert(error.message);
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check Your Email 📩</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>

      <TextInput
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
        maxLength={6}
        placeholder="123456"
        placeholderTextColor="#777"
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={confirmOTP}>
        <Text style={styles.buttonText}>Verify & Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 25, backgroundColor: "#000" },
  title: { color: "#fff", fontSize: 28, fontWeight: "600", marginBottom: 10 },
  subtitle: { color: "#aaa", fontSize: 16, marginBottom: 30 },
  input: { backgroundColor: "#111", color: "#fff", padding: 15, borderRadius: 8, marginBottom: 20, textAlign: "center", fontSize: 18 },
  button: { backgroundColor: "#7D5CFF", padding: 15, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" }
});
