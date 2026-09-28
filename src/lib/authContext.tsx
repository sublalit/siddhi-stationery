'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { getUserProfile } from '@/lib/actions/auth';

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

interface AuthSessionInput {
  email: string;
  role: UserRole;
  name?: string;
  avatarUrl?: string | null;
}

interface AuthContextType {
  role: UserRole;
  email: string;
  name: string;
  avatarUrl: string | null;
  isLoading: boolean;
  setRole: (role: UserRole) => void;
  setAuthSession: (session: AuthSessionInput) => void;
  updateProfile: (patch: { name?: string; avatarUrl?: string | null }) => void;
  isStaff: boolean;
  isManager: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  role: 'STAFF',
  email: '',
  name: '',
  avatarUrl: null,
  isLoading: true,
  setRole: () => {},
  setAuthSession: () => {},
  updateProfile: () => {},
  isStaff: true,
  isManager: false,
  isAdmin: false,
});

function parseRole(raw?: string | null): UserRole {
  const value = String(raw || '').toUpperCase();
  if (value.includes('ADMIN')) return 'ADMIN';
  if (value.includes('MANAGER')) return 'MANAGER';
  return 'STAFF';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('STAFF');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        let storedEmail = '';
        let storedName = '';
        let storedRole: UserRole | null = null;
        let storedAvatar: string | null = null;

        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('siddhi_auth');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              storedEmail = parsed.email || '';
              storedName = parsed.name || '';
              storedAvatar = parsed.avatarUrl || null;
              if (parsed.role) storedRole = parseRole(parsed.role);
            } catch (e) {
              console.error(e);
            }
          }
        }

        let sessionUser: { id?: string; email?: string; user_metadata?: Record<string, any> } | null =
          null;
        try {
          const supabase = createSupabaseBrowserClient();
          const { data } = await supabase.auth.getSession();
          sessionUser = data.session?.user ?? null;
        } catch {
          sessionUser = null;
        }
        const meta = sessionUser?.user_metadata || {};
        const sessionEmail = sessionUser?.email || storedEmail;
        const sessionName = String(meta.name || meta.full_name || storedName || '').trim();
        const sessionAvatar = (meta.avatar_url || meta.picture || storedAvatar || null) as string | null;

        const profile = sessionEmail || sessionUser?.id
          ? await getUserProfile(sessionEmail, sessionUser?.id)
          : null;

        if (cancelled) return;

        const nextName = profile?.name || sessionName || sessionEmail.split('@')[0] || '';
        const nextEmail = profile?.email || sessionEmail;
        const nextRole = profile?.role ? parseRole(profile.role) : storedRole || 'STAFF';
        const nextAvatar = profile?.avatarUrl || sessionAvatar || null;

        setName(nextName);
        setEmail(nextEmail);
        setRoleState(nextRole);
        setAvatarUrl(nextAvatar);

        if (typeof window !== 'undefined' && nextEmail) {
          localStorage.setItem(
            'siddhi_auth',
            JSON.stringify({
              email: nextEmail,
              name: nextName,
              role: nextRole,
              avatarUrl: nextAvatar,
              isLoggedIn: true,
            })
          );
        }
      } catch (error) {
        console.error('hydrate auth error:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('siddhi_auth');
      const parsed = stored ? JSON.parse(stored) : {};
      localStorage.setItem(
        'siddhi_auth',
        JSON.stringify({ ...parsed, role: newRole })
      );
    }
  };

  const setAuthSession = (session: AuthSessionInput) => {
    setRoleState(session.role);
    setEmail(session.email);
    setName(session.name || session.email.split('@')[0]);
    setAvatarUrl(session.avatarUrl ?? null);
    setIsLoading(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'siddhi_auth',
        JSON.stringify({
          email: session.email,
          role: session.role,
          name: session.name || session.email.split('@')[0],
          avatarUrl: session.avatarUrl ?? null,
          isLoggedIn: true,
        })
      );
    }
  };

  const updateProfile = (patch: { name?: string; avatarUrl?: string | null }) => {
    if (patch.name) setName(patch.name);
    if (patch.avatarUrl !== undefined) setAvatarUrl(patch.avatarUrl);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('siddhi_auth');
      const parsed = stored ? JSON.parse(stored) : {};
      localStorage.setItem(
        'siddhi_auth',
        JSON.stringify({
          ...parsed,
          name: patch.name ?? parsed.name,
          avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : parsed.avatarUrl,
        })
      );
    }
  };

  const isStaff = role === 'STAFF';
  const isManager = role === 'MANAGER';
  const isAdmin = role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        role,
        email,
        name,
        avatarUrl,
        isLoading,
        setRole,
        setAuthSession,
        updateProfile,
        isStaff,
        isManager,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
