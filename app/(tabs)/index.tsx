import { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Image, ScrollView } from "react-native";
import { useRouter, Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Animations
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  const categories = ["All", "Clothing", "Books", "Electronics", "Stationery"];

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Multiple floating animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: 10, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatAnim1, { toValue: -10, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: -15, duration: 4000, useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 15, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim3, { toValue: 8, duration: 3500, useNativeDriver: true }),
        Animated.timing(floatAnim3, { toValue: -8, duration: 3500, useNativeDriver: true }),
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
  const filteredItems = selectedCategory === "All" 
    ? allItems 
    : allItems.filter(item => item.category === selectedCategory);

  return (
    <LinearGradient colors={["#A78BFA", "#7C3AED", "#5B21B6"]} style={styles.container}>
      {/* Animated Background Shapes */}
      <Animated.View style={[styles.bgShape1, { transform: [{ translateY: floatAnim1 }] }]} />
      <Animated.View style={[styles.bgShape2, { transform: [{ translateY: floatAnim2 }] }]} />
      <Animated.View style={[styles.bgShape3, { transform: [{ translateY: floatAnim3 }] }]} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Welcome back 👋</Text>
              {userEmail && (
                <Text style={styles.userName}>{userEmail.split("@")[0]}</Text>
              )}
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{allItems.length}</Text>
              <Text style={styles.statLabel}>Available Items</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>♻️</Text>
              <Text style={styles.statLabel}>Reuse & Save</Text>
            </View>
          </View>
        </Animated.View>

        {/* Categories */}
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Items Grid */}
        <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === "All" ? "All Items" : selectedCategory} ({filteredItems.length})
          </Text>
          
          <ScrollView 
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          >
            {filteredItems.map((item, index) => (
              <Animated.View
                key={item.id}
                style={[
                  styles.cardWrapper,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push(`/item-detail?id=${item.id}${item.id.includes("hardcoded") ? "&hardcoded=1" : ""}`)}
                  activeOpacity={0.9}
                >
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: item.image || item.photo_url }} 
                      style={styles.itemImage} 
                    />
                    <View style={styles.categoryBadge}>
                      <Text style={styles.badgeText}>{item.category}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardContent}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.cardFooter}>
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color="#7C3AED" />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {item.location || "Unknown"}
                        </Text>
                      </View>
                      <Text style={styles.timeText}>{item.time}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Floating Action Button */}
        <Link href="/add-item" asChild>
          <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
            <LinearGradient
              colors={["#EC4899", "#8B5CF6"]}
              style={styles.fabGradient}
            >
              <MaterialIcons name="add" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Link>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  // Animated background shapes
  bgShape1: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    top: -50,
    right: -80,
  },
  bgShape2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    bottom: 100,
    left: -60,
  },
  bgShape3: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    top: 250,
    left: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: "#E9D5FF",
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#E9D5FF",
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: "#fff",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  categoryTextActive: {
    color: "#7C3AED",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    position: "relative",
  },
  itemImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#F3F4F6",
  },
  categoryBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(124, 58, 237, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  cardContent: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    minHeight: 36,
  },
  cardFooter: {
    gap: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  timeText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});