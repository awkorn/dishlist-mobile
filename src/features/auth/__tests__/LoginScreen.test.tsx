import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';
import type { LoginScreenProps } from '@app-types/navigation';

// Mock the auth context
const mockSignIn = jest.fn();
const mockResetPassword = jest.fn();
const mockClearAuthFlowError = jest.fn();
jest.mock('@providers/AuthProvider/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    resetPassword: mockResetPassword,
    authFlowError: null,
    clearAuthFlowError: mockClearAuthFlowError,
    user: null,
    loading: false,
  }),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
};

const renderLoginScreen = () => {
  return render(
    <NavigationContainer>
      <LoginScreen
        navigation={mockNavigation as unknown as LoginScreenProps['navigation']}
      />
    </NavigationContainer>
  );
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    const { getByPlaceholderText, getByText } = renderLoginScreen();

    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
    expect(getByText('Forgot password?')).toBeTruthy();
    expect(getByText('Sign up')).toBeTruthy();
  });

  it('shows error when email is empty', async () => {
    const { getByText } = renderLoginScreen();

    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy();
    });
  });

  it('shows error when password is empty', async () => {
    const { getByPlaceholderText, getByText } = renderLoginScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(getByText('Password is required')).toBeTruthy();
    });
  });

  it('calls signIn with email and password', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null });

    const { getByPlaceholderText, getByText } = renderLoginScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error message on failed login', async () => {
    mockSignIn.mockResolvedValueOnce({ error: 'Invalid login credentials' });

    const { getByPlaceholderText, getByText } = renderLoginScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(getByText('Email or password is incorrect')).toBeTruthy();
    });
  });

  it('navigates to SignUp screen when link is pressed', () => {
    const { getByText } = renderLoginScreen();

    fireEvent.press(getByText('Sign up'));

    expect(mockNavigate).toHaveBeenCalledWith('SignUp');
  });

  it('validates the email before requesting a password reset', async () => {
    const { getByPlaceholderText, getByText } = renderLoginScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'not-an-email');
    fireEvent.press(getByText('Forgot password?'));

    await waitFor(() => {
      expect(getByText('Enter a valid email address')).toBeTruthy();
      expect(mockResetPassword).not.toHaveBeenCalled();
    });
  });

  it('requests a reset and shows a clear success message', async () => {
    mockResetPassword.mockResolvedValueOnce({ error: null });
    const { getByPlaceholderText, getByText } = renderLoginScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), '  Test@Example.com ');
    fireEvent.press(getByText('Forgot password?'));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
      expect(getByText('Check your inbox')).toBeTruthy();
      expect(
        getByText(
          "If an account exists for this email, you'll receive a password reset link shortly."
        )
      ).toBeTruthy();
    });
  });

  it('shows an actionable reset request error', async () => {
    mockResetPassword.mockResolvedValueOnce({
      error: 'Network request failed',
    });
    const { getByPlaceholderText, getByText } = renderLoginScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.press(getByText('Forgot password?'));

    await waitFor(() => {
      expect(getByText('Unable to connect')).toBeTruthy();
      expect(
        getByText('Check your internet connection and try again')
      ).toBeTruthy();
    });
  });

  it('recovers cleanly when the reset request throws', async () => {
    mockResetPassword.mockRejectedValueOnce(new Error('Network request failed'));
    const { getByPlaceholderText, getByText } = renderLoginScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.press(getByText('Forgot password?'));

    await waitFor(() => {
      expect(getByText('Unable to connect')).toBeTruthy();
      expect(getByText('Forgot password?')).toBeTruthy();
    });
  });

  it('clears error when user types in email field', async () => {
    const { getByPlaceholderText, getByText, queryByText } = renderLoginScreen();

    // Trigger email error
    fireEvent.press(getByText('Login'));
    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy();
    });

    // Start typing - error should clear
    fireEvent.changeText(getByPlaceholderText('Email'), 't');

    await waitFor(() => {
      expect(queryByText('Email is required')).toBeNull();
    });
  });
});
