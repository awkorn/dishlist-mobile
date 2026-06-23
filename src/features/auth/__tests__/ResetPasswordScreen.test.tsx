import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";

const mockUpdateRecoveredPassword = jest.fn();
const mockFinishPasswordRecovery = jest.fn();

jest.mock("@providers/AuthProvider/AuthContext", () => ({
  useAuth: () => ({
    updateRecoveredPassword: mockUpdateRecoveredPassword,
    finishPasswordRecovery: mockFinishPasswordRecovery,
  }),
}));

describe("ResetPasswordScreen", () => {
  beforeEach(() => {
    jest.spyOn(Alert, "alert").mockImplementation(
      (_title, _message, buttons) => buttons?.[0]?.onPress?.()
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("updates the password and finishes recovery", async () => {
    mockUpdateRecoveredPassword.mockResolvedValueOnce({ error: null });
    const { getByPlaceholderText, getByText } = render(
      <ResetPasswordScreen />
    );

    fireEvent.changeText(
      getByPlaceholderText("New password (6+ characters)"),
      "new-password"
    );
    fireEvent.changeText(
      getByPlaceholderText("Confirm new password"),
      "new-password"
    );
    fireEvent.press(getByText("Update Password"));

    await waitFor(() => {
      expect(mockUpdateRecoveredPassword).toHaveBeenCalledWith("new-password");
      expect(mockFinishPasswordRecovery).toHaveBeenCalled();
    });
  });
});
