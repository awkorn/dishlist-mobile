export interface InviteCollaboratorModalProps {
  visible: boolean;
  onClose: () => void;
  dishListId: string;
  dishListTitle: string;
}

export interface SendInviteData {
  dishListId: string;
  recipientIds: string[];
}

export interface SendInviteResponse {
  success: boolean;
  invited: number;
  resent: number;
  alreadyCollaborator: number;
}

export interface GenerateLinkResponse {
  success: boolean;
  token: string;
  link: string;
  expiresAt: string;
}

export interface InviteValidationResponse {
  valid: boolean;
  requiresAuth: boolean;
  isAlreadyCollaborator: boolean;
  isOwner: boolean;
  invite: {
    token: string;
    expiresAt: string;
    dishList: {
      id: string;
      title: string;
      description: string | null;
      visibility: 'PUBLIC' | 'PRIVATE';
    };
    inviter: {
      uid: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      displayName: string;
    };
  };
}

export interface AcceptInviteResponse {
  success: boolean;
  dishListId: string;
  dishListTitle: string;
  message?: string;
}

export interface Collaborator {
  id: string;
  joinedAt: string;
  user: {
    uid: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface PendingInvite {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  user: {
    uid: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface CollaboratorsResponse {
  owner: {
    uid: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  collaborators: Collaborator[];
  pendingInvites: PendingInvite[];
  isOwner: boolean;
  totalCount: number;
}