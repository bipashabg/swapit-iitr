import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Image, ScrollView } from "react-native";
import { useRouter, Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";

export default function HomeScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  const floatAnim = useRef(new Animated.Value(0)).current;

  const hardcodedItems = [
    {
      id: "hardcoded-1",
      image: "https://images-cdn.ubuy.co.in/6539cf4e9a1cbb1fe31f74c4-yozai-men-39-s-winter-coat-warm.jpg",
      title: "Winter Jacket - Size M",
      category: "Clothing",
      location: "Rajiv Bhawan",
      time: "2h ago",
    },
    {
      id: "hardcoded-2",
      image: "https://huyenchip.com/assets/pics/engineering-books/all-books.jpeg",
      title: "Engineering Books",
      category: "Books",
      location: "Library",
      time: "5h ago",
    },
    {
      id: "hardcoded-3",
      image: "https://www.weirdwolf.in/cdn/shop/files/main-img.jpg?v=1760602078&width=3024",
      title: "Study Lamp",
      category: "Stationery",
      location: "Himalaya Bhawan",
      time: "1d ago",
    },
    {
      id: "hardcoded-4",
      image: "https://assets.myntassets.com/w_412,q_30,dpr_3,fl_progressive,f_webp/assets/images/31537042/2025/2/17/5584cf58-e3d7-4ff4-a65b-32b22cec916a1739799521637-Mochi-Unisex-Laptop-Bag-4471739799521224-1.jpg",
      title: "Laptop Bag",
      category: "Electronics",
      location: "Main Campus",
      time: "2d ago",
    },
  ];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 7, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: -7, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
    if (!error && data) setItems(data);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  const allItems = [...items, ...hardcodedItems];

  return (
    <LinearGradient colors={["#cfd9ff", "#e2ebf8"]} style={styles.container}>
      <Animated.View style={[styles.floatCircle, { transform: [{ translateY: floatAnim }] }]} />
      <SafeAreaView style={{ flex: 1 }}>
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

        <Text style={styles.screenTitle}>Browse Free & Reusable Items 👀</Text>

        <ScrollView contentContainerStyle={styles.grid}>
          {allItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(`/item-detail?id=${item.id}${item.id.includes("hardcoded") ? "&hardcoded=1" : ""}`)}
            >
              <Image source={{ uri: item.image || item.photo_url }} style={styles.itemIcon} />
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.badge}>{item.category || "Clothing"}</Text>
              <Text style={styles.footerText}>📍 {item.location || "Unknown"}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Link href="/add-item" asChild>
          <TouchableOpacity style={styles.fab}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </Link>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginTop: 10 },
  navTitle: { fontSize: 24, fontWeight: "bold", color: "#4B0082" },
  userRow: { flexDirection: "row", alignItems: "center" },
  userText: { marginRight: 10, color: "#4B0082" },
  logoutText: { color: "#FF4B5C" },
  screenTitle: { fontSize: 18, fontWeight: "600", margin: 20, color: "#4B0082" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", paddingBottom: 120 },
  card: { width: 160, backgroundColor: "white", margin: 10, borderRadius: 15, padding: 10, alignItems: "center" },
  itemIcon: { width: 120, height: 120, borderRadius: 12 },
  itemTitle: { fontWeight: "600", fontSize: 14, marginTop: 8, color: "#2E026D" },
  badge: { fontSize: 12, color: "#fff", backgroundColor: "#7B61FF", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginVertical: 5 },
  footerText: { fontSize: 10, color: "#2E026D" },
  fab: { position: "absolute", bottom: 30, right: 20, backgroundColor: "#7B61FF", width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center" },
  fabText: { color: "#fff", fontSize: 30 },
  floatCircle: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "#D1C4FF", opacity: 0.2, top: 50, left: 50 },
});
