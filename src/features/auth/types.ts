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
  user: import('firebase/auth').User | null;
  error: string | null;
}

export interface AuthContextType {
  user: import('firebase/auth').User | null;
  userProfile: import('@app-types').User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    userData: Partial<import('@app-types').User>
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}