import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from "react-native";
import { Link, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useEffect, useState } from "react";

export default function HomeScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const items = [
    { id: "1", icon: "🧥", title: "Winter Jacket - Size M", category: "Clothing", location: "Main Campus", time: "2h ago" },
    { id: "2", icon: "📚", title: "Engineering Books", category: "Books", location: "Library", time: "5h ago" },
    { id: "3", icon: "💡", title: "Study Lamp", category: "Stationery", location: "Hostel A", time: "1d ago" },
    { id: "4", icon: "💼", title: "Laptop Bag", category: "Electronics", location: "Tech Block", time: "2d ago" },
  ];

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
  }, []);

  // ✅ Logout handler
  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Top Bar */}
      <View style={styles.navBar}>
        <Text style={styles.navTitle}>SwapIt ♻️</Text>

        {userEmail && (
          <View style={styles.userRow}>
            <Text style={styles.userText}>Hi, {userEmail.split("@")[0]}</Text>
            <TouchableOpacity onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Subtitle */}
      <Text style={styles.screenTitle}>HOME • Browse Available Items</Text>

      {/* Grid */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.itemImage}>
              <Text style={styles.itemIcon}>{item.icon}</Text>
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.badge}>{item.category}</Text>

              <View style={styles.footer}>
                <Text style={styles.footerText}>📍 {item.location}</Text>
                <Text style={styles.footerText}>{item.time}</Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Floating Add Button */}
      <Link href="/add-item" asChild>
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Link>

      {/* Bottom Tabs */}
      <View style={styles.tabBar}>
        <View style={[styles.tab, styles.activeTabBackground]}>
          <Text style={[styles.tabIcon, styles.activeTabText]}>🏠</Text>
          <Text style={[styles.tabLabel, styles.activeTabText]}>Browse</Text>
        </View>

        <View style={styles.tab}>
          <Text style={styles.tabIcon}>🔍</Text>
          <Text style={styles.tabLabel}>Explore</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  navBar: { backgroundColor: "#8B5CF6", padding: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  navTitle: { fontSize: 22, fontWeight: "bold", color: "white" },

  userRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  userText: { color: "white", fontWeight: "600", fontSize: 14 },
  logoutText: { color: "white", fontWeight: "700", fontSize: 14, textDecorationLine: "underline" },

  screenTitle: {
    backgroundColor: "#EDE9FE",
    textAlign: "center",
    paddingVertical: 8,
    fontSize: 12,
    color: "#7C3AED",
    fontWeight: "600",
  },

  grid: { padding: 16 },

  card: {
    backgroundColor: "white",
    borderRadius: 14,
    flex: 1,
    margin: 6,
    overflow: "hidden",
    elevation: 3,
  },
  itemImage: {
    height: 110,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: { fontSize: 44, color: "white" },

  cardContent: { padding: 10 },
  itemTitle: { fontWeight: "600", fontSize: 14, color: "#111827" },
  badge: {
    backgroundColor: "#EDE9FE",
    color: "#7C3AED",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },

  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  footerText: { fontSize: 11, color: "#6B7280" },

  fab: {
    position: "absolute",
    backgroundColor: "#8B5CF6",
    width: 60,
    height: 60,
    borderRadius: 30,
    bottom: 80,
    right: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  fabText: { fontSize: 32, color: "white" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    height: 60,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  activeTabBackground: { backgroundColor: "#F3E8FF" },
  activeTabText: { color: "#7C3AED" },
  tabIcon: { fontSize: 22, color: "#6B7280" },
  tabLabel: { fontSize: 11, color: "#6B7280" },
});
