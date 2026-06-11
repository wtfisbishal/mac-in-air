'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '@/types';

const TOKEN_KEY = 'rmac_token';
const USER_KEY  = 'rmac_user';

export function useAuth() {
  const [token, setToken]  = useState<string | null>(null);
  const [user,  setUser]   = useState<AuthUser | null>(null);
  const [ready, setReady]  = useState(false); // hydration guard

  // Hydrate from localStorage once on client
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t) setToken(t);
    if (u) { try { setUser(JSON.parse(u)); } catch { 
       } }
    setReady(true);
  }, []);

  const login = useCallback((t: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return {
    token,
    user,
    ready,
    isAuthenticated: !!token,
    login,
    logout,
  };
}
