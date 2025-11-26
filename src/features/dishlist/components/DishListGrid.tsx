import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import { theme } from "@styles/theme";
import { DishListTile } from "./DishListTile";
import type { DishList } from "../types";

interface DishListGridProps {
  dishLists: DishList[];
  isFetching?: boolean;
}

export function DishListGrid({
  dishLists,
  isFetching = false,
}: DishListGridProps) {
  return (
    <View style={styles.grid}>
      {dishLists.map((dishList) => (
        <Animated.View
          key={dishList.id}
          style={{ opacity: isFetching ? 0.7 : 1 }}
        >
          <DishListTile dishList={dishList} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
  },
});
