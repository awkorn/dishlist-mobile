import { signInWithEmail, signUpWithEmail, signOut } from '../services/authService';

// Mock Firebase auth
const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
}));

jest.mock('@services/firebase', () => ({
  auth: { currentUser: null },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('returns user on successful sign in', async () => {
      const mockUser = { uid: 'test-123', email: 'test@example.com' };
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
    });

    it('returns error on failed sign in', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValueOnce({
        code: 'auth/wrong-password',
        message: 'Wrong password',
      });

      const result = await signInWithEmail('test@example.com', 'wrongpassword');

      expect(result.user).toBeNull();
      expect(result.error).toBe('auth/wrong-password');
    });

    it('handles network errors', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValueOnce({
        code: 'auth/network-request-failed',
        message: 'Network error',
      });

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(result.user).toBeNull();
      expect(result.error).toBe('auth/network-request-failed');
    });
  });

  describe('signUpWithEmail', () => {
    it('returns user on successful sign up', async () => {
      const mockUser = { uid: 'new-user-123', email: 'new@example.com' };
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

      const result = await signUpWithEmail('new@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('returns error when email already exists', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce({
        code: 'auth/email-already-in-use',
        message: 'Email already in use',
      });

      const result = await signUpWithEmail('existing@example.com', 'password123');

      expect(result.user).toBeNull();
      expect(result.error).toBe('auth/email-already-in-use');
    });

    it('returns error for weak password', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce({
        code: 'auth/weak-password',
        message: 'Password is too weak',
      });

      const result = await signUpWithEmail('test@example.com', '123');

      expect(result.user).toBeNull();
      expect(result.error).toBe('auth/weak-password');
    });
  });

  describe('signOut', () => {
    it('returns no error on successful sign out', async () => {
      mockSignOut.mockResolvedValueOnce(undefined);

      const result = await signOut();

      expect(result.error).toBeNull();
    });

    it('returns error on failed sign out', async () => {
      mockSignOut.mockRejectedValueOnce(new Error('Sign out failed'));

      const result = await signOut();

      expect(result.error).toBe('Sign out failed');
    });
  });
});