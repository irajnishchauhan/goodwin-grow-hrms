import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/admin';
import { Tenant, Employee, User, Invitation, AttendanceRecord, LeaveApplication, SalarySlip } from '@/lib/types';

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
      onboarding_checklist: tenant.onboardingChecklist
    });

    if (error) {
      console.warn('Supabase saveTenant error:', error.message);
      return false;
    }
    return true;
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
      .eq('tenant_id', tenantId);

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
      invitation_id: emp.invitationId
    });

    if (error) {
      console.warn('Supabase saveEmployee error:', error.message);
      return false;
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // INVITATIONS
  // --------------------------------------------------------------------------
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
