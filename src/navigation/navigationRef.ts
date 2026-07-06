import { createNavigationContainerRef } from "@react-navigation/native";
import { RootStackParamList } from "@app-types/navigation";

// Root navigation ref, used for imperative navigation from outside a navigator
// (e.g. routing to a pending invite once auth completes).
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
