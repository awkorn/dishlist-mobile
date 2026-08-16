const mockStore = new Map<string, string>();

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: (key: string) => mockStore.get(key),
    set: (key: string, value: string) => mockStore.set(key, value),
    delete: (key: string) => mockStore.delete(key),
  })),
  Mode: { MULTI_PROCESS: 1 },
}));

import { getShareExtensionAccessToken } from "../sharedAuth";
import { readSharedSession, writeSharedSession } from "../sharedStorage";

const mockFetch = jest.fn();
const originalFetch = globalThis.fetch;

function response(status: number, body: Record<string, unknown> = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("getShareExtensionAccessToken", () => {
  beforeEach(() => {
    mockStore.clear();
    mockFetch.mockReset();
    globalThis.fetch = mockFetch;
    process.env.EXPO_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("uses a cached token while it is still valid", async () => {
    writeSharedSession({
      accessToken: "cached-access",
      refreshToken: "cached-refresh",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    });

    await expect(getShareExtensionAccessToken()).resolves.toEqual({
      status: "ok",
      accessToken: "cached-access",
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("force-refreshes a valid cached token and persists the rotation", async () => {
    writeSharedSession({
      accessToken: "cached-access",
      refreshToken: "cached-refresh",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    mockFetch.mockResolvedValue(
      response(200, {
        access_token: "new-access",
        refresh_token: "new-refresh",
        expires_in: 3600,
      })
    );

    await expect(
      getShareExtensionAccessToken({ forceRefresh: true })
    ).resolves.toEqual({ status: "ok", accessToken: "new-access" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://project.supabase.co/auth/v1/token?grant_type=refresh_token",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer anon-key",
          apikey: "anon-key",
        }),
      })
    );
    expect(readSharedSession()).toMatchObject({
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
  });

  it("retries a transient refresh failure", async () => {
    jest.useFakeTimers();
    writeSharedSession({
      accessToken: "expired-access",
      refreshToken: "refresh-token",
      expiresAt: 1,
    });
    mockFetch
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(
        response(200, {
          access_token: "retried-access",
          refresh_token: "retried-refresh",
          expires_in: 3600,
        })
      );

    const result = getShareExtensionAccessToken();
    await jest.advanceTimersByTimeAsync(200);

    await expect(result).resolves.toEqual({
      status: "ok",
      accessToken: "retried-access",
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it("treats a rejected refresh token as signed out", async () => {
    writeSharedSession({
      accessToken: "expired-access",
      refreshToken: "rejected-refresh",
      expiresAt: 1,
    });
    mockFetch.mockResolvedValue(response(400));

    await expect(getShareExtensionAccessToken()).resolves.toEqual({
      status: "signed-out",
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
