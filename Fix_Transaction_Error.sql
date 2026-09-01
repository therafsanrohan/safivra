-- This drops the old version of the function to remove ambiguity
DROP FUNCTION IF EXISTS public.post_transaction(
  public.transaction_type,
  DATE,
  TEXT,
  NUMERIC,
  UUID,
  UUID,
  UUID,
  TEXT,
  TEXT,
  TIME WITHOUT TIME ZONE,
  NUMERIC,
  NUMERIC,
  NUMERIC,
  UUID,
  UUID
);
