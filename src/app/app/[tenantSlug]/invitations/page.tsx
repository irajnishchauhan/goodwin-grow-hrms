'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  UserCheck,
  Send,
  RefreshCw,
  XCircle,
  Copy,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  Users,
  ExternalLink,
  X
} from 'lucide-react';
import { Invitation, Employee, Tenant, UserRole } from '@/lib/types';

export default function TenantInvitationsPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activatedCount: 0,
    pendingCount: 0,
    notInvitedCount: 0,
    activationRate: 0
  });
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('EMPLOYEE');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/invitations`);
      const json = await res.json();
      if (json.success) {
        setInvitations(json.data.invitations);
        setStats(json.data.stats);
      }

      const empRes = await fetch(`/api/tenants/${tenantSlug}/employees`);
      const empJson = await empRes.json();
      if (empJson.success) {
        setEmployees(empJson.data.employees);
        setTenant(empJson.data.tenant);
        const uninvited = empJson.data.employees.filter(
          (e: Employee) => e.loginStatus === 'NOT_INVITED' || !e.loginStatus
        );
        if (uninvited.length > 0 && !selectedEmpId) {
          setSelectedEmpId(uninvited[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) fetchInvitations();
  }, [tenantSlug]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;

    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmpId, role: selectedRole })
      });
      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        setActionMsg(`✓ Invitation dispatched to ${json.data.email}`);
        fetchInvitations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResend = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/invitations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, action: 'RESEND' })
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg('✓ Invitation link refreshed and resent.');
        fetchInvitations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/invitations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, action: 'REVOKE' })
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg('✓ Invitation revoked.');
        fetchInvitations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = (token: string) => {
    const activationUrl = `${window.location.origin}/activate?token=${token}`;
    navigator.clipboard.writeText(activationUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-amber-400" />
            Employee Credentials & Invitations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Secure single-use token invitations, account activation tracking, and role assignment for {tenant?.name}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-950/40 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Invite Employee</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
          <div className="text-xs font-semibold uppercase text-slate-400">Total Workforce</div>
          <div className="text-2xl font-extrabold text-white mt-1">{stats.totalEmployees} Employees</div>
          <p className="text-[11px] text-slate-400 mt-1">Recorded in company HRMS</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
          <div className="text-xs font-semibold uppercase text-slate-400">Active Login Accounts</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.activatedCount} Active</div>
          <p className="text-[11px] text-emerald-400 mt-1">{stats.activationRate}% activation rate</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
          <div className="text-xs font-semibold uppercase text-slate-400">Pending Activation</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{stats.pendingCount} Pending</div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting employee password setup</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
          <div className="text-xs font-semibold uppercase text-slate-400">Not Yet Invited</div>
          <div className="text-2xl font-extrabold text-slate-300 mt-1">{stats.notInvitedCount} Uninvited</div>
          <p className="text-[11px] text-slate-400 mt-1">HR profile without login account</p>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Invitation Status & Credential Management
          </h3>
          <span className="text-xs text-slate-400">{invitations.length} Total Dispatches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 uppercase font-semibold text-[10px] text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Employee Name</th>
                <th className="px-6 py-3.5">Email Address</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Last Dispatched</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-xs">
                    No active invitations found. Click &quot;Invite Employee&quot; above to dispatch activation links.
                  </td>
                </tr>
              ) : (
                invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{inv.employeeName}</td>
                    <td className="px-6 py-4 font-mono text-slate-300">{inv.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 uppercase">
                        {inv.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'ACCEPTED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : inv.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                      {new Date(inv.lastSentAt || inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleCopyLink(inv.token)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 flex items-center gap-1"
                              title="Copy secure activation link"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedToken === inv.token ? 'Copied!' : 'Copy Link'}</span>
                            </button>

                            <button
                              onClick={() => handleResend(inv.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                              title="Resend invitation"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleRevoke(inv.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                              title="Revoke invitation"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {inv.status === 'ACCEPTED' && (
                          <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Activated
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Invite Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Invite Employee to Workspace</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Employee *</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.workEmail}) — {e.loginStatus}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role *</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  <option value="EMPLOYEE">Employee (Self-Service: Attendance, Leaves, Payslips)</option>
                  <option value="MANAGER">Manager (Team approvals, Shift view)</option>
                  <option value="HR_ADMIN">HR Administrator (Workforce directory & leaves)</option>
                  <option value="COMPANY_ADMIN">Company Admin / Owner (Full HRMS management)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Secure Account Activation</span>
                </div>
                <p>
                  A cryptographically generated single-use activation token with 7-day expiration will be issued. No plaintext passwords are sent via email.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
