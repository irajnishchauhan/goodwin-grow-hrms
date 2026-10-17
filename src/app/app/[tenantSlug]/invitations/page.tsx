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
  X,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Check
} from 'lucide-react';
import { Invitation, Employee, Tenant, UserRole } from '@/lib/types';
import RoleGuard from '@/components/RoleGuard';

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
  const [previewEmailInv, setPreviewEmailInv] = useState<Invitation | null>(null);

  // Admin Reset Password State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmpName, setResetEmpName] = useState('');
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<{ password: string; email: string } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const fetchInvitations = async () => {
    try {
      const [res, empRes] = await Promise.all([
        fetch(`/api/tenants/${tenantSlug}/invitations`),
        fetch(`/api/tenants/${tenantSlug}/employees`)
      ]);

      const [json, empJson] = await Promise.all([
        res.json().catch(() => ({})),
        empRes.json().catch(() => ({}))
      ]);

      if (json.success) {
        setInvitations(json.data.invitations || []);
        setStats(json.data.stats || {
          totalEmployees: 0,
          activatedCount: 0,
          pendingCount: 0,
          notInvitedCount: 0,
          activationRate: 0
        });
      }

      if (empJson.success) {
        setEmployees(empJson.data.employees || []);
        setTenant(empJson.data.tenant);
        const uninvited = (empJson.data.employees || []).filter(
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

  const handleOpenResetPassword = (email: string, name: string) => {
    setResetEmail(email);
    setResetEmpName(name);
    setResetPasswordVal(`Goodwin@${Math.floor(1000 + Math.random() * 9000)}`);
    setShowResetPassword(true);
    setResetSuccess(null);
    setCopiedCreds(false);
    setResetModalOpen(true);
  };

  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetPasswordVal) return;
    setResetLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, newPassword: resetPasswordVal })
      });
      const json = await res.json();
      if (json.success) {
        setResetSuccess({ email: resetEmail, password: json.data?.temporaryPassword || resetPasswordVal });
        setActionMsg(`✓ Password successfully reset for ${resetEmail}`);
        fetchInvitations();
      } else {
        alert(json.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyCredentials = (email: string, pass: string) => {
    const text = `Goodwin Grow HRMS Login Credentials\nEmail: ${email}\nPassword: ${pass}\nLogin URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 3000);
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
    <RoleGuard
      tenantSlug={tenantSlug}
      requiredRoles={['COMPANY_ADMIN', 'HR_ADMIN', 'SUPER_ADMIN']}
      moduleName="Invitations & Credential Lifecycle"
    >
      <div className="space-y-6 max-w-6xl font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Mail className="w-6 h-6 text-amber-600" />
              Employee Credentials & Invitations
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Secure single-use token invitations, account activation tracking, and role assignment for {tenant?.name || 'Workspace'}
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Invite Employee</span>
          </button>
        </div>

        {actionMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in shadow-sm">
            <span>{actionMsg}</span>
            <button onClick={() => setActionMsg(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Workforce</div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{stats.totalEmployees} Employees</div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Recorded in company HRMS</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Login Accounts</div>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">{stats.activatedCount} Active</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">{stats.activationRate}% activation rate</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Activation</div>
            <div className="text-2xl font-black text-amber-700 mt-1 font-mono">{stats.pendingCount} Pending</div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Awaiting employee password setup</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Not Yet Invited</div>
            <div className="text-2xl font-black text-slate-700 mt-1 font-mono">{stats.notInvitedCount} Uninvited</div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">HR profile without login account</p>
          </div>
        </div>

        {/* Invitations Table */}
        <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              Invitation Status & Credential Management
            </h3>
            <span className="text-xs font-semibold text-slate-500">{invitations.length} Total Dispatches</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase font-bold text-[10px] text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Employee Name</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Assigned Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Last Dispatched</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-xs font-medium">
                      No active invitations found. Click &quot;Invite Employee&quot; above to dispatch activation links.
                    </td>
                  </tr>
                ) : (
                  invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{inv.employeeName}</td>
                      <td className="px-6 py-4 font-mono text-slate-600 font-medium">{inv.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700 uppercase">
                          {inv.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            inv.status === 'ACCEPTED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : inv.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-[11px] font-medium">
                        {new Date(inv.lastSentAt || inv.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => setPreviewEmailInv(inv)}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Preview invitation email template"
                              >
                                <Mail className="w-3 h-3 text-amber-600" />
                                <span>View Email</span>
                              </button>

                              <a
                                href={`/activate?token=${inv.token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Open activation link directly"
                              >
                                <ExternalLink className="w-3 h-3 text-emerald-600" />
                                <span>Activate</span>
                              </a>

                              <button
                                onClick={() => handleCopyLink(inv.token)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Copy secure activation link"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{copiedToken === inv.token ? 'Copied!' : 'Copy'}</span>
                              </button>

                              <button
                                onClick={() => handleResend(inv.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Resend invitation"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleRevoke(inv.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Revoke invitation"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {inv.status === 'ACCEPTED' && (
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Activated
                              </span>
                              <button
                                onClick={() => handleOpenResetPassword(inv.email, inv.employeeName)}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Reset employee password"
                              >
                                <KeyRound className="w-3 h-3 text-amber-600" />
                                <span>Reset Password</span>
                              </button>
                            </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-extrabold text-base text-slate-900">Invite Employee to Workspace</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Employee *</label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm cursor-pointer"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.workEmail}) — {e.loginStatus}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Role *</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm cursor-pointer"
                  >
                    <option value="EMPLOYEE">Employee (Self-Service: Attendance, Leaves, Payslips)</option>
                    <option value="MANAGER">Manager (Team approvals, Shift view)</option>
                    <option value="HR_ADMIN">HR Administrator (Workforce directory & leaves)</option>
                    <option value="COMPANY_ADMIN">Company Admin / Owner (Full HRMS management)</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1 font-medium">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
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
                    className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Invitation</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Email Inbox Preview Modal */}
        {previewEmailInv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-900 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Dispatched Invitation Email</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Recipient: {previewEmailInv.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewEmailInv(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Email Body Container (looks like a clean email message) */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-4 font-medium">
                <div className="pb-3 border-b border-slate-200 space-y-1 text-[11px] text-slate-500">
                  <div><span className="text-slate-400">From:</span> {tenant?.name || 'Goodwin Batteries'} HR Operations &lt;no-reply@goodwingrowai.com&gt;</div>
                  <div><span className="text-slate-400">To:</span> {previewEmailInv.employeeName} &lt;{previewEmailInv.email}&gt;</div>
                  <div><span className="text-slate-400">Subject:</span> Setup your credentials for {tenant?.name || 'Company'} Workspace</div>
                </div>

                <div className="space-y-3 text-slate-700">
                  <p>Hello <strong>{previewEmailInv.employeeName}</strong>,</p>
                  <p>
                    You have been invited to join the <strong>{tenant?.name || 'Company'}</strong> HRMS workspace with the role of <code className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-mono font-bold">{previewEmailInv.role}</code>.
                  </p>
                  <p>
                    Please click the secure button below to set your personal password and activate your workspace account:
                  </p>

                  <div className="py-2 text-center">
                    <a
                      href={`/activate?token=${previewEmailInv.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <span>Activate Workspace Credentials</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-[10px] text-slate-600 space-y-1 font-mono break-all shadow-sm">
                    <div className="text-slate-500 uppercase font-sans font-bold">Direct Activation URL:</div>
                    <div>{typeof window !== 'undefined' ? `${window.location.origin}/activate?token=${previewEmailInv.token}` : `/activate?token=${previewEmailInv.token}`}</div>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    This single-use link expires on {new Date(previewEmailInv.expiresAt).toLocaleString()}. If you did not expect this invitation, please contact your company administrator.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  Token: <code className="text-slate-700 font-mono font-semibold">{previewEmailInv.token}</code>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(previewEmailInv.token)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedToken === previewEmailInv.token ? 'Copied URL!' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={`/activate?token=${previewEmailInv.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Activation Page</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Reset Password Modal */}
        {resetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Reset Employee Password</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{resetEmpName} ({resetEmail})</p>
                  </div>
                </div>
                <button
                  onClick={() => setResetModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {resetSuccess ? (
                <div className="p-6 space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Password Reset Successfully!</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      The credentials have been instantly updated in the database. Share these credentials with the employee:
                    </p>
                    <div className="p-3 rounded-lg bg-white border border-emerald-200 font-mono text-xs space-y-1 select-all">
                      <div><span className="text-slate-400 font-sans">Email:</span> {resetSuccess.email}</div>
                      <div><span className="text-slate-400 font-sans">Password:</span> <span className="font-bold text-slate-900">{resetSuccess.password}</span></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(resetSuccess.email, resetSuccess.password)}
                      className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      {copiedCreds ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleExecuteResetPassword} className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Employee Email</label>
                    <input
                      type="text"
                      disabled
                      value={resetEmail}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">Set New Password *</label>
                      <button
                        type="button"
                        onClick={() => setResetPasswordVal(`Goodwin@${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold cursor-pointer underline"
                      >
                        Generate Random
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        value={resetPasswordVal}
                        onChange={(e) => setResetPasswordVal(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm"
                        placeholder="Enter minimum 6 characters..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1 font-medium">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Admin Password Override</span>
                    </div>
                    <p>
                      This will immediately update the password in the database and activate the employee login if not already activated.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setResetModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{resetLoading ? 'Updating...' : 'Set Password'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
