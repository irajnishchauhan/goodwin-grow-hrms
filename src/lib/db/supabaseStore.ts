import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';
import {
  Tenant,
  Employee,
  User,
  Invitation,
  AttendanceRecord,
  LeaveType,
  LeaveApplication,
  SalarySlip,
  Department,
  Designation,
  Shift,
  Holiday,
  EmployeeDocument
} from '@/lib/types';

/**
 * Supabase Data Access Layer for Goodwin Grow HRMS
 * Performs asynchronous PostgreSQL queries when Supabase credentials are configured.
 */
export class SupabaseStore {
  public static isConnected(): boolean {
    return isSupabaseConfigured();
  }

  // --------------------------------------------------------------------------
  // TENANTS
  // --------------------------------------------------------------------------
  public static async getTenants(): Promise<Tenant[] | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase.from('tenants').select('*');
    if (error || !data) {
      console.warn('Supabase getTenants error:', error?.message);
      return null;
    }

    return data.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      companyCode: t.company_code,
      logoUrl: t.logo_url,
      industry: t.industry,
      businessEmail: t.business_email,
      businessPhone: t.business_phone,
      registeredAddress: t.registered_address,
      city: t.city,
      state: t.state,
      country: t.country,
      postalCode: t.postal_code,
      website: t.website,
      timezone: t.timezone,
      currency: t.currency,
      financialYear: t.financial_year,
      primaryColor: t.primary_color,
      status: t.status,
      planId: t.plan_id,
      maxEmployees: t.max_employees,
      domain: t.domain,
      enabledModules: t.enabled_modules || [],
      subscriptionStart: t.subscription_start,
      subscriptionRenewal: t.subscription_renewal,
      billingContact: t.billing_contact,
      trialStatus: t.trial_status,
      onboardingChecklist: t.onboarding_checklist || [],
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }));
  }

  public static async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const t = data;
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      companyCode: t.company_code,
      logoUrl: t.logo_url,
      industry: t.industry,
      businessEmail: t.business_email,
      businessPhone: t.business_phone,
      registeredAddress: t.registered_address,
      city: t.city,
      state: t.state,
      country: t.country,
      postalCode: t.postal_code,
      website: t.website,
      timezone: t.timezone,
      currency: t.currency,
      financialYear: t.financial_year,
      primaryColor: t.primary_color,
      status: t.status,
      planId: t.plan_id,
      maxEmployees: t.max_employees,
      domain: t.domain,
      enabledModules: t.enabled_modules || [],
      subscriptionStart: t.subscription_start,
      subscriptionRenewal: t.subscription_renewal,
      billingContact: t.billing_contact,
      trialStatus: t.trial_status,
      onboardingChecklist: t.onboarding_checklist || [],
      createdAt: t.created_at,
      updatedAt: t.updated_at
    };
  }

  public static async saveTenant(tenant: Tenant): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { error } = await supabase.from('tenants').upsert({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      company_code: tenant.companyCode,
      logo_url: tenant.logoUrl,
      industry: tenant.industry,
      business_email: tenant.businessEmail,
      business_phone: tenant.businessPhone,
      registered_address: tenant.registeredAddress,
      city: tenant.city,
      state: tenant.state,
      country: tenant.country,
      postal_code: tenant.postalCode,
      website: tenant.website,
      timezone: tenant.timezone,
      currency: tenant.currency,
      financial_year: tenant.financialYear,
      primary_color: tenant.primaryColor,
      status: tenant.status,
      plan_id: tenant.planId,
      max_employees: tenant.maxEmployees,
      domain: tenant.domain,
      enabled_modules: tenant.enabledModules,
      subscription_start: tenant.subscriptionStart,
      subscription_renewal: tenant.subscriptionRenewal,
      billing_contact: tenant.billingContact,
      trial_status: tenant.trialStatus,
      onboarding_checklist: tenant.onboardingChecklist,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('Supabase saveTenant error:', error.message);
      return false;
    }
    return true;
  }

  public static async deleteTenant(tenantId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId);

    if (error) {
      console.warn('Supabase deleteTenant error:', error.message);
      return false;
    }
    return true;
  }

  public static async clearTenantData(tenantId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    try {
      // 1. Delete dependent leaf records first
      await Promise.allSettled([
        supabase.from('documents').delete().eq('tenant_id', tenantId),
        supabase.from('employee_documents').delete().eq('tenant_id', tenantId),
        supabase.from('salary_slips').delete().eq('tenant_id', tenantId),
        supabase.from('leave_applications').delete().eq('tenant_id', tenantId),
        supabase.from('attendance').delete().eq('tenant_id', tenantId),
        supabase.from('attendance_records').delete().eq('tenant_id', tenantId),
        supabase.from('invitations').delete().eq('tenant_id', tenantId),
        supabase.from('job_applicants').delete().eq('tenant_id', tenantId),
        supabase.from('job_openings').delete().eq('tenant_id', tenantId)
      ]);

      // 2. Delete parent records: employees, designations, leave types, shifts, departments
      await Promise.allSettled([
        supabase.from('employees').delete().eq('tenant_id', tenantId),
        supabase.from('designations').delete().eq('tenant_id', tenantId),
        supabase.from('leave_types').delete().eq('tenant_id', tenantId),
        supabase.from('shifts').delete().eq('tenant_id', tenantId),
        supabase.from('departments').delete().eq('tenant_id', tenantId),
        supabase.from('holidays').delete().eq('tenant_id', tenantId)
      ]);

      return true;
    } catch (err) {
      console.warn('Supabase clearTenantData error:', err);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // EMPLOYEES
  // --------------------------------------------------------------------------
  public static async getEmployees(tenantId: string): Promise<Employee[] | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('employee_code', { ascending: true });

    if (error || !data) {
      console.warn('Supabase getEmployees error:', error?.message);
      return null;
    }

    return data.map((e) => ({
      id: e.id,
      tenantId: e.tenant_id,
      userId: e.user_id,
      employeeCode: e.employee_code,
      firstName: e.first_name,
      lastName: e.last_name,
      workEmail: e.work_email,
      personalEmail: e.personal_email || undefined,
      phone: e.phone,
      gender: e.gender,
      joiningDate: e.joining_date,
      departmentId: e.department_id,
      departmentName: e.department_name,
      designationId: e.designation_id,
      designationTitle: e.designation_title,
      reportingManagerId: e.reporting_manager_id,
      reportingManagerName: e.reporting_manager_name,
      employmentType: e.employment_type,
      status: e.status,
      monthlySalary: Number(e.monthly_salary),
      panOrTaxId: e.pan_or_tax_id,
      bankAccountNumber: e.bank_account_number,
      bankName: e.bank_name,
      workLocation: e.work_location,
      shiftName: e.shift_name,
      loginStatus: e.login_status,
      invitationId: e.invitation_id,
      createdAt: e.created_at,
      updatedAt: e.updated_at
    }));
  }

  public static async saveEmployee(emp: Employee): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { error } = await supabase.from('employees').upsert({
      id: emp.id,
      tenant_id: emp.tenantId,
      user_id: emp.userId,
      employee_code: emp.employeeCode,
      first_name: emp.firstName,
      last_name: emp.lastName,
      work_email: emp.workEmail,
      personal_email: emp.personalEmail,
      phone: emp.phone,
      gender: emp.gender,
      joining_date: emp.joiningDate,
      department_id: emp.departmentId,
      department_name: emp.departmentName,
      designation_id: emp.designationId,
      designation_title: emp.designationTitle,
      reporting_manager_id: emp.reportingManagerId,
      reporting_manager_name: emp.reportingManagerName,
      employment_type: emp.employmentType,
      status: emp.status,
      monthly_salary: emp.monthlySalary,
      pan_or_tax_id: emp.panOrTaxId,
      bank_account_number: emp.bankAccountNumber,
      bank_name: emp.bankName,
      work_location: emp.workLocation,
      shift_name: emp.shiftName,
      login_status: emp.loginStatus,
      invitation_id: emp.invitationId,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('Supabase saveEmployee error:', error.message);
      return false;
    }
    return true;
  }

  public static async deleteEmployee(tenantId: string, employeeId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', employeeId);

    return !error;
  }

  public static async updateEmployee(
    tenantId: string,
    employeeId: string,
    updates: Partial<Employee>
  ): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    if (updates.reportingManagerId !== undefined) {
      payload.reporting_manager_id = updates.reportingManagerId;
    }
    if (updates.reportingManagerName !== undefined) {
      payload.reporting_manager_name = updates.reportingManagerName;
    }
    if (updates.designationTitle !== undefined) {
      payload.designation_title = updates.designationTitle;
    }
    if (updates.departmentId !== undefined) {
      payload.department_id = updates.departmentId;
    }
    if (updates.departmentName !== undefined) {
      payload.department_name = updates.departmentName;
    }

    const { error } = await supabase
      .from('employees')
      .update(payload)
      .eq('tenant_id', tenantId)
      .eq('id', employeeId);

    if (error) {
      console.warn('Supabase updateEmployee error:', error.message);
      return false;
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // DEPARTMENTS & DESIGNATIONS
  // --------------------------------------------------------------------------
  public static async getDepartments(tenantId: string): Promise<Department[] | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    return data.map((d) => ({
      id: d.id,
      tenantId: d.tenant_id,
      name: d.name,
      code: d.code
    }));
  }

  public static async saveDepartment(dept: Department): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { error } = await supabase.from('departments').upsert({
      id: dept.id,
      tenant_id: dept.tenantId,
      name: dept.name,
      code: dept.code
    });

    return !error;
  }

  public static async getDesignations(tenantId: string): Promise<Designation[] | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('designations')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    return data.map((d) => ({
      id: d.id,
      tenantId: d.tenant_id,
      departmentId: d.department_id,
      title: d.title,
      gradeLevel: d.grade_level
    }));
  }

  // --------------------------------------------------------------------------
  // SHIFTS & HOLIDAYS
  // --------------------------------------------------------------------------
  public static async getShifts(tenantId: string): Promise<Shift[] | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    return data.map((s) => ({
      id: s.id,
      tenantId: s.tenant_id,
      name: s.name,
      startTime: s.start_time,
      endTime: s.end_time,
      graceMinutes: s.grace_minutes,
      isDefault: s.is_default,
      color: s.color || '#3B82F6'
    }));
  }

  public static async getHolidays(tenantId: string): Promise<Holiday[] | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    return data.map((h) => ({
      id: h.id,
      tenantId: h.tenant_id,
      name: h.name,
      date: h.date,
      isOptional: h.is_optional,
      dayOfWeek: new Date(h.date).toLocaleDateString('en-US', { weekday: 'long' })
    }));
  }

  // --------------------------------------------------------------------------
  // ATTENDANCE
  // --------------------------------------------------------------------------
  public static async getAttendance(tenantId: string): Promise<AttendanceRecord[] | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });

    if (error || !data) return null;

    return data.map((a) => ({
      id: a.id,
      tenantId: a.tenant_id,
      employeeId: a.employee_id,
      employeeName: a.employee_name,
      date: a.date,
      clockInTime: a.clock_in_time,
      clockOutTime: a.clock_out_time,
      workingHours: Number(a.working_hours),
      status: a.status,
      notes: a.notes,
      shiftName: a.shift_name
    }));
  }

  public static async saveAttendance(rec: AttendanceRecord): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { error } = await supabase.from('attendance').upsert({
      id: rec.id,
      tenant_id: rec.tenantId,
      employee_id: rec.employeeId,
      employee_name: rec.employeeName,
      date: rec.date,
      clock_in_time: rec.clockInTime,
      clock_out_time: rec.clockOutTime,
      working_hours: rec.workingHours,
      status: rec.status,
      notes: rec.notes,
      shift_name: rec.shiftName
    });

    if (error) {
      console.warn('Supabase saveAttendance error:', error.message);
      return false;
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // LEAVE TYPES & APPLICATIONS
  // --------------------------------------------------------------------------
  public static async getLeaveTypes(tenantId: string): Promise<LeaveType[] | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    return data.map((l) => ({
      id: l.id,
      tenantId: l.tenant_id,
      name: l.name,
      code: l.code,
      daysPerYear: l.days_per_year,
      color: l.color,
      isPaid: l.is_paid
    }));
  }

  public static async getLeaveApplications(tenantId: string): Promise<LeaveApplication[] | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('applied_at', { ascending: false });

    if (error || !data) return null;

    return data.map((a) => ({
      id: a.id,
      tenantId: a.tenant_id,
      employeeId: a.employee_id,
      employeeName: a.employee_name,
      leaveTypeId: a.leave_type_id,
      leaveTypeName: a.leave_type_name,
      startDate: a.start_date,
      endDate: a.end_date,
      totalDays: Number(a.total_days),
      reason: a.reason,
      status: a.status,
      reviewedBy: a.reviewed_by,
      reviewComment: a.review_comment,
      appliedAt: a.applied_at
    }));
  }

  public static async saveLeaveApplication(app: LeaveApplication): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { error } = await supabase.from('leave_applications').upsert({
      id: app.id,
      tenant_id: app.tenantId,
      employee_id: app.employeeId,
      employee_name: app.employeeName,
      leave_type_id: app.leaveTypeId,
      leave_type_name: app.leaveTypeName,
      start_date: app.startDate,
      end_date: app.endDate,
      total_days: app.totalDays,
      reason: app.reason,
      status: app.status,
      reviewed_by: app.reviewedBy,
      review_comment: app.reviewComment
    });

    if (error) {
      console.warn('Supabase saveLeaveApplication error:', error.message);
      return false;
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // PAYROLL & SALARY SLIPS
  // --------------------------------------------------------------------------
  public static async getSalarySlips(tenantId: string): Promise<SalarySlip[] | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('salary_slips')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    return data.map((s) => ({
      id: s.id,
      tenantId: s.tenant_id,
      employeeId: s.employee_id,
      employeeName: s.employee_name,
      employeeCode: s.employee_code,
      departmentName: s.department_name,
      month: s.month,
      basicPay: Number(s.basic_pay),
      hra: Number(s.hra),
      specialAllowance: Number(s.special_allowance),
      grossSalary: Number(s.gross_salary),
      providentFund: Number(s.provident_fund),
      esi: Number(s.esi),
      professionalTax: Number(s.professional_tax),
      taxDeduction: Number(s.tax_deduction),
      totalDeductions: Number(s.total_deductions),
      netPay: Number(s.net_pay),
      paymentStatus: s.payment_status,
      generatedDate: s.generated_date
    }));
  }

  public static async saveSalarySlip(slip: SalarySlip): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { error } = await supabase.from('salary_slips').upsert({
      id: slip.id,
      tenant_id: slip.tenantId,
      employee_id: slip.employeeId,
      employee_name: slip.employeeName,
      employee_code: slip.employeeCode,
      department_name: slip.departmentName,
      month: slip.month,
      basic_pay: slip.basicPay,
      hra: slip.hra,
      special_allowance: slip.specialAllowance,
      gross_salary: slip.grossSalary,
      provident_fund: slip.providentFund,
      esi: slip.esi,
      professional_tax: slip.professionalTax,
      tax_deduction: slip.taxDeduction,
      total_deductions: slip.totalDeductions,
      net_pay: slip.netPay,
      payment_status: slip.paymentStatus,
      generated_date: slip.generatedDate
    });

    if (error) {
      console.warn('Supabase saveSalarySlip error:', error.message);
      return false;
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // DOCUMENTS
  // --------------------------------------------------------------------------
  public static async getDocuments(tenantId: string, employeeId?: string): Promise<EmployeeDocument[] | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    let query = supabase.from('documents').select('*').eq('tenant_id', tenantId);
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;
    if (error || !data) return null;

    return data.map((d) => ({
      id: d.id,
      tenantId: d.tenant_id,
      employeeId: d.employee_id,
      employeeName: d.employee_name,
      title: d.title,
      documentType: d.document_type,
      fileName: d.file_name,
      fileSize: d.file_size,
      uploadedAt: d.uploaded_at
    }));
  }

  public static async saveDocument(doc: EmployeeDocument): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { error } = await supabase.from('documents').upsert({
      id: doc.id,
      tenant_id: doc.tenantId,
      employee_id: doc.employeeId,
      employee_name: doc.employeeName,
      title: doc.title,
      document_type: doc.documentType,
      file_name: doc.fileName,
      file_size: doc.fileSize
    });

    return !error;
  }

  // --------------------------------------------------------------------------
  // INVITATIONS
  // --------------------------------------------------------------------------
  public static async getInvitations(tenantId: string): Promise<Invitation[] | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    return data.map((i) => ({
      id: i.id,
      tenantId: i.tenant_id,
      tenantName: i.tenant_name,
      employeeId: i.employee_id,
      employeeName: i.employee_name,
      email: i.email,
      role: i.role,
      token: i.token,
      tokenHash: i.token_hash,
      status: i.status,
      expiresAt: i.expires_at,
      lastSentAt: i.last_sent_at,
      acceptedAt: i.accepted_at,
      createdAt: i.created_at || new Date().toISOString()
    }));
  }

  public static async saveInvitation(inv: Invitation): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { error } = await supabase.from('invitations').upsert({
      id: inv.id,
      tenant_id: inv.tenantId,
      tenant_name: inv.tenantName,
      employee_id: inv.employeeId,
      employee_name: inv.employeeName,
      email: inv.email,
      role: inv.role,
      token: inv.token,
      token_hash: inv.tokenHash,
      status: inv.status,
      expires_at: inv.expiresAt,
      last_sent_at: inv.lastSentAt,
      accepted_at: inv.acceptedAt
    });

    if (error) {
      console.warn('Supabase saveInvitation error:', error.message);
      return false;
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // USERS
  // --------------------------------------------------------------------------
  public static async saveUser(user: User): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { error: userError } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      password_hash: user.passwordHash,
      name: user.name,
      avatar_url: user.avatarUrl,
      is_super_admin: user.isSuperAdmin,
      active_tenant_id: user.activeTenantId,
      is_active: user.isActive
    });

    if (userError) {
      console.warn('Supabase saveUser error:', userError.message);
      return false;
    }

    // Save memberships
    for (const m of user.memberships) {
      await supabase.from('tenant_memberships').upsert({
        id: m.id,
        user_id: user.id,
        tenant_id: m.tenantId,
        role: m.role,
        status: m.status
      });
    }

    return true;
  }
}
