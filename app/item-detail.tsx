import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  id: string;
  item_id: string;
  sender_email: string;
  receiver_email: string;
  content: string;
  created_at: string;
}

export default function ItemDetail() {
  const router = useRouter();
  const { id, hardcoded } = useLocalSearchParams<{ id: string; hardcoded?: string }>();
  const isHardcoded = hardcoded === "1";

  const [item, setItem] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const messagesScrollRef = useRef<ScrollView>(null);

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
    // Get current user
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserEmail(data.session?.user?.email ?? null);
    });
  }, []);

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

  // Fetch messages when chat is opened and setup real-time subscription
  useEffect(() => {
    if (showChat && !isHardcoded && currentUserEmail && item?.user_email) {
      fetchMessages();
      
      // Subscribe to new messages for this item
      // This will listen to ALL messages for this item in real-time
      const channel = supabase
        .channel(`messages:item:${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `item_id=eq.${id}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            // Only add if message involves current user (sender or receiver)
            if (
              newMessage.sender_email === currentUserEmail ||
              newMessage.receiver_email === currentUserEmail
            ) {
              setMessages((prev) => {
                // Prevent duplicates
                if (prev.some(msg => msg.id === newMessage.id)) {
                  return prev;
                }
                return [...prev, newMessage];
              });
              setTimeout(scrollToBottom, 100);
            }
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [showChat, id, currentUserEmail, item]);

  const fetchMessages = async () => {
    if (!currentUserEmail || !item?.user_email || isHardcoded) {
      console.log("Cannot fetch messages:", {
        currentUserEmail,
        itemUserEmail: item?.user_email,
        isHardcoded
      });
      return;
    }

    console.log("Fetching messages for item:", id);
    console.log("Between users:", currentUserEmail, "and", item.user_email);

    // Fetch all messages between current user and item owner for this specific item
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("item_id", id)
      .or(`and(sender_email.eq.${currentUserEmail},receiver_email.eq.${item.user_email}),and(sender_email.eq.${item.user_email},receiver_email.eq.${currentUserEmail})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch messages error:", error);
      Alert.alert("Error", `Could not load messages: ${error.message}`);
    } else {
      console.log("Fetched messages:", data?.length || 0);
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim() || !currentUserEmail || !item?.user_email) {
      console.log("Missing required fields:", {
        chatMessage: chatMessage.trim(),
        currentUserEmail,
        itemUserEmail: item?.user_email
      });
      return;
    }

    if (isHardcoded) {
      Alert.alert(
        "Demo Mode",
        "This is a hardcoded item. Chat is only available for real items from the database.",
        [{ text: "OK" }]
      );
      return;
    }

    if (currentUserEmail === item.user_email) {
      Alert.alert("Notice", "You cannot chat with yourself!");
      return;
    }

    setLoading(true);

    const newMessage = {
      item_id: id,
      sender_email: currentUserEmail,
      receiver_email: item.user_email,
      content: chatMessage.trim(),
    };

    console.log("Attempting to send message:", newMessage);

    const { data, error } = await supabase.from("messages").insert([newMessage]).select();

    if (error) {
      console.error("Send message error:", error);
      Alert.alert(
        "Error Sending Message", 
        `${error.message}\n\nThis might be an RLS policy issue. Check console for details.`,
        [{ text: "OK" }]
      );
    } else {
      console.log("Message sent successfully:", data);
      setChatMessage("");
      // Optionally add message to local state immediately (optimistic update)
      if (data && data[0]) {
        setMessages((prev) => [...prev, data[0]]);
      }
      setTimeout(scrollToBottom, 100);
    }

    setLoading(false);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!item) {
    return (
      <LinearGradient colors={["#cfd9ff", "#e2ebf8"]} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  const isOwnItem = currentUserEmail === item.user_email;

  return (
    <LinearGradient colors={["#cfd9ff", "#e2ebf8"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          ref={scrollViewRef}
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#4B0082" />
            <Text style={styles.backText}>Back</Text>
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
              style={[styles.chatButton, isOwnItem && styles.chatButtonDisabled]}
              onPress={() => {
                if (isOwnItem) {
                  Alert.alert("Notice", "This is your own item!");
                  return;
                }
                setShowChat(true);
              }}
              disabled={isOwnItem}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              <Text style={styles.chatButtonText}>
                {isOwnItem ? "Your Item" : "Chat with Owner"}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.chatContainer}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatTitle}>
                  Chat with {item.user_email?.split("@")[0]}
                </Text>
                <TouchableOpacity onPress={() => setShowChat(false)}>
                  <Ionicons name="close-circle" size={24} color="#7B61FF" />
                </TouchableOpacity>
              </View>

              {isHardcoded ? (
                <View style={styles.demoNotice}>
                  <Ionicons name="information-circle" size={20} color="#7C3AED" />
                  <Text style={styles.demoText}>
                    Chat is only available for database items
                  </Text>
                </View>
              ) : (
                <>
                  {/* Messages */}
                  <ScrollView 
                    style={styles.messagesContainer}
                    ref={scrollViewRef}
                    onContentSizeChange={scrollToBottom}
                  >
                    {messages.length === 0 ? (
                      <View style={styles.emptyChat}>
                        <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No messages yet</Text>
                        <Text style={styles.emptySubtext}>Start the conversation!</Text>
                      </View>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.sender_email === currentUserEmail;
                        return (
                          <View
                            key={msg.id}
                            style={[
                              styles.messageBubble,
                              isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
                            ]}
                          >
                            <Text style={[
                              styles.messageText,
                              isOwn && styles.messageTextOwn
                            ]}>
                              {msg.content}
                            </Text>
                            <Text style={[
                              styles.messageTime,
                              isOwn && styles.messageTimeOwn
                            ]}>
                              {formatTime(msg.created_at)}
                            </Text>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>

                  {/* Chat Input */}
                  <View style={styles.chatInputContainer}>
                    <TextInput
                      style={styles.chatInput}
                      placeholder="Type a message..."
                      placeholderTextColor="#9CA3AF"
                      value={chatMessage}
                      onChangeText={setChatMessage}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        (!chatMessage.trim() || loading) && styles.sendButtonDisabled
                      ]}
                      onPress={sendMessage}
                      disabled={!chatMessage.trim() || loading}
                    >
                      {loading ? (
                        <Ionicons name="hourglass-outline" size={20} color="#fff" />
                      ) : (
                        <Ionicons name="send" size={20} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#7B61FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  chatButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
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
    minHeight: 400,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E026D",
  },
  demoNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  demoText: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
  },
  messagesContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  emptyChat: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 15,
    marginBottom: 12,
    maxWidth: "80%",
  },
  messageBubbleOther: {
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
    borderTopLeftRadius: 4,
  },
  messageBubbleOwn: {
    backgroundColor: "#7B61FF",
    alignSelf: "flex-end",
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  messageTextOwn: {
    color: "white",
  },
  messageTime: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  messageTimeOwn: {
    color: "rgba(255, 255, 255, 0.7)",
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
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#7B61FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
});