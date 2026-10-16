'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Settings,
  Building2,
  Palette,
  ShieldCheck,
  CreditCard,
  Key,
  Save,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { Tenant } from '@/lib/types';
import RoleGuard from '@/components/RoleGuard';

const COLORS = [
  { name: 'Emerald', value: '#059669' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Amber', value: '#D97706' },
  { name: 'Rose', value: '#E11D48' }
];

export default function TenantSettingsPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#059669');
  const [currency, setCurrency] = useState('USD');
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await fetch(`/api/tenants/${tenantSlug}/employees`);
        const json = await res.json();
        if (json.success && json.data.tenant) {
          setTenant(json.data.tenant);
          setName(json.data.tenant.name);
          setSelectedColor(json.data.tenant.primaryColor || '#059669');
          setCurrency(json.data.tenant.currency);
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (tenantSlug) fetchTenant();
  }, [tenantSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          primaryColor: selectedColor,
          currency
        })
      });
      const json = await res.json();
      if (json.success) {
        setTenant(json.data.tenant);
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3500);
      }
    } catch (err) {
      console.error('Failed to save tenant settings', err);
    }
  };

  return (
    <RoleGuard
      tenantSlug={tenantSlug}
      requiredRoles={['COMPANY_ADMIN', 'SUPER_ADMIN']}
      moduleName="Company Settings & Branding"
    >
      <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          Company Branding & Workspace Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          White-label themes, regional currency defaults, and security keys for {tenant?.name}
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Branding and settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* White-Label Branding Card */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-400" />
            White-Label Brand Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Company Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Portal Domain</label>
              <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 px-3 py-2 font-mono">
                <Globe className="w-3.5 h-3.5 mr-2 text-slate-500" />
                <span>{tenant?.domain || `${tenantSlug}.goodwingrow.com`}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-2">Primary Accent Color Theme</label>
            <div className="flex items-center gap-3">
              {COLORS.map((col) => (
                <button
                  type="button"
                  key={col.value}
                  onClick={() => setSelectedColor(col.value)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    selectedColor === col.value ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: col.value }}
                  title={col.name}
                >
                  {selectedColor === col.value && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription & Plan Card */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Subscription & Capacity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Plan</span>
              <div className="text-base font-extrabold text-emerald-400 mt-1 uppercase">
                {tenant?.planId || 'Growth'}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Seats Capacity</span>
              <div className="text-base font-extrabold text-white mt-1">
                {tenant?.maxEmployees || 100} Employees
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Operating Currency</span>
              <div className="text-base font-extrabold text-white mt-1">{currency}</div>
            </div>
          </div>
        </div>

        {/* Tenant API & Webhooks */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            Tenant Integration Keys
          </h2>
          <div className="space-y-2">
            <label className="block text-slate-400 font-mono text-[11px]">X-TENANT-ID HEADER</label>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-emerald-400 text-xs select-all">
              {tenant?.id || 'tenant-id'}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </form>
    </div>
    </RoleGuard>
  );
}
