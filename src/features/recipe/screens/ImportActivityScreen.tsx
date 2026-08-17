import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, RotateCcw, X } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RootStackParamList } from "@app-types/navigation";
import { ScreenHeader, ScreenHeaderAction } from "@components/ui";
import { queryKeys } from "@lib/queryKeys";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { recipeService } from "../services";
import type { SocialImportStatus } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ImportActivity">;

const PLATFORM_LABELS: Record<SocialImportStatus["platform"], string> = {
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  YOUTUBE: "YouTube",
  PINTEREST: "Pinterest",
};

function statusCopy(record: SocialImportStatus): string {
  switch (record.status) {
    case "PENDING":
      return record.phase === "RETRY_SCHEDULED" ? "Retrying shortly" : "Waiting to start";
    case "PROCESSING":
      return {
        FETCHING_POST: "Reading post",
        EXTRACTING_CAPTION: "Reading caption",
        CHECKING_RECIPE_LINK: "Checking recipe link",
        READING_POST_IMAGES: "Reading post images",
        ANALYZING_VIDEO: "Analyzing video",
        MODERATING: "Checking content",
        SAVING: "Saving recipe",
        CANCELLING: "Cancelling",
      }[record.phase] ?? "Importing recipe";
    case "COMPLETED":
      return "Added to My Recipes";
    case "REVIEW_REQUIRED":
      return "Added—review recommended";
    case "FAILED":
      return record.errorMessage ?? "Import failed";
    case "CANCELLED":
      return "Cancelled";
  }
}

export default function ImportActivityScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const imports = useQuery({
    queryKey: queryKeys.socialImports.activity(),
    queryFn: () => recipeService.getSocialImports(),
    staleTime: 10_000,
    refetchInterval: (query) =>
      query.state.data?.some(
        (item) => item.status === "PENDING" || item.status === "PROCESSING"
      )
        ? 3500
        : false,
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.socialImports.all });
  const retry = useMutation({
    mutationFn: recipeService.retrySocialImport,
    onSuccess: refresh,
  });
  const cancel = useMutation({
    mutationFn: recipeService.cancelSocialImport,
    onSuccess: refresh,
  });

  const renderItem = ({ item }: { item: SocialImportStatus }) => {
    const active = item.status === "PENDING" || item.status === "PROCESSING";
    const canView = Boolean(item.recipeId);
    return (
      <Pressable
        style={styles.card}
        disabled={!canView}
        onPress={() =>
          item.recipeId && navigation.navigate("RecipeDetail", { recipeId: item.recipeId })
        }
        accessibilityRole={canView ? "button" : undefined}
        accessibilityLabel={`${PLATFORM_LABELS[item.platform]} import. ${statusCopy(item)}`}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.platform}>{PLATFORM_LABELS[item.platform]}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
        <Text style={styles.recipeTitle}>{item.recipeTitle ?? "Shared recipe"}</Text>
        <View style={styles.statusRow}>
          {active && <ActivityIndicator size="small" color={theme.colors.primary[500]} />}
          <Text
            style={[
              styles.status,
              item.status === "FAILED" && styles.failed,
              item.status === "REVIEW_REQUIRED" && styles.review,
            ]}
          >
            {statusCopy(item)}
          </Text>
        </View>
        {item.warnings.length > 0 && (
          <Text style={styles.warningText} numberOfLines={2}>
            {item.warnings.join(" • ")}
          </Text>
        )}
        {(active || item.status === "FAILED" || item.status === "CANCELLED") && (
          <View style={styles.actions}>
            {active ? (
              <Pressable
                style={styles.actionButton}
                onPress={() => cancel.mutate(item.importId)}
                accessibilityRole="button"
                accessibilityLabel="Cancel import"
              >
                <X size={16} color={theme.colors.neutral[700]} />
                <Text style={styles.actionText}>Cancel</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.actionButton}
                onPress={() => retry.mutate(item.importId)}
                accessibilityRole="button"
                accessibilityLabel="Retry import"
              >
                <RotateCcw size={16} color={theme.colors.primary[500]} />
                <Text style={[styles.actionText, styles.retryText]}>Retry</Text>
              </Pressable>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Import Activity"
        leftSlot={
          <ScreenHeaderAction onPress={navigation.goBack} accessibilityLabel="Go back">
            <ChevronLeft size={24} color={theme.colors.neutral[700]} />
          </ScreenHeaderAction>
        }
      />
      <Text style={styles.intro}>
        Social imports keep running even if you close DishList. Activity is retained for 30 days.
      </Text>
      <FlatList
        data={imports.data ?? []}
        keyExtractor={(item) => item.importId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={imports.isRefetching}
            onRefresh={() => void imports.refetch()}
            tintColor={theme.colors.primary[500]}
          />
        }
        ListEmptyComponent={
          imports.isLoading ? (
            <ActivityIndicator style={styles.empty} color={theme.colors.primary[500]} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No imports yet</Text>
              <Text style={styles.emptyText}>Share a supported social post to DishList to start one.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  intro: {
    ...typography.body,
    color: theme.colors.neutral[600],
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  list: { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing["3xl"], gap: 12 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between" },
  platform: { ...typography.caption, color: theme.colors.primary[600], fontWeight: "700" },
  date: { ...typography.caption, color: theme.colors.neutral[500] },
  recipeTitle: { ...typography.navigationTitle, color: theme.colors.textPrimary, marginTop: 7 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 7 },
  status: { ...typography.body, color: theme.colors.neutral[600], flexShrink: 1 },
  failed: { color: theme.colors.errorText },
  review: { color: theme.colors.warning },
  warningText: { ...typography.caption, color: theme.colors.neutral[600], marginTop: 8 },
  actions: { flexDirection: "row", marginTop: 12 },
  actionButton: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 7, paddingRight: 16 },
  actionText: { ...typography.body, color: theme.colors.neutral[700], fontWeight: "600" },
  retryText: { color: theme.colors.primary[500] },
  empty: { marginTop: 90, alignItems: "center", paddingHorizontal: 32 },
  emptyTitle: { ...typography.navigationTitle, color: theme.colors.textPrimary },
  emptyText: { ...typography.body, textAlign: "center", color: theme.colors.neutral[500], marginTop: 8 },
});
