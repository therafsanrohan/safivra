-- ============================================================
-- SAFIVRA
-- Production-Safe Advanced Notification Infrastructure
-- ============================================================
--
-- IMPORTANT:
-- 1. Does NOT delete existing users
-- 2. Does NOT delete existing notifications
-- 3. Does NOT modify existing financial records
-- 4. Does NOT modify existing DPS/FDR records
-- 5. Does NOT assume existing table names
-- 6. All new structures are additive
--
-- Run this once in Supabase SQL Editor.
-- ============================================================


-- ============================================================
-- 1. NOTIFICATION PREFERENCES
-- ============================================================

create table if not exists public.notification_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,

    in_app_enabled boolean not null default true,
    browser_push_enabled boolean not null default false,

    dps_enabled boolean not null default true,
    fdr_enabled boolean not null default true,
    savings_enabled boolean not null default true,
    savings_goal_enabled boolean not null default true,

    loan_enabled boolean not null default true,
    credit_card_enabled boolean not null default true,

    salary_enabled boolean not null default true,
    budget_enabled boolean not null default true,

    wealth_intelligence_enabled boolean not null default true,
    zakat_enabled boolean not null default true,

    admin_enabled boolean not null default true,
    security_enabled boolean not null default true,

    quiet_hours_enabled boolean not null default false,
    quiet_hours_start time,
    quiet_hours_end time,

    max_financial_pushes_per_day integer not null default 3
        check (max_financial_pushes_per_day between 0 and 20),

    reengagement_enabled boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- 2. WEB PUSH SUBSCRIPTIONS
-- Multiple browsers/devices per user are supported.
-- ============================================================

create table if not exists public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null references auth.users(id) on delete cascade,

    endpoint text not null,
    p256dh text not null,
    auth text not null,

    user_agent text,
    device_label text,

    is_active boolean not null default true,

    last_seen_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (user_id, endpoint)
);

create index if not exists idx_push_subscriptions_user
    on public.push_subscriptions(user_id);

create index if not exists idx_push_subscriptions_active
    on public.push_subscriptions(is_active);


-- ============================================================
-- 3. NOTIFICATION EVENTS
--
-- This is the central event ledger.
--
-- Examples:
-- DPS_DUE
-- DPS_OVERDUE
-- DPS_MATURITY
-- FDR_MATURITY
-- SAVINGS_GOAL_MILESTONE
-- BUDGET_THRESHOLD
-- ADMIN_ANNOUNCEMENT
-- USER_REENGAGEMENT
-- ============================================================

create table if not exists public.notification_events (
    id uuid primary key default gen_random_uuid(),

    user_id uuid references auth.users(id) on delete cascade,

    event_type text not null,
    category text not null,

    entity_type text,
    entity_id text,

    title text not null,
    message text not null,

    action_url text,

    priority text not null default 'normal'
        check (priority in ('low', 'normal', 'high', 'critical')),

    source text not null default 'system'
        check (source in ('system', 'admin', 'user')),

    metadata jsonb not null default '{}'::jsonb,

    scheduled_for timestamptz,
    expires_at timestamptz,

    created_at timestamptz not null default now()
);

create index if not exists idx_notification_events_user
    on public.notification_events(user_id);

create index if not exists idx_notification_events_type
    on public.notification_events(event_type);

create index if not exists idx_notification_events_scheduled
    on public.notification_events(scheduled_for);

create index if not exists idx_notification_events_created
    on public.notification_events(created_at desc);


-- ============================================================
-- 4. NOTIFICATION DELIVERIES
--
-- One event can have multiple delivery channels:
-- in_app
-- web_push
--
-- Later:
-- email
-- sms
-- ============================================================

