import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { SearchDishListTile } from "../components/SearchDishListTile";
import type { SearchDishList } from "../types";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock("expo-image", () => ({
  Image: require("react-native").Image,
}));

const dishList: SearchDishList = {
  id: "dishlist-1",
  title: "Alex's Meal Prep",
  visibility: "PUBLIC",
  recipeCount: 12,
  followerCount: 4,
  owner: {
    uid: "user-1",
    username: "alex",
    firstName: "Alex",
    lastName: "Korn",
    avatarUrl: "https://example.com/alex.jpg",
  },
  isFollowing: false,
  isCollaborator: false,
  score: 100,
};

describe("SearchDishListTile", () => {
  it("shows the title, owner avatar and name, and recipe count", () => {
    const { getByLabelText, getByText } = render(
      <SearchDishListTile dishList={dishList} />,
    );

    expect(getByText("Alex's Meal Prep")).toBeTruthy();
    expect(getByText("Alex Korn")).toBeTruthy();
    expect(getByLabelText("Alex Korn avatar")).toBeTruthy();
    expect(getByText("12 recipes")).toBeTruthy();
  });

  it("uses singular recipe copy and calls the supplied press handler", () => {
    const onPress = jest.fn();
    const { getByLabelText, getByText } = render(
      <SearchDishListTile
        dishList={{ ...dishList, recipeCount: 1 }}
        onPress={onPress}
      />,
    );

    expect(getByText("1 recipe")).toBeTruthy();
    fireEvent.press(
      getByLabelText("Alex's Meal Prep by Alex Korn, 1 recipe"),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
