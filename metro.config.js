const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Only apply NativeWind in development, not during export
const isExport = process.env.EXPO_PUBLIC_EXPORT === "true" || process.argv.includes("export");

if (isExport) {
  module.exports = config;
} else {
  module.exports = withNativeWind(config, {
    input: "./global.css",
    // Force write CSS to file system instead of virtual modules
    // This fixes iOS styling issues in development mode
    forceWriteFileSystem: true,
  });
}
