import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../config/firebase";
import { User } from "../types";
import * as authService from "../services/auth";
import api from "../services/api";

interface AuthContextType {
  user: FirebaseUser | null;
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
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // TODO: Fetch user profile from your backend API when user is authenticated
      if (firebaseUser) {
        console.log("User authenticated:", firebaseUser.email);
        // Call your /users/me endpoint here with the Firebase ID token
      } else {
        setUserProfile(null);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authService.signInWithEmail(email, password);
      if (result.error) {
        return { error: result.error };
      }

      // Call backend to create/update user profile
      if (result.user) {
        try {
          const response = await api.post("/users/register", {
            email: result.user.email,
          });
          setUserProfile(response.data.user);
        } catch (apiError: any) {
          console.log(
            "Backend registration error:",
            apiError.response?.data || apiError.message
          );
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<User>
  ) => {
    try {
      const result = await authService.signUpWithEmail(email, password);
      if (result.error) {
        return { error: result.error };
      }

      // Call backend to register user
      if (result.user) {
        try {
          const response = await api.post("/users/register", {
            email: result.user.email,
            ...userData,
          });
          setUserProfile(response.data.user);
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
      return { error: error.message };
    }
  };

  const signOut = async () => {
    await authService.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, userProfile, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};