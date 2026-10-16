'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Sliders,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Layers
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Determine current active context
  const isSuperAdmin = pathname.startsWith('/super-admin');
  const isGoodwin = pathname.includes('/goodwin-tech');
  const isNexus = pathname.includes('/nexus-ai');

  let currentContext = 'Platform Overview';
  if (isSuperAdmin) currentContext = 'Super Admin Console';
  else if (isGoodwin) currentContext = 'Goodwin Technologies Workspace';
  else if (isNexus) currentContext = 'Nexus AI Labs Workspace';

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/40 group-hover:scale-105 transition-transform">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  Goodwin Grow <span className="text-emerald-400">HRMS</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SaaS Core
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">Enterprise Multi-Tenant Platform</p>
            </div>
          </Link>

          {/* Quick Context Switcher */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium text-slate-100">{currentContext}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 text-xs"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                  Platform Operations
                </div>
                <Link
                  href="/super-admin"
                  className="flex items-center justify-between px-3 py-2 text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Super Admin Console
                  </span>
                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">Platform</span>
                </Link>

                <div className="border-t border-slate-800 my-1"></div>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                  Client Workspaces (Tenant Isolated)
                </div>

                <Link
                  href="/app/goodwin-tech"
                  className="flex items-center justify-between px-3 py-2 text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Goodwin Technologies
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">INR</span>
                </Link>

                <Link
                  href="/app/nexus-ai"
                  className="flex items-center justify-between px-3 py-2 text-slate-200 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    Nexus AI Labs
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono">USD</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Security Shield & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-[11px] tracking-wide">Tenant Isolation Enforced</span>
          </div>

          <Link
            href="/super-admin"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-700/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Super Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
