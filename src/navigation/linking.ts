import { LinkingOptions } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { RootStackParamList } from "@app-types/navigation";

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/"), "dishlist://"],
  config: {
    screens: {
      Home: {
        screens: {
          DishListsTab: "home",
        },
      },
      DishListDetail: {
        path: "dishlist/:dishListId",
        parse: {
          dishListId: (dishListId: string) => dishListId,
        },
      },
      RecipeDetail: {
        path: "recipe/:recipeId",
        parse: {
          recipeId: (recipeId: string) => recipeId,
        },
      },
      Profile: {
        path: "profile/:userId",
        parse: {
          userId: (userId: string) => userId,
        },
      },
      InviteLanding: {
        path: "invite/:token",
        parse: {
          token: (token: string) => token,
        },
      },
      Login: "login",
      SignUp: "signup",
    },
  },
};
