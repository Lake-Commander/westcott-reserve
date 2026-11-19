ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ
    DEFAULT timezone('utc'::text, now());

UPDATE public.transactions
SET timestamp = COALESCE(created_at, timezone('utc'::text, now()))
WHERE timestamp IS NULL;
