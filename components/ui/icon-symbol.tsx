// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "minus": "remove",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  "arrow.up": "arrow-upward",
  "arrow.down": "arrow-downward",
  // Trainer
  "person.fill": "person",
  "person.2.fill": "people",
  "square.and.pencil": "edit",
  "trash.fill": "delete",
  "doc.fill": "description",
  "doc.badge.plus": "note-add",
  "folder.fill": "folder",
  "link": "link",
  "square.and.arrow.up": "share",
  "gear": "settings",
  "gear.fill": "settings",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  "info.circle": "info",
  "info.circle.fill": "info",
  "exclamationmark.triangle": "warning",
  "exclamationmark.circle": "error",
  // Avatar modes
  "graduationcap.fill": "school",
  "bolt.fill": "flash-on",
  "bubble.left.fill": "chat",
  "play.circle.fill": "play-circle-filled",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  "mic.fill": "mic",
  "mic.slash.fill": "mic-off",
  "speaker.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
  "video.fill": "videocam",
  "video.slash.fill": "videocam-off",
  // Status
  "clock.fill": "schedule",
  "star.fill": "star",
  "heart.fill": "favorite",
  "bell.fill": "notifications",
  "magnifyingglass": "search",
  "photo.fill": "image",
  "camera.fill": "camera-alt",
  "waveform": "graphic-eq",
  "brain.head.profile": "psychology",
  "list.bullet": "list",
  "rectangle.grid.2x2.fill": "grid-view",
  "ellipsis": "more-horiz",
  "ellipsis.circle": "more-horiz",
  "arrow.clockwise": "refresh",
  "icloud.and.arrow.up": "cloud-upload",
  "icloud.and.arrow.down": "cloud-download",
  "lock.fill": "lock",
  "lock.open.fill": "lock-open",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "qrcode": "qr-code",
  "sparkles": "auto-awesome",
  "trophy.fill": "emoji-events",
  "questionmark.circle.fill": "help",
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
