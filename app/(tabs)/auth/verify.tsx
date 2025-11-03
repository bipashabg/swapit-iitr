import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { supabase } from "@/lib/supabase";

export default function Verify() {
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const router = useRouter();

  const verifyOTP = async () => {
    const { error } = await supabase.auth.verifyOtp({
      email: email as string,
      token: otp,
      type: "email",
    });

    if (error) Alert.alert(error.message);
    else router.replace("/"); // ✅ Go to Home
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Enter OTP</Text>
      <Text style={styles.subheader}>Sent to: {email}</Text>

      <TextInput
        placeholder="6-digit code"
        keyboardType="number-pad"
        style={styles.input}
        onChangeText={setOtp}
      />

      <TouchableOpacity style={styles.button} onPress={verifyOTP}>
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 40, justifyContent: "center" },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  subheader: { textAlign: "center", marginBottom: 30, color: "#6B7280" },
  input: { borderWidth: 1, borderColor: "#DDD", padding: 14, borderRadius: 8 },
  button: { backgroundColor: "#6D28D9", marginTop: 20, padding: 14, borderRadius: 10 },
  buttonText: { color: "white", fontSize: 16, textAlign: "center", fontWeight: "600" },
});
