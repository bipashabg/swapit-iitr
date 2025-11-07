import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handleSession() {
      // Finish OAuth redirect
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.log("OAuth error:", error.message);
      }

      if (session) {
        router.replace("/(tabs)");
      } else {
        router.replace("/auth/login");
      }
    }

    handleSession();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
