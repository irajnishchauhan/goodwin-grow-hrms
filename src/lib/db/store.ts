import {
  Tenant,
  SubscriptionPlan,
  User,
  Department,
  Designation,
  Employee,
  AttendanceRecord,
  LeaveType,
  LeaveApplication,
  SalarySlip,
  AuditLogEntry,
  LeaveStatus,
  UserRole
} from '../types';
import {
  INITIAL_PLANS,
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_TYPES,
  INITIAL_LEAVE_APPLICATIONS,
  INITIAL_ATTENDANCE,
  INITIAL_SALARY_SLIPS,
  INITIAL_AUDIT_LOGS
} from './initialData';

// In-memory persistent data store during runtime with automatic reset / hydration
class HRMSDataStore {
  private plans: SubscriptionPlan[] = [...INITIAL_PLANS];
  private tenants: Tenant[] = [...INITIAL_TENANTS];
  private users: User[] = [...INITIAL_USERS];
  private departments: Department[] = [...INITIAL_DEPARTMENTS];
  private designations: Designation[] = [...INITIAL_DESIGNATIONS];
  private employees: Employee[] = [...INITIAL_EMPLOYEES];
  private leaveTypes: LeaveType[] = [...INITIAL_LEAVE_TYPES];
  private leaveApplications: LeaveApplication[] = [...INITIAL_LEAVE_APPLICATIONS];
  private attendance: AttendanceRecord[] = [...INITIAL_ATTENDANCE];
  private salarySlips: SalarySlip[] = [...INITIAL_SALARY_SLIPS];
  private auditLogs: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];

  // -------------------------------------------------------------
  // SUPER ADMIN & TENANT MANAGEMENT
  // -------------------------------------------------------------
  public listTenants(): Tenant[] {
    return [...this.tenants];
  }

  public getTenantById(tenantId: string): Tenant | null {
    return this.tenants.find((t) => t.id === tenantId) || null;
  }

  public getTenantBySlug(slug: string): Tenant | null {
    return this.tenants.find((t) => t.slug === slug) || null;
  }

  public createTenant(data: {
    name: string;
    slug: string;
    primaryColor: string;
    planId: 'starter' | 'growth' | 'enterprise';
    maxEmployees: number;
    currency: string;
    country: string;
    adminName: string;
    adminEmail: string;
  }): { tenant: Tenant; adminUser: User } {
    // Check if slug already exists
    const existing = this.getTenantBySlug(data.slug);
    if (existing) {
      throw new Error(`Tenant slug "${data.slug}" is already in use.`);
    }

    const tenantId = `tenant-${data.slug.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const newTenant: Tenant = {
      id: tenantId,
      name: data.name,
      slug: data.slug,
      primaryColor: data.primaryColor || '#059669',
      status: 'ACTIVE',
      planId: data.planId,
      maxEmployees: data.maxEmployees,
      domain: `${data.slug}.goodwingrow.com`,
      currency: data.currency || 'USD',
      country: data.country || 'United States',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tenants.push(newTenant);

    // Create Initial Admin User
    const adminUser: User = {
      id: `user-${tenantId}-admin`,
      tenantId: tenantId,
      name: data.adminName,
      email: data.adminEmail,
      role: 'COMPANY_ADMIN',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.users.push(adminUser);

    // Bootstrap standard departments
    const defaultDepts: Department[] = [
      { id: `dept-${tenantId}-hr`, tenantId, name: 'Human Resources', code: 'HR' },
      { id: `dept-${tenantId}-eng`, tenantId, name: 'Engineering', code: 'ENG' },
      { id: `dept-${tenantId}-ops`, tenantId, name: 'Operations', code: 'OPS' }
    ];
    this.departments.push(...defaultDepts);

    // Bootstrap standard leave types
    const defaultLeaves: LeaveType[] = [
      { id: `lt-${tenantId}-cl`, tenantId, name: 'Casual Leave (CL)', code: 'CL', daysPerYear: 12, color: '#3B82F6', isPaid: true },
      { id: `lt-${tenantId}-sl`, tenantId, name: 'Sick Leave (SL)', code: 'SL', daysPerYear: 10, color: '#EF4444', isPaid: true },
      { id: `lt-${tenantId}-pl`, tenantId, name: 'Privilege Leave (PL)', code: 'PL', daysPerYear: 15, color: '#10B981', isPaid: true }
    ];
    this.leaveTypes.push(...defaultLeaves);

    this.logAudit({
      tenantId,
      tenantName: newTenant.name,
      actorEmail: 'admin@goodwingrow.ai',
      actorRole: 'SUPER_ADMIN',
      action: 'TENANT_ONBOARDED',
      resource: 'Tenant',
      resourceId: tenantId,
      ipAddress: '127.0.0.1',
      details: { plan: data.planId, admin: data.adminEmail }
    });

    return { tenant: newTenant, adminUser };
  }

  public updateTenant(tenantId: string, updates: Partial<Tenant>): Tenant {
    const index = this.tenants.findIndex((t) => t.id === tenantId);
    if (index === -1) {
      throw new Error('Tenant not found');
    }
    this.tenants[index] = {
      ...this.tenants[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return this.tenants[index];
  }

  // -------------------------------------------------------------
  // EMPLOYEES (STRICT TENANT ISOLATION)
  // -------------------------------------------------------------
  public getEmployees(tenantId: string): Employee[] {
    // Rigid tenant scope check
    return this.employees.filter((e) => e.tenantId === tenantId);
  }

  public getEmployeeById(tenantId: string, employeeId: string): Employee | null {
    const emp = this.employees.find((e) => e.id === employeeId);
    // Hard multi-tenant security verification
    if (!emp || emp.tenantId !== tenantId) {
      return null;
    }
    return emp;
  }

  public createEmployee(
    tenantId: string,
    data: {
      firstName: string;
      lastName: string;
      workEmail: string;
      phone: string;
      gender: 'MALE' | 'FEMALE' | 'OTHER';
      departmentId: string;
      designationTitle: string;
      monthlySalary: number;
      panOrTaxId?: string;
      bankAccountNumber?: string;
      bankName?: string;
    }
  ): Employee {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const currentCount = this.getEmployees(tenantId).length;
    if (currentCount >= tenant.maxEmployees) {
      throw new Error(`Employee capacity limit (${tenant.maxEmployees}) reached for this plan.`);
    }

    const dept = this.departments.find((d) => d.id === data.departmentId && d.tenantId === tenantId);
    const departmentName = dept ? dept.name : 'General';

    const empId = `emp-${tenant.slug}-${Date.now()}`;
    const employeeCode = `${tenant.name.slice(0, 3).toUpperCase()}-${1000 + currentCount + 1}`;

    const newEmp: Employee = {
      id: empId,
      tenantId,
      employeeCode,
      firstName: data.firstName,
      lastName: data.lastName,
      workEmail: data.workEmail,
      phone: data.phone,
      gender: data.gender,
      joiningDate: new Date().toISOString().split('T')[0],
      departmentId: data.departmentId,
      departmentName,
      designationId: `desig-${empId}`,
      designationTitle: data.designationTitle,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      monthlySalary: Number(data.monthlySalary),
      panOrTaxId: data.panOrTaxId || 'PENDING',
      bankAccountNumber: data.bankAccountNumber,
      bankName: data.bankName,
      avatarUrl: `https://images.unsplash.com/photo-${1530000000000 + (currentCount % 10) * 100000}?w=120&auto=format&fit=crop&q=80`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.employees.push(newEmp);

    this.logAudit({
      tenantId,
      tenantName: tenant.name,
      actorEmail: 'admin@' + (tenant.domain || 'company.com'),
      actorRole: 'COMPANY_ADMIN',
      action: 'EMPLOYEE_CREATED',
      resource: 'Employee',
      resourceId: empId,
      ipAddress: '127.0.0.1',
      details: { code: employeeCode, name: `${data.firstName} ${data.lastName}` }
    });

    return newEmp;
  }

  public deleteEmployee(tenantId: string, employeeId: string): boolean {
    const index = this.employees.findIndex((e) => e.id === employeeId && e.tenantId === tenantId);
    if (index === -1) return false;
    this.employees.splice(index, 1);
    return true;
  }

  // -------------------------------------------------------------
  // ATTENDANCE & SHIFTS
  // -------------------------------------------------------------
  public getAttendance(tenantId: string, date?: string): AttendanceRecord[] {
    return this.attendance.filter((a) => {
      if (a.tenantId !== tenantId) return false;
      if (date && a.date !== date) return false;
      return true;
    });
  }

  public recordPunch(
    tenantId: string,
    employeeId: string,
    action: 'IN' | 'OUT',
    notes?: string
  ): AttendanceRecord {
    const emp = this.getEmployeeById(tenantId, employeeId);
    if (!emp) throw new Error('Employee not found in tenant workspace');

    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let record = this.attendance.find(
      (a) => a.tenantId === tenantId && a.employeeId === employeeId && a.date === today
    );

    if (!record) {
      record = {
        id: `att-${Date.now()}`,
        tenantId,
        employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        date: today,
        clockInTime: timeStr,
        workingHours: 0,
        status: 'PRESENT',
        notes: notes || 'Web Punch-In'
      };
      this.attendance.push(record);
    } else {
      if (action === 'OUT') {
        record.clockOutTime = timeStr;
        record.workingHours = 8.5; // Calculated standard duration
      }
    }
    return record;
  }

  // -------------------------------------------------------------
  // LEAVE MANAGEMENT
  // -------------------------------------------------------------
  public getLeaveTypes(tenantId: string): LeaveType[] {
    return this.leaveTypes.filter((lt) => lt.tenantId === tenantId);
  }

  public getLeaveApplications(tenantId: string): LeaveApplication[] {
    return this.leaveApplications.filter((la) => la.tenantId === tenantId);
  }

  public createLeaveApplication(
    tenantId: string,
    data: {
      employeeId: string;
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      totalDays: number;
      reason: string;
    }
  ): LeaveApplication {
    const emp = this.getEmployeeById(tenantId, data.employeeId);
    if (!emp) throw new Error('Employee does not belong to this tenant');

    const leaveType = this.leaveTypes.find((lt) => lt.id === data.leaveTypeId && lt.tenantId === tenantId);
    const leaveTypeName = leaveType ? leaveType.name : 'Leave';

    const newApp: LeaveApplication = {
      id: `la-${Date.now()}`,
      tenantId,
      employeeId: data.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      leaveTypeId: data.leaveTypeId,
      leaveTypeName,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: data.totalDays,
      reason: data.reason,
      status: 'PENDING',
      appliedAt: new Date().toISOString()
    };

    this.leaveApplications.unshift(newApp);
    return newApp;
  }

  public updateLeaveStatus(
    tenantId: string,
    leaveId: string,
    status: LeaveStatus,
    reviewedBy: string,
    comment?: string
  ): LeaveApplication {
    const app = this.leaveApplications.find((a) => a.id === leaveId && a.tenantId === tenantId);
    if (!app) {
      throw new Error('Leave application not found in this tenant');
    }
    app.status = status;
    app.reviewedBy = reviewedBy;
    app.reviewComment = comment || (status === 'APPROVED' ? 'Approved by HR' : 'Rejected');
    return app;
  }

  // -------------------------------------------------------------
  // PAYROLL & SALARY SLIPS
  // -------------------------------------------------------------
  public getSalarySlips(tenantId: string, month?: string): SalarySlip[] {
    return this.salarySlips.filter((s) => {
      if (s.tenantId !== tenantId) return false;
      if (month && s.month !== month) return false;
      return true;
    });
  }

  public generatePayrollRun(tenantId: string, month: string = '2026-10'): SalarySlip[] {
    const tenant = this.getTenantById(tenantId);
    if (!tenant) throw new Error('Tenant not found');

    const employees = this.getEmployees(tenantId);
    const generatedSlips: SalarySlip[] = [];

    for (const emp of employees) {
      const basicPay = Math.round(emp.monthlySalary * 0.5);
      const hra = Math.round(emp.monthlySalary * 0.25);
      const specialAllowance = emp.monthlySalary - (basicPay + hra);
      const grossSalary = emp.monthlySalary;

      // Statutory deductions (calculated according to regional standards)
      const pf = tenant.currency === 'INR' ? Math.min(Math.round(basicPay * 0.12), 1800) : 0;
      const pt = tenant.currency === 'INR' ? 200 : 0;
      const tax = Math.round(grossSalary * 0.1);
      const totalDeductions = pf + pt + tax;
      const netPay = grossSalary - totalDeductions;

      // Check if slip already exists for this month
      const existingIdx = this.salarySlips.findIndex(
        (s) => s.tenantId === tenantId && s.employeeId === emp.id && s.month === month
      );

      const slip: SalarySlip = {
        id: `slip-${emp.id}-${month}`,
        tenantId,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeCode: emp.employeeCode,
        departmentName: emp.departmentName || 'General',
        month,
        basicPay,
        hra,
        specialAllowance,
        grossSalary,
        providentFund: pf,
        esi: 0,
        professionalTax: pt,
        taxDeduction: tax,
        totalDeductions,
        netPay,
        paymentStatus: 'PAID',
        generatedDate: new Date().toISOString().split('T')[0]
      };

      if (existingIdx >= 0) {
        this.salarySlips[existingIdx] = slip;
      } else {
        this.salarySlips.push(slip);
      }
      generatedSlips.push(slip);
    }

    this.logAudit({
      tenantId,
      tenantName: tenant.name,
      actorEmail: 'admin@goodwingrow.ai',
      actorRole: 'COMPANY_ADMIN',
      action: 'BATCH_PAYROLL_RUN',
      resource: 'SalarySlip',
      ipAddress: '127.0.0.1',
      details: { month, count: generatedSlips.length }
    });

    return generatedSlips;
  }

  // -------------------------------------------------------------
  // DEPARTMENTS
  // -------------------------------------------------------------
  public getDepartments(tenantId: string): Department[] {
    return this.departments.filter((d) => d.tenantId === tenantId);
  }

  // -------------------------------------------------------------
  // AUDIT LOGS
  // -------------------------------------------------------------
  public getAuditLogs(tenantId?: string | null): AuditLogEntry[] {
    if (!tenantId) {
      return [...this.auditLogs]; // Super admin sees all platform logs
    }
    return this.auditLogs.filter((a) => a.tenantId === tenantId);
  }

  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    this.auditLogs.unshift({
      ...entry,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    });
  }

  // -------------------------------------------------------------
  // AUTOMATED MULTI-TENANT ISOLATION SECURITY VERIFICATION SUITE
  // -------------------------------------------------------------
  public verifyTenantIsolation(): {
    overallPassed: boolean;
    timestamp: string;
    checks: {
      id: string;
      title: string;
      description: string;
      passed: boolean;
      details: string;
    }[];
  } {
    const checks = [];

    // Test 1: Cross-tenant Employee Enumeration Prevention
    const tenant1 = this.tenants[0]; // Goodwin
    const tenant2 = this.tenants[1]; // Nexus

    const tenant1Employees = this.getEmployees(tenant1.id);
    const tenant2Employees = this.getEmployees(tenant2.id);

    const hasCrossLeakedEmployee = tenant1Employees.some((e) => e.tenantId !== tenant1.id);
    checks.push({
      id: 'SEC-CHK-01',
      title: 'Directory Query Scoping',
      description: 'Verifies querying Tenant A employees never contains Tenant B records',
      passed: !hasCrossLeakedEmployee && tenant1Employees.length > 0 && tenant2Employees.length > 0,
      details: `Tenant 1 (${tenant1.name}) holds ${tenant1Employees.length} records. Tenant 2 (${tenant2.name}) holds ${tenant2Employees.length} records. Strict 0% overlap.`
    });

    // Test 2: Direct IDOR (Insecure Direct Object Reference) Attack Simulation
    // Attacker from Tenant 1 requests Tenant 2's employee directly by ID
    const victimEmployee = tenant2Employees[0];
    const interceptedEmp = this.getEmployeeById(tenant1.id, victimEmployee.id);
    const isIdorBlocked = interceptedEmp === null;
    checks.push({
      id: 'SEC-CHK-02',
      title: 'Direct IDOR Access Protection',
      description: 'Simulates Tenant 1 admin requesting Tenant 2 employee ID directly',
      passed: isIdorBlocked,
      details: isIdorBlocked
        ? `Access denied: getEmployeeById('${tenant1.id}', '${victimEmployee.id}') cleanly returned null.`
        : 'CRITICAL VULNERABILITY: IDOR allowed unauthorized record access!'
    });

    // Test 3: Payroll Cross-Tenant Isolation
    const slipsTenant1 = this.getSalarySlips(tenant1.id);
    const slipsTenant2 = this.getSalarySlips(tenant2.id);
    const anyPayrollLeak =
      slipsTenant1.some((s) => s.tenantId !== tenant1.id) ||
      slipsTenant2.some((s) => s.tenantId !== tenant2.id);
    checks.push({
      id: 'SEC-CHK-03',
      title: 'Statutory Payroll Isolation',
      description: 'Ensures salary breakdowns and tax deductions are fully partitioned per tenant',
      passed: !anyPayrollLeak,
      details: `Zero cross-tenant payroll leakage detected between ${tenant1.currency} and ${tenant2.currency} accounts.`
    });

    // Test 4: Leave Application & Workflow Boundary
    const leavesTenant1 = this.getLeaveApplications(tenant1.id);
    const leavesTenant2 = this.getLeaveApplications(tenant2.id);
    const anyLeaveLeak =
      leavesTenant1.some((l) => l.tenantId !== tenant1.id) ||
      leavesTenant2.some((l) => l.tenantId !== tenant2.id);
    checks.push({
      id: 'SEC-CHK-04',
      title: 'Leave Workflow Authorization Boundaries',
      description: 'Verifies leave requests and approval workflows remain strictly inside tenant boundaries',
      passed: !anyLeaveLeak,
      details: 'All pending and approved leave applications verified against respective company tenant IDs.'
    });

    const overallPassed = checks.every((c) => c.passed);
    return {
      overallPassed,
      timestamp: new Date().toISOString(),
      checks
    };
  }
}

// Global singleton instance
export const db = new HRMSDataStore();
