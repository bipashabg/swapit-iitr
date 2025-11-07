import { Stack, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useEffect } from "react";

export default function AuthLayout() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/(tabs)");
    });
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
