import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ImportedRecipeData } from "@features/recipe/types";

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  DishListsTab: undefined;
  GroceryTab: undefined;
  SearchTab: undefined;
  BuilderTab: undefined;
  ProfileScreen: undefined;

  CreateDishList:
    | {
        dishListId?: string;
        dishList?: {
          title: string;
          description?: string;
          visibility: "PUBLIC" | "PRIVATE";
        };
      }
    | undefined;
  DishListDetail: {
    dishListId: string;
  };
  EditDishList: {
    dishListId: string;
    dishList: {
      title: string;
      description?: string;
      visibility: "PUBLIC" | "PRIVATE";
    };
  };
  AddRecipe: {
    dishListId: string;
    recipeId?: string;
    recipe?: any;
    importedRecipe?: ImportedRecipeData;
    importWarnings?: string[];
  };
  RecipeDetail: {
    recipeId: string;
    dishListId?: string;
  };
  Profile: { userId: string };
  InviteLanding: {
    token: string;
  };
  FollowersFollowing: {
    userId: string;
    initialTab: "followers" | "following";
    displayName?: string;
  };
};

export type DishListDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "DishListDetail"
>;

export type LoginScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Login"
>;

export type SignUpScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SignUp"
>;
