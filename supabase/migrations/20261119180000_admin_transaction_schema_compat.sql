ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS routing_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Transfer',
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'normal';

UPDATE public.transactions
SET review_status = 'normal'
WHERE review_status IS NULL;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_review_status_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_review_status_check
  CHECK (review_status IN ('normal', 'flagged', 'paused'));
