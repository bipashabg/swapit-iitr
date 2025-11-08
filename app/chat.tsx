import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter, SearchParams } from "expo-router";

interface Message {
  id: string;
  sender_email: string;
  receiver_email: string;
  content: string;
  created_at: string;
}

export default function Chat() {
  const router = useRouter();
  const params = new URLSearchParams() as unknown as { item_id: string; user_email: string };
  const { item_id, user_email: receiverEmail } = params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<FlatList>(null);

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // get logged in user
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserEmail(data.session?.user?.email ?? null);
    });
  }, []);

  // Fetch chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUserEmail) return;
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_email.eq.${currentUserEmail},receiver_email.eq.${receiverEmail}),and(sender_email.eq.${receiverEmail},receiver_email.eq.${currentUserEmail})`
        )
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    };
    fetchMessages();

    // Subscribe to realtime messages
    const subscription = supabase
      .channel(`public:messages:item_id=eq.${item_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `item_id=eq.${item_id}`,
        },
        (payload: { new: Message; }) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUserEmail]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserEmail) return;

    await supabase.from("messages").insert([
      {
        item_id,
        sender_email: currentUserEmail,
        receiver_email: receiverEmail,
        content: newMessage.trim(),
      },
    ]);

    setNewMessage("");
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.sender_email === currentUserEmail;
    return (
      <View style={[styles.message, isMe ? styles.myMessage : styles.otherMessage]}>
        <Text style={{ color: isMe ? "white" : "#2E026D" }}>{item.content}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={scrollRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={{ color: "white", fontWeight: "600" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#7B61FF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  message: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 15,
    marginVertical: 4,
  },
  myMessage: {
    backgroundColor: "#7B61FF",
    alignSelf: "flex-end",
  },
  otherMessage: {
    backgroundColor: "#E5E7EB",
    alignSelf: "flex-start",
  },
  timestamp: {
    fontSize: 10,
    color: "#555",
    marginTop: 2,
    textAlign: "right",
  },
});
