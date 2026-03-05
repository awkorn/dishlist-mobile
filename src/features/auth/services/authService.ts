import { supabase } from "@services/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import type { AuthResult } from "../types";

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signOut = async (): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const resetPassword = async (
  email: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getCurrentUser = (): SupabaseUser | null => {
  // Note: This is synchronous but may return stale data.
  // Prefer supabase.auth.getUser() for fresh data.
  return null; // Use getSession/getUser async methods instead
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ error: string | null }> => {
  try {
    // Step 1: Re-authenticate to verify current password
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return { error: "No authenticated user found" };
    }

    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (reAuthError) {
      return { error: "Current password is incorrect" };
    }

    // Step 2: Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { error: updateError.message };
    }

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};