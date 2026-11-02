'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [receivedCode, setReceivedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifiedName, setVerifiedName] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'VERIFY_EMAIL' | 'SET_PASSWORD'>('VERIFY_EMAIL');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Reset Password | Goodwin Grow HRMS';
    }
  }, []);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Account not found.');
      }

      setVerifiedName(json.data?.employeeName || 'Team Member');
      if (json.data?.verificationCode) {
        setReceivedCode(json.data.verificationCode);
        setVerificationCode(json.data.verificationCode);
      }
      setStep('SET_PASSWORD');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to verify email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !verificationCode.trim()) {
      setError('6-digit security code is required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: verificationCode.trim(),
          newPassword
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update password.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (receivedCode) {
      navigator.clipboard.writeText(receivedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-1.5">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-md">
              G
            </div>
            <span className="font-extrabold text-xl text-slate-900">
              GOODWIN GROW <span className="text-emerald-600">HRMS</span>
            </span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Reset Your Password</h2>
          <p className="text-xs text-slate-500 font-medium">Verified password recovery for employees and managers</p>
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
              <div className="font-extrabold text-base">Password Reset Successfully!</div>
              <p className="text-xs text-slate-600 font-medium">Redirecting you to the login screen...</p>
            </div>
          )}

          {!success && step === 'VERIFY_EMAIL' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. kiranpatidar.goodwinbatteries@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Enter the email address registered with your Goodwin Batteries account.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Verifying Account...' : 'Continue to Reset Password'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {!success && step === 'SET_PASSWORD' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-950">Account: {verifiedName}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                    Verified
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-mono truncate">{email}</div>

                {receivedCode && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-800 block font-semibold">Security Verification Code:</span>
                      <span className="font-mono font-black text-sm text-emerald-900 tracking-widest">{receivedCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={copyCode}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-700 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">6-Digit Security Code *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password (min 8 chars) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('VERIFY_EMAIL')}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{loading ? 'Verifying & Updating...' : 'Save New Password & Login'}</span>
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
            Remember your credentials?{' '}
            <Link href="/login" className="text-emerald-700 hover:text-emerald-600 font-bold inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
