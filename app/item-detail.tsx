import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, Modal } from "react-native";
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
  const [conversations, setConversations] = useState<string[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // Calculate if current user owns this item
  const isOwnItem = currentUserEmail === item?.user_email;

  // Fetch conversations when owner opens chat
  useEffect(() => {
    if (showChat && !isHardcoded && currentUserEmail && item?.user_email && isOwnItem) {
      fetchConversations();
    }
  }, [showChat, isOwnItem, currentUserEmail, item]);

  // Fetch messages when chat is opened and setup real-time subscription
  useEffect(() => {
    if (showChat && !isHardcoded && currentUserEmail && item?.user_email) {
      if (!isOwnItem || (isOwnItem && selectedConversation)) {
        fetchMessages();
      }
      
      // Subscribe to new messages for this item
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
              // If owner and selected conversation, only show messages from that person
              if (isOwnItem && selectedConversation) {
                if (newMessage.sender_email === selectedConversation || newMessage.receiver_email === selectedConversation) {
                  setMessages((prev) => {
                    if (prev.some(msg => msg.id === newMessage.id)) {
                      return prev;
                    }
                    return [...prev, newMessage];
                  });
                  setTimeout(scrollToBottom, 100);
                }
              } else if (!isOwnItem) {
                // For non-owners, show all their messages
                setMessages((prev) => {
                  if (prev.some(msg => msg.id === newMessage.id)) {
                    return prev;
                  }
                  return [...prev, newMessage];
                });
                setTimeout(scrollToBottom, 100);
              }
              
              // Update conversations list for owner
              if (isOwnItem && newMessage.sender_email !== currentUserEmail) {
                setConversations((prev) => {
                  if (!prev.includes(newMessage.sender_email)) {
                    return [...prev, newMessage.sender_email];
                  }
                  return prev;
                });
              }
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
  }, [showChat, id, currentUserEmail, item, selectedConversation, isOwnItem]);

  const fetchConversations = async () => {
    if (!currentUserEmail || !item?.user_email || isHardcoded || !isOwnItem) {
      return;
    }

    console.log("Fetching conversations for owner:", currentUserEmail);

    // Fetch all unique users who have messaged about this item
    const { data, error } = await supabase
      .from("messages")
      .select("sender_email, receiver_email")
      .eq("item_id", id)
      .or(`sender_email.eq.${currentUserEmail},receiver_email.eq.${currentUserEmail}`);

    if (error) {
      console.error("Fetch conversations error:", error);
    } else {
      // Extract unique user emails (excluding the owner)
      const uniqueUsers = new Set<string>();
      data?.forEach((msg) => {
        if (msg.sender_email !== currentUserEmail) {
          uniqueUsers.add(msg.sender_email);
        }
        if (msg.receiver_email !== currentUserEmail) {
          uniqueUsers.add(msg.receiver_email);
        }
      });
      console.log("Found conversations with:", Array.from(uniqueUsers));
      setConversations(Array.from(uniqueUsers));
    }
  };

  const fetchMessages = async () => {
    if (!currentUserEmail || !item?.user_email || isHardcoded) {
      console.log("Cannot fetch messages:", {
        currentUserEmail,
        itemUserEmail: item?.user_email,
        isHardcoded
      });
      return;
    }

    // If owner, fetch messages with selected conversation partner
    // If not owner, fetch messages with item owner
    const otherUserEmail = isOwnItem ? selectedConversation : item.user_email;
    
    if (!otherUserEmail) {
      console.log("No conversation partner selected");
      return;
    }

    console.log("Fetching messages for item:", id);
    console.log("Between users:", currentUserEmail, "and", otherUserEmail);

    // Fetch all messages between current user and the other user for this specific item
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("item_id", id)
      .or(`and(sender_email.eq.${currentUserEmail},receiver_email.eq.${otherUserEmail}),and(sender_email.eq.${otherUserEmail},receiver_email.eq.${currentUserEmail})`)
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

    // Determine the receiver email
    const receiverEmail = isOwnItem ? selectedConversation : item.user_email;

    if (!receiverEmail) {
      Alert.alert("Error", "No conversation selected!");
      return;
    }

    if (currentUserEmail === receiverEmail) {
      Alert.alert("Notice", "You cannot chat with yourself!");
      return;
    }

    setLoading(true);

    const newMessage = {
      item_id: id,
      sender_email: currentUserEmail,
      receiver_email: receiverEmail,
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

  const deleteItem = async () => {
    if (isHardcoded) {
      Alert.alert(
        "Demo Mode",
        "This is a hardcoded item and cannot be deleted.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            
            try {
              // First delete all messages associated with this item
              const { error: messagesError } = await supabase
                .from("messages")
                .delete()
                .eq("item_id", id);

              if (messagesError) {
                console.error("Error deleting messages:", messagesError);
                Alert.alert("Error", "Failed to delete item messages. Please try again.");
                setDeleting(false);
                return;
              }

              // Then delete the item itself
              const { error: itemError } = await supabase
                .from("items")
                .delete()
                .eq("id", id);

              if (itemError) {
                console.error("Error deleting item:", itemError);
                Alert.alert("Error", "Failed to delete item. Please try again.");
                setDeleting(false);
                return;
              }

              // Navigate away immediately to prevent accessing deleted item data
              const navigateAway = () => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)");
                }
              };

              // Navigate first, then show success message
              navigateAway();
              
              // Small delay to ensure navigation happens first
              setTimeout(() => {
                Alert.alert("Success", "Item deleted successfully!");
              }, 300);
            } catch (error) {
              console.error("Unexpected error:", error);
              Alert.alert("Error", "An unexpected error occurred. Please try again.");
              setDeleting(false);
            }
          }
        }
      ]
    );
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
          {/* Back Button and Delete Button Row */}
          <View style={styles.topButtonsRow}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)");
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#4B0082" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            
            {isOwnItem && (
              <TouchableOpacity 
                style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]} 
                onPress={deleteItem}
                disabled={deleting}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.deleteButtonText}>
                  {deleting ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Item Image - Tappable to expand */}
          <TouchableOpacity 
            style={styles.imageContainer}
            onPress={() => setImageModalVisible(true)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.image || item.photo_url }} style={styles.image} />
            <View style={styles.expandHint}>
              <Ionicons name="expand-outline" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Image Modal for Full Screen View */}
          <Modal
            visible={imageModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setImageModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Ionicons name="close-circle" size={40} color="#fff" />
              </TouchableOpacity>
              <Image 
                source={{ uri: item.image || item.photo_url }} 
                style={styles.modalImage}
                resizeMode="contain"
              />
            </View>
          </Modal>

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
              <Text style={styles.time}>
                🕐 {item.created_at ? formatTime(item.created_at) : (item.time || "Recently listed")}
              </Text>
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
              onPress={() => {
                setShowChat(true);
              }}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              <Text style={styles.chatButtonText}>
                {isOwnItem ? "View Messages" : "Chat with Owner"}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.chatContainer}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatTitle}>
                  {isOwnItem 
                    ? (selectedConversation 
                        ? `Chat with ${selectedConversation.split("@")[0]}` 
                        : "Your Messages")
                    : `Chat with ${item.user_email?.split("@")[0]}`
                  }
                </Text>
                <TouchableOpacity onPress={() => {
                  setShowChat(false);
                  setSelectedConversation(null);
                  setMessages([]);
                }}>
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
              ) : isOwnItem && !selectedConversation ? (
                // Show conversation list for owner
                <View style={styles.conversationList}>
                  {conversations.length === 0 ? (
                    <View style={styles.emptyChat}>
                      <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
                      <Text style={styles.emptyText}>No messages yet</Text>
                      <Text style={styles.emptySubtext}>
                        When someone messages you about this item, you'll see them here
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.conversationListTitle}>
                        People interested in this item:
                      </Text>
                      {conversations.map((userEmail) => (
                        <TouchableOpacity
                          key={userEmail}
                          style={styles.conversationItem}
                          onPress={() => {
                            setSelectedConversation(userEmail);
                          }}
                        >
                          <View style={styles.conversationAvatar}>
                            <Ionicons name="person" size={24} color="#7B61FF" />
                          </View>
                          <View style={styles.conversationInfo}>
                            <Text style={styles.conversationName}>
                              {userEmail.split("@")[0]}
                            </Text>
                            <Text style={styles.conversationEmail}>{userEmail}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </View>
              ) : (
                <>
                  {/* Show back button if owner is viewing a conversation */}
                  {isOwnItem && selectedConversation && (
                    <TouchableOpacity
                      style={styles.backToListButton}
                      onPress={() => {
                        setSelectedConversation(null);
                        setMessages([]);
                      }}
                    >
                      <Ionicons name="arrow-back" size={20} color="#7B61FF" />
                      <Text style={styles.backToListText}>Back to conversations</Text>
                    </TouchableOpacity>
                  )}

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
  topButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    fontSize: 16,
    color: "#4B0082",
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
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
    position: "relative",
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 15,
  },
  expandHint: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
    borderRadius: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  modalImage: {
    width: "100%",
    height: "100%",
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
    textAlign: "center",
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
  conversationList: {
    flex: 1,
  },
  conversationListTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  conversationEmail: {
    fontSize: 13,
    color: "#6B7280",
  },
  backToListButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  backToListText: {
    fontSize: 14,
    color: "#7B61FF",
    fontWeight: "600",
  },
});