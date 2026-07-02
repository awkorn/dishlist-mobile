import { getAuthErrorMessage } from "../errors";

describe("getAuthErrorMessage", () => {
  it("shows a specific message when a signup username is already taken", () => {
    expect(getAuthErrorMessage("Username already taken")).toEqual({
      message: "That username is taken",
      action: "Please choose another username",
    });
  });
});
