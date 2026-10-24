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

export const OWNER_USER: User = {
  id: 'user-bat-owner',
  name: 'Rajnish Singh Chauhan',
  email: 'rajnish.chauhan@goodwinbatteries.com',
  passwordHash: 'password123',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  isSuperAdmin: true,
  memberships: [
    {
      id: 'm-owner-2',
      tenantId: 'tenant-goodwin-batteries-fleet',
      tenantName: 'Goodwin Batteries Pvt Ltd',
      tenantSlug: 'goodwin-batteries-fleet',
      role: 'COMPANY_ADMIN',
      status: 'ACTIVE'
    }
  ],
  activeTenantId: 'tenant-goodwin-batteries-fleet',
  isActive: true,
  createdAt: '2026-04-01T10:00:00Z'
};

export const DEMO_EMPLOYEE_USER: User = {
  id: 'emp-goodwin-batteries-fleet-1792190007419',
  name: 'Kiran Patidar',
  email: 'kiranpatidar.goodwinbatteries@gmail.com',
  passwordHash: 'password123',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  isSuperAdmin: false,
  memberships: [
    {
      id: 'm-kiran-1',
      tenantId: 'tenant-goodwin-batteries-fleet',
      tenantName: 'Goodwin Batteries Pvt Ltd',
      tenantSlug: 'goodwin-batteries-fleet',
      role: 'EMPLOYEE',
      status: 'ACTIVE'
    }
  ],
  activeTenantId: 'tenant-goodwin-batteries-fleet',
  isActive: true,
  createdAt: '2026-04-01T10:00:00Z'
};

export const DEMO_PERSONAS: Record<string, PersonaDemo[]> = {
  'goodwin-batteries': [
    {
      id: 'user-bat-owner',
      name: 'Rajnish Singh Chauhan',
      email: 'rajnish.chauhan@goodwinbatteries.com',
      role: 'COMPANY_ADMIN',
      title: 'Company Owner & Managing Director',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'emp-goodwin-batteries-fleet-1792190007419',
      name: 'Kiran Patidar',
      email: 'kiranpatidar.goodwinbatteries@gmail.com',
      role: 'EMPLOYEE',
      title: 'Employee (Self-Service ESS)',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
    }
  ],
  'goodwin-batteries-fleet': [
    {
      id: 'user-bat-owner',
      name: 'Rajnish Singh Chauhan',
      email: 'rajnish.chauhan@goodwinbatteries.com',
      role: 'COMPANY_ADMIN',
      title: 'Company Owner & Managing Director',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'emp-goodwin-batteries-fleet-1792190007419',
      name: 'Kiran Patidar',
      email: 'kiranpatidar.goodwinbatteries@gmail.com',
      role: 'EMPLOYEE',
      title: 'Employee (Self-Service ESS)',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80'
    }
  ]
};

export function useCurrentUser(tenantSlug?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUser = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      let stored = localStorage.getItem('currentUser');
      if (!stored) {
        // Fallback: check cookie gg_user
        const match = document.cookie.match(/(?:^|;\s*)gg_user=([^;]+)/);
        if (match && match[1]) {
          stored = decodeURIComponent(match[1]);
        }
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && parsed.email) {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
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
    let target: User;
    if (email.toLowerCase().includes('kiran') || email.toLowerCase().includes('sunil')) {
      target = DEMO_EMPLOYEE_USER;
    } else {
      target =
        INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) || OWNER_USER;
    }
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

  // Determine active role for current tenant - Default to EMPLOYEE
  let role: UserRole = 'EMPLOYEE';
  if (user) {
    if (user.isSuperAdmin || user.email?.toLowerCase() === 'admin@goodwingrow.ai') {
      role = 'SUPER_ADMIN';
    } else if (tenantSlug) {
      const membership = user.memberships?.find(
        (m) => m.tenantSlug === tenantSlug || m.tenantId === tenantSlug
      );
      if (membership) {
        role = membership.role;
      } else if (user.memberships?.[0]) {
        role = user.memberships[0].role;
      } else if (user.email?.toLowerCase().includes('rajnish') || user.id === 'user-bat-owner') {
        role = 'COMPANY_ADMIN';
      } else {
        role = 'EMPLOYEE';
      }
    } else if (user.memberships?.[0]) {
      role = user.memberships[0].role;
    } else if (user.email?.toLowerCase().includes('rajnish') || user.id === 'user-bat-owner') {
      role = 'COMPANY_ADMIN';
    } else {
      role = 'EMPLOYEE';
    }
  }

  const isSuperAdmin = Boolean(user && (user.isSuperAdmin || role === 'SUPER_ADMIN'));
  const isCompanyAdmin = Boolean(user && (isSuperAdmin || role === 'COMPANY_ADMIN'));
  const isHRAdmin = Boolean(user && (isCompanyAdmin || role === 'HR_ADMIN'));
  const isManager = Boolean(user && (isHRAdmin || role === 'MANAGER'));
  const isEmployeeOnly = Boolean(!user || (!isCompanyAdmin && !isHRAdmin && !isManager));

  const currentPersonas = (tenantSlug && DEMO_PERSONAS[tenantSlug]) || DEMO_PERSONAS['goodwin-batteries-fleet'] || [
    {
      id: 'user-bat-owner',
      name: 'Rajnish Singh Chauhan',
      email: 'rajnish.chauhan@goodwinbatteries.com',
      role: 'COMPANY_ADMIN',
      title: 'Company Owner & Managing Director',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    }
  ];

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
