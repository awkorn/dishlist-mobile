import type {
  Session,
  User as SupabaseUser,
} from "@supabase/supabase-js";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  username: string;
  firstName: string;
  lastName: string;
}

export interface AuthResult {
  user: SupabaseUser | null;
  session?: Session | null;
  error: string | null;
}

export interface SignUpResult {
  error: string | null;
  requiresEmailConfirmation?: boolean;
}

export interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: import("@app-types").User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    userData: Partial<import("@app-types").User>
  ) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateRecoveredPassword: (
    password: string
  ) => Promise<{ error: string | null }>;
  isPasswordRecovery: boolean;
  finishPasswordRecovery: () => void;
  authFlowError: string | null;
  clearAuthFlowError: () => void;
}
