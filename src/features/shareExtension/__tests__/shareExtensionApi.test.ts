// MMKV is a native module — back it with an in-memory map so the pure logic
// in the share-extension modules can run under jest.
const mockStore = new Map<string, string>();
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: (key: string) => mockStore.get(key),
    set: (key: string, value: string) => mockStore.set(key, value),
    delete: (key: string) => mockStore.delete(key),
  })),
  Mode: { MULTI_PROCESS: 1 },
}));

import {
  extractSharedUrl,
  isSupportedSocialUrl,
} from "../shareExtensionApi";
import {
  appendPendingImportId,
  readPendingImportIds,
  removePendingImportId,
  readSharedSession,
  writeSharedSession,
  clearSharedSession,
  clearPendingSharedUrl,
  readPendingSharedImages,
  readPendingSharedUrl,
  writePendingSharedImages,
  writePendingSharedUrl,
} from "../sharedStorage";

beforeEach(() => mockStore.clear());

describe("isSupportedSocialUrl", () => {
  it.each([
    "https://www.tiktok.com/@user/video/123",
    "https://vm.tiktok.com/ZM6/",
    "https://instagram.com/reel/C0abc/",
    "https://www.facebook.com/reel/123",
    "https://fb.watch/xyz/",
    "https://youtube.com/watch?v=1",
    "https://youtu.be/abc",
    "https://pinterest.com/pin/123",
  ])("accepts %s", (url) => {
    expect(isSupportedSocialUrl(url)).toBe(true);
  });

  it.each([
    "https://eviltiktok.com/x",
    "https://tiktok.com.evil.io/x",
    "not a url",
  ])("rejects %s", (url) => {
    expect(isSupportedSocialUrl(url)).toBe(false);
  });
});

describe("extractSharedUrl", () => {
  it("chooses a supported URL instead of an unrelated first link", () => {
    expect(
      extractSharedUrl({
        url: "https://a.com",
        text: "Creator site https://b.com then https://youtu.be/recipe",
      })
    ).toBe("https://youtu.be/recipe");
  });

  it("falls back to a URL inside shared text", () => {
    expect(
      extractSharedUrl({ text: "Check this out! https://vm.tiktok.com/X/" })
    ).toBe("https://vm.tiktok.com/X/");
  });

  it("returns null when nothing is shared", () => {
    expect(extractSharedUrl({})).toBeNull();
  });
});

describe("sharedStorage — pending import ids", () => {
  it("appends, dedupes, and removes ids", () => {
    appendPendingImportId("a");
    appendPendingImportId("b");
    appendPendingImportId("a");
    expect(readPendingImportIds()).toEqual(["a", "b"]);

    removePendingImportId("a");
    expect(readPendingImportIds()).toEqual(["b"]);
  });

  it("keeps a larger durable reconciliation backlog", () => {
    for (let i = 0; i < 115; i++) appendPendingImportId(`id-${i}`);
    const ids = readPendingImportIds();
    expect(ids).toHaveLength(100);
    expect(ids[0]).toBe("id-15");
  });
});

describe("sharedStorage — session", () => {
  it("round-trips a session and stamps updatedAt", () => {
    writeSharedSession({
      accessToken: "at",
      refreshToken: "rt",
      expiresAt: 1234,
    });
    const session = readSharedSession();
    expect(session?.accessToken).toBe("at");
    expect(session?.refreshToken).toBe("rt");
    expect(session?.expiresAt).toBe(1234);
    expect(typeof session?.updatedAt).toBe("number");
  });

  it("returns null after clearing and on malformed payloads", () => {
    writeSharedSession({ accessToken: "x", refreshToken: "y", expiresAt: 1 });
    clearSharedSession();
    expect(readSharedSession()).toBeNull();

    mockStore.set("supabase.sharedSession", "{not json");
    expect(readSharedSession()).toBeNull();
  });
});

describe("sharedStorage — resumable share payloads", () => {
  it("round-trips a URL across sign-in", () => {
    writePendingSharedUrl("https://youtu.be/recipe");
    expect(readPendingSharedUrl()?.url).toBe("https://youtu.be/recipe");
    clearPendingSharedUrl();
    expect(readPendingSharedUrl()).toBeNull();
  });

  it("caps shared screenshots to the supported maximum", () => {
    writePendingSharedImages(["1", "2", "3", "4", "5", "6"]);
    expect(readPendingSharedImages()?.paths).toEqual(["1", "2", "3", "4", "5"]);
  });
});
