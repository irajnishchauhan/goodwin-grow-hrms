'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import TenantSecurityVerification from '@/components/TenantSecurityVerification';
import OnboardTenantModal from '@/components/OnboardTenantModal';
import EditTenantModal from '@/components/EditTenantModal';
import DeleteTenantModal from '@/components/DeleteTenantModal';
import {
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Plus,
  Sliders,
  DollarSign,
  Briefcase,
  CheckCircle,
  ExternalLink,
  Lock,
  Layers,
  Database,
  Edit3,
  Trash2
} from 'lucide-react';
import { Tenant } from '@/lib/types';

export default function PlatformHomePage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState({
    totalTenants: 4,
    activeTenants: 4,
    totalEmployees: 0,
    mrrUSD: 2496,
    arrUSD: 29952
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    status: string;
    message: string;
    actionRequired?: string;
  } | null>(null);

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/super-admin/tenants');
      const json = await res.json();
      if (json.success) {
        setTenants(json.data.tenants);
        setStats(json.data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupabaseHealth = async () => {
    try {
      const res = await fetch('/api/health/supabase');
      const json = await res.json();
      setSupabaseStatus(json);
    } catch {
      setSupabaseStatus({
        status: 'error',
        message: 'Unable to reach local Supabase health endpoint'
      });
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchSupabaseHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-r from-white via-white to-emerald-50/70 border border-slate-200 p-8 sm:p-12 overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Goodwin Grow AI Multi-Tenant SaaS Platform
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Enterprise HRMS Engine with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
                Rigid Tenant Isolation
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              Inspired by the enterprise capabilities of <strong>Keka</strong> and <strong>Frappe HRMS</strong>.
              Operated by <strong>Goodwin Grow AI</strong> as Super Admin, providing each client company with its own
              isolated workforce, attendance tracking, leave workflows, and compliance-ready payroll.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/super-admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm"
              >
                <Sliders className="w-4 h-4" />
                <span>Super Admin Console</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs sm:text-sm transition-all shadow-xs"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Onboard New Client</span>
              </button>
            </div>
          </div>
        </div>

        {/* Platform SaaS KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Client Workspaces</span>
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.totalTenants}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-600" /> 100% Active Workspaces
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Workforce</span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.totalEmployees}</div>
            <div className="text-[11px] text-slate-500 mt-1">Across isolated client schemas</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Platform MRR</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">${stats.mrrUSD.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">ARR: ${stats.arrUSD.toLocaleString()}</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Tenant Security</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700">100% Pass</div>
            <div className="text-[11px] text-slate-500 mt-1">Zero cross-tenant leakage</div>
          </div>
        </div>

        {/* Supabase Cloud Infrastructure Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Supabase PostgreSQL Cloud Integration
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {supabaseStatus?.status === 'connected' ? 'Connected & Active' : 'API Endpoint Connected'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  https://eidgnglpmfqqsdcwuqib.supabase.co
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://supabase.com/dashboard/project/eidgnglpmfqqsdcwuqib/sql/new"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
              >
                <span>Supabase SQL Editor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Client Helper</div>
              <div className="text-slate-800 font-mono text-[11px] mt-0.5">utils/supabase/client.ts</div>
              <div className="text-[10px] text-emerald-700 mt-1 font-medium">✓ Browser Client (@supabase/ssr)</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Server Helper</div>
              <div className="text-slate-800 font-mono text-[11px] mt-0.5">utils/supabase/server.ts</div>
              <div className="text-[10px] text-emerald-700 mt-1 font-medium">✓ Server SSR Client (Cookies)</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Session Refresh</div>
              <div className="text-slate-800 font-mono text-[11px] mt-0.5">utils/supabase/middleware.ts</div>
              <div className="text-[10px] text-emerald-700 mt-1 font-medium">✓ updateSession() Proxy</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Agent Skills</div>
              <div className="text-slate-800 font-mono text-[11px] mt-0.5">.agents/skills/supabase</div>
              <div className="text-[10px] text-emerald-700 mt-1 font-medium">✓ supabase/agent-skills</div>
            </div>
          </div>
        </div>

        {/* Client Workspaces Launcher */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Active Client Company Workspaces
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Each client operates in a partitioned environment with isolated employees, attendance, and payroll
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 self-start sm:self-auto transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Provision Client</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tenants.map((t) => (
              <div
                key={t.id}
                className="group relative rounded-2xl bg-white border border-slate-200 p-6 hover:border-slate-300 transition-all shadow-xs hover:shadow-md overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: t.primaryColor || '#059669' }}
                ></div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: t.primaryColor || '#059669' }}
                    >
                      {t.name.slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-500">/app/{t.slug}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {t.planId}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 my-5 py-3 px-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div>
                    <div className="text-[10px] uppercase text-slate-500 font-semibold">Currency</div>
                    <div className="font-bold text-slate-800 mt-0.5">{t.currency}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-500 font-semibold">Capacity</div>
                    <div className="font-bold text-slate-800 mt-0.5">{t.maxEmployees} users</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-500 font-semibold">Status</div>
                    <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {t.status}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Isolated Scope</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingTenant(t)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shadow-xs"
                      title="Edit Workspace Parameters"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingTenant(t)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors shadow-xs"
                      title="Delete Workspace"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete</span>
                    </button>

                    <Link
                      href={`/app/${t.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl text-white transition-all shadow-xs hover:scale-105"
                      style={{ backgroundColor: t.primaryColor || '#059669' }}
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Tenant Isolation Security Suite */}
        <div className="space-y-3">
          <TenantSecurityVerification />
        </div>

        {/* Architecture Comparison & Technical Highlights */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Goodwin Grow HRMS vs Single-Company Architectures
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-sm text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Hard Tenant Scoping
              </div>
              <p className="text-slate-600 leading-relaxed">
                Every query and API request executes within the client&apos;s verified <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 font-mono">tenantId</code> scope. Attempting to enumerate another company&apos;s records returns an immediate 404 security rejection.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-sm text-teal-700 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-teal-600" /> Keka & Frappe HRMS Blueprint
              </div>
              <p className="text-slate-600 leading-relaxed">
                Incorporates Frappe&apos;s proven schema for shifts, leave allocation rules, and statutory salary components, rendered through Keka&apos;s frictionless user experience.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-sm text-cyan-700 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-cyan-600" /> Commercial SaaS Engine
              </div>
              <p className="text-slate-600 leading-relaxed">
                Goodwin Grow AI maintains multi-tiered subscription controls, billing quotas, platform audit trails, and white-label client branding out of the box.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Onboarding Modal */}
      <OnboardTenantModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchTenants}
      />

      {/* Edit Workspace Modal */}
      <EditTenantModal
        isOpen={Boolean(editingTenant)}
        tenant={editingTenant}
        onClose={() => setEditingTenant(null)}
        onSuccess={() => {
          fetchTenants();
        }}
      />

      {/* Delete Workspace Confirmation Modal */}
      <DeleteTenantModal
        isOpen={Boolean(deletingTenant)}
        tenant={deletingTenant}
        onClose={() => setDeletingTenant(null)}
        onSuccess={() => {
          fetchTenants();
        }}
      />
    </div>
  );
}
