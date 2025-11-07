import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();

  const signIn = async () => {
    const redirectTo = AuthSession.makeRedirectUri({
      scheme: "reusehub",
      path: "/auth/callback",
    });

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/(tabs)");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 40 }}>
        SwapIt ♻️
      </Text>

      <TouchableOpacity
        onPress={signIn}
        style={{
          backgroundColor: "#4285F4",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>
          Continue with Google
        </Text>
      </TouchableOpacity>
    </View>
  );
}
