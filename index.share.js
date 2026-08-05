// Entry point for the iOS share extension bundle (see metro.config.js).
// The component name MUST be exactly "shareExtension".
import { AppRegistry } from "react-native";
import ShareExtensionRoot from "./src/features/shareExtension/ShareExtensionRoot";

AppRegistry.registerComponent("shareExtension", () => ShareExtensionRoot);
