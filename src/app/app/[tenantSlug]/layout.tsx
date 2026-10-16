import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db/store';
import {
  Building2,
  Users,
  Clock,
  Calendar,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  ArrowLeft,
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export default async function TenantWorkspaceLayout({ children, params }: TenantLayoutProps) {
  const { tenantSlug } = await params;
  const tenant = db.getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const primaryColor = tenant.primaryColor || '#059669';

  const navLinks = [
    { label: 'Overview', href: `/app/${tenantSlug}`, icon: LayoutDashboard },
    { label: 'Employees', href: `/app/${tenantSlug}/employees`, icon: Users },
    { label: 'Attendance', href: `/app/${tenantSlug}/attendance`, icon: Clock },
    { label: 'Leaves', href: `/app/${tenantSlug}/leaves`, icon: Calendar },
    { label: 'Payroll', href: `/app/${tenantSlug}/payroll`, icon: CreditCard }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
        {/* Company Header */}
        <div className="p-5 border-b border-slate-800/90 space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Platform Gateway</span>
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {tenant.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-white truncate">{tenant.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {tenant.planId}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({tenant.currency})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1 flex-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Workforce Suite
          </div>

          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all group"
              >
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Multi-Tenant Security Scope Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Isolated Tenant Context</span>
            </div>
            <div className="font-mono text-[10px] text-slate-400 break-all">ID: {tenant.id}</div>
            <div className="text-[10px] text-slate-400">Zero cross-tenant data visibility</div>
          </div>

          <Link
            href="/super-admin"
            className="flex items-center justify-between text-[11px] font-medium text-slate-400 hover:text-emerald-400 transition-colors pt-1"
          >
            <span>Super Admin Console</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-white">{tenant.name}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-emerald-400 font-mono">Workspace</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-medium">Company HR Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 bg-slate-900 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
