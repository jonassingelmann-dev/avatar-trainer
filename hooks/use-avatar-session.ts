import { useState, useEffect, useRef, useCallback } from "react";

export type AvatarSessionState = "idle" | "connecting" | "connected" | "error";

export interface AvatarSessionOptions {
  livekitUrl: string;
  livekitToken: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: string) => void;
  onVideoTrack?: (track: any) => void;
  onAudioTrack?: (track: any) => void;
}

/**
 * Hook to manage a LiveKit room connection for the HeyGen avatar.
 *
 * Note: On native (iOS/Android), the actual LiveKit connection is handled
 * inside the WebView (see AvatarVideoView). This hook is used on web only.
 * On native, the state is managed via WebView postMessage events.
 */
export function useAvatarSession(options: AvatarSessionOptions | null) {
  const [state, setState] = useState<AvatarSessionState>("idle");
  const [error, setError] = useState<string>("");
  const roomRef = useRef<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const connect = useCallback(async () => {
    if (!options) return;
    if (state === "connecting" || state === "connected") return;

    setState("connecting");
    setError("");

    try {
      // Use livekit-client on all platforms (web uses it directly,
      // native uses it inside WebView via CDN — see avatar-video-view.tsx)
      const { Room, RoomEvent, Track } = await import("livekit-client");

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      room.on(RoomEvent.Connected, () => {
        if (mountedRef.current) {
          setState("connected");
          options.onConnected?.();
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        if (mountedRef.current) {
          setState("idle");
          options.onDisconnected?.();
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track: any, _pub: any, _participant: any) => {
        if (!mountedRef.current) return;
        if (track.kind === Track.Kind.Video) {
          options.onVideoTrack?.(track);
        } else if (track.kind === Track.Kind.Audio) {
          options.onAudioTrack?.(track);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: any) => {
        if (!mountedRef.current) return;
        if (track.detach) track.detach();
      });

      await room.connect(options.livekitUrl, options.livekitToken);
      roomRef.current = room;
    } catch (err: any) {
      if (mountedRef.current) {
        const msg = err.message ?? "Failed to connect";
        setState("error");
        setError(msg);
        options.onError?.(msg);
      }
    }
  }, [options, state]);

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (mountedRef.current) {
      setState("idle");
    }
  }, []);

  // Auto-connect when options are provided
  useEffect(() => {
    if (options && state === "idle") {
      connect();
    }
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [options?.livekitUrl, options?.livekitToken]);

  return {
    state,
    error,
    room: roomRef.current,
    connect,
    disconnect,
  };
}
