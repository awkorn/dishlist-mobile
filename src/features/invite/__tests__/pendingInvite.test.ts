import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  extractInviteToken,
  captureInviteLink,
  getPendingInvite,
  setPendingInvite,
  clearPendingInvite,
} from '../services/pendingInvite';

// Explicit stateless mock so assertions don't depend on a stateful store.
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const STORAGE_KEY = 'pendingInviteToken';

describe('extractInviteToken', () => {
  it('extracts the token from the dishlist:// scheme', () => {
    expect(extractInviteToken('dishlist://invite/abc123')).toBe('abc123');
  });

  it('extracts the token from an expo dev-client style URL', () => {
    expect(extractInviteToken('exp://127.0.0.1:19000/--/invite/tok-9')).toBe(
      'tok-9'
    );
  });

  it('extracts the token from an https universal link', () => {
    expect(extractInviteToken('https://dishlist.app/invite/xyz')).toBe('xyz');
  });

  it('ignores query strings and fragments', () => {
    expect(extractInviteToken('dishlist://invite/tok?ref=x#frag')).toBe('tok');
  });

  it('url-decodes the token', () => {
    expect(extractInviteToken('dishlist://invite/a%20b')).toBe('a b');
  });

  it('returns null for non-invite links', () => {
    expect(extractInviteToken('dishlist://recipe/123')).toBeNull();
    expect(extractInviteToken('dishlist://home')).toBeNull();
    expect(extractInviteToken('')).toBeNull();
  });
});

describe('pending invite storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes the token under the pending-invite key', async () => {
    await setPendingInvite('tok-1');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'tok-1');
  });

  it('reads the token back from storage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('tok-1');
    expect(await getPendingInvite()).toBe('tok-1');
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('captures an invite link by storing its token', async () => {
    await captureInviteLink('dishlist://invite/tok-2');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'tok-2');
  });

  it('does not write anything for a non-invite link', async () => {
    await captureInviteLink('dishlist://recipe/9');
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('clears the pending token', async () => {
    await clearPendingInvite();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('swallows storage errors when reading', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    expect(await getPendingInvite()).toBeNull();
  });
});
