import { getAuthErrorMessage } from "../errors";

describe("getAuthErrorMessage", () => {
  it("shows a specific message when a signup username is already taken", () => {
    expect(getAuthErrorMessage("Username already taken")).toEqual({
      message: "That username is taken",
      action: "Please choose another username",
      field: "username",
    });
  });

  it("maps a missing recovery session to a reset-specific message", () => {
    expect(getAuthErrorMessage("Auth session missing!")).toEqual({
      message: "This password reset link is invalid or expired",
      action: "Request a new reset email and open its link on this device",
    });
  });

  it("maps connectivity failures to an actionable message", () => {
    expect(getAuthErrorMessage("Network request failed")).toEqual({
      message: "Unable to connect",
      action: "Check your internet connection and try again",
    });
  });
});
