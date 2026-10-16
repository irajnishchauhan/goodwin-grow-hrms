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
  Plus,
  ArrowRight,
  Sliders,
  DollarSign,
  Activity,
  Layers,
  CheckCircle,
  ExternalLink,
  Lock,
  Clock,
  Key
} from 'lucide-react';
import { Tenant, AuditLogEntry } from '@/lib/types';

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState({
    totalTenants: 2,
    activeTenants: 2,
    totalEmployees: 5,
    mrrUSD: 1098,
    arrUSD: 13176
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPlatformData = async () => {
    try {
      const res = await fetch('/api/super-admin/tenants');
      const json = await res.json();
      if (json.success) {
        setTenants(json.data.tenants);
        setStats(json.data.stats);
        setAuditLogs(json.data.recentAuditLogs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Link href="/" className="hover:text-emerald-400">Home</Link>
              <span>/</span>
              <span className="text-emerald-400">Super Admin Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Sliders className="w-7 h-7 text-emerald-400" />
              Goodwin Grow AI — Platform Super Admin
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Fleet management of client company tenants, subscriptions, cross-company security and platform audit logs
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Client Company</span>
          </button>
        </div>

        {/* Platform SaaS Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Active Client Fleets</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.totalTenants}</div>
            <p className="text-[11px] text-emerald-400 mt-1">100% active client subscriptions</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Managed Employees</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{stats.totalEmployees}</div>
            <p className="text-[11px] text-slate-400 mt-1">Total workforce across all clients</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Platform MRR</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">${stats.mrrUSD.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-400 mt-1">ARR: ${stats.arrUSD.toLocaleString()} run rate</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Tenant Partitioning</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">Strict Row-Level</div>
            <p className="text-[11px] text-slate-400 mt-1">Zero cross-tenant attack surface</p>
          </div>
        </div>

        {/* Live Tenant Isolation Verification Card */}
        <TenantSecurityVerification />

        {/* Client Companies Management Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Client Company Workspaces
              </h2>
              <p className="text-xs text-slate-400">Full list of organizations provisioned on Goodwin Grow HRMS</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
              {tenants.length} Workspaces
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 uppercase font-semibold text-[10px] text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Company Workspace</th>
                  <th className="px-6 py-3.5">Tenant Slug</th>
                  <th className="px-6 py-3.5">Plan Tier</th>
                  <th className="px-6 py-3.5">Country & Currency</th>
                  <th className="px-6 py-3.5">Capacity</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow"
                          style={{ backgroundColor: t.primaryColor || '#059669' }}
                        >
                          {t.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{t.name}</div>
                          <div className="text-[11px] text-slate-400">ID: {t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-400">/app/{t.slug}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {t.planId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-200">{t.country}</span>
                      <span className="ml-1 text-slate-400 font-mono">({t.currency})</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-200">{t.maxEmployees} employees</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/${t.slug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all hover:scale-105"
                      >
                        <span>Access Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Audit Logs Timeline */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Platform Security & Operations Audit Trail
              </h2>
              <p className="text-xs text-slate-400">Cryptographically immutable logs for platform compliance</p>
            </div>
            <span className="text-xs font-mono text-slate-400">Live Telemetry</span>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <div>
                    <span className="font-semibold text-white">{log.action}</span>
                    <span className="text-slate-400 ml-2">by</span>{' '}
                    <span className="font-mono text-emerald-400">{log.actorEmail}</span>
                    {log.tenantName && (
                      <span className="text-slate-400 ml-2">
                        in <span className="text-slate-300 font-semibold">{log.tenantName}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px] self-end sm:self-auto">
                  <span>IP: {log.ipAddress}</span>
                  <span>•</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <OnboardTenantModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchPlatformData}
      />
    </div>
  );
}
