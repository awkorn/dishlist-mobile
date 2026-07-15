import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  MoreHorizontal,
  Pin,
  PinOff,
  Plus,
  Edit3,
  Trash2,
  UserPlus,
  UserMinus,
  Camera,
  Share,
  Flag,
} from "lucide-react-native";
import { typography } from "@styles/typography";
import { theme } from "@styles/theme";
import { getErrorMessage } from "@utils";
import RecipeTile from "@features/recipe/components/RecipeTile";
import ActionSheet, { ActionSheetOption } from "@components/ui/ActionSheet";
import { QueryErrorBoundary } from "@providers/ErrorBoundary";
import { DishListDetailScreenProps } from "@app-types/navigation";
import ImportRecipeModal from "@features/recipe/components/ImportRecipeModal";
import type { ImportRecipeResponse } from "@features/recipe/types";
import { ShareModal } from "@features/share";
import { InviteCollaboratorModal, CollaboratorPreview } from "@features/invite";
import { CollaboratorsModal } from "@features/invite";
import { AnimatedSearchInput, EmptyState, ErrorState } from "@components/ui";
import { ReportContentModal } from "@components/moderation/ReportContentModal";
import Button from "@components/ui/Button";
import {
  useDishListDetail,
  useTogglePinDishList,
  useToggleFollowDishList,
  useDeleteDishList,
} from "../hooks";
import { DishListDetailSkeleton } from "../components/DishListDetailSkeleton";

