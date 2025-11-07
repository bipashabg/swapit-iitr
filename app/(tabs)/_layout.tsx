import { Tabs, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useEffect } from "react";

export default function TabsLayout() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/auth/login");
    });
  }, []);

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="add-item" options={{ title: "Add Item" }} />
    </Tabs>
  );
}
