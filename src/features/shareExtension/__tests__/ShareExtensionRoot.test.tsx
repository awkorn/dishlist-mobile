import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import ShareExtensionRoot from "../ShareExtensionRoot";
import { getShareExtensionAccessToken } from "../sharedAuth";
import { startSocialImport } from "../shareExtensionApi";

jest.mock("expo-share-extension", () => ({
  close: jest.fn(),
  openHostApp: jest.fn(),
}));

jest.mock("../sharedAuth", () => ({
  getShareExtensionAccessToken: jest.fn(),
}));

jest.mock("../shareExtensionApi", () => ({
  extractSharedUrl: ({ url }: { url?: string }) => url ?? null,
  isSupportedSocialUrl: () => true,
  startSocialImport: jest.fn(),
}));

const mockGetAccessToken = getShareExtensionAccessToken as jest.Mock;
const mockStartSocialImport = startSocialImport as jest.Mock;

describe("ShareExtensionRoot authentication recovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refreshes and retries when the API rejects a cached token", async () => {
    mockGetAccessToken
      .mockResolvedValueOnce({ status: "ok", accessToken: "cached" })
      .mockResolvedValueOnce({ status: "ok", accessToken: "refreshed" });
    mockStartSocialImport
      .mockResolvedValueOnce({ status: "auth-failed" })
      .mockResolvedValueOnce({ status: "accepted", importId: "import-1" });

    const { getByLabelText, getByText, unmount } = render(
      <ShareExtensionRoot url="https://instagram.com/reel/example" />
    );

    await waitFor(() => expect(getByText("Import started")).toBeTruthy());
    expect(
      getByText("DishList will notify you when your recipe is ready.")
    ).toBeTruthy();
    expect(getByLabelText("Import started")).toBeTruthy();
    expect(mockGetAccessToken).toHaveBeenNthCalledWith(1);
    expect(mockGetAccessToken).toHaveBeenNthCalledWith(2, {
      forceRefresh: true,
    });
    expect(mockStartSocialImport).toHaveBeenNthCalledWith(1, expect.any(String), "cached");
    expect(mockStartSocialImport).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      "refreshed"
    );
    unmount();
  });

  it("renders the designed failure message and actions", async () => {
    mockGetAccessToken.mockResolvedValue({ status: "error" });

    const { getByText, unmount } = render(
      <ShareExtensionRoot url="https://instagram.com/reel/example" />
    );

    await waitFor(() =>
      expect(getByText("Couldn’t start import")).toBeTruthy()
    );
    expect(
      getByText("DishList couldn't verify your sign-in. Open the app and try again.")
    ).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
    expect(getByText("Try again")).toBeTruthy();
    unmount();
  });
});
