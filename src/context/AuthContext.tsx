import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {isSupabaseConfigured, supabase} from '../lib/supabase';
import {api} from '../services/api';
import type {UserProfile} from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  supabaseMode: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    nip?: string;
    unit_kerja?: string;
  }) => Promise<{user: UserProfile | null; needsEmailConfirmation?: boolean}>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.getCurrentSessionProfile();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    if (isSupabaseConfigured && supabase) {
      const {data: listener} = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          setUser(null);
          setLoading(false);
        } else {
          refreshUser();
        }
      });
      return () => {
        listener.subscription.unsubscribe();
      };
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const profile = await api.login(email, password);
    setUser(profile);
    return profile;
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    nip?: string;
    unit_kerja?: string;
  }) => {
    const res = await api.register(payload);
    if (res.user) setUser(res.user);
    return res;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        supabaseMode: isSupabaseConfigured,
        refreshUser,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return ctx;
}
