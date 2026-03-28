import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Share,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { MODE_CONFIG } from "@/shared/types";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const sessionId = parseInt(id ?? "0");
  const [uploading, setUploading] = useState(false);
  const [buildingContext, setBuildingContext] = useState(false);

  const { data: session, isLoading, refetch } = trpc.sessions.getByCode.useQuery(
    { code: "" },
    { enabled: false }
  );

  // Fetch session by ID via list and find
  const { data: allSessions, isLoading: sessionsLoading, refetch: refetchSessions } =
    trpc.sessions.list.useQuery();
  const currentSession = allSessions?.find((s) => s.id === sessionId);

  const { data: documents, refetch: refetchDocs } = trpc.documents.list.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  const uploadDoc = trpc.documents.upload.useMutation({
    onSuccess: () => refetchDocs(),
    onError: (err) => Alert.alert("Upload Error", err.message),
  });

  const deleteDoc = trpc.documents.delete.useMutation({
    onSuccess: () => refetchDocs(),
  });

  const buildContext = trpc.heygen.buildContext.useMutation({
    onSuccess: () => {
      refetchSessions();
      Alert.alert("Success", "Knowledge base built successfully! The avatar is now ready to use your documents.");
    },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "application/pdf", "application/msword",
               "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploading(true);

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await uploadDoc.mutateAsync({
        sessionId,
        fileName: asset.name,
        fileBase64: base64,
        mimeType: asset.mimeType ?? "application/octet-stream",
        fileSize: asset.size ?? 0,
      });
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleBuildContext = async () => {
    if (!documents || documents.length === 0) {
      Alert.alert("No Documents", "Please upload at least one document first.");
      return;
    }
    setBuildingContext(true);
    try {
      await buildContext.mutateAsync({ sessionId });
    } finally {
      setBuildingContext(false);
    }
  };

  const handleShare = async () => {
    if (!currentSession) return;
    const code = currentSession.sessionCode;
    await Share.share({
      message: `Join my avatar learning session!\n\nSession Code: ${code}\n\nOpen the Avatar Trainer app → Learner tab → Enter code: ${code}`,
      title: `Join: ${currentSession.title}`,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (sessionsLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.center}>
          <ActivityIndicator color="#5B4FE9" size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (!currentSession) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={styles.center}>
          <Text style={styles.errorText}>Session not found</Text>
        </View>
      </ScreenContainer>
    );
  }

  const modeConfig = MODE_CONFIG[currentSession.mode];

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
        <Text style={styles.headerTitle} numberOfLines={1}>{currentSession.title}</Text>
        <Pressable
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.6 }]}
          onPress={handleShare}
        >
          <IconSymbol name="square.and.arrow.up" size={20} color="#5B4FE9" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Session Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.modeBadge, { backgroundColor: modeConfig.color + "22" }]}>
              <IconSymbol
                name={
                  currentSession.mode === "train" ? "graduationcap.fill" :
                  currentSession.mode === "challenge" ? "bolt.fill" :
                  currentSession.mode === "ask" ? "bubble.left.fill" :
                  "play.circle.fill"
                }
                size={16}
                color={modeConfig.color}
              />
              <Text style={[styles.modeBadgeText, { color: modeConfig.color }]}>{modeConfig.label}</Text>
            </View>
            <Text style={styles.avatarName}>{currentSession.avatarName}</Text>
          </View>

          {currentSession.description ? (
            <Text style={styles.description}>{currentSession.description}</Text>
          ) : null}

          {/* Session Code */}
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>Learner Code</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{currentSession.sessionCode}</Text>
              <Pressable onPress={handleShare}>
                <IconSymbol name="square.and.arrow.up" size={18} color="#5B4FE9" />
              </Pressable>
            </View>
            <Text style={styles.codeHint}>Share this code with learners to join the session</Text>
          </View>
        </View>

        {/* Knowledge Base Status */}
        <View style={styles.kbCard}>
          <View style={styles.kbHeader}>
            <View style={styles.kbTitleRow}>
              <IconSymbol name="brain.head.profile" size={20} color="#00C2A8" />
              <Text style={styles.kbTitle}>Knowledge Base</Text>
            </View>
            {currentSession.knowledgeBaseId ? (
              <View style={styles.kbStatusBadge}>
                <IconSymbol name="checkmark.circle.fill" size={14} color="#00C2A8" />
                <Text style={styles.kbStatusText}>Active</Text>
              </View>
            ) : (
              <View style={[styles.kbStatusBadge, styles.kbStatusInactive]}>
                <Text style={[styles.kbStatusText, { color: "#FFB347" }]}>Not built</Text>
              </View>
            )}
          </View>
          <Text style={styles.kbDesc}>
            Upload documents below, then build the knowledge base so the avatar can answer questions based on your content.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.buildBtn,
              pressed && { opacity: 0.85 },
              buildingContext && styles.buildBtnDisabled,
            ]}
            onPress={handleBuildContext}
            disabled={buildingContext}
          >
            {buildingContext ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <IconSymbol name="sparkles" size={16} color="#fff" />
                <Text style={styles.buildBtnText}>
                  {currentSession.knowledgeBaseId ? "Rebuild Knowledge Base" : "Build Knowledge Base"}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Documents */}
        <View style={styles.docsSection}>
          <View style={styles.docsSectionHeader}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <Pressable
              style={({ pressed }) => [styles.uploadBtn, pressed && { opacity: 0.8 }]}
              onPress={handlePickDocument}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#5B4FE9" size="small" />
              ) : (
                <>
                  <IconSymbol name="plus" size={16} color="#5B4FE9" />
                  <Text style={styles.uploadBtnText}>Upload</Text>
                </>
              )}
            </Pressable>
          </View>

          {documents && documents.length > 0 ? (
            documents.map((doc) => (
              <View key={doc.id} style={styles.docItem}>
                <View style={styles.docIcon}>
                  <IconSymbol name="doc.fill" size={20} color="#5B4FE9" />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName} numberOfLines={1}>{doc.fileName}</Text>
                  <Text style={styles.docMeta}>{formatFileSize(doc.fileSize)}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.docDeleteBtn, pressed && { opacity: 0.6 }]}
                  onPress={() =>
                    Alert.alert("Delete Document", `Delete "${doc.fileName}"?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteDoc.mutate({ id: doc.id }) },
                    ])
                  }
                >
                  <IconSymbol name="trash.fill" size={18} color="#FF6B6B" />
                </Pressable>
              </View>
            ))
          ) : (
            <View style={styles.emptyDocs}>
              <IconSymbol name="doc.badge.plus" size={32} color="#8888AA" />
              <Text style={styles.emptyDocsText}>No documents yet</Text>
              <Text style={styles.emptyDocsSubtext}>Upload TXT, PDF, or Word files</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#F0F0FF",
    textAlign: "center",
    marginHorizontal: 8,
  },
  shareBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  infoCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#2E2E50",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  avatarName: {
    fontSize: 14,
    color: "#8888AA",
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: "#8888AA",
    lineHeight: 20,
  },
  codeSection: {
    backgroundColor: "#252540",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8888AA",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#5B4FE9",
    letterSpacing: 3,
  },
  codeHint: {
    fontSize: 11,
    color: "#8888AA",
  },
  kbCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#2E2E50",
  },
  kbHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kbTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  kbTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  kbStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#00C2A822",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  kbStatusInactive: {
    backgroundColor: "#FFB34722",
  },
  kbStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00C2A8",
  },
  kbDesc: {
    fontSize: 13,
    color: "#8888AA",
    lineHeight: 18,
  },
  buildBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00C2A8",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  buildBtnDisabled: {
    opacity: 0.6,
  },
  buildBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  docsSection: {
    gap: 10,
  },
  docsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#5B4FE922",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  uploadBtnText: {
    color: "#5B4FE9",
    fontWeight: "600",
    fontSize: 14,
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#2E2E50",
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#5B4FE922",
    justifyContent: "center",
    alignItems: "center",
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F0F0FF",
  },
  docMeta: {
    fontSize: 12,
    color: "#8888AA",
    marginTop: 2,
  },
  docDeleteBtn: {
    padding: 8,
  },
  emptyDocs: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2E2E50",
    borderStyle: "dashed",
  },
  emptyDocsText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8888AA",
  },
  emptyDocsSubtext: {
    fontSize: 12,
    color: "#8888AA",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
  },
});
