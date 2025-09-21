import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  SignUp: undefined;
  
  // Main app screens
  Home: undefined;
  CreateDishList: undefined;
  DishListDetail: {
    dishListId: string;
    dishListTitle?: string;
  };
  EditDishList: {
    dishListId: string;
  };
  AddRecipe: {
    dishListId: string;
  };
  InviteCollaborator: {
    dishListId: string;
  };
  RecipeDetail: {
    recipeId: string;
  };
};

export type DishListDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'DishListDetail'
>;

export type LoginScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Login'
>;

export type SignUpScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'SignUp'
>;