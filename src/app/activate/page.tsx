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
  AlertCircle
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
    if (initialToken) {
      validateToken(initialToken);
    }
  }, [initialToken]);

  const validateToken = async (tok: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/auth/activate?token=${encodeURIComponent(tok)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Invalid activation token');
      }
      setInvitationDetails(json.data);
      setFullName(json.data.employeeName);
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
        body: JSON.stringify({ token, password, fullName })
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white shadow-lg">
              G
            </div>
            <span className="font-bold text-lg text-white">
              GOODWIN GROW <span className="text-emerald-400">HRMS</span>
            </span>
          </Link>
          <h2 className="text-2xl font-extrabold text-white mt-3">Activate Your Account</h2>
          <p className="text-xs text-slate-400">Set your secure credentials to join your company workspace</p>
        </div>

        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="font-bold text-sm">Account Activated!</div>
              <p className="text-[11px] text-slate-300">Redirecting to your employee self-service dashboard...</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Invitation Token</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter or paste token..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => validateToken(token)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs whitespace-nowrap border border-slate-700"
                  >
                    Verify
                  </button>
                </div>
              </div>

              {invitationDetails && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 animate-fade-in text-slate-300">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Building2 className="w-4 h-4" />
                    <span>{invitationDetails.tenantName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Invited as <strong className="text-white">{invitationDetails.role}</strong> for email{' '}
                    <span className="font-mono text-slate-200">{invitationDetails.email}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Create Password (min 8 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Activating Membership...' : 'Complete Activation & Join'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-slate-800 text-center text-xs text-slate-400">
            Already have an active account?{' '}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
              Sign In &rarr;
            </Link>
          </div>
        </div>

        {/* Example Token Helper for Testing Goodwin Batteries */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-[11px] space-y-2">
          <div className="font-bold text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Account Activation Tokens (Goodwin Batteries)</span>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => {
                setToken('inv-tok-neha-7743');
                validateToken('inv-tok-neha-7743');
              }}
              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left flex justify-between"
            >
              <span>Neha Singh (QC Chemist)</span>
              <span className="font-mono text-emerald-400">Load Token</span>
            </button>
            <button
              onClick={() => {
                setToken('inv-tok-manoj-1122');
                validateToken('inv-tok-manoj-1122');
              }}
              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left flex justify-between"
            >
              <span>Manoj Tiwari (Warehouse)</span>
              <span className="font-mono text-emerald-400">Load Token</span>
            </button>
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading activation portal...
        </div>
      }
    >
      <AccountActivationForm />
    </React.Suspense>
  );
}
