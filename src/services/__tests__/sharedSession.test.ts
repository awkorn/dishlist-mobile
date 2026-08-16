import { AppState } from "react-native";
import { supabase } from "@services/supabase";
import {
  readSharedSession,
  writeSharedSession,
} from "@features/shareExtension/sharedStorage";
import { initSharedSessionSync } from "../sharedSession";

jest.mock("@services/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
      getSession: jest.fn(),
      setSession: jest.fn(),
    },
  },
}));

jest.mock("@features/shareExtension/sharedStorage", () => ({
  clearSharedSession: jest.fn(),
  readSharedSession: jest.fn(),
  writeSharedSession: jest.fn(),
}));

const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;
const mockGetSession = supabase.auth.getSession as jest.Mock;
const mockSetSession = supabase.auth.setSession as jest.Mock;
const mockReadSharedSession = readSharedSession as jest.Mock;
const mockWriteSharedSession = writeSharedSession as jest.Mock;

describe("shared session synchronization", () => {
  it("does not overwrite a newer extension-refreshed session on app launch", async () => {
    const sharedSession = {
      accessToken: "extension-access",
      refreshToken: "extension-refresh",
      expiresAt: 4_000,
      updatedAt: 2_000,
    };
    const localSession = {
      access_token: "stale-app-access",
      refresh_token: "stale-app-refresh",
      expires_at: 3_000,
    };
    let authChangeListener:
      | ((event: string, session: typeof localSession | null) => void)
      | undefined;

    mockReadSharedSession.mockReturnValue(sharedSession);
    mockGetSession.mockResolvedValue({ data: { session: localSession } });
    mockSetSession.mockResolvedValue({ error: null });
    mockOnAuthStateChange.mockImplementation((listener) => {
      authChangeListener = listener;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
    jest
      .spyOn(AppState, "addEventListener")
      .mockReturnValue({ remove: jest.fn() });

    initSharedSessionSync();
    await Promise.resolve();
    await Promise.resolve();
    mockSetSession.mockClear();

    authChangeListener?.("INITIAL_SESSION", localSession);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockWriteSharedSession).not.toHaveBeenCalled();
    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: "extension-access",
      refresh_token: "extension-refresh",
    });
  });
});
