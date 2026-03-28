import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SessionMode } from "@/shared/types";
import { getAvatarWebViewHtml } from "@/lib/avatar-webview-html";

interface AvatarVideoViewProps {
  livekitUrl: string;
  livekitToken: string;
  sessionToken: string;
  mode: SessionMode;
  isMuted?: boolean;
}

/**
 * AvatarVideoView renders the live HeyGen avatar via LiveKit.
 *
 * On native (iOS/Android): Uses a WebView with livekit-client via CDN.
 *   This avoids the need for @livekit/react-native native linking,
 *   making it compatible with Expo Go and standard APK builds.
 *
 * On web: Uses livekit-client directly with a <video> element.
 */
export function AvatarVideoView({
  livekitUrl,
  livekitToken,
  sessionToken,
  mode,
  isMuted = false,
}: AvatarVideoViewProps) {
  if (Platform.OS === "web") {
    return (
      <AvatarVideoWeb
        livekitUrl={livekitUrl}
        livekitToken={livekitToken}
        sessionToken={sessionToken}
        mode={mode}
        isMuted={isMuted}
      />
    );
  }

  return (
    <AvatarVideoNative
      livekitUrl={livekitUrl}
      livekitToken={livekitToken}
      sessionToken={sessionToken}
      mode={mode}
      isMuted={isMuted}
    />
  );
}

// ─── Native Implementation (WebView) ─────────────────────────────────────────

function AvatarVideoNative({
  livekitUrl,
  livekitToken,
  isMuted = false,
}: AvatarVideoViewProps) {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const webViewRef = useRef<any>(null);

  // Dynamically import WebView to avoid issues if not installed
  const [WebViewComponent, setWebViewComponent] = useState<any>(null);

  useEffect(() => {
    import("react-native-webview").then((mod) => {
      setWebViewComponent(() => mod.WebView);
    }).catch(() => {
      setStatus("error");
      setErrorMsg("WebView not available on this device");
    });
  }, []);

  const html = getAvatarWebViewHtml(livekitUrl, livekitToken, isMuted);

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "connected" || msg.type === "videoStarted") {
        setStatus("connected");
      } else if (msg.type === "error") {
        setStatus("error");
        setErrorMsg(msg.message || "Connection failed");
      } else if (msg.type === "disconnected") {
        setStatus("loading");
      }
    } catch (_) {}
  };

  if (!WebViewComponent) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#5B4FE9" size="large" />
        <Text style={styles.connectingText}>Loading avatar...</Text>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.container}>
        <View style={styles.errorBox}>
          <IconSymbol name="exclamationmark.triangle" size={28} color="#FF6B6B" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebViewComponent
        ref={webViewRef}
        source={{ html }}
        style={styles.webView}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        onMessage={handleMessage}
        onError={(e: any) => {
          setStatus("error");
          setErrorMsg(e.nativeEvent?.description || "WebView error");
        }}
      />
      {status === "loading" && (
        <View style={[styles.overlay, StyleSheet.absoluteFillObject]}>
          <ActivityIndicator color="#5B4FE9" size="large" />
          <Text style={styles.connectingText}>Connecting to avatar...</Text>
        </View>
      )}
    </View>
  );
}

// ─── Web Implementation ───────────────────────────────────────────────────────

function AvatarVideoWeb({
  livekitUrl,
  livekitToken,
  isMuted,
}: AvatarVideoViewProps) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const roomRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      try {
        const { Room, RoomEvent, Track } = await import("livekit-client");

        const room = new Room({ adaptiveStream: true });
        roomRef.current = room;

        room.on(RoomEvent.TrackSubscribed, (track: any) => {
          if (!mounted) return;
          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current);
            setConnected(true);
          } else if (track.kind === Track.Kind.Audio) {
            track.attach();
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track: any) => {
          if (track.detach) track.detach();
        });

        room.on(RoomEvent.Disconnected, () => {
          if (mounted) setConnected(false);
        });

        await room.connect(livekitUrl, livekitToken);
      } catch (err: any) {
        if (mounted) setError(err.message ?? "Connection failed");
      }
    };

    connect();

    return () => {
      mounted = false;
      roomRef.current?.disconnect();
    };
  }, [livekitUrl, livekitToken]);

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorBox}>
          <IconSymbol name="exclamationmark.triangle" size={28} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* @ts-ignore - web video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          backgroundColor: "#0F0F1A",
        }}
      />
      {!connected && (
        <View style={[styles.overlay, StyleSheet.absoluteFillObject]}>
          <ActivityIndicator color="#5B4FE9" size="large" />
          <Text style={styles.connectingText}>Connecting to avatar...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F1A",
    justifyContent: "center",
    alignItems: "center",
  },
  webView: {
    flex: 1,
    width: "100%",
    backgroundColor: "#0F0F1A",
  },
  overlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F1A",
    gap: 12,
  },
  connectingText: {
    color: "#8888AA",
    fontSize: 14,
    marginTop: 8,
  },
  errorBox: {
    alignItems: "center",
    gap: 10,
    padding: 20,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 13,
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 18,
  },
});
