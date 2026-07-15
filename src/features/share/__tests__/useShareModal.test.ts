import React from "react";
import { Alert } from "react-native";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useShareModal } from "../hooks/useShareModal";
import { shareService } from "../services/shareService";
import { toast } from "@components/ui/toast";

jest.mock("../services/shareService", () => ({
  shareService: {
    getMutuals: jest.fn(),
    shareDishList: jest.fn(),
    shareRecipe: jest.fn(),
    generateDishListLink: jest.fn(() => "dishlist://dishlist/dl-1"),
    generateRecipeLink: jest.fn(() => "dishlist://recipe/r-1"),
    generateProfileLink: jest.fn(() => "dishlist://profile/u-1"),
  },
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("@components/ui/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockShareService = shareService as jest.Mocked<typeof shareService>;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useShareModal", () => {
  beforeEach(() => {
    mockShareService.getMutuals.mockResolvedValue([]);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("toggles a user id into and out of the selection set", () => {
    const { result } = renderHook(
      () =>
        useShareModal({
          shareType: "dishlist",
          contentId: "dl-1",
          contentTitle: "Weeknight Dinners",
        }),
      { wrapper: makeWrapper() }
    );

    expect(result.current.hasSelection).toBe(false);

    act(() => result.current.toggleUserSelection("u-2"));
    expect(result.current.selectedUserIds.has("u-2")).toBe(true);
    expect(result.current.selectionCount).toBe(1);

    act(() => result.current.toggleUserSelection("u-2"));
    expect(result.current.selectedUserIds.has("u-2")).toBe(false);
    expect(result.current.hasSelection).toBe(false);
  });

  it("dispatches a dishlist share and toasts success", async () => {
    mockShareService.shareDishList.mockResolvedValueOnce({
      success: true,
      notificationsSent: 2,
    });
    const onShareSuccess = jest.fn();

    const { result } = renderHook(
      () =>
        useShareModal({
          shareType: "dishlist",
          contentId: "dl-1",
          contentTitle: "Weeknight Dinners",
          onShareSuccess,
        }),
      { wrapper: makeWrapper() }
    );

    act(() => result.current.toggleUserSelection("u-2"));
    act(() => result.current.handleSendToSelected());

    await waitFor(() => expect(onShareSuccess).toHaveBeenCalled());
    expect(mockShareService.shareDishList).toHaveBeenCalledWith({
      dishListId: "dl-1",
      recipientIds: ["u-2"],
    });
    expect(mockShareService.shareRecipe).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("DishList shared with 2 people");
  });

  it("dispatches a recipe share for recipe content", async () => {
    mockShareService.shareRecipe.mockResolvedValueOnce({
      success: true,
      notificationsSent: 1,
    });

    const { result } = renderHook(
      () =>
        useShareModal({
          shareType: "recipe",
          contentId: "r-1",
          contentTitle: "Carbonara",
        }),
      { wrapper: makeWrapper() }
    );

    act(() => result.current.toggleUserSelection("u-3"));
    act(() => result.current.handleSendToSelected());

    await waitFor(() =>
      expect(mockShareService.shareRecipe).toHaveBeenCalledWith({
        recipeId: "r-1",
        recipientIds: ["u-3"],
      })
    );
  });

  it("alerts a validation message when nothing is selected", () => {
    const { result } = renderHook(
      () =>
        useShareModal({
          shareType: "dishlist",
          contentId: "dl-1",
          contentTitle: "Weeknight Dinners",
        }),
      { wrapper: makeWrapper() }
    );

    act(() => result.current.handleSendToSelected());

    expect(Alert.alert).toHaveBeenCalledWith(
      "No Recipients",
      expect.any(String)
    );
    expect(mockShareService.shareDishList).not.toHaveBeenCalled();
  });

  it("surfaces the server error message on share failure", async () => {
    mockShareService.shareDishList.mockRejectedValueOnce({
      response: { data: { error: "Only public DishLists can be shared" } },
    });

    const { result } = renderHook(
      () =>
        useShareModal({
          shareType: "dishlist",
          contentId: "dl-1",
          contentTitle: "Weeknight Dinners",
        }),
      { wrapper: makeWrapper() }
    );

    act(() => result.current.toggleUserSelection("u-2"));
    act(() => result.current.handleSendToSelected());

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Only public DishLists can be shared"
      )
    );
  });

  it("exposes the mutuals fetch error state", async () => {
    mockShareService.getMutuals.mockReset();
    mockShareService.getMutuals.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(
      () =>
        useShareModal({
          shareType: "dishlist",
          contentId: "dl-1",
          contentTitle: "Weeknight Dinners",
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isMutualsError).toBe(true));
  });
});
