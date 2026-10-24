'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  User,
  CheckCircle2,
  Sparkles,
  Building2,
  ArrowRight,
  AlertCircle,
  Mail
} from 'lucide-react';

function AccountActivationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [invitationDetails, setInvitationDetails] = useState<{
    token: string;
    tenantName: string;
    employeeName: string;
    email: string;
    role: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate token if provided in query string
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Activate Account | Goodwin Grow HRMS';
    }
    if (initialToken) {
      validateToken(initialToken);
    }
  }, [initialToken]);

  const validateToken = async (tok: string) => {
    if (!tok || !tok.trim()) return;
    setError(null);
    try {
      const res = await fetch(`/api/auth/activate?token=${encodeURIComponent(tok.trim())}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Invalid activation token');
      }
      setInvitationDetails(json.data);
      setFullName(json.data.employeeName);
      if (json.data.token) {
        setToken(json.data.token);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid token');
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), password, fullName })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to activate account');
      }

      setSuccess(true);
      localStorage.setItem('currentUser', JSON.stringify(json.data.user));

      setTimeout(() => {
        router.push(json.data.redirectUrl || '/login');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Activation error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-1.5">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 p-0.5 flex items-center justify-center font-bold text-white shadow-md overflow-hidden">
              <img src="/goodwin-logo.png" alt="Goodwin Grow HRMS" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-xl text-slate-900">
              GOODWIN GROW <span className="text-emerald-600">HRMS</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Activate Your Account</h2>
          <p className="text-xs text-slate-500 font-medium">Set your secure credentials to join your company workspace</p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-5 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2 animate-fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="font-extrabold text-base">Account Activated!</div>
              <p className="text-xs text-slate-600 font-medium">Redirecting to your employee self-service dashboard...</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Invitation Token</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter or paste token..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => validateToken(token)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs whitespace-nowrap border border-slate-300 transition-colors cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              </div>

              {invitationDetails && (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1.5 animate-fade-in text-slate-800">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>{invitationDetails.tenantName}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    Invited as <strong className="text-slate-900 font-bold">{invitationDetails.role}</strong> for{' '}
                    <span className="font-mono text-slate-800 font-semibold">{invitationDetails.email}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Create Password (min 8 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Activating Membership...' : 'Complete Activation & Join'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
            Already have an active account?{' '}
            <Link href="/login" className="text-emerald-700 hover:text-emerald-600 font-bold">
              Sign In &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountActivationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-xs font-semibold">
          Loading activation portal...
        </div>
      }
    >
      <AccountActivationForm />
    </React.Suspense>
  );
}
