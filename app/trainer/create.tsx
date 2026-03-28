import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
  FlatList,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { MODE_CONFIG, type SessionMode } from "@/shared/types";

const MODES: SessionMode[] = ["train", "challenge", "ask", "watch"];

export default function CreateSessionScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMode, setSelectedMode] = useState<SessionMode>("train");
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarPage, setAvatarPage] = useState(1);

  const { data: avatarData, isLoading: avatarsLoading } = trpc.heygen.listAvatars.useQuery({ page: avatarPage });
  const createSession = trpc.sessions.create.useMutation({
    onSuccess: (data) => {
      router.replace(("/trainer/session/" + data.id) as any);
    },
    onError: (err) => {
      Alert.alert("Error", err.message);
    },
  });

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter a session title");
      return;
    }
    if (!selectedAvatar) {
      Alert.alert("Required", "Please select an avatar");
      return;
    }
    createSession.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      avatarId: selectedAvatar.id,
      avatarName: selectedAvatar.name,
      avatarPreviewUrl: selectedAvatar.preview_url,
      mode: selectedMode,
      language: "en",
    });
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="arrow.left" size={22} color="#F0F0FF" />
        </Pressable>
        <Text style={styles.headerTitle}>New Session</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Session Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. React Native Basics"
            placeholderTextColor="#8888AA"
            returnKeyType="next"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What will the learner learn?"
            placeholderTextColor="#8888AA"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Mode Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Avatar Mode *</Text>
          <View style={styles.modesGrid}>
            {MODES.map((mode) => {
              const cfg = MODE_CONFIG[mode];
              const isSelected = selectedMode === mode;
              return (
                <Pressable
                  key={mode}
                  style={({ pressed }) => [
                    styles.modeCard,
                    isSelected && { borderColor: cfg.color, backgroundColor: cfg.color + "18" },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => setSelectedMode(mode)}
                >
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
                  <Text style={[styles.modeName, isSelected && { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.modeDesc} numberOfLines={2}>{cfg.description}</Text>
                  {isSelected && (
                    <View style={[styles.modeCheck, { backgroundColor: cfg.color }]}>
                      <IconSymbol name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Avatar Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Avatar *</Text>
          <Pressable
            style={({ pressed }) => [styles.avatarSelector, pressed && { opacity: 0.8 }]}
            onPress={() => setShowAvatarPicker(true)}
          >
            {selectedAvatar ? (
              <View style={styles.selectedAvatarRow}>
                <Image
                  source={{ uri: selectedAvatar.preview_url }}
                  style={styles.avatarThumb}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.avatarName}>{selectedAvatar.name}</Text>
                  <Text style={styles.avatarSub}>Tap to change</Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color="#8888AA" />
              </View>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <IconSymbol name="person.fill" size={24} color="#8888AA" />
                <Text style={styles.avatarPlaceholderText}>Select an Avatar</Text>
                <IconSymbol name="chevron.right" size={18} color="#8888AA" />
              </View>
            )}
          </Pressable>
        </View>

        {/* Create Button */}
        <Pressable
          style={({ pressed }) => [
            styles.createBtn,
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            createSession.isPending && styles.createBtnDisabled,
          ]}
          onPress={handleCreate}
          disabled={createSession.isPending}
        >
          {createSession.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <IconSymbol name="sparkles" size={20} color="#fff" />
              <Text style={styles.createBtnText}>Create Session</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {/* Avatar Picker Modal */}
      <Modal
        visible={showAvatarPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Avatar</Text>
            <Pressable onPress={() => setShowAvatarPicker(false)}>
              <IconSymbol name="xmark" size={22} color="#F0F0FF" />
            </Pressable>
          </View>

          {avatarsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#5B4FE9" size="large" />
            </View>
          ) : (
            <FlatList
              data={avatarData?.results ?? []}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.avatarGrid}
              columnWrapperStyle={{ gap: 10 }}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.avatarGridItem,
                    selectedAvatar?.id === item.id && styles.avatarGridItemSelected,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => {
                    setSelectedAvatar(item);
                    setShowAvatarPicker(false);
                  }}
                >
                  <Image source={{ uri: item.preview_url }} style={styles.avatarGridImage} />
                  <Text style={styles.avatarGridName} numberOfLines={2}>{item.name}</Text>
                  {selectedAvatar?.id === item.id && (
                    <View style={styles.avatarGridCheck}>
                      <IconSymbol name="checkmark.circle.fill" size={22} color="#5B4FE9" />
                    </View>
                  )}
                </Pressable>
              )}
              ListFooterComponent={
                (avatarData as any)?.next ? (
                  <Pressable
                    style={styles.loadMoreBtn}
                    onPress={() => setAvatarPage((p) => p + 1)}
                  >
                    <Text style={styles.loadMoreText}>Load More</Text>
                  </Pressable>
                ) : null
              }
            />
          )}
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8888AA",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2E2E50",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#F0F0FF",
  },
  textarea: {
    minHeight: 80,
    paddingTop: 12,
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
    borderWidth: 1.5,
    borderColor: "#2E2E50",
    position: "relative",
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
    color: "#F0F0FF",
  },
  modeDesc: {
    fontSize: 11,
    color: "#8888AA",
    lineHeight: 15,
  },
  modeCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarSelector: {
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#2E2E50",
    overflow: "hidden",
  },
  selectedAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  avatarThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#252540",
  },
  avatarName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F0F0FF",
  },
  avatarSub: {
    fontSize: 12,
    color: "#8888AA",
    marginTop: 2,
  },
  avatarPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  avatarPlaceholderText: {
    flex: 1,
    fontSize: 15,
    color: "#8888AA",
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5B4FE9",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#0F0F1A",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2E2E50",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarGrid: {
    padding: 16,
    gap: 10,
  },
  avatarGridItem: {
    flex: 1,
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#2E2E50",
    position: "relative",
  },
  avatarGridItemSelected: {
    borderColor: "#5B4FE9",
  },
  avatarGridImage: {
    width: "100%",
    aspectRatio: 0.75,
    backgroundColor: "#252540",
  },
  avatarGridName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F0F0FF",
    padding: 8,
    paddingTop: 6,
  },
  avatarGridCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#0F0F1A",
    borderRadius: 12,
  },
  loadMoreBtn: {
    alignItems: "center",
    paddingVertical: 16,
  },
  loadMoreText: {
    color: "#5B4FE9",
    fontWeight: "600",
    fontSize: 15,
  },
});
