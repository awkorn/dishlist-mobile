import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@services/supabase";
import { User } from "@app-types";
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as authSignOut,
  resetPassword as authResetPassword,
  updateRecoveredPassword as authUpdateRecoveredPassword,
} from "@features/auth/services";
import type { SignUpResult } from "@features/auth/types";
import api from "@services/api";
import { queryKeys } from "@lib/queryKeys";
import { unregisterCurrentDevicePushToken } from "@features/notifications/services/pushService";
import { captureInviteLink } from "@features/invite/services/pendingInvite";
import type { UserProfile } from "@features/profile/types";
import { parseAuthCallback } from "@features/auth/services/authCallback";
import { getAuthErrorMessage } from "@lib/errors";

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: User | null;
  syncUserProfile: (profile: UserProfile) => void;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    userData: Partial<User>
  ) => Promise<SignUpResult>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateRecoveredPassword: (
    password: string
  ) => Promise<{ error: string | null }>;
  isPasswordRecovery: boolean;
  finishPasswordRecovery: () => Promise<void>;
  authFlowError: string | null;
  clearAuthFlowError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [authFlowError, setAuthFlowError] = useState<string | null>(null);
  const authOperationRef = useRef<"signup" | "callback" | null>(null);
  const authenticatedUserIdRef = useRef<string | null>(null);
  authenticatedUserIdRef.current = user?.id ?? null;

  const registerUserProfile = useCallback(
    async (authUser: SupabaseUser, userData?: Partial<User>) => {
      const metadata = authUser.user_metadata ?? {};
      const response = await api.post("/users/register", {
        email: authUser.email,
        username: userData?.username ?? metadata.username,
        firstName: userData?.firstName ?? metadata.firstName,
        lastName: userData?.lastName ?? metadata.lastName,
      });
      setUserProfile(response.data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
    },
    [queryClient]
  );

  // Fetch the backend user record for the current session and store it.
  const loadUserProfile = useCallback(
    async (authUser?: SupabaseUser) => {
      try {
        const response = await api.get("/users/me");
        setUserProfile(response.data.user);
      } catch (err: any) {
        if (
          err?.response?.status === 403 &&
          err?.response?.data?.code === "ACCOUNT_SUSPENDED"
        ) {
          await supabase.auth.signOut({ scope: "local" });
          setUser(null);
          setUserProfile(null);
          setAuthFlowError(
            "This account has been suspended. Contact DishList support if you believe this is a mistake."
          );
          return;
        }
        // A confirmed signup may have a valid Supabase session before its
        // application profile exists. Finish provisioning from signed metadata.
        if (err?.response?.status === 404 && authUser) {
          try {
            await registerUserProfile(authUser);
          } catch (registrationError: any) {
            await supabase.auth.signOut({ scope: "local" });
            setUser(null);
            setUserProfile(null);
            setAuthFlowError(
              registrationError?.response?.data?.error ||
                "We couldn't finish setting up your account. Please sign up again."
            );
          }
          return;
        }
        console.error("Failed to load user profile:", err);
      }
    },
    [registerUserProfile]
  );

  useEffect(() => {
    let emailSyncTimer: ReturnType<typeof setTimeout> | null = null;
    const handleAuthUrl = async (url: string) => {
      const callback = parseAuthCallback(url);
      if (callback.kind === "none") return false;

      authOperationRef.current = "callback";
      setLoading(true);
      setAuthFlowError(null);

      try {
        if (callback.kind === "error") {
          throw new Error(callback.message);
        }

        const result = callback.kind === "code"
          ? await supabase.auth.exchangeCodeForSession(callback.code)
          : await supabase.auth.setSession({
              access_token: callback.accessToken,
              refresh_token: callback.refreshToken,
            });

        if (result.error) throw result.error;
        const session = result.data.session;
        if (!session?.user) throw new Error("Unable to create a session");

        setUser(session.user);

        if (callback.isRecovery) {
          // A recovery link creates an authenticated Supabase session, but the
          // user must choose a new password before entering the app. Clear any
          // profile/cache from a previous account while that happens.
          setUserProfile(null);
          queryClient.clear();
          setIsPasswordRecovery(true);
        } else {
          await registerUserProfile(session.user);
        }
      } catch (error: any) {
        await supabase.auth.signOut({ scope: "local" });
        setUser(null);
        setUserProfile(null);
        setIsPasswordRecovery(false);
        const errorInfo = getAuthErrorMessage(
          error?.message || "Email link is invalid or has expired"
        );
        setAuthFlowError(
          errorInfo.action
            ? `${errorInfo.message}. ${errorInfo.action}`
            : errorInfo.message
        );
      } finally {
        authOperationRef.current = null;
        setLoading(false);
      }

      return true;
    };

    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      // Stash invite deep links opened while logged out so we can route to them
      // after sign-in (InviteLanding lives in the authenticated stack only).
      if (!authenticatedUserIdRef.current) {
        void captureInviteLink(url);
      }
      void handleAuthUrl(url);
    });

    // 1. Handle an auth link or restore an existing session on mount.
    const initSession = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && (await handleAuthUrl(initialUrl))) {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        console.log("User authenticated:", session.user.email);
        // Restore userProfile too — getSession alone does not populate it,
        // which would otherwise leave it null after every app reload.
        // Fire-and-forget on purpose: app launch (and the routing/isOwnProfile
        // checks) only depend on the local session, so we must NOT block the
        // splash spinner on a network round-trip that could hang when offline.
        void loadUserProfile(session.user);
      } else if (initialUrl) {
        // Cold start from an invite deep link while logged out: stash the token
        // so InviteRedirectHandler can route to it once the user signs in.
        await captureInviteLink(initialUrl);
      }
      setLoading(false);
    };

    void initSession();

    // 2. Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!authOperationRef.current) {
        setUser(session?.user ?? null);
      }

      if (!session?.user) {
        setUserProfile(null);
        setIsPasswordRecovery(false);
        // Wipe all cached data from the previous user so it can't leak
        // into the next session (recipes, dishlists, isOwnProfile, etc.)
        queryClient.clear();
      }

      // Sync email to backend if it changed (e.g. after email confirmation)
      if (_event === "USER_UPDATED" && session?.user?.email) {
        // Supabase warns against awaiting other auth calls from this callback.
        // Deferring also lets the updated access token settle first.
        emailSyncTimer = setTimeout(() => {
          void api
            .patch("/users/me", { email: session.user.email })
            .then((response) => setUserProfile(response.data.user))
            .catch((err) =>
              console.error("Failed to sync email to backend:", err)
            );
        }, 0);
      }
    });

    return () => {
      if (emailSyncTimer) clearTimeout(emailSyncTimer);
      linkingSubscription.remove();
      subscription.unsubscribe();
    };
  }, [loadUserProfile, queryClient, registerUserProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmail(email, password);
      if (result.error) {
        return { error: result.error };
      }

      if (result.user) {
        try {
          await registerUserProfile(result.user);
        } catch (apiError: any) {
          console.log(
            "Backend registration error:",
            apiError.response?.data || apiError.message
          );
          if (
            apiError.response?.status === 400 ||
            apiError.response?.data?.code === "ACCOUNT_SUSPENDED"
          ) {
            await supabase.auth.signOut({ scope: "local" });
            return {
              error:
                (apiError.response?.data?.code === "ACCOUNT_SUSPENDED"
                  ? "This account has been suspended. Contact DishList support if you believe this is a mistake."
                  : apiError.response?.data?.error) ||
                "Account setup failed. Please sign up again.",
            };
          }
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.code || error.message };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<User>
  ) => {
    authOperationRef.current = "signup";
    setAuthFlowError(null);

    try {
      const result = await signUpWithEmail(email, password, userData);
      if (result.error) {
        return { error: result.error };
      }

      // When email confirmation is enabled Supabase intentionally returns no
      // session. Profile creation is completed after the confirmation link
      // establishes a verified session.
      if (!result.session) {
        return { error: null, requiresEmailConfirmation: true };
      }

      if (result.user && result.session) {
        try {
          await registerUserProfile(result.user, userData);
          setUser(result.user);
        } catch (apiError: any) {
          // The API rolls back a new Supabase auth user if profile creation
          // fails. Clear the local session so the user can correct and retry.
          await supabase.auth.signOut({ scope: "local" });
          setUser(null);
          setUserProfile(null);
          return {
            error:
              apiError.response?.data?.error ||
              "Account setup failed. Please review your details and try again.",
          };
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.code || error.message };
    } finally {
      authOperationRef.current = null;
    }
  };

  const signOut = async () => {
    try {
      await unregisterCurrentDevicePushToken();
    } catch (error) {
      console.error("Failed to unregister push token during sign out:", error);
      return {
        error:
          "Could not securely sign out. Check your connection and try again.",
      };
    }

    const result = await authSignOut();
    return result;
  };

  const resetPassword = async (email: string) => {
    return authResetPassword(email);
  };

  const updateRecoveredPassword = async (password: string) => {
    return authUpdateRecoveredPassword(password);
  };

  const finishPasswordRecovery = async () => {
    setLoading(true);
    try {
      if (user) {
        await loadUserProfile(user);
      }
      setIsPasswordRecovery(false);
    } finally {
      setLoading(false);
    }
  };

  const syncUserProfile = useCallback((profile: UserProfile) => {
    if (authenticatedUserIdRef.current !== profile.uid) {
      return;
    }

    setUserProfile((currentProfile) => {
      if (currentProfile && currentProfile.uid !== profile.uid) {
        return currentProfile;
      }

      const email = profile.email ?? currentProfile?.email;
      if (!email) {
        return currentProfile;
      }

      return {
        uid: profile.uid,
        email,
        username: profile.username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl ?? undefined,
      };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        syncUserProfile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateRecoveredPassword,
        isPasswordRecovery,
        finishPasswordRecovery,
        authFlowError,
        clearAuthFlowError: () => setAuthFlowError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
