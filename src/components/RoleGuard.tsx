'use client';

import React from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';
import { UserRole } from '@/lib/types';
import { ShieldAlert, ArrowLeft, UserCheck, Lock, Sparkles, Building2 } from 'lucide-react';

interface RoleGuardProps {
  tenantSlug: string;
  requiredRoles: UserRole[];
  moduleName: string;
  children: React.ReactNode;
}

export default function RoleGuard({
  tenantSlug,
  requiredRoles,
  moduleName,
  children
}: RoleGuardProps) {
  const { user, role, isSuperAdmin, isCompanyAdmin } =
    useCurrentUser(tenantSlug);

  // If super admin or company admin, allow everything
  const hasAccess =
    isSuperAdmin ||
    (requiredRoles.includes('COMPANY_ADMIN') && isCompanyAdmin) ||
    requiredRoles.includes(role);

  if (!hasAccess) {

    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-white border border-amber-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Role-Based Access Control Enforced</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Restricted Section: {moduleName}
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            You are currently signed in as{' '}
            <strong className="text-slate-900">{user?.name || 'Employee'}</strong> with the role{' '}
            <span className="font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-amber-800 border border-slate-200 text-xs font-semibold">
              {role}
            </span>
            . Access to <strong>{moduleName}</strong> requires elevated privileges (
            {requiredRoles.join(' or ')}).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Employee Self-Service (ESS) Guarantee:</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            In Goodwin Grow HRMS, employees cannot access company setup, billing, payroll batch runs, or recruitment pipelines. Employees are provided their dedicated self-service portal for punching attendance, applying for leaves, downloading payslips, and accessing employment contracts.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/app/${tenantSlug}/my-dashboard`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            <span>Go to My Self-Service Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
