const mockMMKV = jest.fn(() => {
  throw new Error("MMKV must not be constructed in Expo Go");
});

jest.mock("react-native", () => ({
  NativeModules: {
    NativeUnimoduleProxy: {
      modulesConstants: {
        ExponentConstants: { appOwnership: "expo" },
      },
    },
  },
}));

jest.mock("react-native-mmkv", () => ({
  MMKV: mockMMKV,
  Mode: { MULTI_PROCESS: 1 },
}));

import {
  clearSharedSession,
  readSharedSession,
  writeSharedSession,
} from "../sharedStorage";

describe("sharedStorage in Expo Go", () => {
  it("uses memory storage without constructing the unavailable native module", () => {
    writeSharedSession({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: 123,
    });

    expect(readSharedSession()).toMatchObject({
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: 123,
    });
    expect(mockMMKV).not.toHaveBeenCalled();

    clearSharedSession();
    expect(readSharedSession()).toBeNull();
  });
});
