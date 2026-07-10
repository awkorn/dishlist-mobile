import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ProfileSkeleton } from "../components/ProfileSkeleton";

describe("ProfileSkeleton", () => {
  it("announces the loading state and keeps back navigation available", () => {
    const onBack = jest.fn();
    const { getByLabelText, getByRole } = render(
      <ProfileSkeleton onBack={onBack} />,
    );

    expect(getByRole("progressbar")).toBeTruthy();
    expect(getByLabelText("Loading profile")).toBeTruthy();

    fireEvent.press(getByLabelText("Go back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
