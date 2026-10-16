'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  GitFork,
  Users,
  Building2,
  Mail,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { Employee, Department, Tenant } from '@/lib/types';

export default function TenantOrgChartPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantSlug}/employees`);
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data.employees);
        setTenant(json.data.tenant);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchEmployees();
    }
  }, [tenantSlug]);

  // Distinguish top executive vs direct reports
  const topLeader =
    employees.find(
      (e) =>
        e.designationTitle?.toLowerCase().includes('ceo') ||
        e.designationTitle?.toLowerCase().includes('director') ||
        e.designationTitle?.toLowerCase().includes('head')
    ) || employees[0];

  const teamMembers = employees.filter((e) => e.id !== topLeader?.id);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <GitFork className="w-6 h-6 text-emerald-400" />
            Organization Hierarchy Tree
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual organizational structure, department leadership, and reporting lines for {tenant?.name}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>{employees.length} Total Team Members</span>
        </div>
      </div>

      {/* Visual Org Tree */}
      <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center space-y-8 overflow-x-auto">
        {/* Tier 1: Organization Head / CEO */}
        {topLeader && (
          <div className="relative flex flex-col items-center">
            <div className="w-72 p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/60 shadow-xl shadow-emerald-950/40 text-center space-y-3 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider shadow">
                Executive Leadership
              </div>

              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600/20 border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-400 text-xl shadow">
                {topLeader.firstName.slice(0, 1)}
                {topLeader.lastName.slice(0, 1)}
              </div>

              <div>
                <h3 className="font-extrabold text-white text-base">
                  {topLeader.firstName} {topLeader.lastName}
                </h3>
                <p className="text-xs font-semibold text-emerald-400 mt-0.5">{topLeader.designationTitle}</p>
                <span className="text-[10px] text-slate-400 font-mono">{topLeader.departmentName}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{topLeader.employeeCode}</span>
                <span className="text-emerald-400 font-bold">{teamMembers.length} Direct Reports</span>
              </div>
            </div>

            {/* Connecting Vertical Stem */}
            <div className="w-0.5 h-8 bg-emerald-500/60"></div>
          </div>
        )}

        {/* Tier 2: Department Heads & Staff */}
        {teamMembers.length > 0 && (
          <div className="w-full flex flex-col items-center">
            {/* Horizontal Split Line */}
            <div className="h-0.5 bg-slate-700 w-3/4 max-w-2xl mb-8 relative">
              <div className="w-2 h-2 rounded-full bg-emerald-400 absolute left-0 -top-[3px]"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 absolute right-0 -top-[3px]"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 absolute left-1/2 -translate-x-1/2 -top-[3px]"></div>
            </div>

            {/* Direct Reports Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-lg text-center space-y-3 relative group"
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm group-hover:border-emerald-400 transition-colors">
                    {member.firstName.slice(0, 1)}
                    {member.lastName.slice(0, 1)}
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {member.firstName} {member.lastName}
                    </h4>
                    <p className="text-xs text-slate-300 font-medium">{member.designationTitle}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{member.departmentName}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-emerald-400">{member.employeeCode}</span>
                    <span className="text-slate-400">{member.employmentType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
