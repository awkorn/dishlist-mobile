import React, { useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, X } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { RootStackParamList } from "@app-types/navigation";
import { useSearch } from "../hooks/useSearch";
import {
  SearchTabs,
  UserResultItem,
  SearchRecipeTile,
  SearchDishListTile,
  SearchSection,
  SearchEmptyState,
} from "../components";
import type { SearchTab, SearchUser, SearchRecipe, SearchDishList } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get("window");
const GRID_TILE_WIDTH = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    query,
    debouncedQuery,
    activeTab,
    users,
    recipes,
    dishLists,
    hasResults,
    isEmpty,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    setQuery,
    setActiveTab,
    clearSearch,
  } = useSearch();

  // Handle tab change with navigation to filtered tab
  const handleTabChange = useCallback(
    (tab: SearchTab) => {
      setActiveTab(tab);
    },
    [setActiveTab]
  );

  // Navigate to filtered tab from ALL tab section arrows
  const handleSeeAllUsers = useCallback(() => {
    setActiveTab("users");
  }, [setActiveTab]);

  const handleSeeAllRecipes = useCallback(() => {
    setActiveTab("recipes");
  }, [setActiveTab]);

  const handleSeeAllDishLists = useCallback(() => {
    setActiveTab("dishlists");
  }, [setActiveTab]);

  // Render ALL tab content (sections with horizontal scroll)
  const renderAllTabContent = () => {
    if (!debouncedQuery) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Search for users, recipes, or DishLists
          </Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      );
    }

    if (isEmpty) {
      return <SearchEmptyState query={debouncedQuery} />;
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Users Section */}
        <SearchSection
          title="Users"
          onSeeAll={users.length > 0 ? handleSeeAllUsers : undefined}
          isEmpty={users.length === 0}
        >
          {users.slice(0, 10).map((user) => (
            <View key={user.uid} style={styles.horizontalUserItem}>
              <UserResultItem user={user} />
            </View>
          ))}
        </SearchSection>

        {/* Recipes Section */}
        <SearchSection
          title="Recipes"
          onSeeAll={recipes.length > 0 ? handleSeeAllRecipes : undefined}
          isEmpty={recipes.length === 0}
        >
          {recipes.slice(0, 10).map((recipe) => (
            <SearchRecipeTile key={recipe.id} recipe={recipe} compact />
          ))}
        </SearchSection>

        {/* DishLists Section */}
        <SearchSection
          title="DishLists"
          onSeeAll={dishLists.length > 0 ? handleSeeAllDishLists : undefined}
          isEmpty={dishLists.length === 0}
        >
          {dishLists.slice(0, 10).map((dishList) => (
            <SearchDishListTile key={dishList.id} dishList={dishList} compact />
          ))}
        </SearchSection>
      </ScrollView>
    );
  };

  // Render USERS tab content (vertical list)
  const renderUsersTabContent = () => {
    if (!debouncedQuery) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Search for users</Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      );
    }

    if (users.length === 0) {
      return <SearchEmptyState query={debouncedQuery} />;
    }

    return (
      <FlatList<SearchUser>
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => <UserResultItem user={item} />}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              style={styles.footerLoader}
              color={theme.colors.primary[500]}
            />
          ) : null
        }
      />
    );
  };

  // Render RECIPES tab content (grid)
  const renderRecipesTabContent = () => {
    if (!debouncedQuery) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Search for recipes</Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      );
    }

    if (recipes.length === 0) {
      return <SearchEmptyState query={debouncedQuery} />;
    }

    return (
      <FlatList<SearchRecipe>
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.gridTile}>
            <SearchRecipeTile recipe={item} />
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              style={styles.footerLoader}
              color={theme.colors.primary[500]}
            />
          ) : null
        }
      />
    );
  };

  // Render DISHLISTS tab content (grid)
  const renderDishListsTabContent = () => {
    if (!debouncedQuery) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Search for DishLists</Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      );
    }

    if (dishLists.length === 0) {
      return <SearchEmptyState query={debouncedQuery} />;
    }

    return (
      <FlatList<SearchDishList>
        data={dishLists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.gridTile}>
            <SearchDishListTile dishList={item} />
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              style={styles.footerLoader}
              color={theme.colors.primary[500]}
            />
          ) : null
        }
      />
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "all":
        return renderAllTabContent();
      case "users":
        return renderUsersTabContent();
      case "recipes":
        return renderRecipesTabContent();
      case "dishlists":
        return renderDishListsTabContent();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search
          size={20}
          color={theme.colors.neutral[500]}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={theme.colors.neutral[400]}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <X size={18} color={theme.colors.neutral[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <SearchTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xl,
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.md,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing["3xl"],
  },
  placeholderText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing["4xl"],
  },
  listContent: {
    paddingBottom: theme.spacing["4xl"],
  },
  gridContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing["4xl"],
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  gridTile: {
    width: GRID_TILE_WIDTH,
  },
  footerLoader: {
    paddingVertical: theme.spacing.xl,
  },
  horizontalUserItem: {
    width: 200,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
});