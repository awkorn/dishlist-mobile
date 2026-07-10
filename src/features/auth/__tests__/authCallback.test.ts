import { parseAuthCallback } from "../services/authCallback";

describe("parseAuthCallback", () => {
  it("parses an implicit recovery callback from the URL fragment", () => {
    expect(
      parseAuthCallback(
        "dishlist://reset-password#access_token=access&refresh_token=refresh&type=recovery"
      )
    ).toEqual({
      kind: "tokens",
      accessToken: "access",
      refreshToken: "refresh",
      isRecovery: true,
    });
  });

  it("parses a PKCE recovery callback", () => {
    expect(
      parseAuthCallback("dishlist://reset-password?code=auth-code")
    ).toEqual({
      kind: "code",
      code: "auth-code",
      isRecovery: true,
    });
  });

  it("surfaces an expired callback error", () => {
    expect(
      parseAuthCallback(
        "dishlist://reset-password?error=access_denied&error_description=Email+link+is+invalid+or+has+expired"
      )
    ).toEqual({
      kind: "error",
      message: "Email link is invalid or has expired",
      isRecovery: true,
    });
  });

  it("rejects an incomplete token callback", () => {
    expect(
      parseAuthCallback("dishlist://reset-password#access_token=access")
    ).toEqual({
      kind: "error",
      message: "Email link is invalid or has expired",
      isRecovery: true,
    });
  });

  it("ignores unrelated deep links", () => {
    expect(parseAuthCallback("dishlist://invite/invite-token")).toEqual({
      kind: "none",
    });
  });
});