create table if not exists public.notification_deliveries (
    id uuid primary key default gen_random_uuid(),

    event_id uuid not null
        references public.notification_events(id)
        on delete cascade,

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    channel text not null
        check (channel in ('in_app', 'web_push', 'email', 'sms')),

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'queued',
                'sent',
                'delivered',
                'opened',
                'clicked',
                'failed',
                'dismissed',
                'cancelled'
            )
        ),

    provider_message_id text,

    sent_at timestamptz,
    delivered_at timestamptz,
    opened_at timestamptz,
    clicked_at timestamptz,

    error_code text,
    error_message text,

    created_at timestamptz not null default now(),

    unique(event_id, channel)
);

create index if not exists idx_notification_deliveries_user
    on public.notification_deliveries(user_id);

create index if not exists idx_notification_deliveries_status
    on public.notification_deliveries(status);

create index if not exists idx_notification_deliveries_pending
    on public.notification_deliveries(status, created_at);


-- ============================================================
-- 5. NOTIFICATION READ STATE
--
-- Keeps notification history separate from delivery state.
-- ============================================================

create table if not exists public.notification_reads (
    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    event_id uuid not null
        references public.notification_events(id)
        on delete cascade,

    read_at timestamptz not null default now(),

    primary key(user_id, event_id)
);


-- ============================================================
-- 6. DEDUPLICATION / IDEMPOTENCY
--
-- Prevents duplicate notifications.
--
-- Example deterministic keys:
--
-- dps:{id}:due:3day:2026-10-05
-- fdr:{id}:maturity:7day:2026-10-05
-- goal:{id}:milestone:75
-- ============================================================

create table if not exists public.notification_dedup (
    dedup_key text primary key,

    user_id uuid
        references auth.users(id)
        on delete cascade,

    event_type text not null,

    first_created_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),

    occurrence_count integer not null default 1
        check (occurrence_count > 0)
);


-- ============================================================
-- 7. ADMIN NOTIFICATION CAMPAIGNS
--
-- Existing admin notifications remain untouched.
-- This table provides the advanced layer.
-- ============================================================

create table if not exists public.notification_campaigns (
    id uuid primary key default gen_random_uuid(),

    title text not null,
    message text not null,

    action_url text,

    audience_type text not null default 'all'
        check (
            audience_type in (
                'all',
                'active',
                'inactive',
                'new_users',
                'incomplete_profile',
                'no_accounts',
                'has_dps',
                'has_fdr',
                'has_savings_goal',
                'has_loans',
                'has_credit_cards',
                'has_salary'
            )
        ),

    priority text not null default 'normal'
        check (priority in ('low', 'normal', 'high', 'critical')),

    channel_in_app boolean not null default true,
    channel_web_push boolean not null default false,

    scheduled_for timestamptz,
    expires_at timestamptz,

    status text not null default 'draft'
        check (
            status in (
                'draft',
                'scheduled',
                'sending',
                'sent',
                'cancelled',
                'expired'
            )
        ),

    created_by uuid references auth.users(id),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- 8. USER ACTIVITY
--
-- Required for meaningful re-engagement.
-- ============================================================

create table if not exists public.user_notification_activity (
    user_id uuid primary key
        references auth.users(id)
        on delete cascade,

    last_active_at timestamptz,
    last_notification_at timestamptz,
    last_push_at timestamptz,

    push_count_today integer not null default 0,

    push_count_reset_at timestamptz,

    updated_at timestamptz not null default now()
);


-- ============================================================
-- 9. RLS
-- ============================================================

alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_events enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_reads enable row level security;
alter table public.notification_dedup enable row level security;
alter table public.notification_campaigns enable row level security;
alter table public.user_notification_activity enable row level security;


-- ============================================================
-- 10. USER POLICIES
-- ============================================================

drop policy if exists
    "Users can view own notification preferences"
on public.notification_preferences;

create policy
    "Users can view own notification preferences"
on public.notification_preferences
for select
to authenticated
using (auth.uid() = user_id);


drop policy if exists
    "Users can update own notification preferences"
on public.notification_preferences;

create policy
    "Users can update own notification preferences"
on public.notification_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


drop policy if exists
    "Users can insert own notification preferences"
on public.notification_preferences;

create policy
    "Users can insert own notification preferences"
on public.notification_preferences
for insert
to authenticated
with check (auth.uid() = user_id);


-- ============================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================

drop policy if exists
    "Users can view own push subscriptions"
on public.push_subscriptions;

create policy
    "Users can view own push subscriptions"
on public.push_subscriptions
for select
to authenticated
using (auth.uid() = user_id);


drop policy if exists
    "Users can create own push subscriptions"
on public.push_subscriptions;

create policy
    "Users can create own push subscriptions"
on public.push_subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);


