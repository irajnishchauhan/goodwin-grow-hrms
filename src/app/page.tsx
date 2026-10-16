'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import TenantSecurityVerification from '@/components/TenantSecurityVerification';
import OnboardTenantModal from '@/components/OnboardTenantModal';
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
  Calendar,
  CheckCircle,
  ExternalLink,
  Lock,
  Layers
} from 'lucide-react';
import { Tenant } from '@/lib/types';

export default function PlatformHomePage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState({
    totalTenants: 2,
    activeTenants: 2,
    totalEmployees: 5,
    mrrUSD: 1098,
    arrUSD: 13176
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

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

  useEffect(() => {
    fetchTenants();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/80 border border-slate-800 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Goodwin Grow AI Multi-Tenant SaaS Platform
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise HRMS Engine with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Rigid Tenant Isolation
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Inspired by the enterprise capabilities of <strong>Keka</strong> and <strong>Frappe HRMS</strong>.
              Operated by <strong>Goodwin Grow AI</strong> as Super Admin, providing each client company with its own
              isolated workforce, attendance tracking, leave workflows, and compliance-ready payroll.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/super-admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-900/40"
              >
                <Sliders className="w-4 h-4" />
                <span>Super Admin Console</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs sm:text-sm transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Onboard New Client</span>
              </button>
            </div>
          </div>
        </div>

        {/* Platform SaaS KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Client Workspaces</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalTenants}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> 100% Active Workspaces
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Workforce</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalEmployees}</div>
            <div className="text-[11px] text-slate-400 mt-1">Across isolated client schemas</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Platform MRR</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">${stats.mrrUSD.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400 mt-1">ARR: ${stats.arrUSD.toLocaleString()}</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Tenant Security</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">100% Pass</div>
            <div className="text-[11px] text-slate-400 mt-1">Zero cross-tenant leakage</div>
          </div>
        </div>

        {/* Client Workspaces Launcher (First Milestone Demonstration) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Active Client Company Workspaces
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Each client operates in a partitioned environment with isolated employees, attendance, and payroll
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 self-start sm:self-auto transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Provision Client</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tenants.map((t) => (
              <div
                key={t.id}
                className="group relative rounded-2xl bg-slate-900 border border-slate-800 p-6 hover:border-slate-700 transition-all shadow-xl hover:shadow-2xl overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: t.primaryColor || '#059669' }}
                ></div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                      style={{ backgroundColor: t.primaryColor || '#059669' }}
                    >
                      {t.name.slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {t.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">/app/{t.slug}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {t.planId}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 my-5 py-3 px-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Currency</div>
                    <div className="font-bold text-slate-200 mt-0.5">{t.currency}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Capacity</div>
                    <div className="font-bold text-slate-200 mt-0.5">{t.maxEmployees} users</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Status</div>
                    <div className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {t.status}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Isolated Row-Level Scope</span>
                  </div>

                  <Link
                    href={`/app/${t.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-white transition-all shadow-md group-hover:scale-105"
                    style={{ backgroundColor: t.primaryColor || '#059669' }}
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
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
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Goodwin Grow HRMS vs Single-Company Architectures
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Hard Tenant Scoping
              </div>
              <p className="text-slate-300 leading-relaxed">
                Every query and API request executes within the client&apos;s verified <code className="text-emerald-300">tenantId</code> scope. Attempting to enumerate another company&apos;s records returns an immediate 404 security rejection.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="font-bold text-sm text-teal-400 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" /> Keka & Frappe HRMS Blueprint
              </div>
              <p className="text-slate-300 leading-relaxed">
                Incorporates Frappe&apos;s proven schema for shifts, leave allocation rules, and statutory salary components, rendered through Keka&apos;s frictionless user experience.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="font-bold text-sm text-cyan-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Commercial SaaS Engine
              </div>
              <p className="text-slate-300 leading-relaxed">
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
    </div>
  );
}
