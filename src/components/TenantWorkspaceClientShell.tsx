'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  LogOut,
  LogIn,
  CheckSquare,
  FileText
} from 'lucide-react';
import NotificationDropdown from '@/components/NotificationDropdown';
import KekaTopClockWidget from '@/components/KekaTopClockWidget';

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
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    role,
    loading: authLoading,
    isSuperAdmin,
    isCompanyAdmin,
    isHRAdmin,
    isManager,
    isEmployeeOnly,
    logout
  } = useCurrentUser(tenantSlug);

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Strictly enforce authentication on all tenant workspace routes
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || `/app/${tenantSlug}`)}`);
    }
  }, [authLoading, user, pathname, tenantSlug, router]);

  // Dynamically set browser tab title and favicon to company name and Goodwin logo
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const pageTitle = pathname.includes('/attendance')
        ? 'Time & Attendance'
        : pathname.includes('/leaves')
        ? 'Leave Management'
        : pathname.includes('/payroll')
        ? 'Payroll & Salary Slips'
        : pathname.includes('/my-dashboard')
        ? 'Employee Self-Service'
        : pathname.includes('/employees')
        ? 'Employees Directory'
        : pathname.includes('/org-chart')
        ? 'Organization Tree'
        : pathname.includes('/recruitment')
        ? 'Recruitment & ATS'
        : pathname.includes('/documents')
        ? 'Document Vault'
        : pathname.includes('/setup')
        ? 'Setup Wizard'
        : pathname.includes('/invitations')
        ? 'Invitations & Access'
        : pathname.includes('/settings')
        ? 'Settings'
        : 'Workforce Portal';

      document.title = `${tenant.name} | ${pageTitle}`;

      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.href = tenant.logoUrl || '/goodwin-logo.png';
    }
  }, [pathname, tenant.name, tenant.logoUrl]);

  const primaryColor = tenant.primaryColor || '#059669';

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-700 p-2 mx-auto shadow-lg flex items-center justify-center animate-pulse">
            <img src="/goodwin-logo.png" alt="Goodwin Grow HRMS" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white tracking-wide">Authenticating Secure Workspace Session...</h2>
            <p className="text-xs text-slate-400">Verifying role credentials and tenant isolation.</p>
          </div>
        </div>
      </div>
    );
  }

  // Keka Hierarchical Navigation Structure
  interface NavItem {
    label: string;
    href: string;
    icon: any;
    allowedRoles: UserRole[];
    badge?: string;
  }

  interface NavSection {
    sectionTitle: string;
    items: NavItem[];
  }

  const kekaNavSections: NavSection[] = [
    {
      sectionTitle: 'ME (SELF SERVICE)',
      items: [
        {
          label: 'Dashboard',
          href: `/app/${tenantSlug}/my-dashboard`,
          icon: LayoutDashboard,
          allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'],
          badge: isEmployeeOnly ? 'ESS' : undefined
        },
        {
          label: 'Attendance & Punches',
          href: `/app/${tenantSlug}/attendance`,
          icon: Clock,
          allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        },
        {
          label: 'Leave Requests',
          href: `/app/${tenantSlug}/leaves`,
          icon: Calendar,
          allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        },
        {
          label: 'Salary Slips',
          href: `/app/${tenantSlug}/payroll`,
          icon: CreditCard,
          allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        },
        {
          label: 'Document Vault',
          href: `/app/${tenantSlug}/documents`,
          icon: FolderLock,
          allowedRoles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        }
      ]
    },
    {
      sectionTitle: 'ORGANIZATION & PEOPLE',
      items: [
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
        }
      ]
    },
    {
      sectionTitle: 'TIME & ATTENDANCE',
      items: [
        {
          label: 'Attendance Roster',
          href: `/app/${tenantSlug}/attendance?tab=attendance`,
          icon: Clock,
          allowedRoles: ['MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        },
        {
          label: 'Monthly Timesheets',
          href: `/app/${tenantSlug}/attendance?tab=calendar`,
          icon: Calendar,
          allowedRoles: ['MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        },
        {
          label: 'Punch Regularization',
          href: `/app/${tenantSlug}/attendance?tab=regularizations`,
          icon: CheckSquare,
          allowedRoles: ['MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        },
        {
          label: 'Shift Policies',
          href: `/app/${tenantSlug}/attendance?tab=shifts`,
          icon: Settings,
          allowedRoles: ['HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        },
        {
          label: 'Holiday Calendar',
          href: `/app/${tenantSlug}/attendance?tab=holidays`,
          icon: Sparkles,
          allowedRoles: ['MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        }
      ]
    },
    {
      sectionTitle: 'LEAVES & HOLIDAYS',
      items: [
        {
          label: 'Leave Approvals',
          href: `/app/${tenantSlug}/leaves`,
          icon: Calendar,
          allowedRoles: ['MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        },
        {
          label: 'Leave Types & Quotas',
          href: `/app/${tenantSlug}/leaves?tab=types`,
          icon: Layers,
          allowedRoles: ['HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        }
      ]
    },
    {
      sectionTitle: 'PAYROLL & STATUTORY',
      items: [
        {
          label: 'Payroll Run & Register',
          href: `/app/${tenantSlug}/payroll`,
          icon: CreditCard,
          allowedRoles: ['HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        },
        {
          label: 'Salary Slips & PDF',
          href: `/app/${tenantSlug}/payroll?tab=slips`,
          icon: FileText,
          allowedRoles: ['HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        }
      ]
    },
    {
      sectionTitle: 'TALENT & ATS',
      items: [
        {
          label: 'Recruitment & Openings',
          href: `/app/${tenantSlug}/recruitment`,
          icon: Briefcase,
          allowedRoles: ['HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        }
      ]
    },
    {
      sectionTitle: 'SETTINGS & POLICIES',
      items: [
        {
          label: 'Executive Overview',
          href: `/app/${tenantSlug}`,
          icon: LayoutDashboard,
          allowedRoles: ['COMPANY_ADMIN', 'SUPER_ADMIN']
        },
        {
          label: 'Setup Wizard & Work Days',
          href: `/app/${tenantSlug}/setup`,
          icon: Sparkles,
          allowedRoles: ['COMPANY_ADMIN', 'SUPER_ADMIN']
        },
        {
          label: 'Invitations & Access',
          href: `/app/${tenantSlug}/invitations`,
          icon: Mail,
          allowedRoles: ['HR_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN']
        },
        {
          label: 'Company Settings',
          href: `/app/${tenantSlug}/settings`,
          icon: Settings,
          allowedRoles: ['COMPANY_ADMIN', 'SUPER_ADMIN']
        }
      ]
    }
  ];

  // Filter sections and items based on role
  const isAllowed = (allowedRoles: UserRole[]) => {
    if (isSuperAdmin) return true;
    if (isCompanyAdmin && allowedRoles.includes('COMPANY_ADMIN')) return true;
    return allowedRoles.includes(role);
  };

  const visibleSections = kekaNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isAllowed(item.allowedRoles))
    }))
    .filter((section) => section.items.length > 0);

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
        <div className="p-4 border-b border-slate-100 space-y-2.5">
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
                className="w-9 h-9 rounded-xl object-contain bg-white p-1 border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-sm shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {tenant.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold text-slate-900 truncate">{tenant.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {tenant.planId}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({tenant.currency})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current User Role Pill in Sidebar */}
        <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[11px] font-bold text-emerald-800 shrink-0">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-800 truncate">{user?.name || 'Guest'}</div>
              <div className="text-[9px] text-slate-500 truncate">{user?.email}</div>
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

        {/* Keka Standard Grouped Navigation */}
        <nav className="p-2 space-y-4 flex-1 overflow-y-auto">
          {visibleSections.map((section) => (
            <div key={section.sectionTitle} className="space-y-0.5">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.sectionTitle}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href.split('?')[0];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                            isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* RBAC Security Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
          <div className="p-2 rounded-xl bg-white border border-slate-200 text-[10px] space-y-0.5 shadow-2xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>RBAC Isolation Active</span>
            </div>
            <div className="font-mono text-[9px] text-slate-500 truncate">Role: {role}</div>
          </div>

          {/* Super Admin Console is ONLY visible to Super Admins */}
          {isSuperAdmin && (
            <Link
              href="/super-admin"
              className="flex items-center justify-between text-[11px] font-medium text-slate-500 hover:text-emerald-600 transition-colors px-1"
            >
              <span>Super Admin Console</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Top Header Navbar */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
            <span className="font-semibold text-slate-900 truncate hidden sm:inline">{tenant.name}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
            <span className="text-emerald-700 font-mono font-medium truncate">
              {isEmployeeOnly ? 'Employee Portal' : 'Workspace'}
            </span>
          </div>

          {/* Center/Right Section: Global Keka Clock Widget, Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Keka Web Clock-In Widget */}
            <KekaTopClockWidget tenantSlug={tenantSlug} user={user} />

            {/* Real-time Notifications Bell */}
            <NotificationDropdown tenantSlug={tenantSlug} />

            {/* Authenticated User Profile */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 transition-all shadow-2xs cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  {user?.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden md:block max-w-[110px] truncate">
                  <span className="font-bold text-slate-900 text-[11px] block truncate">{user?.name}</span>
                </div>
                <span
                  className={`hidden sm:inline text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${getRoleBadgeStyle(
                    role
                  )}`}
                >
                  {role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95"
                >
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-900 truncate text-xs">{user?.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${getRoleBadgeStyle(role)}`}>
                        {role}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">{tenant.name}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-700 hover:bg-rose-50 text-xs rounded-xl font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-slate-50 text-slate-900 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