drop policy if exists
    "Users can update own push subscriptions"
on public.push_subscriptions;

create policy
    "Users can update own push subscriptions"
on public.push_subscriptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


drop policy if exists
    "Users can delete own push subscriptions"
on public.push_subscriptions;

create policy
    "Users can delete own push subscriptions"
on public.push_subscriptions
for delete
to authenticated
using (auth.uid() = user_id);


-- ============================================================
-- NOTIFICATION EVENTS
-- ============================================================

drop policy if exists
    "Users can view own notification events"
on public.notification_events;

create policy
    "Users can view own notification events"
on public.notification_events
for select
to authenticated
using (auth.uid() = user_id);


-- ============================================================
-- NOTIFICATION DELIVERIES
-- ============================================================

drop policy if exists
    "Users can view own notification deliveries"
on public.notification_deliveries;

create policy
    "Users can view own notification deliveries"
on public.notification_deliveries
for select
to authenticated
using (auth.uid() = user_id);


-- ============================================================
-- READ STATE
-- ============================================================

drop policy if exists
    "Users can manage own notification reads"
on public.notification_reads;

create policy
    "Users can manage own notification reads"
on public.notification_reads
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- ============================================================
-- USER ACTIVITY
-- ============================================================

drop policy if exists
    "Users can view own notification activity"
on public.user_notification_activity;

create policy
    "Users can view own notification activity"
on public.user_notification_activity
for select
to authenticated
using (auth.uid() = user_id);


drop policy if exists
    "Users can update own notification activity"
on public.user_notification_activity;

create policy
    "Users can update own notification activity"
on public.user_notification_activity
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


drop policy if exists
    "Users can insert own notification activity"
on public.user_notification_activity;

create policy
    "Users can insert own notification activity"
on public.user_notification_activity
for insert
to authenticated
with check (auth.uid() = user_id);


-- ============================================================
-- 11. UPDATED_AT HELPER
-- ============================================================

create or replace function public.set_notification_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- ============================================================
-- 12. UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists
    trg_notification_preferences_updated_at
on public.notification_preferences;

create trigger
    trg_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_notification_updated_at();


drop trigger if exists
    trg_push_subscriptions_updated_at
on public.push_subscriptions;

create trigger
    trg_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_notification_updated_at();


drop trigger if exists
    trg_notification_campaigns_updated_at
on public.notification_campaigns;

create trigger
    trg_notification_campaigns_updated_at
before update on public.notification_campaigns
for each row
execute function public.set_notification_updated_at();


drop trigger if exists
    trg_user_notification_activity_updated_at
on public.user_notification_activity;

create trigger
    trg_user_notification_activity_updated_at
before update on public.user_notification_activity
for each row
execute function public.set_notification_updated_at();


-- ============================================================
-- 13. SAFE DEFAULT PREFERENCE CREATION
--
-- Creates preferences only for users that do not already have
-- a preference row.
--
-- Existing users are NOT modified or deleted.
-- ============================================================

insert into public.notification_preferences (user_id)
select id
from auth.users
where not exists (
    select 1
    from public.notification_preferences np
    where np.user_id = auth.users.id
)
on conflict (user_id) do nothing;


-- ============================================================
-- 14. VERIFY
-- ============================================================

select
    table_name
from information_schema.tables
where table_schema = 'public'
and table_name in (
    'notification_preferences',
    'push_subscriptions',
    'notification_events',
    'notification_deliveries',
    'notification_reads',
    'notification_dedup',
    'notification_campaigns',
    'user_notification_activity'
)
order by table_name;
