/**
 * PURPOSE: App-wide auth state (current user, loading state) + login/
 * logout actions, exposed via a hook so any component can gate on
 * `isAuthenticated` without prop-drilling.
 *
 * WHY CHECK /auth/me ON MOUNT INSTEAD OF STORING USER IN localStorage
 * The access token is in an httpOnly cookie the client can't read
 * anyway, so "am I logged in" can only be answered by asking the server.
 * This also naturally handles the case where a cookie expired while the
 * tab was closed.
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '../api/auth';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setUser({ userId: res.data.data.user.id, role: res.data.data.user.role });
  };

  const register = async (name: string, email: string, password: string) => {
    await authApi.register(name, email, password);
    const me = await authApi.me();
    setUser(me.data.data);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
