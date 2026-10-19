'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  CalendarCheck,
  ShieldAlert,
  X,
  Filter,
  Check
} from 'lucide-react';
import { Holiday } from '@/lib/types';

interface HolidayCalendarManagerProps {
  tenantSlug: string;
  canManage?: boolean;
  onHolidayChange?: () => void;
}

export default function HolidayCalendarManager({
  tenantSlug,
  canManage = true,
  onHolidayChange
}: HolidayCalendarManagerProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'MANDATORY' | 'OPTIONAL'>('ALL');

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [isOptional, setIsOptional] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Modal State for Delete Confirmation
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Seeding State
  const [seeding, setSeeding] = useState<boolean>(false);

  // Calculate day of week live for the modal date
  const modalDayOfWeek = useMemo(() => {
    if (!date) return '';
    try {
      return new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'UTC'
      });
    } catch {
      return '';
    }
  }, [date]);

  // Fetch holidays for selected year
  const fetchHolidays = async (year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/holidays?year=${year}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      const json = await res.json();
      if (json.success && json.data) {
        setHolidays(json.data.holidays || []);
      }
    } catch (e) {
      console.error('Failed to fetch holidays:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchHolidays(selectedYear);
    }
  }, [tenantSlug, selectedYear]);

  // Filtered Holidays
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      if (filterType === 'MANDATORY' && h.isOptional) return false;
      if (filterType === 'OPTIONAL' && !h.isOptional) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return h.name.toLowerCase().includes(q) || h.date.includes(q) || h.dayOfWeek.toLowerCase().includes(q);
      }
      return true;
    });
  }, [holidays, filterType, searchQuery]);

  // Statistics
  const totalCount = holidays.length;
  const mandatoryCount = holidays.filter((h) => !h.isOptional).length;
  const optionalCount = holidays.filter((h) => h.isOptional).length;

  // Next Upcoming Holiday
  const upcomingHoliday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = holidays
      .filter((h) => h.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] || null;
  }, [holidays]);

  // Handlers
  const handleOpenAdd = () => {
    setModalMode('ADD');
    setEditingId(null);
    setName('');
    setDate(`${selectedYear}-01-01`);
    setIsOptional(false);
    setIsModalOpen(true);
    setFeedback(null);
  };

  const handleOpenEdit = (h: Holiday) => {
    setModalMode('EDIT');
    setEditingId(h.id);
    setName(h.name);
    setDate(h.date);
    setIsOptional(Boolean(h.isOptional));
    setIsModalOpen(true);
    setFeedback(null);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      setFeedback({ type: 'error', message: 'Please provide both holiday name and date' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const url = `/api/tenants/${tenantSlug}/holidays`;
      const method = modalMode === 'ADD' ? 'POST' : 'PUT';
      const body = modalMode === 'ADD'
        ? { name: name.trim(), date, isOptional }
        : { id: editingId, name: name.trim(), date, isOptional };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();

      if (json.success) {
        setFeedback({
          type: 'success',
          message: modalMode === 'ADD' ? 'Holiday created successfully!' : 'Holiday updated successfully!'
        });
        setIsModalOpen(false);
        fetchHolidays(selectedYear);
        if (onHolidayChange) onHolidayChange();
      } else {
        setFeedback({ type: 'error', message: json.error || 'Failed to save holiday' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error saving holiday' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async () => {
    if (!deletingHoliday) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/holidays?id=${deletingHoliday.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();

      if (json.success) {
        setFeedback({ type: 'success', message: `Holiday "${deletingHoliday.name}" deleted successfully` });
        setDeletingHoliday(null);
        fetchHolidays(selectedYear);
        if (onHolidayChange) onHolidayChange();
      } else {
        setFeedback({ type: 'error', message: json.error || 'Failed to delete holiday' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error deleting holiday' });
    } finally {
      setDeleting(false);
    }
  };

  const handleSeedHolidays = async () => {
    if (!confirm(`Pre-fill standard public & gazetted holidays for calendar year ${selectedYear}?`)) {
      return;
    }

    setSeeding(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/holidays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SEED', year: selectedYear })
      });
      const json = await res.json();

      if (json.success) {
        setFeedback({
          type: 'success',
          message: `Successfully populated standard public holidays for calendar year ${selectedYear}!`
        });
        fetchHolidays(selectedYear);
        if (onHolidayChange) onHolidayChange();
      } else {
        setFeedback({ type: 'error', message: json.error || 'Failed to seed holidays' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error seeding holidays' });
    } finally {
      setSeeding(false);
    }
  };

  // Helper for relative date text
  const getRelativeDateBadge = (holidayDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (holidayDate === today) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white animate-pulse">
          Today
        </span>
      );
    }
    if (holidayDate < today) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
          Passed
        </span>
      );
    }
    const diffDays = Math.ceil(
      (new Date(holidayDate + 'T00:00:00Z').getTime() - new Date(today + 'T00:00:00Z').getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        In {diffDays} day{diffDays === 1 ? '' : 's'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Calendar Year Holiday Schedule
              </h2>
              <p className="text-xs text-slate-500">
                Official paid leaves & gazetted observances. Unpunched employees are automatically marked on holiday.
              </p>
            </div>
          </div>
        </div>

        {/* Year Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          {[2025, 2026, 2027].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedYear === yr
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Holidays</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCount} Days</div>
          <p className="text-[11px] text-slate-500">Scheduled for year {selectedYear}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Mandatory / Public</span>
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{mandatoryCount} Days</div>
          <p className="text-[11px] text-slate-500">Paid company-wide off</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Optional / Floating</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{optionalCount} Days</div>
          <p className="text-[11px] text-slate-500">Restricted holiday options</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Next Holiday</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          {upcomingHoliday ? (
            <>
              <div className="text-sm font-black text-slate-900 truncate" title={upcomingHoliday.name}>
                {upcomingHoliday.name}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {upcomingHoliday.date} ({upcomingHoliday.dayOfWeek.slice(0, 3)})
              </p>
            </>
          ) : (
            <>
              <div className="text-sm font-bold text-slate-400">No Upcoming</div>
              <p className="text-[11px] text-slate-400">All holidays elapsed</p>
            </>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search holidays by name or date..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Filter Type */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'ALL' | 'MANDATORY' | 'OPTIONAL')}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="MANDATORY">Mandatory Only</option>
              <option value="OPTIONAL">Optional Only</option>
            </select>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedHolidays}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              title={`Pre-fill standard public & gazetted holidays for year ${selectedYear}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{seeding ? 'Populating...' : `Pre-fill ${selectedYear} Holidays`}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Holiday</span>
            </button>
          </div>
        )}
      </div>

      {/* Holidays List / Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {selectedYear} Holiday Schedule ({filteredHolidays.length} Listed)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Sorted chronologically
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Clock className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            Loading {selectedYear} holiday calendar...
          </div>
        ) : filteredHolidays.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-3 max-w-sm mx-auto">
            <Calendar className="w-10 h-10 mx-auto text-slate-300" />
            <div className="font-bold text-slate-700 text-sm">
              No Holidays Found for {selectedYear}
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              No holidays match your filter, or holidays haven&apos;t been set up yet for this calendar year.
            </p>
            {canManage && (
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleSeedHolidays}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition-colors cursor-pointer"
                >
                  Pre-fill Standard Holidays
                </button>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Add Custom Holiday
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase font-semibold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Date & Day</th>
                  <th className="px-6 py-3.5">Holiday Name</th>
                  <th className="px-6 py-3.5">Type & Classification</th>
                  <th className="px-6 py-3.5">Status</th>
                  {canManage && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredHolidays.map((h) => {
                  const dateObj = new Date(h.date + 'T00:00:00Z');
                  const monthName = dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    timeZone: 'UTC'
                  });
                  const dayNum = dateObj.toLocaleDateString('en-US', {
                    day: '2-digit',
                    timeZone: 'UTC'
                  });

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date Badge */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-center shrink-0">
                            <span className="text-[9px] font-black uppercase text-emerald-700 leading-none">
                              {monthName}
                            </span>
                            <span className="text-sm font-black text-slate-900 leading-tight">
                              {dayNum}
                            </span>
                          </div>
                          <div>
                            <div className="font-mono font-bold text-slate-900 text-xs">{h.date}</div>
                            <div className="text-[11px] font-medium text-slate-500">{h.dayOfWeek}</div>
                          </div>
                        </div>
                      </td>

                      {/* Holiday Name */}
                      <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                        {h.name}
                      </td>

                      {/* Classification */}
                      <td className="px-6 py-4">
                        {h.isOptional ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            Optional / Restricted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Mandatory Public Holiday
                          </span>
                        )}
                      </td>

                      {/* Relative Status */}
                      <td className="px-6 py-4">{getRelativeDateBadge(h.date)}</td>

                      {/* Actions */}
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(h)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 font-semibold text-xs transition-colors cursor-pointer"
                              title="Edit holiday"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingHoliday(h)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 font-semibold text-xs transition-colors cursor-pointer"
                              title="Delete holiday"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Holiday Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">
                  {modalMode === 'ADD' ? 'Add Calendar Holiday' : 'Edit Calendar Holiday'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHoliday} className="p-6 space-y-4 text-xs">
              {/* Holiday Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Holiday Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Diwali (Deepavali), Republic Day, Christmas"
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Date & Calculated Day */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Day of Week</label>
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold font-mono">
                    {modalDayOfWeek || '—'}
                  </div>
                </div>
              </div>

              {/* Classification Option */}
              <div className="space-y-2 pt-2">
                <label className="block font-bold text-slate-700">Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOptional(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      !isOptional
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Mandatory</span>
                      {!isOptional && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500">Official gazetted holiday for all staff</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOptional(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isOptional
                        ? 'border-purple-500 bg-purple-50/70 text-purple-950 font-bold ring-1 ring-purple-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Optional / Floating</span>
                      {isOptional && <Check className="w-3.5 h-3.5 text-purple-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500">Restricted holiday employees can opt into</p>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : modalMode === 'ADD' ? 'Create Holiday' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-rose-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-200" />
                <h3 className="text-base font-bold">Delete Holiday</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingHoliday(null)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900">{deletingHoliday.name}</strong> on{' '}
                <strong className="text-slate-900">{deletingHoliday.date}</strong>?
              </p>
              <p className="text-[11px] text-slate-500">
                This will remove the holiday from the annual calendar and workforce attendance calculation for this date.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDeletingHoliday(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteHoliday}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
