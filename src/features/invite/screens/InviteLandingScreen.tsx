import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User as UserIcon } from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import Button from '@components/ui/Button';
import { inviteService } from '../services/inviteService';
import { useAuth } from '@providers/AuthProvider/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@app-types/navigation';
import type { InviteValidationResponse } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'InviteLanding'>;

type ScreenState =
  | { status: 'loading' }
  | { status: 'valid'; data: InviteValidationResponse }
  | { status: 'error'; code: string; message: string }
  | { status: 'accepting' }
  | { status: 'success'; dishListId: string };

export default function InviteLandingScreen({ route, navigation }: Props) {
  const { token } = route.params;
  const { user } = useAuth();
  const [state, setState] = useState<ScreenState>({ status: 'loading' });

  // Validate invite on mount
  useEffect(() => {
    validateInvite();
  }, [token]);

  const validateInvite = async () => {
    try {
      setState({ status: 'loading' });
      const result = await inviteService.validateInvite(token);

      // Handle edge cases
      if (result.isOwner) {
        setState({
          status: 'error',
          code: 'IS_OWNER',
          message: "You can't collaborate on your own DishList",
        });
        return;
      }

      if (result.isAlreadyCollaborator) {
        // Already a collaborator, navigate directly
        navigation.replace('DishListDetail', { dishListId: result.invite.dishList.id });
        return;
      }

      setState({ status: 'valid', data: result });
    } catch (error: any) {
      const errorCode = error?.response?.data?.code || 'UNKNOWN';
      const errorMessage = error?.response?.data?.error || 'Failed to validate invite';
      setState({ status: 'error', code: errorCode, message: errorMessage });
    }
  };

  const handleAccept = async () => {
    if (state.status !== 'valid') return;

    try {
      setState({ status: 'accepting' });
      const result = await inviteService.acceptInvite(token);
      setState({ status: 'success', dishListId: result.dishListId });

      // Navigate to DishList after short delay
      setTimeout(() => {
        navigation.replace('DishListDetail', { dishListId: result.dishListId });
      }, 1000);
    } catch (error: any) {
      const errorCode = error?.response?.data?.code || 'UNKNOWN';
      const errorMessage = error?.response?.data?.error || 'Failed to accept invite';
      setState({ status: 'error', code: errorCode, message: errorMessage });
    }
  };

  const handleDecline = async () => {
    try {
      await inviteService.declineInvite(token);
      // Navigate to DishLists screen
      navigation.replace('Home');
    } catch (error) {
      // Still navigate away even if decline fails
      navigation.replace('Home');
    }
  };

  const handleGoHome = () => {
    navigation.replace('Home');
  };

  // Loading state
  if (state.status === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Loading invite...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (state.status === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🍽️</Text>
            <Text style={styles.logoText}>DishList</Text>
          </View>

          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>
              {state.code === 'EXPIRED' && 'Invite Expired'}
              {state.code === 'NOT_FOUND' && 'Invite Not Found'}
              {state.code === 'ALREADY_USED' && 'Invite Already Used'}
              {state.code === 'WRONG_USER' && 'Invalid Invite'}
              {state.code === 'IS_OWNER' && 'Your DishList'}
              {!['EXPIRED', 'NOT_FOUND', 'ALREADY_USED', 'WRONG_USER', 'IS_OWNER'].includes(state.code) && 'Something Went Wrong'}
            </Text>
            <Text style={styles.errorMessage}>{state.message}</Text>
          </View>

          <Button title="Go to DishLists" onPress={handleGoHome} style={styles.button} />
        </View>
      </SafeAreaView>
    );
  }

  // Accepting state
  if (state.status === 'accepting') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.loadingText}>Joining DishList...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Success state
  if (state.status === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successText}>You're now a collaborator!</Text>
          <Text style={styles.loadingText}>Opening DishList...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Valid invite state - show accept/decline
  const { invite } = state.data;
  const inviterName = invite.inviter.displayName;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🍽️</Text>
          <Text style={styles.logoText}>DishList</Text>
        </View>

        {/* Invite Message */}
        <View style={styles.inviteContainer}>
          <Text style={styles.inviteText}>
            <Text style={styles.inviterName}>{inviterName}</Text>
            {' invited you to collaborate on'}
          </Text>
          <Text style={styles.inviteText}>
            {'DishList: '}
            <Text style={styles.dishListTitle}>{invite.dishList.title}</Text>
          </Text>
          {invite.dishList.description && (
            <Text style={styles.description}>{invite.dishList.description}</Text>
          )}
        </View>

        {/* Inviter Avatar */}
        <View style={styles.inviterContainer}>
          {invite.inviter.avatarUrl ? (
            <Image source={{ uri: invite.inviter.avatarUrl }} style={styles.inviterAvatar} />
          ) : (
            <View style={styles.inviterAvatarPlaceholder}>
              <UserIcon size={32} color={theme.colors.neutral[400]} />
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Accept Invite"
            onPress={handleAccept}
            style={styles.acceptButton}
          />
          <Button
            title="Decline"
            onPress={handleDecline}
            variant="secondary"
            style={styles.declineButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  logoText: {
    ...typography.heading2,
    color: theme.colors.textPrimary,
  },
  loadingText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    marginTop: theme.spacing.lg,
  },
  inviteContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  inviteText: {
    ...typography.body,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  inviterName: {
    ...typography.body,
    color: theme.colors.textPrimary,
  },
  dishListTitle: {
    ...typography.body,
    color: theme.colors.primary[600],
  },
  description: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  inviterContainer: {
    marginBottom: theme.spacing['3xl'],
  },
  inviterAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.neutral[200],
  },
  inviterAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: theme.spacing.md,
  },
  acceptButton: {
    backgroundColor: theme.colors.primary[500],
  },
  declineButton: {
    backgroundColor: theme.colors.neutral[400],
  },
  button: {
    marginTop: theme.spacing.xl,
    minWidth: 200,
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  errorTitle: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 64,
    color: theme.colors.success[500],
    marginBottom: theme.spacing.lg,
  },
  successText: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
  },
});