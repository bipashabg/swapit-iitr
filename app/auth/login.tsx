import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useEffect, useState, useRef } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const rotate1 = useRef(new Animated.Value(0)).current;
  const rotate2 = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, { 
      toValue: 1, 
      duration: 800, 
      useNativeDriver: true 
    }).start();

    // Floating animations for background shapes
    Animated.loop(
      Animated.sequence([
        Animated.timing(float1, { 
          toValue: -20, 
          duration: 3000, 
          useNativeDriver: true 
        }),
        Animated.timing(float1, { 
          toValue: 20, 
          duration: 3000, 
          useNativeDriver: true 
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float2, { 
          toValue: 25, 
          duration: 4000, 
          useNativeDriver: true 
        }),
        Animated.timing(float2, { 
          toValue: -25, 
          duration: 4000, 
          useNativeDriver: true 
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float3, { 
          toValue: 15, 
          duration: 3500, 
          useNativeDriver: true 
        }),
        Animated.timing(float3, { 
          toValue: -15, 
          duration: 3500, 
          useNativeDriver: true 
        }),
      ])
    ).start();

    // Rotation animations
    Animated.loop(
      Animated.timing(rotate1, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(rotate2, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Loading dots animation
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotScale, {
            toValue: 1.2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotScale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading]);

  const signIn = async () => {
    try {
      setLoading(true);
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: "reusehub",
        path: "/auth/callback",
      });

      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/(tabs)");
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const rotate1Interpolate = rotate1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotate2Interpolate = rotate2.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <LinearGradient
      colors={["#A78BFA", "#7C3AED", "#4C1D95"]}
      style={styles.container}
    >
      {/* Animated Background Shapes */}
      <Animated.View
        style={[
          styles.bgShape1,
          {
            transform: [
              { translateY: float1 },
              { rotate: rotate1Interpolate }
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgShape2,
          {
            transform: [
              { translateY: float2 },
              { rotate: rotate2Interpolate }
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgShape3,
          {
            transform: [{ translateY: float3 }],
          },
        ]}
      />

      {/* Main Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Floating Icon */}
        <Text style={styles.icon}>🔁</Text>

        {/* App Title */}
        <Text style={styles.title}>SwapIt</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Donate easily. Reuse effortlessly.
        </Text>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.dotsContainer}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    transform: [{ scale: dotScale }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.dot,
                  {
                    transform: [{ scale: dotScale }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.dot,
                  {
                    transform: [{ scale: dotScale }],
                  },
                ]}
              />
            </View>
            <Text style={styles.loadingText}>
              Connecting to Google…
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={signIn}
            style={styles.googleButton}
            activeOpacity={0.8}
          >
            <AntDesign name="google" size={22} color="#DB4437" />
            <Text style={styles.buttonText}>
              Continue with Google
            </Text>
          </TouchableOpacity>
        )}

        {/* Additional Info */}
        <Text style={styles.footerText}>
          Don't let your unused items go to waste.
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  // Animated background shapes
  bgShape1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: 100,
    left: -50,
  },
  bgShape2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    bottom: 150,
    right: -30,
  },
  bgShape3: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    top: 300,
    right: 50,
  },
  content: {
    alignItems: "center",
    zIndex: 1,
  },
  icon: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: "800",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: "#EDE9FE",
    marginBottom: 70,
    marginTop: 8,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    minHeight: 70,
    justifyContent: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "white",
  },
  loadingText: {
    marginTop: 4,
    fontSize: 15,
    color: "#EDE9FE",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 280,
    justifyContent: "center",
  },
  buttonText: {
    color: "#1F2937",
    fontWeight: "700",
    fontSize: 17,
  },
  footerText: {
    marginTop: 30,
    fontSize: 13,
    color: "#E9D5FF",
    opacity: 0.8,
  },
});