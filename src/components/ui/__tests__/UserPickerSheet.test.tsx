import React from "react";
import { Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import { UserPickerSheet, type UserPickerUser } from "../UserPickerSheet";

const user: UserPickerUser = {
  uid: "user-1",
  username: "julia",
  firstName: "Julia",
  lastName: "Child",
  avatarUrl: null,
};

const baseProps = {
  visible: true,
  onClose: jest.fn(),
  title: "Share",
  actionLabel: "Send to 1 person",
  onAction: jest.fn(),
  users: [user],
  selectedUserIds: new Set<string>(),
  onToggleUser: jest.fn(),
  searchQuery: "",
  onSearchQueryChange: jest.fn(),
  onShareViaMessage: jest.fn(),
  onCopyLink: jest.fn(),
  emptyTitle: "No Mutuals Yet",
  emptyMessage: "Follow people to share directly.",
};

describe("UserPickerSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders users and delegates selection", () => {
    const { getByLabelText } = render(<UserPickerSheet {...baseProps} />);

    fireEvent.press(getByLabelText("Julia Child"));
    expect(baseProps.onToggleUser).toHaveBeenCalledWith("user-1");
  });

  it("shows the configured action for a selection", () => {
    const { getByText } = render(
      <UserPickerSheet
        {...baseProps}
        selectedUserIds={new Set(["user-1"])}
      />,
    );

    fireEvent.press(getByText("Send to 1 person"));
    expect(baseProps.onAction).toHaveBeenCalledTimes(1);
  });

  it("keeps independent external-action loading indicators", () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <UserPickerSheet {...baseProps} isSharingViaMessage />,
    );

    expect(getByTestId("message-share-loading")).toBeTruthy();
    expect(queryByTestId("copy-link-loading")).toBeNull();

    rerender(<UserPickerSheet {...baseProps} isCopyingLink />);
    expect(getByTestId("copy-link-loading")).toBeTruthy();
    expect(queryByTestId("message-share-loading")).toBeNull();
  });

  it("supports link-only content without rendering the user search", () => {
    const { getByText, queryByLabelText, queryByText } = render(
      <UserPickerSheet
        {...baseProps}
        linkOnlyContent={<Text>Profile link mode</Text>}
      />,
    );

    expect(getByText("Profile link mode")).toBeTruthy();
    expect(queryByLabelText("Search mutuals")).toBeNull();
    expect(queryByText("Send to 1 person")).toBeNull();
  });
});
