-- ================================================================
-- Migration: 20261005000006_notification_unified_view.sql
-- Description: Unified notification view that merges the legacy
--   public.notifications table with the new notification_events /
--   notification_reads schema into a single queryable source.
--
-- SAFETY CONTRACT:
--   - ADDITIVE ONLY — no data deleted, no tables dropped
--   - Existing `notifications` rows remain intact and visible
--   - New notification_events rows are also surfaced here
--   - v_user_notifications replaces direct table reads in the UI
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. v_user_notifications
--    Unified, read-optimised view for the NotificationsPage UI.
--    Combines legacy notifications + new notification_events.
--    Includes read state from notification_reads for new events.
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_user_notifications AS

  -- ── Legacy notifications (unchanged, backward compat) ──────────
  SELECT
    n.id,
    n.user_id,
    'legacy'::text                              AS source,
    n.category,
    COALESCE(n.priority, 'normal')             AS priority,
    n.title,
    n.body                                      AS message,
    n.action_url,
    n.is_read,
    n.created_at,
    n.expires_at,
    n.dismissed_at
  FROM public.notifications n

  UNION ALL

  -- ── New event-driven notifications ─────────────────────────────
  SELECT
    ne.id,
    ne.user_id,
    'event'::text                               AS source,
    ne.category,
    ne.priority,
    ne.title,
    ne.message,
    ne.action_url,
    -- Read = has a row in notification_reads for this user+event
    (EXISTS (
      SELECT 1 FROM public.notification_reads nr
      WHERE nr.event_id = ne.id AND nr.user_id = ne.user_id
    ))                                          AS is_read,
    ne.created_at,
    ne.expires_at,
    NULL::TIMESTAMPTZ                           AS dismissed_at
  FROM public.notification_events ne
  -- Only show if the user has an in_app delivery record
  WHERE EXISTS (
    SELECT 1 FROM public.notification_deliveries nd
    WHERE nd.event_id = ne.id
      AND nd.user_id  = ne.user_id
      AND nd.channel  = 'in_app'
      AND nd.status  != 'cancelled'
  );

-- Grant access to authenticated role
GRANT SELECT ON public.v_user_notifications TO authenticated;

-- ────────────────────────────────────────────────────────────────
-- 2. fn_dispatch_notification_event
--    Postgres function called by the notificationEngine to insert
--    a notification_event + in_app delivery record atomically.
--    Also checks notification_dedup to prevent duplicates.
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_dispatch_notification_event(
  p_user_id       UUID,
  p_event_type    TEXT,
  p_category      TEXT,
  p_title         TEXT,
  p_message       TEXT,
  p_priority      TEXT    DEFAULT 'normal',
  p_action_url    TEXT    DEFAULT NULL,
  p_entity_type   TEXT    DEFAULT NULL,
  p_entity_id     TEXT    DEFAULT NULL,
  p_dedup_key     TEXT    DEFAULT NULL,
  p_expires_at    TIMESTAMPTZ DEFAULT NULL,
  p_metadata      JSONB   DEFAULT '{}'::JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- 1. Deduplication check
  IF p_dedup_key IS NOT NULL THEN
    -- Bump occurrence count if already dispatched
    IF EXISTS (SELECT 1 FROM public.notification_dedup WHERE dedup_key = p_dedup_key) THEN
      UPDATE public.notification_dedup
        SET last_seen_at = NOW(),
            occurrence_count = occurrence_count + 1
        WHERE dedup_key = p_dedup_key;
      RETURN NULL; -- Already dispatched, skip
    END IF;
  END IF;

  -- 2. Insert notification event
  INSERT INTO public.notification_events (
    user_id, event_type, category,
    title, message, priority,
    action_url, entity_type, entity_id,
    expires_at, metadata
  ) VALUES (
    p_user_id, p_event_type, p_category,
    p_title, p_message, p_priority,
    p_action_url, p_entity_type, p_entity_id,
    p_expires_at, COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_event_id;

  -- 3. Create in_app delivery record
  INSERT INTO public.notification_deliveries (
    event_id, user_id, channel, status, sent_at, delivered_at
  ) VALUES (
    v_event_id, p_user_id, 'in_app', 'delivered', NOW(), NOW()
  );

  -- 4. Record dedup key
  IF p_dedup_key IS NOT NULL THEN
    INSERT INTO public.notification_dedup (
      dedup_key, user_id, event_type
    ) VALUES (
      p_dedup_key, p_user_id, p_event_type
    )
    ON CONFLICT (dedup_key) DO NOTHING;
  END IF;

  RETURN v_event_id;
END;
$$;

-- Grant execute to authenticated users (called via RPC from the frontend engine)
GRANT EXECUTE ON FUNCTION public.fn_dispatch_notification_event TO authenticated;

-- ────────────────────────────────────────────────────────────────
-- 3. fn_mark_notification_read
--    Marks either a legacy notification or a new notification event
--    as read, routing to the correct table based on source.
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_mark_notification_read(
  p_user_id   UUID,
  p_id        UUID,
  p_source    TEXT DEFAULT 'legacy'  -- 'legacy' | 'event'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_source = 'event' THEN
    INSERT INTO public.notification_reads (user_id, event_id)
    VALUES (p_user_id, p_id)
    ON CONFLICT (user_id, event_id) DO NOTHING;
    -- Update delivery status to 'opened'
    UPDATE public.notification_deliveries
      SET status = 'opened', opened_at = NOW()
      WHERE event_id = p_id AND user_id = p_user_id AND channel = 'in_app';
  ELSE
    UPDATE public.notifications
      SET is_read = TRUE
      WHERE id = p_id AND user_id = p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_mark_notification_read TO authenticated;

-- ────────────────────────────────────────────────────────────────
-- 4. fn_mark_all_notifications_read
--    Marks ALL in-app notifications as read for a user.
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_mark_all_notifications_read(
  p_user_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark legacy notifications as read
  UPDATE public.notifications
    SET is_read = TRUE
    WHERE user_id = p_user_id AND is_read = FALSE;

  -- Mark all event-driven in_app deliveries as opened
  INSERT INTO public.notification_reads (user_id, event_id)
  SELECT p_user_id, ne.id
  FROM public.notification_events ne
  WHERE ne.user_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.notification_reads nr
      WHERE nr.user_id = p_user_id AND nr.event_id = ne.id
    )
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_mark_all_notifications_read TO authenticated;

-- ────────────────────────────────────────────────────────────────
-- 5. fn_delete_notification
--    Deletes either a legacy notification or cancels an event delivery.
-- ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_delete_notification(
  p_user_id UUID,
  p_id      UUID,
  p_source  TEXT DEFAULT 'legacy'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_source = 'event' THEN
    -- Cancel the in_app delivery (preserves event for audit trail)
    UPDATE public.notification_deliveries
      SET status = 'cancelled'
      WHERE event_id = p_id AND user_id = p_user_id AND channel = 'in_app';
  ELSE
    DELETE FROM public.notifications
      WHERE id = p_id AND user_id = p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_delete_notification TO authenticated;

-- ────────────────────────────────────────────────────────────────
-- 6. Reload PostgREST schema cache
-- ────────────────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';

COMMIT;
