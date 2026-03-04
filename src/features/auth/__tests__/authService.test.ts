import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
} from '../services/authService';

// Mock Supabase client
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockResetPasswordForEmail = jest.fn();

jest.mock('@services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      signOut: (...args: any[]) => mockSignOut(...args),
      resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
    },
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('returns user on successful sign in', async () => {
      const mockUser = { id: 'test-123', email: 'test@example.com' };
      mockSignInWithPassword.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('returns error message on failed sign in', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await signInWithEmail('test@example.com', 'wrongpassword');

      expect(result.user).toBeNull();
      expect(result.error).toBe('Invalid login credentials');
    });

    it('handles unexpected thrown errors', async () => {
      mockSignInWithPassword.mockRejectedValueOnce(new Error('Network error'));

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.user).toBeNull();
      expect(result.error).toBe('Network error');
    });
  });

  describe('signUpWithEmail', () => {
    it('returns user on successful sign up', async () => {
      const mockUser = { id: 'new-user-123', email: 'new@example.com' };
      mockSignUp.mockResolvedValueOnce({ data: { user: mockUser }, error: null });

      const result = await signUpWithEmail('new@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      });
    });

    it('returns error when email already exists', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const result = await signUpWithEmail('existing@example.com', 'password123');

      expect(result.user).toBeNull();
      expect(result.error).toBe('User already registered');
    });

    it('returns error for weak password', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Password should be at least 6 characters' },
      });

      const result = await signUpWithEmail('test@example.com', '123');

      expect(result.user).toBeNull();
      expect(result.error).toBe('Password should be at least 6 characters');
    });
  });

  describe('signOut', () => {
    it('returns no error on successful sign out', async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });

      const result = await signOut();

      expect(result.error).toBeNull();
    });

    it('returns error message on failed sign out', async () => {
      mockSignOut.mockResolvedValueOnce({ error: { message: 'Sign out failed' } });

      const result = await signOut();

      expect(result.error).toBe('Sign out failed');
    });
  });

  describe('resetPassword', () => {
    it('returns no error on successful password reset request', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });

      const result = await resetPassword('test@example.com');

      expect(result.error).toBeNull();
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('returns error when reset fails', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({
        error: { message: 'Unable to send reset email' },
      });

      const result = await resetPassword('unknown@example.com');

      expect(result.error).toBe('Unable to send reset email');
    });
  });
});
