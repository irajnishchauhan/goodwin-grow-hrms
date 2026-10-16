-- ==============================================================================
-- GOODWIN GROW HRMS — ENTERPRISE MULTI-TENANT POSTGRESQL SCHEMA FOR SUPABASE
-- ==============================================================================
-- Includes strict foreign keys, multi-tenant partitioning, Row Level Security (RLS),
-- indexes for high-throughput queries, and default functions.
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TENANTS / CLIENT COMPANIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    company_code TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    industry TEXT,
    business_email TEXT,
    business_phone TEXT,
    registered_address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    postal_code TEXT,
    website TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    currency TEXT DEFAULT 'INR',
    financial_year TEXT DEFAULT 'April - March',
    primary_color TEXT DEFAULT '#059669',
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED')),
    plan_id TEXT DEFAULT 'growth' CHECK (plan_id IN ('starter', 'growth', 'enterprise')),
    max_employees INTEGER DEFAULT 100,
    domain TEXT,
    enabled_modules TEXT[] DEFAULT ARRAY['CORE_HR', 'ATTENDANCE', 'LEAVES', 'PAYROLL', 'RECRUITMENT', 'DOCUMENTS'],
    subscription_start DATE DEFAULT CURRENT_DATE,
    subscription_renewal DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    billing_contact TEXT,
    trial_status BOOLEAN DEFAULT FALSE,
    onboarding_checklist JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_company_code ON public.tenants(company_code);

-- ------------------------------------------------------------------------------
-- 2. USERS (AUTHENTICATION ENTITIES)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    active_tenant_id TEXT REFERENCES public.tenants(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ------------------------------------------------------------------------------
-- 3. TENANT MEMBERSHIPS (MULTI-TENANT USER ASSOCIATIONS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'PAYROLL_ADMIN', 'MANAGER', 'EMPLOYEE')),
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INVITED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_tenant UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON public.tenant_memberships(tenant_id);

-- ------------------------------------------------------------------------------
-- 4. DEPARTMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    parent_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_dept_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departments_tenant ON public.departments(tenant_id);

-- ------------------------------------------------------------------------------
-- 5. DESIGNATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.designations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    department_id TEXT REFERENCES public.departments(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_designations_tenant ON public.designations(tenant_id);

-- ------------------------------------------------------------------------------
-- 6. EMPLOYEES (WORKFORCE RECORDS - SEPARATE FROM USERS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    employee_code TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    work_email TEXT NOT NULL,
    phone TEXT,
    gender TEXT DEFAULT 'OTHER',
    joining_date DATE DEFAULT CURRENT_DATE,
    department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
    department_name TEXT,
    designation_id TEXT,
    designation_title TEXT,
    reporting_manager_id TEXT,
    reporting_manager_name TEXT,
    employment_type TEXT DEFAULT 'FULL_TIME' CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN')),
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'EXITED')),
    monthly_salary NUMERIC(12, 2) DEFAULT 45000,
    pan_or_tax_id TEXT,
    bank_account_number TEXT,
    bank_name TEXT,
    work_location TEXT,
    shift_name TEXT DEFAULT 'General Day Shift',
    login_status TEXT DEFAULT 'NOT_INVITED' CHECK (login_status IN ('NOT_INVITED', 'PENDING', 'ACCEPTED', 'REVOKED')),
    invitation_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_emp_tenant_code UNIQUE (tenant_id, employee_code),
    CONSTRAINT uq_emp_tenant_email UNIQUE (tenant_id, work_email)
);

CREATE INDEX IF NOT EXISTS idx_employees_tenant ON public.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(work_email);

-- ------------------------------------------------------------------------------
-- 7. INVITATIONS & SINGLE-USE CREDENTIAL TOKENS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invitations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    tenant_name TEXT,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'EMPLOYEE',
    token TEXT UNIQUE NOT NULL,
    token_hash TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_sent_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON public.invitations(tenant_id);

-- ------------------------------------------------------------------------------
-- 8. SHIFTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shifts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    grace_minutes INTEGER DEFAULT 15,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON public.shifts(tenant_id);

