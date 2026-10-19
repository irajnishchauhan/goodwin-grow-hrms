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
  EmployeeDocument,
  LeaveStatus,
  TenantMembership,
  RegularizationRequest,
  JobOpening,
  JobApplicant
} from '@/lib/types';

/**
 * Supabase Data Access Layer for Goodwin Grow HRMS
 * Performs asynchronous PostgreSQL queries when Supabase credentials are configured.
 */
export class SupabaseStore {
  // Ultra-Fast In-Memory Cache for Enterprise Keka-grade Speed (sub-10ms responses)
  private static cache = new Map<string, { data: any; expiresAt: number }>();

  public static getCached<T>(key: string): T | null {
    const entry = SupabaseStore.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      SupabaseStore.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  public static setCached<T>(key: string, data: T, ttlSeconds: number = 30): void {
    SupabaseStore.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  public static invalidate(tenantIdOrSlug?: string): void {
    if (!tenantIdOrSlug) {
      SupabaseStore.cache.clear();
      return;
    }
    for (const key of SupabaseStore.cache.keys()) {
      if (key.includes(tenantIdOrSlug)) {
        SupabaseStore.cache.delete(key);
      }
    }
  }

  public static isConnected(): boolean {
    return isSupabaseConfigured();
  }

  // --------------------------------------------------------------------------
  // TENANTS
  // --------------------------------------------------------------------------
  public static async getTenants(): Promise<Tenant[] | null> {
    const cached = SupabaseStore.getCached<Tenant[]>('all_tenants');
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase.from('tenants').select('*');
    if (error || !data) {
      console.warn('Supabase getTenants error:', error?.message);
      return null;
    }

    const mapped = data.map((t) => ({
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

    SupabaseStore.setCached('all_tenants', mapped, 60);
    return mapped;
  }

  public static async getTenantById(id: string): Promise<Tenant | null> {
    const cached = SupabaseStore.getCached<Tenant>(`tenant_id_${id}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const t = data;
    const res: Tenant = {
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
      onboardingChecklist: (t.onboarding_checklist || []).filter((s: any) => s.id !== '__org_root__'),
      orgTreeRootId: (t.onboarding_checklist || []).find((s: any) => s.id === '__org_root__')?.title,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    };

    SupabaseStore.setCached(`tenant_id_${id}`, res, 60);
    SupabaseStore.setCached(`tenant_slug_${res.slug}`, res, 60);
    return res;
  }

  public static async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const cached = SupabaseStore.getCached<Tenant>(`tenant_slug_${slug}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const t = data;
    const res: Tenant = {
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
      onboardingChecklist: (t.onboarding_checklist || []).filter((s: any) => s.id !== '__org_root__'),
      orgTreeRootId: (t.onboarding_checklist || []).find((s: any) => s.id === '__org_root__')?.title,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    };

    SupabaseStore.setCached(`tenant_slug_${slug}`, res, 60);
    SupabaseStore.setCached(`tenant_id_${res.id}`, res, 60);
    return res;
  }

  public static async saveTenant(tenant: Tenant): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(tenant.id);
    SupabaseStore.invalidate(tenant.slug);
    SupabaseStore.invalidate('all_tenants');

    const checklistWithMeta = [...(tenant.onboardingChecklist || []).filter((s: any) => s.id !== '__org_root__')];
    if (tenant.orgTreeRootId) {
      checklistWithMeta.push({
        id: '__org_root__',
        title: tenant.orgTreeRootId,
        description: 'Organization Root Leader',
        completed: true,
        route: ''
      });
    }

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
      onboarding_checklist: checklistWithMeta,
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

    try {
      // 1. Purge dependent child records
      await this.clearTenantData(tenantId);

      // 2. Remove memberships
      await supabase.from('memberships').delete().eq('tenant_id', tenantId);

      // 3. Clear users active_tenant_id
      await supabase.from('users').update({ active_tenant_id: null }).eq('active_tenant_id', tenantId);

      // 4. Delete tenant from tenants table by id or slug
      const { error } = await supabase
        .from('tenants')
        .delete()
        .or(`id.eq.${tenantId},slug.eq.${tenantId}`);

      if (error) {
        console.warn('Supabase deleteTenant error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase deleteTenant exception:', err);
      return false;
    }
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
    const cached = SupabaseStore.getCached<Employee[]>(`employees_${tenantId}`);
    if (cached) return cached;

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

    const mapped = data.map((e) => ({
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

    SupabaseStore.setCached(`employees_${tenantId}`, mapped, 30);
    return mapped;
  }

  public static async saveEmployee(emp: Employee): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(emp.tenantId);

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

  public static async updateEmployeeLoginStatus(
    employeeId: string,
    loginStatus: string,
    userId?: string
  ): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const payload: Record<string, any> = { login_status: loginStatus };
    if (userId) payload.user_id = userId;

    const { error } = await supabase
      .from('employees')
      .update(payload)
      .eq('id', employeeId);

    if (error) {
      console.warn('Supabase updateEmployeeLoginStatus error:', error.message);
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
    if (updates.firstName !== undefined) payload.first_name = updates.firstName;
    if (updates.lastName !== undefined) payload.last_name = updates.lastName;
    if (updates.workEmail !== undefined) payload.work_email = updates.workEmail;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.gender !== undefined) payload.gender = updates.gender;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.loginStatus !== undefined) payload.login_status = updates.loginStatus;
    if (updates.monthlySalary !== undefined) payload.monthly_salary = updates.monthlySalary;
    if (updates.panOrTaxId !== undefined) payload.pan_or_tax_id = updates.panOrTaxId;
    if (updates.bankAccountNumber !== undefined) payload.bank_account_number = updates.bankAccountNumber;
    if (updates.bankName !== undefined) payload.bank_name = updates.bankName;
    if (updates.workLocation !== undefined) payload.work_location = updates.workLocation;
    if (updates.shiftName !== undefined) payload.shift_name = updates.shiftName;
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
    if (updates.joiningDate !== undefined) payload.joining_date = updates.joiningDate;
    if (updates.employmentType !== undefined) payload.employment_type = updates.employmentType;
    if (updates.personalEmail !== undefined) payload.personal_email = updates.personalEmail;


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
    const cached = SupabaseStore.getCached<Department[]>(`departments_${tenantId}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    const mapped = data.map((d) => ({
      id: d.id,
      tenantId: d.tenant_id,
      name: d.name,
      code: d.code
    }));

    SupabaseStore.setCached(`departments_${tenantId}`, mapped, 60);
    return mapped;
  }

  public static async saveDepartment(dept: Department): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(dept.tenantId);

    const { error } = await supabase.from('departments').upsert({
      id: dept.id,
      tenant_id: dept.tenantId,
      name: dept.name,
      code: dept.code
    });

    return !error;
  }

  public static async deleteDepartment(tenantId: string, departmentId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(tenantId);

    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', departmentId);

    if (error) {
      console.warn('Supabase deleteDepartment error:', error.message);
      return false;
    }
    return true;
  }

  public static async getDesignations(tenantId: string): Promise<Designation[] | null> {
    const cached = SupabaseStore.getCached<Designation[]>(`designations_${tenantId}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('designations')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    const mapped = data.map((d) => {
      let gl = 'L1';
      if (d.level !== undefined && d.level !== null) {
        gl = typeof d.level === 'number' ? `L${d.level}` : (String(d.level).startsWith('L') ? String(d.level) : `L${d.level}`);
      } else if (d.grade_level) {
        gl = d.grade_level;
      }
      return {
        id: d.id,
        tenantId: d.tenant_id,
        departmentId: d.department_id,
        title: d.title,
        gradeLevel: gl
      };
    });

    SupabaseStore.setCached(`designations_${tenantId}`, mapped, 60);
    return mapped;
  }

  public static async saveDesignation(desig: Designation): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(desig.tenantId);

    const numericLevel = parseInt(desig.gradeLevel.replace(/\D/g, ''), 10) || 1;

    const { error } = await supabase.from('designations').upsert({
      id: desig.id,
      tenant_id: desig.tenantId,
      department_id: desig.departmentId || null,
      title: desig.title,
      level: numericLevel
    });

    if (error) {
      console.warn('Supabase saveDesignation error:', error.message);
      return false;
    }
    return true;
  }


  // --------------------------------------------------------------------------
  // SHIFTS & HOLIDAYS
  // --------------------------------------------------------------------------
  public static async getShifts(tenantId: string): Promise<Shift[] | null> {
    const cached = SupabaseStore.getCached<Shift[]>(`shifts_${tenantId}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    const mapped = data.map((s) => ({
      id: s.id,
      tenantId: s.tenant_id,
      name: s.name,
      startTime: s.start_time,
      endTime: s.end_time,
      graceMinutes: Number(s.grace_minutes) || 15,
      isDefault: Boolean(s.is_default),
      color: s.color || '#3B82F6'
    }));

    if (mapped.length > 0 && !mapped.some((s) => s.isDefault)) {
      mapped[0].isDefault = true;
    }

    SupabaseStore.setCached(`shifts_${tenantId}`, mapped, 60);
    return mapped;
  }

  public static async saveShift(shift: Shift): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(shift.tenantId);

    const { error } = await supabase.from('shifts').upsert({
      id: shift.id,
      tenant_id: shift.tenantId,
      name: shift.name,
      start_time: shift.startTime,
      end_time: shift.endTime,
      grace_minutes: shift.graceMinutes,
      is_default: shift.isDefault
    });

    if (error) {
      console.warn('Supabase saveShift error:', error.message);
      return false;
    }
    return true;
  }

  public static async deleteShift(tenantId: string, shiftId: string, shiftName?: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(tenantId);

    try {
      // 1. Try deleting by shiftId
      if (shiftId) {
        await supabase
          .from('shifts')
          .delete()
          .eq('id', shiftId);
      }

      // 2. Also delete by name if provided
      if (shiftName) {
        await supabase
          .from('shifts')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('name', shiftName);
      }

      return true;
    } catch (e) {
      console.warn('Supabase deleteShift exception:', e);
      return false;
    }
  }

  public static async getHolidays(tenantId: string): Promise<Holiday[] | null> {
    const cached = SupabaseStore.getCached<Holiday[]>(`holidays_${tenantId}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    const mapped = data.map((h) => ({
      id: h.id,
      tenantId: h.tenant_id,
      name: h.name,
      date: h.date,
      isOptional: h.is_optional,
      dayOfWeek: new Date(h.date).toLocaleDateString('en-US', { weekday: 'long' })
    }));

    SupabaseStore.setCached(`holidays_${tenantId}`, mapped, 60);
    return mapped;
  }

  public static async saveHoliday(holiday: Holiday): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(holiday.tenantId);

    try {
      const { error } = await supabase.from('holidays').upsert(
        {
          id: holiday.id,
          tenant_id: holiday.tenantId,
          name: holiday.name,
          date: holiday.date,
          is_optional: Boolean(holiday.isOptional)
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.warn('Supabase saveHoliday error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveHoliday exception:', e);
      return false;
    }
  }

  public static async saveHolidaysBatch(tenantId: string, holidays: Holiday[]): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(tenantId);

    try {
      const rows = holidays.map((h) => ({
        id: h.id,
        tenant_id: tenantId,
        name: h.name,
        date: h.date,
        is_optional: Boolean(h.isOptional)
      }));

      const { error } = await supabase.from('holidays').upsert(rows, { onConflict: 'id' });

      if (error) {
        console.warn('Supabase saveHolidaysBatch error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveHolidaysBatch exception:', e);
      return false;
    }
  }

  public static async deleteHoliday(tenantId: string, holidayId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(tenantId);

    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('tenant_id', tenantId)
        .eq('id', holidayId);

      if (error) {
        console.warn('Supabase deleteHoliday error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase deleteHoliday exception:', e);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // ATTENDANCE
  // --------------------------------------------------------------------------
  public static async getAttendance(tenantId: string): Promise<AttendanceRecord[] | null> {
    const cached = SupabaseStore.getCached<AttendanceRecord[]>(`attendance_${tenantId}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });

    if (error || !data) return null;

    const mapped = data.map((a) => ({
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

    SupabaseStore.setCached(`attendance_${tenantId}`, mapped, 10);
    return mapped;
  }

  public static async saveAttendance(rec: AttendanceRecord): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(rec.tenantId);

    const { error } = await supabase.from('attendance').upsert(
      {
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
      },
      { onConflict: 'tenant_id,employee_id,date' }
    );

    if (error) {
      console.warn('Supabase saveAttendance error:', error.message);
      return false;
    }
    return true;
  }

  public static async deleteAttendance(
    tenantId: string,
    recordId: string,
    employeeId?: string,
    date?: string
  ): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(tenantId);

    try {
      if (recordId && !recordId.startsWith('absent-') && !recordId.startsWith('leave-') && !recordId.startsWith('off-')) {
        await supabase
          .from('attendance')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('id', recordId);
      }
      if (employeeId && date) {
        await supabase
          .from('attendance')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('employee_id', employeeId)
          .eq('date', date);
      }
      return true;
    } catch (e) {
      console.warn('Supabase deleteAttendance exception:', e);
      return false;
    }
  }

  public static async deleteAttendanceRecords(
    tenantId: string,
    items?: { recordId?: string; employeeId?: string; date?: string }[],
    deleteAllForDate?: string
  ): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(tenantId);

    try {
      if (deleteAllForDate) {
        await supabase
          .from('attendance')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('date', deleteAllForDate);
        return true;
      }

      if (!items || items.length === 0) return true;

      // 1. Delete by real database IDs (exclude synthetic IDs like absent-*, leave-*, off-*)
      const realIds = items
        .map((i) => i.recordId)
        .filter(
          (id): id is string =>
            typeof id === 'string' &&
            id.length > 0 &&
            !id.startsWith('absent-') &&
            !id.startsWith('leave-') &&
            !id.startsWith('off-')
        );

      if (realIds.length > 0) {
        await supabase
          .from('attendance')
          .delete()
          .eq('tenant_id', tenantId)
          .in('id', realIds);
      }

      // 2. Also delete by (employee_id, date) pairs to guarantee punch removal
      const dates = Array.from(new Set(items.map((i) => i.date).filter(Boolean)));
      const empIds = Array.from(new Set(items.map((i) => i.employeeId).filter(Boolean)));

      if (dates.length === 1 && empIds.length > 0) {
        await supabase
          .from('attendance')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('date', dates[0])
          .in('employee_id', empIds);
      } else {
        for (const item of items) {
          if (item.employeeId && item.date) {
            await supabase
              .from('attendance')
              .delete()
              .eq('tenant_id', tenantId)
              .eq('employee_id', item.employeeId)
              .eq('date', item.date);
          }
        }
      }

      return true;
    } catch (e) {
      console.warn('Supabase deleteAttendanceRecords exception:', e);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // REGULARIZATION REQUESTS
  // --------------------------------------------------------------------------
  public static async getRegularizations(tenantId: string): Promise<RegularizationRequest[] | null> {
    const cached = SupabaseStore.getCached<RegularizationRequest[]>(`regularizations_${tenantId}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('resource', 'regularization')
        .order('timestamp', { ascending: false });

      if (error || !data) {
        return null;
      }

      const mapped = data.map((row: any) => {
        const d = row.details || {};
        return {
          id: row.id,
          tenantId: row.tenant_id,
          employeeId: d.employeeId || '',
          employeeName: d.employeeName || 'Employee',
          attendanceDate: d.attendanceDate || '',
          requestedClockIn: d.requestedClockIn || '09:00',
          requestedClockOut: d.requestedClockOut || '18:00',
          reason: d.reason || '',
          status: (d.status as 'PENDING' | 'APPROVED' | 'REJECTED') || 'PENDING',
          requestedAt: d.requestedAt || row.timestamp,
          reviewedBy: d.reviewedBy,
          managerId: d.managerId,
          managerName: d.managerName,
          comment: d.comment
        };
      });

      SupabaseStore.setCached(`regularizations_${tenantId}`, mapped, 15);
      return mapped;
    } catch (e) {
      console.warn('Supabase getRegularizations error:', e);
      return null;
    }
  }

  public static async saveRegularization(reg: RegularizationRequest): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(reg.tenantId);

    try {
      const { error } = await supabase.from('audit_logs').upsert({
        id: reg.id,
        tenant_id: reg.tenantId,
        actor_email: `${reg.employeeId}@goodwin.local`,
        actor_role: 'EMPLOYEE',
        action:
          reg.status === 'APPROVED'
            ? 'REGULARIZATION_APPROVED'
            : reg.status === 'REJECTED'
            ? 'REGULARIZATION_REJECTED'
            : 'REGULARIZATION_REQUEST',
        resource: 'regularization',
        resource_id: reg.id,
        details: {
          id: reg.id,
          tenantId: reg.tenantId,
          employeeId: reg.employeeId,
          employeeName: reg.employeeName,
          attendanceDate: reg.attendanceDate,
          requestedClockIn: reg.requestedClockIn,
          requestedClockOut: reg.requestedClockOut,
          reason: reg.reason,
          status: reg.status,
          requestedAt: reg.requestedAt,
          reviewedBy: reg.reviewedBy,
          managerId: reg.managerId,
          managerName: reg.managerName,
          comment: reg.comment
        },
        timestamp: new Date().toISOString()
      });

      if (error) {
        console.warn('Supabase saveRegularization error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveRegularization exception:', e);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // LEAVE TYPES & APPLICATIONS
  // --------------------------------------------------------------------------
  public static async getLeaveTypes(tenantId: string): Promise<LeaveType[] | null> {
    const cached = SupabaseStore.getCached<LeaveType[]>(`leave_types_${tenantId}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    const mapped = data.map((l) => ({
      id: l.id,
      tenantId: l.tenant_id,
      name: l.name,
      code: l.code,
      daysPerYear: l.days_per_year,
      color: l.color,
      isPaid: l.is_paid
    }));

    SupabaseStore.setCached(`leave_types_${tenantId}`, mapped, 60);
    return mapped;
  }

  public static async saveLeaveType(lt: LeaveType): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(lt.tenantId);

    const { error } = await supabase.from('leave_types').upsert({
      id: lt.id,
      tenant_id: lt.tenantId,
      name: lt.name,
      code: lt.code,
      days_per_year: lt.daysPerYear,
      color: lt.color,
      is_paid: lt.isPaid
    });

    if (error) {
      console.warn('Supabase saveLeaveType error:', error.message);
      return false;
    }
    return true;
  }

  public static async deleteLeaveType(tenantId: string, leaveTypeId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(tenantId);

    const { error } = await supabase
      .from('leave_types')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', leaveTypeId);

    if (error) {
      console.warn('Supabase deleteLeaveType error:', error.message);
      return false;
    }
    return true;
  }

  public static async getLeaveApplications(tenantId: string): Promise<LeaveApplication[] | null> {
    const cached = SupabaseStore.getCached<LeaveApplication[]>(`leave_apps_${tenantId}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('applied_at', { ascending: false });

    if (error || !data) return null;

    const mapped = data.map((a) => ({
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

    SupabaseStore.setCached(`leave_apps_${tenantId}`, mapped, 15);
    return mapped;
  }

  public static async saveLeaveApplication(app: LeaveApplication): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(app.tenantId);

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

  public static async updateLeaveStatus(
    tenantId: string,
    leaveId: string,
    status: LeaveStatus,
    reviewedBy: string,
    reviewComment?: string
  ): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { error } = await supabase
      .from('leave_applications')
      .update({
        status,
        reviewed_by: reviewedBy,
        review_comment: reviewComment || (status === 'APPROVED' ? 'Approved by HR' : 'Rejected')
      })
      .eq('id', leaveId)
      .eq('tenant_id', tenantId);

    if (error) {
      console.warn('Supabase updateLeaveStatus error:', error.message);
      return false;
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // PAYROLL & SALARY SLIPS
  // --------------------------------------------------------------------------
  public static async getSalarySlips(tenantId: string): Promise<SalarySlip[] | null> {
    const cached = SupabaseStore.getCached<SalarySlip[]>(`salary_slips_${tenantId}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('salary_slips')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    const mapped = data.map((s) => ({
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

    SupabaseStore.setCached(`salary_slips_${tenantId}`, mapped, 30);
    return mapped;
  }

  public static async saveSalarySlip(slip: SalarySlip): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(slip.tenantId);

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
    const cacheKey = `documents_${tenantId}_${employeeId || 'all'}`;
    const cached = SupabaseStore.getCached<EmployeeDocument[]>(cacheKey);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    let query = supabase.from('documents').select('*').eq('tenant_id', tenantId);
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;
    if (error || !data) return null;

    const mapped = data.map((d) => ({
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

    SupabaseStore.setCached(cacheKey, mapped, 30);
    return mapped;
  }

  public static async saveDocument(doc: EmployeeDocument): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(doc.tenantId);

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

  public static async deleteDocument(tenantId: string, documentId: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;
    SupabaseStore.invalidate(tenantId);
    const { error } = await supabase.from('documents').delete().eq('tenant_id', tenantId).eq('id', documentId);
    return !error;
  }

  public static async deleteDocumentsBulk(tenantId: string, documentIds: string[]): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;
    SupabaseStore.invalidate(tenantId);
    const { error } = await supabase.from('documents').delete().eq('tenant_id', tenantId).in('id', documentIds);
    return !error;
  }

  public static async updateDocument(doc: {
    id: string;
    tenantId: string;
    title?: string;
    documentType?: any;
    employeeId?: string;
    employeeName?: string;
  }): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;
    SupabaseStore.invalidate(doc.tenantId);

    const updates: Record<string, any> = {};
    if (doc.title) updates.title = doc.title;
    if (doc.documentType) updates.document_type = doc.documentType;
    if (doc.employeeId) updates.employee_id = doc.employeeId;
    if (doc.employeeName) updates.employee_name = doc.employeeName;

    const { error } = await supabase
      .from('documents')
      .update(updates)
      .eq('tenant_id', doc.tenantId)
      .eq('id', doc.id);

    return !error;
  }

  // --------------------------------------------------------------------------
  // RECRUITMENT & ATS (Persistent JSON Storage in Tenant Checklist)
  // --------------------------------------------------------------------------
  public static async getRecruitment(
    tenantId: string
  ): Promise<{ openings: JobOpening[]; applicants: JobApplicant[] } | null> {
    const cached = SupabaseStore.getCached<{ openings: JobOpening[]; applicants: JobApplicant[] }>(`recruitment_${tenantId}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('onboarding_checklist')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) return null;

    const recruitmentItem = (tenant.onboarding_checklist || []).find((s: any) => s.id === '__recruitment__');
    if (!recruitmentItem || !recruitmentItem.data) return null;

    const result = {
      openings: recruitmentItem.data.openings || [],
      applicants: recruitmentItem.data.applicants || []
    };

    SupabaseStore.setCached(`recruitment_${tenantId}`, result, 30);
    return result;
  }

  public static async saveRecruitment(
    tenantId: string,
    openings: JobOpening[],
    applicants: JobApplicant[]
  ): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const { data: tenant, error: fetchErr } = await supabase
      .from('tenants')
      .select('onboarding_checklist')
      .eq('id', tenantId)
      .single();

    if (fetchErr || !tenant) return false;

    const checklist = (tenant.onboarding_checklist || []).filter((s: any) => s.id !== '__recruitment__');
    checklist.push({
      id: '__recruitment__',
      title: 'Recruitment & ATS Data',
      completed: true,
      data: { openings, applicants }
    });

    const { error: updErr } = await supabase
      .from('tenants')
      .update({ onboarding_checklist: checklist })
      .eq('id', tenantId);

    SupabaseStore.invalidate(tenantId);
    return !updErr;
  }

  // --------------------------------------------------------------------------
  // INVITATIONS
  // --------------------------------------------------------------------------
  public static async getInvitations(tenantId: string): Promise<Invitation[] | null> {
    const cached = SupabaseStore.getCached<Invitation[]>(`invitations_${tenantId}`);
    if (cached) return cached;

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error || !data) return null;

    const mapped = data.map((i) => ({
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

    SupabaseStore.setCached(`invitations_${tenantId}`, mapped, 30);
    return mapped;
  }

  public static async getInvitationByToken(token: string): Promise<Invitation | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const trimmed = token.trim();
    // 1. Direct match
    let { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', trimmed)
      .maybeSingle();

    // 2. Fuzzy match if visually ambiguous (e.g. '1' vs 'l') or case difference
    if (!data) {
      const alt1 = trimmed.replace(/1/g, 'l');
      const alt2 = trimmed.replace(/l/g, '1');
      const { data: altData } = await supabase
        .from('invitations')
        .select('*')
        .or(`token.eq.${alt1},token.eq.${alt2},token.ilike.${trimmed}`)
        .maybeSingle();
      if (altData) {
        data = altData;
      }
    }

    if (error || !data) return null;

    return {
      id: data.id,
      tenantId: data.tenant_id,
      tenantName: data.tenant_name,
      employeeId: data.employee_id,
      employeeName: data.employee_name,
      email: data.email,
      role: data.role,
      token: data.token,
      tokenHash: data.token_hash,
      status: data.status,
      expiresAt: data.expires_at,
      lastSentAt: data.last_sent_at,
      acceptedAt: data.accepted_at,
      createdAt: data.created_at || new Date().toISOString()
    };
  }

  public static async saveInvitation(inv: Invitation): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    SupabaseStore.invalidate(inv.tenantId);

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

  public static async revokeInvitation(
    tenantId: string,
    invitationId?: string,
    employeeId?: string,
    email?: string
  ): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    try {
      // 1. Update invitation table to REVOKED
      if (invitationId && !invitationId.startsWith('inv-active-') && !invitationId.startsWith('inv-revoked-')) {
        await supabase
          .from('invitations')
          .update({ status: 'REVOKED' })
          .eq('tenant_id', tenantId)
          .eq('id', invitationId);
      }
      if (employeeId) {
        await supabase
          .from('invitations')
          .update({ status: 'REVOKED' })
          .eq('tenant_id', tenantId)
          .eq('employee_id', employeeId);
      }
      if (email) {
        await supabase
          .from('invitations')
          .update({ status: 'REVOKED' })
          .eq('tenant_id', tenantId)
          .ilike('email', email.trim());
      }

      // 2. Update employee login_status in employees table
      if (employeeId) {
        await supabase
          .from('employees')
          .update({ login_status: 'REVOKED' })
          .eq('tenant_id', tenantId)
          .eq('id', employeeId);
      }
      if (email) {
        await supabase
          .from('employees')
          .update({ login_status: 'REVOKED' })
          .eq('tenant_id', tenantId)
          .ilike('work_email', email.trim());
      }

      // 3. Suspend tenant_membership if user exists
      if (email) {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .ilike('email', email.trim())
          .maybeSingle();

        if (user) {
          await supabase
            .from('tenant_memberships')
            .update({ status: 'SUSPENDED' })
            .eq('tenant_id', tenantId)
            .eq('user_id', user.id);
        }
      }

      return true;
    } catch (err) {
      console.warn('Supabase revokeInvitation error:', err);
      return false;
    }
  }

  public static async deleteInvitation(
    tenantId: string,
    invitationId?: string,
    employeeId?: string,
    email?: string
  ): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    try {
      // 1. Delete invitation from invitations table
      if (invitationId && !invitationId.startsWith('inv-active-') && !invitationId.startsWith('inv-revoked-')) {
        await supabase
          .from('invitations')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('id', invitationId);
      }
      if (employeeId) {
        await supabase
          .from('invitations')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('employee_id', employeeId);
      }
      if (email) {
        await supabase
          .from('invitations')
          .delete()
          .eq('tenant_id', tenantId)
          .ilike('email', email.trim());
      }

      // 2. Reset employee login_status to NOT_INVITED
      if (employeeId) {
        await supabase
          .from('employees')
          .update({ login_status: 'NOT_INVITED', invitation_id: null })
          .eq('tenant_id', tenantId)
          .eq('id', employeeId);
      }
      if (email) {
        await supabase
          .from('employees')
          .update({ login_status: 'NOT_INVITED', invitation_id: null })
          .eq('tenant_id', tenantId)
          .ilike('work_email', email.trim());
      }

      // 3. Remove invited/pending membership if user exists
      if (email) {
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .ilike('email', email.trim())
          .maybeSingle();

        if (user) {
          await supabase
            .from('tenant_memberships')
            .delete()
            .eq('tenant_id', tenantId)
            .eq('user_id', user.id)
            .eq('status', 'INVITED');
        }
      }

      return true;
    } catch (err) {
      console.warn('Supabase deleteInvitation error:', err);
      return false;
    }
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

  public static async getUserByEmail(email: string): Promise<User | null> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

    const trimmed = email.trim().toLowerCase();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', trimmed)
      .maybeSingle();

    if (userError || !userData) return null;

    // Fetch user memberships with tenant details
    const { data: memberData } = await supabase
      .from('tenant_memberships')
      .select('*, tenants(name, slug)')
      .eq('user_id', userData.id);

    const memberships: TenantMembership[] = (memberData || []).map((m: any) => ({
      id: m.id,
      tenantId: m.tenant_id,
      tenantName: m.tenants?.name || 'Workspace',
      tenantSlug: m.tenants?.slug || m.tenant_id,
      role: m.role,
      status: m.status
    }));

    return {
      id: userData.id,
      email: userData.email,
      passwordHash: userData.password_hash,
      name: userData.name,
      avatarUrl: userData.avatar_url,
      isSuperAdmin: Boolean(userData.is_super_admin),
      memberships,
      activeTenantId: userData.active_tenant_id,
      isActive: Boolean(userData.is_active),
      createdAt: userData.created_at
    };
  }

  public static async updateUserPassword(email: string, passwordHash: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return false;

    const trimmed = email.trim().toLowerCase();
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .ilike('email', trimmed);

    if (error) {
      console.warn('Supabase updateUserPassword error:', error.message);
      return false;
    }
    return true;
  }

  public static async getTenantMemberships(
    tenantId: string
  ): Promise<{ userId: string; role: string; status: string; email?: string }[]> {
    const supabase = getSupabaseAdmin();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('tenant_memberships')
        .select('user_id, role, status, users(email)')
        .eq('tenant_id', tenantId);

      if (error || !data) return [];
      return data.map((m: any) => ({
        userId: m.user_id,
        role: m.role,
        status: m.status,
        email: m.users?.email
      }));
    } catch {
      return [];
    }
  }
}

