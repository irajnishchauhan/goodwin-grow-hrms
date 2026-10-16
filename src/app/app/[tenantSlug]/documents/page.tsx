'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  FolderLock,
  FileText,
  Upload,
  Download,
  Plus,
  ShieldCheck,
  CheckCircle2,
  X,
  FileCheck
} from 'lucide-react';
import { EmployeeDocument, Employee, Tenant } from '@/lib/types';

export default function TenantDocumentsPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [selectedEmpFilter, setSelectedEmpFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [empId, setEmpId] = useState('');
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<'CONTRACT' | 'OFFER_LETTER' | 'IDENTITY_PROOF' | 'TAX_DECLARATION' | 'CERTIFICATE'>('CONTRACT');
  const [submitting, setSubmitting] = useState(false);

  const fetchDocs = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/documents`);
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data.documents);
      }

      const empRes = await fetch(`/api/tenants/${tenantSlug}/employees`);
      const empJson = await empRes.json();
      if (empJson.success) {
        setEmployees(empJson.data.employees);
        setTenant(empJson.data.tenant);
        if (empJson.data.employees.length > 0 && !empId) {
          setEmpId(empJson.data.employees[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (tenantSlug) fetchDocs();
  }, [tenantSlug]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          title,
          documentType: docType,
          fileName: `${title.replace(/\s+/g, '_')}.pdf`,
          fileSize: '1.6 MB'
        })
      });
      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        setTitle('');
        fetchDocs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocs = documents.filter((d) => selectedEmpFilter === 'ALL' || d.employeeId === selectedEmpFilter);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FolderLock className="w-6 h-6 text-emerald-400" />
            Employee Document Vault
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Secure, encrypted storage of employment agreements, tax declarations, and identity records
          </p>
        </div>

        <button
          onClick={() => {
            if (employees.length > 0 && !empId) setEmpId(employees[0].id);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/30 transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter by employee */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
        <span className="text-slate-400 font-medium">Filter by Team Member:</span>
        <select
          value={selectedEmpFilter}
          onChange={(e) => setSelectedEmpFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <option value="ALL">All Team Members ({documents.length} Files)</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-md space-y-3 relative group">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {doc.documentType}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-white text-sm">{doc.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Assigned to: {doc.employeeName}</p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>{doc.fileSize}</span>
              <button
                onClick={() => alert(`Downloading verified copy of ${doc.fileName}...`)}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Add Document to Vault</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Team Member *</label>
                <select
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FY2026 Tax Declaration Form 12BB"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Type *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="CONTRACT">Signed Employment Contract</option>
                  <option value="OFFER_LETTER">Formal Offer Letter</option>
                  <option value="IDENTITY_PROOF">Identity Proof (Passport / PAN)</option>
                  <option value="TAX_DECLARATION">Tax Declaration / Exemption</option>
                  <option value="CERTIFICATE">Degree or Technical Certificate</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Files are encrypted at rest with tenant-level key derivation.</span>
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
                  disabled={submitting}
                  className="px-5 py-2 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                >
                  {submitting ? 'Saving...' : 'Add to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
