import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from '@app-types/navigation';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    Linking.createURL('/'),
    'dishlist://',
  ],
  config: {
    screens: {
      Home: {
        screens: {
          DishListsTab: 'home',
        },
      },
      DishListDetail: {
        path: 'dishlist/:dishListId',
        parse: {
          dishListId: (dishListId: string) => dishListId,
        },
      },
      RecipeDetail: {
        path: 'recipe/:recipeId',
        parse: {
          recipeId: (recipeId: string) => recipeId,
        },
      },
      Profile: {
        path: 'profile/:userId',
        parse: {
          userId: (userId: string) => userId,
        },
      },
      Login: 'login',
      SignUp: 'signup',
    },
  },
};