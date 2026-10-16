'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Sliders,
  ChevronDown,
  Sparkles,
  Layers,
  Check
} from 'lucide-react';
import { Tenant } from '@/lib/types';

export default function Navbar() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    fetch('/api/super-admin/tenants')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.tenants)) {
          setTenants(json.data.tenants);
        }
      })
      .catch((err) => console.error('Failed to load tenants in navbar', err));
  }, []);

  // Determine current active context
  const isSuperAdmin = pathname.startsWith('/super-admin');
  
  // Find if on an active tenant workspace
  const currentTenant = tenants.find((t) => pathname.startsWith(`/app/${t.slug}`));

  let currentContext = 'Platform Overview';
  if (isSuperAdmin) {
    currentContext = 'Super Admin Console';
  } else if (currentTenant) {
    currentContext = currentTenant.name;
  } else if (pathname.startsWith('/app/')) {
    const slug = pathname.split('/')[2];
    currentContext = slug ? slug.replace(/-/g, ' ') : 'Workspace';
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Goodwin Grow <span className="text-emerald-600">HRMS</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  SaaS Core
                </span>
              </div>
              <p className="text-[11px] text-slate-500 -mt-0.5">Enterprise Multi-Tenant Platform</p>
            </div>
          </Link>

          {/* Quick Context Switcher */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 transition-all max-w-[260px]"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-medium text-slate-900 truncate">{currentContext}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1 shrink-0" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-50 text-xs"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                  Platform Operations
                </div>
                <Link
                  href="/"
                  className={`flex items-center justify-between px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors ${
                    pathname === '/' ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Platform Overview
                  </span>
                  {pathname === '/' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </Link>

                <Link
                  href="/super-admin"
                  className={`flex items-center justify-between px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors ${
                    isSuperAdmin ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    Super Admin Console
                  </span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">Platform</span>
                </Link>

                <div className="border-t border-slate-100 my-1"></div>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Client Workspaces ({tenants.length})</span>
                  <span className="text-[9px] text-emerald-600 font-mono">Tenant Isolated</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-0.5 px-1">
                  {tenants.map((t) => {
                    const isSelected = pathname.startsWith(`/app/${t.slug}`);
                    return (
                      <Link
                        key={t.id}
                        href={`/app/${t.slug}`}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-emerald-50 text-emerald-700 font-semibold' : ''
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.primaryColor || '#059669' }}
                          />
                          <span className="truncate">{t.name}</span>
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                            {t.currency}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Shield & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-[11px] tracking-wide">Tenant Isolation Enforced</span>
          </div>

          <Link
            href="/super-admin"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
