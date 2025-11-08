import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useEffect, useState, useRef } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { BouncingDots } from "react-native-bits";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Fade in animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: "reusehub",
        path: "/auth/callback",
      });

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/(tabs)");
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <LinearGradient
      colors={["#A78BFA", "#7C3AED", "#4C1D95"]}
      style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 }}
    >
      <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>

        {/* Floating Icon */}
        <Text style={{ fontSize: 60, marginBottom: 6 }}>🔁</Text>

        {/* App Title */}
        <Text style={{ fontSize: 42, fontWeight: "800", color: "white" }}>
          SwapIt
        </Text>

        {/* Tagline */}
        <Text style={{ fontSize: 15, color: "#EDE9FE", marginBottom: 60, marginTop: 5 }}>
          Donate easily. Reuse effortlessly.
        </Text>

        {/* Loading State */}
        {loading ? (
          <View style={{ alignItems: "center" }}>
            <BouncingDots size={14} color="white" />
            <Text style={{ marginTop: 12, fontSize: 14, color: "#EDE9FE" }}>
              Connecting to Google…
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={signIn}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: "white",
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 14,
              shadowColor: "#000",
              shadowOpacity: 0.18,
              shadowRadius: 6,
              elevation: 6,
            }}
          >
            <AntDesign name="google" size={20} color="#DB4437" />
            <Text style={{ color: "#111", fontWeight: "600", fontSize: 16 }}>
              Continue with Google
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </LinearGradient>
  );
}
