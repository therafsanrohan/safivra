-- ================================================================
-- Migration: 20260901000006_admin_rbac.sql
-- Description: Admin accounts, roles, and permissions
-- ================================================================

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Role permissions junction
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

-- Admin accounts (extends auth.users for admins)
CREATE TABLE IF NOT EXISTS public.admin_accounts (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role_id uuid REFERENCES public.roles(id),
    status text DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id uuid REFERENCES public.admin_accounts(id),
    action text NOT NULL,
    resource_type text,
    resource_id text,
    before_snapshot jsonb,
    after_snapshot jsonb,
    reason text,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Deny all access by default to regular users
-- (Only backend service roles can read/write these)
CREATE POLICY "deny_all_roles" ON public.roles FOR ALL USING (false);
CREATE POLICY "deny_all_permissions" ON public.permissions FOR ALL USING (false);
CREATE POLICY "deny_all_role_permissions" ON public.role_permissions FOR ALL USING (false);
CREATE POLICY "deny_all_admin_accounts" ON public.admin_accounts FOR ALL USING (false);
CREATE POLICY "deny_all_audit_logs" ON public.admin_audit_logs FOR ALL USING (false);

-- Notify schema
NOTIFY pgrst, 'reload schema';
