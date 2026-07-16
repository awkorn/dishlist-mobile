import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { queryKeys } from "@lib/queryKeys";
import { RootStackParamList } from "@app-types/navigation";
import { ErrorState, ScreenHeader, ScreenHeaderAction } from "@components/ui";
import { useNotifications, getSectionTitle } from "../hooks/useNotifications";
import {
  NotificationItem,
  NotificationsEmptyState,
  NotificationSectionHeader,
} from "../components";
import type {
  Notification,
  GroupedNotifications,
  DishListSharedData,
  RecipeSharedData,
  RecipeAddedData,
  RecipeImportCompletedData,
} from "../types";
import { parseNotificationData } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SectionData {
  title: string;
  data: Notification[];
}

/**
 * Convert grouped notifications to SectionList format
 * Only includes sections that have notifications
 */
function buildSections(grouped: GroupedNotifications): SectionData[] {
  const sectionOrder: (keyof GroupedNotifications)[] = [
    "new",
    "today",
    "yesterday",
    "earlier_this_week",
    "earlier",
  ];

  return sectionOrder
    .filter((key) => grouped[key].length > 0)
    .map((key) => ({
      title: getSectionTitle(key, grouped[key].length),
      data: grouped[key],
    }));
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();

  const {
    groupedNotifications,
    hasNotifications,
    isLoading,
    isError,
    isRefetching,
    isFetchingNextPage,
    refetch,
    handleLoadMore,
    handleDelete,
    handleClearAll,
    handleAcceptInvitation,
    handleDeclineInvitation,
    handleMarkAsRead,
    pendingActionId,
    isAccepting,
    isDeclining,
    isClearing,
    handleAcceptFollow,
    handleDeclineFollow,
    isAcceptingFollow,
    isDecliningFollow,
  } = useNotifications();

  // Bottom-tab screens stay mounted after their first visit, so React Query's
  // mount/window-focus settings do not run when the user returns to this tab.
  // Refresh both the list and badge every time Notifications gains focus.
  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    }, [queryClient])
  );

  // Build sections for SectionList
  const sections = useMemo(
    () => buildSections(groupedNotifications),
    [groupedNotifications]
  );

  // Handle notification press (navigate to content)
  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Mark as read when tapped
      if (!notification.isRead) {
        handleMarkAsRead(notification.id);
      }

      // Navigate based on notification type
      switch (notification.type) {
        case "DISHLIST_SHARED": {
          const data = parseNotificationData<DishListSharedData>(
            notification.data
          );
          if (data?.dishListId) {
            navigation.navigate("DishListDetail", {
              dishListId: data.dishListId,
            });
          }
          break;
        }

        case "RECIPE_SHARED": {
          const data = parseNotificationData<RecipeSharedData>(
            notification.data
          );
          if (data?.recipeId) {
            navigation.navigate("RecipeDetail", { recipeId: data.recipeId });
          }
          break;
        }

        case "RECIPE_ADDED": {
          const data = parseNotificationData<RecipeAddedData>(
            notification.data
          );
          if (data?.recipeId) {
            navigation.navigate("RecipeDetail", { recipeId: data.recipeId });
          }
          break;
        }

        case "RECIPE_IMPORT_COMPLETED": {
          const data = parseNotificationData<RecipeImportCompletedData>(
            notification.data
          );
          if (data?.recipeId) {
            navigation.navigate("RecipeDetail", { recipeId: data.recipeId });
          }
          break;
        }
      }
    },
    [navigation, handleMarkAsRead]
  );

  // Handle accept invitation with navigation
  const handleAccept = useCallback(
    async (notificationId: string) => {
      try {
        const result = await handleAcceptInvitation(notificationId);
        if (result?.dishListId) {
          navigation.navigate("DishListDetail", {
            dishListId: result.dishListId,
          });
        }
      } catch (error) {
        // Error handled in hook
      }
    },
    [handleAcceptInvitation, navigation]
  );

  // Render individual notification
  const renderItem = useCallback(
    ({
      item,
      index,
      section,
    }: {
      item: Notification;
      index: number;
      section: SectionData;
    }) => (
      <NotificationItem
        notification={item}
        onDelete={handleDelete}
        onPress={handleNotificationPress}
        onAccept={handleAccept}
        onDecline={handleDeclineInvitation}
        onAcceptFollow={handleAcceptFollow}
        onDeclineFollow={handleDeclineFollow}
        isAccepting={isAccepting && pendingActionId === item.id}
        isDeclining={isDeclining && pendingActionId === item.id}
        isAcceptingFollow={isAcceptingFollow && pendingActionId === item.id}
        isDecliningFollow={isDecliningFollow && pendingActionId === item.id}
        showDivider={index < section.data.length - 1}
      />
    ),
    [
      handleDelete,
      handleNotificationPress,
      handleAccept,
      handleDeclineInvitation,
      handleAcceptFollow,
      handleDeclineFollow,
      pendingActionId,
      isAccepting,
      isDeclining,
      isAcceptingFollow,
      isDecliningFollow,
    ]
  );

  // Render section header
  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => (
      <NotificationSectionHeader title={section.title} />
    ),
    []
  );

  // Key extractor
  const keyExtractor = useCallback((item: Notification) => item.id, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.surface, theme.colors.background]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ paddingTop: insets.top }}
      >
        <ScreenHeader
          title="Notifications"
          titleAlign="left"
          style={styles.header}
          titleStyle={styles.title}
          rightSlot={
            <ScreenHeaderAction
              style={styles.clearAllButton}
              onPress={handleClearAll}
              disabled={!hasNotifications || isClearing}
              accessibilityRole="button"
              accessibilityLabel="Clear all notifications"
              accessibilityState={{ disabled: !hasNotifications || isClearing }}
            >
              {isClearing ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.onPrimary}
                />
              ) : (
                <Text
                  style={[
                    styles.clearAllText,
                    !hasNotifications && styles.clearAllTextDisabled,
                  ]}
                >
                  Clear All
                </Text>
              )}
            </ScreenHeaderAction>
          }
        />
      </LinearGradient>

      {/* Notification List */}
      {hasNotifications ? (
        <SectionList
          sections={sections}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={keyExtractor}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[theme.colors.primary[500]]}
              tintColor={theme.colors.primary[500]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                style={styles.footerLoader}
                size="small"
                color={theme.colors.primary[500]}
              />
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      ) : isError ? (
        <ErrorState
          title="Couldn't Load Notifications"
          message="Please check your connection and try again."
          onRetry={() => refetch()}
        />
      ) : (
        <NotificationsEmptyState />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    minHeight: theme.layout.pageHeaderMinHeight,
    backgroundColor: "transparent",
  },
  title: {
    ...typography.pageTitle,
    color: theme.colors.textPrimary,
  },
  clearAllButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    minWidth: 80,
    alignItems: "center",
  },
  clearAllText: {
    ...typography.button,
    fontSize: 16,
    color: theme.colors.primary[500],
  },
  clearAllTextDisabled: {
    color: theme.colors.neutral[500],
  },
  listContent: {
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: theme.spacing.lg,
  },
});
