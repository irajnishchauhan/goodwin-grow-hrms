'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Trash2,
  ShieldAlert,
  Building2,
  Users,
  CreditCard,
  FolderLock
} from 'lucide-react';
import { Tenant } from '@/lib/types';

interface DeleteTenantModalProps {
  isOpen: boolean;
  tenant: Tenant | null;
  onClose: () => void;
  onSuccess: (deletedTenantId: string) => void;
}

export default function DeleteTenantModal({
  isOpen,
  tenant,
  onClose,
  onSuccess
}: DeleteTenantModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !tenant) return null;

  const isConfirmed =
    confirmText.trim().toLowerCase() === tenant.slug.toLowerCase() ||
    confirmText.trim().toLowerCase() === tenant.name.toLowerCase();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/super-admin/tenants?id=${tenant.id}`, {
        method: 'DELETE'
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete workspace');
      }

      onSuccess(tenant.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl p-6 sm:p-8 space-y-5 text-slate-100 text-xs">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Delete Client Workspace</h2>
              <p className="text-[11px] text-slate-400">Irreversible multi-tenant purge</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
            <p className="text-slate-200 text-xs leading-relaxed">
              You are about to permanently delete{' '}
              <strong className="text-white font-bold">{tenant.name}</strong> (
              <span className="font-mono text-emerald-400">/app/{tenant.slug}</span>).
            </p>
            <p className="text-[11px] text-rose-300/90 leading-relaxed">
              This action <strong>cannot be undone</strong>. All data associated with this workspace will be immediately and permanently removed:
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside pt-1">
              <li>All employee profiles & logins ({tenant.maxEmployees} seat capacity)</li>
              <li>Biometric attendance clocks & daily punch history</li>
              <li>Leave applications, balances & approval logs</li>
              <li>Generated salary slips & statutory reports</li>
              <li>Document vault files & invitation tokens</li>
            </ul>
          </div>

          <form onSubmit={handleDelete} className="space-y-4 pt-1">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                To confirm deletion, type <code className="text-emerald-400 font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{tenant.slug}</code> below:
              </label>
              <input
                type="text"
                required
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={tenant.slug}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/40 text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!isConfirmed || loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-lg shadow-rose-950/60 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>{loading ? 'Deleting Workspace...' : 'Permanently Delete Workspace'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
