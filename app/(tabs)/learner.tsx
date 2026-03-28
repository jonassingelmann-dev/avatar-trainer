import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { MODE_CONFIG, type SessionMode } from "@/shared/types";

export default function LearnerScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const getSession = trpc.sessions.getByCode.useQuery(
    { code: code.toLowerCase().trim() },
    { enabled: false }
  );

  const handleJoin = async () => {
    const trimmed = code.toLowerCase().trim();
    if (!trimmed || trimmed.length < 4) {
      setError("Please enter a valid session code");
      return;
    }
    setError("");
    setSearching(true);
    try {
      const result = await getSession.refetch();
      if (result.data) {
        router.push(("/learner/session/" + trimmed) as any);
      } else {
        setError("Session not found. Please check the code and try again.");
      }
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const modeItems: Array<{ mode: SessionMode; desc: string }> = [
    { mode: "train", desc: "Learn from the avatar step by step" },
    { mode: "challenge", desc: "Test your knowledge with quizzes" },
    { mode: "ask", desc: "Ask any question and get answers" },
    { mode: "watch", desc: "Watch a presentation by the avatar" },
  ];

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <IconSymbol name="sparkles" size={40} color="#5B4FE9" />
            </View>
            <Text style={styles.heroTitle}>Join a Session</Text>
            <Text style={styles.heroSubtitle}>
              Enter the session code shared by your trainer to start learning with a live AI avatar
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Session Code</Text>
            <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
              <IconSymbol name="link" size={20} color="#8888AA" />
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(t) => { setCode(t); setError(""); }}
                placeholder="e.g. abc12345"
                placeholderTextColor="#8888AA"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleJoin}
              />
              {code.length > 0 && (
                <Pressable onPress={() => { setCode(""); setError(""); }}>
                  <IconSymbol name="xmark.circle.fill" size={20} color="#8888AA" />
                </Pressable>
              )}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                styles.joinBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                (!code.trim() || searching) && styles.joinBtnDisabled,
              ]}
              onPress={handleJoin}
              disabled={!code.trim() || searching}
            >
              {searching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <IconSymbol name="play.fill" size={18} color="#fff" />
                  <Text style={styles.joinBtnText}>Join Session</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Mode Info */}
          <View style={styles.modesSection}>
            <Text style={styles.sectionTitle}>Available Modes</Text>
            <View style={styles.modesGrid}>
              {modeItems.map(({ mode, desc }) => {
                const cfg = MODE_CONFIG[mode];
                return (
                  <View key={mode} style={styles.modeCard}>
                    <View style={[styles.modeIconBox, { backgroundColor: cfg.color + "22" }]}>
                      <IconSymbol
                        name={
                          mode === "train" ? "graduationcap.fill" :
                          mode === "challenge" ? "bolt.fill" :
                          mode === "ask" ? "bubble.left.fill" :
                          "play.circle.fill"
                        }
                        size={22}
                        color={cfg.color}
                      />
                    </View>
                    <Text style={[styles.modeName, { color: cfg.color }]}>{cfg.label}</Text>
                    <Text style={styles.modeDesc}>{desc}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 28,
  },
  hero: {
    alignItems: "center",
    paddingTop: 32,
    gap: 10,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#5B4FE922",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F0F0FF",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#8888AA",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  inputSection: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8888AA",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2E2E50",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  inputError: {
    borderColor: "#FF6B6B",
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: "#F0F0FF",
    fontWeight: "500",
    letterSpacing: 1,
  },
  errorText: {
    fontSize: 13,
    color: "#FF6B6B",
    marginTop: -4,
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B4FE9",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
  },
  joinBtnDisabled: {
    opacity: 0.5,
  },
  joinBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  modesSection: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  modesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modeCard: {
    width: "47%",
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#2E2E50",
  },
  modeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modeName: {
    fontSize: 14,
    fontWeight: "700",
  },
  modeDesc: {
    fontSize: 12,
    color: "#8888AA",
    lineHeight: 16,
  },
});
