import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, SearchParams } from "expo-router";
import { supabase } from "../lib/supabase";

export default function ItemDetail() {
  const router = useRouter();
  const params = new URLSearchParams() as { id?: string; hardcoded?: "0" | "1" };
  const { id, hardcoded } = params || {};
  const isHardcoded = hardcoded === "1";

  const [item, setItem] = useState<any>(null);

  const hardcodedItems = [
    {
      id: "hardcoded-1",
      image: "https://images-cdn.ubuy.co.in/6539cf4e9a1cbb1fe31f74c4-yozai-men-39-s-winter-coat-warm.jpg",
      title: "Winter Jacket - Size M",
      category: "Clothing",
      location: "Rajiv Bhawan",
      time: "2h ago",
      user_email: null,
    },
    {
      id: "hardcoded-2",
      image: "https://huyenchip.com/assets/pics/engineering-books/all-books.jpeg",
      title: "Engineering Books",
      category: "Books",
      location: "Library",
      time: "5h ago",
      user_email: null,
    },
    {
      id: "hardcoded-3",
      image: "https://www.weirdwolf.in/cdn/shop/files/main-img.jpg?v=1760602078&width=3024",
      title: "Study Lamp",
      category: "Stationery",
      location: "Himalaya Bhawan",
      time: "1d ago",
      user_email: null,
    },
    {
      id: "hardcoded-4",
      image: "https://assets.myntassets.com/w_412,q_30,dpr_3,fl_progressive,f_webp/assets/images/31537042/2025/2/17/5584cf58-e3d7-4ff4-a65b-32b22cec916a1739799521637-1.jpg",
      title: "Laptop Bag",
      category: "Electronics",
      location: "Main Campus",
      time: "2d ago",
      user_email: null,
    },
  ];

  useEffect(() => {
    if (!id) return;

    if (isHardcoded) {
      const found = hardcodedItems.find((i) => i.id === id);
      if (found) setItem(found);
      return;
    }

    const fetchItem = async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (data && !error) setItem(data);
    };

    fetchItem();
  }, [id]);

  if (!item) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: item.image || item.photo_url }} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.category}>{item.category || "N/A"}</Text>
      <Text style={styles.location}>📍 {item.location}</Text>
      <Text style={styles.time}>{item.time || "Recently listed"}</Text>

      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => alert("Chat feature not implemented yet")}
      >
        <Text style={styles.chatText}>Chat with Owner</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: "center" },
  image: { width: 200, height: 200, borderRadius: 15, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8, color: "#2E026D" },
  category: { fontSize: 16, color: "#7B61FF", marginBottom: 8 },
  location: { fontSize: 14, color: "#4B0082", marginBottom: 4 },
  time: { fontSize: 12, color: "#4B0082", marginBottom: 20 },
  chatButton: { backgroundColor: "#7B61FF", padding: 14, borderRadius: 12 },
  chatText: { color: "white", fontWeight: "600" },
});
