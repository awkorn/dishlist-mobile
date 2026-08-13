import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RecipeTile } from "@features/recipe";
import { RootStackParamList } from "@app-types/navigation";
import type { SearchRecipe } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SearchRecipeTileProps {
  recipe: SearchRecipe;
  onPress?: () => void;
}

export function SearchRecipeTile({ recipe, onPress }: SearchRecipeTileProps) {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("RecipeDetail", { recipeId: recipe.id });
    }
  };

  return <RecipeTile recipe={recipe} onPress={handlePress} />;
}
