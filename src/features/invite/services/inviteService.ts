import { api } from '@services/api';
import type {
  SendInviteData,
  SendInviteResponse,
  GenerateLinkResponse,
  InviteValidationResponse,
  AcceptInviteResponse,
  CollaboratorsResponse,
} from '../types';

export const inviteService = {
  /**
   * Send invite to mutual(s) - creates notification + invite record
   */
  async sendInvites(data: SendInviteData): Promise<SendInviteResponse> {
    const response = await api.post<SendInviteResponse>(
      `/invites/dishlist/${data.dishListId}/send`,
      { recipientIds: data.recipientIds }
    );
    return response.data;
  },

  /**
   * Generate a shareable invite link
   */
  async generateInviteLink(dishListId: string): Promise<GenerateLinkResponse> {
    const response = await api.post<GenerateLinkResponse>(
      `/invites/dishlist/${dishListId}/link`
    );
    return response.data;
  },

  /**
   * Validate an invite token (for landing screen)
   */
  async validateInvite(token: string): Promise<InviteValidationResponse> {
    const response = await api.post<InviteValidationResponse>(
      `/invites/${token}/validate`
    );
    return response.data;
  },

  /**
   * Accept an invite via token
   */
  async acceptInvite(token: string): Promise<AcceptInviteResponse> {
    const response = await api.post<AcceptInviteResponse>(
      `/invites/${token}/accept`
    );
    return response.data;
  },

  /**
   * Decline an invite via token
   */
  async declineInvite(token: string): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>(
      `/invites/${token}/decline`
    );
    return response.data;
  },

  /**
   * Get collaborators and pending invites for a DishList
   */
  async getCollaborators(dishListId: string): Promise<CollaboratorsResponse> {
    const response = await api.get<CollaboratorsResponse>(
      `/dishlists/${dishListId}/collaborators`
    );
    return response.data;
  },

  /**
   * Remove a collaborator from a DishList
   */
  async removeCollaborator(
    dishListId: string,
    userId: string
  ): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(
      `/dishlists/${dishListId}/collaborators/${userId}`
    );
    return response.data;
  },

  /**
   * Revoke a pending invite
   */
  async revokeInvite(
    dishListId: string,
    inviteId: string
  ): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(
      `/dishlists/${dishListId}/invites/${inviteId}`
    );
    return response.data;
  },

  /**
   * Resend a pending invite notification
   */
  async resendInvite(
    dishListId: string,
    inviteId: string
  ): Promise<{ success: boolean; expiresAt: string }> {
    const response = await api.post<{ success: boolean; expiresAt: string }>(
      `/dishlists/${dishListId}/invites/${inviteId}/resend`
    );
    return response.data;
  },

  /**
   * Generate a shareable invite deep link URL
   */
  generateInviteDeepLink(token: string): string {
    return `dishlist://invite/${token}`;
  },
};