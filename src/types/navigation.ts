import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  SignUp: undefined;

  // Main app screens
  Home: undefined;

  // Tab Screens (nested in Home)
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
  };
  InviteCollaborator: {
    dishListId: string;
  };
  RecipeDetail: {
    recipeId: string;
    dishListId?: string;
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
