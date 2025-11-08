import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";

export default function ItemDetail() {
  const router = useRouter();
  // Fix: Use useLocalSearchParams hook instead of new URLSearchParams()
  const { id, hardcoded } = useLocalSearchParams<{ id: string; hardcoded?: string }>();
  const isHardcoded = hardcoded === "1";

  const [item, setItem] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [showChat, setShowChat] = useState(false);

  const hardcodedItems = [
    {
      id: "hardcoded-1",
      image: "https://images-cdn.ubuy.co.in/6539cf4e9a1cbb1fe31f74c4-yozai-men-39-s-winter-coat-warm.jpg",
      title: "Winter Jacket - Size M",
      category: "Clothing",
      location: "Rajiv Bhawan",
      time: "2h ago",
      description: "Gently used winter jacket in excellent condition. Perfect for cold weather. Size M fits well.",
      user_email: "donor@example.com",
    },
    {
      id: "hardcoded-2",
      image: "https://huyenchip.com/assets/pics/engineering-books/all-books.jpeg",
      title: "Engineering Books",
      category: "Books",
      location: "Library",
      time: "5h ago",
      description: "Collection of engineering textbooks. Great for students. All books in good condition.",
      user_email: "bookworm@example.com",
    },
    {
      id: "hardcoded-3",
      image: "https://www.weirdwolf.in/cdn/shop/files/main-img.jpg?v=1760602078&width=3024",
      title: "Study Lamp",
      category: "Stationery",
      location: "Himalaya Bhawan",
      time: "1d ago",
      description: "Adjustable study lamp with LED bulb. Energy efficient and bright.",
      user_email: "student@example.com",
    },
    {
      id: "hardcoded-4",
      image: "https://assets.myntassets.com/w_412,q_30,dpr_3,fl_progressive,f_webp/assets/images/31537042/2025/2/17/5584cf58-e3d7-4ff4-a65b-32b22cec916a1739799521637-Mochi-Unisex-Laptop-Bag-4471739799521224-1.jpg",
      title: "Laptop Bag",
      category: "Electronics",
      location: "Main Campus",
      time: "2d ago",
      description: "Durable laptop bag with multiple compartments. Fits up to 15-inch laptops.",
      user_email: "techie@example.com",
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
      <LinearGradient colors={["#cfd9ff", "#e2ebf8"]} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#cfd9ff", "#e2ebf8"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Item Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image || item.photo_url }} style={styles.image} />
        </View>

        {/* Item Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.location}>📍 {item.location}</Text>
            <Text style={styles.time}>🕐 {item.time || "Recently listed"}</Text>
          </View>

          {item.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}

          {item.user_email && (
            <View style={styles.ownerSection}>
              <Text style={styles.sectionTitle}>Listed by</Text>
              <Text style={styles.ownerEmail}>{item.user_email}</Text>
            </View>
          )}
        </View>

        {/* Chat Section */}
        {!showChat ? (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => setShowChat(true)}
          >
            <Text style={styles.chatButtonText}>💬 Chat with Owner</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.chatContainer}>
            <Text style={styles.chatTitle}>Chat</Text>
            
            {/* Mock Chat Messages */}
            <View style={styles.messagesContainer}>
              <View style={styles.messageBubbleOther}>
                <Text style={styles.messageText}>
                  Hi! This item is still available. Feel free to ask any questions!
                </Text>
              </View>
              <View style={styles.messageBubbleYou}>
                <Text style={styles.messageTextYou}>
                  Great! When can I pick it up?
                </Text>
              </View>
            </View>

            {/* Chat Input */}
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                value={chatMessage}
                onChangeText={setChatMessage}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => {
                  if (chatMessage.trim()) {
                    alert(`Message would be sent: "${chatMessage}"`);
                    setChatMessage("");
                  }
                }}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
    marginTop: 10,
  },
  backText: {
    fontSize: 16,
    color: "#4B0082",
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 18,
    color: "#4B0082",
    fontWeight: "600",
  },
  imageContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 15,
  },
  detailsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E026D",
    flex: 1,
    marginRight: 10,
  },
  categoryBadge: {
    backgroundColor: "#7B61FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  location: {
    fontSize: 14,
    color: "#4B0082",
    fontWeight: "500",
  },
  time: {
    fontSize: 14,
    color: "#6B7280",
  },
  descriptionSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E026D",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  ownerSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  ownerEmail: {
    fontSize: 14,
    color: "#7B61FF",
    fontWeight: "500",
  },
  chatButton: {
    backgroundColor: "#7B61FF",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#7B61FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  chatButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  chatContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E026D",
    marginBottom: 16,
  },
  messagesContainer: {
    marginBottom: 16,
    minHeight: 150,
  },
  messageBubbleOther: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 15,
    borderTopLeftRadius: 4,
    marginBottom: 12,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  messageBubbleYou: {
    backgroundColor: "#7B61FF",
    padding: 12,
    borderRadius: 15,
    borderTopRightRadius: 4,
    marginBottom: 12,
    maxWidth: "80%",
    alignSelf: "flex-end",
  },
  messageText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  messageTextYou: {
    fontSize: 14,
    color: "white",
    lineHeight: 20,
  },
  chatInputContainer: {
    flexDirection: "row",
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sendButton: {
    backgroundColor: "#7B61FF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  sendButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});