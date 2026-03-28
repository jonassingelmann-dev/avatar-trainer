import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { MODE_CONFIG } from "@/shared/types";
import { AvatarVideoView } from "@/components/avatar-video-view";

type ChatMessage = {
  id: string;
  role: "user" | "avatar";
  text: string;
  timestamp: Date;
};

type SessionState = "idle" | "connecting" | "connected" | "error";

export default function LearnerSessionScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();

  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const { data: session, isLoading: sessionLoading } = trpc.sessions.getByCode.useQuery(
    { code: code ?? "" },
    { enabled: !!code }
  );

  const createTokenMutation = trpc.heygen.createSessionToken.useMutation();
  const startSessionMutation = trpc.heygen.startSession.useMutation();
  const stopSessionMutation = trpc.heygen.stopSession.useMutation();

  const startAvatarSession = useCallback(async () => {
    if (!session) return;
    setSessionState("connecting");
    setErrorMsg("");

    try {
      // Step 1: Create session token
      const tokenResult = await createTokenMutation.mutateAsync({
        avatarId: session.avatarId,
        mode: "FULL",
        systemPrompt: buildSystemPrompt(session),
        contextId: session.knowledgeBaseId ?? undefined,
        voiceId: session.voiceId ?? undefined,
        language: session.language ?? "en",
      });

      setSessionToken(tokenResult.session_token);

      // Step 2: Start session and get LiveKit credentials
      const startResult = await startSessionMutation.mutateAsync({
        sessionToken: tokenResult.session_token,
      });

      setLivekitUrl(startResult.livekit_url);
      setLivekitToken(startResult.livekit_client_token);
      setSessionState("connected");

      // Add welcome message
      const modeConfig = MODE_CONFIG[session.mode];
      setMessages([{
        id: "welcome",
        role: "avatar",
        text: getWelcomeMessage(session.mode, session.title),
        timestamp: new Date(),
      }]);
    } catch (err: any) {
      setSessionState("error");
      setErrorMsg(err.message ?? "Failed to start avatar session");
    }
  }, [session]);

  const stopAvatarSession = useCallback(async () => {
    if (sessionToken) {
      try {
        await stopSessionMutation.mutateAsync({ sessionToken });
      } catch {}
    }
    setSessionState("idle");
    setSessionToken(null);
    setLivekitUrl(null);
    setLivekitToken(null);
  }, [sessionToken]);

  useEffect(() => {
    return () => {
      if (sessionToken) {
        stopSessionMutation.mutate({ sessionToken });
      }
    };
  }, [sessionToken]);

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleEndSession = () => {
    Alert.alert("End Session", "Are you sure you want to end this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Session",
        style: "destructive",
        onPress: async () => {
          await stopAvatarSession();
          router.back();
        },
      },
    ]);
  };

  if (sessionLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.center}>
          <ActivityIndicator color="#5B4FE9" size="large" />
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!session) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.center}>
          <IconSymbol name="exclamationmark.circle" size={48} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Session Not Found</Text>
          <Text style={styles.errorSubtitle}>The code "{code}" doesn't match any session.</Text>
          <Pressable style={styles.backBtn2} onPress={() => router.back()}>
            <Text style={styles.backBtn2Text}>Go Back</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const modeConfig = MODE_CONFIG[session.mode];

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          onPress={sessionState === "connected" ? handleEndSession : () => router.back()}
        >
          <IconSymbol name="xmark" size={20} color="#F0F0FF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{session.title}</Text>
          <View style={[styles.modePill, { backgroundColor: modeConfig.color + "22" }]}>
            <Text style={[styles.modePillText, { color: modeConfig.color }]}>{modeConfig.label}</Text>
          </View>
        </View>
        {sessionState === "connected" && (
          <View style={styles.liveDot}>
            <View style={styles.liveDotInner} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      {sessionState === "idle" || sessionState === "error" ? (
        <View style={styles.startScreen}>
          <View style={styles.avatarPreviewBox}>
            <IconSymbol name="person.fill" size={64} color="#5B4FE9" />
          </View>
          <Text style={styles.startTitle}>{session.avatarName}</Text>
          <Text style={styles.startSubtitle}>
            {modeConfig.description}
          </Text>

          {session.knowledgeBaseId && (
            <View style={styles.kbBadge}>
              <IconSymbol name="brain.head.profile" size={14} color="#00C2A8" />
              <Text style={styles.kbBadgeText}>Knowledge base ready</Text>
            </View>
          )}

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <IconSymbol name="exclamationmark.triangle" size={16} color="#FF6B6B" />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.startBtn,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={startAvatarSession}
          >
            <IconSymbol name="play.fill" size={20} color="#fff" />
            <Text style={styles.startBtnText}>Start Session</Text>
          </Pressable>
        </View>
      ) : sessionState === "connecting" ? (
        <View style={styles.center}>
          <ActivityIndicator color="#5B4FE9" size="large" />
          <Text style={styles.loadingText}>Connecting to avatar...</Text>
          <Text style={styles.loadingSubtext}>Setting up your live session</Text>
        </View>
      ) : (
        // Connected state
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <View style={styles.sessionLayout}>
            {/* Avatar Video */}
            <View style={styles.videoContainer}>
              <AvatarVideoView
                livekitUrl={livekitUrl!}
                livekitToken={livekitToken!}
                sessionToken={sessionToken!}
                mode={session.mode}
                isMuted={isMuted}
              />

              {/* Video Controls Overlay */}
              <View style={styles.videoControls}>
                <Pressable
                  style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
                  onPress={() => setIsMuted((m) => !m)}
                >
                  <IconSymbol
                    name={isMuted ? "mic.slash.fill" : "mic.fill"}
                    size={20}
                    color={isMuted ? "#FF6B6B" : "#fff"}
                  />
                </Pressable>
              </View>
            </View>

            {/* Chat Area */}
            <View style={styles.chatArea}>
              <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.chatScroll}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
              >
                {messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubble,
                      msg.role === "user" ? styles.userBubble : styles.avatarBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.role === "user" ? styles.userText : styles.avatarText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              {/* Input */}
              {(session.mode === "ask" || session.mode === "challenge" || session.mode === "train") && (
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.chatInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={
                      session.mode === "ask" ? "Ask a question..." :
                      session.mode === "challenge" ? "Your answer..." :
                      "Type a message..."
                    }
                    placeholderTextColor="#8888AA"
                    returnKeyType="send"
                    onSubmitEditing={handleSendMessage}
                    multiline={false}
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.sendBtn,
                      !inputText.trim() && styles.sendBtnDisabled,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={handleSendMessage}
                    disabled={!inputText.trim()}
                  >
                    <IconSymbol name="paperplane.fill" size={18} color="#fff" />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </ScreenContainer>
  );
}

function buildSystemPrompt(session: any): string {
  const modePrompts: Record<string, string> = {
    train: `You are a friendly and knowledgeable teacher. Your role is to teach the learner about the topics in the provided knowledge base. Explain concepts clearly, use examples, and check for understanding. Be encouraging and patient.`,
    challenge: `You are a quiz master. Your role is to challenge the learner with questions about the topics in the knowledge base. Ask one question at a time, evaluate their answers, provide feedback, and keep score. Be encouraging but rigorous.`,
    ask: `You are a helpful assistant with expertise in the provided knowledge base. Answer any questions the learner has clearly and accurately. If you don't know something, say so honestly.`,
    watch: `You are a presenter. Give a structured, engaging presentation about the topics in the knowledge base. Speak clearly and cover the key points systematically.`,
  };
  return modePrompts[session.mode] ?? modePrompts.ask;
}

function getWelcomeMessage(mode: string, title: string): string {
  const messages: Record<string, string> = {
    train: `Hello! I'm ready to teach you about "${title}". Let's start learning together! Feel free to ask questions at any time.`,
    challenge: `Welcome to the challenge session for "${title}"! I'll test your knowledge with questions. Ready to begin? Let's see what you know!`,
    ask: `Hi there! I'm your AI assistant for "${title}". Ask me anything about this topic and I'll do my best to help.`,
    watch: `Welcome! I'll be presenting "${title}" for you today. Sit back and enjoy the presentation.`,
  };
  return messages[mode] ?? messages.ask;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  modePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  liveDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FF4444",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  liveDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  liveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  startScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  avatarPreviewBox: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: "#5B4FE922",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#5B4FE9",
  },
  startTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F0F0FF",
    textAlign: "center",
  },
  startSubtitle: {
    fontSize: 14,
    color: "#8888AA",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  kbBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#00C2A822",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  kbBadgeText: {
    fontSize: 13,
    color: "#00C2A8",
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FF6B6B22",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    maxWidth: 300,
  },
  errorBannerText: {
    fontSize: 13,
    color: "#FF6B6B",
    flex: 1,
    lineHeight: 18,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5B4FE9",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 8,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#F0F0FF",
    fontWeight: "600",
  },
  loadingSubtext: {
    fontSize: 13,
    color: "#8888AA",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF6B6B",
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#8888AA",
    textAlign: "center",
  },
  backBtn2: {
    backgroundColor: "#5B4FE9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  backBtn2Text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  sessionLayout: {
    flex: 1,
  },
  videoContainer: {
    height: 280,
    backgroundColor: "#0F0F1A",
    position: "relative",
  },
  videoControls: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  controlBtnActive: {
    backgroundColor: "rgba(255,107,107,0.3)",
    borderColor: "#FF6B6B",
  },
  chatArea: {
    flex: 1,
    backgroundColor: "#0F0F1A",
  },
  chatScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#5B4FE9",
    borderBottomRightRadius: 4,
  },
  avatarBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1A1A2E",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#2E2E50",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: "#fff",
  },
  avatarText: {
    color: "#F0F0FF",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#2E2E50",
    backgroundColor: "#0F0F1A",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#1A1A2E",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#F0F0FF",
    borderWidth: 1,
    borderColor: "#2E2E50",
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#5B4FE9",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
