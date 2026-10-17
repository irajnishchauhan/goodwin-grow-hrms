import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/store';
import { SupabaseStore } from '@/lib/db/supabaseStore';
import TenantWorkspaceClientShell from '@/components/TenantWorkspaceClientShell';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export default async function TenantWorkspaceLayout({ children, params }: TenantLayoutProps) {
  const { tenantSlug } = await params;
  const tenant = await db.getResolvedTenant(tenantSlug);

  if (!tenant) {
    notFound();
  }

  return (
    <TenantWorkspaceClientShell tenant={tenant} tenantSlug={tenantSlug}>
      {children}
    </TenantWorkspaceClientShell>
  );
}
