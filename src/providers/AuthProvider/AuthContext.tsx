import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../../config/firebase";
import { User } from "../../types";
import * as authService from "../../services/auth";
import api, { getDishLists, DishList } from "../../services/api";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  dishListsCache: {[key: string]: DishList[]};
  isDishListsPreloaded: boolean;
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
  preloadDishLists: () => Promise<void>;
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
  const [dishListsCache, setDishListsCache] = useState<{[key: string]: DishList[]}>({});
  const [isDishListsPreloaded, setIsDishListsPreloaded] = useState(false);

  const preloadDishLists = async () => {
    try {
      console.log('Preloading DishLists data...');
      
      // Load the main tabs that users visit most
      const [allData, myData] = await Promise.all([
        getDishLists('all'),
        getDishLists('my')
      ]);
      
      setDishListsCache({
        all: allData,
        my: myData,
      });
      
      setIsDishListsPreloaded(true);
      console.log('DishLists preloaded successfully');
    } catch (error) {
      console.log('Failed to preload DishLists:', error);
      // Don't set preloaded to true on error - let screen handle loading
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        console.log("User authenticated:", firebaseUser.email);
        // Reset cache when user changes
        setDishListsCache({});
        setIsDishListsPreloaded(false);
      } else {
        setUserProfile(null);
        setDishListsCache({});
        setIsDishListsPreloaded(false);
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
          
          // Preload DishLists data after successful login
          setTimeout(() => {
            preloadDishLists();
          }, 500); 
          
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
        console.log('Firebase signup failed:', result.error);
        return { error: result.error };
      }

      console.log('Firebase signup success, calling backend...');

      // Call backend to register user
      if (result.user) {
        try {
          const response = await api.post("/users/register", {
            email: result.user.email,
            ...userData,
          });
          setUserProfile(response.data.user);
          
          // Preload DishLists data after successful signup
          setTimeout(() => {
            preloadDishLists();
          }, 1000); 
          
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
      console.log('Signup error:', error.message);
      return { error: error.message };
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setDishListsCache({});
    setIsDishListsPreloaded(false);
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        userProfile, 
        loading, 
        dishListsCache,
        isDishListsPreloaded,
        signIn, 
        signUp, 
        signOut,
        preloadDishLists
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};