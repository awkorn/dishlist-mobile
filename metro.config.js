// Wraps the default Expo metro config so the share extension gets its own
// entry bundle (index.share.tsx) — required by expo-share-extension.
const { getDefaultConfig } = require("expo/metro-config");
const { withShareExtension } = require("expo-share-extension/metro");

module.exports = withShareExtension(getDefaultConfig(__dirname));
