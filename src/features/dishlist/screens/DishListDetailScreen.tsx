import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  Lock,
  Eye,
} from "lucide-react-native";
import { typography } from "@styles/typography";
import { theme } from "@styles/theme";
import RecipeTile from "@features/recipe/components/RecipeTile";
import ActionSheet, { ActionSheetOption } from "@components/ui/ActionSheet";
import { QueryErrorBoundary } from "@providers/ErrorBoundary";
import { DishListDetailScreenProps } from "@app-types/navigation";
import { ImportRecipeModal } from "@features/recipe/components";
import type { ImportRecipeResponse } from "@features/recipe/types";
import { ShareModal } from "@features/share";
import { InviteCollaboratorModal, CollaboratorPreview } from "@features/invite";
import { CollaboratorsModal } from "@features/invite";
import { AnimatedSearchInput } from "@components/ui";
import {
  useDishListDetail,
  useTogglePinDishList,
  useToggleFollowDishList,
  useDeleteDishList,
} from "../hooks";

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

  const {
    dishList,
    filteredRecipes,
    isLoading,
    isFetching,
    isError,
    isRefetching,
    refetch,
  } = useDishListDetail({ dishListId, searchQuery });

  const pinMutation = useTogglePinDishList();
  const followMutation = useToggleFollowDishList();
  const deleteMutation = useDeleteDishList();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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
          onPress: () => setShowImportModal(true),
        },
      );
    }

    // Share - only for PUBLIC dishlists
    if (dishList.visibility === "PUBLIC") {
      options.push({
        title: "Share DishList",
        icon: Share,
        onPress: () => {
          setShowActionSheet(false);

          // Close action sheet first
          // Small delay to allow action sheet to close before opening share modal

          setTimeout(() => setShowShareModal(true), 300);
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
                description: dishList.description,
                visibility: dishList.visibility,
              },
            }),
        },
        {
          title: "Invite Collaborator",
          icon: UserPlus,
          onPress: () => {
            setShowActionSheet(false);
            setTimeout(() => setShowInviteModal(true), 300);
          },
        },
      );
    }

    // Pin toggle - available to everyone
    options.push({
      title: dishList.isPinned ? "Unpin DishList" : "Pin DishList",
      icon: dishList.isPinned ? PinOff : Pin,
      onPress: () =>
        pinMutation.mutate({
          dishListId,
          isPinned: dishList.isPinned,
        }),
    });

    // Follow toggle - only for non-owners
    if (!dishList.isOwner) {
      options.push({
        title: dishList.isFollowing ? "Unfollow DishList" : "Follow DishList",
        icon: dishList.isFollowing ? UserMinus : UserPlus,
        onPress: () =>
          followMutation.mutate({
            dishListId,
            isFollowing: !dishList.isFollowing,
          }),
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
            `Are you sure you want to delete "${dishList.title}"? This will also delete all recipes that are only in this DishList.`,
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
  }, [dishList, navigation, pinMutation, deleteMutation, dishListId]);

  // Loading state
  if (isLoading && !dishList) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Loading DishList...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !dishList) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to load DishList</Text>
          <Text style={styles.errorMessage}>
            Check your connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
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
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              colors={["#2563eb"]}
              tintColor="#2563eb"
            />
          }
        >
          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? "No Recipes Found" : "No Recipes Yet"}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? `No recipes match "${searchQuery}"`
                  : "Add your first recipe to this DishList"}
              </Text>
              {!searchQuery && dishList.isOwner && (
                <TouchableOpacity
                  style={styles.addRecipeButton}
                  onPress={() =>
                    navigation.navigate("AddRecipe", { dishListId })
                  }
                >
                  <Plus size={20} color="white" />
                  <Text style={styles.addRecipeButtonText}>Add Recipe</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.recipeGrid}>
              {filteredRecipes.map((recipe) => (
                <RecipeTile
                  key={recipe.id}
                  recipe={recipe}
                  onPress={() =>
                    navigation.navigate("RecipeDetail", {
                      recipeId: recipe.id,
                      dishListId,
                    })
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Action Sheet */}
        <ActionSheet
          visible={showActionSheet}
          onClose={() => setShowActionSheet(false)}
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
      </SafeAreaView>
    </QueryErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: theme.colors.neutral[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  errorTitle: {
    ...typography.heading3,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    ...typography.button,
    color: "white",
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
    ...typography.heading3,
    fontSize: 28,
    color: theme.colors.textPrimary,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing["4xl"],
  },
  emptyTitle: {
    ...typography.heading3,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  addRecipeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  addRecipeButtonText: {
    ...typography.button,
    color: "white",
  },
  recipeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
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
