'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tenant, UserRole } from '@/lib/types';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import {
  Building2,
  Users,
  Clock,
  Calendar,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  ArrowLeft,
  Briefcase,
  GitFork,
  FolderLock,
  Settings,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Mail,
  UserCheck,
  ChevronDown,
  LogOut
} from 'lucide-react';

interface TenantWorkspaceClientShellProps {
  tenant: Tenant;
  tenantSlug: string;
  children: React.ReactNode;
}

export default function TenantWorkspaceClientShell({
  tenant,
  tenantSlug,
  children
}: TenantWorkspaceClientShellProps) {
  const pathname = usePathname();
  const {
    user,
    role,
    isSuperAdmin,
    isCompanyAdmin,
    isHRAdmin,
    isManager,
    isEmployeeOnly,
    currentPersonas,
    switchUserByEmail,
    logout
  } = useCurrentUser(tenantSlug);

  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const primaryColor = tenant.primaryColor || '#059669';

  // Role-Based Navigation Items Filter
  interface NavItem {
    label: string;
    href: string;
    icon: any;
    allowedRoles: UserRole[];
    badge?: string;
  }

  const allNavItems: NavItem[] = [
    {
      label: 'Executive Overview',
      href: `/app/${tenantSlug}`,
      icon: LayoutDashboard,
      allowedRoles: ['COMPANY_ADMIN', 'SUPER_ADMIN']
    },
    {
      label: 'Setup Wizard',
      href: `/app/${tenantSlug}/setup`,
      icon: Sparkles,
      allowedRoles: ['COMPANY_ADMIN', 'SUPER_ADMIN']
    },
    {
      label: 'Invitations & Access',
      href: `/app/${tenantSlug}/invitations`,
      icon: Mail,
      allowedRoles: ['COMPANY_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN']
    },
    {
      label: isEmployeeOnly ? 'My Self-Service' : 'Employee Self-Service',
      href: `/app/${tenantSlug}/my-dashboard`,
      icon: UserCheck,
      allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'],
      badge: isEmployeeOnly ? 'ESS' : undefined
    },
    {
      label: isEmployeeOnly ? 'Colleague Directory' : 'Employees Directory',
      href: `/app/${tenantSlug}/employees`,
      icon: Users,
      allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
    },
    {
      label: 'Organization Tree',
      href: `/app/${tenantSlug}/org-chart`,
      icon: GitFork,
      allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
    },
    {
      label: isEmployeeOnly ? 'My Attendance & Punch' : 'Attendance & Shifts',
      href: `/app/${tenantSlug}/attendance`,
      icon: Clock,
      allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
    },
    {
      label: isEmployeeOnly ? 'My Leave Requests' : 'Leave Management',
      href: `/app/${tenantSlug}/leaves`,
      icon: Calendar,
      allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
    },
    {
      label: isEmployeeOnly ? 'My Salary Slips' : 'Payroll & Slips',
      href: `/app/${tenantSlug}/payroll`,
      icon: CreditCard,
      allowedRoles: ['EMPLOYEE', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
    },
    {
      label: 'Recruitment & ATS',
      href: `/app/${tenantSlug}/recruitment`,
      icon: Briefcase,
      allowedRoles: ['HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
    },
    {
      label: isEmployeeOnly ? 'My Document Vault' : 'Document Vault',
      href: `/app/${tenantSlug}/documents`,
      icon: FolderLock,
      allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
    },
    {
      label: 'Branding & Settings',
      href: `/app/${tenantSlug}/settings`,
      icon: Settings,
      allowedRoles: ['COMPANY_ADMIN', 'SUPER_ADMIN']
    }
  ];

  // Filter based on active role
  const visibleNavItems = allNavItems.filter((item) => {
    if (isSuperAdmin) return true;
    if (isCompanyAdmin && item.allowedRoles.includes('COMPANY_ADMIN')) return true;
    return item.allowedRoles.includes(role);
  });

  const getRoleBadgeStyle = (r: UserRole) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'COMPANY_ADMIN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'HR_ADMIN':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'EMPLOYEE':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-xs">
        {/* Company Header */}
        <div className="p-5 border-b border-slate-100 space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Platform Gateway</span>
          </Link>

          <div className="flex items-center gap-3">
            {tenant.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {tenant.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-slate-900 truncate">{tenant.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {tenant.planId}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({tenant.currency})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current User Role Pill in Sidebar */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Guest'}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <span
            className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${getRoleBadgeStyle(
              role
            )}`}
          >
            {role}
          </span>
        </div>

        {/* Navigation items (Filtered strictly by role) */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>{isEmployeeOnly ? 'Employee Self-Service' : 'Workforce Enterprise'}</span>
            <span className="text-[9px] text-emerald-600 font-mono font-bold">{visibleNavItems.length} Links</span>
          </div>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Multi-Tenant Security Scope Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-2.5">
          <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] space-y-1 shadow-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>RBAC Isolation Enforced</span>
            </div>
            <div className="font-mono text-[10px] text-slate-500 truncate">Role: {role}</div>
          </div>

          {/* Super Admin Console is ONLY visible to Super Admins */}
          {isSuperAdmin && (
            <Link
              href="/super-admin"
              className="flex items-center justify-between text-[11px] font-medium text-slate-500 hover:text-emerald-600 transition-colors pt-0.5"
            >
              <span>Super Admin Console</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Top Header */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
            <span className="font-semibold text-slate-900 truncate">{tenant.name}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-emerald-700 font-mono font-medium">
              {isEmployeeOnly ? 'Employee Portal' : 'Workspace'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Interactive Role Switcher for instant testing */}
            <div className="relative">
              <button
                onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 transition-all shadow-xs"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-bold text-slate-900 text-[11px]">{user?.name || 'Select Role'}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${getRoleBadgeStyle(
                    role
                  )}`}
                >
                  {role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {personaDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 text-xs space-y-2"
                >
                  {isEmployeeOnly ? (
                    // Regular Employee Profile Card
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 text-sm">
                          {(user?.name || 'EM').split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate text-xs">{user?.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
                          <span className="inline-block mt-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            EMPLOYEE (Self-Service)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span>Workspace</span>
                          <span className="font-semibold text-slate-800">{tenant.name}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Access Guard</span>
                          <span className="text-emerald-700 font-semibold">Self-Service Partitioned</span>
                        </div>
                      </div>

                      <button
                        onClick={() => logout()}
                        className="w-full mt-2 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center justify-center gap-2 border border-rose-200 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    // Admin & Manager Persona Switcher
                    <div className="space-y-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                        <span>Switch Persona</span>
                        <span className="font-mono text-emerald-700">Admin Mode</span>
                      </div>

                      {currentPersonas.map((p) => {
                        const isSelected = user?.email.toLowerCase() === p.email.toLowerCase();
                        return (
                          <button
                            key={p.email}
                            onClick={() => {
                              switchUserByEmail(p.email);
                              setPersonaDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-lg ${
                              isSelected ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold text-slate-900 truncate text-[11px]">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">{p.title}</div>
                            </div>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ${getRoleBadgeStyle(
                                p.role
                              )}`}
                            >
                              {p.role}
                            </span>
                          </button>
                        );
                      })}

                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          onClick={() => logout()}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-700 hover:bg-rose-50 text-[11px] rounded-lg transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin-only quick links: ONLY show to Company Admins */}
            {isCompanyAdmin && (
              <>
                <Link
                  href={`/app/${tenantSlug}/setup`}
                  className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-semibold text-amber-800 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Setup Wizard</span>
                </Link>

                <Link
                  href={`/app/${tenantSlug}/invitations`}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold text-emerald-800 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Invite Credentials</span>
                </Link>
              </>
            )}

            {/* My ESS Portal button */}
            <Link
              href={`/app/${tenantSlug}/my-dashboard`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold text-emerald-800 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isEmployeeOnly ? 'My Dashboard' : 'My ESS'}</span>
            </Link>
          </div>
        </header>

        {/* Employee Role Notice Banner */}
        {isEmployeeOnly && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold">
                Employee Self-Service Mode ({user?.name || 'Employee'})
              </span>
              <span className="text-slate-600 text-[11px] hidden sm:inline">
                — Admin configuration, company-wide payroll, and candidate hiring pipelines are strictly partitioned under RBAC.
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-emerald-200 text-[10px] text-emerald-700 font-mono shadow-xs">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>RBAC Enforced</span>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 bg-slate-50 text-slate-900 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
