import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';
import TenantWorkspaceClientShell from '@/components/TenantWorkspaceClientShell';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ tenantSlug: string }>;
}): Promise<Metadata> {
  const { tenantSlug } = await params;
  const tenant =
    (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
    (await db.getResolvedTenant(tenantSlug));

  if (!tenant) {
    return {
      title: 'Goodwin Grow HRMS | Workforce Portal'
    };
  }

  const iconUrl = tenant.logoUrl || '/goodwin-logo.png';
  return {
    title: `${tenant.name} | Workforce Portal`,
    description: `${tenant.name} - Enterprise HRMS, Attendance & Statutory Payroll Portal`,
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl
    }
  };
}

export default async function TenantWorkspaceLayout({ children, params }: TenantLayoutProps) {
  const { tenantSlug } = await params;
  const tenant =
    (await SupabaseStore.getTenantBySlug(tenantSlug)) ||
    (await db.getResolvedTenant(tenantSlug));

  if (!tenant) {
    notFound();
  }

  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-mono">Loading Goodwin Grow HRMS Workspace...</div>}>
      <TenantWorkspaceClientShell tenant={tenant} tenantSlug={tenantSlug}>
        {children}
      </TenantWorkspaceClientShell>
    </React.Suspense>
  );
}
