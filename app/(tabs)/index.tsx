import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { MODE_CONFIG, type SessionMode } from "@/shared/types";

type Session = {
  id: number;
  sessionCode: string;
  title: string;
  description: string | null;
  avatarName: string;
  avatarPreviewUrl: string | null;
  mode: SessionMode;
  isActive: boolean;
  createdAt: Date;
};

export default function TrainerScreen() {
  const router = useRouter();
  const { data: sessions, isLoading, refetch } = trpc.sessions.list.useQuery();
  const deleteSession = trpc.sessions.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const handleDelete = (id: number, title: string) => {
    Alert.alert("Delete Session", `Delete "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteSession.mutate({ id }) },
    ]);
  };

  const getModeIcon = (mode: SessionMode) => {
    const icons: Record<SessionMode, "graduationcap.fill" | "bolt.fill" | "bubble.left.fill" | "play.circle.fill"> = {
      train: "graduationcap.fill",
      challenge: "bolt.fill",
      ask: "bubble.left.fill",
      watch: "play.circle.fill",
    };
    return icons[mode];
  };

  const renderSession = ({ item }: { item: Session }) => {
    const modeConfig = MODE_CONFIG[item.mode];
    return (
      <Pressable
        style={({ pressed }) => [styles.sessionCard, pressed && { opacity: 0.8 }]}
        onPress={() => router.push(("/trainer/session/" + item.id) as any)}
      >
        <View style={[styles.modeBadge, { backgroundColor: modeConfig.color + "22" }]}>
          <IconSymbol name={getModeIcon(item.mode)} size={18} color={modeConfig.color} />
          <Text style={[styles.modeLabel, { color: modeConfig.color }]}>{modeConfig.label}</Text>
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.sessionMeta} numberOfLines={1}>
            {item.avatarName} · {item.sessionCode}
          </Text>
        </View>
        <View style={styles.sessionActions}>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.push(("/trainer/session/" + item.id) as any)}
          >
            <IconSymbol name="square.and.pencil" size={20} color="#8888AA" />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            onPress={() => handleDelete(item.id, item.title)}
          >
            <IconSymbol name="trash.fill" size={20} color="#FF6B6B" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Avatar Trainer</Text>
          <Text style={styles.headerSubtitle}>Manage your learning sessions</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          onPress={() => router.push("/trainer/create" as any)}
        >
          <IconSymbol name="plus" size={20} color="#fff" />
          <Text style={styles.createBtnText}>New</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#5B4FE9" size="large" />
        </View>
      ) : sessions && sessions.length > 0 ? (
        <FlatList
          data={sessions as Session[]}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSession}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <IconSymbol name="sparkles" size={48} color="#5B4FE9" />
          </View>
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first avatar training session to get started
          </Text>
          <Pressable
            style={({ pressed }) => [styles.createBtn, styles.emptyBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.push("/trainer/create" as any)}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Create Session</Text>
          </Pressable>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#F0F0FF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8888AA",
    marginTop: 2,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5B4FE9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  sessionCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#2E2E50",
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 80,
    justifyContent: "center",
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F0F0FF",
  },
  sessionMeta: {
    fontSize: 12,
    color: "#8888AA",
    marginTop: 3,
  },
  sessionActions: {
    flexDirection: "row",
    gap: 4,
  },
  iconBtn: {
    padding: 8,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "#5B4FE922",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8888AA",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
  },
});