-- ------------------------------------------------------------------------------
-- 9. ATTENDANCE & BIOMETRIC CLOCK LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    date DATE NOT NULL,
    clock_in_time TEXT,
    clock_out_time TEXT,
    working_hours NUMERIC(4, 2) DEFAULT 0,
    status TEXT DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'LATE_ENTRY', 'HOLIDAY')),
    notes TEXT,
    shift_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_att_tenant_emp_date UNIQUE (tenant_id, employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date ON public.attendance(tenant_id, date);

-- ------------------------------------------------------------------------------
-- 10. LEAVE TYPES & QUOTAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leave_types (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    days_per_year INTEGER DEFAULT 12,
    color TEXT DEFAULT '#3B82F6',
    is_paid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_types_tenant ON public.leave_types(tenant_id);

-- ------------------------------------------------------------------------------
-- 11. LEAVE APPLICATIONS & WORKFLOW APPROVALS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leave_applications (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    leave_type_id TEXT NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
    leave_type_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4, 1) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    reviewed_by TEXT,
    review_comment TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leave_apps_tenant ON public.leave_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_apps_employee ON public.leave_applications(employee_id);

-- ------------------------------------------------------------------------------
-- 12. PAYROLL & SALARY SLIPS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.salary_slips (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    employee_code TEXT NOT NULL,
    department_name TEXT,
    month TEXT NOT NULL, -- e.g. '2026-10'
    basic_pay NUMERIC(12, 2) NOT NULL,
    hra NUMERIC(12, 2) NOT NULL,
    special_allowance NUMERIC(12, 2) NOT NULL,
    gross_salary NUMERIC(12, 2) NOT NULL,
    provident_fund NUMERIC(12, 2) DEFAULT 0,
    esi NUMERIC(12, 2) DEFAULT 0,
    professional_tax NUMERIC(12, 2) DEFAULT 0,
    tax_deduction NUMERIC(12, 2) DEFAULT 0,
    total_deductions NUMERIC(12, 2) NOT NULL,
    net_pay NUMERIC(12, 2) NOT NULL,
    payment_status TEXT DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PENDING', 'PROCESSING')),
    generated_date DATE DEFAULT CURRENT_DATE,
    CONSTRAINT uq_slip_emp_month UNIQUE (tenant_id, employee_id, month)
);

CREATE INDEX IF NOT EXISTS idx_salary_slips_tenant_month ON public.salary_slips(tenant_id, month);

-- ------------------------------------------------------------------------------
-- 13. DOCUMENTS & COMPLIANCE VAULT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('CONTRACT', 'OFFER_LETTER', 'IDENTITY_PROOF', 'TAX_DECLARATION', 'CERTIFICATE')),
    file_name TEXT NOT NULL,
    file_size TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_emp ON public.documents(tenant_id, employee_id);

-- ------------------------------------------------------------------------------
-- 14. HOLIDAY CALENDAR
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.holidays (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holidays_tenant ON public.holidays(tenant_id);

-- ------------------------------------------------------------------------------
-- 15. AUDIT LOGS (SECURITY & ACTIVITY TRACKING)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES public.tenants(id) ON DELETE SET NULL,
    tenant_name TEXT,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    ip_address TEXT,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public Anon access for tenant discovery & universal login company selector:
DROP POLICY IF EXISTS anon_select_tenants ON public.tenants;
CREATE POLICY anon_select_tenants ON public.tenants FOR SELECT TO anon USING (true);

-- Service Role (Server Backend) has full bypass access:
DROP POLICY IF EXISTS service_role_all_tenants ON public.tenants;
CREATE POLICY service_role_all_tenants ON public.tenants FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_users ON public.users;
CREATE POLICY service_role_all_users ON public.users FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_memberships ON public.tenant_memberships;
CREATE POLICY service_role_all_memberships ON public.tenant_memberships FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_departments ON public.departments;
CREATE POLICY service_role_all_departments ON public.departments FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_designations ON public.designations;
CREATE POLICY service_role_all_designations ON public.designations FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_employees ON public.employees;
CREATE POLICY service_role_all_employees ON public.employees FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_invitations ON public.invitations;
CREATE POLICY service_role_all_invitations ON public.invitations FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_shifts ON public.shifts;
CREATE POLICY service_role_all_shifts ON public.shifts FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_attendance ON public.attendance;
CREATE POLICY service_role_all_attendance ON public.attendance FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_leave_types ON public.leave_types;
CREATE POLICY service_role_all_leave_types ON public.leave_types FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_leave_apps ON public.leave_applications;
CREATE POLICY service_role_all_leave_apps ON public.leave_applications FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_salary_slips ON public.salary_slips;
CREATE POLICY service_role_all_salary_slips ON public.salary_slips FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_documents ON public.documents;
CREATE POLICY service_role_all_documents ON public.documents FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_holidays ON public.holidays;
CREATE POLICY service_role_all_holidays ON public.holidays FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS service_role_all_audit_logs ON public.audit_logs;
CREATE POLICY service_role_all_audit_logs ON public.audit_logs FOR ALL TO service_role USING (true);

-- Authenticated Users can read their assigned tenant workspace:
DROP POLICY IF EXISTS user_read_accessible_tenants ON public.tenants;
CREATE POLICY user_read_accessible_tenants ON public.tenants
    FOR SELECT TO authenticated
    USING (
        id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid()::text)
    );

DROP POLICY IF EXISTS user_read_tenant_employees ON public.employees;
CREATE POLICY user_read_tenant_employees ON public.employees
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (SELECT tenant_id FROM public.tenant_memberships WHERE user_id = auth.uid()::text)
    );
