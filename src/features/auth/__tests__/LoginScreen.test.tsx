import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../screens/LoginScreen';

// Mock the auth context
const mockSignIn = jest.fn();
jest.mock('@providers/AuthProvider/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
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
      <LoginScreen navigation={mockNavigation} />
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
    mockSignIn.mockResolvedValueOnce({ error: 'auth/wrong-password' });

    const { getByPlaceholderText, getByText } = renderLoginScreen();

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(getByText('Incorrect password')).toBeTruthy();
    });
  });

  it('navigates to SignUp screen when link is pressed', () => {
    const { getByText } = renderLoginScreen();

    fireEvent.press(getByText('Sign up'));

    expect(mockNavigate).toHaveBeenCalledWith('SignUp');
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