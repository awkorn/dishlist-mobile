import React from "react";
import {
  FlatList,
  RefreshControlProps,
  StyleSheet,
  View,
} from "react-native";
import { theme } from "@styles/theme";
import { DishListTile } from "./DishListTile";
import type { DishList } from "../types";

interface DishListGridProps {
  dishLists: DishList[];
  isFetching?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  ListFooterComponent?: React.ComponentProps<
    typeof FlatList
  >["ListFooterComponent"];
  onEndReached?: () => void;
}

export function DishListGrid({
  dishLists,
  isFetching = false,
  refreshControl,
  ListFooterComponent,
  onEndReached,
}: DishListGridProps) {
  return (
    <FlatList
      data={dishLists}
      keyExtractor={(item) => item.id}
      numColumns={2}
      renderItem={({ item }) => (
        <View style={{ opacity: isFetching ? 0.7 : 1 }}>
          <DishListTile dishList={item} />
        </View>
      )}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      ListFooterComponent={ListFooterComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: "space-between",
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 100,
  },
});