export default function DishListDetailScreen({
  route,
  navigation,
}: DishListDetailScreenProps) {
  const { dishListId } = route.params;
  const [searchQuery, setSearchQuery] = useState("");
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const actionSheetDismissAction = useRef<(() => void) | null>(null);

  const {
    dishList,
    filteredRecipes,
    isLoading,
    isFetching,
    isError,
    error,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useDishListDetail({ dishListId, searchQuery });

  const pinMutation = useTogglePinDishList();
  const followMutation = useToggleFollowDishList();
  const deleteMutation = useDeleteDishList();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleImportComplete = useCallback(
    (response: ImportRecipeResponse) => {
      // Navigate to AddRecipe with pre-filled data
      navigation.navigate("AddRecipe", {
        dishListId,
        importedRecipe: response.recipe,
        importWarnings: response.warnings,
      });
    },
    [navigation, dishListId],
  );

  const handleActionSheetDismiss = useCallback(() => {
    const dismissAction = actionSheetDismissAction.current;
    actionSheetDismissAction.current = null;
    dismissAction?.();
  }, []);

  const actionSheetOptions: ActionSheetOption[] = useMemo(() => {
    if (!dishList) return [];

    const options: ActionSheetOption[] = [];

    // Add/Import recipes - available to owners and collaborators
    if (dishList.isOwner || dishList.isCollaborator) {
      options.push(
        {
          title: "Add Recipe",
          icon: Plus,
          onPress: () => navigation.navigate("AddRecipe", { dishListId }),
        },
        {
          title: "Import Recipe",
          icon: Camera,
          onPress: () => {
            actionSheetDismissAction.current = () => setShowImportModal(true);
          },
        },
      );
    }

    // Share - only for PUBLIC dishlists
    if (dishList.visibility === "PUBLIC") {
      options.push({
        title: "Share DishList",
        icon: Share,
        onPress: () => {
          actionSheetDismissAction.current = () => setShowShareModal(true);
        },
      });
    }

    // Owner-only options
    if (dishList.isOwner) {
      options.push(
        {
          title: "Edit DishList",
          icon: Edit3,
          onPress: () =>
            navigation.navigate("EditDishList", {
              dishListId,
              dishList: {
                title: dishList.title,
                visibility: dishList.visibility,
              },
            }),
        },
        {
          title: "Invite Collaborator",
          icon: UserPlus,
          onPress: () => {
            actionSheetDismissAction.current = () => setShowInviteModal(true);
          },
        },
      );
    }

    // Pin toggle - available for dishlists in the user's library
    if (
      !dishList.isDefault &&
      (dishList.isOwner || dishList.isCollaborator || dishList.isFollowing)
    ) {
      options.push({
        title: dishList.isPinned ? "Unpin DishList" : "Pin DishList",
        icon: dishList.isPinned ? PinOff : Pin,
        onPress: () =>
          pinMutation.mutate({
            dishListId,
            isPinned: dishList.isPinned,
          }),
      });
    }

    // Follow toggle - only for non-owners
    if (!dishList.isOwner) {
      options.push({
        title: dishList.isFollowing ? "Unfollow DishList" : "Follow DishList",
        icon: dishList.isFollowing ? UserMinus : UserPlus,
        onPress: () =>
          followMutation.mutate({
            dishListId,
            isFollowing: dishList.isFollowing,
          }),
      });

      options.push({
        title: "Report DishList",
        icon: Flag,
        destructive: true,
        onPress: () => {
          actionSheetDismissAction.current = () => setShowReportModal(true);
        },
      });
    }

    // Delete - owner only, destructive
    if (dishList.isOwner && !dishList.isDefault) {
      options.push({
        title: "Delete DishList",
        icon: Trash2,
        destructive: true,
        onPress: () => {
          Alert.alert(
            "Delete DishList",
            `Are you sure you want to delete "${dishList.title}"? Recipes will not be deleted.`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  deleteMutation.mutate(dishListId, {
                    onSuccess: () => navigation.goBack(),
                  });
                },
              },
            ],
          );
        },
      });
    }
    return options;
  }, [
    dishList,
    navigation,
    pinMutation,
    followMutation,
    deleteMutation,
    dishListId,
  ]);

  // Loading state
  if (isLoading && !dishList) {
    return <DishListDetailSkeleton onBack={navigation.goBack} />;
  }

  if (isError || !dishList) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Unable to load DishList"
          message={getErrorMessage(
            error,
            "Check your connection and try again."
          )}
          onRetry={handleRefresh}
        />
      </SafeAreaView>
    );
  }

  return (
    <QueryErrorBoundary
      onRetry={handleRefresh}
      title="Something went wrong"
      message="Unable to display DishList content."
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color={theme.colors.neutral[700]} />
            </TouchableOpacity>
            <AnimatedSearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              prefix="Search"
              keywords={["recipes", "ingredients", "tags"]}
              clearButtonMode="while-editing"
            />
          </View>

          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {dishList.title}
              </Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoText}>
                  {dishList.visibility === "PUBLIC" ? "Public" : "Private"}
                </Text>

                <Text style={styles.infoDot}>•</Text>

                <Text style={styles.infoText}>
                  {dishList.recipeCount}{" "}
                  {dishList.recipeCount === 1 ? "Recipe" : "Recipes"}
                </Text>

                {dishList.visibility === "PUBLIC" &&
                  dishList.followerCount > 0 && (
                    <>
                      <Text style={styles.infoDot}>•</Text>
                      <Text style={styles.infoText}>
                        {dishList.followerCount}{" "}
                        {dishList.followerCount === 1
                          ? "Follower"
                          : "Followers"}
                      </Text>
                    </>
                  )}
              </View>

              <View style={styles.collabRow}>
                <CollaboratorPreview
                  owner={dishList.owner}
                  collaboratorCount={dishList.collaboratorCount}
                  onPress={() => setShowCollaboratorsModal(true)}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowActionSheet(true)}
            >
              <MoreHorizontal size={24} color={theme.colors.neutral[700]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recipe Grid */}
        <FlatList
          style={styles.content}
          contentContainerStyle={[
            styles.scrollContent,
            filteredRecipes.length === 0 && styles.emptyScrollContent,
          ]}
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.recipeRow}
          renderItem={({ item }) => (
            <RecipeTile
              recipe={item}
              onPress={() =>
                navigation.navigate("RecipeDetail", {
                  recipeId: item.id,
                  dishListId,
                })
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary[500]]}
              tintColor={theme.colors.primary[500]}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <EmptyState
              title={searchQuery ? "No Recipes Found" : "No Recipes Yet"}
              message={
                searchQuery
                  ? `No recipes match "${searchQuery}"`
                  : "Add your first recipe to this DishList"
              }
              action={
                !searchQuery && dishList.isOwner ? (
                  <Button
                    title="Add Recipe"
                    size="sm"
                    onPress={() =>
                      navigation.navigate("AddRecipe", { dishListId })
                    }
                    leadingIcon={
                      <Plus size={18} color={theme.colors.onPrimary} />
                    }
                  />
                ) : undefined
              }
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary[500]}
                style={styles.footerLoader}
              />
            ) : null
          }
        />

        {/* Action Sheet */}
        <ActionSheet
          visible={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          onDismiss={handleActionSheetDismiss}
          options={actionSheetOptions}
        />
        <ImportRecipeModal
          visible={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
        />
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareType="dishlist"
          contentId={dishListId}
          contentTitle={dishList?.title || ""}
        />
        {/* Invite Collaborator Modal */}
        {dishList && (
          <InviteCollaboratorModal
            visible={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            dishListId={dishListId}
            dishListTitle={dishList.title}
          />
        )}
        {/* Collaborators Modal */}
        {dishList && (
          <CollaboratorsModal
            visible={showCollaboratorsModal}
            onClose={() => setShowCollaboratorsModal(false)}
            dishListId={dishListId}
            dishListTitle={dishList.title}
          />
        )}
        {dishList && !dishList.isOwner && (
          <ReportContentModal
            visible={showReportModal}
            onClose={() => setShowReportModal(false)}
            targetType="DISHLIST"
            targetId={dishListId}
            targetLabel="DishList"
          />
        )}
      </SafeAreaView>
    </QueryErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  headerTitle: {
    ...typography.editorialNavigationTitle,
    color: theme.colors.textPrimary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: theme.colors.neutral[600],
    fontSize: 15,
  },
  infoDot: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
  menuButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  emptyScrollContent: {
    flexGrow: 1,
    marginBottom: 40,
  },
  recipeRow: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
  },
  collabRow: {
    flexDirection: "row",
  },
  collaboratorButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    gap: 4,

    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  collaboratorText: {
    ...typography.caption,
    color: theme.colors.primary[600],
    fontWeight: "600",
  },
});
