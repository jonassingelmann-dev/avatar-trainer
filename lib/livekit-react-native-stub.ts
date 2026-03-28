/**
 * Web stub for @livekit/react-native.
 * Metro resolves this file instead of @livekit/react-native on web.
 * All exports are no-ops since livekit-client handles WebRTC natively in browsers.
 */

export function registerGlobals() {
  // No-op on web — browser WebRTC is built-in
}

export const VideoTrack = () => null;
export const AudioTrack = () => null;
export const useRoom = () => ({});
export const useParticipant = () => ({});
export const useLocalParticipant = () => ({});
export const useRemoteParticipant = () => ({});
export const useRemoteParticipants = () => [];
export const useTracks = () => [];
export const useTrackTranscription = () => ({ segments: [] });
export const LiveKitRoom = () => null;
