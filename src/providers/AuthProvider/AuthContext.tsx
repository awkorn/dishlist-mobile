import React, { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@services/supabase";
import { User } from "@app-types";
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as authSignOut,
  resetPassword as authResetPassword,
} from "@features/auth/services";
import api from "@services/api";
import { queryKeys } from "@lib/queryKeys";

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    userData: Partial<User>
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
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

  // Fetch the backend user record for the current session and store it.
  const loadUserProfile = async () => {
    try {
      const response = await api.get("/users/me");
      setUserProfile(response.data.user);
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  };

  useEffect(() => {
    // 1. Check for existing session on mount
    const initSession = async () => {
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
        void loadUserProfile();
      }
      setLoading(false);
    };

    initSession();

    // 2. Listen for auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (!session?.user) {
        setUserProfile(null);
        // Wipe all cached data from the previous user so it can't leak
        // into the next session (recipes, dishlists, isOwnProfile, etc.)
        queryClient.clear();
      }

      // Keep userProfile in sync when a session is established outside of the
      // explicit signIn/signUp flows (e.g. token refresh, multi-tab restore).
      if (_event === "SIGNED_IN" && session?.user) {
        await loadUserProfile();
      }

      // Sync email to backend if it changed (e.g. after email confirmation)
      if (_event === "USER_UPDATED" && session?.user?.email) {
        try {
          await api.patch("/users/me", { email: session.user.email });
        } catch (err) {
          console.error("Failed to sync email to backend:", err);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmail(email, password);
      if (result.error) {
        return { error: result.error };
      }

      if (result.user) {
        try {
          const response = await api.post("/users/register", {
            email: result.user.email,
          });
          setUserProfile(response.data.user);
          queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
        } catch (apiError: any) {
          console.log(
            "Backend registration error:",
            apiError.response?.data || apiError.message
          );
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
    try {
      const result = await signUpWithEmail(email, password);
      if (result.error) {
        return { error: result.error };
      }

      console.log("Supabase signup success, calling backend...");

      if (result.user) {
        try {
          const response = await api.post("/users/register", {
            email: result.user.email,
            ...userData,
          });
          setUserProfile(response.data.user);
          queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
        } catch (apiError: any) {
          console.log(
            "Backend registration error:",
            apiError.response?.data || apiError.message
          );
          return {
            error:
              "Account created but profile setup failed. Please try logging in.",
          };
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.code || error.message };
    }
  };

  const signOut = async () => {
    await authSignOut();
  };

  const resetPassword = async (email: string) => {
    return authResetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};