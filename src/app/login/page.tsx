'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function UniversalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to authenticate');
      }

      // Store session state in both localStorage and cookie
      localStorage.setItem('currentUser', JSON.stringify(json.data.user));
      localStorage.setItem('authToken', json.data.token || 'demo-auth-token');
      document.cookie = `gg_user=${encodeURIComponent(JSON.stringify(json.data.user))}; path=/; max-age=86400`;
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('hrms-auth-change'));
      }

      router.push(json.data.redirectUrl || '/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (demoEmail: string, demoPass: string = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    // Trigger login with those credentials
    setTimeout(() => {
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass })
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            localStorage.setItem('currentUser', JSON.stringify(json.data.user));
            localStorage.setItem('authToken', json.data.token || 'demo-auth-token');
            document.cookie = `gg_user=${encodeURIComponent(JSON.stringify(json.data.user))}; path=/; max-age=86400`;
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('hrms-auth-change'));
            }
            router.push(json.data.redirectUrl);
          }
        });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-emerald-900/40 group-hover:scale-105 transition-transform">
              G
            </div>
            <div className="text-left">
              <span className="font-extrabold text-xl tracking-tight text-white block">
                GOODWIN GROW <span className="text-emerald-400">HRMS</span>
              </span>
              <span className="text-[11px] text-slate-400 -mt-1 block">One secure workspace for your workforce</span>
            </div>
          </Link>
        </div>

        {/* Login Card */}
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Welcome back</h2>
            <p className="text-xs text-slate-400">Sign in to your company workspace</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-300">Password</label>
                <Link href="/forgot-password" className="text-[11px] text-emerald-400 hover:text-emerald-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                />
                <span>Remember this device</span>
              </label>

              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SSL Encrypted</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Have an invitation token?{' '}
            <Link href="/activate" className="text-emerald-400 hover:text-emerald-300 font-semibold">
              Activate your account &rarr;
            </Link>
          </div>
        </div>

        {/* Quick Demo Persona Switcher (Client: Goodwin Batteries) */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Goodwin Batteries 1-Click Role Switcher
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Demo
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Click any role to test instant authentication, membership verification and routing:
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickDemoLogin('admin@goodwingrow.ai')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors"
            >
              <div className="font-bold text-emerald-400">Super Admin</div>
              <div className="text-[10px] text-slate-400">Goodwin Grow AI</div>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('rajesh.sharma@goodwinbatteries.com')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition-colors"
            >
              <div className="font-bold text-amber-400">Company Owner</div>
              <div className="text-[10px] text-slate-400">Goodwin Batteries</div>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('priya.nair@goodwinbatteries.com')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition-colors"
            >
              <div className="font-bold text-amber-400">HR Admin</div>
              <div className="text-[10px] text-slate-400">Priya Nair</div>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('amit.patel@goodwinbatteries.com')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition-colors"
            >
              <div className="font-bold text-amber-400">Manager</div>
              <div className="text-[10px] text-slate-400">Amit Patel</div>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('sunil.kumar@goodwinbatteries.com')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors"
            >
              <div className="font-bold text-emerald-400">Employee 1 (ESS)</div>
              <div className="text-[10px] text-slate-400">Sunil Kumar (Assembly Tech)</div>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('pooja.reddy@goodwinbatteries.com')}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors"
            >
              <div className="font-bold text-emerald-400">Employee 2 (ESS)</div>
              <div className="text-[10px] text-slate-400">Pooja Reddy (BMS Engineer)</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
