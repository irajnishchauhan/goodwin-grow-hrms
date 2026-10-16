'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/lib/types';
import { INITIAL_USERS } from '@/lib/db/initialData';

export const AUTH_CHANGE_EVENT = 'hrms-auth-change';

export interface PersonaDemo {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatarUrl?: string;
}

export const DEMO_PERSONAS: Record<string, PersonaDemo[]> = {
  'goodwin-batteries': [
    {
      id: 'user-bat-owner',
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@goodwinbatteries.com',
      role: 'COMPANY_ADMIN',
      title: 'Company Owner & Managing Director',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'user-bat-hr',
      name: 'Priya Nair',
      email: 'priya.nair@goodwinbatteries.com',
      role: 'HR_ADMIN',
      title: 'Head of People & Culture',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'user-bat-manager',
      name: 'Amit Patel',
      email: 'amit.patel@goodwinbatteries.com',
      role: 'MANAGER',
      title: 'Production Manager',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'user-bat-emp1',
      name: 'Sunil Kumar',
      email: 'sunil.kumar@goodwinbatteries.com',
      role: 'EMPLOYEE',
      title: 'Battery Assembly Technician',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'user-bat-emp2',
      name: 'Pooja Reddy',
      email: 'pooja.reddy@goodwinbatteries.com',
      role: 'EMPLOYEE',
      title: 'BMS Testing Engineer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'user-bat-rajnish',
      name: 'Rajnish Singh Chauhan',
      email: 'rajnish.chauhan@goodwinbatteries.com',
      role: 'EMPLOYEE',
      title: 'Battery Operations Specialist',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    }
  ]
};

export function useCurrentUser(tenantSlug?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default to Rajnish Singh Chauhan (Employee) if in goodwin-batteries workspace or no session
        const defaultUser =
          INITIAL_USERS.find((u) => u.email === 'rajnish.chauhan@goodwinbatteries.com') ||
          INITIAL_USERS[0];
        setUser(defaultUser);
        localStorage.setItem('currentUser', JSON.stringify(defaultUser));
        document.cookie = `gg_user=${encodeURIComponent(JSON.stringify(defaultUser))}; path=/; max-age=86400`;
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncUser();

    const handleAuthChange = () => {
      syncUser();
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [syncUser]);

  const switchUserByEmail = (email: string) => {
    const target = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (target) {
      localStorage.setItem('currentUser', JSON.stringify(target));
      document.cookie = `gg_user=${encodeURIComponent(JSON.stringify(target))}; path=/; max-age=86400`;
      setUser(target);
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    document.cookie = 'gg_user=; path=/; max-age=0';
    setUser(null);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    window.location.href = '/login';
  };

  // Determine active role for current tenant
  let role: UserRole = 'EMPLOYEE';
  if (user?.isSuperAdmin) {
    role = 'SUPER_ADMIN';
  } else if (user && tenantSlug) {
    const membership = user.memberships?.find(
      (m) => m.tenantSlug === tenantSlug || m.tenantId === tenantSlug
    );
    if (membership) {
      role = membership.role;
    }
  } else if (user?.memberships?.[0]) {
    role = user.memberships[0].role;
  }

  const isSuperAdmin = Boolean(user?.isSuperAdmin || role === 'SUPER_ADMIN');
  const isCompanyAdmin = Boolean(isSuperAdmin || role === 'COMPANY_ADMIN');
  const isHRAdmin = Boolean(isCompanyAdmin || role === 'HR_ADMIN');
  const isManager = Boolean(isHRAdmin || role === 'MANAGER');
  const isEmployeeOnly = role === 'EMPLOYEE' && !isSuperAdmin;

  const currentPersonas = (tenantSlug && DEMO_PERSONAS[tenantSlug]) || DEMO_PERSONAS['goodwin-batteries'];

  return {
    user,
    role,
    loading,
    isSuperAdmin,
    isCompanyAdmin,
    isHRAdmin,
    isManager,
    isEmployeeOnly,
    currentPersonas,
    switchUserByEmail,
    logout
  };
}
