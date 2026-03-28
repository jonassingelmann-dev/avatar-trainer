/**
 * Web stub for @livekit/react-native.
 * On web, we use livekit-client directly (no native WebRTC bindings needed).
 * This file is automatically resolved instead of @livekit/react-native on web.
 */

// registerGlobals is a no-op on web — livekit-client handles WebRTC natively in browsers
export function registerGlobals() {
  // No-op on web
}

// VideoTrack is not used on web (we use a <video> element directly)
export const VideoTrack = null;
