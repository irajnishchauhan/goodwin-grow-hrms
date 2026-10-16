-- ==============================================================================
-- GOODWIN GROW HRMS — SUPABASE INITIAL SEED DATA
-- ==============================================================================
-- Seeds the initial tenant workspaces (Goodwin Batteries, Goodwin Tech, Nexus AI),
-- users, memberships, departments, employees, leave policies, shifts, and slips.
-- ==============================================================================

-- 1. Insert Tenants
INSERT INTO public.tenants (
    id, name, slug, company_code, logo_url, industry, business_email, business_phone,
    registered_address, city, state, country, postal_code, website, timezone, currency,
    financial_year, primary_color, status, plan_id, max_employees, domain, enabled_modules
) VALUES
(
    'tenant-goodwin-batteries',
    'Goodwin Batteries Pvt Ltd',
    'goodwin-batteries',
    'GOODWIN-BAT',
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=128&auto=format&fit=crop&q=80',
    'Battery Manufacturing & Energy Storage',
    'contact@goodwinbatteries.com',
    '+91 80 4123 5566',
    'Plot 42, Electronic City Phase 2, Hosur Road',
    'Bangalore',
    'Karnataka',
    'India',
    '560100',
    'https://goodwinbatteries.com',
    'Asia/Kolkata',
    'INR',
    'April - March',
    '#D97706',
    'ACTIVE',
    'growth',
    100,
    'goodwin-batteries.goodwingrowai.com',
    ARRAY['CORE_HR', 'ATTENDANCE', 'LEAVES', 'PAYROLL', 'RECRUITMENT', 'DOCUMENTS']
),
(
    'tenant-goodwin',
    'Goodwin Technologies Pvt Ltd',
    'goodwin-tech',
    'GOODWIN-TECH',
    'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&auto=format&fit=crop&q=80',
    'Software & Cloud Engineering',
    'contact@goodwintech.com',
    '+91 80 2841 0022',
    'Level 5, Embassy Tech Village',
    'Bangalore',
    'Karnataka',
    'India',
    '560103',
    'https://goodwintech.com',
    'Asia/Kolkata',
    'INR',
    'April - March',
    '#059669',
    'ACTIVE',
    'enterprise',
    250,
    'goodwintech.goodwingrowai.com',
    ARRAY['CORE_HR', 'ATTENDANCE', 'LEAVES', 'PAYROLL', 'RECRUITMENT', 'DOCUMENTS']
),
(
    'tenant-nexus',
    'Nexus AI Labs Inc.',
    'nexus-ai',
    'NEXUS-AI',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    'Artificial Intelligence & Robotics',
    'contact@nexusai.io',
    '+1 415 555 0199',
    '550 Montgomery St, Suite 400',
    'San Francisco',
    'California',
    'United States',
    '94111',
    'https://nexusai.io',
    'America/Los_Angeles',
    'USD',
    'January - December',
    '#2563EB',
    'ACTIVE',
    'starter',
    50,
    'nexusai.goodwingrowai.com',
    ARRAY['CORE_HR', 'ATTENDANCE', 'LEAVES', 'DOCUMENTS']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Users
INSERT INTO public.users (id, email, password_hash, name, avatar_url, is_super_admin, active_tenant_id, is_active)
VALUES
(
    'user-super-admin',
    'admin@goodwingrow.ai',
    'password123',
    'Rajnish Chauhan (Super Admin)',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    true,
    'tenant-goodwin-batteries',
    true
),
(
    'user-bat-owner',
    'rajesh.sharma@goodwinbatteries.com',
    'password123',
    'Rajesh Sharma',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    false,
    'tenant-goodwin-batteries',
    true
),
(
    'user-bat-hr',
    'priya.nair@goodwinbatteries.com',
    'password123',
    'Priya Nair',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    false,
    'tenant-goodwin-batteries',
    true
),
(
    'user-bat-manager',
    'amit.patel@goodwinbatteries.com',
    'password123',
    'Amit Patel',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    false,
    'tenant-goodwin-batteries',
    true
),
(
    'user-bat-emp1',
    'sunil.kumar@goodwinbatteries.com',
    'password123',
    'Sunil Kumar',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    false,
    'tenant-goodwin-batteries',
    true
),
(
    'user-bat-rajnish',
    'rajnish.chauhan@goodwinbatteries.com',
    'password123',
    'Rajnish Singh Chauhan',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    false,
    'tenant-goodwin-batteries',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Tenant Memberships
INSERT INTO public.tenant_memberships (id, user_id, tenant_id, role, status)
VALUES
('m-sa-1', 'user-super-admin', 'tenant-goodwin-batteries', 'COMPANY_ADMIN', 'ACTIVE'),
('m-sa-2', 'user-super-admin', 'tenant-goodwin', 'COMPANY_ADMIN', 'ACTIVE'),
('m-bat-1', 'user-bat-owner', 'tenant-goodwin-batteries', 'COMPANY_ADMIN', 'ACTIVE'),
('m-bat-2', 'user-bat-hr', 'tenant-goodwin-batteries', 'HR_ADMIN', 'ACTIVE'),
('m-bat-3', 'user-bat-manager', 'tenant-goodwin-batteries', 'MANAGER', 'ACTIVE'),
('m-bat-4', 'user-bat-emp1', 'tenant-goodwin-batteries', 'EMPLOYEE', 'ACTIVE'),
('m-bat-rajnish', 'user-bat-rajnish', 'tenant-goodwin-batteries', 'EMPLOYEE', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Departments for Goodwin Batteries
INSERT INTO public.departments (id, tenant_id, name, code)
VALUES
('dept-bat-exec', 'tenant-goodwin-batteries', 'Executive & Operations', 'OPS'),
('dept-bat-prod', 'tenant-goodwin-batteries', 'Production & Cell Assembly', 'PROD'),
('dept-bat-qc', 'tenant-goodwin-batteries', 'Quality Control & Testing', 'QC'),
('dept-bat-bms', 'tenant-goodwin-batteries', 'Research & BMS Engineering', 'BMS'),
('dept-bat-log', 'tenant-goodwin-batteries', 'Warehouse & Logistics', 'LOG'),
('dept-bat-hr', 'tenant-goodwin-batteries', 'Human Resources', 'HR')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Employees for Goodwin Batteries
INSERT INTO public.employees (
    id, tenant_id, user_id, employee_code, first_name, last_name, work_email, phone,
    gender, joining_date, department_id, department_name, designation_title,
    reporting_manager_name, employment_type, status, monthly_salary, pan_or_tax_id,
    bank_account_number, bank_name, work_location, shift_name, login_status
) VALUES
(
    'emp-bat-000', 'tenant-goodwin-batteries', 'user-bat-rajnish', 'GB-1000',
    'Rajnish', 'Singh Chauhan', 'rajnish.chauhan@goodwinbatteries.com', '+91 98450 00100',
    'MALE', '2024-01-15', 'dept-bat-prod', 'Production & Cell Assembly', 'Battery Operations Specialist',
    'Amit Patel (Prod Mgr)', 'FULL_TIME', 'ACTIVE', 75000, 'RCHAU1234K', '987654321098',
    'HDFC Bank', 'Bangalore Plant 1', 'Morning Shift (A)', 'ACCEPTED'
),
(
    'emp-bat-001', 'tenant-goodwin-batteries', 'user-bat-owner', 'GB-1001',
    'Rajesh', 'Sharma', 'rajesh.sharma@goodwinbatteries.com', '+91 98450 11001',
    'MALE', '2024-01-01', 'dept-bat-exec', 'Executive & Operations', 'Managing Director & CEO',
    'Board of Directors', 'FULL_TIME', 'ACTIVE', 380000, 'RSHAR9912K', '901827364512',
    'State Bank of India', 'Bangalore Plant 1', 'General Day Shift', 'ACCEPTED'
),
(
    'emp-bat-002', 'tenant-goodwin-batteries', 'user-bat-hr', 'GB-1002',
    'Priya', 'Nair', 'priya.nair@goodwinbatteries.com', '+91 98450 22002',
    'FEMALE', '2024-02-15', 'dept-bat-hr', 'Human Resources', 'HR Operations Lead',
    'Rajesh Sharma (MD)', 'FULL_TIME', 'ACTIVE', 145000, 'PNAIR4412M', '409182736152',
    'HDFC Bank', 'Bangalore Plant 1', 'General Day Shift', 'ACCEPTED'
),
(
    'emp-bat-003', 'tenant-goodwin-batteries', 'user-bat-manager', 'GB-1003',
    'Amit', 'Patel', 'amit.patel@goodwinbatteries.com', '+91 98450 33003',
    'MALE', '2024-03-01', 'dept-bat-prod', 'Production & Cell Assembly', 'Production Operations Manager',
    'Rajesh Sharma (MD)', 'FULL_TIME', 'ACTIVE', 165000, 'APATE5521N', '551928374619',
    'ICICI Bank', 'Bangalore Plant 1', 'Morning Shift (A)', 'ACCEPTED'
),
(
    'emp-bat-004', 'tenant-goodwin-batteries', 'user-bat-emp1', 'GB-1004',
    'Sunil', 'Kumar', 'sunil.kumar@goodwinbatteries.com', '+91 98450 44004',
    'MALE', '2024-04-10', 'dept-bat-prod', 'Production & Cell Assembly', 'Battery Assembly Technician',
    'Amit Patel (Prod Mgr)', 'FULL_TIME', 'ACTIVE', 42000, 'SKUMA6632P', '123890475619',
    'Axis Bank', 'Bangalore Plant 1', 'Morning Shift (A)', 'ACCEPTED'
),
(
    'emp-bat-005', 'tenant-goodwin-batteries', NULL, 'GB-1005',
    'Neha', 'Singh', 'neha.singh@goodwinbatteries.com', '+91 98450 55005',
    'FEMALE', '2024-05-15', 'dept-bat-qc', 'Quality Control & Testing', 'Quality Control Chemist',
    'Amit Patel (Prod Mgr)', 'FULL_TIME', 'ACTIVE', 68000, 'NSING7743Q', '992837465012',
    'Kotak Mahindra Bank', 'Bangalore Plant 1 - Cleanroom Lab', 'General Day Shift', 'PENDING'
),
(
    'emp-bat-006', 'tenant-goodwin-batteries', NULL, 'GB-1006',
    'Ravi', 'Verma', 'ravi.verma@goodwinbatteries.com', '+91 98450 66006',
    'MALE', '2024-06-01', 'dept-bat-qc', 'Quality Control & Testing', 'Cell Testing Specialist',
    'Amit Patel (Prod Mgr)', 'FULL_TIME', 'ACTIVE', 55000, 'RVERM8854R', '662839401928',
    'Punjab National Bank', 'Bangalore Plant 1', 'General Day Shift', 'NOT_INVITED'
),
(
    'emp-bat-007', 'tenant-goodwin-batteries', NULL, 'GB-1007',
    'Pooja', 'Reddy', 'pooja.reddy@goodwinbatteries.com', '+91 98450 77007',
    'FEMALE', '2024-07-01', 'dept-bat-bms', 'Research & BMS Engineering', 'BMS Firmware Developer',
    'Rajesh Sharma (MD)', 'FULL_TIME', 'ACTIVE', 110000, 'PREDD9965S', '331928475619',
    'HDFC Bank', 'R&D Center, Bangalore', 'General Day Shift', 'ACCEPTED'
),
(
    'emp-bat-008', 'tenant-goodwin-batteries', NULL, 'GB-1008',
    'Manoj', 'Tiwari', 'manoj.tiwari@goodwinbatteries.com', '+91 98450 88008',
    'MALE', '2024-08-15', 'dept-bat-log', 'Warehouse & Logistics', 'Warehouse Logistics Associate',
    'Amit Patel (Prod Mgr)', 'FULL_TIME', 'ACTIVE', 38000, 'MTIWA1122T', '881920394857',
    'Bank of Baroda', 'Central Battery Warehouse', 'Morning Shift (A)', 'PENDING'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Pending Invitations
INSERT INTO public.invitations (
    id, tenant_id, tenant_name, employee_id, employee_name, email, role, token, token_hash, status, expires_at
) VALUES
(
    'inv-bat-neha',
    'tenant-goodwin-batteries',
    'Goodwin Batteries Pvt Ltd',
    'emp-bat-005',
    'Neha Singh',
    'neha.singh@goodwinbatteries.com',
    'EMPLOYEE',
    'inv-tok-neha-7743',
    'hash-neha-7743',
    'PENDING',
    NOW() + INTERVAL '7 days'
),
(
    'inv-bat-manoj',
    'tenant-goodwin-batteries',
    'Goodwin Batteries Pvt Ltd',
    'emp-bat-008',
    'Manoj Tiwari',
    'manoj.tiwari@goodwinbatteries.com',
    'EMPLOYEE',
    'inv-tok-manoj-1122',
    'hash-manoj-1122',
    'PENDING',
    NOW() + INTERVAL '7 days'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Shifts & Leave Types
INSERT INTO public.shifts (id, tenant_id, name, start_time, end_time, grace_minutes, is_default)
VALUES
('shift-bat-gen', 'tenant-goodwin-batteries', 'General Factory Shift', '09:00', '18:00', 15, true),
('shift-bat-a', 'tenant-goodwin-batteries', 'Morning Shift (A)', '06:00', '14:30', 10, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.leave_types (id, tenant_id, name, code, days_per_year, color, is_paid)
VALUES
('lt-bat-cl', 'tenant-goodwin-batteries', 'Casual Leave (CL)', 'CL', 12, '#3B82F6', true),
('lt-bat-sl', 'tenant-goodwin-batteries', 'Medical / Sick Leave (SL)', 'SL', 10, '#EF4444', true),
('lt-bat-pl', 'tenant-goodwin-batteries', 'Privilege Leave (PL)', 'PL', 18, '#10B981', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Attendance Records
INSERT INTO public.attendance (
    id, tenant_id, employee_id, employee_name, date, clock_in_time, clock_out_time, working_hours, status, notes, shift_name
) VALUES
(
    'att-bat-0', 'tenant-goodwin-batteries', 'emp-bat-000', 'Rajnish Singh Chauhan',
    CURRENT_DATE, '06:00 AM', '02:30 PM', 8.5, 'PRESENT', 'Battery Operations Station', 'Morning Shift (A)'
),
(
    'att-bat-1', 'tenant-goodwin-batteries', 'emp-bat-004', 'Sunil Kumar',
    CURRENT_DATE, '06:05 AM', NULL, 7.8, 'PRESENT', 'Cell Welding Station 4', 'Morning Assembly Shift (A)'
)
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Leave Applications
INSERT INTO public.leave_applications (
    id, tenant_id, employee_id, employee_name, employee_code, department_name, leave_type_id, leave_type_name,
    start_date, end_date, total_days, reason, status, applied_at
) VALUES
(
    'leave-app-bat-1', 'tenant-goodwin-batteries', 'emp-bat-004', 'Sunil Kumar', 'GB-1004',
    'Production & Cell Assembly', 'lt-bat-cl', 'Casual Leave (CL)',
    '2026-10-22', '2026-10-23', 2, 'Village harvest festival family gathering', 'PENDING', NOW() - INTERVAL '2 days'
),
(
    'leave-app-bat-0', 'tenant-goodwin-batteries', 'emp-bat-000', 'Rajnish Singh Chauhan', 'GB-1000',
    'Production & Cell Assembly', 'lt-bat-cl', 'Casual Leave (CL)',
    '2026-11-05', '2026-11-06', 2, 'Family function attendance', 'APPROVED', NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- 10. Insert Salary Slips
INSERT INTO public.salary_slips (
    id, tenant_id, employee_id, employee_name, employee_code, department_name, month,
    basic_pay, hra, special_allowance, gross_salary, provident_fund, esi, professional_tax,
    tax_deduction, total_deductions, net_pay, payment_status, generated_date
) VALUES
(
    'slip-bat-00', 'tenant-goodwin-batteries', 'emp-bat-000', 'Rajnish Singh Chauhan', 'GB-1000',
    'Production & Cell Assembly', '2026-10', 37500, 18750, 18750, 75000, 1800, 0, 200, 2500, 4500, 70500, 'PAID', CURRENT_DATE
),
(
    'slip-bat-01', 'tenant-goodwin-batteries', 'emp-bat-004', 'Sunil Kumar', 'GB-1004',
    'Production & Cell Assembly', '2026-10', 21000, 10500, 10500, 42000, 1800, 315, 200, 0, 2315, 39685, 'PAID', CURRENT_DATE
)
ON CONFLICT (id) DO NOTHING;

-- 11. Insert Employee Documents
INSERT INTO public.documents (
    id, tenant_id, employee_id, employee_name, title, document_type, file_name, file_size, uploaded_at
) VALUES
(
    'doc-bat-00', 'tenant-goodwin-batteries', 'emp-bat-000', 'Rajnish Singh Chauhan',
    'Signed Employment Agreement & Non-Disclosure Form', 'CONTRACT', 'Rajnish_Chauhan_Employment_Agreement.pdf', '1.8 MB', NOW() - INTERVAL '180 days'
),
(
    'doc-bat-01', 'tenant-goodwin-batteries', 'emp-bat-004', 'Sunil Kumar',
    'Cell Assembly Safety & Hazardous Materials Cert', 'POLICY', 'Sunil_Kumar_HazMat_Level2_Cert.pdf', '1.2 MB', NOW() - INTERVAL '90 days'
)
ON CONFLICT (id) DO NOTHING;

-- 12. Insert Holidays
INSERT INTO public.holidays (id, tenant_id, name, date, is_mandatory)
VALUES
('hol-bat-1', 'tenant-goodwin-batteries', 'Republic Day', '2026-01-26', true),
('hol-bat-2', 'tenant-goodwin-batteries', 'Independence Day', '2026-08-15', true),
('hol-bat-3', 'tenant-goodwin-batteries', 'Gandhi Jayanti', '2026-10-02', true),
('hol-bat-4', 'tenant-goodwin-batteries', 'Diwali / Deepavali', '2026-11-08', true)
ON CONFLICT (id) DO NOTHING;

