-- ==============================================================================
-- GOODWIN GROW HRMS — SUPABASE INITIAL SEED DATA
-- ==============================================================================
-- Seeds the initial tenant workspaces, users, and memberships.
-- Goodwin Batteries is provisioned with Rajnish Singh Chauhan as Company Owner (COMPANY_ADMIN)
-- with a 100% clean, pristine workspace ready for full custom configuration via Setup Wizard.
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
    '/goodwin-logo.png',
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
    'tenant-goodwin-batteries-fleet',
    'Goodwin Batteries Pvt Ltd',
    'goodwin-batteries-fleet',
    'GOODWIN-BAT-FLEET',
    '/goodwin-logo.png',
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
    'enterprise',
    250,
    'goodwin-batteries-fleet.goodwingrowai.com',
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
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    company_code = EXCLUDED.company_code,
    plan_id = EXCLUDED.plan_id;

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
    'rajnish.chauhan@goodwinbatteries.com',
    'password123',
    'Rajnish Singh Chauhan',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    true,
    'tenant-goodwin-batteries',
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    is_super_admin = EXCLUDED.is_super_admin,
    active_tenant_id = EXCLUDED.active_tenant_id;

-- 3. Insert Tenant Memberships
INSERT INTO public.tenant_memberships (id, user_id, tenant_id, role, status)
VALUES
('m-sa-1', 'user-super-admin', 'tenant-goodwin-batteries', 'COMPANY_ADMIN', 'ACTIVE'),
('m-sa-2', 'user-super-admin', 'tenant-goodwin', 'COMPANY_ADMIN', 'ACTIVE'),
('m-sa-3', 'user-super-admin', 'tenant-goodwin-batteries-fleet', 'COMPANY_ADMIN', 'ACTIVE'),
('m-owner-1', 'user-bat-owner', 'tenant-goodwin-batteries', 'COMPANY_ADMIN', 'ACTIVE'),
('m-owner-2', 'user-bat-owner', 'tenant-goodwin-batteries-fleet', 'COMPANY_ADMIN', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- Note: Goodwin Batteries workforce, departments, shifts, leaves, slips, and documents
-- are intentionally left completely empty so the owner can configure everything through the Setup Wizard.
