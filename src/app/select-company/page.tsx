'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { TenantMembership } from '@/lib/types';

function SelectCompanyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check localStorage session
    const raw = localStorage.getItem('currentUser');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setMemberships(u.memberships || []);
        setUserName(u.name || 'User');
      } catch (e) {
        console.error(e);
      }
    } else {
      // Fallback sample memberships for testing
      setMemberships([
        { id: 'm1', tenantId: 'tenant-goodwin-batteries', tenantName: 'Goodwin Batteries Pvt Ltd', tenantSlug: 'goodwin-batteries', role: 'COMPANY_ADMIN', status: 'ACTIVE' },
        { id: 'm2', tenantId: 'tenant-goodwin', tenantName: 'Goodwin Technologies Pvt Ltd', tenantSlug: 'goodwin-tech', role: 'COMPANY_ADMIN', status: 'ACTIVE' }
      ]);
    }
  }, [userId]);

  const handleSelectWorkspace = (slug: string, role: string) => {
    if (role === 'COMPANY_ADMIN') {
      router.push(`/app/${slug}`);
    } else if (role === 'HR_ADMIN') {
      router.push(`/app/${slug}/employees`);
    } else if (role === 'MANAGER') {
      router.push(`/app/${slug}/attendance`);
    } else {
      router.push(`/app/${slug}/my-dashboard`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Multi-Company Membership Verified</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-2">Select Your Workspace</h1>
          <p className="text-xs text-slate-400">
            Welcome back, <strong className="text-white">{userName}</strong>. Choose the company workspace to enter:
          </p>
        </div>

        <div className="space-y-3">
          {memberships.map((m) => (
            <div
              key={m.id}
              onClick={() => handleSelectWorkspace(m.tenantSlug, m.role)}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/60 cursor-pointer transition-all shadow-xl hover:shadow-2xl flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-base group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                    {m.tenantName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {m.role}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">/app/{m.tenantSlug}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>Enter</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link href="/login" className="text-xs text-slate-400 hover:text-white">
            &larr; Switch account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SelectCompanyPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading company workspaces...
        </div>
      }
    >
      <SelectCompanyContent />
    </React.Suspense>
  );
}
