import React from 'react';
import { Alert, Clipboard, Share } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInviteCollaborator } from '../hooks/useInviteCollaborator';
import { inviteService } from '../services/inviteService';
import { shareService } from '@features/share/services';
import type { GenerateLinkResponse } from '../types';

jest.mock('../services/inviteService', () => ({
  inviteService: {
    sendInvites: jest.fn(),
    generateInviteLink: jest.fn(),
  },
}));

jest.mock('@features/share/services', () => ({
  shareService: {
    getMutuals: jest.fn(),
  },
}));

const mockInviteService = inviteService as jest.Mocked<typeof inviteService>;
const mockShareService = shareService as jest.Mocked<typeof shareService>;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

const generatedLink: GenerateLinkResponse = {
  success: true,
  token: 'invite-token',
  link: 'dishlist://invite/invite-token',
  expiresAt: '2026-07-16T00:00:00.000Z',
};

describe('useInviteCollaborator external share loading state', () => {
  beforeEach(() => {
    mockShareService.getMutuals.mockResolvedValue([]);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
    jest.spyOn(Clipboard, 'setString').mockImplementation(() => {});
  });

  it('marks only message sharing as busy while its invite link is generated', async () => {
    const linkRequest = deferred<GenerateLinkResponse>();
    mockInviteService.generateInviteLink.mockReturnValueOnce(linkRequest.promise);
    const { result } = renderHook(
      () =>
        useInviteCollaborator({
          dishListId: 'dishlist-1',
          dishListTitle: 'Weeknight Dinners',
        }),
      { wrapper: makeWrapper() }
    );

    let shareOperation!: Promise<void>;
    act(() => {
      shareOperation = result.current.handleShareViaMessage();
    });

    await waitFor(() => expect(result.current.isSharingViaMessage).toBe(true));
    expect(result.current.isCopyingLink).toBe(false);
    expect(result.current.isGeneratingLink).toBe(true);

    act(() => {
      void result.current.handleCopyLink();
    });
    expect(mockInviteService.generateInviteLink).toHaveBeenCalledTimes(1);

    await act(async () => {
      linkRequest.resolve(generatedLink);
      await shareOperation;
    });

    expect(Share.share).toHaveBeenCalledWith({
      message:
        'Join me as a collaborator on "Weeknight Dinners"!\n' + generatedLink.link,
      title: 'Collaborate on Weeknight Dinners',
    });
    expect(result.current.isGeneratingLink).toBe(false);
  });

  it('marks only link copying as busy while its invite link is generated', async () => {
    const linkRequest = deferred<GenerateLinkResponse>();
    mockInviteService.generateInviteLink.mockReturnValueOnce(linkRequest.promise);
    const { result } = renderHook(
      () =>
        useInviteCollaborator({
          dishListId: 'dishlist-1',
          dishListTitle: 'Weeknight Dinners',
        }),
      { wrapper: makeWrapper() }
    );

    let copyOperation!: Promise<void>;
    act(() => {
      copyOperation = result.current.handleCopyLink();
    });

    await waitFor(() => expect(result.current.isCopyingLink).toBe(true));
    expect(result.current.isSharingViaMessage).toBe(false);
    expect(result.current.isGeneratingLink).toBe(true);

    await act(async () => {
      linkRequest.resolve(generatedLink);
      await copyOperation;
    });

    expect(Clipboard.setString).toHaveBeenCalledWith(generatedLink.link);
    expect(result.current.isGeneratingLink).toBe(false);
  });
});
