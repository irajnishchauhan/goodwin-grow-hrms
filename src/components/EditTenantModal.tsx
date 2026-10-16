'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Sliders,
  DollarSign,
  Palette,
  ShieldCheck,
  Check,
  Briefcase,
  Globe,
  MapPin,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react';
import { Tenant } from '@/lib/types';

interface EditTenantModalProps {
  isOpen: boolean;
  tenant: Tenant | null;
  onClose: () => void;
  onSuccess: (updatedTenant: Tenant) => void;
}

const COLOR_PRESETS = [
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Cobalt Blue', hex: '#3B82F6' },
  { name: 'Royal Purple', hex: '#8B5CF6' },
  { name: 'Ruby Rose', hex: '#E11D48' },
  { name: 'Cyan Sky', hex: '#06B6D4' }
];

export default function EditTenantModal({
  isOpen,
  tenant,
  onClose,
  onSuccess
}: EditTenantModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [industry, setIndustry] = useState('');
  const [planId, setPlanId] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [maxEmployees, setMaxEmployees] = useState(100);
  const [currency, setCurrency] = useState('INR');
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'TRIAL'>('ACTIVE');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  const [website, setWebsite] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || '');
      setSlug(tenant.slug || '');
      setCompanyCode(tenant.companyCode || '');
      setIndustry(tenant.industry || '');
      setPlanId((tenant.planId as any) || 'growth');
      setMaxEmployees(tenant.maxEmployees || 100);
      setCurrency(tenant.currency || 'INR');
      setPrimaryColor(tenant.primaryColor || '#059669');
      setStatus((tenant.status as any) || 'ACTIVE');
      setBusinessEmail(tenant.businessEmail || '');
      setBusinessPhone(tenant.businessPhone || '');
      setRegisteredAddress(tenant.registeredAddress || '');
      setCity(tenant.city || '');
      setCountry(tenant.country || 'India');
      setWebsite(tenant.website || '');
      setError(null);
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/super-admin/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tenant.id,
          name,
          slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
          companyCode: companyCode.trim().toUpperCase(),
          industry,
          planId,
          maxEmployees: Number(maxEmployees),
          currency,
          primaryColor,
          status,
          businessEmail,
          businessPhone,
          registeredAddress,
          city,
          country,
          website
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update workspace');
      }

      onSuccess(json.data.tenant);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto font-sans">
      <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow"
              style={{ backgroundColor: primaryColor }}
            >
              {name.slice(0, 1) || 'W'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Edit Client Workspace</h2>
              <p className="text-[11px] text-slate-400">Modify company parameters, tier capacity, and brand styling</p>
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
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Core */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Workspace Identity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Workspace Route Slug *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono">/app/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full pl-14 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Company Code Prefix</label>
                <input
                  type="text"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  placeholder="GOODWIN-BAT"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          </div>

          {/* Plan, Capacity & Status */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Subscription & Capacity Limits</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Plan Tier</label>
                <select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="starter">Starter Plan (25 seats)</option>
                  <option value="growth">Growth Plan (100 seats)</option>
                  <option value="enterprise">Enterprise Plan (1,000 seats)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max Seat Capacity</label>
                <input
                  type="number"
                  min={5}
                  max={5000}
                  value={maxEmployees}
                  onChange={(e) => setMaxEmployees(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="ACTIVE">ACTIVE (Full Access)</option>
                  <option value="TRIAL">TRIAL (14-day evaluation)</option>
                  <option value="SUSPENDED">SUSPENDED (Read-only)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Currency & Brand Theme */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>Currency & Brand Primary Color</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operating Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="INR">INR (₹ Indian Rupee)</option>
                  <option value="USD">USD ($ United States Dollar)</option>
                  <option value="EUR">EUR (€ Euro)</option>
                  <option value="GBP">GBP (£ British Pound)</option>
                  <option value="AED">AED (د.إ UAE Dirham)</option>
                  <option value="SGD">SGD (S$ Singapore Dollar)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Primary Brand Accent</label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setPrimaryColor(c.hex)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform ${
                        primaryColor === c.hex ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {primaryColor === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg bg-transparent cursor-pointer ml-1"
                    title="Custom color"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Location Details */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>Contact & Headquarters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Business Email</label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Business Phone</label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">City & Facility</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
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
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-50"
            >
              {loading ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Workspace Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
