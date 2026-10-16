'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Server,
  Database,
  Key
} from 'lucide-react';

interface SecurityCheck {
  id: string;
  title: string;
  description: string;
  passed: boolean;
  details: string;
}

interface IsolationReport {
  overallPassed: boolean;
  timestamp: string;
  checks: SecurityCheck[];
}

export default function TenantSecurityVerification() {
  const [report, setReport] = useState<IsolationReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchVerification = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/verify-isolation', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setReport(json.data);
      }
    } catch (e) {
      console.error('Failed to run isolation check', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerification();
  }, []);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 text-white p-6 shadow-xl relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-white">
                Multi-Tenant Cryptographic Isolation Sentinel
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Active Defense
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated runtime attack simulation testing cross-tenant leak prevention and IDOR boundaries
            </p>
          </div>
        </div>

        <button
          onClick={fetchVerification}
          disabled={loading}
          className="flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-900/40 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Executing Attack Simulation...' : 'Run Security Audit'}</span>
        </button>
      </div>

      {/* Grid of Security Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {report?.checks.map((check) => (
          <div
            key={check.id}
            className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4 transition-all hover:bg-slate-800/90"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {check.id === 'SEC-CHK-01' && <Database className="w-4 h-4 text-emerald-400 shrink-0" />}
                {check.id === 'SEC-CHK-02' && <Lock className="w-4 h-4 text-emerald-400 shrink-0" />}
                {check.id === 'SEC-CHK-03' && <Key className="w-4 h-4 text-emerald-400 shrink-0" />}
                {check.id === 'SEC-CHK-04' && <Server className="w-4 h-4 text-emerald-400 shrink-0" />}
                <h4 className="text-sm font-semibold text-white">{check.title}</h4>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  check.passed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {check.passed ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Passed
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    Breach
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2 font-medium">{check.description}</p>
            <div className="mt-2.5 p-2 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px] text-emerald-400/90 leading-relaxed">
              {check.details}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Verified Target: Row-Level Partitioning & Multi-Tenant Middleware</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Last Verified: {report?.timestamp ? new Date(report.timestamp).toLocaleTimeString() : 'Just now'}
        </div>
      </div>
    </div>
  );
}
