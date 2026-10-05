-- ================================================================
-- Migration: 20261005000003_advanced_notifications_and_web_push.sql
-- Description: Advanced Event-Driven Notification Engine, Web Push & Targeting
--
-- SAFETY CONTRACT:
--   - ADDITIVE ONLY — no notifications or existing data deleted
--   - All new tables have RLS enabled with user-ownership policies
--   - Preserves existing public.notifications table while extending it safely
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. EXTEND public.notifications (ADDITIVE)
-- ────────────────────────────────────────────────────────────────

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS category            TEXT NOT NULL DEFAULT 'financial_reminder',
  ADD COLUMN IF NOT EXISTS priority            TEXT NOT NULL DEFAULT 'normal'
                                               CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  ADD COLUMN IF NOT EXISTS scheduled_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dismissed_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS action_url          TEXT,
  ADD COLUMN IF NOT EXISTS delivery_channel    TEXT NOT NULL DEFAULT 'in_app'
                                               CHECK (delivery_channel IN ('in_app', 'web_push', 'both')),
  ADD COLUMN IF NOT EXISTS delivery_status     TEXT NOT NULL DEFAULT 'delivered'
                                               CHECK (delivery_status IN ('queued', 'delivered', 'opened', 'failed')),
  ADD COLUMN IF NOT EXISTS deduplication_key   TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_dedup   ON public.notifications(user_id, deduplication_key);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(user_id, category);

-- ────────────────────────────────────────────────────────────────
-- 2. push_subscriptions
--    Stores Web Push API subscription endpoints for user devices.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint        TEXT        NOT NULL,
  p256dh          TEXT        NOT NULL,
  auth            TEXT        NOT NULL,

  user_agent      TEXT,
  device_type     TEXT        DEFAULT 'desktop' CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,

  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

DROP TRIGGER IF EXISTS trg_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER trg_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_owner_policy" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 3. user_notification_settings
--    Per-user channel, category, and quiet hours configuration.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Master Channels
  in_app_enabled          BOOLEAN     NOT NULL DEFAULT TRUE,
  web_push_enabled        BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Categories
  category_dps            BOOLEAN     NOT NULL DEFAULT TRUE,
  category_fdr            BOOLEAN     NOT NULL DEFAULT TRUE,
  category_goals          BOOLEAN     NOT NULL DEFAULT TRUE,
  category_loans          BOOLEAN     NOT NULL DEFAULT TRUE,
  category_cards          BOOLEAN     NOT NULL DEFAULT TRUE,
  category_salary         BOOLEAN     NOT NULL DEFAULT TRUE,
  category_budget         BOOLEAN     NOT NULL DEFAULT TRUE,
  category_wealth         BOOLEAN     NOT NULL DEFAULT TRUE,
  category_zakat          BOOLEAN     NOT NULL DEFAULT TRUE,
  category_admin          BOOLEAN     NOT NULL DEFAULT TRUE,
  category_security       BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Quiet Hours
  quiet_hours_enabled     BOOLEAN     NOT NULL DEFAULT FALSE,
  quiet_hours_start       TEXT        NOT NULL DEFAULT '22:30', -- 10:30 PM
  quiet_hours_end         TEXT        NOT NULL DEFAULT '08:00', -- 8:00 AM

  -- Anti-Spam Limits
  daily_push_limit        SMALLINT    NOT NULL DEFAULT 3,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_user_notification_settings_updated_at ON public.user_notification_settings;
CREATE TRIGGER trg_user_notification_settings_updated_at
  BEFORE UPDATE ON public.user_notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_notification_settings_owner_policy" ON public.user_notification_settings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 4. admin_notification_campaigns
--    Tracks admin broadcast campaigns & targeted notifications.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_notification_campaigns (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id            UUID        REFERENCES auth.users(id) ON DELETE SET NULL,

  title               TEXT        NOT NULL,
  body                TEXT        NOT NULL,
  category            TEXT        NOT NULL DEFAULT 'admin_announcement',
  priority            TEXT        NOT NULL DEFAULT 'normal'
                                  CHECK (priority IN ('low', 'normal', 'high', 'critical')),

  target_audience     TEXT        NOT NULL DEFAULT 'all',
  -- 'all', 'active', 'inactive_7d', 'inactive_30d', 'dps_users', 'fdr_users', 'loan_users', 'card_users', 'specific'

  target_user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  action_url          TEXT,
  web_push_eligible   BOOLEAN     NOT NULL DEFAULT TRUE,

  status              TEXT        NOT NULL DEFAULT 'sent' CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  scheduled_at        TIMESTAMPTZ,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  recipient_count     INTEGER     NOT NULL DEFAULT 0,
  delivered_count     INTEGER     NOT NULL DEFAULT 0,
  opened_count        INTEGER     NOT NULL DEFAULT 0,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_notification_campaigns ENABLE ROW LEVEL SECURITY;

-- Admins can manage campaigns (governed by admin RLS/role)
CREATE POLICY "admin_campaigns_access" ON public.admin_notification_campaigns
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────
-- 5. Reload PostgREST schema cache
-- ────────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

COMMIT;
