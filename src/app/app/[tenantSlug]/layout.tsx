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
  let tenant = db.getTenantBySlug(tenantSlug);
  if (!tenant) {
    tenant = await SupabaseStore.getTenantBySlug(tenantSlug);
    if (tenant) {
      db.upsertTenant(tenant);
    }
  }

  if (!tenant) {
    notFound();
  }

  return (
    <TenantWorkspaceClientShell tenant={tenant} tenantSlug={tenantSlug}>
      {children}
    </TenantWorkspaceClientShell>
  );
}
